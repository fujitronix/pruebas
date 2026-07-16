/* ============================================================
   EUSKAL34 — eroski.js
   Horario del Eroski del BEC para la Euskal Encounter 34
   ============================================================ */

const Eroski = (() => {
  // Horarios reales Eroski BEC (Basado en horarios habituales y eventos)
  const HORARIO = [
    { fecha: '2026-07-22', dia: 'Miércoles', num: '22 julio', horas: '09:30 – 21:30', nota: 'Apertura Euskal' },
    { fecha: '2026-07-23', dia: 'Jueves',    num: '23 julio', horas: '09:30 – 21:30', nota: '' },
    { fecha: '2026-07-24', dia: 'Viernes',   num: '24 julio', horas: '09:30 – 21:30', nota: '' },
    { fecha: '2026-07-25', dia: 'Sábado',    num: '25 julio', horas: '09:30 – 21:30', nota: '' },
    { fecha: '2026-07-26', dia: 'Domingo',   num: '26 julio', horas: 'Cerrado',       nota: 'Festivo' }
  ];

  function inicializar() {
    _renderizar();
  }

  function _renderizar() {
    const container = document.getElementById('eroski-schedule');
    if (!container) return;

    const hoy = _fechaHoy();

    container.innerHTML = HORARIO.map(d => {
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
  }

  function _fechaHoy() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  return { inicializar };
})();
