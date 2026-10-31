# FoodJet Design System — Milestone 1 Token Architecture & CSS Specification

**Agent**: Explorer M1_1 (`explorer_m1_1`)  
**Date**: 2026-10-29  
**Parent Task**: `b2ab8d46-d54d-46d1-bb73-6ace23f6ae5c`  
**Target Codebase**: `frontend/styles.css` (Bootstrap 5.3.0 + Vanilla CSS)  
**Authoritative References**:
- `ORIGINAL_REQUEST.md` (Requirements R1, R2, R3, R4, R5)
- Android Compose Prototype: `com.example.foodjeetapp.ui.theme` (`Color.kt`, `Type.kt`, `Theme.kt`, `FoodJetUi.kt`, `FilterSection.kt`, `ProductCard.kt`, `HeroCarousel.kt`, `CheckoutScreen.kt`)
- `explorer_survey_1/report.md` & `explorer_survey_2/report.md`

---

## 1. Executive Summary & Objective

This report defines the comprehensive CSS design token architecture and base component specification for Milestone 1 of the FoodJet Web Frontend UI modernization.

The existing `frontend/styles.css` (1,595 lines) currently relies on a legacy 7-variable `:root` block with a pale orange palette (`--primary-color: #f5af69`). This specification modernizes the visual system to the authoritative FoodJet brand palette centered on vibrant primary orange (`#F4511E`), dark primary hover (`#D94310`), peach tint (`#FCF0E4`), deep charcoal text (`#1C1C1C`), and dedicated tokens for student discounts (`#1E7B4F` / `#ECF4EC` / `#FCD460`).

Crucially, this architecture guarantees:
1. **Zero Collision with Bootstrap 5.3**: Hooks seamlessly into Bootstrap's CSS variables (`--bs-primary`, `--bs-primary-rgb`, `--bs-body-color`, `--bs-body-bg`, `--bs-border-color`).
2. **100% Backward Compatibility**: Preserves all legacy variable aliases (`--primary-color`, `--primary-hover`, `--primary-light`, `--primary-text`, `--dark-color`, `--gray-color`, `--light-gray`) mapped to the new tokens, eliminating regression risk for any untouched stylesheet rules.
3. **Strict WCAG AA Contrast Compliance**: Mathematical verification of all color combinations, with dedicated accessible text variants (`--color-text-accessible-orange: #D03D0A` = 4.82:1 on white).
4. **Reusable Component Classes**: Standardized utility contracts (`.foodjet-pill`, `.foodjet-badge`, `.foodjet-card`, `.foodjet-btn-*`, `.foodjet-section-header`) ready for direct consumption by Milestone 2 (Catalog/Home), Milestone 3 (Checkout/Tracking), and Milestone 4 (Modals/Admin).

---

## 2. Complete CSS Custom Properties (`:root`) Specification

### 2.1 Complete `:root` Token Block

The following CSS block is recommended for insertion at lines 51–64 of `frontend/styles.css`, replacing the legacy `:root` declaration:

```css
/* ==========================================================================
   FoodJet Design System — Core Design Tokens (Milestone 1)
   ========================================================================== */

:root {
    /* ----------------------------------------------------------------------
       1. Brand Palette & Color Tokens
       ---------------------------------------------------------------------- */
    /* Primary Brand Colors */
    --color-primary: #F4511E;                  /* Vibrant FoodJet Orange */
    --color-primary-rgb: 244, 81, 30;          /* RGB channels for alpha compositing */
    --color-primary-dark: #D94310;             /* Dark Orange (Hover / Active / Map Pin) */
    --color-primary-dark-rgb: 217, 67, 16;
    --color-primary-light: #FCF0E4;            /* Peach Tint (Icon boxes, selection backgrounds) */
    --color-primary-light-rgb: 252, 240, 228;

    /* Neutrals & Surfaces */
    --color-surface: #FFFFFF;                  /* Card surfaces, modals, search inputs */
    --color-surface-rgb: 255, 255, 255;
    --color-background: #F8F8F4;               /* Global canvas body background */
    --color-background-rgb: 248, 248, 244;
    --color-border: #E6E4DC;                   /* Card borders, dividers, chip outlines */
    --color-border-subtle: #F0EEE6;
    
    /* Typography Colors */
    --color-text-primary: #1C1C1C;             /* Headings, body text, active chip backgrounds */
    --color-text-primary-rgb: 28, 28, 28;
    --color-text-secondary: #6B6B66;           /* Subtitles, timestamps, time badges, inactive icons */
    --color-text-muted: #9E9E99;               /* Placeholders, disabled text */
    --color-text-accessible-orange: #D03D0A;   /* WCAG AA text link & small label orange (4.82:1 on #FFF) */

    /* Accent & Student Perks Tokens */
    --color-yellow-badge: #FCD460;             /* "PRECIO ESTUDIANTE" pill, Hero top tag, rating stars */
    --color-yellow-badge-rgb: 252, 212, 96;
    --color-success-deep: #1E7B4F;             /* Student discount effective price, discount tag */
    --color-success-soft: #ECF4EC;             /* Soft green alert background */
    --color-success: #28A745;                  /* "Actualizando en vivo" pulsing dot, checkmarks */
    --color-success-rgb: 40, 167, 69;
    --color-success-container: #D4EDDA;        /* Completed status badge background */
    --color-success-text: #155724;             /* Dark green status badge text */

    /* Functional States */
    --color-warning: #FFC107;                  /* Warning status, pending order clock */
    --color-warning-container: #FFF3CD;
    --color-warning-text: #856404;
    --color-danger: #DC3545;                   /* Errors, invalid coupons, cancel buttons */
    --color-danger-rgb: 220, 53, 69;
    --color-danger-container: #F8D7DA;
    --color-danger-text: #721C24;
    --color-info: #0DCAF0;

    /* ----------------------------------------------------------------------
       2. Backward-Compatibility Aliases (Legacy Stylesheet Safety)
       ---------------------------------------------------------------------- */
    --primary-color: var(--color-primary);
    --primary-hover: var(--color-primary-dark);
    --primary-light: var(--color-primary-light);
    --primary-text: var(--color-text-accessible-orange);
    --dark-color: var(--color-text-primary);
    --gray-color: var(--color-text-secondary);
    --light-gray: var(--color-background);

    /* ----------------------------------------------------------------------
       3. Bootstrap 5.3 Integration Variables
       ---------------------------------------------------------------------- */
    --bs-primary: var(--color-primary);
    --bs-primary-rgb: var(--color-primary-rgb);
    --bs-body-color: var(--color-text-primary);
    --bs-body-bg: var(--color-background);
    --bs-border-color: var(--color-border);
    --bs-link-color: var(--color-text-accessible-orange);
    --bs-link-hover-color: var(--color-primary-dark);
    --bs-focus-ring-color: rgba(var(--color-primary-rgb), 0.25);

    /* ----------------------------------------------------------------------
       4. Typography Scale & Font Tokens
       ---------------------------------------------------------------------- */
    --font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    
    /* Font Weight Tokens */
    --font-weight-regular: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;
    --font-weight-extrabold: 800;

    /* Discrete Font Size & Line Height Tokens */
    --font-size-display-large: 1.875rem;       /* 30px */
    --line-height-display-large: 2.25rem;      /* 36px */

    --font-size-headline-medium: 1.375rem;     /* 22px */
    --line-height-headline-medium: 1.75rem;    /* 28px */

    --font-size-title-large: 1.125rem;         /* 18px */
    --line-height-title-large: 1.5rem;         /* 24px */

    --font-size-title-medium: 1rem;            /* 16px */
    --line-height-title-medium: 1.375rem;      /* 22px */

    --font-size-body-large: 0.9375rem;         /* 15px */
    --line-height-body-large: 1.375rem;        /* 22px */

    --font-size-body-medium: 0.8125rem;        /* 13px */
    --line-height-body-medium: 1.125rem;       /* 18px */

    --font-size-body-small: 0.75rem;           /* 12px */
    --line-height-body-small: 1rem;            /* 16px */

    --font-size-micro-badge: 0.5625rem;        /* 9px */
    --line-height-micro-badge: 0.75rem;        /* 12px */

    /* Composite Shorthand Typography Tokens */
    --font-display-large: 800 var(--font-size-display-large)/var(--line-height-display-large) var(--font-family-base);
    --font-headline-medium: 700 var(--font-size-headline-medium)/var(--line-height-headline-medium) var(--font-family-base);
    --font-title-large: 700 var(--font-size-title-large)/var(--line-height-title-large) var(--font-family-base);
    --font-title-medium: 600 var(--font-size-title-medium)/var(--line-height-title-medium) var(--font-family-base);
    --font-body-large: 400 var(--font-size-body-large)/var(--line-height-body-large) var(--font-family-base);
    --font-body-medium: 400 var(--font-size-body-medium)/var(--line-height-body-medium) var(--font-family-base);
    --font-body-small: 400 var(--font-size-body-small)/var(--line-height-body-small) var(--font-family-base);
    --font-micro-badge: 800 var(--font-size-micro-badge)/var(--line-height-micro-badge) var(--font-family-base);

    /* ----------------------------------------------------------------------
       5. Border Radii & Shapes
       ---------------------------------------------------------------------- */
    --radius-full: 9999px;                     /* Pill chips, circular buttons, live indicator */
    --radius-hero: 24px;                       /* HeroCarousel container */
    --radius-card: 20px;                       /* ProductCard, Checkout cards, Tracking cards, Modals */
    --radius-cta: 18px;                        /* Primary full-width CTA buttons (height 56px) */
    --radius-input: 16px;                      /* Search bar input, form controls */
    --radius-button: 12px;                     /* Standard action buttons, item thumbnails */
    --radius-badge: 10px;                      /* Section header icon containers, status tags */
    --radius-sm: 6px;                          /* Micro badges, small indicators */

    /* ----------------------------------------------------------------------
       6. Shadows & Elevation Tokens
       ---------------------------------------------------------------------- */
    --shadow-none: none;
    --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.06);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
    --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
    --shadow-focus: 0 0 0 3px rgba(244, 81, 30, 0.25);
    --shadow-focus-dark: 0 0 0 3px rgba(28, 28, 28, 0.25);

    /* ----------------------------------------------------------------------
       7. Spacing Tokens (Consistent 4px/8px Modular Scale)
       ---------------------------------------------------------------------- */
    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 16px;
    --space-5: 20px;
    --space-6: 24px;
    --space-8: 32px;
    --space-10: 40px;
    --space-12: 48px;

    /* ----------------------------------------------------------------------
       8. Animation & Transition Tokens
       ---------------------------------------------------------------------- */
    --transition-fast: 0.15s ease-out;
    --transition-base: 0.25s ease;
    --transition-smooth: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 3. WCAG AA Contrast Verification & Mathematical Proofs

All colors have been evaluated using the W3C Relative Luminance Formula:
$$L = 0.2126 R_L + 0.7152 G_L + 0.0722 B_L$$
where $C_L = C_{sRGB} / 255 \le 0.04045 \ ? \ C_L / 12.92 : ((C_L + 0.055) / 1.055)^{2.4}$.

Contrast Ratio:
$$\text{Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05}$$

| Combination | Foreground | Background | Contrast Ratio | WCAG AA Normal Text (>= 4.5:1) | WCAG AA Large Text (>= 3.0:1) | Architecture Guidance |
|---|---|---|---|---|---|---|
| **Text Primary on White** | `#1C1C1C` | `#FFFFFF` | **17.04:1** | **PASS (AAA)** | **PASS** | Default body text, modal titles, product card titles. |
| **Text Primary on Page Bg** | `#1C1C1C` | `#F8F8F4` | **16.01:1** | **PASS (AAA)** | **PASS** | Global headings, section titles on canvas. |
| **Text Secondary on White** | `#6B6B66` | `#FFFFFF` | **5.36:1** | **PASS** | **PASS** | Subtitles, product descriptions, input placeholders. |
| **Text Secondary on Page Bg** | `#6B6B66` | `#F8F8F4` | **5.03:1** | **PASS** | **PASS** | Disclaimers, footer slogan, order timestamps. |
| **Accessible Orange on White** | `#D03D0A` | `#FFFFFF` | **4.82:1** | **PASS** | **PASS** | Hyperlinks, text buttons, small orange labels on white. |
| **Accessible Orange on Page Bg**| `#D03D0A` | `#F8F8F4` | **4.53:1** | **PASS** | **PASS** | Inline links and tags on page canvas. |
| **White on Primary Orange** | `#FFFFFF` | `#F4511E` | **3.48:1** | FAIL (< 4.5:1) | **PASS (>= 3.0:1)** | **Permitted only for large bold UI text** (CTA buttons with font-size >= 16px bold). |
| **Text Primary on Primary Orange**| `#1C1C1C` | `#F4511E` | **4.90:1** | **PASS** | **PASS** | High-contrast secondary button option and accessible mode. |
| **Text Primary on Yellow Badge**| `#1C1C1C` | `#FCD460` | **11.95:1**| **PASS (AAA)** | **PASS** | "PRECIO ESTUDIANTE" badge, Hero top pill. |
| **Success Deep on White** | `#1E7B4F` | `#FFFFFF` | **5.25:1** | **PASS** | **PASS** | Product card discounted student price text. |
| **Success Deep on Soft Green** | `#1E7B4F` | `#ECF4EC` | **4.68:1** | **PASS** | **PASS** | Student promo notification banner, coupon success tag. |
| **White on Danger Red** | `#FFFFFF` | `#DC3545` | **4.53:1** | **PASS** | **PASS** | Error notices, invalid coupon feedback, cancel buttons. |
| **Text Primary on Peach Light** | `#1C1C1C` | `#FCF0E4` | **15.22:1**| **PASS (AAA)** | **PASS** | Active payment method tile text. |

