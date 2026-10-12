/**
 * Mapa del seguimiento: el local, la dirección de entrega, la ruta por calles
 * y el repartidor recorriéndola.
 *
 * La simulación vive en el servidor: aquí solo se dibuja. Cada consulta trae
 * la ruta, cuándo salió el repartidor y cuánto dura el trayecto; entre una
 * consulta y otra el repartidor se mueve con el reloj del navegador, corregido
 * con la hora del servidor, para que avance suave y no a saltos de 4 segundos.
 *
 * Los marcadores son HTML propio sobre un OverlayView: los marcadores
 * avanzados de Google exigen un Map ID y los clásicos están en desuso.
 */
import { cargarGoogleMaps, estiloSegunTema, siRechazaLaKey, keyFueRechazada } from './googleMaps.js';
import { avanceDelReparto, dividirRuta, formatearDistancia } from './domain/seguimiento.js';

const PASO_ANIMACION_MS = 250;
const COLOR_MARCA = '#f39d4a';

const estado = {
    mapa: null,
    MarcadorHtml: null,
    marcadores: {},
    lineas: {},
    pedidoId: null,
    ruta: null,
    inicioMs: null,
    duracionMs: null,
    desfaseMs: 0,
    entregado: false,
    temporizador: null
};

const $ = (id) => document.getElementById(id);

function oscuro() {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

/** Muestra u oculta la columna del mapa y ajusta la rejilla. */
function mostrarColumna(visible) {
    const tarjeta = $('trackingMapCard');
    if (tarjeta) tarjeta.hidden = !visible;
    $('trackingLayout')?.classList.toggle('seguimiento--con-mapa', visible);
}

siRechazaLaKey(() => {
    detenerMapaSeguimiento();
    mostrarColumna(false);
});

/** Marcador HTML anclado a una coordenada. Se define tras cargar Google. */
function definirMarcador() {
    return class MarcadorHtml extends google.maps.OverlayView {
        constructor(posicion, { clase, icono, titulo }) {
            super();
            this.posicion = posicion;
            this.div = document.createElement('div');
            this.div.className = `marcador-seguimiento ${clase}`;
            this.div.innerHTML = `<i class="bi ${icono}" aria-hidden="true"></i>`;
            this.div.title = titulo;
        }

        onAdd() {
            this.getPanes().overlayMouseTarget.appendChild(this.div);
        }

        draw() {
            const proyeccion = this.getProjection();
            if (!proyeccion || !this.posicion) return;
            const punto = proyeccion.fromLatLngToDivPixel(new google.maps.LatLng(this.posicion[0], this.posicion[1]));
            this.div.style.left = `${punto.x}px`;
            this.div.style.top = `${punto.y}px`;
        }

        onRemove() {
            this.div.remove();
        }

        mover(posicion) {
            this.posicion = posicion;
            this.draw();
        }

        mostrar(visible) {
            this.div.hidden = !visible;
        }
    };
}

function aLatLng([lat, lon]) {
    return { lat, lng: lon };
}

function limpiarMapa() {
    Object.values(estado.marcadores).forEach((m) => m.setMap(null));
    Object.values(estado.lineas).forEach((l) => l.setMap(null));
    estado.marcadores = {};
    estado.lineas = {};
}

/** Crea los elementos de un pedido nuevo y encuadra las dos puntas. */
function prepararPedido(pedido, origen, destino) {
    limpiarMapa();
    const { MarcadorHtml } = estado;

    estado.marcadores.local = new MarcadorHtml(origen, {
        clase: 'marcador-seguimiento--local', icono: 'bi-shop', titulo: pedido.Restaurant?.nombre || 'Local'
    });
    estado.marcadores.casa = new MarcadorHtml(destino, {
        clase: 'marcador-seguimiento--casa', icono: 'bi-house-door-fill', titulo: 'Tu dirección'
    });
    estado.marcadores.repartidor = new MarcadorHtml(origen, {
        clase: 'marcador-seguimiento--repartidor', icono: 'bi-bicycle', titulo: 'Repartidor'
    });
    Object.values(estado.marcadores).forEach((m) => m.setMap(estado.mapa));
    estado.marcadores.repartidor.mostrar(false);

    const pendiente = oscuro() ? '#5c5c5c' : '#b9b9b9';
    estado.lineas.pendiente = new google.maps.Polyline({
        map: estado.mapa, strokeColor: pendiente, strokeOpacity: 1, strokeWeight: 5, zIndex: 1
    });
    estado.lineas.recorrida = new google.maps.Polyline({
        map: estado.mapa, strokeColor: COLOR_MARCA, strokeOpacity: 1, strokeWeight: 5, zIndex: 2
    });
    // Mientras no hay ruta por calles, una línea discontinua une las puntas.
    estado.lineas.provisional = new google.maps.Polyline({
        map: estado.mapa,
        path: [aLatLng(origen), aLatLng(destino)],
        strokeOpacity: 0,
        icons: [{
            icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeColor: pendiente, scale: 3 },
            offset: '0',
            repeat: '14px'
        }]
    });

    encuadrar([origen, destino]);
}

