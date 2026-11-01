# FoodJet Web Frontend — WCAG AA Accessibility & Responsive Framework Report

**Date**: 2026-10-29  
**Agent**: Explorer M1_3 (`explorer_m1_3`)  
**Role**: `teamwork_explorer` / Accessibility & Responsive Framework Specialist  
**Parent Task ID**: `b2ab8d46-d54d-46d1-bb73-6ace23f6ae5c`  
**Milestone**: Milestone 1 (Design Tokens & Base Components)  
**Authoritative References**: `ORIGINAL_REQUEST.md`, `PROJECT.md`, `explorer_survey_1/report.md`, `explorer_survey_3/report.md`

---

## 1. Executive Summary

This report establishes the complete specification and CSS ruleset for **WCAG 2.1 / 2.2 AA Accessibility**, **Motion Reduction (`prefers-reduced-motion`)**, **200% Zoom Scaling**, and **Responsive Viewport Containment** (zero horizontal overflow) for the FoodJet Web Frontend.

### Key Discoveries & Architectural Decisions
1. **Focus Visibility Gap**: The current `frontend/styles.css` uses an obsolete pastel peach token (`--primary-color: #f5af69` with 1.87:1 contrast on white) with non-standard 3px borders and a fixed 6px shadow. We specify a standardized, high-contrast `:focus-visible` ruleset: `outline: 2px solid var(--color-primary, #F4511E); outline-offset: 2px;` with reverse-contrast overrides (`#FFFFFF`) on dark/primary backgrounds.
2. **Screen Reader Utilities**: Provide unified definitions for both `.visually-hidden` (Bootstrap default) and `.sr-only` (legacy/utility convention), plus `.visually-hidden-focusable` / `.sr-only-focusable` for enhanced keyboard-accessible skip-links.
3. **Comprehensive Motion Reduction**: Replaces fragmented `@media (prefers-reduced-motion)` blocks scattered in legacy CSS with a universal `0.01ms` reset for animations/transitions and explicit killswitches for continuous animations (pulsing tracking markers, live connection dot, carousel sliding, hover transforms).
4. **WCAG AA Contrast Conformance**: Mathematically proved that raw primary orange `#F4511E` on white (3.48:1) passes for large text and UI boundaries but fails normal text (< 18.66px bold); established the strict requirement for `--color-text-accessible-orange` (`#D03D0A`, 4.82:1) on normal text links, dark text `#1C1C1C` on yellow badges (11.91:1), and high-contrast button styling.
5. **Zero Horizontal Overflow Containment**: Prevent desktop 100vw scrollbar blowout and mobile side-slipping via `width: 100%; max-width: 100%; overflow-x: hidden;` on `html, body`, `min-width: 0` on flex/grid card children, and container padding containment.
6. **200% Zoom & Fluid Typography**: Defined fluid typography using CSS `clamp()` and relative `rem` units, prohibiting fixed pixel heights on text containers, ensuring full legibility and zero truncation at 200% zoom and down to 320px viewport width (WCAG 1.4.4 & 1.4.10).

---

## 2. Global `:focus-visible` Styling & Keyboard Navigation

### 2.1 WCAG Standard Requirements
- **WCAG 2.1 Success Criterion 2.4.7 (Focus Visible - Level AA)**: Any keyboard operable user interface has a mode of operation where the keyboard focus indicator is visible.
- **WCAG 2.2 Success Criterion 2.4.11 (Focus Appearance - Level AA)**: Focus indicator must have a minimum area (at least 2 CSS px thick perimeter), an outline offset, and a contrast ratio of at least 3.0:1 between focused and unfocused states.

### 2.2 Concrete CSS Ruleset

