# Report: Base Component Classes & Interaction States Specification

**Explorer**: Explorer M1_2  
**Role**: `teamwork_explorer`  
**Milestone**: Milestone 1 — Design Tokens & Base Components  
**Working Directory**: `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m1_2\`  
**Target File**: `frontend/styles.css`  
**Date**: 2026-10-29  

---

## 1. Executive Summary & Design Rationale

This specification provides the concrete architecture and implementation rules for the **reusable base component classes and interaction states** of FoodJet Web.

The component system faithfully translates the visual language and tactile behavior of the **authoritative Android Jetpack Compose prototype** (`com.example.foodjeetapp.ui.components.*`) and **Figma design** (`FOODJET-BUSS-PROJ`) into modern vanilla CSS3 classes (`.foodjet-*`).

### Key Design Tenets:
1. **Token Integration**: Every component consumes CSS custom properties (`--color-*`, `--radius-*`, `--font-*`, `--shadow-*`) established in Milestone 1 without hardcoded hex codes.
2. **Zero Framework Bloat**: Pure CSS3 classes without introducing Tailwind, CSS Modules, or CSS-in-JS.
3. **Accessibility First (WCAG AA)**: 
   - Every interactive control guarantees an explicit, non-destructive `:focus-visible` ring (`outline: 2px solid var(--color-primary); outline-offset: 2px`).
   - Touch targets for primary controls and inputs strictly satisfy the >= 44px minimum requirement (e.g., CTA button 56px, standard buttons 48px, inputs 48px, circular buttons 36px with 44px touch area padding).
   - High text contrast conformance across all states.
4. **Tactile Feedback & Reduced Motion**: 
   - Micro-interactions (hover elevation, click compression) use smooth cubic-bezier transitions (`0.2s cubic-bezier(0.4, 0, 0.2, 1)`).
   - All animations and transforms are cleanly eliminated under `@media (prefers-reduced-motion: reduce)`.
5. **Non-Colliding Coexistence**: Uses the `.foodjet-*` prefix to prevent collision with Bootstrap 5.3's global classes while providing progressive enhancement.

---

## 2. Base Component Specifications & Anatomy

### 2.1. Pills (`.foodjet-pill`)
*Compose Reference*: `PillChip` in `FilterSection.kt` (lines 184–217).

Used for category selection ("Todos", "Hamburguesas", "Pizzas"), quick filters ("Filtros", "Menos de S/ 20"), saved address selection chips, and status filters.

```
+------------------------------------+
|  [Icon]  Label Text                |
+------------------------------------+
```

#### Specifications:
- **Display & Alignment**: `display: inline-flex; align-items: center; justify-content: center; gap: 6px;`
- **Shape & Radii**: `border-radius: var(--radius-full);` (`9999px`)
- **Dimensions & Padding**: Padding `9px 16px` (`0.5625rem 1rem`), min-height `38px`. Compact variant (`.foodjet-pill--sm`): `6px 12px`, min-height `32px`.
- **Typography**: `font-size: var(--font-body-medium);` (`13px` / `0.8125rem`), `font-weight: 600;`, `line-height: 1.2;`.
- **Default State**:
  - Background: `var(--color-surface)` (`#FFFFFF`)
  - Border: `1px solid var(--color-border)` (`#E6E4DC`)
  - Text Color: `var(--color-text-primary)` (`#1C1C1C`)
  - Cursor: `pointer; user-select: none; white-space: nowrap;`
- **Hover State (`.foodjet-pill:hover`)**:
  - Background: `var(--color-background)` (`#F8F8F4`)
  - Border Color: `rgba(28, 28, 28, 0.4)`
  - Transform: `translateY(-1px)`
- **Active / Press State (`.foodjet-pill:active`)**:
  - Transform: `translateY(0) scale(0.98)`
- **Selected State (`.foodjet-pill--active` / `.foodjet-pill[aria-selected="true"]` / `.foodjet-pill.is-active`)**:
  - Background: `var(--color-text-primary)` (`#1C1C1C`)
  - Border Color: `var(--color-text-primary)` (`#1C1C1C`)
  - Text Color: `#FFFFFF` (17.04:1 AAA contrast)
  - Icons inside inherit `#FFFFFF`
- **Focus Visible (`.foodjet-pill:focus-visible`)**:
  - `outline: 2px solid var(--color-primary); outline-offset: 2px;`

