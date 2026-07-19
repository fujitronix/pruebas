/* ============================================================
   EUSKAL34 — app.js
   Punto de entrada principal. Inicializa todos los módulos.
   ============================================================ */

// ===== MÓDULO DASHBOARD =====
const Dashboard = (() => {
  let _datos = null;

  function inicializar(datos) {
    _datos = datos;
    renderizar();
  }

  function actualizar(datos) {
    _datos = datos;
    renderizar();
  }

  function renderizar() {
    if (!_datos) return;
    _renderCategorias();
  }

  function _renderCategorias() {
    const container = document.getElementById('dashboard-categories');
    if (!container) return;

    container.innerHTML = _datos.categories.map(cat => {
      const total  = cat.items.length;
      const hechos = cat.items.filter(i => i.completado).length;
      const pct    = total > 0 ? Math.round((hechos / total) * 100) : 0;
      return `
        <div class="dash-cat-card" data-view="checklist">
          <div class="dash-cat-header">
            <span class="dash-cat-icon">${cat.icono || '📦'}</span>
            <span class="dash-cat-name">${_esc(cat.nombre)}</span>
            <span class="dash-cat-count">${hechos}/${total}</span>
          </div>
          <div class="dash-cat-bar">
            <div class="dash-cat-bar__fill" style="width:${pct}%"></div>
          </div>
        </div>`;
    }).join('');

    // Navegar a checklist al hacer clic
    container.querySelectorAll('.dash-cat-card').forEach(card => {
      card.addEventListener('click', () => UI.navegarA('checklist'));
    });
  }

  function _inyectarGradienteSVG() {
    // Inyectar definición de gradiente SVG para el anillo de progreso
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'svg-defs');
    svg.innerHTML = `
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stop-color="#00b4d8"/>
          <stop offset="100%" stop-color="#00e5ff"/>
        </linearGradient>
      </defs>`;
    document.body.prepend(svg);
  }

  function _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  return { inicializar, actualizar, renderizar };
})();

// ===== MÓDULO INVENTARIO =====
const Inventory = (() => {
  let _datos = null;

  function inicializar(datos) {
    _datos = datos;
    renderizar();
  }

  function actualizar(datos) {
    _datos = datos;
    renderizar();
  }

  function renderizar() {
    const container = document.getElementById('inventory-container');
    if (!container || !_datos) return;

    const categorias = _datos.categories
      .map(cat => ({ ...cat, items: cat.items.filter(i => i.completado) }))
      .filter(cat => cat.items.length > 0);

    if (categorias.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-state__icon">🎒</span>
          <p class="empty-state__title">Inventario vacío</p>
          <p class="empty-state__text">Marca elementos como preparados en la checklist para verlos aquí.</p>
        </div>`;
      return;
    }

    container.innerHTML = categorias.map(cat => `
      <div class="inventory-cat">
        <div class="inventory-cat__header">
          <span>${cat.icono || '📦'}</span>
          <span>${_esc(cat.nombre)}</span>
          <span style="margin-left:auto;font-weight:400;color:var(--clr-on-surface-2)">${cat.items.length} elementos</span>
        </div>
        ${cat.items.map(item => `
          <div class="inventory-item">${_esc(item.texto)}</div>
        `).join('')}
      </div>`).join('');
  }

  function _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  return { inicializar, actualizar, renderizar };
})();

// ===== MÓDULO AJUSTES =====
const Settings = (() => {
  let _datos = null;

  function inicializar(datos) {
    _datos = datos;
    _bindEventos();
    _actualizarTamanio();
  }

  function _bindEventos() {
    document.getElementById('btn-export').addEventListener('click', () => {
      Storage.exportar(_datos);
      UI.mostrarSnackbar('Datos exportados correctamente');
    });

    document.getElementById('btn-import').addEventListener('click', () => {
      document.getElementById('import-file-input').click();
    });

    document.getElementById('import-file-input').addEventListener('change', async (e) => {
      const archivo = e.target.files[0];
      if (!archivo) return;
      try {
        const nuevosDatos = await Storage.importar(archivo);
        _datos = nuevosDatos;
        _notificarActualizacion(nuevosDatos);
        UI.mostrarSnackbar('Datos importados correctamente');
      } catch (err) {
        UI.mostrarSnackbar(`Error: ${err.message}`);
      }
      e.target.value = '';
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
      UI.confirmar('¿Restablecer todos los datos por defecto? Se perderán todos los cambios.', async () => {
        const datos = await Storage.cargarDefecto();
        _datos = datos;
        _notificarActualizacion(datos);
        UI.mostrarSnackbar('Datos restablecidos');
      });
    });
  }

  function _actualizarTamanio() {
    const el = document.getElementById('storage-size');
    if (el) el.textContent = Storage.tamanio();
  }

  function _notificarActualizacion(datos) {
    Dashboard.actualizar(datos);
    Checklist.actualizar(datos);
    Inventory.actualizar(datos);
    Expenses.actualizar(datos);
    Activities.actualizar(datos);
    _actualizarTamanio();
  }

  return { inicializar };
})();

// ===== INICIALIZACIÓN PRINCIPAL =====

async function inicializarApp() {
  // Cargar tema guardado
  UI.cargarTema();

  // Inicializar sincronización online (Firebase)
  Sync.inicializar();

  // Inicializar eventos de UI
  UI.inicializar();

  // Navegar al dashboard primero (muestra la UI de inmediato)
  UI.navegarA('dashboard');

  // Cargar datos
  let datos = Storage.cargar();
  if (!datos) {
    datos = await Storage.cargarDefecto();
  }

  // Inicializar módulos con los datos cargados
  Dashboard.inicializar(datos);
  Checklist.inicializar(datos);
  Inventory.inicializar(datos);
  Expenses.inicializar(datos);
  Activities.inicializar(datos);
  Settings.inicializar(datos);
  Countdown.inicializar();
  Sitios.inicializar();

  // Registrar Service Worker
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./service-worker.js');
    } catch {
      // Sin Service Worker funciona igualmente
    }
  }
}

// Arrancar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarApp);
