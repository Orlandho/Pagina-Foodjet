# Dispatch Assignment: E2E Testing Orchestrator

**Role**: E2E Testing Orchestrator (`teamwork_orchestrator`)
**Working Directory**: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\sub_orch_e2e\
**Parent Conversation ID**: b2ab8d46-d54d-46d1-bb73-6ace23f6ae5c
**Scope Document**: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\sub_orch_e2e\SCOPE.md
**Project Document**: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\PROJECT.md
**Original Request**: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\ORIGINAL_REQUEST.md

## Objective
Design and implement the comprehensive, opaque-box E2E test suite according to the Dual Track requirements in the Project Pattern.
Establish `TEST_INFRA.md` and upon completion publish `TEST_READY.md` at project root `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\TEST_READY.md`.

## Methodology (Systematic 4-Tier Approach)
- **Tier 1 — Feature Coverage (>=5 per feature)**: Equivalence class happy-path tests verifying features in isolation.
- **Tier 2 — Boundary & Corner Cases (>=5 per feature)**: Inputs at and outside limits (empty cart, invalid coupons, zero/negative, 9-digit phone constraints, card lengths).
- **Tier 3 — Cross-Feature Combinations (pairwise coverage)**: Interacting features (e.g. student discount + coupon, cash order vs card order, GPS locate vs manual text).
- **Tier 4 — Real-World Application Scenarios**: Multi-step realistic user stories from landing to delivery.
- Minimum threshold: Build upon the existing 121 Cucumber scenarios and 25 unit tests to add dedicated frontend UI acceptance tests covering all 23 features in `PROJECT.md`.

## Coordination & Handshake
- Create `TEST_INFRA.md` at project root documenting test architecture.
- When all test suites are defined and ready to run, publish `TEST_READY.md` at `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\TEST_READY.md`.
- Follow the sub-orchestrator iteration loop: Explorer -> Worker (or `teamwork_test_writer`) -> Reviewer -> Challenger -> Auditor.
- Report completion and send message to parent `b2ab8d46-d54d-46d1-bb73-6ace23f6ae5c`.
