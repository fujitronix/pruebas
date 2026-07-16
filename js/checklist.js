/* ============================================================
   EUSKAL34 — checklist.js
   Lógica de la checklist: categorías, elementos, drag & drop
   ============================================================ */

const Checklist = (() => {
  let _datos = null;
  let _filtro = 'all';
  let _orden  = 'manual';
  let _busqueda = '';
  let _catEditandoId = null;
  let _itemEditandoId = null;
  let _itemEditandoCatId = null;
  let _catParaItem = null;
  let _dragSrcCatId = null;
  let _dragSrcItemId = null;

  // ===== INICIALIZAR =====

  function inicializar(datos) {
    _datos = datos;
    _bindEventos();
    renderizar();
  }

  function actualizar(datos) {
    _datos = datos;
    renderizar();
  }

  // ===== RENDER PRINCIPAL =====

  function renderizar() {
    const container = document.getElementById('checklist-container');
    if (!container) return;

    const categorias = _filtrarCategorias();

    if (categorias.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-state__icon">📋</span>
          <p class="empty-state__title">Sin resultados</p>
          <p class="empty-state__text">No hay elementos que coincidan con los filtros actuales.</p>
        </div>`;
      return;
    }

    container.innerHTML = categorias.map(cat => _renderCategoria(cat)).join('');
    _bindDragDrop();
  }

  function _filtrarCategorias() {
    return _datos.categories.map(cat => {
      const itemsFiltrados = _filtrarItems(cat.items);
      return { ...cat, items: itemsFiltrados };
    }).filter(cat => {
      if (_busqueda) return cat.items.length > 0;
      return true;
    });
  }

  function _filtrarItems(items) {
    let resultado = [...items];

    // Filtro por estado
    if (_filtro === 'pending')   resultado = resultado.filter(i => !i.completado);
    if (_filtro === 'done')      resultado = resultado.filter(i => i.completado);
    if (_filtro === 'favorites') resultado = resultado.filter(i => i.favorito);

    // Filtro por búsqueda
    if (_busqueda) {
      const q = _busqueda.toLowerCase();
      resultado = resultado.filter(i =>
        i.texto.toLowerCase().includes(q) ||
        (i.notas && i.notas.toLowerCase().includes(q))
      );
    }

    // Ordenación
    if (_orden === 'priority') {
      const peso = { alta: 0, media: 1, baja: 2 };
      resultado.sort((a, b) => peso[a.prioridad] - peso[b.prioridad]);
    } else if (_orden === 'name') {
      resultado.sort((a, b) => a.texto.localeCompare(b.texto, 'es'));
    } else {
      resultado.sort((a, b) => a.orden - b.orden);
    }

    return resultado;
  }

  // ===== RENDER CATEGORÍA =====

  function _renderCategoria(cat) {
    const total = cat.items.length;
    const hechos = cat.items.filter(i => i.completado).length;
    const pct = total > 0 ? Math.round((hechos / total) * 100) : 0;

    return `
      <div class="category-card" id="cat-${cat.id}" data-cat-id="${cat.id}">
        <div class="category-header" data-cat-id="${cat.id}">
          <span class="category-drag-handle" draggable="true" data-drag-cat="${cat.id}" title="Arrastrar categoría">
            <svg viewBox="0 0 24 24"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
          </span>
          <span class="category-icon">${cat.icono || '📦'}</span>
          <span class="category-name">${_esc(cat.nombre)}</span>
          <span class="category-progress">${hechos}/${total} · ${pct}%</span>
          <div class="category-actions">
            <button class="icon-btn btn-edit-cat" data-cat-id="${cat.id}" title="Editar categoría">
              <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </button>
            <button class="icon-btn btn-delete-cat" data-cat-id="${cat.id}" title="Eliminar categoría">
              <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
          </div>
          <svg class="category-chevron" viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
        </div>
        <div class="category-items" id="items-${cat.id}">
          ${cat.items.map(item => _renderItem(item, cat.id)).join('')}
          <button class="btn-add-item" data-cat-id="${cat.id}">
            <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            Añadir elemento
          </button>
        </div>
      </div>`;
  }

  // ===== RENDER ITEM =====

  function _renderItem(item, catId) {
    const prioBadge = `<span class="prio-badge prio-${item.prioridad}">${item.prioridad}</span>`;
    const notaHtml  = item.notas ? `<span class="item-note">${_esc(item.notas)}</span>` : '';
    const favClass  = item.favorito ? 'active' : '';

    return `
      <div class="checklist-item ${item.completado ? 'done' : ''}"
           id="item-${item.id}"
           data-item-id="${item.id}"
           data-cat-id="${catId}"
           data-prio="${item.prioridad}"
           draggable="true">
        <span class="item-drag-handle" title="Arrastrar">
          <svg viewBox="0 0 24 24"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
        </span>
        <span class="item-checkbox ${item.completado ? 'checked' : ''}"
              data-item-id="${item.id}" data-cat-id="${catId}"></span>
        <div class="item-body">
          <span class="item-text">${_esc(item.texto)}</span>
          <div class="item-meta">
            ${prioBadge}
            ${notaHtml}
          </div>
        </div>
        <div class="item-actions">
          <button class="icon-btn btn-fav ${favClass}" data-item-id="${item.id}" data-cat-id="${catId}" title="Favorito">
            <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
          </button>
          <button class="icon-btn btn-edit-item" data-item-id="${item.id}" data-cat-id="${catId}" title="Editar">
            <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          </button>
          <button class="icon-btn btn-delete-item" data-item-id="${item.id}" data-cat-id="${catId}" title="Eliminar">
            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </div>
      </div>`;
  }

  // ===== BIND EVENTOS =====

  function _bindEventos() {
    const container = document.getElementById('checklist-container');

    // Delegación de eventos
    container.addEventListener('click', _handleClick);

    // FAB añadir categoría
    document.getElementById('fab-add-category').addEventListener('click', () => {
      _catEditandoId = null;
      UI.abrirDialogCategoria();
    });

    // Guardar categoría
    document.getElementById('btn-save-category').addEventListener('click', _guardarCategoria);
    document.getElementById('cat-nombre').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') _guardarCategoria();
    });

    // Guardar item
    document.getElementById('btn-save-item').addEventListener('click', _guardarItem);
    document.getElementById('item-texto').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') _guardarItem();
    });

    // Filtros
    document.querySelectorAll('#filter-chips .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#filter-chips .chip').forEach(c => c.classList.remove('chip--active'));
        chip.classList.add('chip--active');
        _filtro = chip.dataset.filter;
        renderizar();
      });
    });

    // Ordenación
    document.getElementById('sort-select').addEventListener('change', (e) => {
      _orden = e.target.value;
      renderizar();
    });

    // Búsqueda
    document.getElementById('search-input').addEventListener('input', (e) => {
      _busqueda = e.target.value.trim();
      renderizar();
    });
  }

  function _handleClick(e) {
    const target = e.target.closest('[data-cat-id]');
    if (!target) return;

    // Toggle collapse de categoría
    if (e.target.closest('.category-header') && !e.target.closest('.category-actions') && !e.target.closest('.category-drag-handle')) {
      const catCard = e.target.closest('.category-card');
      if (catCard) catCard.classList.toggle('collapsed');
      return;
    }

    // Checkbox item
    if (e.target.closest('.item-checkbox')) {
      const el = e.target.closest('.item-checkbox');
      _toggleCompletado(el.dataset.itemId, el.dataset.catId);
      return;
    }

    // Favorito
    if (e.target.closest('.btn-fav')) {
      const el = e.target.closest('.btn-fav');
      _toggleFavorito(el.dataset.itemId, el.dataset.catId);
      return;
    }

    // Editar categoría
    if (e.target.closest('.btn-edit-cat')) {
      const el = e.target.closest('.btn-edit-cat');
      _editarCategoria(el.dataset.catId);
      return;
    }

    // Eliminar categoría
    if (e.target.closest('.btn-delete-cat')) {
      const el = e.target.closest('.btn-delete-cat');
      _eliminarCategoria(el.dataset.catId);
      return;
    }

    // Añadir item
    if (e.target.closest('.btn-add-item')) {
      const el = e.target.closest('.btn-add-item');
      _catParaItem = el.dataset.catId;
      _itemEditandoId = null;
      _itemEditandoCatId = null;
      UI.abrirDialogItem();
      return;
    }

    // Editar item
    if (e.target.closest('.btn-edit-item')) {
      const el = e.target.closest('.btn-edit-item');
      _editarItem(el.dataset.itemId, el.dataset.catId);
      return;
    }

    // Eliminar item
    if (e.target.closest('.btn-delete-item')) {
      const el = e.target.closest('.btn-delete-item');
      _eliminarItem(el.dataset.itemId, el.dataset.catId);
      return;
    }
  }

  // ===== CRUD CATEGORÍAS =====

  function _editarCategoria(catId) {
    const cat = _datos.categories.find(c => c.id === catId);
    if (!cat) return;
    _catEditandoId = catId;
    UI.abrirDialogCategoria(cat);
  }

  function _guardarCategoria() {
    const datos = UI.getDatosCategoria();
    if (!datos.nombre) { UI.mostrarSnackbar('El nombre es obligatorio'); return; }

    if (_catEditandoId) {
      const cat = _datos.categories.find(c => c.id === _catEditandoId);
      if (cat) { cat.nombre = datos.nombre; cat.icono = datos.icono; }
      UI.mostrarSnackbar('Categoría actualizada');
    } else {
      _datos.categories.push({
        id:     Storage.generarId('cat'),
        nombre: datos.nombre,
        icono:  datos.icono,
        orden:  _datos.categories.length,
        items:  []
      });
      UI.mostrarSnackbar('Categoría creada');
    }

    _catEditandoId = null;
    UI.cerrarDialogCategoria();
    _guardarYRenderizar();
  }

  function _eliminarCategoria(catId) {
    const cat = _datos.categories.find(c => c.id === catId);
    if (!cat) return;
    UI.confirmar(`¿Eliminar la categoría "${cat.nombre}" y todos sus elementos?`, () => {
      _datos.categories = _datos.categories.filter(c => c.id !== catId);
      _guardarYRenderizar();
      UI.mostrarSnackbar('Categoría eliminada');
    });
  }

  // ===== CRUD ITEMS =====

  function _editarItem(itemId, catId) {
    const cat  = _datos.categories.find(c => c.id === catId);
    const item = cat && cat.items.find(i => i.id === itemId);
    if (!item) return;
    _itemEditandoId  = itemId;
    _itemEditandoCatId = catId;
    UI.abrirDialogItem(item);
  }

  function _guardarItem() {
    const datos = UI.getDatosItem();
    if (!datos.texto) { UI.mostrarSnackbar('La descripción es obligatoria'); return; }

    if (_itemEditandoId) {
      const cat  = _datos.categories.find(c => c.id === _itemEditandoCatId);
      const item = cat && cat.items.find(i => i.id === _itemEditandoId);
      if (item) {
        item.texto    = datos.texto;
        item.prioridad = datos.prioridad;
        item.notas    = datos.notas;
      }
      UI.mostrarSnackbar('Elemento actualizado');
    } else {
      const cat = _datos.categories.find(c => c.id === _catParaItem);
      if (cat) {
        cat.items.push({
          id:         Storage.generarId('item'),
          texto:      datos.texto,
          completado: false,
          favorito:   false,
          prioridad:  datos.prioridad,
          notas:      datos.notas,
          orden:      cat.items.length
        });
      }
      UI.mostrarSnackbar('Elemento añadido');
    }

    _itemEditandoId  = null;
    _itemEditandoCatId = null;
    _catParaItem     = null;
    UI.cerrarDialogItem();
    _guardarYRenderizar();
  }

  function _eliminarItem(itemId, catId) {
    const cat  = _datos.categories.find(c => c.id === catId);
    const item = cat && cat.items.find(i => i.id === itemId);
    if (!item) return;
    UI.confirmar(`¿Eliminar "${item.texto}"?`, () => {
      cat.items = cat.items.filter(i => i.id !== itemId);
      _guardarYRenderizar();
      UI.mostrarSnackbar('Elemento eliminado');
    });
  }

  function _toggleCompletado(itemId, catId) {
    const cat  = _datos.categories.find(c => c.id === catId);
    const item = cat && cat.items.find(i => i.id === itemId);
    if (!item) return;
    item.completado = !item.completado;
    _guardarYRenderizar();
    UI.mostrarSnackbar(item.completado ? '✅ Marcado como listo' : 'Desmarcado');
  }

  function _toggleFavorito(itemId, catId) {
    const cat  = _datos.categories.find(c => c.id === catId);
    const item = cat && cat.items.find(i => i.id === itemId);
    if (!item) return;
    item.favorito = !item.favorito;
    _guardarYRenderizar();
    UI.mostrarSnackbar(item.favorito ? '⭐ Añadido a favoritos' : 'Eliminado de favoritos');
  }

  // ===== DRAG & DROP =====

  function _bindDragDrop() {
    // Drag de categorías
    document.querySelectorAll('[data-drag-cat]').forEach(handle => {
      const catCard = handle.closest('.category-card');
      catCard.addEventListener('dragstart', _onCatDragStart);
      catCard.addEventListener('dragover',  _onCatDragOver);
      catCard.addEventListener('drop',      _onCatDrop);
      catCard.addEventListener('dragend',   _onDragEnd);
    });

    // Drag de items
    document.querySelectorAll('.checklist-item').forEach(el => {
      el.addEventListener('dragstart', _onItemDragStart);
      el.addEventListener('dragover',  _onItemDragOver);
      el.addEventListener('drop',      _onItemDrop);
      el.addEventListener('dragend',   _onDragEnd);
    });
  }

  function _onCatDragStart(e) {
    _dragSrcCatId = e.currentTarget.dataset.catId;
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('dragging');
  }

  function _onCatDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function _onCatDrop(e) {
    e.preventDefault();
    const targetCatId = e.currentTarget.dataset.catId;
    if (!_dragSrcCatId || _dragSrcCatId === targetCatId) return;

    const cats = _datos.categories;
    const srcIdx = cats.findIndex(c => c.id === _dragSrcCatId);
    const tgtIdx = cats.findIndex(c => c.id === targetCatId);
    if (srcIdx < 0 || tgtIdx < 0) return;

    const [moved] = cats.splice(srcIdx, 1);
    cats.splice(tgtIdx, 0, moved);
    cats.forEach((c, i) => c.orden = i);

    _guardarYRenderizar();
  }

  function _onItemDragStart(e) {
    _dragSrcItemId = e.currentTarget.dataset.itemId;
    _dragSrcCatId  = e.currentTarget.dataset.catId;
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('dragging');
  }

  function _onItemDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
  }

  function _onItemDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const targetItemId = e.currentTarget.dataset.itemId;
    const targetCatId  = e.currentTarget.dataset.catId;

    if (!_dragSrcItemId || _dragSrcItemId === targetItemId) return;

    // Mover dentro de la misma categoría
    if (_dragSrcCatId === targetCatId) {
      const cat = _datos.categories.find(c => c.id === targetCatId);
      if (!cat) return;
      const srcIdx = cat.items.findIndex(i => i.id === _dragSrcItemId);
      const tgtIdx = cat.items.findIndex(i => i.id === targetItemId);
      if (srcIdx < 0 || tgtIdx < 0) return;
      const [moved] = cat.items.splice(srcIdx, 1);
      cat.items.splice(tgtIdx, 0, moved);
      cat.items.forEach((i, idx) => i.orden = idx);
    }

    _guardarYRenderizar();
  }

  function _onDragEnd(e) {
    e.currentTarget.classList.remove('dragging', 'drag-over');
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    _dragSrcCatId  = null;
    _dragSrcItemId = null;
  }

  // ===== HELPERS =====

  function _guardarYRenderizar() {
    Storage.guardar(_datos);
    renderizar();
    // Notificar al dashboard
    if (typeof Dashboard !== 'undefined') Dashboard.actualizar(_datos);
  }

  function _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { inicializar, actualizar, renderizar };
})();
