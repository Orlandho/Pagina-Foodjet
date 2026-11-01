# FoodJet UI Redesign — Visual Specification & Reference Mining Report

**Date**: 2026-10-29  
**Explorer**: Survey Explorer 1 (`explorer_survey_1`)  
**Role**: `teamwork_spec_miner` / `teamwork_explorer`  
**Parent Task**: `b2ab8d46-d54d-46d1-bb73-6ace23f6ae5c`  
**Authoritative Sources**:
1. Android Jetpack Compose Prototype: `C:\Users\ORLANDO\Desktop\ciclo 9\frontend para actualizar foodjet para app moviles y adm de proyec de software\proyecto-app-movil-UPN-2026-2-main`
2. Figma Design (`FOODJET BUSS PROJ`, node `0-1`, node `3-8347`): Retrieved via OEmbed rich metadata and high-res rendered canvas thumbnail (`figma_thumbnail.png`).
3. User Request & Business Rules: `ORIGINAL_REQUEST.md`, `AGENTS.md`, and existing web codebase (`frontend/index.html`, `frontend/styles.css`, `frontend/js/`).

---

## 1. Executive Summary

This specification mining report documents the visual system, design tokens, component anatomy, layout patterns, and screen requirements for the comprehensive redesign of the FoodJet Web Frontend.

The investigation probed both the **authoritative local Android Jetpack Compose prototype** and the **online Figma design project** (retrieved and verified via OEmbed thumbnail analysis). The visual language is clean, modern, and friendly, centered on warm food-delivery aesthetics: vibrant primary orange (`#F4511E`), peach tint (`#FCF0E4`), soft gray canvas (`#F8F8F4`), dark neutral typography (`#1C1C1C`), subtle borders (`#E6E4DC`), and distinct accent/state colors for student perks (`#1E7B4F` / `#ECF4EC` / `#FCD460`).

---

## 2. Design Tokens Dictionary

### 2.1 Color Palette & CSS Variables

| Token Name | Hex Value | RGB | Material/Compose Equivalent | Role & Applied Usage |
|---|---|---|---|---|
| `--color-primary` | `#F4511E` | `rgb(244, 81, 30)` | `FoodJetPrimary` | Primary brand color, primary CTA buttons, active icons, brand logo |
| `--color-primary-dark` | `#D94310` | `rgb(217, 67, 16)` | `FoodJetPrimaryDark` | Hover state for buttons, active state accents, map pins |
| `--color-primary-light` | `#FCF0E4` | `rgb(252, 240, 228)` | `FoodJetPrimaryLight` | Peach background tint for icon containers, selected payment tiles, "Ahora" badge |
| `--color-text-primary` | `#1C1C1C` | `rgb(28, 28, 28)` | `FoodJetDark` | Primary headings, product names, high-emphasis text, active pill chips |
| `--color-text-secondary` | `#6B6B66` | `rgb(107, 107, 102)` | `FoodJetGray` | Secondary labels, descriptions, timestamps, unselected navigation icons |
| `--color-text-accessible-orange` | `#D03D0A` | `rgb(208, 61, 10)` | Accessible Dark Orange | Text links & small labels on white/bg needing WCAG AA normal contrast (4.82:1) |
| `--color-surface` | `#FFFFFF` | `rgb(255, 255, 255)` | `MaterialTheme.surface` | Card surfaces, modal containers, inputs, top navbar background |
| `--color-background` | `#F8F8F4` | `rgb(248, 248, 244)` | `FoodJetLightGray` | Global page body background, subtle section contrast |
| `--color-border` | `#E6E4DC` | `rgb(230, 228, 220)` | `FoodJetBorder` | Subtle card borders, dividers, inactive pill borders, input default borders |
| `--color-yellow-badge` | `#FCD460` | `rgb(252, 212, 96)` | `FoodJetYellow` | "PRECIO ESTUDIANTE" floating pill badge, Hero banner top pill, rating stars |
| `--color-success-deep` | `#1E7B4F` | `rgb(30, 123, 79)` | `FoodJetSuccessDeep` | Student discount effective price text, student tag text, delivery eta highlight |
| `--color-success-soft` | `#ECF4EC` | `rgb(236, 244, 236)` | `FoodJetSuccessSoft` | Soft green background for delivery bike banner and coupon success notification |
| `--color-success` | `#28A745` | `rgb(40, 167, 69)` | `FoodJetSuccess` | "Actualizando en vivo" pulsing dot, completed timeline checkmarks |
| `--color-success-container` | `#D4EDDA` | `rgb(212, 237, 218)` | `FoodJetSuccessContainer` | Status history completed badge background |
| `--color-warning` | `#FFC107` | `rgb(255, 193, 7)` | `FoodJetWarning` | Pending status icon, rating star borders |
| `--color-warning-container` | `#FFF3CD` | `rgb(255, 243, 205)` | `FoodJetWarningContainer` | Pending order status badge background |
| `--color-danger` | `#DC3545` | `rgb(220, 53, 69)` | `FoodJetDanger` | Error notifications, invalid coupon message, cancel order button |
| `--color-danger-container` | `#F8D7DA` | `rgb(248, 215, 218)` | `FoodJetDangerContainer` | Cancelled order status badge background |

