# Phase 2 Tasks

## Checklist
- [x] Add Phase 2 scope, acceptance, testing, and follow-up docs.
- [x] Define sidebar → widget mapping with default params using the widget registry.
- [x] Add "Add to dashboard" actions for all sidebar items using existing layout APIs.
- [x] Verify mapping and add-to-dashboard behavior with automated tests.
- [x] Update changelog under the Phase 2 work.

## Slice selection
- **Feature:** Sidebar-to-dashboard widgetization for journey items.
- **Reasoning:** Ensures every sidebar entry can be placed on the dashboard via a consistent mapping without altering schemas or broader UI.
- **Seed approach:** Reuse existing in-memory layout defaults; no DB seed change needed for mapping metadata.
- **Test approach:** Node test runner validating mapping defaults and add-to-dashboard persistence via the in-memory layout repository and existing dashboard router contracts.
