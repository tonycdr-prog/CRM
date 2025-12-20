# Codex Guardrails

## A) Project overview
- Life Safety OPS CRM combines field inspections, templates, and scheduling for life safety operations teams.
- Express-based API serves auth, job management, inspections, PDF exports, and uploads.
- React + Vite client under `client/` consumes the API with shared TypeScript schema models.
- Drizzle ORM with PostgreSQL backs persistence and migrations.
- Replit OIDC provides authentication with session-backed CSRF and rate limiting.
- Assets (PDF capabilities guide, mobile configs) live at repo root/public for downloads.
- Background job queue and exports run from the server worker alongside HTTP.
- Seeds and scripts target local/dev environments; production requires configured env vars.

## B) Folder map
- `client/` – React/Vite frontend.
- `server/` – Express API, auth, jobs worker, and route handlers.
- `shared/` – shared schema and types for client/server.
- `migrations/` – Drizzle migrations outputs.
- `scripts/` – helper scripts (e.g., git push automation).
- `public/` – static assets served by Vite.
- `uploads/` – local file upload target.
- `android/`, `ios/`, `attached_assets/` – mobile assets/build artefacts.

## C) Commands (exact & runnable)
- Dev: `DATABASE_URL=<postgres-url> SESSION_SECRET=<secret> REPL_ID=<repl-id> ISSUER_URL=<issuer> npm run dev`
- Test: `npm test`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- DB generate: `DATABASE_URL=<postgres-url> npm run db:generate`
- DB migrate/push: `DATABASE_URL=<postgres-url> npm run db:push`
- DB seed: `DATABASE_URL=<postgres-url> SESSION_SECRET=<secret> REPL_ID=<repl-id> ISSUER_URL=<issuer> npm run db:seed`

### Preview (Replit/local dev)
- Set `NODE_ENV=development DEV_AUTH_BYPASS=true SESSION_SECRET=dev`
- Run `npm run dev` (bypasses OIDC for local preview)
- Optional review navigation: set `DEV_REVIEW_MODE=true` to show the dev-only Review sidebar links

## D) Conventions
- TypeScript strict across client/server/shared.
- Keep commits small; avoid unrelated refactors.
- APIs require validation before accepting input.
- UI changes should include empty/loading/error states.
- Schema changes require a migration.

## E) Definition of Done
- Tests pass.
- Lint passes.
- No console errors.
- Basic happy-path manually verified.
- Notes added to `CHANGELOG.md`.