```css
/* ==========================================================================
   WCAG AA Focus Visibility System
   ========================================================================== */

/* 1. Global Focus Indicator for Keyboard Users */
:focus-visible {
    outline: 2px solid var(--color-primary, #F4511E) !important;
    outline-offset: 2px !important;
    /* Soft ambient ring ensuring contrast even if background shifts */
    box-shadow: 0 0 0 4px rgba(244, 81, 30, 0.20) !important;
}

/* 2. Suppress distracting outline on pointer (mouse/touch) interaction */
:focus:not(:focus-visible) {
    outline: none !important;
    box-shadow: none !important;
}

/* 3. High-Contrast Focus Inversion on Dark or Primary Backgrounds */
.bg-primary :focus-visible,
.hero-banner :focus-visible,
.btn-primary:focus-visible,
.foodjet-btn-primary:focus-visible,
.navbar-dark :focus-visible,
.modal-dark :focus-visible {
    outline: 2px solid #FFFFFF !important;
    outline-offset: 2px !important;
    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.35) !important;
}

/* 4. Interactive Components Specific Focus Visibility */
.foodjet-pill:focus-visible,
.foodjet-card:focus-visible,
.foodjet-card--interactive:focus-visible,
.quantity-btn:focus-visible,
.btn-close:focus-visible,
.nav-link:focus-visible,
.dropdown-item:focus-visible {
    outline: 2px solid var(--color-primary, #F4511E) !important;
    outline-offset: 2px !important;
}

/* Form Controls Focus State (Override Bootstrap default blue glow) */
.form-control:focus,
.form-select:focus {
    border-color: var(--color-primary, #F4511E) !important;
    box-shadow: 0 0 0 0.25rem rgba(244, 81, 30, 0.20) !important;
}

.form-control:focus-visible,
.form-select:focus-visible {
    outline: 2px solid var(--color-primary, #F4511E) !important;
    outline-offset: 1px !important;
}
```

### 2.3 Skip-Link Navigation Enhancement
In `frontend/index.html` (line 18), the skip-link `<a href="#main-content" class="skip-link">` must be prominently displayed when focused:

```css
/* Enhanced Skip-to-Content Link */
.skip-link {
    position: absolute;
    top: -100px;
    left: 1rem;
    z-index: 9999;
    padding: 0.75rem 1.25rem;
    background-color: var(--color-primary-dark, #D94310);
    color: #FFFFFF !important;
    font-weight: 700;
    font-size: 0.9375rem;
    border-radius: var(--radius-badge, 8px);
    box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.15));
    text-decoration: none;
    transition: top 0.2s ease-in-out;
}

.skip-link:focus,
.skip-link:focus-visible {
    top: 1rem;
    outline: 2px solid #FFFFFF !important;
    outline-offset: 2px !important;
}
```

---

## 3. Screen-Reader Utilities (`.sr-only` & `.visually-hidden`)

### 3.1 Standards & Context
Screen reader utilities hide elements visually while keeping them in the accessibility tree for screen readers (NVDA, JAWS, VoiceOver, TalkBack).
Bootstrap 5 natively defines `.visually-hidden`. However, code snippets, third-party libraries, and developer habits often use `.sr-only`. Defining both classes as synonyms guarantees zero omissions.

### 3.2 Concrete CSS Ruleset

```css
/* ==========================================================================
   Screen Reader Utilities (WCAG 1.3.1, 4.1.2)
   ========================================================================== */

.sr-only,
.visually-hidden {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
}

/* Allow elements to become visible when navigated to via Tab (e.g. skip links) */
.sr-only-focusable:not(:focus):not(:focus-within),
.visually-hidden-focusable:not(:focus):not(:focus-within) {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
}
```

---

## 4. Motion Reduction Framework (`prefers-reduced-motion`)

### 4.1 WCAG Standard Requirements
- **WCAG 2.1 Success Criterion 2.3.3 (Animation from Interactions - Level AAA & Vestibular Safety)**: Motion animation triggered by interaction can be disabled unless the animation is essential.
- Users with vestibular disorders, motion sickness, or cognitive sensitivities suffer nausea, dizziness, and headaches from unconstrained animations, sliding carousels, and pulsing indicators.

### 4.2 Universal Reset Strategy
Using `0.01ms` duration instead of `0s` ensures that JavaScript lifecycle events (`transitionend`, `animationend`) still fire safely, preventing stuck modals, frozen backdrops, or broken accordion states.

