# Phase 1 Testing Notes

## Commands
- Lint: `npm run lint`
- Tests: `npm test`
- Dev server smoke: `DATABASE_URL=<postgres-url> SESSION_SECRET=<secret> REPL_ID=<repl-id> ISSUER_URL=<issuer> npm run dev`

## Expected outcomes
- Lint: TypeScript passes with no errors.
- Tests: Widget registry and dashboard layout API tests pass.
- Dev server: Starts when environment and database are available; may require real Postgres for full verification.

## Results
- Lint: `npm run lint` (pass)
- Tests: `npm test` (pass)
- Dev server: Not run in CI container (requires DATABASE_URL/SESSION_SECRET/REPL_ID/ISSUER_URL)