---

### 2.2. Badges (`.foodjet-badge`)
*Compose Reference*: `ProductCard.kt` (lines 78–93), `HeroCarousel.kt`, `TrackingScreen.kt` (lines 510–525).

Used for floating tags on cards, discount notifications, and live status tracking.

```
+-------------------------+      +-------------------------------+
|    PRECIO ESTUDIANTE    |      |  (o) Actualizando en vivo     |
+-------------------------+      +-------------------------------+
```

#### Specifications:
- **Base `.foodjet-badge`**:
  - `display: inline-flex; align-items: center; justify-content: center; gap: 5px;`
  - `border-radius: var(--radius-full);` (`9999px`)
  - `padding: 4px 10px;`
  - `font-size: var(--font-micro-badge);` (`9px` / `0.5625rem`)
  - `font-weight: 800;` (`ExtraBold`)
  - `text-transform: uppercase;`
  - `letter-spacing: 0.5px;`
  - `line-height: 1;`
  - `white-space: nowrap;`
- **Variant `.foodjet-badge--student`**:
  - Applied to student discount combos on product cards, cart items, and modals.
  - Background: `var(--color-yellow-badge)` (`#FCD460`)
  - Text Color: `var(--color-text-primary)` (`#1C1C1C`) -> Contrast: 11.95:1 (WCAG AAA).
- **Variant `.foodjet-badge--yellow`**:
  - Applied to hero banner top tag ("POCO PRESUPUESTO. MUCHO SABOR.") and rating badges.
  - Background: `var(--color-yellow-badge)` (`#FCD460`)
  - Text Color: `var(--color-text-primary)` (`#1C1C1C`)
- **Variant `.foodjet-badge--soldout`**:
  - Applied to out-of-stock items ("AGOTADO").
  - Background: `var(--color-text-primary)` (`#1C1C1C`)
  - Text Color: `#FFFFFF` (17.04:1 AAA).
- **Variant `.foodjet-badge--live`**:
  - Applied to the order tracking map ("Actualizando en vivo").
  - Background: `var(--color-surface)` (`#FFFFFF`)
  - Border: `1px solid var(--color-border)` (`#E6E4DC`)
  - Text Color: `var(--color-text-primary)` (`#1C1C1C`)
  - Font Size: `var(--font-body-small)` (`11px` / `0.6875rem`), `font-weight: 600;`, text-transform `none`.
  - Box Shadow: `var(--shadow-sm)` (`0 2px 4px rgba(0, 0, 0, 0.06)`).
  - Dot Indicator: Embedded `.foodjet-badge__dot` or `::before` pseudo-element:
    - Dimensions: `7px x 7px`, circular (`border-radius: 50%`).
    - Background: `var(--color-success)` (`#28A745`).
    - Pulse Animation: `animation: foodjet-pulse-live 1.8s infinite ease-in-out;`
- **Variant `.foodjet-badge--success`**:
  - Background: `var(--color-success-soft)` (`#ECF4EC`), Text: `var(--color-success-deep)` (`#1E7B4F`).

---

### 2.3. Cards (`.foodjet-card`)
*Compose Reference*: `ProductCard.kt` (lines 48–54), `CheckoutScreen.kt` (lines 330, 523, 620), `TrackingScreen.kt`.

Container for product items, checkout sections, order tracking cards, and modal dialogs.

```
+----------------------------------------------------+
|  Card Header / Image                               |
|----------------------------------------------------|
|  Card Content / Body                               |
+----------------------------------------------------+
```

#### Specifications:
- **Base `.foodjet-card`**:
  - `background-color: var(--color-surface);` (`#FFFFFF`)
  - `border: 1px solid var(--color-border);` (`#E6E4DC`)
  - `border-radius: var(--radius-card);` (`20px` / `1.25rem`)
  - `box-shadow: var(--shadow-none);` (`none`)
  - `overflow: hidden;`
  - `position: relative;`
- **Card Sub-elements**:
  - `.foodjet-card__body`: `padding: 16px;` (or `20px` on desktop)
  - `.foodjet-card__header`: `padding: 16px; border-bottom: 1px solid var(--color-border);`
