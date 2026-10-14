/**
 * Línea de tiempo y reparto del seguimiento de un pedido.
 *
 * Funciones puras, sin DOM ni red ni Google Maps: se importan tal cual desde
 * las pruebas. Las rutas son listas de [lat, lon], como las guarda el backend.
 */
import { normalizeEstado } from './orderStatus.js';

/** Las cuatro etapas que ve el cliente y el estado del backend que las abre. */
export const ETAPAS_SEGUIMIENTO = [
    { etiqueta: 'Confirmación', estado: 'confirmado' },
    { etiqueta: 'Preparación', estado: 'en_preparacion' },
    { etiqueta: 'En camino', estado: 'en_camino' },
    { etiqueta: 'Entregado', estado: 'entregado' }
];

const FLUJO = ['pendiente', 'confirmado', 'en_preparacion', 'en_camino', 'entregado'];

/** Etapa en curso y cuántas quedaron atrás, según el estado del pedido. */
const PROGRESO_POR_ESTADO = {
    pendiente: { activa: 0, hechas: 0 },
    confirmado: { activa: 1, hechas: 1 },
    en_preparacion: { activa: 1, hechas: 1 },
    en_camino: { activa: 2, hechas: 2 },
    entregado: { activa: -1, hechas: 4 },
    cancelado: { activa: -1, hechas: 0 }
};

const ms = (fecha) => (fecha ? new Date(fecha).getTime() : null);

/** Cuándo entró el pedido en cada estado, según su historial. */
function entradasReales(historial) {
    const entradas = {};
    for (const { estado, fecha } of historial || []) {
        const clave = normalizeEstado(estado);
        // Si un estado se repitiera, cuenta la primera vez.
        if (!(clave in entradas)) entradas[clave] = ms(fecha);
    }
    return entradas;
}

/**
 * Proyecta cuándo entrará el pedido en los estados que le faltan, encadenando
 * las duraciones del plan desde el estado actual. Se corta en el primer
 * estado sin duración conocida: a partir de ahí no hay estimación honesta.
 */
function entradasEstimadas(estadoActual, entradas, plan, ahoraMs, fechaPedido) {
    const estimadas = {};
    const indice = FLUJO.indexOf(estadoActual);
    if (indice === -1 || !plan) return estimadas;

    const inicioActual = entradas[estadoActual] ?? ms(fechaPedido);
    const duracionActual = plan[estadoActual];
    if (!inicioActual || !Number.isFinite(duracionActual)) return estimadas;

    // Si el estado ya debería haber terminado, lo próximo es "ya".
    let siguiente = Math.max(inicioActual + duracionActual * 1000, ahoraMs);

    for (let i = indice + 1; i < FLUJO.length; i++) {
        const estado = FLUJO[i];
        estimadas[estado] = siguiente;
        if (estado === 'entregado') break;

        const duracion = plan[estado];
        if (!Number.isFinite(duracion)) break;
        siguiente += duracion * 1000;
    }
    return estimadas;
}

/**
 * Lo que necesita la línea de tiempo del seguimiento.
 *
 * @param {Object} pedido Respuesta de GET /api/orders/:id
 * @param {number} ahoraMs Hora actual (en el reloj del servidor)
 * @returns {{etapas: Array, llegada: {hora:number, estimada:boolean}|null, cancelado: boolean}}
 *   Cada etapa trae `situacion` ('hecha', 'en_curso', 'pendiente' o
 *   'cancelada') y `hora` en milisegundos, real o estimada, o null.
 */
