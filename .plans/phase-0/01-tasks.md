# Phase 0 Tasks

## Checklist
- [x] Add AGENTS.md with repo guardrails and commands.
- [x] Document scope, acceptance, and testing notes for Phase 0.
- [x] Identify runnable dev/test/lint/db commands (or add light scripts) and capture results.
- [x] Ensure seed data exists for chosen slice.
- [x] Add one happy-path test covering the slice.

## Slice selection
- **Feature:** `/api/health` endpoint (public health check).
- **Reasoning:** Smallest existing API route; fast to exercise without auth and representative of server setup.
- **Seed approach:** Provide an in-memory health seed stub for tests to simulate a successful DB heartbeat.
- **Test approach:** Node test runner + fetch request against an Express app with the shared health handler.
