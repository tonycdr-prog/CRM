# Phase 1 Tasks

## Checklist
- [x] Add Phase 1 scope, acceptance, testing, and follow-up docs.
- [x] Define widget contract and registry with permissions and refresh policy.
- [x] Create per-user dashboard layout storage and APIs to create, update, set default, and load layouts.
- [x] Build minimal dashboard UI for empty state, add/move/resize widgets, and save layout.
- [x] Add tests covering widget registry and dashboard layout persistence.

## Slice selection
- **Feature:** Dashboard layout CRUD + default selection.
- **Reasoning:** Core to the new dashboard experience and exercises widget registry validation plus per-user persistence without needing sidebar or broader CRM flows.
- **Seed approach:** Use simple defaults for layout creation; DB seed left unchanged to avoid touching unrelated large seed logic.
- **Test approach:** Node test runner with Express-bound dashboard router against an in-memory layout store, plus registry validation to confirm widget contract behavior.
