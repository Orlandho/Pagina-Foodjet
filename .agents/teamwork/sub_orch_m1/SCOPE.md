# Scope: Milestone 1 — Design Tokens & Base Components

## Architecture
- Module: `frontend/styles.css`
- Role: Defines global CSS custom properties, utility resets, typography scale, responsive containers, and reusable component classes.
- Compatibility: Bootstrap 5.3 variables aligned; existing classes maintained without regression.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | CSS Design Tokens System | Comprehensive CSS custom properties for palette, typography, radii, elevation, spacing, WCAG AA compliance | M1 | Survey / R3 |
| 2 | Accessible Base Components | Reusable styling for pills, badges, buttons, inputs, cards, focus indicators, and reduced-motion rules | M1 | Survey / R3 |

## Interface Contracts
- Exports CSS variables under `:root`:
  - `--color-primary`, `--color-primary-dark`, `--color-primary-light`, `--color-text-primary`, `--color-text-secondary`, `--color-text-accessible-orange`, `--color-surface`, `--color-background`, `--color-border`, `--color-yellow-badge`, `--color-success-deep`, `--color-success-soft`, `--color-success`, `--color-danger`.
  - `--font-display-large`, `--font-headline-medium`, `--font-title-large`, `--font-title-medium`, `--font-body-large`, `--font-body-medium`, `--font-body-small`, `--font-micro-badge`.
  - `--radius-full`, `--radius-hero`, `--radius-card`, `--radius-cta`, `--radius-input`, `--radius-button`, `--radius-badge`.
  - `--shadow-none`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`.
  - `--focus-ring`.
- Exports base classes:
  - `.foodjet-pill`, `.foodjet-badge`, `.foodjet-card`, `.foodjet-btn-primary`, `.foodjet-btn-secondary`, `.foodjet-section-header`, `.foodjet-input`.
- Preserves all existing styles consumed by `frontend/index.html` and Cucumber tests.
