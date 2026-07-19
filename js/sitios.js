/* ============================================================
   EUSKAL34 — sitios.js
   Supermercados, tiendas y restaurantes cercanos al BEC
   ============================================================ */

const Sitios = (() => {
  // Horario real y detallado del Eroski del propio BEC (recinto del evento)
  const HORARIO_EROSKI_BEC = [
    { fecha: '2026-07-22', dia: 'Miércoles', num: '22 julio', horas: '09:30 – 21:30', nota: 'Apertura Euskal' },
    { fecha: '2026-07-23', dia: 'Jueves',    num: '23 julio', horas: '09:30 – 21:30', nota: '' },
    { fecha: '2026-07-24', dia: 'Viernes',   num: '24 julio', horas: '09:30 – 21:30', nota: '' },
    { fecha: '2026-07-25', dia: 'Sábado',    num: '25 julio', horas: '09:30 – 21:30', nota: '' },
    { fecha: '2026-07-26', dia: 'Domingo',   num: '26 julio', horas: 'Cerrado',       nota: 'Festivo' }
  ];

  const CATEGORIAS = [
    {
      id: 'supermercados',
      nombre: '🛒 Supermercados',
      sitios: [
        {
          id: 'eroski-bec',
          nombre: 'Eroski BEC',
          direccion: 'Dentro del recinto del BEC',
          lat: 43.285659, lng: -2.995633,
          tipo: 'detallado',
          horario: HORARIO_EROSKI_BEC
        },
        {
          id: 'mercadona-ribera',
          nombre: 'Mercadona (Av. la Ribera)',
          direccion: 'Av. de la Ribera, Barakaldo',
          lat: 43.2973653, lng: -3.0013354,
          tipo: 'simple',
          horarioTexto: 'Lunes a sábado: 09:00 – 21:30 · Domingo: cerrado'
        },
        {
          id: 'carrefour-barakaldo',
          nombre: 'Carrefour',
          direccion: 'Barakaldo',
          lat: 43.3008694, lng: -3.0027206,
          tipo: 'simple',
          horarioTexto: 'Horario no confirmado — comprobar antes de ir',
          nota: 'Hipermercado grande, útil para compra fuerte del grupo.'
        },
        {
          id: 'aldi-ribera',
          nombre: 'ALDI',
          direccion: 'Erribera Etorbidea, 1b (muy cerca del Eroski BEC)',
          lat: 43.286011, lng: -2.99676,
          tipo: 'simple',
          horarioTexto: 'Lunes a viernes: 09:30 – 21:30 · Sábado y domingo: cerrado'
        }
      ]
    },
    {
      id: 'tiendas',
      nombre: '🏪 Tiendas',
      sitios: [
        {
          id: 'decathlon-barakaldo',
          nombre: 'Decathlon Barakaldo',
          direccion: 'Erribera Etorbidea, 5A',
          lat: 43.290386, lng: -3.005385,
          tipo: 'simple',
          horarioTexto: 'Lunes a sábado: 10:00 – 22:00 · Domingo: cerrado'
        },
        {
          id: 'leroy-merlin-megapark',
          nombre: 'Leroy Merlin (Megapark)',
          direccion: 'C.C. Megapark, Av. de la Ribera s/n',
          lat: 43.2879215, lng: -3.0001449,
          tipo: 'simple',
          horarioTexto: 'Lunes a viernes: 09:00 – 22:00 · Sábado y domingo: cerrado'
        }
      ]
    },
    {
      id: 'restaurantes',
      nombre: '🍽️ Restaurantes',
      sitios: [
        {
          id: 'sikera',
          nombre: 'Síkera Jatetxea',
          direccion: 'Barakaldo',
          lat: 43.294445, lng: -2.98865,
          tipo: 'simple',
          horarioTexto: 'Horario no confirmado — comprobar antes de ir',
          nota: 'Muy bien valorado (4.5★).'
        },
        {
          id: 'maraxe',
          nombre: 'Restaurante Maraxe',
          direccion: 'Barakaldo',
          lat: 43.295625, lng: -2.9900667,
          tipo: 'simple',
          horarioTexto: 'Horario no confirmado — comprobar antes de ir',
          nota: 'Buena relación calidad-precio, abre hasta tarde.'
        },
        {
          id: 'retuerto',
          nombre: 'Restaurante Retuerto',
          direccion: 'Río Castaños Kalea, 43',
          lat: 43.2844536, lng: -2.9973179,
          tipo: 'simple',
          horarioTexto: 'Lun-jue y domingo: 08:30 – 22:00 · Viernes y sábado: 08:30 – 23:30',
          nota: 'Cocina tradicional de barrio, menú del día muy amplio (17 platos) y también bocatas, sandwiches y hamburguesas.'
        }
      ]
    }
  ];

  function inicializar() {
    _renderizar();
  }

  function _renderizar() {
    const container = document.getElementById('sitios-schedule');
    if (!container) return;

    const hoy = _fechaHoy();

    container.innerHTML = CATEGORIAS.map(cat => `
      <h3 class="section-title">${cat.nombre}</h3>
      ${cat.sitios.length === 0
        ? `<div class="empty-state" style="padding:1.5rem 0;">
             <p class="empty-state__text">Todavía no hay sitios en esta categoría.</p>
           </div>`
        : cat.sitios.map(sitio => _renderSitio(sitio, hoy)).join('')}
    `).join('');

    // Plegar/desplegar cada tarjeta
    container.querySelectorAll('.site-card__header').forEach(header => {
      header.addEventListener('click', () => {
        header.closest('.site-card').classList.toggle('open');
      });
    });
  }

  function _renderSitio(sitio, hoy) {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${sitio.lat},${sitio.lng}`;

    let cuerpo = '';
    if (sitio.tipo === 'detallado') {
      cuerpo = sitio.horario.map(d => {
        const esHoy = d.fecha === hoy;
        return `
          <div class="eroski-day ${esHoy ? 'today' : ''}">
            <div class="eroski-day__date">
              <p class="eroski-day__weekday">${d.dia}</p>
              <p class="eroski-day__datenum">${d.num}</p>
            </div>
            <p class="eroski-day__hours">${d.horas}</p>
            <div>
              ${esHoy ? '<span class="eroski-day__badge">Hoy</span>' : ''}
              ${d.nota ? `<p style="font-size:0.72rem;color:var(--clr-on-surface-2);margin-top:2px;">${d.nota}</p>` : ''}
            </div>
          </div>`;
      }).join('');
    } else {
      cuerpo = `<p class="site-card__horario-texto">${_esc(sitio.horarioTexto)}</p>`;
    }

    return `
      <div class="site-card" id="site-${sitio.id}">
        <div class="site-card__header" data-site-id="${sitio.id}">
          <div class="site-card__info">
            <p class="site-card__name">${_esc(sitio.nombre)}</p>
            <p class="site-card__direccion">${_esc(sitio.direccion)}</p>
          </div>
          <a class="icon-btn site-card__maps" href="${mapsUrl}" target="_blank" rel="noopener" title="Ver en Google Maps" onclick="event.stopPropagation()">
            <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>
          </a>
          <svg class="site-card__chevron" viewBox="0 0 24 24">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </div>
        <div class="site-card__body">
          ${cuerpo}
          ${sitio.nota ? `<p class="site-card__nota">${_esc(sitio.nota)}</p>` : ''}
        </div>
      </div>`;
  }

  function _fechaHoy() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { inicializar };
})();