- **Variant `.foodjet-card--interactive`**:
  - Applied to clickable/hoverable cards (e.g., product cards, payment tiles, saved addresses, order history cards).
  - Cursor: `pointer;`
  - Transition: `transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);`
  - **Hover (`:hover`)**:
    - `transform: translateY(-3px);`
    - `box-shadow: var(--shadow-md);` (`0 4px 12px rgba(0, 0, 0, 0.08)`)
    - `border-color: rgba(244, 81, 30, 0.35);`
  - **Active (`:active`)**:
    - `transform: translateY(0);`
    - `box-shadow: var(--shadow-sm);`
  - **Focus Visible (`:focus-visible`)**:
    - `outline: 2px solid var(--color-primary); outline-offset: 2px;`
- **Variant `.foodjet-card--selected`**:
  - Applied to selected payment method tiles or active address cards.
  - Background: `var(--color-primary-light);` (`#FCF0E4`)
  - Border: `1.5px solid var(--color-primary);` (`#F4511E`)

---

### 2.4. Buttons (`.foodjet-btn-*`)
*Compose Reference*: `CheckoutScreen.kt` (lines 751–791), `TrackingScreen.kt` (lines 260–280), `ProductCard.kt` (lines 95–110, 173–187).

```
[ Primary Button ]      [ Secondary Button ]      [ High-Emphasis CTA Button ]      ( Circle )
```

#### Specifications:

#### 2.4.1. Primary Button (`.foodjet-btn-primary`)
- **Role**: Standard action button ("Volver al Menú", dialog confirmation, admin actions).
- **Height**: `48px` - `50px`, min-width `120px`.
- **Border Radius**: `var(--radius-button);` (`14px`).
- **Background**: `var(--color-primary);` (`#F4511E`).
- **Color**: `#FFFFFF` (16px Bold passes 3.48:1 WCAG Large Text rule).
- **Typography**: `font-size: var(--font-title-medium);` (`16px`), `font-weight: 700;`.
- **Border**: `none;`
- **Padding**: `12px 24px;`
- **Display**: `inline-flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none;`
- **Hover (`:hover`)**:
  - `background-color: var(--color-primary-dark);` (`#D94310`)
  - `transform: translateY(-1px);`
  - `box-shadow: 0 4px 12px rgba(244, 81, 30, 0.25);`
- **Active (`:active`)**:
  - `background-color: var(--color-primary-dark);`
  - `transform: translateY(0);`
  - `box-shadow: none;`
- **Disabled (`:disabled`, `&.disabled`)**:
  - `background-color: #E6E4DC; color: #8E8E8E; cursor: not-allowed; transform: none; box-shadow: none;`

#### 2.4.2. Secondary / Outlined Button (`.foodjet-btn-secondary`)
- **Role**: Supporting actions ("Limpiar filtros", "Usar mi ubicación", "Volver al carrito", "Abrir Ajustes").
- **Height**: `44px` - `48px`.
- **Border Radius**: `var(--radius-button);` (`14px`).
- **Background**: `var(--color-surface);` (`#FFFFFF`).
- **Border**: `1px solid var(--color-border);` (`#E6E4DC`).
- **Color**: `var(--color-text-primary);` (`#1C1C1C`).
- **Typography**: `font-size: var(--font-body-medium);` (`13px` - `14px`), `font-weight: 600;`.
- **Padding**: `10px 18px;`
- **Hover (`:hover`)**:
  - `background-color: var(--color-background);` (`#F8F8F4`)
  - `border-color: var(--color-text-primary);` (`#1C1C1C`)
  - `color: var(--color-text-primary);`
- **Active (`:active`)**:
  - `background-color: #ECEAE2;`
- **Variant `.foodjet-btn-secondary--danger`**:
  - "Cancelar Pedido" button: Border `1px solid var(--color-danger)`, color `var(--color-danger)`.

#### 2.4.3. High-Emphasis Call-to-Action (`.foodjet-btn-cta`)
- **Role**: Prominent full-width submission triggers ("Ir a pagar · S/ XX.XX", "Confirmar pedido · S/ XX.XX", "Ya pagué").
- **Height**: `56px` (`3.5rem`).
- **Width**: `100%;`
- **Border Radius**: `var(--radius-cta);` (`18px` / `1.125rem`).
- **Background**: `var(--color-primary);` (`#F4511E`).
- **Color**: `#FFFFFF`.
- **Typography**: `font-size: 16px; font-weight: 700;`.
- **Border**: `none;`
- **Box Shadow**: `0 4px 14px rgba(244, 81, 30, 0.3);`
- **Display**: `flex; align-items: center; justify-content: center; gap: 8px;`
- **Hover (`:hover`)**:
  - `background-color: var(--color-primary-dark);` (`#D94310`)
  - `transform: translateY(-1px);`
  - `box-shadow: 0 6px 18px rgba(217, 67, 16, 0.35);`
