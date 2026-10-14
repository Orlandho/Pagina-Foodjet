const API_URL = window.FOODJET_API_URL;

document.addEventListener('DOMContentLoaded', () => {
    // Legacy app initialization if needed
    checkExistingSession();
    initializeLegacyEventListeners();
});

function checkExistingSession() {
    const userStr = localStorage.getItem('user');

    // handleLogin guardaba el token en localStorage pero nadie volvía a
    // leerlo, así que window.authToken era undefined en un arranque en frío y
    // la sesión se perdía al recargar la página.
    const token = localStorage.getItem('token');

    // Si el token ya caducó no se restaura nada. Restaurarlo dejaba la interfaz
    // aparentando sesión activa mientras el servidor rechazaba cada petición
    // con "Token inválido o expirado", y además disparaba una llamada a
    // favoritos condenada al 403 antes de que nadie pudiera comprobarlo.
    // FoodJetSession lo publica app.js, cuyo cuerpo de módulo corre antes que
    // este manejador de DOMContentLoaded.
    if (token && window.FoodJetSession?.isTokenExpired(token)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showToast('Tu sesión expiró. Vuelve a iniciar sesión.', 'warning');
        return;
    }

    if (token) window.authToken = token;

    if (userStr && window.authToken) {
        try {
            window.currentUser = JSON.parse(userStr);
            updateUserUI(window.currentUser);
        } catch (e) {
            handleLogout(new Event('click'));
        }
    }
}

function initializeLegacyEventListeners() {
    // --- ELEMENTOS DEL DASHBOARD ---
    const dashboardBtn = document.getElementById('dashboardBtn');
    const backToMenuFromDashboard = document.getElementById('backToMenuFromDashboard');
    const orderNowFromDashboard = document.getElementById('orderNowFromDashboard');
    const logoutBtnDashboard = document.getElementById('logoutBtnDashboard');

    const refreshOperationsBtn = document.getElementById('refreshOperationsBtn');
    if (refreshOperationsBtn) {
        refreshOperationsBtn.addEventListener('click', () => renderOperationsPanel());
    }

    // El teléfono solo admite dígitos y como mucho 9. QA reportó que aceptaba
    // letras y longitudes mayores, y que el registro se enviaba igual para
    // fallar después en el servidor.
    const registerPhone = document.getElementById('registerPhone');
    if (registerPhone) {
        registerPhone.addEventListener('input', () => {
            const limpio = window.FoodJetValidation?.sanitizePhone(registerPhone.value) ?? registerPhone.value;
            if (registerPhone.value !== limpio) registerPhone.value = limpio;

            registerPhone.classList.remove('is-invalid');
            const feedback = document.getElementById('registerPhoneError');
            if (feedback) feedback.textContent = '';
        });
    }

    // --- ELEMENTOS DE NAVEGACIÓN DE USUARIO ---
    const logoutBtn = document.getElementById('logoutBtn');

    // Login button
    document.getElementById('loginBtn')?.addEventListener('click', () => {
        const loginModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('loginModal'));
        loginModal.show();
    });

    // Login form
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    document.getElementById('backToMenuFromDashboard')?.addEventListener('click', () => {
        if(window.app && window.app.showView) window.app.showView('homeView');
    });

    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            displayDashboard();
        });
    }

    if (orderNowFromDashboard) {
        orderNowFromDashboard.addEventListener('click', (e) => {
            e.preventDefault();
            if(window.app && window.app.showView) window.app.showView('homeView');
            setTimeout(() => document.getElementById('menu').scrollIntoView({ behavior: 'smooth' }), 100);
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    if (logoutBtnDashboard) {
        logoutBtnDashboard.addEventListener('click', handleLogout);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            window.authToken = data.token;
            window.currentUser = data.user;

            localStorage.setItem('token', window.authToken);
            localStorage.setItem('user', JSON.stringify(window.currentUser));

            updateUserUI(window.currentUser);

            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            if (loginModal) loginModal.hide();

            showToast(`¡Bienvenido, ${window.currentUser.nombre}!`);
            document.getElementById('loginForm').reset();
        } else {
            showToast(data.error || 'Error al iniciar sesión', 'warning');
        }
    } catch (error) {
        console.error(error);
        showToast('Error de conexión con el servidor', 'warning');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const nombre = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const telefono = document.getElementById('registerPhone').value;
    const password = document.getElementById('registerPassword').value;

    // El atributo pattern del campo no llega a actuar porque el envío se
    // intercepta con preventDefault, así que la comprobación se hace aquí.
    const revision = window.FoodJetValidation?.validatePhone(telefono);
    if (revision && !revision.valid) {
        const input = document.getElementById('registerPhone');
        const feedback = document.getElementById('registerPhoneError');

        input.classList.add('is-invalid');
        if (feedback) feedback.textContent = revision.error;
        input.focus();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, telefono, password, rol: 'cliente' })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Usuario registrado exitosamente. Por favor, inicia sesión.');

            const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
            if (registerModal) registerModal.hide();

            setTimeout(() => {
                const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                loginModal.show();
            }, 500);

            document.getElementById('registerForm').reset();
        } else if (response.status === 409 || data.code === 'EMAIL_ALREADY_EXISTS') {
            const emailErrorElement = document.getElementById('registerEmailError');
            if (emailErrorElement) {
                emailErrorElement.style.display = 'block';
            } else {
                showToast(data.error || 'El email ya está registrado.', 'warning');
            }
        } else {
            showToast(data.error || 'Error al registrar el usuario', 'warning');
        }
    } catch (error) {
        console.error(error);
        showToast('Error de conexión con el servidor', 'warning');
    }
}

