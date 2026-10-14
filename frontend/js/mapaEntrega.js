/**
 * Mapa del checkout para marcar el punto exacto de entrega.
 *
 * El pin está fijo en el centro y el cliente mueve el mapa debajo, como en las
 * apps de reparto: es más fácil de acertar con el dedo que arrastrar un
 * marcador, y no necesita los marcadores avanzados de Google, que exigen crear
 * un Map ID en Google Cloud.
 *
 * El punto se guarda con la dirección (latitud y longitud de DeliveryAddress)
 * y es el destino de la ruta del reparto.
 *
 * Si no hay key o Google la rechaza, el módulo se retira sin romper nada: el
 * checkout vuelve a ser el de antes, con la dirección escrita a mano.
 */
import { LIMA_CENTRO, LIMA_LIMITES, direccionInicial, distanciaMetros } from './domain/ubicacion.js';
import { cargarGoogleMaps, estiloSegunTema, siRechazaLaKey, keyFueRechazada } from './googleMaps.js';

const ZOOM_CIUDAD = 12;
const ZOOM_CALLE = 17;

const estado = {
    disponible: false,
    mapa: null,
    geocoder: null,
    // Desactivado si la key no tiene Geocoding API: el pin sigue sirviendo.
    geocoderActivo: true,
    // null hasta que el cliente confirma un punto: el centro de Lima con el
    // que abre el mapa no es la casa de nadie.
    coords: null,
    fuente: null,
    ultimoCentro: null,
    // A dónde está llevando el código el mapa. Ese movimiento no cuenta como
    // elección del cliente. Es un destino y no un simple «sí/no» porque, si el
    // mapa ya estaba ahí, Google no avisa de que terminó y un indicador se
    // quedaría puesto tragándose el siguiente arrastre del cliente.
    destinoCodigo: null,
    // Si el texto lo escribimos nosotros se puede reescribir al mover el
    // mapa; si lo escribió el cliente, no se toca.
    textoAutomatico: false,
    consultaInversa: 0,
    alFallar: null
};

const $ = (id) => document.getElementById(id);
const inputDireccion = () => $('customerAddress');

siRechazaLaKey(() => {
    retirarMapa('El mapa no está disponible ahora. Escribe tu dirección con el mayor detalle posible.');
    estado.alFallar?.();
});

// ==========================================
// INTERFAZ
// ==========================================

function mostrarEstado(texto, tipo = 'info') {
    const el = $('deliveryMapStatus');
    if (!el) return;
    el.textContent = texto;
    el.dataset.tipo = tipo;
}

function retirarMapa(mensaje) {
    estado.disponible = false;
    estado.mapa = null;
    estado.coords = null;
    estado.fuente = null;

    const envoltorio = $('deliveryMapWrapper');
    if (envoltorio) envoltorio.hidden = true;
    $('deliveryAddressSearch')?.setAttribute('hidden', '');
    if (mensaje) mostrarEstado(mensaje, 'aviso');
}

function centroActual() {
    const c = estado.mapa.getCenter();
    return { lat: c.lat(), lng: c.lng() };
}

/** Mueve el mapa desde el código, sin que cuente como elección del cliente. */
function moverMapa(coords, zoom = ZOOM_CALLE) {
    estado.destinoCodigo = coords;
    estado.mapa.setZoom(zoom);
    estado.mapa.panTo(coords);
}

/** Fija el punto de entrega y explica de dónde salió. */
function confirmarPunto(coords, fuente) {
    estado.coords = coords;
    estado.fuente = fuente;

    const textos = {
        guardada: 'Usamos tu dirección guardada. Mueve el mapa si el pin no está en tu puerta.',
        gps: 'Te ubicamos con el GPS. Mueve el mapa si el pin no está en tu puerta.',
        busqueda: 'Encontramos la dirección. Ajusta el mapa hasta que el pin quede en tu puerta.',
        mapa: 'Entregaremos donde está el pin.'
    };
    mostrarEstado(textos[fuente], 'ok');
}

// ==========================================
// GEOCODIFICACIÓN
// ==========================================

