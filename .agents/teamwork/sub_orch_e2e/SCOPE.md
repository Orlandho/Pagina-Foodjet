# Scope: E2E Testing Track

## Architecture
- Module: Test Runner & Test Suites (`tests/`, `frontend/features/`, `reports/`)
- Role: Defines opaque-box, requirement-driven acceptance tests across Tiers 1-4 for all features in `PROJECT.md`.
- Publication Target: `TEST_INFRA.md` and `TEST_READY.md` at project root.

## Feature Inventory
Covers all 23 features in `PROJECT.md § Feature Inventory` with at least:
- Tier 1: Feature Coverage (>=5 per feature)
- Tier 2: Boundary & Corner Cases (>=5 per feature)
- Tier 3: Cross-Feature Combinations (pairwise interactions)
- Tier 4: Real-World Application Scenarios (end-to-end workflows)

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E-1 | Test Infra & Tier 1/2 Suites | Harness setup, `TEST_INFRA.md`, isolated feature & boundary tests | None | IN_PROGRESS |
| E2E-2 | Tier 3/4 Combinatorial Suites | Pairwise and real-world application scenarios | E2E-1 | PLANNED |
| E2E-3 | Publish TEST_READY.md | Validate runner and generate readiness artifact | E2E-2 | PLANNED |