function handleLogout(e) {
    if (e && e.preventDefault) e.preventDefault();
    window.currentUser = null;
    window.authToken = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateUserUI(null);

    const homeView = document.getElementById('homeView');
    if (homeView) {
        const allViews = ['homeView', 'checkoutView', 'trackingView', 'dashboardView', 'orderHistoryView'];
        allViews.forEach(v => {
            const el = document.getElementById(v);
            if(el) el.style.display = 'none';
        });
        homeView.style.display = 'block';
    }
    showToast('Has cerrado sesión', 'info');
}

function updateUserUI(user) {
    const userMenu = document.getElementById('userMenu');
    const loginNav = document.getElementById('loginNav');
    const userNameDropdown = document.getElementById('userNameDropdown');
    const dashboardUserName = document.getElementById('dashboardUserName');
    const dashboardUserEmail = document.getElementById('dashboardUserEmail');
    const dashboardBtn = document.getElementById('dashboardBtn');
    const favoritesNav = document.getElementById('favoritesNav');

    if (user) {
        if(userNameDropdown) userNameDropdown.textContent = user.nombre;
        if(dashboardUserName) dashboardUserName.textContent = user.nombre;
        if(dashboardUserEmail) dashboardUserEmail.textContent = user.email || 'No se ha proporcionado email';
        if(userMenu) userMenu.style.display = 'block';
        if(loginNav) loginNav.style.display = 'none';

        if(dashboardBtn) dashboardBtn.style.display = user.rol === 'admin' ? 'block' : 'none';

        if(userMenu) {
            const userIcon = userMenu.querySelector('i');
            if(userIcon) {
                userIcon.classList.toggle('bi-person-gear', user.rol === 'admin');
                userIcon.classList.toggle('bi-person-circle', user.rol !== 'admin');
            }
        }

        if (favoritesNav) favoritesNav.style.display = 'block';

        // Cargar favoritos al loguear
        if (window.app && window.app.loadFavorites) {
            window.app.loadFavorites();
        }
    } else {
        if(userMenu) userMenu.style.display = 'none';
        if(loginNav) loginNav.style.display = 'block';
        if(dashboardBtn) dashboardBtn.style.display = 'none';
        if(favoritesNav) favoritesNav.style.display = 'none';

        // Limpiar favoritos
        if (window.state && window.state.setFavorites) {
            window.state.setFavorites([]);
            if (window.ui) {
                window.ui.renderProducts();
                window.ui.renderFavoritesOffcanvas();
            }
        }
    }
}

function displayDashboard() {
    const dashboardView = document.getElementById('dashboardView');
    const allViews = ['homeView', 'checkoutView', 'trackingView', 'dashboardView', 'orderHistoryView'];

    allViews.forEach(v => {
        const el = document.getElementById(v);
        if(el) el.style.display = 'none';
    });

    if(dashboardView) dashboardView.style.display = 'block';
    renderOperationsPanel();
}

/**
 * Panel de operaciones.
 *
 * Sustituye a los tres gráficos anteriores, cuyos datos estaban escritos a
 * mano en el propio archivo: pedían los pedidos reales y descartaban la
 * respuesta. Además, el informe deja fuera de alcance la gestión
 * administrativa, así que aquí solo queda lo que permite demostrar el
 * seguimiento: mover el estado de un pedido y ver cómo avanza en la vista del
 * cliente.
 */
