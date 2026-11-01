# Dispatch: Project Orchestrator (Generation 2)

**Your Role**: teamwork_orchestrator (Generation 2 Successor)
**Working Directory**: `.agents/teamwork/orchestrator_gen2/`
**Authoritative Request**: `.agents/teamwork/ORIGINAL_REQUEST.md`
**Project Scope Document**: `.agents/teamwork/PROJECT.md`
**Predecessor Soft Handoff**: `.agents/teamwork/orchestrator/handoff.md`
**Predecessor BRIEFING**: `.agents/teamwork/orchestrator/BRIEFING.md`
**Project Directory**: `C:\Users\ORLANDO\Desktop\Pagina-Foodjet`
**Branch**: `feat/UI-frontend-update`

## Current Context & Status
1. **Phase 0 (Survey & Baseline)**: COMPLETED. Baseline tests (121 cucumber scenarios + 25 unit tests) pass 100% green. 165 DOM IDs and bridges mapped.
2. **Dual-Track E2E Test Infra**: COMPLETED. `TEST_INFRA.md` & `TEST_READY.md` published at project root. 131/131 acceptance scenarios, 93/93 unit tests pass.
3. **Milestone 1 (Design Tokens & Base Components)**: COMPLETED & GATE PASSED. `frontend/styles.css` verified by 2 reviewers, 2 challengers, and 1 forensic auditor (all approved/clean).
4. **Milestone 2 (Navigation, Header & Home Catalog)**: IN PROGRESS.
   - Exploratory wave completed: `explorer_m2_1/handoff.md`, `explorer_m2_2/handoff.md`, `explorer_m2_3/handoff.md`.
   - Predecessor wrote `worker_m2/DISPATCH.md`.
   - Task: Spawn/dispatch `worker_m2` to implement Milestone 2 in `frontend/index.html`, `frontend/js/ui.js`, and `frontend/styles.css`.
   - Run tests (`npm run test:unit`, `npm run test:frontend`, `npm test`) ensuring 100% pass rate.
   - Run M2 Gate Wave (Reviewers, Challengers, Forensic Auditor) and record in `GATE_STATUS.md`.
   - Advance to Milestone 3 (Checkout & Tracking), Milestone 4 (Secondary Views, Modals & Ops), and Final Milestone (E2E Pass & Hardening).

## Constraints
- Branch: `feat/UI-frontend-update`
- NEVER write source code directly as orchestrator — delegate to subagents.
- NEVER run build/test commands directly as orchestrator — delegate to subagents.
- Preserve architecture: HTML5, CSS3, Bootstrap 5.3, vanilla ES modules. NO React, Vite, Next, Tailwind.
- Preserve backend: NO changes to `backend/`, Prisma, seeds, migrations, Docker Compose, or Caddy.
- Draw.io ONLY for diagrams.
- Independent verification before closing milestones.


## 2026-10-30T22:40:46Z
Usa /teamwork con trabajo paralelo real: inspección de referencias/contratos, sistema visual y componentes, pantallas por grupos y verificación independiente. Implementa la actualización integral de la UI del frontend WEB de FoodJet en el proyecto existente sobre la rama `feat/UI-frontend-update`, conservando el backend PostgreSQL/Express/Prisma, sus contratos, reglas de negocio y datos. El prompt original completo de la solicitud sigue plenamente vigente y este documento lo estructura sin omitir requisitos.

Working directory: C:\Users\ORLANDO\Desktop\Pagina-Foodjet
Integrity mode: development

Reference material:
- Prototipo local (referencia de solo lectura): `C:\Users\ORLANDO\Desktop\ciclo 9\frontend para actualizar foodjet para app moviles y adm de proyec de software\proyecto-app-movil-UPN-2026-2-main`
- Figma: https://www.figma.com/design/kmCrgpRVegxmGl1hLsGGIp/FOODJET-BUSS-PROJ?node-id=0-1
- Nodo enlazado Figma: https://www.figma.com/design/kmCrgpRVegxmGl1hLsGGIp/FOODJET-BUSS-PROJ?node-id=3-8347
- Conversación de contexto: https://claude.ai/share/3bf821e8-f566-42fa-ba0a-febccd6bb8dc

## SUCCESSION CONTEXT (Generation 2)
You are the Generation 2 Project Orchestrator succeeding Gen 1 (`b2ab8d46-d54d-46d1-bb73-6ace23f6ae5c`).
Your working directory is: `.agents/teamwork/orchestrator_gen2/`
Read:
- `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\orchestrator_gen2\DISPATCH.md`
- `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\orchestrator\handoff.md`
- `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\PROJECT.md`
- `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\ORIGINAL_REQUEST.md`

Current State:
- Phase 0 (Survey & Baseline): COMPLETED (121 cucumber scenarios + 25 unit tests green).
- Dual-Track E2E Test Infra: COMPLETED (`TEST_INFRA.md` & `TEST_READY.md` published; 131 acceptance scenarios, 93 unit tests pass).
- Milestone 1 (Design Tokens & Base Components): COMPLETED & GATE PASSED (`frontend/styles.css` verified).
- Milestone 2 (Navigation, Header & Home Catalog): IN PROGRESS. All 3 exploratory reports delivered (`explorer_m2_1/handoff.md`, `explorer_m2_2/handoff.md`, `explorer_m2_3/handoff.md`). Predecessor prepared `worker_m2/DISPATCH.md`.
Immediate action:
Spawn/dispatch `worker_m2` to implement Milestone 2 in `frontend/index.html`, `frontend/js/ui.js`, and `frontend/styles.css`. Then run gate verification wave (Reviewers, Challengers, Auditor) and advance through Milestone 3 (Checkout & Tracking), Milestone 4 (Secondary Views & Ops), and Final Milestone.
