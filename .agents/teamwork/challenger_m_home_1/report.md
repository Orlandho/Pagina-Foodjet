# Adversarial Empirical Verification Report — Milestone M-Home

**Auditor/Challenger:** `teamwork_challenger` (`challenger_m_home_1`)  
**Fecha:** 2026-10-31  
**Directorio de trabajo:** `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\challenger_m_home_1\`  
**Objetivo de prueba:** Verificación empírica adversarial de Milestone M-Home (R1. Reconstrucción de Home y cabecera según diseño Figma).  
**Suite de pruebas empíricas:** `tests/unit/challenger_m_home_1_empirical.test.mjs` (30 tests pasando, 0 fallos).

---

## 1. Challenge Summary

- **Overall Risk Assessment:** **LOW**
- **Estado de Contratos DOM:** 100% íntegro (165 baseline IDs de commit `515e3ad` preservados, 0 duplicados, sintaxis HTML5 válida).
- **Protección de Privacidad de Geolocalización:** 100% blindada (cero llamadas a `navigator.geolocation` al abrir `#addressSelectorModal`; invocación condicionada exclusivamente al clic en `#btnHeaderLocateGps`).
- **Centralización del Buscador:** 100% conforme (`#catalogSearchInput` y `#catalogSearchClear` alojados dentro de `<nav id="navbar">` con contenedor central `.foodjet-header-search`).
- **Contrato del Botón de Carrito:** 100% conforme (botón textual con label "Mi carrito", separador `.foodjet-cart-btn__sep` y `#cartCount`, con visibilidad reactiva condicional `display: none` cuando está vacío).

---

## 2. Adversarial Challenges & Stress Testing

### [High] Challenge 1: Silent Geolocation Invocation on Modal Opening (Privacy Leak Attack)
- **Assumption Challenged:** Que abrir la barra de direcciones de cabecera (`#headerAddressBar`) no active inadvertidamente la API de geolocalización del navegador sin el consentimiento explícito del usuario.
- **Attack Scenario:** Un script o consumidor que inicialice `#headerAddressBar` o `#addressSelectorModal` podría intentar resolver inmediatamente las coordenadas GPS para "agilizar" la experiencia del usuario, violando el consentimiento explícito y las políticas de privacidad de navegadores modernos.
- **Blast Radius:** Si se activase automáticamente, el navegador presentaría de inmediato el prompt de permisos de geolocalización al usuario al ingresar o tocar la cabecera, causando desconfianza, rechazo de permisos y violando el requerimiento R1 ("solicitando GPS solo tras acción explícita").
- **Empirical Test:** `TC-HOME-ADDR-02` (Suite 2). Se simuló la apertura repetida del modal por clic en `#headerAddressBar` y por teclado (`Enter`), monitoreando el contador `geoCallCount`.
- **Result:** **PASSED**. `geoCallCount === 0`. No existe ninguna llamada implícita a `navigator.geolocation.getCurrentPosition`.

---

### [Medium] Challenge 2: DOM Contract Regression & ID Duplication Attack
- **Assumption Challenged:** Que la reorganización de la cabecera, modal y rejilla de catálogo preserva todos los 165 IDs identificados en la línea base de commit `515e3ad` sin colisiones ni duplicados.
- **Attack Scenario:** Reestructurar componentes HTML5 en un documento monolítico de 1500+ líneas a menudo introduce IDs duplicados (e.g. copiar modales o elementos de navegación) o elimina IDs consumidos por scripts de backend o checkout.
- **Blast Radius:** `document.getElementById` devolvería el primer elemento encontrado, rompiendo los controladores de eventos, listeners de checkout, login o tracking.
- **Empirical Test:** `TC-HOME-DOM-01`, `TC-HOME-DOM-02`, `TC-HOME-DOM-03`, `TC-HOME-DOM-04` (Suite 1).
- **Result:** **PASSED**.
  - Baseline commit 515e3ad: 165 IDs únicos.
  - Current index.html: 247 IDs únicos.
  - IDs baseline faltantes: 0.
  - IDs duplicados: 0.
  - Sintaxis inválida HTML5: 0.

---

### [Medium] Challenge 3: In-Flight GPS State Lockup & Permission Denial Handlers
- **Assumption Challenged:** Que el botón `#btnHeaderLocateGps` se deshabilita durante la petición y se rehabilita correctamente tanto en éxito como en rechazo de permisos o timeout.
- **Attack Scenario:** Si el usuario rechaza los permisos de geolocalización (`GeolocationPositionError.PERMISSION_DENIED`) o el navegador no soporta geolocalización, el botón podría quedar permanentemente en estado `disabled` con el spinner girando, bloqueando futuras interacciones y dejando al usuario sin alternativa de compra.
- **Blast Radius:** Bloqueo del selector de ubicación y frustración de usuario.
- **Empirical Test:** `TC-HOME-GPS-03`, `TC-HOME-GPS-04` (Suite 3). Se forzó rechazo con `new Error('User denied Geolocation')` y ausencia de `navigator.geolocation`.
- **Result:** **PASSED**. El botón se rehabilita inmediatamente (`disabled === false`), restaura su HTML original, no arroja excepciones no controladas y notifica mediante toast accesible que el usuario puede ingresar la dirección manualmente.