const SIGUIENTE_ESTADO = {
    pendiente: 'confirmado',
    confirmado: 'en_preparacion',
    en_preparacion: 'en_camino',
    en_camino: 'entregado'
};

const ETIQUETA_ESTADO = {
    pendiente: 'Pendiente',
    confirmado: 'Confirmado',
    en_preparacion: 'En preparación',
    en_camino: 'En camino',
    entregado: 'Entregado',
    cancelado: 'Cancelado'
};

const ESTADOS_EN_CURSO = ['pendiente', 'confirmado', 'en_preparacion', 'en_camino'];
const FILTROS_OPERACIONES = [
    { id: 'en_curso', etiqueta: 'En curso' },
    ...ESTADOS_EN_CURSO.map(id => ({ id, etiqueta: ETIQUETA_ESTADO[id] })),
    { id: 'entregado', etiqueta: ETIQUETA_ESTADO.entregado },
    { id: 'cancelado', etiqueta: ETIQUETA_ESTADO.cancelado },
    { id: 'todos', etiqueta: 'Todos' }
];
const INTERVALO_OPERACIONES_MS = 5000;

let pedidosOperaciones = [];
let filtroOperaciones = 'en_curso';
let temporizadorOperaciones = null;

function coincideFiltro(order, filtro) {
    if (filtro === 'todos') return true;
    if (filtro === 'en_curso') return ESTADOS_EN_CURSO.includes(order.estado);
    return order.estado === filtro;
}

function hace(fecha) {
    const min = Math.max(0, Math.round((Date.now() - new Date(fecha).getTime()) / 60000));
    if (min < 1) return 'hace un momento';
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `hace ${h} h`;
    return `hace ${Math.floor(h / 24)} d`;
}

/** 45 s, 2 min 10 s, 1 h 5 min. */
function duracion(ms) {
    const total = Math.max(0, Math.round(ms / 1000));
    if (total < 60) return `${total} s`;
    const min = Math.floor(total / 60);
    if (min < 60) return total % 60 && min < 10 ? `${min} min ${total % 60} s` : `${min} min`;
    const h = Math.floor(min / 60);
    if (h >= 24) return h % 24 ? `${Math.floor(h / 24)} d ${h % 24} h` : `${Math.floor(h / 24)} d`;
    return min % 60 ? `${h} h ${min % 60} min` : `${h} h`;
}

function escaparHtml(texto) {
    const d = document.createElement('div');
    d.textContent = texto ?? '';
    return d.innerHTML;
}

/** Repinta filtros y tabla con los pedidos ya cargados, sin volver a pedirlos. */
function pintarOperaciones() {
    const tbody = document.getElementById('operationsTableBody');
    const filtros = document.getElementById('operationsFilters');
    if (!tbody || !filtros) return;

    filtros.innerHTML = FILTROS_OPERACIONES.map(f => {
        const n = pedidosOperaciones.filter(o => coincideFiltro(o, f.id)).length;
        const activo = f.id === filtroOperaciones;
        return `<button type="button" class="operaciones__filtro${activo ? ' is-active' : ''}"
                        data-filter="${f.id}" aria-pressed="${activo}">
                    ${f.etiqueta} <span class="operaciones__conteo">${n}</span>
                </button>`;
    }).join('');

    const visibles = pedidosOperaciones.filter(o => coincideFiltro(o, filtroOperaciones));

    tbody.innerHTML = visibles.length ? visibles.map(order => {
        // Avanzar y cancelar viven dentro del detalle, donde se ve el historial
        // y el mapa antes de decidir.
        const acciones = `<div class="text-end">
            <button type="button" class="btn btn-sm btn-primary btn-order-detail" data-order-id="${order.id}">
                <i class="bi bi-eye me-1" aria-hidden="true"></i>Ver detalle</button></div>`;

        return `
            <tr>
                <th scope="row">
                    <button type="button" class="detalle-abrir btn-order-detail" data-order-id="${order.id}"
                            aria-label="Ver detalle del pedido ${order.id}">#FJ${String(order.id).padStart(4, '0')}</button>
                    <div class="small text-muted fw-normal">${hace(order.fecha)}</div></th>
                <td>${escaparHtml(order.cliente)}
                    <div class="small text-muted">${escaparHtml(order.restaurante)}</div></td>
                <td>S/ ${Number(order.total).toFixed(2)}</td>
                <td><span class="estado-pedido estado-pedido--${order.estado}">${ETIQUETA_ESTADO[order.estado] || order.estado}</span>
                    ${ESTADOS_EN_CURSO.includes(order.estado) ? `<div class="small text-muted mt-1">lleva ${duracion(Date.now() - new Date(order.estado_desde).getTime())}</div>` : ''}</td>
                <td>${acciones}</td>
            </tr>`;
    }).join('') : '<tr><td colspan="5" class="text-center text-muted py-4">No hay pedidos en este estado.</td></tr>';
}

