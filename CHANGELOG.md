# Changelog

## [Unreleased]
- Relaxed CSP to support hosted font assets while keeping stricter defaults.
- Made session cookies use secure flag only in production to keep local development login working.
- Added Phase 0 guardrails (AGENTS.md), planning docs, and documented commands for dev/test/lint/db flows.
- Seeded a reusable health-check stub and added a passing `/api/health` happy-path test.
- Defined a dashboard widget contract with a shared registry and default widgets for health and team notes.
- Added per-user dashboard layout persistence with create/update/default APIs and a basic dashboard builder UI.
- Introduced Phase 1 planning docs and tests for widget registry validation and dashboard layout CRUD.
- Added Phase 2 planning docs, sidebar-to-widget mapping with navigation shortcuts, add-to-dashboard actions, and mapping/persistence tests.
- Added Phase 3 planning docs plus forms core migration, APIs, builder/runner UI, and automated coverage for templates, versions, and submissions.
- Added Phase 4 planning docs, repeat-per-asset schema/instantiation, runner asset navigation with warnings, and tests for per-asset coverage.
- Added Phase 5 planning docs, instrumentation/calibration schema and migration, meter + reading APIs, runner meter selection UI, and calibration enforcement tests.
- Added Phase 6 planning docs, smoke control library schema/migration, generator endpoints/UI, and catalog + generator tests.
- Added Phase 7 planning docs, reporting/defect migrations, report/signature and defect/remedial APIs with UI, and automated reporting workflow tests.
- Added a development-only auth bypass flag to run the app locally without OIDC discovery.
- Added SPA fallback routing and a dev-only Review sidebar section to preview new pages together.
- Loosened CSP directives in development to allow Vite/react-refresh while keeping production directives strict.
- Ensured production CSP keeps strict connect-src while development explicitly allows websocket/inlined scripts for Vite.
