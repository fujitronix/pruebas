/* ============================================================
   EUSKAL34 — ui.js
   Gestión de la interfaz: navegación con historial, botón atrás,
   dialogs, snackbar, tema
   ============================================================ */

const UI = (() => {
  let _snackbarTimer = null;
  let _confirmCallback = null;
  let _historial = ['dashboard']; // Pila de navegación

  // ===== NAVEGACIÓN CON HISTORIAL =====

  function navegarA(nombreVista) {
    const actual = _historial[_historial.length - 1];
    if (actual !== nombreVista) {
      _historial.push(nombreVista);
    }

    _mostrarVista(nombreVista);
  }

  function volverAtras() {
    if (_historial.length > 1) {
      _historial.pop();
      const anterior = _historial[_historial.length - 1];
      _mostrarVista(anterior);
    }
  }

  function _mostrarVista(nombreVista) {
    // Ocultar todas las vistas
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));

    // Mostrar la vista seleccionada
    const vista = document.getElementById(`view-${nombreVista}`);
    if (vista) vista.classList.remove('hidden');

    // Actualizar título del AppBar
    const titulos = {
      dashboard:   'EUSKAL34',
      checklist:   'Checklist',
      inventory:   'Inventario',
      expenses:    'Gastos',
      activities:  'Actividades',
      eroski:      'Eroski BEC',
      settings:    'Ajustes'
    };

    // Si navegamos a dashboard, limpiamos el historial para que sea el punto de inicio real
    if (nombreVista === 'dashboard') {
      _historial = ['dashboard'];
    }
    document.getElementById('app-bar-title').textContent = titulos[nombreVista] || 'EUSKAL34';

    // Botón atrás: visible en todas las vistas excepto dashboard
    const btnBack = document.getElementById('btn-back');
    if (btnBack) {
      btnBack.style.display = nombreVista === 'dashboard' ? 'none' : 'flex';
    }

    // Botón búsqueda: solo visible en checklist
    const btnSearch = document.getElementById('btn-search-toggle');
    if (btnSearch) {
      btnSearch.style.display = nombreVista === 'checklist' ? 'flex' : 'none';
    }

    // Actualizar estado activo en bottom nav
    document.querySelectorAll('.bottom-nav__item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === nombreVista);
    });

    // Mostrar/ocultar FAB
    const fab = document.getElementById('fab-add-category');
    if (fab) fab.style.display = nombreVista === 'checklist' ? 'flex' : 'none';

    // Ocultar botón de ajustes del AppBar si estamos en la vista de ajustes
    const btnSettings = document.getElementById('btn-settings-appbar');
    if (btnSettings) {
      btnSettings.style.display = nombreVista === 'settings' ? 'none' : 'flex';
    }

    // Cerrar búsqueda si está abierta
    cerrarBusqueda();

    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ===== BÚSQUEDA =====

  function abrirBusqueda() {
    const bar = document.getElementById('search-bar');
    bar.classList.add('open');
    bar.setAttribute('aria-hidden', 'false');
    document.getElementById('search-input').focus();
  }

  function cerrarBusqueda() {
    const bar = document.getElementById('search-bar');
    bar.classList.remove('open');
    bar.setAttribute('aria-hidden', 'true');
    document.getElementById('search-input').value = '';
  }

  // ===== SNACKBAR =====

  function mostrarSnackbar(mensaje, duracion = 3000) {
    const sb = document.getElementById('snackbar');
    sb.textContent = mensaje;
    sb.classList.add('show');
    clearTimeout(_snackbarTimer);
    _snackbarTimer = setTimeout(() => sb.classList.remove('show'), duracion);
  }

  // ===== DIALOG: CATEGORÍA =====

  function abrirDialogCategoria(categoria = null) {
    const overlay = document.getElementById('dialog-category-overlay');
    const titulo  = document.getElementById('dialog-category-title');
    const nombre  = document.getElementById('cat-nombre');
    const icono   = document.getElementById('cat-icono');

    titulo.textContent = categoria ? 'Editar categoría' : 'Nueva categoría';
    nombre.value = categoria ? categoria.nombre : '';
    icono.value  = categoria ? categoria.icono  : '📦';

    overlay.classList.remove('hidden');
    nombre.focus();
  }

  function cerrarDialogCategoria() {
    document.getElementById('dialog-category-overlay').classList.add('hidden');
  }

  function getDatosCategoria() {
    return {
      nombre: document.getElementById('cat-nombre').value.trim(),
      icono:  document.getElementById('cat-icono').value.trim() || '📦'
    };
  }

  // ===== DIALOG: ELEMENTO =====

  function abrirDialogItem(item = null) {
    const overlay   = document.getElementById('dialog-item-overlay');
    const titulo    = document.getElementById('dialog-item-title');
    const texto     = document.getElementById('item-texto');
    const prioridad = document.getElementById('item-prioridad');
    const notas     = document.getElementById('item-notas');

    titulo.textContent = item ? 'Editar elemento' : 'Nuevo elemento';
    texto.value        = item ? item.texto     : '';
    prioridad.value    = item ? item.prioridad : 'media';
    notas.value        = item ? item.notas     : '';

    overlay.classList.remove('hidden');
    texto.focus();
  }

  function cerrarDialogItem() {
    document.getElementById('dialog-item-overlay').classList.add('hidden');
  }

  function getDatosItem() {
    return {
      texto:     document.getElementById('item-texto').value.trim(),
      prioridad: document.getElementById('item-prioridad').value,
      notas:     document.getElementById('item-notas').value.trim()
    };
  }

  // ===== DIALOG: CONFIRMACIÓN =====

  function confirmar(mensaje, callback) {
    document.getElementById('dialog-confirm-message').textContent = mensaje;
    document.getElementById('dialog-confirm-overlay').classList.remove('hidden');
    _confirmCallback = callback;
  }

  function _resolverConfirm(ok) {
    document.getElementById('dialog-confirm-overlay').classList.add('hidden');
    if (ok && _confirmCallback) _confirmCallback();
    _confirmCallback = null;
  }

  // ===== DIALOG: GASTO =====

  function abrirDialogGasto(personas, gasto = null) {
    const overlay = document.getElementById('dialog-expense-overlay');
    const titulo  = document.getElementById('dialog-expense-title');

    titulo.textContent = gasto ? 'Editar gasto' : 'Nuevo gasto';
    document.getElementById('exp-concepto').value  = gasto ? gasto.concepto  : '';
    document.getElementById('exp-importe').value   = gasto ? gasto.importe   : '';
    document.getElementById('exp-categoria').value = gasto ? gasto.categoria : 'otros';

    const selectPagador = document.getElementById('exp-pagador');
    selectPagador.innerHTML = personas.map(p =>
      `<option value="${p.id}" ${gasto && gasto.pagadorId === p.id ? 'selected' : ''}>${p.nombre}</option>`
    ).join('');

    const divParticipantes = document.getElementById('exp-participantes');
    divParticipantes.innerHTML = personas.map(p => {
      const checked = gasto && gasto.participantes && gasto.participantes.includes(p.id) ? 'checked' : 'checked';
      return `
        <label class="checkbox-label">
          <input type="checkbox" value="${p.id}" ${checked}>
          ${p.nombre}
        </label>`;
    }).join('');

    overlay.classList.remove('hidden');
    document.getElementById('exp-concepto').focus();
  }

  function cerrarDialogGasto() {
    document.getElementById('dialog-expense-overlay').classList.add('hidden');
  }

  function getDatosGasto() {
    const participantes = Array.from(
      document.querySelectorAll('#exp-participantes input:checked')
    ).map(cb => cb.value);

    return {
      concepto:     document.getElementById('exp-concepto').value.trim(),
      importe:      parseFloat(document.getElementById('exp-importe').value) || 0,
      categoria:    document.getElementById('exp-categoria').value,
      pagadorId:    document.getElementById('exp-pagador').value,
      participantes
    };
  }

  // ===== DIALOG: PERSONA =====

  function abrirDialogPersona(persona = null) {
    const overlay = document.getElementById('dialog-person-overlay');
    const titulo  = document.getElementById('dialog-person-title');
    const nombre  = document.getElementById('person-nombre');

    titulo.textContent = persona ? 'Editar persona' : 'Nueva persona';
    nombre.value = persona ? persona.nombre : '';

    overlay.classList.remove('hidden');
    nombre.focus();
  }

  function cerrarDialogPersona() {
    document.getElementById('dialog-person-overlay').classList.add('hidden');
  }

  function getDatosPersona() {
    return { nombre: document.getElementById('person-nombre').value.trim() };
  }

  // ===== TEMA =====

  function aplicarTema(oscuro) {
    document.documentElement.setAttribute('data-theme', oscuro ? 'dark' : 'light');
    const toggle = document.getElementById('toggle-dark-mode');
    if (toggle) toggle.checked = oscuro;
    localStorage.setItem('euskal34_tema', oscuro ? 'dark' : 'light');
  }

  function cargarTema() {
    const guardado = localStorage.getItem('euskal34_tema');
    const oscuro = guardado ? guardado === 'dark' : true;
    aplicarTema(oscuro);
    return oscuro;
  }

  // ===== INICIALIZAR EVENTOS =====

  function inicializar() {
    // Navegación: bottom nav
    document.querySelectorAll('.bottom-nav__item[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        // Desde el bottom nav siempre reseteamos el historial a dashboard → vista
        _historial = ['dashboard'];
        navegarA(btn.dataset.view);
      });
    });

    // Navegación: accesos directos del dashboard
    document.querySelectorAll('.shortcut-card[data-view]').forEach(btn => {
      btn.addEventListener('click', () => navegarA(btn.dataset.view));
    });

    // Botón atrás
    document.getElementById('btn-back').addEventListener('click', volverAtras);

    // Botón ajustes en AppBar
    document.getElementById('btn-settings-appbar').addEventListener('click', () => navegarA('settings'));

    // Búsqueda
    document.getElementById('btn-search-toggle').addEventListener('click', abrirBusqueda);
    document.getElementById('btn-search-close').addEventListener('click', cerrarBusqueda);

    // Tema
    document.getElementById('btn-toggle-theme').addEventListener('click', () => {
      const actual = document.documentElement.getAttribute('data-theme') === 'dark';
      aplicarTema(!actual);
    });

    document.getElementById('toggle-dark-mode').addEventListener('change', (e) => {
      aplicarTema(e.target.checked);
    });

    // Dialog categoría: cancelar
    document.getElementById('btn-cancel-category').addEventListener('click', cerrarDialogCategoria);

    // Dialog item: cancelar
    document.getElementById('btn-cancel-item').addEventListener('click', cerrarDialogItem);

    // Dialog confirmación
    document.getElementById('btn-confirm-cancel').addEventListener('click', () => _resolverConfirm(false));
    document.getElementById('btn-confirm-ok').addEventListener('click', () => _resolverConfirm(true));

    // Dialog gasto: cancelar
    document.getElementById('btn-cancel-expense').addEventListener('click', cerrarDialogGasto);

    // Dialog persona: cancelar
    document.getElementById('btn-cancel-person').addEventListener('click', cerrarDialogPersona);

    // Cerrar dialogs al hacer clic en el overlay
    document.querySelectorAll('.dialog-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.add('hidden');
          _confirmCallback = null;
        }
      });
    });

    // Tabs de gastos
    document.querySelectorAll('#expenses-tabs .tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('#expenses-tabs .tab').forEach(t => t.classList.remove('tab--active'));
        tab.classList.add('tab--active');
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
        document.getElementById(tab.dataset.tab).classList.remove('hidden');
      });
    });

    // Botón atrás del navegador / gesto de swipe back
    window.addEventListener('popstate', () => {
      if (_historial.length > 1) {
        _historial.pop();
        _mostrarVista(_historial[_historial.length - 1]);
      }
    });
  }

  return {
    navegarA,
    volverAtras,
    abrirBusqueda, cerrarBusqueda,
    mostrarSnackbar,
    abrirDialogCategoria, cerrarDialogCategoria, getDatosCategoria,
    abrirDialogItem, cerrarDialogItem, getDatosItem,
    confirmar,
    abrirDialogGasto, cerrarDialogGasto, getDatosGasto,
    abrirDialogPersona, cerrarDialogPersona, getDatosPersona,
    aplicarTema, cargarTema,
    inicializar
  };
})();