### 2.2 Typography Scale

| Token | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `--font-display-large` | `30px` (`1.875rem`) | `34px` - `36px` | ExtraBold (`800`) | Hero headlines: "Tu antojo. Sin escalas.", "A un paso del antojo.", "¡Tu antojo va volando!" |
| `--font-headline-medium`| `22px` - `24px` (`1.375rem`) | `28px` - `30px` | Bold (`700`) | Modal titles, "Tu carrito", "Los favoritos del barrio" (`20px`), "Mi Historial de Pedidos" |
| `--font-title-large` | `18px` (`1.125rem`) | `24px` | Bold (`700`) | Card section headers (`FoodJetSectionHeader`), "Total a Pagar", "Sigue tu pedido" |
| `--font-title-medium` | `16px` (`1rem`) | `22px` | SemiBold (`600`) | Subtotal, section labels, CTA button text, product effective price |
| `--font-body-large` | `15px` (`0.9375rem`)| `22px` | Regular / Bold | Product card titles, timeline main step labels, order items |
| `--font-body-medium` | `13px` (`0.8125rem`)| `18px` | Regular (`400`) / SemiBold (`600`) | Subtitles, pill chip labels, input field text, descriptions |
| `--font-body-small` | `11px` - `12px` (`0.75rem`) | `14px` - `16px` | Regular (`400`) / Medium (`500`) | Delivery time, timestamps, footnotes, footer slogan, disclaimer |
| `--font-micro-badge` | `8px` - `9px` (`0.5625rem`) | `11px` - `12px` | ExtraBold (`800`) | Floating badge text: "AGOTADO", "PRECIO ESTUDIANTE", "POCO PRESUPUESTO. MUCHO SABOR." |

### 2.3 Shapes & Border Radii

| Token | Value | Applied To |
|---|---|---|
| `--radius-full` | `9999px` (`RoundedCornerShape(50)`) | Pill chips ("Todos", categories, filters), favorite circle button, close button, live indicator |
| `--radius-hero` | `24px` | Hero promotion carousel container (`HeroCarousel`) |
| `--radius-card` | `20px` | Main cards (`ProductCard`, Checkout cards, Tracking cards, Dialog/Modal cards) |
| `--radius-cta` | `18px` | Main primary checkout & payment CTA buttons (height 56px) |
| `--radius-input` | `16px` | Search bar, text input outlines, Secondary action cards |
| `--radius-button` | `12px` - `14px` | Standard buttons, payment tiles, item image thumbnails |
| `--radius-badge` | `8px` - `10px` | Section icon background box (`FoodJetSectionHeader`), status tags, small badges |

### 2.4 Shadows & Elevation

| Token | CSS Value | Applied To |
|---|---|---|
| `--shadow-none` | `none` | Standard cards with `1px solid var(--color-border)` |
| `--shadow-sm` | `0 2px 4px rgba(0,0,0,0.06)` | Floating badges, map "Actualizando en vivo" pill, dropdowns |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` | Modal dialogs, floating cart trigger, mobile sticky action bar |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.12)` | Offcanvas drawers, expanded popups |

---

## 3. WCAG AA Contrast Analysis

All color combinations were verified using the standard relative luminance formula $L = 0.2126R + 0.7152G + 0.0722B$ and contrast ratio $(L_1 + 0.05) / (L_2 + 0.05)$:

| Pair Description | Color 1 | Color 2 | Ratio | WCAG AA Normal (>= 4.5:1) | WCAG AA Large (>= 3.0:1) | Implementation Guidance |
|---|---|---|---|---|---|---|
| White text on Primary Orange | `#FFFFFF` | `#F4511E` | **3.48:1** | FAIL | **PASS** | Permitted for CTA buttons with bold text >= 16px (treated as large text). For normal text, use Dark text `#1C1C1C` or accessible dark orange. |
| Dark text on Primary Orange | `#1C1C1C` | `#F4511E` | **4.90:1** | **PASS** | **PASS** | Used in secondary buttons (e.g. login/register modal buttons in Compose prototype). |
| Primary Orange text on White | `#F4511E` | `#FFFFFF` | **3.48:1** | FAIL | **PASS** | Only for large bold headlines (>= 18.66px bold or 24px normal). For regular text links, use `--color-text-accessible-orange` (`#D03D0A` = 4.82:1). |
| Primary Orange text on Page Bg | `#F4511E` | `#F8F8F4` | **3.26:1** | FAIL | **PASS** | Pass for large titles. |
| Primary Dark text on White | `#D94310` | `#FFFFFF` | **4.41:1** | FAIL (borderline) | **PASS** | For body text hyperlinks, prefer `#D03D0A` (4.82:1) or `#BF360C` (5.60:1). |
| Text Dark on White | `#1C1C1C` | `#FFFFFF` | **17.04:1** | **PASS (AAA)** | **PASS** | Standard high-contrast body & heading text. |
| Text Dark on Page Bg | `#1C1C1C` | `#F8F8F4` | **16.01:1** | **PASS (AAA)** | **PASS** | Standard page text. |
| Gray on White | `#6B6B66` | `#FFFFFF` | **5.36:1** | **PASS** | **PASS** | Excellent secondary text readability. |
| Gray on Page Bg | `#6B6B66` | `#F8F8F4` | **5.03:1** | **PASS** | **PASS** | Subtitles, time estimates, disclaimers. |
| Success Deep on Soft Green | `#1E7B4F` | `#ECF4EC` | **4.68:1** | **PASS** | **PASS** | Delivery bike banner, student discount pricing. |
| Success Deep on White | `#1E7B4F` | `#FFFFFF` | **5.25:1** | **PASS** | **PASS** | Product card discounted student price. |
| Dark text on Yellow | `#1C1C1C` | `#FCD460` | **11.95:1** | **PASS (AAA)** | **PASS** | "PRECIO ESTUDIANTE" badge, Hero banner top pill. |
| White text on Danger Red | `#FFFFFF` | `#DC3545` | **4.53:1** | **PASS** | **PASS** | Error badges, cancel buttons. |
| White text on Success Green | `#FFFFFF` | `#28A745` | **3.13:1** | FAIL | **PASS** | Used with white icon (Checkmark) on 28px circular indicator; for text use `#155724` on `#D4EDDA` (8.15:1). |

---

## 4. Screen-by-Screen Component Breakdown & Visual Hierarchy