function encuadrar(puntos) {
    const limites = new google.maps.LatLngBounds();
    puntos.forEach((p) => limites.extend(aLatLng(p)));
    estado.mapa.fitBounds(limites, 56);
}

/** Recoloca al repartidor y parte la ruta según la hora actual. */
function pintarAvance() {
    const { ruta, lineas, marcadores } = estado;
    if (!Array.isArray(ruta) || ruta.length < 2) return;

    const salio = Boolean(estado.inicioMs);
    const avance = avanceDelReparto({
        inicioMs: estado.inicioMs,
        duracionMs: estado.duracionMs,
        ahoraMs: Date.now() + estado.desfaseMs,
        entregado: estado.entregado
    });
    const tramo = dividirRuta(ruta, avance);

    lineas.recorrida.setPath(salio ? tramo.recorrida.map(aLatLng) : []);
    lineas.pendiente.setPath((salio ? tramo.pendiente : ruta).map(aLatLng));

    marcadores.repartidor.mostrar(salio && !estado.entregado);
    if (salio) marcadores.repartidor.mover(tramo.posicion);

    const info = $('trackingRoute');
    if (info) {
        info.textContent = estado.entregado
            ? `Entregado. Recorrió ${formatearDistancia(estado.distancia)}.`
            : salio
                ? `Faltan ${formatearDistancia(tramo.restanteMetros)} de ${formatearDistancia(estado.distancia)}`
                : `${formatearDistancia(estado.distancia)} por calles desde ${estado.nombreLocal}`;
    }

    if (avance >= 1) detenerAnimacion();
}

function detenerAnimacion() {
    if (estado.temporizador !== null) {
        clearInterval(estado.temporizador);
        estado.temporizador = null;
    }
}

function animar() {
    detenerAnimacion();
    pintarAvance();
    if (estado.inicioMs && !estado.entregado) {
        estado.temporizador = setInterval(pintarAvance, PASO_ANIMACION_MS);
    }
}

/**
 * Dibuja o actualiza el reparto de un pedido. Se llama en cada consulta del
 * seguimiento.
 *
 * @param {Object} pedido Respuesta de GET /api/orders/:id
 * @param {string|null} apiKey Key de Google Maps
 * @returns {Promise<boolean>} Si el mapa quedó a la vista.
 */
export async function mostrarMapaSeguimiento(pedido, apiKey) {
    const local = pedido?.Restaurant;
    const casa = pedido?.DeliveryAddress;
    const ubicado = (p) => Number.isFinite(p?.latitud) && Number.isFinite(p?.longitud);

    if (!apiKey || keyFueRechazada() || !$('trackingMap') || !ubicado(local) || !ubicado(casa)) {
        detenerMapaSeguimiento();
        mostrarColumna(false);
        return false;
    }

    try {
        await cargarGoogleMaps(apiKey);
        if (!estado.mapa) {
            const { Map } = await google.maps.importLibrary('maps');
            estado.MarcadorHtml = definirMarcador();
            mostrarColumna(true);
            estado.mapa = new Map($('trackingMap'), {
                center: { lat: local.latitud, lng: local.longitud },
                zoom: 13,
                disableDefaultUI: true,
                zoomControl: true,
                gestureHandling: 'cooperative',
                clickableIcons: false,
                styles: estiloSegunTema({ sinDistracciones: true })
            });
        }
    } catch (error) {
        console.error('Mapa del seguimiento no disponible:', error);
        mostrarColumna(false);
        return false;
    }

    mostrarColumna(true);
    const origen = [local.latitud, local.longitud];
    const destino = [casa.latitud, casa.longitud];

    if (estado.pedidoId !== pedido.id) {
        estado.pedidoId = pedido.id;
        estado.ruta = null;
        prepararPedido(pedido, origen, destino);
    }

    // La ruta llega unos segundos después de crear el pedido: al aparecer,
    // sustituye a la línea provisional y se reencuadra con su forma real.
    if (Array.isArray(pedido.ruta) && pedido.ruta.length >= 2 && !estado.ruta) {
        estado.ruta = pedido.ruta;
        estado.lineas.provisional.setMap(null);
        encuadrar(pedido.ruta);
    }

    estado.nombreLocal = local.nombre || 'el local';
    estado.distancia = pedido.distancia_metros;
    estado.inicioMs = pedido.envio_iniciado_en ? new Date(pedido.envio_iniciado_en).getTime() : null;
    estado.duracionMs = (pedido.plan_tiempos?.en_camino || 0) * 1000;
    estado.entregado = pedido.estado === 'entregado';
    if (pedido.servidor_ahora) {
        estado.desfaseMs = new Date(pedido.servidor_ahora).getTime() - Date.now();
    }

    animar();
    return true;
}

/** Para la animación. El mapa se conserva para el próximo seguimiento. */
export function detenerMapaSeguimiento() {
    detenerAnimacion();
}
