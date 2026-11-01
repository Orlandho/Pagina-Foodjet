# Dispatch: Explorer M3-3 (Order Tracking Live Map, Live Connection & Timeline)

**Role**: teamwork_explorer
**Working Directory**: `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m3_3\`
**Parent Conversation ID**: `20c340e3-fa46-461e-a7ae-9dd6bbd67479`

Authoritative User Request (MUST READ FIRST):
`C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\ORIGINAL_REQUEST.md`

Project Plan:
`C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\PROJECT.md`

Reference Material:
- Local Prototype (read-only reference): `C:\Users\ORLANDO\Desktop\ciclo 9\frontend para actualizar foodjet para app moviles y adm de proyec de software\proyecto-app-movil-UPN-2026-2-main`
- Existing Frontend: `frontend/index.html` (specifically `#trackingView`, `#mapaSeguimiento`), `frontend/styles.css`, `frontend/js/ui.js`, `frontend/js/domain/seguimiento.js`, `frontend/js/domain/orderStatus.js`, `frontend/js/domain/simulacion.js`.

Exploration Objectives:
1. Investigate the tracking view (`#trackingView`) in `frontend/index.html` and `frontend/styles.css`:
   - Headline: "¡Tu antojo va volando!" with Jetpack Compose styling and brand color palette.
   - Interactive route map (`#mapaSeguimiento`): store location, customer destination, street route via OSRM, and animated driver position derived from departure time and duration.
   - Prominent ETA counter: big digits (e.g. "12 min"), route summary text.
2. Investigate "Actualizando en vivo" live connection indicator:
   - Live status badge (`#liveIndicator` / `.foodjet-badge--live`) with pulsing indicator.
   - Reflect real connection status: polling active (green pulsing), network error / disconnected state (amber/red "Reconectando..."), and polling recovery.
3. Investigate the 4-step tracking timeline (`#step1` through `#step4`):
   - Confirmed, In Preparation, On the Way, Delivered.
   - Distinguish real timestamp (already occurred) from estimated timestamp ("aprox.") derived from `Order.OrderStatusHistory` and time plan.
   - Cancel order button when permitted (only in unconfirmed state) calling `/api/orders/:id/cancelar`.
4. Document all preserved DOM IDs and event listeners required.
5. Provide concrete implementation blueprint, CSS classes, and HTML structure.
6. Write `report.md` and `handoff.md` in your working directory. State your recommendation clearly. Notify parent when done.
