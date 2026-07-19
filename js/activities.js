/* ============================================================
   EUSKAL34 — activities.js
   Programa de actividades de la Euskal Encounter 34
   ============================================================ */

const Activities = (() => {
  let _datos = null;

  // Información fija del evento (no son "actividades" con favorita/hecha, son datos de servicio)
  const INFO_ACREDITACION = [
    { dia: 'Miércoles', num: '22 julio', horas: '16:00 – 22:00' },
    { dia: 'Jueves',    num: '23 julio', horas: '10:00 – 22:00' },
    { dia: 'Viernes',   num: '24 julio', horas: '10:00 – 22:00' },
    { dia: 'Sábado',    num: '25 julio', horas: '10:00 – 22:00' },
    { dia: 'Domingo',   num: '26 julio', horas: '10:00 – 17:00' }
  ];

  const INFO_DUCHAS = [
    { grupo: 'Hombres (pabellón 5)', abiertas: '00:00-11:00, 12:00-14:00, 15:00-17:00, 18:00-21:00, 22:00-24:00', cerradas: '11:00-12:00, 14:00-15:00, 17:00-18:00, 21:00-22:00' },
    { grupo: 'Mujeres (pabellón 3)', abiertas: '00:00-10:00, 11:00-13:00, 14:00-16:00, 17:00-20:00, 21:00-24:00', cerradas: '10:00-11:00, 13:00-14:00, 16:00-17:00, 20:00-21:00' }
  ];

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
      btnSync.addEventListener('click', async () => {
        UI.confirmar('¿Actualizar el programa con la última versión incluida en la app? Tus actividades marcadas con estrella se conservarán.', async () => {
          UI.mostrarSnackbar('Actualizando programa…');
          try {
            const res = await fetch('./data/default.json');
            const fresco = await res.json();

            // Conservar favorita/hecha de las actividades que ya existían (por id)
            const estadoPrevio = {};
            _datos.activities.days.forEach(dia => {
              dia.actividades.forEach(act => {
                estadoPrevio[act.id] = { favorita: !!act.favorita, hecha: !!act.hecha, eliminada: !!act.eliminada };
              });
            });

            fresco.activities.days.forEach(dia => {
              dia.actividades.forEach(act => {
                const prev = estadoPrevio[act.id];
                if (prev) Object.assign(act, prev);
              });
            });

            _datos.activities = fresco.activities;
            Storage.guardar(_datos);
            renderizar();
            UI.mostrarSnackbar('Programa actualizado');
          } catch (e) {
            UI.mostrarSnackbar('No se ha podido actualizar el programa');
          }
        });
      });
    }

    renderizar();
  }

  function actualizar(datos) {
    _datos = datos;
    renderizar();
  }

  function renderizar() {
    _renderizarInfoFija();
    _renderizarPrograma();
    _renderizarInventario();
  }

  function _renderizarInfoFija() {
    const container = document.getElementById('activities-info');
    if (!container) return;

    container.innerHTML = `
      <div class="site-card" id="info-acreditacion">
        <div class="site-card__header" data-info-id="acreditacion">
          <div class="site-card__info">
            <p class="site-card__name">🪪 Acreditación</p>
            <p class="site-card__direccion">Entrada BEC — horario por día</p>
          </div>
          <svg class="site-card__chevron" viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
        </div>
        <div class="site-card__body">
          ${INFO_ACREDITACION.map(d => `
            <div class="eroski-day">
              <div class="eroski-day__date">
                <p class="eroski-day__weekday">${d.dia}</p>
                <p class="eroski-day__datenum">${d.num}</p>
              </div>
              <p class="eroski-day__hours">${d.horas}</p>
            </div>`).join('')}
        </div>
      </div>
      <div class="site-card open" id="info-duchas">
        <div class="site-card__header" data-info-id="duchas">
          <div class="site-card__info">
            <p class="site-card__name">🚿 Duchas</p>
            <p class="site-card__direccion">Válido todos los días del evento</p>
          </div>
          <svg class="site-card__chevron" viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
        </div>
        <div class="site-card__body">
          ${INFO_DUCHAS.map(g => `
            <p class="site-card__horario-texto" style="margin-bottom:0.75rem;">
              <strong>${g.grupo}</strong><br>
              <span style="color:#4caf50;">✅ Abiertas: ${g.abiertas}</span><br>
              <span style="color:#e57373;">❌ Cerradas: ${g.cerradas}</span>
            </p>`).join('')}
        </div>
      </div>`;

    container.querySelectorAll('.site-card__header').forEach(header => {
      header.addEventListener('click', () => {
        header.closest('.site-card').classList.toggle('open');
      });
    });
  }

  function _renderizarPrograma() {
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

  function _renderizarInventario() {
    const container = document.getElementById('activities-inventory-container');
    if (!container || !_datos) return;

    const dias = _datos.activities.days
      .map(dia => ({ ...dia, actividades: dia.actividades.filter(a => a.favorita && !a.eliminada) }))
      .filter(dia => dia.actividades.length > 0);

    if (dias.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-state__icon">⭐</span>
          <p class="empty-state__title">Sin actividades seleccionadas</p>
          <p class="empty-state__text">Marca actividades con la estrella en "Actividades" para verlas aquí.</p>
        </div>`;
      return;
    }

    container.innerHTML = dias.map(dia => `
      <div class="inventory-cat">
        <div class="inventory-cat__header">
          <span>📅</span>
          <span>${dia.nombre}</span>
          <span style="margin-left:auto;font-weight:400;color:var(--clr-on-surface-2)">${dia.actividades.length} actividad${dia.actividades.length !== 1 ? 'es' : ''}</span>
        </div>
        ${dia.actividades.map(act => `
          <div class="inventory-item">
            <strong>${act.hora}</strong> — ${_esc(act.titulo)}
            ${act.lugar ? `<br><span style="color:var(--clr-on-surface-2);font-size:0.8rem;">📍 ${_esc(act.lugar)}</span>` : ''}
          </div>
        `).join('')}
      </div>`).join('');
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
          <button class="act-btn-fav ${esFavorita}" data-id="${act.id}" title="Seleccionar para Mis Actividades">
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
