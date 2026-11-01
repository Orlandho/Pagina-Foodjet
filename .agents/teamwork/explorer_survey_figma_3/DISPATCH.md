## 2026-10-31T21:25:55Z
You are teamwork_spec_miner operating in the Teamwork framework.
Your working directory is: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_survey_figma_3\
Your parent orchestrator is: 58c3ffd8-dc5b-402f-bd35-e8433b2f19cb

MANDATORY FIRST STEP:
Read ORIGINAL_REQUEST.md at:
C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\ORIGINAL_REQUEST.md

Your assigned scope is:
R4. Seguimiento de pedidos fiel sin pérdida de funcionalidad & R5. Tema, accesibilidad y límites de ejecución

Authoritative References:
- Figma Web design (Order tracking - Desktop): https://www.figma.com/design/kmCrgpRVegxmGl1hLsGGIp/FOODJET-BUSS-PROJ?node-id=0-1
- Visual Audit Reference Images (inspect these directly using view_file or image tools):
  - C:\Users\ORLANDO\.codex\visualizations\2026\10\29\01a189af-40f5-7701-8e6a-9addc1171a30\audit-web-oct31\05-figma-tracking.png (Figma Tracking reference)
  - C:\Users\ORLANDO\.codex\visualizations\2026\10\29\01a189af-40f5-7701-8e6a-9addc1171a30\audit-web-oct31\11-web-tracking.png (Previous web tracking capture initial)
  - C:\Users\ORLANDO\.codex\visualizations\2026\10\29\01a189af-40f5-7701-8e6a-9addc1171a30\audit-web-oct31\12-web-tracking-loaded.png (Previous web tracking capture loaded)
- Existing code:
  - C:\Users\ORLANDO\Desktop\Pagina-Foodjet\frontend\index.html
  - C:\Users\ORLANDO\Desktop\Pagina-Foodjet\frontend\styles.css
  - C:\Users\ORLANDO\Desktop\Pagina-Foodjet\frontend\js\ui.js
  - C:\Users\ORLANDO\Desktop\Pagina-Foodjet\frontend\js\domain\seguimiento.js
  - C:\Users\ORLANDO\Desktop\Pagina-Foodjet\frontend\js\app.js

Investigation Tasks:
1. Order Tracking (Order tracking - Desktop frame):
   - Compare 05-figma-tracking.png with current tracking (11-web-tracking.png, 12-web-tracking-loaded.png, index.html #trackingView, ui.js).
   - Layout strictly matching frame:
     - Interactive wide map with contained height on the LEFT.
     - Compact card with prominent ETA ("12 min" / estimated time) and 4-stage timeline on the RIGHT.
     - Order summary card UNDER the map.
   - Map & live behavior:
     - Real interactive map with street route, animated delivery driver position, polling `/api/orders/:id`, terminal states (entregado/cancelado), real timestamps for past events vs projected "aprox." for future events. NEVER replace with static image.
     - Connection status indicator: truthful "Actualizando en vivo" (green dot) vs reconnecting/offline.
     - Order cancellation button strictly conditional on order status (only allowed before preparation).
     - DO NOT invent missing driver data (name, avatar, rating, phone), chat, or customer support. Retain hierarchy with real available backend data.
2. Themes, Accessibility & Viewports:
   - Light theme priority: compare light theme first against Figma light frame at 1440px and 1280px.
   - Dark theme handling: if dark theme is kept, test separately with same structure, resolving unreadable light text on buttons or broken timeline text.
   - Responsive behavior at 390px viewport: zero horizontal scroll, touch-friendly tap targets, readable font sizes.
   - A11y: visible focus rings, keyboard navigability, ARIA labels, screen reader announcements, 200% zoom behavior, prefers-reduced-motion.
3. DOM IDs & Preservation:
   - Identify all existing DOM IDs in Tracking that must be preserved.

Outputs:
Write your full technical findings to:
C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_survey_figma_3\report.md
Write your handoff report to:
C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_survey_figma_3\handoff.md
Send a summary message to your parent orchestrator (58c3ffd8-dc5b-402f-bd35-e8433b2f19cb).