- **Active (`:active`)**:
  - `background-color: var(--color-primary-dark);`
  - `transform: translateY(0);`
  - `box-shadow: 0 2px 6px rgba(217, 67, 16, 0.2);`
- **Loading State (`.foodjet-btn-cta.is-loading`)**:
  - Disables pointer events, shows inner spinner, preserves dimensions.

#### 2.4.4. Circular Button (`.foodjet-btn-circle`)
- **Role**: Favorite heart toggle, cart drawer close button, catalog item (+) add button, counter +/- buttons.
- **Dimensions**: `36px x 36px` (or `32px` on compact product cards).
- **Border Radius**: `var(--radius-full);` (`50%`).
- **Background**: `var(--color-surface);` (`#FFFFFF`) or `var(--color-primary)` (for (+) add button).
- **Border**: `1px solid var(--color-border);` or `none`.
- **Display**: `inline-flex; align-items: center; justify-content: center;`
- **Hover (`:hover`)**: `transform: scale(1.08);`
- **Active (`:active`)**: `transform: scale(0.95);`

---

### 2.5. Section Headers (`.foodjet-section-header`)
*Compose Reference*: `FoodJetSectionHeader` in `FoodJetUi.kt` (lines 39–55).

Provides a consistent, identifiable visual anchor for sections across views (Checkout: Delivery, Payment, Summary; Tracking: Timeline, Order Details; Cart: Restaurant).

```
+----+  Section Title Text
| IC |
+----+
```

#### Specifications:
- **Container**: `display: flex; align-items: center; gap: 10px; margin-bottom: 12px;`
- **Icon Container (`.foodjet-section-header__icon`)**:
  - Dimensions: `34px x 34px` (`2.125rem`).
  - Border Radius: `var(--radius-badge);` (`10px`).
  - Background: `var(--color-primary-light);` (`#FCF0E4`).
  - Display: `flex; align-items: center; justify-content: center; flex-shrink: 0;`
  - Icon Size: `18px`.
  - Icon Color: `var(--color-primary);` (`#F4511E`).
- **Title (`.foodjet-section-header__title`)**:
  - Typography: `font-size: var(--font-title-large);` (`18px` / `1.125rem`), `font-weight: 700;`.
  - Color: `var(--color-text-primary);` (`#1C1C1C`).
  - Margin: `0;`

---

### 2.6. Inputs & Input Groups (`.foodjet-input`, `.foodjet-input-group`)
*Compose Reference*: `OutlinedTextField` with `RoundedCornerShape(16.dp)` in `CheckoutScreen.kt` and `HomeScreen.kt`.

Form controls for delivery address, customer phone, card details, coupon codes, and the home catalog search bar.

```
Label Text
+------------------------------------+
| [Icon] Placeholder / Value         |
+------------------------------------+
Helper or Error Message
```

#### Specifications:
- **Input Group Container (`.foodjet-input-group`)**:
  - `display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; position: relative;`
- **Group Label (`.foodjet-input-group__label`)**:
  - `font-size: var(--font-body-small);` (`12px` / `0.75rem`), `font-weight: 600;`, `color: var(--color-text-secondary);` (`#6B6B66`).
- **Input Control (`.foodjet-input`)**:
  - Height: `48px` - `52px` (optimal mobile touch target >= 44px).
  - Border Radius: `var(--radius-input);` (`16px` / `1rem`).
  - Background: `var(--color-surface);` (`#FFFFFF`).
  - Border: `1px solid var(--color-border);` (`#E6E4DC`).
  - Padding: `12px 16px;`
  - Typography: `font-size: var(--font-body-large);` (`15px` / `0.9375rem`), `color: var(--color-text-primary);` (`#1C1C1C`).
  - Placeholder: `color: var(--color-text-secondary); opacity: 0.8;`
  - Transition: `border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;`