### Accessibility Rules Implemented
1. **Hyperlink and Small Text Rule**: In `styles.css`, `.text-primary` must NOT output raw `#F4511E` (3.48:1). It is mapped to `--color-text-accessible-orange` (`#D03D0A`, 4.82:1):
   ```css
   .text-primary {
       color: var(--color-text-accessible-orange) !important;
   }
   ```
2. **Focus Indicators**: All interactive elements (inputs, buttons, chips, links, cards) use high-contrast focus rings:
   ```css
   :focus-visible {
       outline: 3px solid var(--color-primary);
       outline-offset: 2px;
       box-shadow: var(--shadow-focus);
   }
   ```
3. **Motion Reduction**: `prefers-reduced-motion: reduce` unconditionally suppresses continuous animations (such as the pulsing dot on live tracking and hover transforms):
   ```css
   @media (prefers-reduced-motion: reduce) {
       *, *::before, *::after {
           animation-duration: 0.01ms !important;
           animation-iteration-count: 1 !important;
           transition-duration: 0.01ms !important;
           scroll-behavior: auto !important;
       }
       .foodjet-live-indicator__dot {
           animation: none !important;
       }
   }
   ```

---

## 4. Reusable Base Components Specification (`.foodjet-*`)

To provide Milestone 2, Milestone 3, and Milestone 4 workers with turn-key design primitives without re-inventing styles in their milestones, the following component classes must be declared directly following the `:root` block:

### 4.1 Pill Chips (`.foodjet-pill`)
Directly mirroring `FilterSection.kt`:
```css
/* --- Reusable Pill Chip --- */
.foodjet-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: var(--radius-full);
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--color-text-primary);
    font-size: var(--font-size-body-medium);
    font-weight: var(--font-weight-semibold);
    line-height: var(--line-height-body-medium);
    text-decoration: none;
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
    transition: background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
}

.foodjet-pill:hover {
    border-color: var(--color-primary);
    color: var(--color-text-primary);
}

.foodjet-pill--active,
.foodjet-pill.active {
    background-color: var(--color-text-primary) !important;
    border-color: var(--color-text-primary) !important;
    color: #FFFFFF !important;
}

.foodjet-pill--active .foodjet-pill__icon,
.foodjet-pill.active .foodjet-pill__icon {
    color: #FFFFFF;
}

.foodjet-pill:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}
```

### 4.2 Badges & Status Tags (`.foodjet-badge`)
Directly mirroring `ProductCard.kt` and `FoodJetUi.kt`:
```css
/* --- Reusable Badges & Floating Tags --- */
.foodjet-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 3px 8px;
    border-radius: var(--radius-full);
    font-size: var(--font-size-micro-badge);
    font-weight: var(--font-weight-extrabold);
    line-height: var(--line-height-micro-badge);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
}

/* Yellow Student Discount Badge */
.foodjet-badge--yellow,
.foodjet-badge--student {
    background-color: var(--color-yellow-badge);
    color: var(--color-text-primary);
}

/* Dark Out-of-Stock / Urgent Badge */
.foodjet-badge--dark,
.foodjet-badge--out-of-stock {
    background-color: var(--color-text-primary);
    color: #FFFFFF;
}

/* Soft Green Success Badge */
.foodjet-badge--success {
    background-color: var(--color-success-soft);
    color: var(--color-success-deep);
}

/* Red Error Badge */
.foodjet-badge--danger {
    background-color: var(--color-danger-container);
    color: var(--color-danger-text);
}
```

