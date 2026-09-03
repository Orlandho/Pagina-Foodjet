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

async function renderOperationsPanel() {
    const tbody = document.getElementById('operationsTableBody');
    const notice = document.getElementById('operationsNotice');
    if (!tbody) return;

    const response = await fetch(`${API_URL}/orders`, {
        headers: { 'Authorization': `Bearer ${window.authToken}` }
    });

    if (!response.ok) {
        tbody.innerHTML = '';
        if (notice) notice.textContent = 'No se pudieron cargar los pedidos.';
        return;
    }

    const orders = await response.json();
    if (notice) notice.textContent = `${orders.length} pedidos cargados.`;

    tbody.innerHTML = orders.map(order => {
        const siguiente = SIGUIENTE_ESTADO[order.estado];
        const accion = siguiente
            ? `<button class="btn btn-sm btn-primary btn-advance-order" data-order-id="${order.id}" data-next="${siguiente}">
                   Avanzar a ${ETIQUETA_ESTADO[siguiente]}
               </button>`
            : '<span class="text-muted small">Sin acciones</span>';

        return `
            <tr>
                <th scope="row">#FJ${String(order.id).padStart(4, '0')}</th>
                <td>${order.cliente}</td>
                <td>S/ ${Number(order.total).toFixed(2)}</td>
                <td>${ETIQUETA_ESTADO[order.estado] || order.estado}</td>
                <td>${accion}</td>
            </tr>
        `;
    }).join('');

    tbody.querySelectorAll('.btn-advance-order').forEach(btn => {
        btn.addEventListener('click', () => advanceOrder(btn.dataset.orderId, btn.dataset.next));
    });
}

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
        return;
    }

    if (notice) notice.textContent = `Pedido #${orderId} actualizado a ${ETIQUETA_ESTADO[nuevoEstado]}.`;
    await renderOperationsPanel();
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
window.showToast = showToast;