```css
/* ==========================================================================
   Motion Reduction Architecture (prefers-reduced-motion: reduce)
   ========================================================================== */

@media (prefers-reduced-motion: reduce) {
    /* 1. Universal Transition & Animation Clamp */
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }

    /* 2. Explicit Continuous Animation Killswitches */
    .order-status-icon,
    .marcador-seguimiento--repartidor,
    .linea-tiempo__etapa[data-situacion="en_curso"] .linea-tiempo__marca,
    .foodjet-badge--live::before,
    .live-pulse-dot {
        animation: none !important;
    }

    /* 3. Carousel Sliding Suppression (Instant cut) */
    .carousel-item {
        transition: none !important;
        transform: none !important;
    }
    .carousel.slide {
        --bs-carousel-transition: none !important;
    }

    /* 4. Hover Transforms Suppression */
    .navbar-brand:hover,
    .feature-icon:hover,
    .product-card:hover,
    .product-card:hover .product-image,
    .foodjet-card:hover,
    .foodjet-card--interactive:hover,
    .foodjet-pill:hover,
    .quantity-btn:hover,
    .btn:hover {
        transform: none !important;
    }

    /* 5. Fade In & Modal Zoom Elimination */
    .fade,
    .fade-in,
    .modal.fade .modal-dialog {
        transition: none !important;
        animation: none !important;
        transform: none !important;
    }
}
```

---

## 5. Text Contrast Verification Rules (WCAG 2.1 AA Mathematical Validation)

### 5.1 Contrast Criteria
- **Normal Text** (< 18.66px bold or < 24px normal): Contrast ratio $\ge$ **4.5:1**
- **Large Text** ($\ge$ 18.66px bold or $\ge$ 24px normal): Contrast ratio $\ge$ **3.0:1**
- **Non-Text UI Components & Boundaries** (input borders, active icons, focus rings): Contrast ratio $\ge$ **3.0:1**

### 5.2 Mathematical Proof Matrix for M1 Design Tokens

| Pair Description | Foreground Color | Background Color | Computed Luminance ($L_1, L_2$) | Exact Contrast Ratio | WCAG AA Normal ($\ge 4.5:1$) | WCAG AA Large ($\ge 3.0:1$) | Compliance Rule & Usage |
|---|---|---|---|---|---|---|---|
| **Text Primary on White** | `#1C1C1C` | `#FFFFFF` | $0.0116, 1.0000$ | **17.04:1** | **PASS (AAA)** | **PASS** | Default body copy, product titles, section headings. |
| **Text Primary on Page Bg** | `#1C1C1C` | `#F8F8F4` | $0.0116, 0.9363$ | **16.01:1** | **PASS (AAA)** | **PASS** | Text directly over body page background. |
| **Text Secondary on White** | `#6B6B66` | `#FFFFFF` | $0.1461, 1.0000$ | **5.35:1** | **PASS** | **PASS** | Secondary labels, descriptions, timestamps. |
| **Text Secondary on Page Bg** | `#6B6B66` | `#F8F8F4` | $0.1461, 0.9363$ | **5.03:1** | **PASS** | **PASS** | Footnotes, subtitled cards. |
| **White on Primary Orange** | `#FFFFFF` | `#F4511E` | $1.0000, 0.2508$ | **3.49:1** | FAIL | **PASS** | **Allowed ONLY on Large/Bold Buttons** ($\ge 16\text{px}$ bold / $1\text{rem}$ bold CTA). Prohibited for small button labels! |
| **Dark on Primary Orange** | `#1C1C1C` | `#F4511E` | $0.0116, 0.2508$ | **4.88:1** | **PASS** | **PASS** | Recommended for smaller button text and tags. |
| **Primary Orange on White** | `#F4511E` | `#FFFFFF` | $0.2508, 1.0000$ | **3.49:1** | FAIL | **PASS** | Permitted for bold display titles ($\ge 24\text{px}$). Prohibited for body hyperlinks! |
| **Accessible Dark Orange on White** | `#D03D0A` | `#FFFFFF` | $0.1665, 1.0000$ | **4.85:1** | **PASS** | **PASS** | **Mandatory token** for all normal body hyperlinks, icon buttons, and text labels on white/light bg. |
| **Accessible Dark Orange on Page Bg** | `#D03D0A` | `#F8F8F4` | $0.1665, 0.9363$ | **4.56:1** | **PASS** | **PASS** | Text links over page background. |
| **Ultra Dark Orange on White (AAA fallback)** | `#BF360C` | `#FFFFFF` | $0.1260, 1.0000$ | **5.60:1** | **PASS (AAA)** | **PASS** | High-contrast alternative for links. |
| **Dark on Yellow Badge** | `#1C1C1C` | `#FCD460` | $0.0116, 0.6838$ | **11.91:1** | **PASS (AAA)** | **PASS** | **Mandatory**: Floating student badge and promo pills must ALWAYS have dark text `#1C1C1C`. |
| **White on Yellow Badge** | `#FFFFFF` | `#FCD460` | $1.0000, 0.6838$ | **1.43:1** | **FATAL FAIL** | **FATAL FAIL** | **STRICTLY FORBIDDEN**. White text on yellow is unreadable. |
| **Success Deep on White** | `#1E7B4F` | `#FFFFFF` | $0.1514, 1.0000$ | **5.21:1** | **PASS** | **PASS** | Student discount pricing and student tags. |
| **Success Deep on Soft Green** | `#1E7B4F` | `#ECF4EC` | $0.1514, 0.9020$ | **4.73:1** | **PASS** | **PASS** | Delivery bike highlight box and coupon success banner. |
| **White on Danger Red** | `#FFFFFF` | `#DC3545` | $1.0000, 0.1800$ | **4.57:1** | **PASS** | **PASS** | Cancel order button, error alerts, danger badges. |
| **Focus Indicator on White** | `#F4511E` | `#FFFFFF` | $0.2508, 1.0000$ | **3.49:1** | N/A | **PASS ($\ge 3.0:1$)** | Focus ring boundary meets WCAG 2.2 SC 2.4.11. |