export function lineaDeTiempo(pedido, ahoraMs = Date.now()) {
    const estadoActual = normalizeEstado(pedido?.estado) || 'pendiente';
    const progreso = PROGRESO_POR_ESTADO[estadoActual] || PROGRESO_POR_ESTADO.pendiente;
    const cancelado = estadoActual === 'cancelado';

    const reales = entradasReales(pedido?.historial);
    const estimadas = cancelado ? {} : entradasEstimadas(estadoActual, reales, pedido?.plan_tiempos, ahoraMs, pedido?.fecha);

    const etapas = ETAPAS_SEGUIMIENTO.map((etapa, i) => {
        let situacion = 'pendiente';
        if (i < progreso.hechas) situacion = 'hecha';
        else if (i === progreso.activa) situacion = 'en_curso';
        else if (cancelado) situacion = 'cancelada';

        let hora = null;
        let estimada = false;
        if (reales[etapa.estado] !== undefined) {
            hora = reales[etapa.estado];
        } else if (estimadas[etapa.estado] !== undefined) {
            hora = estimadas[etapa.estado];
            estimada = true;
        }

        return { ...etapa, situacion, hora, estimada };
    });

    const entrega = etapas[etapas.length - 1];
    const llegada = entrega.hora !== null ? { hora: entrega.hora, estimada: entrega.estimada } : null;

    return { etapas, llegada, cancelado };
}

// ==========================================
// REPARTO SOBRE LA RUTA
// ==========================================

const RADIO_TIERRA_M = 6371000;
const rad = (g) => (g * Math.PI) / 180;

function distancia([lat1, lon1], [lat2, lon2]) {
    const h = Math.sin(rad(lat2 - lat1) / 2) ** 2
        + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
    return 2 * RADIO_TIERRA_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Longitud de una ruta en metros. */
export function longitudRuta(ruta) {
    let total = 0;
    for (let i = 1; i < (ruta?.length || 0); i++) total += distancia(ruta[i - 1], ruta[i]);
    return total;
}

/**
 * Fracción del trayecto recorrida (0 a 1) según el reloj.
 * Un pedido entregado está en 1 aunque el reloj diga otra cosa.
 */
export function avanceDelReparto({ inicioMs, duracionMs, ahoraMs, entregado = false }) {
    if (entregado) return 1;
    if (!inicioMs || !duracionMs || duracionMs <= 0) return 0;
    return Math.min(1, Math.max(0, (ahoraMs - inicioMs) / duracionMs));
}

/**
 * Parte la ruta por donde va el repartidor.
 * @returns {{recorrida: Array, pendiente: Array, posicion: [number, number], restanteMetros: number}}
 */
export function dividirRuta(ruta, fraccion) {
    if (!Array.isArray(ruta) || ruta.length === 0) {
        return { recorrida: [], pendiente: [], posicion: null, restanteMetros: 0 };
    }

    const total = longitudRuta(ruta);
    const objetivo = total * Math.min(1, Math.max(0, fraccion));
    let acumulado = 0;

    for (let i = 1; i < ruta.length; i++) {
        const tramo = distancia(ruta[i - 1], ruta[i]);
        if (acumulado + tramo >= objetivo) {
            const t = tramo === 0 ? 0 : (objetivo - acumulado) / tramo;
            const [la, lo] = ruta[i - 1];
            const [lb, lob] = ruta[i];
            const posicion = [la + (lb - la) * t, lo + (lob - lo) * t];

            return {
                recorrida: [...ruta.slice(0, i), posicion],
                pendiente: [posicion, ...ruta.slice(i)],
                posicion,
                restanteMetros: Math.max(0, total - objetivo)
            };
        }
        acumulado += tramo;
    }

    const fin = ruta[ruta.length - 1];
    return { recorrida: [...ruta], pendiente: [fin], posicion: fin, restanteMetros: 0 };
}

// ==========================================
// TEXTOS
// ==========================================

/** "850 m", "6,4 km" o "312 km". */
export function formatearDistancia(metros) {
    const m = Math.max(0, Number(metros) || 0);
    if (m < 1000) return `${Math.round(m / 10) * 10} m`;
    if (m < 100000) return `${(m / 1000).toFixed(1).replace('.', ',')} km`;
    return `${Math.round(m / 1000)} km`;
}

/** Cuánto falta para una hora, dicho para el cliente. */
export function formatearRestante(restanteMs) {
    const segundos = Math.round((Number(restanteMs) || 0) / 1000);
    if (segundos <= 30) return 'Llegando';

    const minutos = Math.ceil(segundos / 60);
    if (minutos < 60) return `${minutos} min`;

    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    return resto ? `${horas} h ${resto} min` : `${horas} h`;
}
