/* ============================================================
   EUSKAL34 — storage.js
   Gestión de localStorage y estructura de datos
   ============================================================ */

const Storage = (() => {
  const CLAVE = 'euskal34_data';

  // Estructura de datos vacía
  function _datosVacios() {
    return {
      version: '1.0',
      categories: [],
      expenses: { people: [], items: [] },
      activities: { days: [] }
    };
  }

  // Cargar datos desde localStorage
  function cargar() {
    try {
      const raw = localStorage.getItem(CLAVE);
      if (!raw) return null;
      const datos = JSON.parse(raw);
      // Asegurar compatibilidad con campos nuevos
      if (!datos.expenses) datos.expenses = { people: [], items: [] };
      if (!datos.activities) datos.activities = { days: [] };
      return datos;
    } catch {
      return null;
    }
  }

  // Guardar datos en localStorage
  function guardar(datos) {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(datos));
      return true;
    } catch {
      return false;
    }
  }

  // Cargar datos por defecto desde default.json
  async function cargarDefecto() {
    try {
      const res = await fetch('./data/default.json');
      const datos = await res.json();
      guardar(datos);
      return datos;
    } catch {
      const datos = _datosVacios();
      guardar(datos);
      return datos;
    }
  }

  // Obtener tamaño aproximado del almacenamiento
  function tamanio() {
    const raw = localStorage.getItem(CLAVE) || '';
    const bytes = new Blob([raw]).size;
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  // Exportar datos como JSON descargable
  function exportar(datos) {
    const json = JSON.stringify(datos, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `euskal34_backup_${_fechaHoy()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Importar datos desde un archivo JSON
  function importar(archivo) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const datos = JSON.parse(e.target.result);
          if (!datos.categories) throw new Error('Formato inválido');
          if (!datos.expenses) datos.expenses = { people: [], items: [] };
          if (!datos.activities) datos.activities = { days: [] };
          guardar(datos);
          resolve(datos);
        } catch {
          reject(new Error('El archivo no es un JSON válido de EUSKAL34'));
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsText(archivo);
    });
  }

  // Generar ID único
  function generarId(prefijo = 'id') {
    return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function _fechaHoy() {
    return new Date().toISOString().split('T')[0];
  }

  // Fusionar gastos de un objeto externo con los locales
  function fusionarGastos(datosLocales, datosImportados) {
    if (!datosImportados.expenses) return datosLocales;
    
    const localExp = datosLocales.expenses;
    const impExp = datosImportados.expenses;

    // 1. Fusionar Personas (basado en nombre)
    impExp.people.forEach(impP => {
      const existe = localExp.people.find(p => p.nombre.toLowerCase() === impP.nombre.toLowerCase());
      if (!existe) {
        localExp.people.push({ id: impP.id, nombre: impP.nombre });
      } else {
        // Mapear el ID antiguo al ID local para los gastos
        impP.idLocal = existe.id;
      }
    });

    // 2. Fusionar Gastos (por id estable; si no hay coincidencia de id, se
    //    compara por concepto+importe+pagador como respaldo para datos antiguos)
    impExp.items.forEach(impI => {
      // Ajustar pagadorId si la persona ya existía con otro ID
      const pagadorImp = impExp.people.find(p => p.id === impI.pagadorId);
      const pagadorIdLocal = pagadorImp && pagadorImp.idLocal ? pagadorImp.idLocal : impI.pagadorId;

      let coincidencia = localExp.items.find(localI => localI.id === impI.id);

      if (!coincidencia) {
        coincidencia = localExp.items.find(localI =>
          localI.concepto.toLowerCase() === impI.concepto.toLowerCase() &&
          Math.abs(localI.importe - impI.importe) < 0.01 &&
          localI.pagadorId === pagadorIdLocal
        );
      }

      if (coincidencia) {
        // Si cualquiera de las dos copias está marcada como eliminada,
        // el borrado gana (no se "resucita" un gasto ya eliminado).
        if (impI.eliminada) coincidencia.eliminada = true;
      } else {
        const nuevoGasto = { ...impI, pagadorId: pagadorIdLocal };
        // Ajustar participantes
        if (impI.participantes) {
          nuevoGasto.participantes = impI.participantes.map(pId => {
            const p = impExp.people.find(pers => pers.id === pId);
            return p && p.idLocal ? p.idLocal : pId;
          });
        }
        localExp.items.push(nuevoGasto);
      }
    });

    return datosLocales;
  }

  return { cargar, guardar, cargarDefecto, tamanio, exportar, importar, generarId, fusionarGastos };
})();