---

## 6. Responsive Viewport Containment & Zero Horizontal Overflow

### 6.1 Root Viewport Principles
Horizontal scrollbars on mobile (360px - 390px) or desktop (1280px - 1440px) violate acceptance criteria and cause disorientation:
1. **Never use `width: 100vw` on root containers**: On Windows browsers (Chrome, Edge, Firefox), `100vw` calculates viewport width *including* the vertical scrollbar (~15-17px), generating an instant horizontal scrollbar! Use `width: 100%` and `max-width: 100%`.
2. **Global Root Containment**: `overflow-x: hidden` on `html` and `body`.
3. **Bootstrap Negative Margin Containment**: Bootstrap `.row` has `-0.75rem` left/right margin. If placed outside `.container` or `.container-fluid`, it creates a 24px overflow. All rows must be housed inside properly padded containers.
4. **Grid/Flex Child Blowout Prevention**: Long URLs, order IDs, or addresses blow out containers unless `min-width: 0` is applied.

### 6.2 Concrete CSS Ruleset

```css
/* ==========================================================================
   Zero Horizontal Overflow & Viewport Containment
   ========================================================================== */

/* 1. Root Element Containment */
html,
body {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    position: relative;
    margin: 0;
    padding: 0;
    -webkit-text-size-adjust: 100%;
}

*,
*::before,
*::after {
    box-sizing: border-box;
}

/* 2. Media & Canvas Scaling */
img,
svg,
video,
canvas {
    max-width: 100%;
    height: auto;
}

iframe {
    max-width: 100%;
}

/* 3. Flex & Grid Child Protection Against Blowout */
.min-w-0,
.foodjet-card,
.foodjet-section-header,
.order-item,
.cart-item,
.checkout-summary-card {
    min-width: 0;
    overflow-wrap: break-word;
    word-break: break-word;
}

/* 4. Bootstrap Row Containment Safeguard */
.row {
    margin-right: calc(-0.5 * var(--bs-gutter-x, 1.5rem));
    margin-left: calc(-0.5 * var(--bs-gutter-x, 1.5rem));
}

.container,
.container-fluid {
    width: 100%;
    max-width: 100%;
    padding-right: calc(var(--bs-gutter-x, 1.5rem) * 0.5);
    padding-left: calc(var(--bs-gutter-x, 1.5rem) * 0.5);
}

/* Max Container Width for Ultra-Wide Screens */
@media (min-width: 1400px) {
    .container {
        max-width: 1320px;
    }
}
```

---

## 7. Fluid Typography & 200% Zoom Scaling (WCAG 1.4.4 & 1.4.10)

### 7.1 WCAG Standard Requirements
- **WCAG 2.1 Success Criterion 1.4.4 (Resize Text - Level AA)**: Text can be resized without assistive technology up to 200 percent without loss of content or functionality.
- **WCAG 2.1 Success Criterion 1.4.10 (Reflow - Level AA)**: Content reflows vertically without requiring horizontal scrolling at a 320px equivalent viewport width.