### 4.3 Cards (`.foodjet-card`)
Directly mirroring `ProductCard.kt` and `CheckoutScreen.kt`:
```css
/* --- Base Container Card --- */
.foodjet-card {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card);
    padding: var(--space-4);
    box-shadow: var(--shadow-none);
    transition: transform var(--transition-smooth), box-shadow var(--transition-smooth), border-color var(--transition-fast);
}

.foodjet-card--interactive {
    cursor: pointer;
}

.foodjet-card--interactive:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
    border-color: var(--color-primary);
}
```

### 4.4 CTA & Primary Buttons (`.foodjet-btn-*`)
Directly mirroring `CartSheet.kt` and `CheckoutScreen.kt`:
```css
/* --- Main Primary Full-Width CTA Button --- */
.foodjet-btn-cta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 56px;
    border-radius: var(--radius-cta);
    background-color: var(--color-primary);
    color: #FFFFFF;
    font-size: var(--font-size-title-medium);
    font-weight: var(--font-weight-bold);
    border: none;
    box-shadow: var(--shadow-sm);
    text-decoration: none;
    cursor: pointer;
    transition: background-color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast);
}

.foodjet-btn-cta:hover {
    background-color: var(--color-primary-dark);
    color: #FFFFFF;
    box-shadow: var(--shadow-md);
}

.foodjet-btn-cta:active {
    transform: scale(0.98);
}

.foodjet-btn-cta:disabled,
.foodjet-btn-cta.disabled {
    background-color: var(--color-border);
    color: var(--color-text-muted);
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
}

/* Secondary Peach Button */
.foodjet-btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 48px;
    padding: 0 var(--space-4);
    border-radius: var(--radius-button);
    background-color: var(--color-primary-light);
    color: var(--color-primary-dark);
    font-size: var(--font-size-title-medium);
    font-weight: var(--font-weight-bold);
    border: none;
    cursor: pointer;
    transition: background-color var(--transition-fast), color var(--transition-fast);
}

.foodjet-btn-secondary:hover {
    background-color: var(--color-border);
    color: var(--color-text-primary);
}

/* Square Add (+) Button */
.foodjet-btn-add {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-button);
    background-color: var(--color-primary);
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    transition: background-color var(--transition-fast), transform var(--transition-fast);
}

.foodjet-btn-add:hover {
    background-color: var(--color-primary-dark);
    transform: scale(1.05);
}

.foodjet-btn-add:disabled,
.foodjet-btn-add.disabled {
    background-color: var(--color-border);
    color: var(--color-text-muted);
    cursor: not-allowed;
    transform: none;
}
```

### 4.5 Section Headers (`.foodjet-section-header`)
Directly mirroring `FoodJetUi.kt`:
```css
/* --- Card Section Header --- */
.foodjet-section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: var(--space-3);
}

.foodjet-section-header__icon {
    width: 34px;
    height: 34px;
    border-radius: var(--radius-badge);
    background-color: var(--color-primary-light);
    color: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
}

.foodjet-section-header__title {
    font-size: var(--font-size-title-large);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-title-large);
    color: var(--color-text-primary);
    margin: 0;
}
```

