/**
 * Carga de Google Maps, compartida por el mapa del checkout y el del
 * seguimiento.
 *
 * Soporta cascada de claves en orden de prioridad:
 * 1. Clave primaria (compañero / GOOGLE_MAPS_API_KEY)
 * 2. Clave secundaria de respaldo (tuya / GOOGLE_MAPS_API_KEY_SECUNDARIA)
 * 3. Modo sin API key (degradación elegante).
 *
 * El script de Google se descarga una sola vez por visita y solo cuando algún
 * mapa lo necesita.
 */

import { fetchConfigAPI } from './api.js';

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

/** Notifica a los mapas que Google Maps rechazó las claves definitivamente. */
function notificarRechazoGlobal() {
    console.error('Google Maps rechazó la key: revisa restricciones, APIs activadas y facturación.');
    keyRechazada = true;
    alRechazar.forEach((fn) => fn());
}

// El guard permite importar este módulo desde Node (las pruebas), sin window.
if (typeof window !== 'undefined') {
    window.gm_authFailure = notificarRechazoGlobal;
}

/** Registra qué hacer si Google rechaza la key. */
export function siRechazaLaKey(fn) {
    alRechazar.add(fn);
}

/** ¿Ya rechazó Google la key en esta visita? Entonces no se reintenta. */
export function keyFueRechazada() {
    return keyRechazada;
}

/** Limpia scripts y objetos globales remanentes tras un fallo de carga. */
export function limpiarResiduosGoogleMaps() {
    if (typeof document !== 'undefined') {
        const scripts = document.querySelectorAll('script[data-foodjet-maps="true"], script[src*="maps.googleapis.com"]');
        scripts.forEach((s) => s.remove());
    }
    if (typeof window !== 'undefined') {
        delete window.__foodjetMapsListo;
        if (window.google) {
            try {
                delete window.google;
            } catch {
                window.google = undefined;
            }
        }
    }
}

/**
 * Intenta cargar Google Maps con una clave específica.
 * @param {string} key
 * @param {boolean} esUltima
 * @returns {Promise<void>}
 */
function intentarCargarKey(key, esUltima) {
    return new Promise((resolve, reject) => {
        let finalizado = false;
        let authFallo = false;

        const terminar = (fn) => {
            if (finalizado) return;
            finalizado = true;
            clearTimeout(temporizador);
            fn();
        };

        const temporizador = setTimeout(() => {
            terminar(() => reject(new Error('Google Maps no respondió a tiempo')));
        }, CARGA_TIMEOUT_MS);

        // Intercepta gm_authFailure para esta clave específica
        window.gm_authFailure = () => {
            authFallo = true;
            console.warn('[Google Maps] gm_authFailure detectado para la clave intentada.');
            if (esUltima) {
                notificarRechazoGlobal();
            }
            terminar(() => reject(new Error('Google Maps rechazó la key')));
        };

        window.__foodjetMapsListo = () => {
            if (authFallo) return;

            // Ventana para atrapar fallos inmediatos de autorización
            setTimeout(() => {
                if (authFallo || finalizado) return;

                if (!window.google?.maps) {
                    terminar(() => reject(new Error('Google Maps no inicializó google.maps')));
                    return;
                }

                window.gm_authFailure = notificarRechazoGlobal;
                terminar(() => resolve());
            }, 100);
        };

        const script = document.createElement('script');
        script.setAttribute('data-foodjet-maps', 'true');
        const params = new URLSearchParams({
            key,
            loading: 'async',
            callback: '__foodjetMapsListo',
            language: 'es',
            region: 'PE'
        });
        script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
        script.async = true;
        script.onerror = () => {
            terminar(() => reject(new Error('No se pudo descargar Google Maps')));
        };
        document.head.appendChild(script);
    });
}

/**
 * Descarga la API de Google Maps admitiendo una lista en cascada de claves.
 * Resuelve cuando la API está lista para ser consumida.
 *
 * @param {string|string[]|{apiKey?: string, apiKeys?: string[]}} [apiKeyOrKeys]
 * @returns {Promise<void>}
 */
export async function cargarGoogleMaps(apiKeyOrKeys) {
    if (typeof window === 'undefined') return Promise.resolve();
    if (window.google?.maps?.importLibrary) return Promise.resolve();
    if (keyRechazada) {
        return Promise.reject(new Error('Las claves de Google Maps ya fueron rechazadas'));
    }
    if (promesaCarga) return promesaCarga;

    promesaCarga = (async () => {
        let keys = [];

        if (Array.isArray(apiKeyOrKeys)) {
            keys = apiKeyOrKeys.filter((k) => typeof k === 'string' && k.trim());
        } else if (typeof apiKeyOrKeys === 'string' && apiKeyOrKeys.trim()) {
            keys = [apiKeyOrKeys.trim()];
        } else if (apiKeyOrKeys && typeof apiKeyOrKeys === 'object') {
            const raw = [
                ...(Array.isArray(apiKeyOrKeys.apiKeys) ? apiKeyOrKeys.apiKeys : []),
                ...(typeof apiKeyOrKeys.apiKey === 'string' ? [apiKeyOrKeys.apiKey] : [])
            ];
            keys = raw.filter((k) => typeof k === 'string' && k.trim());
        }

        // Si no se pasaron claves, intentar consultarlas a la API pública
        if (keys.length === 0) {
            try {
                const config = await fetchConfigAPI();
                const raw = [
                    ...(Array.isArray(config.googleMapsApiKeys) ? config.googleMapsApiKeys : []),
                    ...(typeof config.googleMapsApiKey === 'string' ? [config.googleMapsApiKey] : [])
                ];
                keys = raw.filter((k) => typeof k === 'string' && k.trim());
            } catch {
                // Silencioso; se evalúa a continuación
            }
        }

        // Eliminar posibles duplicados preservando el orden de prioridad
        keys = [...new Set(keys)];

        if (keys.length === 0) {
            throw new Error('No hay API key de Google Maps configurada');
        }

        let ultimoError = null;

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const esUltima = i === keys.length - 1;

            try {
                await intentarCargarKey(key, esUltima);
                return; // ¡Carga completada exitosamente!
            } catch (error) {
                ultimoError = error;
                console.warn(
                    `[Google Maps] Falló la clave ${i + 1}/${keys.length}. ` +
                    (esUltima ? 'No quedan más claves de respaldo.' : 'Intentando siguiente clave en cascada...')
                );
                limpiarResiduosGoogleMaps();
            }
        }

        // Si todas las claves fallaron y no se había marcado aún como rechazada:
        if (!keyRechazada) {
            notificarRechazoGlobal();
        }

        throw ultimoError || new Error('No se pudo cargar Google Maps con ninguna de las claves');
    })();

    // Un fallo de red no debe impedir reintentar en la próxima apertura si se resuelve el problema
    promesaCarga.catch(() => {
        promesaCarga = null;
    });

    return promesaCarga;
}

/** Reinicia el estado interno del cargador (útil para pruebas unitarias). */
export function _resetCargaParaPruebas() {
    promesaCarga = null;
    keyRechazada = false;
    alRechazar.clear();
    limpiarResiduosGoogleMaps();
}