### 7.2 Rules for 200% Zoom Compatibility
1. **Prohibit Fixed Container Heights**: Avoid `height: 50px` or `height: 100px` on cards, badges, and headers. Always use `min-height` with `height: auto` so containers expand vertically as text doubles in size.
2. **All Font Sizes in `rem`**: Use relative units referencing the root browser setting (`1rem = 16px` at 100% zoom; `1rem = 32px` at 200% zoom).
3. **Fluid Typography with `clamp()`**: For large headlines, CSS `clamp(min, preferred, max)` gracefully scales text from 320px screens up to 1440px desktop displays.

### 7.3 Fluid Typography Scale Specification

```css
/* ==========================================================================
   Fluid Typography Tokens Scale (rem + clamp)
   ========================================================================== */

:root {
    /* Display Large (30px desktop, 24px mobile): clamp(1.5rem, 3.5vw + 0.5rem, 1.875rem) */
    --font-display-large: clamp(1.5rem, 3.5vw + 0.5rem, 1.875rem);
    --line-height-display-large: 1.2;

    /* Headline Medium (24px desktop, 20px mobile): clamp(1.25rem, 2.5vw + 0.5rem, 1.5rem) */
    --font-headline-medium: clamp(1.25rem, 2.5vw + 0.5rem, 1.5rem);
    --line-height-headline-medium: 1.25;

    /* Title Large (18px - 20px): clamp(1.125rem, 1.5vw + 0.5rem, 1.25rem) */
    --font-title-large: clamp(1.125rem, 1.5vw + 0.5rem, 1.25rem);
    --line-height-title-large: 1.33;

    /* Title Medium (16px): 1rem */
    --font-title-medium: 1rem;
    --line-height-title-medium: 1.375;

    /* Body Large (15px): 0.9375rem */
    --font-body-large: 0.9375rem;
    --line-height-body-large: 1.45;

    /* Body Medium (13px): 0.8125rem */
    --font-body-medium: 0.8125rem;
    --line-height-body-medium: 1.4;

    /* Body Small (12px): 0.75rem */
    --font-body-small: 0.75rem;
    --line-height-body-small: 1.33;

    /* Micro Badge (9px - 10px uppercase bold): 0.5625rem - 0.625rem */
    --font-micro-badge: 0.625rem;
    --line-height-micro-badge: 1.2;
}
```

---

## 8. Accessible Tap Targets (WCAG 2.5.8 / 2.5.5)

To guarantee comfortable touch navigation across mobile viewports (360px and 390px) and prevent accidental mis-taps:
- Minimum physical tap area must be at least **44px $\times$ 44px**.
- Small visual icons (e.g., 32px heart favorite button, 36px quantity buttons) must expand their hit-target using a transparent `::after` pseudo-element:

```css
/* Tap Target Expansion for Small Buttons */
.quantity-btn,
.foodjet-btn-circle,
.btn-close,
.favorite-btn {
    position: relative;
    min-width: 36px;
    min-height: 36px;
}

.quantity-btn::after,
.foodjet-btn-circle::after,
.btn-close::after,
.favorite-btn::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    min-width: 44px;
    min-height: 44px;
}
```

---

## 9. Implementation Guide for Worker M1

Worker M1 should integrate the following concrete sections into `frontend/styles.css`:

1. **Tokens Section (`:root`)**:
   Add `--color-text-accessible-orange: #D03D0A;` and fluid typography variables into the main `:root` declaration.
2. **Reset & Containment Section**:
   Insert the viewport root containment rules (`html, body { width: 100%; max-width: 100%; overflow-x: hidden; }`) directly after `:root`.
3. **Screen Reader Utilities**:
   Insert `.sr-only`, `.visually-hidden`, `.visually-hidden-focusable` block.
4. **WCAG AA Focus Visibility Block**:
   Replace the legacy lines 482-500 in `frontend/styles.css` with the comprehensive `:focus-visible` and reverse-contrast focus rules.
5. **Consolidated Motion Reduction Block**:
   Replace the fragmented `@media (prefers-reduced-motion)` blocks with the single, comprehensive `0.01ms` reset block.
6. **Accessible Tap Targets**:
   Add pseudo-element touch target expansion for buttons `< 44px`.

---

*Report prepared and certified by Explorer M1_3 for Milestone 1 Worker handoff.*