/** Traduce el error del Geocoder a algo que el cliente pueda resolver. */
function manejarErrorGeocoder(error) {
    const codigo = error?.code || '';

    if (codigo === 'REQUEST_DENIED') {
        // La key carga el mapa pero no tiene Geocoding API activada.
        estado.geocoderActivo = false;
        console.error('Geocoding API rechazada: actívala en la key de Google Cloud.');
        mostrarEstado('No podemos buscar direcciones ahora. Mueve el mapa hasta tu puerta.', 'aviso');
        return;
    }
    if (codigo === 'ZERO_RESULTS') {
        mostrarEstado('No encontramos esa dirección. Mueve el mapa hasta tu puerta.', 'aviso');
        return;
    }
    console.error('Error de geocodificación:', error);
    mostrarEstado('No pudimos buscar la dirección. Mueve el mapa hasta tu puerta.', 'aviso');
}

/** Escribe en el campo la dirección del punto, si el texto es nuestro. */
async function rellenarDireccion(coords) {
    const el = inputDireccion();
    if (!estado.geocoderActivo || !el) return;
    if (el.value.trim() && !estado.textoAutomatico) return;

    // Si el cliente mueve el mapa varias veces seguidas, solo vale la última.
    const consulta = ++estado.consultaInversa;
    try {
        const { results } = await estado.geocoder.geocode({ location: coords });
        if (consulta !== estado.consultaInversa || !results?.length) return;
        if (el.value.trim() && !estado.textoAutomatico) return;

        el.value = results[0].formatted_address;
        estado.textoAutomatico = true;
    } catch (error) {
        if (consulta === estado.consultaInversa && error?.code !== 'ZERO_RESULTS') {
            manejarErrorGeocoder(error);
        }
    }
}

/** Busca lo escrito en el campo y lleva el mapa hasta allí. */
async function buscarDireccion() {
    const el = inputDireccion();
    const texto = el?.value.trim();
    if (!estado.disponible || !texto) return;

    if (!estado.geocoderActivo) {
        mostrarEstado('No podemos buscar direcciones ahora. Mueve el mapa hasta tu puerta.', 'aviso');
        return;
    }

    mostrarEstado('Buscando la dirección…');
    try {
        const { results } = await estado.geocoder.geocode({
            address: texto,
            bounds: LIMA_LIMITES,
            componentRestrictions: { country: 'PE' }
        });
        if (!results?.length) return manejarErrorGeocoder({ code: 'ZERO_RESULTS' });

        const lugar = results[0].geometry.location;
        const coords = { lat: lugar.lat(), lng: lugar.lng() };
        moverMapa(coords);
        // El texto es del cliente: se respeta aunque Google lo escriba distinto.
        estado.textoAutomatico = false;
        confirmarPunto(coords, 'busqueda');
    } catch (error) {
        manejarErrorGeocoder(error);
    }
}

/** Lleva el mapa a la posición del GPS del navegador. */
function usarMiUbicacion({ silencioso = false } = {}) {
    if (!navigator.geolocation) {
        if (!silencioso) mostrarEstado('Tu navegador no permite leer tu ubicación. Mueve el mapa hasta tu puerta.', 'aviso');
        return;
    }

    if (!silencioso) mostrarEstado('Buscando tu ubicación…');
    navigator.geolocation.getCurrentPosition(
        ({ coords: { latitude, longitude } }) => {
            if (!estado.disponible) return;
            const coords = { lat: latitude, lng: longitude };
            moverMapa(coords);
            confirmarPunto(coords, 'gps');
            rellenarDireccion(coords);
        },
        (error) => {
            console.warn('Geolocalización no disponible:', error.message);
            if (!estado.coords) {
                mostrarEstado(
                    error.code === error.PERMISSION_DENIED
                        ? 'No tenemos permiso para ver tu ubicación. Escribe tu dirección y pulsa Enter, o mueve el mapa hasta tu puerta.'
                        : 'No pudimos leer tu ubicación. Escribe tu dirección y pulsa Enter, o mueve el mapa hasta tu puerta.',
                    'aviso'
                );
            }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
}

// ==========================================
// CICLO DE VIDA
// ==========================================

function engancharEventos() {
    const el = inputDireccion();
    const lienzo = $('deliveryMapWrapper');

    // Enter en la dirección busca en vez de enviar el formulario.
    el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && estado.disponible) {
            e.preventDefault();
            buscarDireccion();
        }
    });
    el.addEventListener('input', () => { estado.textoAutomatico = false; });

    $('deliveryAddressSearch')?.addEventListener('click', buscarDireccion);
    $('deliveryMapLocate')?.addEventListener('click', () => usarMiUbicacion());

    estado.mapa.addListener('dragstart', () => lienzo.classList.add('mapa-entrega--moviendo'));
    estado.mapa.addListener('dragend', () => lienzo.classList.remove('mapa-entrega--moviendo'));

    estado.mapa.addListener('idle', () => {
        const centro = centroActual();
        const anterior = estado.ultimoCentro;
        estado.ultimoCentro = centro;

        const destino = estado.destinoCodigo;
        estado.destinoCodigo = null;
        if (destino && distanciaMetros(destino, centro) < 1) return;
        // Acercar con los botones no mueve el centro: no es una elección.
        if (anterior && distanciaMetros(anterior, centro) < 1) return;

        confirmarPunto(centro, 'mapa');
        rellenarDireccion(centro);
    });
}

