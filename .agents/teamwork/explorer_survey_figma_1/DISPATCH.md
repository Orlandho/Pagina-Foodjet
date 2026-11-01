## 2026-10-31T21:25:31Z
You are teamwork_spec_miner operating in the Teamwork framework.
Your working directory is: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_survey_figma_1\
Your parent orchestrator is: 58c3ffd8-dc5b-402f-bd35-e8433b2f19cb

MANDATORY FIRST STEP:
Read ORIGINAL_REQUEST.md at:
C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\ORIGINAL_REQUEST.md

Your assigned scope is:
R1. Reconstrucción de Home y cabecera según diseño Figma

Authoritative References:
- Figma Web design (Home - Desktop): https://www.figma.com/design/kmCrgpRVegxmGl1hLsGGIp/FOODJET-BUSS-PROJ?node-id=0-1
- Visual Audit Reference Images (inspect these directly using view_file or image tools):
  - C:\Users\ORLANDO\.codex\visualizations\2026\10\29\01a189af-40f5-7701-8e6a-9addc1171a30\audit-web-oct31\01-figma-home.png (The Figma reference frame)
  - C:\Users\ORLANDO\.codex\visualizations\2026\10\29\01a189af-40f5-7701-8e6a-9addc1171a30\audit-web-oct31\02-web-home.png (The previous web capture showing discrepancies)
  - C:\Users\ORLANDO\.codex\visualizations\2026\10\29\01a189af-40f5-7701-8e6a-9addc1171a30\audit-web-oct31\06-web-address.png
  - C:\Users\ORLANDO\.codex\visualizations\2026\10\29\01a189af-40f5-7701-8e6a-9addc1171a30\audit-web-oct31\07-web-catalog.png
- Existing code:
  - C:\Users\ORLANDO\Desktop\Pagina-Foodjet\frontend\index.html
  - C:\Users\ORLANDO\Desktop\Pagina-Foodjet\frontend\styles.css
  - C:\Users\ORLANDO\Desktop\Pagina-Foodjet\frontend\js\ui.js
  - C:\Users\ORLANDO\Desktop\Pagina-Foodjet\frontend\js\app.js

Investigation Tasks:
1. Header & Navigation:
   - Compare 01-figma-home.png header with current index.html and 02-web-home.png.
   - Brand logo and layout.
   - Location display: secondary label ("Entregar en" / address) and real address or neutral state. Check how address selector / edition works with existing data and services, syncing with checkout without duplicates, and requesting GPS ONLY after explicit user action.
   - Central search bar.
   - User actions (account, favorites, history, admin) without legacy dominating navigation.
   - Orange textual button "Mi carrito · N" with counter.
2. Vertical Ordering on Home:
   - Order must strictly follow: Title "Tu antojo. Sin escalas." and subtitle BEFORE the promotion banner.
   - Banner: horizontal compact banner of two halves (text on left, photo on right full-bleed inside container, real promotions, no generic stock photo or fake prices).
   - Benefits strip (four advantages): MUST BE REMOVED from between banner and catalog, relocated to footer or secondary accessible section.
   - Filters: replace permanently open lateral column with compact rows (categories under banner, quick actions under that), "Filtros" button opening accessible popover/drawer with existing options, combinable filters, search and price in currency.
   - Product cards: preserve approved product cards and functionality, adjust grid width, spacing, cut off badges, no invented backend data.
3. DOM IDs & Preservation:
   - Identify all existing DOM IDs in index.html for Home and Header that must be preserved.
   - Document any new IDs or classes needed.

Outputs:
Write your full technical findings to:
C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_survey_figma_1\report.md
Write your handoff report to:
C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_survey_figma_1\handoff.md
Send a summary message to your parent orchestrator (58c3ffd8-dc5b-402f-bd35-e8433b2f19cb).