async function renderOperationsPanel() {
    const notice = document.getElementById('operationsNotice');
    const actualizado = document.getElementById('operationsUpdated');
    if (!document.getElementById('operationsTableBody')) return;

    let response;
    try {
        response = await fetch(`${API_URL}/orders`, {
            headers: { 'Authorization': `Bearer ${window.authToken}` }
        });
    } catch (error) {
        if (notice) notice.textContent = 'Sin conexión con el servidor. Reintentando…';
        return;
    }

    if (!response.ok) {
        detenerRefrescoOperaciones();
        if (notice) notice.textContent = 'No se pudieron cargar los pedidos.';
        return;
    }

    pedidosOperaciones = await response.json();
    pintarOperaciones();
    if (pedidoAbierto) cargarDetallePedido(pedidoAbierto, { silencioso: true });
    if (actualizado) actualizado.textContent = `Actualizado ${new Date().toLocaleTimeString('es-PE')}`;
    iniciarRefrescoOperaciones();
}

/** Mientras el panel está a la vista se actualiza solo: el simulador mueve los estados sin que nadie toque nada. */
function iniciarRefrescoOperaciones() {
    if (temporizadorOperaciones) return;
    temporizadorOperaciones = setInterval(() => {
        const vista = document.getElementById('dashboardView');
        if (!vista || vista.style.display === 'none' || document.hidden) {
            if (!vista || vista.style.display === 'none') detenerRefrescoOperaciones();
            return;
        }
        renderOperationsPanel();
    }, INTERVALO_OPERACIONES_MS);
}

function detenerRefrescoOperaciones() {
    clearInterval(temporizadorOperaciones);
    temporizadorOperaciones = null;
}

document.addEventListener('click', (e) => {
    const filtro = e.target.closest('#operationsFilters [data-filter]');
    if (filtro) {
        filtroOperaciones = filtro.dataset.filter;
        pintarOperaciones();
        return;
    }
    const detalle = e.target.closest('.btn-order-detail');
    if (detalle) {
        abrirDetallePedido(Number(detalle.dataset.orderId));
        return;
    }
    const avanzar = e.target.closest('.btn-advance-order');
    if (avanzar) {
        advanceOrder(avanzar.dataset.orderId, avanzar.dataset.next);
        return;
    }
    const cancelar = e.target.closest('.btn-cancel-order');
    if (cancelar && window.confirm(`¿Cancelar el pedido #${cancelar.dataset.orderId}? No se puede deshacer.`)) {
        advanceOrder(cancelar.dataset.orderId, 'cancelado');
    }
});

async function advanceOrder(orderId, nuevoEstado) {
    const notice = document.getElementById('operationsNotice');

    const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.authToken}`
        },
        body: JSON.stringify({ nuevo_estado: nuevoEstado })
    });

    const data = await response.json();

    if (!response.ok) {
        if (notice) notice.textContent = data.error || 'No se pudo actualizar el pedido.';
        await renderOperationsPanel();
        return;
    }

    if (notice) notice.textContent = `Pedido #${orderId} actualizado a ${ETIQUETA_ESTADO[nuevoEstado]}.`;
    await renderOperationsPanel();
}

// ---------------------------------------------------------------------------
// Detalle de un pedido: cuándo entró en cada estado y cuánto duró cada uno.
// ---------------------------------------------------------------------------
const ORIGEN_CAMBIO = { cliente: 'Cliente', personal: 'Personal', simulador: 'Simulación', sistema: 'Sistema' };
const FLUJO_DETALLE = ['pendiente', 'confirmado', 'en_preparacion', 'en_camino', 'entregado'];

let pedidoAbierto = null;
let mapaDetalle = null;

