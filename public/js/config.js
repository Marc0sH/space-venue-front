/**
 * Configuración global de la aplicación Space & Venue.
 */
const APP_CONFIG = {
    apiBaseUrl:
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8080'
            : 'https://space-venue-api.onrender.com',

    /** Muestra etiquetas de endpoints y consola de depuración HTTP. */
    debugMode:
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1',

    map: {
        defaultCenter: [-34.6037, -58.3816],
        defaultZoom: 13,
        tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        tileAttribution: '&copy; OpenStreetMap contributors',
    },
};

/** @deprecated Usar APP_CONFIG.apiBaseUrl */
const API_BASE_URL = APP_CONFIG.apiBaseUrl;
