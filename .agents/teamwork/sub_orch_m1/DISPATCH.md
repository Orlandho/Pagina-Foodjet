# Dispatch Assignment: Sub-Orchestrator Milestone 1 (Design Tokens & Base Components)

**Role**: Sub-orchestrator M1 (`teamwork_orchestrator`)
**Working Directory**: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\sub_orch_m1\
**Parent Conversation ID**: b2ab8d46-d54d-46d1-bb73-6ace23f6ae5c
**Scope Document**: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\sub_orch_m1\SCOPE.md
**Project Document**: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\PROJECT.md
**Original Request**: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\ORIGINAL_REQUEST.md
**Survey References**:
- `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_survey_1\report.md`
- `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_survey_2\report.md`

## Objective
Implement Milestone 1: Comprehensive CSS Design Tokens System and Accessible Base UI Components in `frontend/styles.css` strictly preserving existing architecture (HTML5/CSS3/Bootstrap 5.3) and contracts.

## Scope & Implementation Deliverables
1. **CSS Custom Properties (Tokens)** in `:root` and `@media`:
   - Colors: Primary `#F4511E`, Primary Dark `#D94310`, Peach Tint `#FCF0E4`, Dark Neutral `#1C1C1C`, Secondary Gray `#6B6B66`, Accessible Orange `#D03D0A` (for text links to pass WCAG AA normal contrast), Surface `#FFFFFF`, Background `#F8F8F4`, Border `#E6E4DC`, Yellow `#FCD460`, Student Deep Green `#1E7B4F`, Soft Green `#ECF4EC`, Live Green `#28A745`, Danger `#DC3545`.
   - Typography Scale: Display Large (30px/800), Headline Medium (22-24px/700), Title Large (18px/700), Title Medium (16px/600), Body Large (15px), Body Medium (13px), Body Small (11-12px), Micro-badge (8-9px/800).
   - Border Radii: `--radius-full: 9999px`, `--radius-hero: 24px`, `--radius-card: 20px`, `--radius-cta: 18px`, `--radius-input: 16px`, `--radius-button: 14px`, `--radius-badge: 10px`.
   - Shadows & Elevation: `--shadow-none`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`.
   - Accessibility Tokens: Visible focus outline (`2px solid var(--color-primary)` with offset), `@media (prefers-reduced-motion: reduce)` rules, support for 200% zoom without horizontal overflow.
2. **Base Component Styles**:
   - Reusable classes: `.foodjet-pill`, `.foodjet-badge`, `.foodjet-badge--student`, `.foodjet-card`, `.foodjet-btn-primary`, `.foodjet-section-header`, `.foodjet-input`.
   - Card base styling and container resets.
3. **Verification**:
   - Zero regression on existing baseline tests (`npm test`, `npm run test:unit`).
   - Run the full iteration loop: Explorer -> Worker -> Reviewers (2) -> Challengers (2) -> Auditor.
   - Record verdicts in `GATE_STATUS.md`. Gate pass requires unanimous APPROVE + CLEAN audit.

Notify parent upon completion.