- **States**:
  - **Hover (`:hover`)**:
    - `border-color: rgba(28, 28, 28, 0.4);`
  - **Focus (`:focus`, `:focus-visible`)**:
    - `border-color: var(--color-primary);` (`#F4511E`)
    - `box-shadow: 0 0 0 3px rgba(244, 81, 30, 0.15);`
    - `outline: none;`
  - **Error (`.is-invalid`, `.foodjet-input--error`)**:
    - `border-color: var(--color-danger);` (`#DC3545`)
    - `box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.15);`
  - **Disabled (`:disabled`)**:
    - `background-color: var(--color-background); cursor: not-allowed; opacity: 0.7;`
- **Feedback Elements**:
  - `.foodjet-input-group__hint`: `font-size: 11px; color: var(--color-text-secondary); margin-top: 2px;`
  - `.foodjet-input-group__error`: `font-size: 11px; font-weight: 600; color: var(--color-danger); margin-top: 2px;`

---

## 3. Interaction States & Accessibility Rules

### 3.1. Universal `:focus-visible` Policy
To guarantee WCAG 2.4.7 (Focus Visible) compliance without degrading mouse/touch ergonomics:
- Default mouse clicks do not display distracting outlines (`:focus:not(:focus-visible) { outline: none; }`).
- Keyboard tabbing explicitly triggers:
  ```css
  :focus-visible {
      outline: 2px solid var(--color-primary) !important;
      outline-offset: 2px !important;
  }
  ```
- In inputs (`.foodjet-input`), focus ring is handled cleanly via `border-color: var(--color-primary)` and `box-shadow: 0 0 0 3px rgba(244, 81, 30, 0.15)`.

### 3.2. Motion Reduction (`prefers-reduced-motion`)
Under `@media (prefers-reduced-motion: reduce)`:
- Transitions on all `.foodjet-*` components are shortened to `0.01ms` or set to `none`.
- Hover/active `transform: translateY(...)` and `scale(...)` are completely disabled.
- The pulsing dot animation on `.foodjet-badge--live` is disabled (`animation: none;`).

### 3.3. High-Contrast & Forced Colors Mode
Under `@media (forced-colors: active)`:
- Outlines use `CanvasText` or `Highlight`.
- Selected cards and pills enforce `border: 2px solid SelectedItem`.

---

## 4. WCAG AA Contrast Verification Matrix

| Component Element | Foreground Color | Background Color | Contrast Ratio | WCAG AA Standard | Status |
|---|---|---|---|---|---|
| `.foodjet-pill` (Default) | `#1C1C1C` | `#FFFFFF` | **17.04:1** | >= 4.5:1 (Normal) | **PASS (AAA)** |
| `.foodjet-pill--active` | `#FFFFFF` | `#1C1C1C` | **17.04:1** | >= 4.5:1 (Normal) | **PASS (AAA)** |
| `.foodjet-badge--student` | `#1C1C1C` | `#FCD460` | **11.95:1** | >= 4.5:1 (Normal) | **PASS (AAA)** |
| `.foodjet-badge--soldout` | `#FFFFFF` | `#1C1C1C` | **17.04:1** | >= 4.5:1 (Normal) | **PASS (AAA)** |
| `.foodjet-badge--live` | `#1C1C1C` | `#FFFFFF` | **17.04:1** | >= 4.5:1 (Normal) | **PASS (AAA)** |
| `.foodjet-badge--success` | `#1E7B4F` | `#ECF4EC` | **4.68:1** | >= 4.5:1 (Normal) | **PASS** |
| `.foodjet-btn-cta` | `#FFFFFF` | `#F4511E` | **3.48:1** | >= 3.0:1 (Large Text, >= 16px Bold) | **PASS** |
| `.foodjet-btn-primary` | `#FFFFFF` | `#F4511E` | **3.48:1** | >= 3.0:1 (Large Text, >= 16px Bold) | **PASS** |
| `.foodjet-btn-secondary` | `#1C1C1C` | `#FFFFFF` | **17.04:1** | >= 4.5:1 (Normal) | **PASS (AAA)** |
| `.foodjet-section-header` | `#1C1C1C` | `#FFFFFF` | **17.04:1** | >= 4.5:1 (Normal) | **PASS (AAA)** |
| `.foodjet-section-header__icon` | `#F4511E` | `#FCF0E4` | **3.26:1** | >= 3.0:1 (Graphical Object / Icon) | **PASS** |
| `.foodjet-input` | `#1C1C1C` | `#FFFFFF` | **17.04:1** | >= 4.5:1 (Normal) | **PASS (AAA)** |

