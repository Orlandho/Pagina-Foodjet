/**
 * Estados del pedido y su traducción a la línea de tiempo que ve el cliente.
 *
 * Espejo ESM de backend/src/domain/orderStatus.js. Se duplica a conciencia:
 * el backend es CommonJS y el frontend se sirve como módulos ES sin bundler,
 * así que no hay forma limpia de compartir el archivo. Son pocas líneas y
 * ambas copias están cubiertas por pruebas.
 *
 * Todo lo de aquí son funciones puras, sin DOM: se pueden importar tal cual
 * desde Cucumber.
 */

export const ESTADOS = ['pendiente', 'confirmado', 'en_preparacion', 'en_camino', 'entregado', 'cancelado'];

export const TERMINALES = ['entregado', 'cancelado'];

/** Las cuatro etapas visibles en la línea de tiempo. */
export const ETAPAS = ['Confirmación', 'Preparación', 'En camino', 'Entregado'];

/**
 * Lleva un estado a su forma canónica.
 * La base arrastra valores heredados con mayúsculas, tildes y espacios
 * ('En preparación'); sin normalizar no encajan en ninguna comparación.
 */
export function normalizeEstado(valor) {
    if (valor === null || valor === undefined) return '';

    return String(valor)
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');
}

export function isTerminal(estado) {
    return TERMINALES.includes(normalizeEstado(estado));
}

/**
 * Cómo se pinta cada estado en la línea de tiempo.
 *
 * `activeIndex` es la etapa en curso y `completedCount` cuántas quedaron
 * atrás; un paso se dibuja completado cuando su índice es menor que
 * `completedCount`, y la línea que lo sigue se rellena con la misma regla.
 */
const VISTA_POR_ESTADO = {
    pendiente: {
        activeIndex: 0,
        completedCount: 0,
        title: 'Confirmando tu pedido',
        description: 'Estamos confirmando tu pedido con el restaurante.',
        iconClass: 'bi-hourglass-split',
        etaText: 'Tiempo estimado: 30 minutos'
    },
    confirmado: {
        activeIndex: 1,
        completedCount: 1,
        title: 'Pedido confirmado',
        description: 'El restaurante aceptó tu pedido y empezará a prepararlo.',
        iconClass: 'bi-check2-circle',
        etaText: 'Tiempo estimado: 30 minutos'
    },
    en_preparacion: {
        activeIndex: 1,
        completedCount: 1,
        title: 'Preparando tu pedido',
        description: 'Tu pedido está siendo preparado con mucho cuidado.',
        iconClass: 'bi-box-seam',
        etaText: 'Tiempo estimado: 20 minutos'
    },
    en_camino: {
        activeIndex: 2,
        completedCount: 2,
        title: 'Pedido en camino',
        description: 'El repartidor está cerca. Mantente atento.',
        iconClass: 'bi-bicycle',
        etaText: 'Llega en aprox. 10 minutos'
    },
    entregado: {
        activeIndex: 3,
        completedCount: 4,
        title: '¡Pedido entregado!',
        description: 'Esperamos que disfrutes tu comida.',
        iconClass: 'bi-check-circle',
        etaText: ''
    },
    cancelado: {
        activeIndex: -1,
        completedCount: 0,
        title: 'Pedido cancelado',
        description: 'Este pedido fue cancelado. Si tienes dudas, contáctanos.',
        iconClass: 'bi-x-circle',
        etaText: ''
    }
};

/**
 * Traduce un estado del backend a todo lo que la vista necesita pintar.
 * Ante un estado desconocido devuelve la vista de 'pendiente' en lugar de
 * dejar la línea de tiempo en blanco.
 */
export function getTrackingViewModel(estado) {
    const normalizado = normalizeEstado(estado);
    const base = VISTA_POR_ESTADO[normalizado] || VISTA_POR_ESTADO.pendiente;

    return {
        ...base,
        estado: normalizado || 'pendiente',
        terminal: isTerminal(normalizado),
        cancelled: normalizado === 'cancelado'
    };
}

/** ¿Se debe rellenar la línea que sigue al paso `indice`? */
export function isLineCompleted(viewModel, indice) {
    return viewModel.completedCount > indice;
}

/** Estilo del badge de estado en el historial de pedidos. */
const BADGE_POR_ESTADO = {
    pendiente: { color: 'bg-warning text-dark', icon: 'bi-hourglass-split', label: 'Pendiente' },
    confirmado: { color: 'bg-info text-dark', icon: 'bi-check2-circle', label: 'Confirmado' },
    en_preparacion: { color: 'bg-info text-dark', icon: 'bi-fire', label: 'En preparación' },
    en_camino: { color: 'bg-primary', icon: 'bi-bicycle', label: 'En camino' },
    entregado: { color: 'bg-success', icon: 'bi-check-circle', label: 'Entregado' },
    cancelado: { color: 'bg-danger', icon: 'bi-x-circle', label: 'Cancelado' }
};

export function getEstadoBadge(estado) {
    const normalizado = normalizeEstado(estado);
    return BADGE_POR_ESTADO[normalizado] || { color: 'bg-secondary', icon: 'bi-clock', label: 'Pendiente' };
}

/**
 * El modelo Order guarda total, impuestos y costo_envio, pero no el subtotal.
 * La interfaz lo leía como order.subtotal, un campo inexistente, y por eso
 * siempre mostraba S/ 0.00.
 */
export function deriveSubtotal(order) {
    const total = Number(order?.total) || 0;
    const impuestos = Number(order?.impuestos) || 0;
    const envio = Number(order?.costo_envio) || 0;

    return Math.max(0, total - impuestos - envio);
}
