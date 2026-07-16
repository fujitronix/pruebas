/* ============================================================
   EUSKAL34 — activities.js
   Programa de actividades de la Euskal Encounter 34
   ============================================================ */

const Activities = (() => {
  let _datos = null;

  function inicializar(datos) {
    _datos = datos;
    
    // Bind eventos editor (Formulario amigable)
    const btnEdit = document.getElementById('btn-edit-activities');
    if (btnEdit) {
      btnEdit.addEventListener('click', () => {
        // Cargar días en el select
        const selectDia = document.getElementById('act-dia');
        selectDia.innerHTML = _datos.activities.days.map(d => `<option value="${d.id}">${d.nombre}</option>`).join('');
        
        // Limpiar campos
        document.getElementById('act-hora').value = '';
        document.getElementById('act-titulo').value = '';
        document.getElementById('act-descripcion').value = '';
        document.getElementById('act-ubicacion').value = '';
        
        document.getElementById('dialog-activity-editor').classList.remove('hidden');
      });
    }

    const btnCancel = document.getElementById('btn-cancel-activity-editor');
    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        document.getElementById('dialog-activity-editor').classList.add('hidden');
      });
    }

    const btnSave = document.getElementById('btn-save-activity-editor');
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        const diaId = document.getElementById('act-dia').value;
        const hora = document.getElementById('act-hora').value.trim();
        const titulo = document.getElementById('act-titulo').value.trim();
        const desc = document.getElementById('act-descripcion').value.trim();
        const lugar = document.getElementById('act-ubicacion').value.trim();

        if (!hora || !titulo) {
          alert('La hora y la actividad son obligatorias.');
          return;
        }

        const dia = _datos.activities.days.find(d => d.id === diaId);
        if (dia) {
          dia.actividades.push({
            id: 'act-' + Date.now(),
            hora,
            titulo,
            descripcion: desc,
            lugar
          });
          // Ordenar por hora
          dia.actividades.sort((a, b) => a.hora.localeCompare(b.hora));
          
          Storage.guardar(_datos);
          renderizar();
          document.getElementById('dialog-activity-editor').classList.add('hidden');
          UI.mostrarSnackbar('Actividad añadida correctamente');
        }
      });
    }

    const btnSync = document.getElementById('btn-sync-activities');
    if (btnSync) {
      btnSync.addEventListener('click', () => {
        UI.mostrarSnackbar('Sincronizando actividades...');
        // Simulación de fetch seguro a la web de origen
        // En una implementación real aquí iría el fetch a la API oficial
        setTimeout(() => {
          UI.mostrarSnackbar('Programa actualizado desde la web oficial');
          renderizar();
        }, 1500);
      });
    }

    renderizar();
  }

  function actualizar(datos) {
    _datos = datos;
    renderizar();
  }

  function renderizar() {
    const container = document.getElementById('activities-container');
    if (!container || !_datos) return;

    const dias = _datos.activities.days;
    if (!dias || dias.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-state__icon">🎮</span>
          <p class="empty-state__title">Sin actividades</p>
          <p class="empty-state__text">El programa de actividades se cargará próximamente.</p>
        </div>`;
      return;
    }

    const hoy = _fechaHoy();

    container.innerHTML = dias.map((dia, idx) => {
      const esHoy = dia.fecha === hoy;
      // Abrir el día actual por defecto
      const abierto = esHoy || idx === 0;
      return `
        <div class="activity-day ${abierto ? 'open' : ''}" id="day-${dia.id}">
          <div class="activity-day__header ${esHoy ? 'today' : ''}" data-day-id="${dia.id}">
            <div>
              <p class="activity-day__name">${dia.nombre}${esHoy ? ' 📍' : ''}</p>
              <p class="activity-day__date">${dia.actividades.length} actividades</p>
            </div>
            <svg class="activity-day__chevron" viewBox="0 0 24 24">
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
            </svg>
          </div>
          <div class="activity-day__list">
            ${dia.actividades.map(act => _renderActividad(act)).join('')}
          </div>
        </div>`;
    }).join('');

    // Bind toggle acordeón
    container.querySelectorAll('.activity-day__header').forEach(header => {
      header.addEventListener('click', () => {
        const dayEl = header.closest('.activity-day');
        dayEl.classList.toggle('open');
      });
    });

    // Bind acciones individuales
    container.querySelectorAll('.act-btn-fav').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        _toggleEstado(btn.dataset.id, 'favorita');
      });
    });

    container.querySelectorAll('.act-btn-done').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        _toggleEstado(btn.dataset.id, 'hecha');
      });
    });

    container.querySelectorAll('.act-btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('¿Eliminar esta actividad de tu lista?')) {
          _toggleEstado(btn.dataset.id, 'eliminada');
        }
      });
    });
  }

  function _toggleEstado(id, campo) {
    _datos.activities.days.forEach(dia => {
      const act = dia.actividades.find(a => a.id === id);
      if (act) {
        act[campo] = !act[campo];
        Storage.guardar(_datos);
        renderizar();
      }
    });
  }

  function _renderActividad(act) {
    if (act.eliminada) return '';
    const esFavorita = act.favorita ? 'active' : '';
    const esHecha = act.hecha ? 'active' : '';
    
    return `
      <div class="activity-item ${esHecha ? 'activity-item--done' : ''}">
        <span class="activity-item__time">${act.hora}</span>
        <div class="activity-item__body">
          <p class="activity-item__title">${_esc(act.titulo)}</p>
          ${act.descripcion ? `<p class="activity-item__desc">${_esc(act.descripcion)}</p>` : ''}
          ${act.lugar ? `<p class="activity-item__lugar">📍 ${_esc(act.lugar)}</p>` : ''}
        </div>
        <div class="activity-item__actions">
          <button class="act-btn-fav ${esFavorita}" data-id="${act.id}" title="Favorita">
            <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
          </button>
          <button class="act-btn-done ${esHecha}" data-id="${act.id}" title="Hecha">
            <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          </button>
          <button class="act-btn-delete" data-id="${act.id}" title="Eliminar">
            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </div>
      </div>`;
  }

  function _fechaHoy() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
