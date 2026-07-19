/* ============================================================
   EUSKAL34 — sync.js
   Sincronización ONLINE MANUAL de gastos mediante Firebase (Firestore).
   La app sigue funcionando 100% offline; esto solo se activa
   cuando el usuario pulsa "Crear grupo / Unirme / Sincronizar".
   ============================================================ */

// ⚠️ IMPORTANTE: sustituye estos valores por los de TU proyecto de Firebase.
// Los encuentras en: Firebase console > Configuración del proyecto >
// tus apps > app Web (</>) > "Configuración del SDK".
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

const Sync = (() => {
  const CLAVE_CODIGO = 'euskal34_grupo_code';
  let _db = null;
  let _uid = null;
  let _listoPromise = null;

  function inicializar() {
    if (typeof firebase === 'undefined') {
      console.warn('Firebase no está cargado; la sincronización online no estará disponible.');
      return;
    }
    try {
      firebase.initializeApp(firebaseConfig);
      _db = firebase.firestore();
      _listoPromise = firebase.auth().signInAnonymously()
        .then(cred => { _uid = cred.user.uid; })
        .catch(err => console.error('Error de autenticación anónima en Firebase:', err));
    } catch (e) {
      console.error('Error iniciando Firebase:', e);
    }
  }

  function _esperarListo() {
    if (!_listoPromise) return Promise.reject(new Error('La sincronización online no está disponible.'));
    return _listoPromise;
  }

  function tieneGrupo() {
    return !!localStorage.getItem(CLAVE_CODIGO);
  }

  function obtenerCodigo() {
    return localStorage.getItem(CLAVE_CODIGO);
  }

  function salirDeGrupo() {
    localStorage.removeItem(CLAVE_CODIGO);
  }

  function _generarCodigo() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  // Crea un grupo nuevo con los gastos actuales como punto de partida
  async function crearGrupo(expensesActuales) {
    await _esperarListo();
    const codigo = _generarCodigo();
    await _db.collection('grupos').doc(codigo).set({
      miembros: [_uid],
      expenses: expensesActuales
    });
    localStorage.setItem(CLAVE_CODIGO, codigo);
    return codigo;
  }

  // Se une a un grupo existente y devuelve sus gastos remotos para fusionar
  async function unirseGrupo(codigo) {
    await _esperarListo();
    const ref = _db.collection('grupos').doc(codigo);
    const doc = await ref.get();
    if (!doc.exists) throw new Error('Ese código de grupo no existe.');
    await ref.update({
      miembros: firebase.firestore.FieldValue.arrayUnion(_uid)
    });
    localStorage.setItem(CLAVE_CODIGO, codigo);
    return (doc.data().expenses) || { people: [], items: [] };
  }

  // Descarga los gastos del grupo, los fusiona con los locales (usando
  // Storage.fusionarGastos, que ya existía en la app) y sube el resultado.
  // datosLocales es el objeto de datos completo de la app (con .expenses).
  async function sincronizar(datosLocales) {
    await _esperarListo();
    const codigo = obtenerCodigo();
    if (!codigo) throw new Error('Todavía no perteneces a ningún grupo.');

    const ref = _db.collection('grupos').doc(codigo);
    const doc = await ref.get();
    if (!doc.exists) throw new Error('El grupo ya no existe.');

    const remoto = doc.data().expenses || { people: [], items: [] };
    const fusionado = Storage.fusionarGastos(datosLocales, { expenses: remoto });

    await ref.set({
      miembros: firebase.firestore.FieldValue.arrayUnion(_uid),
      expenses: fusionado.expenses
    }, { merge: true });

    return fusionado;
  }

  return {
    inicializar,
    tieneGrupo, obtenerCodigo, salirDeGrupo,
    crearGrupo, unirseGrupo, sincronizar
  };
})();