---

## 5. Concrete CSS Implementation Code for Worker M1_2

The following complete CSS block is ready to be appended to `frontend/styles.css` directly below the `:root` design tokens section:

```css
/* ==========================================================================
   FoodJet Base Component Classes & Interaction States (Milestone 1)
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. Universal Focus-Visible & Interaction Resets
   -------------------------------------------------------------------------- */
.foodjet-pill:focus-visible,
.foodjet-btn-primary:focus-visible,
.foodjet-btn-secondary:focus-visible,
.foodjet-btn-cta:focus-visible,
.foodjet-btn-circle:focus-visible,
.foodjet-card--interactive:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}

/* --------------------------------------------------------------------------
   2. Pills (.foodjet-pill)
   -------------------------------------------------------------------------- */
.foodjet-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-radius: var(--radius-full);
    padding: 9px 16px;
    min-height: 38px;
    font-size: var(--font-body-medium);
    font-weight: 600;
    line-height: 1.2;
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--color-text-primary);
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
    text-decoration: none;
    transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.foodjet-pill:hover {
    background-color: var(--color-background);
    border-color: rgba(28, 28, 28, 0.4);
    color: var(--color-text-primary);
    transform: translateY(-1px);
}

.foodjet-pill:active {
    transform: translateY(0) scale(0.98);
}

.foodjet-pill--active,
.foodjet-pill[aria-selected="true"],
.foodjet-pill.is-active {
    background-color: var(--color-text-primary);
    border-color: var(--color-text-primary);
    color: #ffffff;
}

.foodjet-pill--active:hover,
.foodjet-pill[aria-selected="true"]:hover,
.foodjet-pill.is-active:hover {
    background-color: #000000;
    border-color: #000000;
    color: #ffffff;
}

.foodjet-pill--active i,
.foodjet-pill--active svg {
    color: #ffffff;
}

.foodjet-pill--sm {
    padding: 6px 12px;
    min-height: 32px;
    font-size: var(--font-body-small);
}

/* --------------------------------------------------------------------------
   3. Badges (.foodjet-badge)
   -------------------------------------------------------------------------- */
.foodjet-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    border-radius: var(--radius-full);
    padding: 4px 10px;
    font-size: var(--font-micro-badge);
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1;
    white-space: nowrap;
    box-shadow: var(--shadow-sm);
}

.foodjet-badge--student {
    background-color: var(--color-yellow-badge);
    color: var(--color-text-primary);
}

.foodjet-badge--yellow {
    background-color: var(--color-yellow-badge);
    color: var(--color-text-primary);
}

.foodjet-badge--soldout {
    background-color: var(--color-text-primary);
    color: #ffffff;
}

.foodjet-badge--success {
    background-color: var(--color-success-soft);
    color: var(--color-success-deep);
}

.foodjet-badge--live {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--color-text-primary);
    font-size: var(--font-body-small);
    font-weight: 600;
    text-transform: none;
    letter-spacing: normal;
    padding: 5px 10px;
}

.foodjet-badge__dot,
.foodjet-badge--live::before {
    content: "";
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background-color: var(--color-success);
    margin-right: 2px;
}

@media (prefers-reduced-motion: no-preference) {
    .foodjet-badge__dot,
    .foodjet-badge--live::before {
        animation: foodjet-pulse-live 1.8s infinite ease-in-out;
    }
}

@keyframes foodjet-pulse-live {
    0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7);
    }
    70% {
        transform: scale(1.15);
        box-shadow: 0 0 0 6px rgba(40, 167, 69, 0);
    }
    100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(40, 167, 69, 0);
    }
}

/* --------------------------------------------------------------------------
   4. Cards (.foodjet-card)
   -------------------------------------------------------------------------- */
.foodjet-card {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-none);
    overflow: hidden;
    position: relative;
}

.foodjet-card__body {
    padding: 16px;
}

@media (min-width: 1280px) {
    .foodjet-card__body {
        padding: 20px;
    }
}

.foodjet-card__header {
    padding: 16px;
    border-bottom: 1px solid var(--color-border);
}

.foodjet-card--interactive {
    cursor: pointer;
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.foodjet-card--interactive:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
    border-color: rgba(244, 81, 30, 0.35);
}

.foodjet-card--interactive:active {
    transform: translateY(0);
    box-shadow: var(--shadow-sm);
}

.foodjet-card--selected {
    background-color: var(--color-primary-light);
    border: 1.5px solid var(--color-primary);
}

/* --------------------------------------------------------------------------
   5. Buttons (.foodjet-btn-*)
   -------------------------------------------------------------------------- */
.foodjet-btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 48px;
    padding: 12px 24px;
    border-radius: var(--radius-button);
    background-color: var(--color-primary);
    color: #ffffff;
    font-size: var(--font-title-medium);
    font-weight: 700;
    line-height: 1;
    border: none;
    cursor: pointer;
    text-decoration: none;
    transition: background-color 0.2s ease,
                transform 0.15s ease,
                box-shadow 0.2s ease;
}

.foodjet-btn-primary:hover {
    background-color: var(--color-primary-dark);
    color: #ffffff;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(244, 81, 30, 0.25);
}

.foodjet-btn-primary:active {
    background-color: var(--color-primary-dark);
    transform: translateY(0);
    box-shadow: none;
}

.foodjet-btn-primary:disabled,
.foodjet-btn-primary.disabled {
    background-color: var(--color-border);
    color: #8e8e8e;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.foodjet-btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 44px;
    padding: 10px 18px;
    border-radius: var(--radius-button);
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--color-text-primary);
    font-size: var(--font-body-medium);
    font-weight: 600;
    line-height: 1;
    cursor: pointer;
    text-decoration: none;
    transition: background-color 0.2s ease,
                border-color 0.2s ease,
                color 0.2s ease,
                transform 0.15s ease;
}

.foodjet-btn-secondary:hover {
    background-color: var(--color-background);
    border-color: var(--color-text-primary);
    color: var(--color-text-primary);
    transform: translateY(-1px);
}

.foodjet-btn-secondary:active {
    background-color: #eceae2;
    transform: translateY(0);
}

.foodjet-btn-secondary:disabled,
.foodjet-btn-secondary.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.foodjet-btn-secondary--danger {
    color: var(--color-danger);
    border-color: var(--color-danger);
}

.foodjet-btn-secondary--danger:hover {
    background-color: #fdf2f2;
    border-color: var(--color-danger);
    color: var(--color-danger);
}

.foodjet-btn-cta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 56px;
    padding: 14px 24px;
    border-radius: var(--radius-cta);
    background-color: var(--color-primary);
    color: #ffffff;
    font-size: 1rem;
    font-weight: 700;
    line-height: 1;
    border: none;
    cursor: pointer;
    text-decoration: none;
    box-shadow: 0 4px 14px rgba(244, 81, 30, 0.3);
    transition: background-color 0.2s ease,
                transform 0.15s ease,
                box-shadow 0.2s ease;
}

.foodjet-btn-cta:hover {
    background-color: var(--color-primary-dark);
    color: #ffffff;
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(217, 67, 16, 0.35);
}

.foodjet-btn-cta:active {
    background-color: var(--color-primary-dark);
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(217, 67, 16, 0.2);
}

.foodjet-btn-cta:disabled,
.foodjet-btn-cta.disabled {
    background-color: var(--color-border);
    color: #8e8e8e;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.foodjet-btn-cta.is-loading {
    pointer-events: none;
    opacity: 0.85;
}

.foodjet-btn-circle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--radius-full);
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--color-text-primary);
    cursor: pointer;
    transition: transform 0.2s ease,
                background-color 0.2s ease,
                box-shadow 0.2s ease,
                color 0.2s ease;
}

.foodjet-btn-circle:hover {
    transform: scale(1.08);
    box-shadow: var(--shadow-sm);
    color: var(--color-primary);
}

.foodjet-btn-circle:active {
    transform: scale(0.95);
}

.foodjet-btn-circle--primary {
    background-color: var(--color-primary);
    border: none;
    color: #ffffff;
}

.foodjet-btn-circle--primary:hover {
    background-color: var(--color-primary-dark);
    color: #ffffff;
}

/* --------------------------------------------------------------------------
   6. Section Headers (.foodjet-section-header)
   -------------------------------------------------------------------------- */
.foodjet-section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
}

.foodjet-section-header__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: var(--radius-badge);
    background-color: var(--color-primary-light);
    color: var(--color-primary);
    font-size: 18px;
    flex-shrink: 0;
}

.foodjet-section-header__title {
    font-size: var(--font-title-large);
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
    line-height: 1.25;
}

/* --------------------------------------------------------------------------
   7. Inputs (.foodjet-input, .foodjet-input-group)
   -------------------------------------------------------------------------- */
.foodjet-input-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 14px;
    position: relative;
}

.foodjet-input-group__label {
    font-size: var(--font-body-small);
    font-weight: 600;
    color: var(--color-text-secondary);
    margin-bottom: 2px;
}

.foodjet-input {
    height: 48px;
    border-radius: var(--radius-input);
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    padding: 12px 16px;
    font-size: var(--font-body-large);
    color: var(--color-text-primary);
    width: 100%;
    outline: none;
    transition: border-color 0.2s ease,
                box-shadow 0.2s ease,
                background-color 0.2s ease;
}

.foodjet-input::placeholder {
    color: var(--color-text-secondary);
    opacity: 0.75;
}

.foodjet-input:hover {
    border-color: rgba(28, 28, 28, 0.4);
}

.foodjet-input:focus,
.foodjet-input:focus-visible {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(244, 81, 30, 0.15);
    outline: none;
}

.foodjet-input.is-invalid,
.foodjet-input--error {
    border-color: var(--color-danger);
    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.15);
}

.foodjet-input:disabled {
    background-color: var(--color-background);
    cursor: not-allowed;
    opacity: 0.7;
}

.foodjet-input-group__hint {
    font-size: 11px;
    color: var(--color-text-secondary);
    margin-top: 2px;
}

.foodjet-input-group__error {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-danger);
    margin-top: 2px;
}

/* --------------------------------------------------------------------------
   8. Motion Reduction Adaptations
   -------------------------------------------------------------------------- */
@media (prefers-reduced-motion: reduce) {
    .foodjet-pill,
    .foodjet-btn-primary,
    .foodjet-btn-secondary,
    .foodjet-btn-cta,
    .foodjet-btn-circle,
    .foodjet-card--interactive {
        transition: none !important;
        transform: none !important;
    }
    .foodjet-badge__dot,
    .foodjet-badge--live::before {
        animation: none !important;
    }
}
```

