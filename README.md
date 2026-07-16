# EUSKAL34 Checklist

EUSKAL34 es una Progressive Web App (PWA) completa, funcional y offline-first diseñada para ayudar a los asistentes a preparar y gestionar su participación en la Euskal Encounter 34.

## Características Principales

- **Dashboard Premium:** Visión general con progreso circular, estadísticas y accesos directos.
- **Checklist Avanzada:** Categorías, prioridades, drag & drop, búsqueda y filtros.
- **Gastos Compartidos:** Módulo completo para gestionar gastos entre amigos con cálculo automático de balances.
- **Actividades:** Programa completo de la Euskal Encounter organizado por días.
- **Horario Eroski:** Horarios del supermercado del BEC con resaltado automático del día actual.
- **Inventario:** Vista rápida de todos los elementos marcados como preparados.
- **Cuenta Atrás:** Contador en tiempo real hasta el inicio del evento.
- **PWA Offline:** Funciona completamente sin conexión a internet.
- **Privacidad Total:** Todos los datos se almacenan localmente en tu dispositivo (`localStorage`).
- **Material Design 3:** Interfaz moderna, fluida y con soporte nativo para modo oscuro y claro.

## Estructura del Proyecto

```text
EUSKAL34/
├── index.html          # Estructura principal de la aplicación
├── style.css           # Estilos Material Design 3 (sin frameworks)
├── app.js              # Inicialización y lógica principal
├── manifest.json       # Configuración PWA
├── service-worker.js   # Gestión de caché y funcionamiento offline
├── README.md           # Documentación del proyecto
├── gen_icons.py        # Script Python para generar iconos
├── data/
│   └── default.json    # Datos iniciales (categorías, actividades, etc.)
├── icons/              # Iconos generados para la PWA
│   ├── icon-192.png
│   ├── icon-512.png
│   └── maskable-512.png
└── js/                 # Módulos JavaScript (ES6 puro)
    ├── storage.js      # Gestión de localStorage y datos
    ├── checklist.js    # Lógica de la checklist y drag & drop
    ├── ui.js           # Gestión de la interfaz, navegación y dialogs
    ├── eroski.js       # Lógica del horario del Eroski
    ├── countdown.js    # Lógica de la cuenta atrás y dashboard
    ├── expenses.js     # Lógica del módulo de gastos compartidos
    └── activities.js   # Lógica del programa de actividades
```

## Instalación y Uso

1. **Servidor Local:**
   Para probar la PWA correctamente (especialmente el Service Worker), necesitas servir los archivos a través de HTTP/HTTPS, no mediante `file://`.
   Puedes usar Python:
   ```bash
   python3 -m http.server 8000
   ```
   O cualquier otro servidor web (Node.js, Nginx, Apache, etc.).

2. **Acceso:**
   Abre tu navegador y ve a `http://localhost:8000`.

3. **Instalación como App:**
   - **En móvil (Android/iOS):** Toca "Añadir a la pantalla de inicio" en el menú del navegador.
   - **En escritorio (Chrome/Edge):** Haz clic en el icono de instalación en la barra de direcciones.

## Tecnologías Utilizadas

- HTML5 Semántico
- CSS3 Moderno (Variables, Flexbox, Grid, Animaciones)
- JavaScript ES6 (Módulos, Promesas, LocalStorage)
- Service Workers & Web App Manifest
- **Cero frameworks, cero dependencias, cero librerías externas.**

## Personalización

- **Datos iniciales:** Puedes modificar `data/default.json` para cambiar las categorías, elementos por defecto y el programa de actividades.
- **Estilos:** Todas las variables de color, tipografía y espaciado están definidas en la raíz de `style.css` (modo claro y oscuro).
- **Iconos:** Se incluyen SVG inline en el HTML para evitar peticiones externas y mejorar el rendimiento.

## Licencia

Este proyecto se distribuye "tal cual" para uso personal y comunitario en el entorno de la Euskal Encounter.
