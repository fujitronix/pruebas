/* ============================================================
   EUSKAL34 — countdown.js
   Cuenta atrás hasta la Euskal Encounter 34
   ============================================================ */

const Countdown = (() => {
  // Fecha de inicio: 22 julio 2026 a las 10:00 (hora española, UTC+2)
  const FECHA_EVENTO = new Date('2026-07-22T10:00:00+02:00');
  let _intervalo = null;

  function inicializar() {
    _actualizar();
    _intervalo = setInterval(_actualizar, 1000);
  }

  function _actualizar() {
    const ahora = new Date();
    const diff  = FECHA_EVENTO - ahora;

    if (diff <= 0) {
      _mostrar(0, 0, 0, 0);
      clearInterval(_intervalo);
      const label = document.querySelector('.countdown-label');
      if (label) label.textContent = '¡El evento ha comenzado!';
      return;
    }

    const dias     = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas    = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diff % (1000 * 60)) / 1000);

    _mostrar(dias, horas, minutos, segundos);
  }

  function _mostrar(d, h, m, s) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(val).padStart(2, '0');
    };
    set('cd-days',    d);
    set('cd-hours',   h);
    set('cd-minutes', m);
    set('cd-seconds', s);
  }

  return { inicializar };
})();
