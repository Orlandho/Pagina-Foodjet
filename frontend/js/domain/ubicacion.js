/**
 * Ubicación exacta de la dirección de entrega.
 *
 * Funciones puras, sin DOM ni red ni Google Maps: se importan tal cual desde
 * las pruebas. Las coordenadas son objetos {lat, lng} en grados, el mismo
 * formato que usa Google Maps.
 */

/** Plaza Mayor de Lima: donde abre el mapa si no sabemos nada del cliente. */
export const LIMA_CENTRO = Object.freeze({ lat: -12.0464, lng: -77.0428 });

/**
 * Lima Metropolitana y Callao. Se pasa al buscador de direcciones para que,
 * ante un nombre ambiguo ("Av. Arequipa"), prefiera la de Lima.
 */
export const LIMA_LIMITES = Object.freeze({ south: -12.52, west: -77.2, north: -11.57, east: -76.62 });

/**
 * Por debajo de esta distancia dos puntos son la misma puerta. Es del orden
 * del error del GPS de un móvil en ciudad.
 */
export const MISMA_UBICACION_M = 25;

const RADIO_TIERRA_M = 6371000;
const radianes = (g) => (g * Math.PI) / 180;

/** ¿Es un par de coordenadas usable? */
export function coordenadasValidas(lat, lng) {
    return Number.isFinite(lat) && Number.isFinite(lng)
        && lat >= -90 && lat <= 90
        && lng >= -180 && lng <= 180;
}

/** Distancia en metros entre dos puntos (haversine). */
export function distanciaMetros(a, b) {
    const dLat = radianes(b.lat - a.lat);
    const dLng = radianes(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2
        + Math.cos(radianes(a.lat)) * Math.cos(radianes(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * RADIO_TIERRA_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

const normalizar = (texto) => String(texto ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

/** Coordenadas de una dirección guardada en el formato {lat, lng}, o null. */
function coordenadasDe(guardada) {
    const lat = guardada?.latitud;
    const lng = guardada?.longitud;
    return coordenadasValidas(lat, lng) ? { lat, lng } : null;
}

/**
 * Busca entre las direcciones guardadas una que sea la misma que la indicada.
 *
 * Antes bastaba con que coincidiera el texto, y eso hacía que mover el pin no
 * sirviera de nada: se reutilizaba la dirección vieja con sus coordenadas
 * viejas. Ahora, si se marcó un punto, también tiene que coincidir el punto.
 * No se corrige la guardada sino que se crea otra, porque los pedidos
 * anteriores apuntan a ella y su historial debe seguir diciendo dónde se
 * entregaron.
 *
 * @param {Array} guardadas Direcciones del usuario, tal como las da la API.
 * @param {string} texto Dirección escrita.
 * @param {{lat:number,lng:number}|null} coords Punto marcado en el mapa, si lo hay.
 * @returns {Object|null} La dirección guardada equivalente, o null.
 */
export function buscarDireccionGuardada(guardadas, texto, coords) {
    const buscado = normalizar(texto);
    if (!buscado || !Array.isArray(guardadas)) return null;

    return guardadas.find((g) => {
        if (normalizar(g.direccion_detallada) !== buscado) return false;
        // Sin punto marcado (mapa no disponible) basta con el texto.
        if (!coords) return true;

        const suyas = coordenadasDe(g);
        return suyas !== null && distanciaMetros(suyas, coords) <= MISMA_UBICACION_M;
    }) ?? null;
}

/**
 * Dirección guardada con la que abrir el mapa: la predeterminada si está
 * ubicada, y si no la primera que lo esté.
 */
export function direccionInicial(guardadas) {
    if (!Array.isArray(guardadas)) return null;
    const ubicadas = guardadas.filter((g) => coordenadasDe(g));
    return ubicadas.find((g) => g.es_predeterminada) ?? ubicadas[0] ?? null;
}

/**
 * ¿Hay que pedir al cliente que marque el punto antes de confirmar?
 *
 * Solo cuando el mapa está disponible: sin él (sin key o con Google caído) el
 * pedido sigue saliendo con la dirección escrita, como antes del mapa.
 */
export function faltaMarcarUbicacion({ mapaDisponible, coords }) {
    return Boolean(mapaDisponible) && !(coords && coordenadasValidas(coords.lat, coords.lng));
}