### 4.6 Live Status Pill (`.foodjet-live-indicator`)
Directly implementing Requirement R4 ("Actualizando en vivo"):
```css
/* --- Live Polling / Connection Indicator --- */
.foodjet-live-indicator {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: var(--radius-full);
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    font-size: var(--font-size-body-small);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    box-shadow: var(--shadow-sm);
}

.foodjet-live-indicator__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--color-success);
    position: relative;
}

.foodjet-live-indicator--active .foodjet-live-indicator__dot {
    animation: foodjet-pulse-green 1.8s infinite ease-out;
}

.foodjet-live-indicator--disconnected .foodjet-live-indicator__dot {
    background-color: var(--color-danger);
    animation: none;
}

.foodjet-live-indicator--reconnecting .foodjet-live-indicator__dot {
    background-color: var(--color-warning);
    animation: foodjet-pulse-yellow 1.2s infinite ease-out;
}

@keyframes foodjet-pulse-green {
    0% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.6); }
    70% { box-shadow: 0 0 0 6px rgba(40, 167, 69, 0); }
    100% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); }
}

@keyframes foodjet-pulse-yellow {
    0% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.6); }
    70% { box-shadow: 0 0 0 6px rgba(255, 193, 7, 0); }
    100% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0); }
}
```

---

## 5. Concrete Implementation Plan for Worker M1_2

### 5.1 Insertion Target in `frontend/styles.css`
1. **Lines 51–64 (Replace `:root`)**:
   - Replace the legacy 7-variable `:root` declaration with the complete Section 2 `:root` token block (Brand palette, RGB channels, neutrals, state tokens, typography, radii, shadows, spacing, and legacy aliases).
2. **Lines 65–117 (Accessibility, typography, Bootstrap button overrides)**:
   - Insert Section 4 base component classes (`.foodjet-pill`, `.foodjet-badge`, `.foodjet-card`, `.foodjet-btn-*`, `.foodjet-section-header`, `.foodjet-live-indicator`) immediately after line 64.
   - Update `.btn-primary` to use `var(--color-primary)`, `--color-primary-dark`, and bold white text (`font-weight: 700; color: #fff !important;`).
   - Keep `.text-primary` override directing to `var(--color-text-accessible-orange) !important;` for WCAG AA compliance.
3. **Lines 666–677 (Dark mode `:root` in `@media (prefers-color-scheme: dark)`)**:
   - Update dark mode `:root` to provide dark-theme tokens:
     ```css
     @media (prefers-color-scheme: dark) {
         :root {
             --color-primary: #F4511E;
             --color-primary-dark: #D94310;
             --color-primary-light: rgba(244, 81, 30, 0.15);
             --color-surface: #1E1E1E;
             --color-background: #121212;
             --color-border: #333333;
             --color-text-primary: #E8E8E8;
             --color-text-secondary: #ADB5BD;
             --color-text-accessible-orange: #F5AF69;
             --color-yellow-badge: #FCD460;
             --color-success-soft: #1B3826;
             --color-success-deep: #4ADE80;

             /* Legacy aliases */
             --dark-color: #e8e8e8;
             --light-gray: #1e1e1e;
             --gray-color: #adb5bd;
             --primary-text: #f5af69;
             --bs-body-color: #e8e8e8;
             --bs-body-bg: #121212;
         }
         ...
     }
     ```

### 5.2 Verification Checklist for Worker M1_2
- [ ] Run `npm run test:unit` immediately after updating `frontend/styles.css` (must pass 25/25, 100%).
- [ ] Verify computed styles in browser for `:root`:
  - `getComputedStyle(document.documentElement).getPropertyValue('--color-primary')` === `#F4511E`.
  - `getComputedStyle(document.documentElement).getPropertyValue('--primary-color')` resolves to `#F4511E`.
  - `getComputedStyle(document.documentElement).getPropertyValue('--bs-primary')` resolves to `#F4511E`.
- [ ] Verify that existing page elements (Navbar brand, Cart badge, Delivery map pin, Order status timeline) render with the vibrant orange brand `#F4511E`.
- [ ] Verify that no horizontal scroll is introduced (`document.documentElement.scrollWidth <= window.innerWidth`).
- [ ] Confirm zero modifications in `backend/`, `prisma/`, or Docker configuration.

---

## 6. Conclusion

This Token Architecture provides an airtight, zero-regression foundation for FoodJet. By aliasing legacy variables to the new tokens and offering both discrete properties and composite component classes, Milestones 2, 3, and 4 can proceed with full visual fidelity and rapid implementation.