function abrirDetallePedido(id) {
    pedidoAbierto = id;
    const panel = document.getElementById('orderDetailModal');
    if (!panel) return;
    document.getElementById('orderDetailTitle').textContent = `Pedido #FJ${String(id).padStart(4, '0')}`;
    document.getElementById('orderDetailBody').innerHTML = '<p class="text-muted">Cargando…</p>';
    // El mapa no puede medirse mientras la ventana está oculta: se reencuadra
    // cuando termina de abrirse.
    panel.addEventListener('shown.bs.modal', () => mapaDetalle?.reencuadrar(), { once: true });
    panel.addEventListener('hidden.bs.modal', () => {
        pedidoAbierto = null;
        mapaDetalle?.detener();
    }, { once: true });
    bootstrap.Modal.getOrCreateInstance(panel).show();
    cargarDetallePedido(id);
}

async function cargarDetallePedido(id, { silencioso = false } = {}) {
    const cuerpo = document.getElementById('orderDetailBody');
    try {
        const response = await fetch(`${API_URL}/orders/${id}`, {
            headers: { 'Authorization': `Bearer ${window.authToken}` }
        });
        if (id !== pedidoAbierto) return;
        if (!response.ok) {
            if (!silencioso) cuerpo.innerHTML = '<p class="text-muted">No se pudo cargar el pedido. Cierra el panel y vuelve a abrirlo.</p>';
            return;
        }
        const pedido = await response.json();
        pintarDetallePedido(pedido);
        mostrarMapaDetalle(pedido);
    } catch (error) {
        if (!silencioso) cuerpo.innerHTML = '<p class="text-muted">Sin conexión con el servidor.</p>';
    }
}

/** El mapa vive fuera del cuerpo que se repinta, para no recrearlo en cada actualización. */
async function mostrarMapaDetalle(pedido) {
    const mapas = window.FoodJetMapas;
    if (!mapas) return;

    mapaDetalle = mapaDetalle || mapas.crearMapaSeguimiento({
        lienzo: 'orderDetailMap', tarjeta: 'orderDetailMapCard', ruta: 'orderDetailRoute', tituloCasa: 'Entrega'
    });
    const config = await mapas.fetchConfigAPI();
    const mapKeys = config.googleMapsApiKeys?.length ? config.googleMapsApiKeys : config.googleMapsApiKey;
    if (pedido.id !== pedidoAbierto) return;
    mapaDetalle.mostrar(pedido, mapKeys);
}

/** Nodos de la línea de tiempo: los que ya ocurrieron, con su duración, y los que faltan. */
function etapasDelPedido(pedido, ahora) {
    const reales = pedido.historial.map(h => ({ estado: h.estado, desde: new Date(h.fecha).getTime(), origen: h.origen }));
    // El pedido nace en "pendiente" aunque ese primer cambio no se haya anotado.
    if (!reales.some(r => r.estado === 'pendiente')) {
        reales.unshift({ estado: 'pendiente', desde: new Date(pedido.fecha).getTime(), origen: 'cliente' });
    }
    const terminal = ['entregado', 'cancelado'].includes(pedido.estado);

    const hechas = reales.map((r, i) => {
        const siguiente = reales[i + 1];
        const fin = siguiente ? siguiente.desde : (terminal ? null : ahora);
        return { ...r, duracion: fin === null ? null : Math.max(0, fin - r.desde), enCurso: !siguiente && !terminal };
    });

    const pendientes = pedido.estado === 'cancelado'
        ? []
        : FLUJO_DETALLE.slice(FLUJO_DETALLE.indexOf(pedido.estado) + 1).map(estado => ({ estado, futuro: true }));

    return { hechas, pendientes };
}

