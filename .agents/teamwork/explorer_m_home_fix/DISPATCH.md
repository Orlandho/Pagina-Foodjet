# DISPATCH — explorer_m_home_fix
Role: teamwork_explorer
Working Directory: .agents/teamwork/explorer_m_home_fix/
Parent: Project Orchestrator (.agents/teamwork/orchestrator/)
Original Request: c:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\ORIGINAL_REQUEST.md
Project Root: c:\Users\ORLANDO\Desktop\Pagina-Foodjet

Scope: Remediation Strategy for Milestone M-Home Gate Review Feedback (reviewer_m_home_2 REQUEST_CHANGES)
Review Feedback:
1. frontend/styles.css:3057: .foodjet-hero-cta-btn uses color: var(--color-text-primary) !important; which in dark mode evaluates to #E8E8E8 on #FFFFFF background (1.22:1 contrast ratio, failing WCAG 2.1 AA SC 1.4.3). Must be color: #1C1C1C !important;
2. frontend/index.html:285: #filtersPanel lacks role="region" and aria-labelledby="btn-toggle-filters-popover".
3. frontend/index.html:1454: #addressSelectorModal has hardcoded bg-white on separator, causing white box in dark mode.