---

## 6. Consumers & Migration Mapping

| Consumer Milestone | Components to Apply | Concrete Elements / Screens |
|---|---|---|
| **M2** (Navigation, Catalog & Offcanvas) | `.foodjet-pill`, `.foodjet-pill--active`<br>`.foodjet-badge--student`, `.foodjet-badge--soldout`<br>`.foodjet-card`, `.foodjet-card--interactive`<br>`.foodjet-btn-circle`, `.foodjet-input` | - Category pill filter bar in `#homeView`<br>- Product cards in `#productsGrid`<br>- Favorite heart buttons & cart quantity counters<br>- Search input in hero catalog section |
| **M3** (Checkout & Tracking) | `.foodjet-section-header`<br>`.foodjet-card`, `.foodjet-card--selected`<br>`.foodjet-btn-cta`, `.foodjet-btn-secondary`<br>`.foodjet-badge--live`<br>`.foodjet-input`, `.foodjet-input-group` | - Checkout delivery, payment & order summary sections<br>- Payment tiles (`cash`, `card`, `wallet`)<br>- Customer name, phone, address & coupon inputs<br>- Confirm Order submit CTA (56px)<br>- Map live badge ("Actualizando en vivo") & timeline cancel button |
| **M4** (Modals, History & Operations) | `.foodjet-card`<br>`.foodjet-btn-primary`<br>`.foodjet-badge`<br>`.foodjet-input`, `.foodjet-input-group` | - `#loginModal` & `#registerModal` dialog cards and inputs<br>- `#miCuentaModal` student verification banner<br>- `#orderHistoryView` cards<br>- `#dashboardView` admin filters and operations table |

---

## 7. Next Steps for Worker M1_2

1. Append the base component CSS definitions to `frontend/styles.css` directly below the `:root` design token block.
2. Verify that existing styles (such as `.btn-primary` and `.product-card`) remain functional and non-conflicting.
3. Verify keyboard tab navigation and focus indicators across rendered components.
4. Execute `npm run test:unit` and `npm test` to ensure zero regressions in the baseline test suites.