function pintarDetallePedido(pedido) {
    const cuerpo = document.getElementById('orderDetailBody');
    if (!cuerpo) return;

    const resumen = pedidosOperaciones.find(o => o.id === pedido.id);
    const ahora = Date.now() + (pedido.servidor_ahora ? new Date(pedido.servidor_ahora).getTime() - Date.now() : 0);
    const { hechas, pendientes } = etapasDelPedido(pedido, ahora);

    const conDuracion = hechas.filter(e => e.duracion !== null && e.duracion > 0);
    const suma = conDuracion.reduce((t, e) => t + e.duracion, 0) || 1;
    const barra = conDuracion.map(e => `<span class="linea__tramo estado-pedido--${e.estado}"
            style="flex: ${e.duracion} 1 0" title="${ETIQUETA_ESTADO[e.estado]}: ${duracion(e.duracion)}"></span>`).join('');

    const inicio = hechas[0].desde;
    const terminal = ['entregado', 'cancelado'].includes(pedido.estado);
    const total = (terminal ? hechas[hechas.length - 1].desde : ahora) - inicio;
    const textoTotal = pedido.estado === 'entregado' ? `Entregado en ${duracion(total)}`
        : pedido.estado === 'cancelado' ? `Cancelado a los ${duracion(total)}`
        : `Lleva ${duracion(total)} desde que se pidió`;

    const hora = (ms) => new Date(ms).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const pasos = hechas.map(e => `
        <li class="linea__paso${e.enCurso ? ' is-actual' : ''}">
            <span class="linea__punto estado-pedido--${e.estado}" aria-hidden="true"></span>
            <div class="linea__titulo">${ETIQUETA_ESTADO[e.estado] || e.estado}
                <span class="linea__hora">${hora(e.desde)}</span></div>
            <div class="linea__detalle">${ORIGEN_CAMBIO[e.origen] || e.origen}${
                e.duracion === null ? '' : ` · ${e.enCurso ? 'lleva ' : 'duró '}${duracion(e.duracion)}`}</div>
        </li>`).join('') + pendientes.map(e => `
        <li class="linea__paso is-futuro">
            <span class="linea__punto" aria-hidden="true"></span>
            <div class="linea__titulo">${ETIQUETA_ESTADO[e.estado]}</div>
        </li>`).join('');

    const siguiente = SIGUIENTE_ESTADO[pedido.estado];
    const acciones = ESTADOS_EN_CURSO.includes(pedido.estado) ? `
        <div class="d-flex gap-2 mt-3">
            ${pedido.estado !== 'en_camino' ? `<button class="btn btn-outline-danger btn-cancel-order" data-order-id="${pedido.id}">Cancelar pedido</button>` : ''}
            <button class="btn btn-primary flex-grow-1 btn-advance-order" data-order-id="${pedido.id}" data-next="${siguiente}">
                Pasar a ${ETIQUETA_ESTADO[siguiente]}</button>
        </div>` : '';

    const items = (pedido.OrderItem || []).map(i => `
        <li class="d-flex justify-content-between"><span>${i.cantidad} × ${escaparHtml(i.Product?.nombre || 'Producto')}</span></li>`).join('');
    const dir = pedido.DeliveryAddress;
    const recorrido = pedido.distancia_metros
        ? `${(pedido.distancia_metros / 1000).toFixed(1)} km${pedido.eta_minutos ? ` · ${pedido.eta_minutos} min estimados` : ''}` : null;

    cuerpo.innerHTML = `
        <div class="d-flex align-items-center justify-content-between">
            <span class="estado-pedido estado-pedido--${pedido.estado}">${ETIQUETA_ESTADO[pedido.estado]}</span>
            <strong>S/ ${Number(pedido.total).toFixed(2)}</strong>
        </div>
        <p class="mt-3 mb-2 fw-semibold">${textoTotal}</p>
        ${conDuracion.length ? `<div class="linea__barra" role="img"
            aria-label="Reparto del tiempo entre etapas">${barra}</div>` : ''}
        <ol class="linea">${pasos}</ol>
        ${acciones}
        <hr class="my-4">
        <dl class="detalle__datos">
            <dt>Cliente</dt><dd>${escaparHtml(resumen?.cliente || '')}</dd>
            <dt>Local</dt><dd>${escaparHtml(pedido.Restaurant?.nombre || '')}</dd>
            ${dir ? `<dt>Entrega</dt><dd>${escaparHtml(dir.direccion_detallada)}${dir.referencia ? `<div class="small text-muted">${escaparHtml(dir.referencia)}</div>` : ''}</dd>` : ''}
            ${recorrido ? `<dt>Recorrido</dt><dd>${recorrido}</dd>` : ''}
        </dl>
        ${items ? `<ul class="list-unstyled mb-0 mt-3">${items}</ul>` : ''}`;
}


function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }

    // Si el mismo aviso ya está en pantalla no se apila otro: al intentar
    // añadir varios productos de otro restaurante se acumulaban seis mensajes
    // idénticos que tapaban la página. Se reinicia el temporizador del que ya
    // hay para que siga visible.
    const yaVisible = Array.from(toastContainer.querySelectorAll('.toast'))
        .find((t) => t.dataset.mensaje === message);

    if (yaVisible) {
        // eslint-disable-next-line no-undef
        bootstrap.Toast.getOrCreateInstance(yaVisible, { delay: 3000 }).show();
        return;
    }

    toast.dataset.mensaje = message;
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
    bsToast.show();

    toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || href === '#home') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });
});

window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.displayDashboard = displayDashboard;
window.updateUserUI = updateUserUI;
window.showToast = showToast;
