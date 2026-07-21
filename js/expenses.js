/* ============================================================
   EUSKAL34 — expenses.js
   Módulo de gastos compartidos con balance automático
   ============================================================ */

const Expenses = (() => {
  let _datos = null;
  let _gastoEditandoId = null;
  let _personaEditandoId = null;

  const ICONOS_CAT = {
    entrada:     '🎟',
    transporte:  '🚗',
    comida:      '🍕',
    bebidas:     '🥤',
    compras:     '🛒',
    material:    '🏕',
    alojamiento: '🏠',
    otros:       '📦'
  };

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

  // ===== RENDER =====

  function renderizar() {
    if (!_datos) return;
    _renderResumen();
    _renderGastos();
    _renderPersonas();
    _renderBalance();
  }

  function _renderResumen() {
    const items   = _datos.expenses.items.filter(i => !i.eliminada);
    const people  = _datos.expenses.people;
    const total   = items.reduce((s, i) => s + i.importe, 0);
    const num     = people.length;
    const media   = num > 0 ? total / num : 0;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('exp-total',        _fmt(total));
    set('exp-people-count', num);
    set('exp-avg',          _fmt(media));
  }

  function _renderGastos() {
    const container = document.getElementById('expenses-list');
    if (!container) return;

    const items = _datos.expenses.items.filter(i => !i.eliminada);
    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-state__icon">💸</span>
          <p class="empty-state__title">Sin gastos</p>
          <p class="empty-state__text">Añade el primer gasto para empezar a llevar la cuenta.</p>
        </div>`;
      return;
    }

    container.innerHTML = items.map(item => {
      const pagador = _datos.expenses.people.find(p => p.id === item.pagadorId);
      const numPart = item.participantes ? item.participantes.length : 0;
      return `
        <div class="expense-item">
          <div class="expense-item__icon">${ICONOS_CAT[item.categoria] || '📦'}</div>
          <div class="expense-item__body">
            <p class="expense-item__concepto">${_esc(item.concepto)}</p>
            <p class="expense-item__meta">
              Pagó: ${pagador ? _esc(pagador.nombre) : '?'} · ${numPart} participante${numPart !== 1 ? 's' : ''}
            </p>
          </div>
          <div>
            <p class="expense-item__amount">${_fmt(item.importe)}</p>
            <div class="expense-item__actions">
              <button class="icon-btn btn-edit-expense" data-expense-id="${item.id}" title="Editar">
                <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
              </button>
              <button class="icon-btn btn-delete-expense" data-expense-id="${item.id}" title="Eliminar">
                <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              </button>
            </div>
          </div>
        </div>`;
    }).join('');

    // Bind botones
    container.querySelectorAll('.btn-edit-expense').forEach(btn => {
      btn.addEventListener('click', () => _editarGasto(btn.dataset.expenseId));
    });
    container.querySelectorAll('.btn-delete-expense').forEach(btn => {
      btn.addEventListener('click', () => _eliminarGasto(btn.dataset.expenseId));
    });
  }

  function _renderPersonas() {
    const container = document.getElementById('people-list');
    if (!container) return;

    const people = _datos.expenses.people;
    if (people.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-state__icon">👥</span>
          <p class="empty-state__title">Sin personas</p>
          <p class="empty-state__text">Añade las personas que participan en los gastos.</p>
        </div>`;
      return;
    }

    container.innerHTML = people.map(p => `
      <div class="person-item">
        <div class="person-avatar">${p.nombre.charAt(0).toUpperCase()}</div>
        <span class="person-name">${_esc(p.nombre)}</span>
        <button class="icon-btn btn-delete-person" data-person-id="${p.id}" title="Eliminar">
          <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </button>
      </div>`).join('');

    container.querySelectorAll('.btn-delete-person').forEach(btn => {
      btn.addEventListener('click', () => _eliminarPersona(btn.dataset.personId));
    });
  }

  function _renderBalance() {
    const tableContainer = document.getElementById('balance-table');
    const settleContainer = document.getElementById('balance-settlements');
    if (!tableContainer || !settleContainer) return;

    const people = _datos.expenses.people;
    const items  = _datos.expenses.items.filter(i => !i.eliminada);

    if (people.length === 0 || items.length === 0) {
      tableContainer.innerHTML = `
        <div class="empty-state">
          <span class="empty-state__icon">⚖️</span>
          <p class="empty-state__title">Sin datos</p>
          <p class="empty-state__text">Añade personas y gastos para ver el balance.</p>
        </div>`;
      settleContainer.innerHTML = '';
      return;
    }

    // Calcular lo que pagó cada persona y lo que le corresponde
    const pagado     = {};
    const corresponde = {};
    people.forEach(p => { pagado[p.id] = 0; corresponde[p.id] = 0; });

    items.forEach(item => {
      if (pagado[item.pagadorId] !== undefined) {
        pagado[item.pagadorId] += item.importe;
      }
      const partes = item.participantes && item.participantes.length > 0
        ? item.participantes
        : people.map(p => p.id);
      const cuota = item.importe / partes.length;
      partes.forEach(pid => {
        if (corresponde[pid] !== undefined) corresponde[pid] += cuota;
      });
    });

    // Tabla de balance
    tableContainer.innerHTML = people.map(p => {
      const diff = pagado[p.id] - corresponde[p.id];
      const diffClass = diff >= 0 ? 'balance-row__diff--pos' : 'balance-row__diff--neg';
      const diffTxt   = diff >= 0 ? `+${_fmt(diff)}` : _fmt(diff);
      return `
        <div class="balance-row">
          <p class="balance-row__name">${_esc(p.nombre)}</p>
          <div class="balance-row__data">
            <div class="balance-row__item"><span>Pagado</span><strong>${_fmt(pagado[p.id])}</strong></div>
            <div class="balance-row__item"><span>Le corresponde</span><strong>${_fmt(corresponde[p.id])}</strong></div>
            <div class="balance-row__item"><span>Diferencia</span><strong class="${diffClass}">${diffTxt}</strong></div>
          </div>
        </div>`;
    }).join('');

    // Calcular liquidaciones
    const saldos = people.map(p => ({
      id:     p.id,
      nombre: p.nombre,
      saldo:  pagado[p.id] - corresponde[p.id]
    }));

    const liquidaciones = _calcularLiquidaciones(saldos);

    if (liquidaciones.length === 0) {
      settleContainer.innerHTML = `
        <div class="settlement-item" style="justify-content:center;">
          ✅ ¡Todo está saldado!
        </div>`;
    } else {
      settleContainer.innerHTML = liquidaciones.map(l =>
        `<div class="settlement-item">
          <strong>${_esc(l.deudor)}</strong>&nbsp;debe pagar&nbsp;<strong>${_fmt(l.cantidad)}</strong>&nbsp;a&nbsp;<strong>${_esc(l.acreedor)}</strong>
        </div>`
      ).join('');
    }
  }

  // Algoritmo greedy para minimizar el número de transferencias
  function _calcularLiquidaciones(saldos) {
    const deudores  = saldos.filter(s => s.saldo < -0.01).map(s => ({ ...s, saldo: -s.saldo }));
    const acreedores = saldos.filter(s => s.saldo > 0.01).map(s => ({ ...s }));
    const resultado = [];

    let i = 0, j = 0;
    while (i < deudores.length && j < acreedores.length) {
      const cantidad = Math.min(deudores[i].saldo, acreedores[j].saldo);
      resultado.push({ deudor: deudores[i].nombre, acreedor: acreedores[j].nombre, cantidad });
      deudores[i].saldo  -= cantidad;
      acreedores[j].saldo -= cantidad;
      if (deudores[i].saldo < 0.01)  i++;
      if (acreedores[j].saldo < 0.01) j++;
    }

    return resultado;
  }

  // ===== BIND EVENTOS =====

  function _bindEventos() {
    document.getElementById('btn-add-expense').addEventListener('click', () => {
      if (_datos.expenses.people.length === 0) {
        UI.mostrarSnackbar('Añade personas primero');
        return;
      }
      _gastoEditandoId = null;
      UI.abrirDialogGasto(_datos.expenses.people);
    });

    document.getElementById('btn-save-expense').addEventListener('click', _guardarGasto);

    document.getElementById('btn-add-person').addEventListener('click', () => {
      _personaEditandoId = null;
      UI.abrirDialogPersona();
    });

    document.getElementById('btn-save-person').addEventListener('click', _guardarPersona);

    // Sincronización online (Firebase) — grupo por código, manual (botón)
    _actualizarUISync();

    const btnSyncCrear = document.getElementById('btn-sync-crear');
    if (btnSyncCrear) {
      btnSyncCrear.addEventListener('click', async () => {
        btnSyncCrear.disabled = true;
        try {
          const codigo = await Sync.crearGrupo(_datos.expenses);
          UI.mostrarSnackbar(`Grupo creado. Código: ${codigo}`);
          _actualizarUISync();
        } catch (e) {
          UI.mostrarSnackbar('Error al crear el grupo: ' + e.message);
        } finally {
          btnSyncCrear.disabled = false;
        }
      });
    }

    const btnSyncUnirse = document.getElementById('btn-sync-unirse');
    if (btnSyncUnirse) {
      btnSyncUnirse.addEventListener('click', async () => {
        const input = document.getElementById('sync-code-input');
        const codigo = input.value.trim().toUpperCase();
        if (!codigo) { UI.mostrarSnackbar('Escribe el código del grupo'); return; }
        btnSyncUnirse.disabled = true;
        try {
          const expensesRemotos = await Sync.unirseGrupo(codigo);
          _datos = Storage.fusionarGastos(_datos, { expenses: expensesRemotos });
          _guardarYRenderizar();
          UI.mostrarSnackbar('Te has unido al grupo y se han fusionado los gastos');
          _actualizarUISync();
        } catch (e) {
          UI.mostrarSnackbar('Error al unirse: ' + e.message);
        } finally {
          btnSyncUnirse.disabled = false;
        }
      });
    }

    const btnSyncNow = document.getElementById('btn-sync-now');
    if (btnSyncNow) {
      btnSyncNow.addEventListener('click', async () => {
        btnSyncNow.disabled = true;
        UI.mostrarSnackbar('Sincronizando…');
        try {
          _datos = await Sync.sincronizar(_datos);
          _guardarYRenderizar();
          UI.mostrarSnackbar('Gastos sincronizados correctamente');
        } catch (e) {
          UI.mostrarSnackbar('Error al sincronizar: ' + e.message);
        } finally {
          btnSyncNow.disabled = false;
        }
      });
    }

    const btnSyncSalir = document.getElementById('btn-sync-salir');
    if (btnSyncSalir) {
      btnSyncSalir.addEventListener('click', () => {
        UI.confirmar('¿Salir del grupo? Dejarás de sincronizar, pero conservas los gastos que ya tienes.', () => {
          Sync.salirDeGrupo();
          _actualizarUISync();
          UI.mostrarSnackbar('Has salido del grupo');
        }, { textoBoton: 'Salir', peligroso: false });
      });
    }
  }

  function _actualizarUISync() {
    const setup = document.getElementById('sync-setup');
    const activo = document.getElementById('sync-activo');
    if (!setup || !activo) return;
    if (Sync.tieneGrupo()) {
      setup.classList.add('hidden');
      activo.classList.remove('hidden');
      const disp = document.getElementById('sync-code-display');
      if (disp) disp.textContent = Sync.obtenerCodigo();
    } else {
      setup.classList.remove('hidden');
      activo.classList.add('hidden');
    }
  }

  // ===== CRUD GASTOS =====

  function _editarGasto(gastoId) {
    const gasto = _datos.expenses.items.find(i => i.id === gastoId);
    if (!gasto) return;
    _gastoEditandoId = gastoId;
    UI.abrirDialogGasto(_datos.expenses.people, gasto);
  }

  function _guardarGasto() {
    const datos = UI.getDatosGasto();
    if (!datos.concepto)  { UI.mostrarSnackbar('El concepto es obligatorio'); return; }
    if (datos.importe <= 0) { UI.mostrarSnackbar('El importe debe ser mayor que 0'); return; }
    if (!datos.pagadorId)  { UI.mostrarSnackbar('Selecciona quién paga'); return; }
    if (datos.participantes.length === 0) { UI.mostrarSnackbar('Selecciona al menos un participante'); return; }

    if (_gastoEditandoId) {
      const gasto = _datos.expenses.items.find(i => i.id === _gastoEditandoId);
      if (gasto) Object.assign(gasto, datos);
      UI.mostrarSnackbar('Gasto actualizado');
    } else {
      _datos.expenses.items.push({ id: Storage.generarId('exp'), ...datos });
      UI.mostrarSnackbar('Gasto añadido');
    }

    _gastoEditandoId = null;
    UI.cerrarDialogGasto();
    _guardarYRenderizar();
  }

  function _eliminarGasto(gastoId) {
    UI.confirmar('¿Eliminar este gasto?', () => {
      const gasto = _datos.expenses.items.find(i => i.id === gastoId);
      if (gasto) gasto.eliminada = true;
      _guardarYRenderizar();
      UI.mostrarSnackbar('Gasto eliminado');
    });
  }

  // ===== CRUD PERSONAS =====

  function _guardarPersona() {
    const datos = UI.getDatosPersona();
    if (!datos.nombre) { UI.mostrarSnackbar('El nombre es obligatorio'); return; }

    _datos.expenses.people.push({ id: Storage.generarId('per'), nombre: datos.nombre });
    UI.mostrarSnackbar('Persona añadida');
    UI.cerrarDialogPersona();
    _guardarYRenderizar();
  }

  function _eliminarPersona(personaId) {
    const persona = _datos.expenses.people.find(p => p.id === personaId);
    if (!persona) return;
    UI.confirmar(`¿Eliminar a "${persona.nombre}"? Se eliminarán sus gastos asociados.`, () => {
      _datos.expenses.people  = _datos.expenses.people.filter(p => p.id !== personaId);
      _datos.expenses.items   = _datos.expenses.items.filter(i => i.pagadorId !== personaId);
      _guardarYRenderizar();
      UI.mostrarSnackbar('Persona eliminada');
    });
  }

  // ===== HELPERS =====

  function _guardarYRenderizar() {
    Storage.guardar(_datos);
    renderizar();
  }

  function _fmt(num) {
    return num.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });
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