### 4.1 Screen 1: Inicio (Home)
- **Header / Top Bar**:
  - Logo: "FOODJET" (22px ExtraBold, `#F4511E`) + Lightning bolt icon (`#F4511E`).
  - Delivery Address bar: Pin icon (`#F4511E`) + Address text (13px Medium, customer's real address or neutral fallback) + dropdown arrow.
  - Favorites button: Heart icon + Badge counter when > 0.
  - Cart button: 44px pill container (`#F4511E`, radius 14px), white bag icon + Badge counter.
  - User profile menu / Login trigger.
- **Hero Banner (`HeroCarousel`)**:
  - Container: 230px height, radius 24px, background `#F4511E`.
  - Top Pill: Yellow pill (`#FCD460`), dark text 9px ExtraBold: "POCO PRESUPUESTO. MUCHO SABOR."
  - Title: 28px - 30px ExtraBold White: "Combos Estudiantiles".
  - Subtitle: 12px White (92% opacity): "Disfruta de descuentos especiales con tu carnet".
  - CTA Button: White background, `#1C1C1C` text, 13px Bold, arrow icon, radius 14px.
  - Image: Aligned bottom-right, 150x170px, top-left radius 32px.
  - Pager dots: Pill for active (18x6px), circle for inactive (6x6px).
- **Search & Filter Section**:
  - Search field: Input with search icon, placeholder "¿Qué se te antoja hoy?", radius 16px, background White, border `#E6E4DC`. Supports max 60 chars.
  - Category Pills: Horizontal scroll. "Todos" (active if none selected) followed by categories (Hamburguesas, Pizzas, Sushi, etc.).
    - Selected: Background `#1C1C1C`, text White.
    - Unselected: Background White, border 1px `#E6E4DC`, text `#1C1C1C`.
  - Quick filters: "Filtros" (with Tune icon) and "Menos de S/ 20".
  - Expandable Filter Drawer/Panel: Price range inputs (Min, Max), Delivery time radio options ("30 minutos", "1 hora", "Más de 1 hora"), and "Limpiar filtros" button.
- **Product Grid ("Los favoritos del barrio")**:
  - Section title: 20px Bold.
  - Responsive Grid: 2 columns on mobile, 3 on tablet, 4 on desktop (gap 12px).
  - Product Card Anatomy (`ProductCard`):
    - Container: Radius 20px, background White, border 1px `#E6E4DC`.
    - Aspect ratio 1.2:1 crop image.
    - Floating tag (top-left): Yellow pill "PRECIO ESTUDIANTE" or Black pill "AGOTADO".
    - Floating heart (top-right): 32px white circle, heart icon (red/orange if favorite, dark outline if not).
    - Body (padding 12px):
      - Name: 15px Bold, max 1 line, ellipsis.
      - Description: 11px Regular, 2 lines, `#6B6B66`.
      - Delivery time: Clock icon + "15-25 min" (11px).
      - Price row: Strikethrough regular price (10px) if discount, Effective price (16px ExtraBold, `#1E7B4F` for student discount or `#1C1C1C` regular).
      - Add (+) Button: 36px box, radius 12px, background `#F4511E`, white plus icon (20px). Disabled/gray if out of stock.
- **States**:
  - Loading: CircularProgressIndicator (`#F4511E`) + "Cargando catálogo de FoodJet...".
  - Error: Error icon 54px + message + "Reintentar" button.
  - Empty catalog: Restaurant icon + "Catálogo listo para conexión" + "Sincronizar ahora".
  - Zero search results: SearchOff icon 54px + "No se encontraron productos con los filtros seleccionados."
- **Footer**: Left: "FOODJET" (`#F4511E`, 13px ExtraBold). Right: "Hecho para tus antojos." (`#6B6B66`, 11px).

### 4.2 Screen 2: Carrito (Cart Sheet / Drawer)
- **Header**:
  - Title: "Tu carrito" (24px ExtraBold).
  - Subtitle: "X productos · Y antojos" (12px `#6B6B66`).
  - Close button: 36px circular button with close icon.
- **Empty State**:
  - 🛒 icon (48px) + "Tu carrito está vacío" + "¡Agrega antojos deliciosos desde el menú!" + Button "Explorar Menú" (`#F4511E`).
- **Restaurant Card**:
  - Single restaurant enforcement: Restaurant icon in 40px peach box, Restaurant name (14px Bold), "Preparado al momento" (12px).
- **Delivery Highlight**:
  - Soft green box (`#ECF4EC`, radius 12px), Bike icon (`#1E7B4F`), "En tu puerta en X min".
- **Cart Item Row**:
  - 64px rounded image (radius 14px).
  - Product name (15px Bold).
  - Student discount badge if applicable (10px Bold, `#B78103`).
  - Quantity counter: Rounded pill/box with minus, quantity (13px Bold), plus.
  - Item total: "S/ XX.XX" (15px Bold).
- **Action Links**:
  - "Agregar más antojos" (+ icon, `#F4511E`, 13px SemiBold).
- **Financial Breakdown**:
  - Divider (`#E6E4DC`).
  - "Subtotal estimado": 16px Bold label, 20px ExtraBold amount.
  - Notice: "El envío, el IGV y los cupones se calculan al pagar." (11px).
- **Checkout CTA**:
  - Full-width button: height 56px, radius 18px, background `#F4511E`, white text 16px Bold: "Ir a pagar · S/ XX.XX" + arrow forward icon.
  - Trust badge: Lock icon (12px) + "Pago seguro. Antojos garantizados." (11px).

### 4.3 Screen 3: Checkout
- **Header**: Back arrow ("Volver al carrito"), Headline: "A un paso del antojo." (30px ExtraBold), Subtitle: "Confirma tus datos y elige cómo pagar." (13px).
- **Desktop Composition**: Two columns (left: Delivery + Payment; right: Order Summary sticky card).
- **Section 1: "¿Dónde lo llevamos?"** (`FoodJetSectionHeader` with Location icon):
  - Card: Radius 20px, border 1px `#E6E4DC`, padding 16px.
  - Name: `customerName` (>= 3 chars).
  - Phone: `customerPhone` (exactly 9 numeric digits).
  - Saved addresses: Horizontal chip scroll (`FilterChip`).
  - Address input: `customerAddress` (min 5 chars) with search button.
  - Reference: `customerReference` (optional).
  - Interactive Map (`deliveryMap`): Height 240px. Fixed center pin (`#D94310`), restaurant pin, GPS circle.
  - "Usar mi ubicación" button: GPS button with loading spinner, displays coordinates and distance to restaurant.
- **Section 2: "¿Cómo quieres pagar?"** (`FoodJetSectionHeader` with Payments icon):
  - 3 Payment Tiles (horizontal row):
    - `wallet`: "Yape / Plin", "Escanea el QR", icon `QrCode`.
    - `card`: "Tarjeta", "Crédito o débito", icon `CreditCard`.
    - `cash`: "Efectivo", "Paga al recibir", icon `AttachMoney`.
  - Tile styling: Selected tile has background `#FCF0E4` and border 1.5px `#F4511E`.
  - Conditional views:
    - Wallet: Shows QR prompt and restaurant QR modal / preview with "S/ XX.XX".
    - Card: Card number (16 digits), Expiry (MM/AA), CVC (3-4 digits).
    - Cash: "Paga contraentrega cuando recibas tu pedido."
  - Trust notice: Lock icon + "Tus pagos y datos están protegidos."
- **Section 3: "Tu pedido" (Order Summary)** (`FoodJetSectionHeader` with ShoppingBag icon):
  - Restaurant name and product count.
  - Item list with 52px thumbnails, names, quantities, and line totals.
  - Coupon Code input: TextField + "Aplicar" button.
    - Valid backend coupons: `PruebaCupon` (10%) and `FOODJET20` (20%).
    - Success feedback: Soft green box (`#ECF4EC`), `#1E7B4F` text.
    - Error feedback: Clear red error text.
  - Financial summary:
    - Subtotal
    - Descuento (X%) in green if applied
    - Impuestos (18% IGV)
    - Costo de Delivery (S/ 5.00)
    - Total a Pagar (18px Bold label, 22px ExtraBold `#F4511E`)
    - Footnote: "El servidor confirma el importe final al registrar el pedido."
  - Submit CTA: Height 56px, radius 18px, background `#F4511E`, label "Confirmar pedido · S/ XX.XX" (or "Ya pagué · S/ XX.XX" if wallet) + ArrowForward icon. Includes submission loading spinner.

### 4.4 Screen 4: Seguimiento (Order Tracking)
- **Headline**:
  - When in transit (`en_camino`): "¡Tu antojo va volando!" (28px ExtraBold).
  - Other states: "Sigue tu pedido".
  - Subtitle: "Pedido #X · Sigue cada parte del viaje."
- **Map Section (`MapaFoodJet`)**:
  - Height: 260px (mobile) to 480px (desktop).
  - Live status badge: Floating pill top-left with pulsing green dot (`#28A745`, 7px) and "Actualizando en vivo" (11px SemiBold). Disconnection/reconnection banner if network fails.
  - Route lines: Traveled route in gray (`#6C757D`, 5px), Remaining route in orange (`#F4511E` / `#F39D4A`, 5px).
  - Markers: Restaurant pin (`#1A1A1A`), Destination pin (`#F4511E`), Courier icon (green circle with white bike).
  - Distance & Map Actions: "Recorrido: X km" + button "Abrir en Mapas" (external map trigger).
- **Current Status Card (`EstadoActual`)**:
  - Pulsing status dot (8px) with status color.
  - Uppercase state header: "CONFIRMANDO TU PEDIDO", "¡PEDIDO CONFIRMADO!", "PREPARANDO TU PEDIDO", "¡PEDIDO EN CAMINO!", "¡PEDIDO ENTREGADO!", "PEDIDO CANCELADO".
  - Large countdown display: 34px ExtraBold (e.g. "12-19 min").
  - Description: Status explanation text.
  - Timestamp: "Llegada estimada: HH:mm" or "Entregado a las HH:mm".
- **Timeline Card (`LineaDeTiempo`)**:
  - 4 stages: Confirmación, Preparación, En camino, Entregado.
  - Indicator: 28px circle.
    - Completed: Background `#28A745` with white checkmark.
    - In progress: Background `#F4511E` with white bicycle icon and pill badge "Ahora" (`#FCF0E4` bg, `#F4511E` text).
    - Pending: Background `#E6E4DC`.
  - Connecting line: 2px width, green if reached, gray border if pending.
  - Time label: Real timestamp or estimated ("HH:mm aprox.").
- **Live In-Transit Card (`TarjetaReparto`)**:
  - Displayed exclusively during `en_camino`.
  - Bicycle icon + "Reparto en vivo" + remaining time.
  - LinearProgressBar: 8px height, radius 4px, color `#F4511E`.
  - Status: "X% recorrido" | "Faltan X m / km".
  - Honest simulation notice: "Reparto simulado por el servidor: la posición sale de la ruta y la hora de salida, no del GPS de un repartidor."
- **Actions**:
  - "Cancelar Pedido" (OutlinedButton, red border and text, enabled only while order is cancelable: `pendiente`).
  - "Volver al Menú" (50px height, background `#F4511E`).
  - "Ver Historial de Pedidos" (TextButton).

### 4.5 Secondary Views
1. **Historial de Pedidos (`OrderHistoryScreen` / `orderHistoryView`)**:
   - Order cards with status pill badge, date/time, item breakdown, financial summary.
   - Button "Rastrear Pedido en Vivo" for active orders.
   - "Dejar una Reseña" (star rating + comment) for delivered orders.
2. **Favoritos (`FavoritesScreen` / `favoritesOffcanvas`)**:
   - Offcanvas drawer / page with list of favorited items, prices (with student discount if active), remove button, and "Agregar al carrito" button.
3. **Mi Cuenta & Verificación de Estudiante (`MiCuentaDialog` / `miCuentaModal`)**:
   - User profile info, Student status banner (Active student in green `#1E7B4F` with discount confirmation; or Regular account with "Verificar Estudiante" trigger).
   - Server switcher (if multiple environments).
   - "Panel de Operaciones Admin" button (visible only for admin accounts).
   - Logout button (`#DC3545`).
4. **Panel de Operaciones Admin (`AdminDashboardScreen` / `dashboardView`)**:
   - KPI metrics: Total sales, active orders count.
   - Active orders table/list: Order ID, customer name, restaurant, total, current status, and "Avanzar" button to step order to next state (`pendiente -> confirmado -> en_preparacion -> en_camino -> entregado`).
   - Analytics charts: Sales by last 7 days bar chart, sales by restaurant breakdown bar, orders by status count.

---

## 5. Features Discovered & Specification Matrix

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| 1 | Visual Tokens | Color Palette System | Centralized CSS tokens for brand orange, peach, dark neutral, gray, background, and state colors | CSS custom properties | Consistent styling across components | Fallback to Bootstrap variables | `Color.kt` & `ORIGINAL_REQUEST.md` |
| 2 | Visual Tokens | Typography Scale | 8-level typographic scale from Micro (8px) to Display Large (30px) | CSS font size & line height variables | Hierarchical text rendering | Fallback to system sans-serif | `Type.kt` & screen inspection |
| 3 | Visual Tokens | Radius & Border Tokens | Rounded aesthetic with 20px card radius, 18px CTA radius, and 50% pill chips | CSS border-radius tokens | Soft, friendly UI aesthetic | Default 0px | Compose components & Figma thumbnail |
| 4 | Navigation | Top Navigation Bar | Responsive header with logo, address bar, favorites, cart trigger, and user menu | User clicks, cart count, favorites count | Navigation, drawer opens, address modal | Retains default state if unauthenticated | `FoodJetTopBar.kt` & `index.html` |
| 5 | Navigation | Bottom Navigation Bar (Mobile) | Fixed mobile bottom nav bar (Inicio, Explorar, Pedidos, Mi Perfil) | Route selection | View switching | Visible only on mobile viewport | `FoodJetBottomBar.kt` & Figma thumbnail |
| 6 | Home / Catalog | Hero Carousel | Promotional banner with student discount highlight, title, subtitle, and CTA button | Slide data array, click handler | Animated slide transitions & action navigation | Fallback to static banner if empty | `HeroCarousel.kt` |
| 7 | Home / Catalog | Category Pill Filter | Horizontal scrolling pills to filter catalog by category ("Todos" + food types) | Category selection click | Filtered product grid | Defaults to all products | `FilterSection.kt` |
| 8 | Home / Catalog | Fast & Advanced Filters | Quick price filter ("Menos de S/ 20") and expandable drawer for price range & delivery time | Min price, max price, delivery time | Dynamically filtered catalog | "Limpiar filtros" resets all | `FilterSection.kt` |
| 9 | Home / Catalog | Search Input | Reactive search box for products by name and description with clear trigger | Text string (max 60 chars) | Real-time filtered grid | Shows `SearchOff` empty state if 0 matches | `HomeScreen.kt` |
| 10 | Home / Catalog | Product Card Component | 20px radius card with image, floating student/sold-out tag, favorite toggle, time, price, and add (+) button | `ProductItem`, `isFavorite`, `isStudent` | Rendered card with interactive triggers | Disables (+) if out of stock | `ProductCard.kt` |
| 11 | Home / Catalog | Catalog State Views | 4 reactive states: Loading spinner, Error with retry, Empty catalog info, and Success grid | `UiState` enum | Tailored user feedback | Clean retry trigger on network error | `HomeScreen.kt` & `UiState.kt` |
| 12 | Cart | Single Restaurant Enforcement | Ensures orders only contain items from a single restaurant | Product add event | Cart item addition or restaurant mismatch alert | Prompts user before clearing cart | `CartSheet.kt` & business rules |
| 13 | Cart | Quantity Controls & Item Removal | Increments, decrements, or removes cart items with reactive total recalculation | Plus / Minus buttons | Updated item quantity & totals | Decrementing below 1 removes item | `CartSheet.kt` |
| 14 | Cart | Delivery Estimation Banner | Soft green highlight box showing restaurant delivery ETA | Restaurant data | Formatted ETA (e.g. "En tu puerta en 25 min") | Hidden if cart empty | `CartSheet.kt` |
| 15 | Checkout | Delivery Info Form | Form collecting customer name (>=3 chars), phone (9 digits), and address (>=5 chars) | Text inputs | Validated customer details | Inline error messages on invalid input | `CheckoutScreen.kt` |
| 16 | Checkout | Delivery Map Pin Selector | Interactive map with fixed center pin allowing customer to pinpoint delivery location | Map pan & zoom gestures, GPS button | `latitud` and `longitud` coordinates | Schematic fallback if Google Maps fails | `MapaFoodJet.kt` & `mapaEntrega.js` |
| 17 | Checkout | Payment Method Tiles | 3 selectable payment options: Yape/Plin (wallet), Card, and Cash | Tile selection click | Active payment method view | Card fields require validation; Cash requires none | `CheckoutScreen.kt` |
| 18 | Checkout | Coupon Code Validator | Validates promo coupons against backend seeds (`PruebaCupon`, `FOODJET20`) | Coupon code string | Discount percentage & green success badge | Error message on invalid/expired code | `CheckoutScreen.kt` & `seed.js` |
| 19 | Checkout | Financial Breakdown Summary | Real-time calculation of subtotal, student discount, coupon discount, 18% IGV, and delivery fee | Cart items & applied coupon | Detailed pricing breakdown | Prevents negative totals via `coerceAtLeast` | `CheckoutScreen.kt` |
| 20 | Checkout | Simulated Payment Submission | Submits order to `POST /api/pedidos`, handling loading state and duplicate submission prevention | Confirm click | Order creation & navigation to tracking | Error alert on network or validation failure | `CheckoutScreen.kt` & `api.js` |
| 21 | Tracking | Real-Time Live Map | Interactive map with courier route, remaining route, restaurant pin, and courier animation | OSRM route points, courier speed, elapsed time | Animated bike movement along route | Falls back to straight line if OSRM down | `TrackingScreen.kt` & `seguimiento.js` |
| 22 | Tracking | Live Status & Countdown Badge | Floating badge with pulsing green dot and live ETA countdown (e.g. "12-19 min") | Polling updates & simulation clock | Formatted remaining time | Disconnection warning if polling fails | `TrackingScreen.kt` |
| 23 | Tracking | Order Status Timeline | 4-step timeline showing confirmation, preparation, in-transit, and delivered with real vs. estimated times | `OrderStatusHistory` entries & time plan | Stepper indicators and "Ahora" badge | Estimated times labeled with "aprox." | `TrackingScreen.kt` |
| 24 | Tracking | Order Cancellation | Allows customer to cancel order while still in `pendiente` state | "Cancelar Pedido" button click | `OrderStatus.CANCELADO` transition | Hidden once order is confirmed/in preparation | `TrackingScreen.kt` & `estadoPedido.js` |
| 25 | Secondary | Student Verification Flow | Upload of student ID / institutional email to unlock student discounts | Student verification submit | `es_estudiante: true` status update | Error on invalid submission | `Modals.kt` & `index.html` |
| 26 | Secondary | Review & Rating Dialog | 5-star rating bar + comment input for delivered orders | Stars (1-5), comment text | Stored review on order record | Requires delivered status | `Modals.kt` & `StarRatingBar.kt` |
| 27 | Secondary | Admin Operations Panel | Operational dashboard allowing staff/admin to view active orders and advance states manually | "Avanzar" button clicks | Step-by-step state progression | Unauthorized for non-admin accounts | `AdminDashboardScreen.kt` |

---

## 6. Edge Cases & Observed Behavior

| # | Feature | Input / Scenario | Observed / Specified Behavior |
|---|---|---|---|
| 1 | Product Grid | Product marked `disponibilidad: false` | Floating black badge "AGOTADO" is displayed; add button (+) turns gray and click is disabled; card remains visible in catalog. |
| 2 | Product Grid | Active student account viewing student combo | Strikethrough regular price is displayed; effective price rendered in bold deep green (`#1E7B4F`); floating yellow badge "PRECIO ESTUDIANTE" displayed. |
| 3 | Filter Section | Search query with no matching products | Grid shows centered `SearchOff` icon (54px) with message: "No se encontraron productos con los filtros seleccionados." |
| 4 | Cart Management | User adds product from Restaurant B while Cart has items from Restaurant A | System detects restaurant mismatch and displays confirmation modal warning that adding from Restaurant B will clear items from Restaurant A. |
| 5 | Cart Counter | Quantity decremented to 0 | Item is automatically removed from cart; if cart becomes empty, view switches to empty cart illustration ("🛒"). |
| 6 | Checkout Form | Phone number with letters or fewer than 9 digits | Validation blocks submission; field outline turns red (`isError`); supporting text displays: "Debe tener exactamente 9 dígitos numéricos". |
| 7 | Checkout Map | Google Maps API key rejected (`gm_authFailure`) or network failure | Map gracefully degrades: retires failed `<script>`, attempts secondary key, or renders schematic SVG route view (`RutaEsquematica`) with warning: "Esquema sin mapa · Google Maps rechazó la key". User can still place order. |
| 8 | Checkout Map | Customer manually types address after pin selection | System detects manual edit (`textoEditadoAMano = true`) and preserves customer's typed text without overriding it with reverse geocoder results. |
| 9 | Checkout Coupon | Customer enters invalid code (e.g. `DESCUENTO50`) | Input displays error message: "Código de cupón no válido"; discount remains 0; total is not modified. |
| 10 | Checkout Coupon | Customer enters valid code in lowercase (e.g. `foodjet20`) | Code is normalized via case-insensitive matching; 20% discount is applied; green notification badge displays: "Cupón 'FOODJET20' (20%) aplicado". |
| 11 | Checkout Submit | Customer double-clicks or rapidly taps "Confirmar pedido" | Submit button is immediately disabled (`isSubmitting = true`), shows circular spinner, and blocks duplicate API requests. |
| 12 | Tracking Map | User loses internet connection during live tracking polling | Polling fails; top warning banner appears: "Sin conexión con el servidor: se muestra el último estado conocido. Se reintentará automáticamente"; live dot stops pulsing; simulation clock continues until reconnection. |
| 13 | Tracking Cancel | Order has already transitioned to `en_preparacion` or `en_camino` | "Cancelar Pedido" button is automatically hidden/disabled because `order.estado.isCancelable` is false once preparation begins. |
| 14 | Responsive Viewport | Narrow screen mobile viewport (360px - 390px) | Single column layout; bottom navigation bar fixed; floating action button or cart summary sticky above bottom bar without overlapping content or keyboard. |
| 15 | Responsive Viewport | Wide desktop screen (1280px - 1440px) | Two-column checkout layout (left form, right summary sticky card); 4-column product grid; no horizontal scrollbar at any viewport. |

---

## 7. Discrepancy & Accessibility Report (Figma vs. Android Prototype vs. Web)

1. **Figma vs. Local Prototype Parity**:
   - The local Android Jetpack Compose codebase was built to faithfully implement the `FOODJET-BUSS-PROJ` Figma design.
   - The Figma design canvas is an interactive WebGL client requiring user session cookies for direct node inspection. However, high-resolution canvas thumbnails retrieved via Figma's OEmbed endpoint confirm that the local Android prototype screens (`HomeScreen`, `CartSheet`, `CheckoutScreen`, `TrackingScreen`, `Modals`) are 1:1 reflections of the Figma artboards.
2. **Delivery Address in Header**:
   - In the Android prototype, the top bar displays a hardcoded placeholder: `"Av. Larco 812, Miraflores"`.
   - **Requirement Adjustment**: As mandated in `ORIGINAL_REQUEST.md` (R1), the Web implementation must NOT hardcode this address. It must display the customer's actual saved/active delivery address if logged in, or a neutral invitation state ("Selecciona tu dirección de entrega") if unauthenticated.
3. **Contrast Compliance & Accessible Text Orange**:
   - Primary orange (`#F4511E`) has a contrast ratio of 3.48:1 against white and 3.26:1 against `#F8F8F4`.
   - While 3.48:1 passes WCAG AA for Large Text (>= 18.66px bold or >= 24px normal), it fails the 4.5:1 threshold for normal body text.
   - **Recommendation**:
     - Buttons with `#F4511E` background should use bold text (>= 16px bold) or dark text `#1C1C1C` (4.90:1).
     - Text links, small labels, and icon accents on white or light backgrounds should use `--color-text-accessible-orange` (`#D03D0A` = 4.82:1 or `#BF360C` = 5.60:1) to guarantee strict WCAG AA conformance.