function crearMapa(Map) {
    estado.destinoCodigo = LIMA_CENTRO;
    estado.mapa = new Map($('deliveryMap'), {
        center: LIMA_CENTRO,
        zoom: ZOOM_CIUDAD,
        disableDefaultUI: true,
        zoomControl: true,
        // En el móvil el mapa ocupa todo el ancho: con un dedo se desplaza la
        // página y con dos el mapa, para que el formulario no quede atrapado.
        gestureHandling: 'cooperative',
        clickableIcons: false,
        styles: estiloSegunTema()
    });
    estado.ultimoCentro = LIMA_CENTRO;
}

/** Coloca el punto inicial: dirección guardada, GPS o centro de Lima. */
function posicionInicial(guardadas) {
    if (estado.coords) return;

    const guardada = direccionInicial(guardadas);
    if (guardada) {
        const coords = { lat: guardada.latitud, lng: guardada.longitud };
        const input = $('customerAddress');
        if (input && !input.value.trim()) {
            input.value = guardada.direccion_detallada;
            estado.textoAutomatico = true;
            const referencia = $('customerReference');
            if (referencia && !referencia.value.trim() && guardada.referencia) {
                referencia.value = guardada.referencia;
            }
        }
        moverMapa(coords);
        confirmarPunto(coords, 'guardada');
        return;
    }

    mostrarEstado('Escribe tu dirección y pulsa Enter, o mueve el mapa hasta que el pin quede en tu puerta.');
    usarMiUbicacion({ silencioso: true });
}

/**
 * Muestra el mapa en el checkout. Se llama cada vez que se abre.
 *
 * @param {Object} opciones
 * @param {string|null} opciones.apiKey Key de Google Maps; sin ella no hay mapa.
 * @param {Array} opciones.guardadas Direcciones guardadas del cliente.
 * @param {Function} opciones.alFallar Se llama si el mapa no puede usarse, para
 *        volver al comportamiento anterior (GPS del navegador y texto libre).
 * @returns {Promise<boolean>} Si el mapa quedó disponible.
 */
export async function iniciarMapaEntrega({ apiKey, guardadas = [], alFallar } = {}) {
    estado.alFallar = alFallar;

    if (estado.disponible) {
        posicionInicial(guardadas);
        return true;
    }
    if (!apiKey || keyFueRechazada() || !$('deliveryMap')) {
        alFallar?.();
        return false;
    }

    try {
        await cargarGoogleMaps(apiKey);
        const [{ Map }, { Geocoder }] = await Promise.all([
            google.maps.importLibrary('maps'),
            google.maps.importLibrary('geocoding')
        ]);

        $('deliveryMapWrapper').hidden = false;
        $('deliveryAddressSearch')?.removeAttribute('hidden');

        crearMapa(Map);
        estado.geocoder = new Geocoder();
        estado.disponible = true;
        engancharEventos();
        posicionInicial(guardadas);
        return true;
    } catch (error) {
        console.error('Mapa de entrega no disponible:', error);
        retirarMapa(null);
        alFallar?.();
        return false;
    }
}

/**
 * Lo que el checkout necesita para guardar la dirección.
 * @returns {{disponible: boolean, coords: {lat:number,lng:number}|null}}
 */
export function obtenerUbicacion() {
    return { disponible: estado.disponible, coords: estado.coords };
}

/** Lleva la vista al mapa para que el cliente marque el punto. */
export function enfocarMapa() {
    $('deliveryMapWrapper')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    mostrarEstado('Mueve el mapa hasta que el pin quede en tu puerta para confirmar el pedido.', 'aviso');
}