---

### [Low] Challenge 4: Regex Special Characters in Centralized Search Input
- **Assumption Challenged:** Que el filtrado reactivo del catálogo en `ui.renderProducts()` maneja de forma segura cadenas de búsqueda con caracteres especiales de expresiones regulares (e.g. `[Combo] (2x1) *+?`).
- **Attack Scenario:** Si la búsqueda compilara la entrada del usuario en `new RegExp(query)`, caracteres como `[` o `(` arrojarían un `SyntaxError` en tiempo de ejecución, rompiendo el renderizado del catálogo completo.
- **Blast Radius:** Pantalla en blanco en la sección de productos y consola rota.
- **Empirical Test:** `TC-HOME-SEARCH-05` (Suite 4). Se inyectó `[Especial]` en `#catalogSearchInput` y se disparó el evento `input`.
- **Result:** **PASSED**. `ui.js` utiliza `.includes(searchQuery)` con strings normalizados a minúsculas (`toLowerCase()`), garantizando inmunidad total frente a inyecciones o errores sintácticos de regex.

---

### [Low] Challenge 5: Cart Count Badge Desynchronization (Zero State Flashing)
- **Assumption Challenged:** Que cuando el carrito pasa de tener productos a estar vacío (vaciado manual o tras compra), tanto el contador `#cartCount` como el separador `.foodjet-cart-btn__sep` se ocultan completamente (`display: none`), sin dejar un badge "0" o un punto "·" flotando junto a "Mi carrito".
- **Attack Scenario:** Desincronización entre el estado interno `cart` y los elementos visuales del botón textual `#cartBtn`.
- **Blast Radius:** Interfaz desordenada que muestra "Mi carrito · 0" en lugar de la apariencia limpia aprobada.
- **Empirical Test:** `TC-HOME-CART-02`, `TC-HOME-CART-03`, `TC-HOME-CART-04` (Suite 5). Se ejecutó el ciclo completo: carrito vacío -> 1 producto -> 3 productos -> vaciado total (`clearCart`).
- **Result:** **PASSED**.
  - Vacío: `#cartCount.style.display === 'none'`, `.foodjet-cart-btn__sep.style.display === 'none'`.
  - Con productos: `#cartCount.style.display === 'inline-flex'`, `.foodjet-cart-btn__sep.style.display === 'inline'`.
  - Vaciado total: ambos retornan estrictamente a `display: 'none'`.
  - La etiqueta textual "Mi carrito" permanece inalterada en todas las transiciones.

---

## 3. Detailed Empirical Test Results

Ejecución del arnés automatizado `tests/unit/challenger_m_home_1_empirical.test.mjs`:

```
▶ Milestone M-Home Empirical Verification — Challenger M-Home-1
  ▶ Suite 1: DOM Contract Integrity & Preservation (165 Baseline IDs & Zero Duplicates)
    ✔ TC-HOME-DOM-01: Baseline commit 515e3ad exists and contains exactly 165 unique DOM IDs (149.1ms)
    ✔ TC-HOME-DOM-02: Todos los 165 IDs del baseline están preservados en el frontend/index.html actual (118.5ms)
    ✔ TC-HOME-DOM-03: Cero IDs duplicados en todo frontend/index.html (Unicidad estricta) (0.8ms)
    ✔ TC-HOME-DOM-04: Todos los IDs de DOM cumplen con la sintaxis válida de identificadores HTML5 (0.5ms)
    ✔ TC-HOME-DOM-05: Presencia garantizada de todos los IDs requeridos por Milestone M-Home y M2 (0.5ms)
  ✔ Suite 1: DOM Contract Integrity & Preservation (165 Baseline IDs & Zero Duplicates) (270.7ms)
  ▶ Suite 2: Address Selector Modal & Geolocation Safeguard
    ✔ TC-HOME-ADDR-01: Clic en #headerAddressBar abre #addressSelectorModal vía Bootstrap Modal (2.0ms)
    ✔ TC-HOME-ADDR-02: [PRIVACIDAD ESTRICTA] Abrir el modal NO debe invocar navigator.geolocation (0.9ms)
    ✔ TC-HOME-ADDR-03: populateAddressSelectorModal muestra mensaje de invitado y botón de login si no hay sesión (0.5ms)
    ✔ TC-HOME-ADDR-04: populateAddressSelectorModal muestra estado vacío cuando usuario no tiene direcciones guardadas (0.5ms)
    ✔ TC-HOME-ADDR-05: populateAddressSelectorModal renderiza tarjetas de direcciones con atributos y selección (0.7ms)
    ✔ TC-HOME-ADDR-06: Idempotencia: Invocaciones repetidas de populateAddressSelectorModal no duplican tarjetas (0.7ms)
    ✔ TC-HOME-ADDR-07: Clic en tarjeta de dirección guardada actualiza cabecera, checkout, coordenadas y cierra modal (1.4ms)
    ✔ TC-HOME-ADDR-08: Accesibilidad de teclado: Tecla Enter en #headerAddressBar abre modal sin invocar GPS (0.5ms)
    ✔ TC-HOME-ADDR-09: Dirección guardada sin coordenadas (null/NaN) no corrompe window.headerDeliveryCoordinates (0.9ms)
  ✔ Suite 2: Address Selector Modal & Geolocation Safeguard (10.2ms)
  ▶ Suite 3: Explicit GPS Geolocation Action & Error Recovery
    ✔ TC-HOME-GPS-01: Clic en #btnHeaderLocateGps invoca explícitamente navigator.geolocation (1.2ms)
    ✔ TC-HOME-GPS-02: Flujo exitoso de GPS actualiza cabecera, checkout, coordenadas y cierra modal (0.4ms)
    ✔ TC-HOME-GPS-03: Rechazo de permisos de GPS se maneja limpiamente sin caídas y re-habilita el botón (1.4ms)
    ✔ TC-HOME-GPS-04: Navegador sin soporte de geolocalización no arroja excepción (0.4ms)
    ✔ TC-HOME-GPS-05: Entrada manual de dirección vacía es rechazada (0.4ms)
    ✔ TC-HOME-GPS-06: Entrada manual válida actualiza cabecera, sincroniza checkout y cierra modal (0.5ms)
    ✔ TC-HOME-GPS-07: Envío de dirección manual con tecla Enter en input actualiza cabecera (0.9ms)
  ✔ Suite 3: Explicit GPS Geolocation Action & Error Recovery (6.2ms)
  ▶ Suite 4: Centralized Navbar Search Bar & Reactive Filtering
    ✔ TC-HOME-SEARCH-01: #catalogSearchInput y #catalogSearchClear están físicamente dentro de <nav id="navbar"> (0.5ms)
    ✔ TC-HOME-SEARCH-02: Contenedor .foodjet-header-search posee clases de centralización y expansión flexible (0.2ms)
    ✔ TC-HOME-SEARCH-03: Evento input en #catalogSearchInput muestra botón limpiar y filtra productos (2.1ms)
    ✔ TC-HOME-SEARCH-04: Clic en #catalogSearchClear resetea input, re-renderiza catálogo y restaura foco (0.7ms)
    ✔ TC-HOME-SEARCH-05: Búsqueda con caracteres especiales de regex ([ ] + * ?) no causa error y filtra con seguridad (0.4ms)
  ✔ Suite 4: Centralized Navbar Search Bar & Reactive Filtering (4.5ms)
  ▶ Suite 5: Textual Cart Button Contract & Reactive Counter
    ✔ TC-HOME-CART-01: #cartBtn en index.html contiene "Mi carrito", separador y #cartCount (0.2ms)
    ✔ TC-HOME-CART-02: Carrito vacío oculta #cartCount (display: none) y separador (display: none) (0.6ms)
    ✔ TC-HOME-CART-03: Agregar producto activa reactivamente #cartCount (inline-flex) y separador (inline) (2.5ms)
    ✔ TC-HOME-CART-04: Acumulación de múltiples ítems y vaciado completo restaura visibilidad oculta (0.5ms)
  ✔ Suite 5: Textual Cart Button Contract & Reactive Counter (4.3ms)
✔ Milestone M-Home Empirical Verification — Challenger M-Home-1 (297.0ms)
ℹ tests 30
ℹ suites 6
ℹ pass 30
ℹ fail 0
```

---

## 4. Unchallenged Areas

- **Backend APIs & Database Schemas:** No se realizaron pruebas directas sobre endpoints backend en vivo (`POST /api/orders`, base de datos PostgreSQL) debido a la restricción estricta de no realizar modificaciones ni alteraciones de datos durante la auditoría.
- **Ruta OSRM en vivo:** La generación de polilíneas de ruta en vivo depende del contenedor OSRM y fue verificada a nivel de mocks y contrato en pruebas funcionales Cucumber.
