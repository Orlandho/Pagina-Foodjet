/**
 * Carga de Google Maps, compartida por el mapa del checkout y el del
 * seguimiento.
 *
 * El script de Google se descarga una sola vez por visita y solo cuando algún
 * mapa lo necesita. La key llega del backend (GET /api/config).
 */

const CARGA_TIMEOUT_MS = 10000;

/** Estilo oscuro a juego con el modo oscuro del sitio. */
export const ESTILO_OSCURO = [
    { elementType: 'geometry', stylers: [{ color: '#1f1f1f' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#9a9a9a' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1f1f1f' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#c8c8c8' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#7a7a7a' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1e2a1e' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2e2e2e' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#191919' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#4a3b2a' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f5af69' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f1a26' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6a85' }] }
];

/**
 * Sin iconos de comercios, parques ni paraderos. En el checkout ayudan a
 * reconocer la calle; en el seguimiento compiten con los marcadores del
 * reparto. Las zonas verdes y los nombres de calles se mantienen.
 */
const SIN_DISTRACCIONES = [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] }
];

/** Estilo del mapa según el modo de color del sistema. */
export function estiloSegunTema({ sinDistracciones = false } = {}) {
    const oscuro = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const estilo = [...(oscuro ? ESTILO_OSCURO : []), ...(sinDistracciones ? SIN_DISTRACCIONES : [])];
    return estilo.length ? estilo : undefined;
}

let promesaCarga = null;
let keyRechazada = false;
const alRechazar = new Set();

// Google llama a esta función global cuando rechaza la key: dominio no
// autorizado, API sin activar o facturación desactivada. El mapa quedaría
// tapado por su aviso de error, así que cada mapa se retira.
// El guard permite importar este módulo desde Node (las pruebas), sin window.
if (typeof window !== 'undefined') {
    window.gm_authFailure = () => {
        console.error('Google Maps rechazó la key: revisa restricciones, APIs activadas y facturación.');
        keyRechazada = true;
        alRechazar.forEach((fn) => fn());
    };
}

/** Registra qué hacer si Google rechaza la key. */
export function siRechazaLaKey(fn) {
    alRechazar.add(fn);
}

/** ¿Ya rechazó Google la key en esta visita? Entonces no se reintenta. */
export function keyFueRechazada() {
    return keyRechazada;
}

/** Descarga la API de Google Maps. Resuelve cuando está lista para usar. */
export function cargarGoogleMaps(apiKey) {
    if (window.google?.maps?.importLibrary) return Promise.resolve();
    if (promesaCarga) return promesaCarga;

    promesaCarga = new Promise((resolve, reject) => {
        const temporizador = setTimeout(
            () => reject(new Error('Google Maps no respondió a tiempo')),
            CARGA_TIMEOUT_MS
        );

        window.__foodjetMapsListo = () => {
            clearTimeout(temporizador);
            resolve();
        };

        const script = document.createElement('script');
        const params = new URLSearchParams({
            key: apiKey,
            loading: 'async',
            callback: '__foodjetMapsListo',
            language: 'es',
            region: 'PE'
        });
        script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
        script.async = true;
        script.onerror = () => {
            clearTimeout(temporizador);
            reject(new Error('No se pudo descargar Google Maps'));
        };
        document.head.appendChild(script);
    });

    // Un fallo de red no debe impedir reintentar en la próxima apertura.
    promesaCarga.catch(() => { promesaCarga = null; });
    return promesaCarga;
}
