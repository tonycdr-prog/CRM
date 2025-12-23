# App Overhaul TODO (Ethos-Aligned)

This is the working backlog to overhaul the app UI/UX and functional depth across every sidebar menu and sub-menu. It is ordered by priority (Work -> Forms -> Reports) and phased with rough effort bands.

## Ethos Alignment Checklist (apply to every item)
- Foundational before clever: CRM data first, no gimmicks.
- Clarity over automation: surface state before actions.
- Evidence-first compliance: show links and evidence.
- Human judgment stays in the loop: suggest, never force.
- Modular by design: features must be module-gated.
- Composable workspaces: widget-ready, consistent chrome.
- Progressive intelligence: visibility -> warnings -> suggestions.
- Calm systems for critical work: minimize cognitive load.

## Phasing + Effort Bands
- Phase A (Foundation) = S
- Phase B (Core Ops) = M
- Phase C (Evidence/Reporting) = M
- Phase D (Optimization/Insights) = L

## Priority Order
1) Work hub + Jobs
2) Forms hub + Builder/Runner
3) Reports + Defects
4) Schedule + Finance
5) Customers + Manage + Remaining pages

---

## Journey Hubs

### Dashboard (Phase A, M)
- Make all widgets functional with real data + empty/loading/error states.
- Add Golden Thread widget, Compliance Snapshot, Overdue Calibrations.
- Provide save/restore layouts per role/team.
- Add last refreshed timestamp + manual refresh per widget.

### Work Hub (Phase A, M)
- Job list with filters (status, SLA, due window, engineer).
- Job detail summary with linked assets/forms/reports/defects timeline.
- Add "Related Items" cards: Reports, Defects, Quotes, Forms, Schedule.
- Enable quick actions: assign, create defect, open report draft.

### Forms Hub (Phase A, M)
- Templates list with versioning, status, tags.
- Instances list with job/asset grouping and submission state.
- Template preview and compliance tags visible.
- Clear difference between template vs submission.

### Customers Hub (Phase B, M)
- Client list with sites/contract status.
- Site detail: access notes, asset count, compliance summary.
- Contact management with roles/notifications.

### Reports Hub (Phase B, M)
- Reports list with filters (job/site/client/standard).
- Report view: evidence links, signatures, defect references.
- Report generation progress + export actions.

### Manage Hub (Phase C, M)
- People: roles, certs, availability, instruments.
- Assets: type library + parent/child + calibration usage.
- System settings: modules, templates, audits.

---

## Sidebar: Work (Jobs + Execution)

### Jobs (Phase A, M)
- CRUD with validation and assignees.
- SLA and due windows with warnings.
- Link assets + forms + defects + reports.
- Add job timeline events (Golden Thread).

### Job Activity (Phase A, S)
- Unified activity feed for job events.
- Filters by event type (form, defect, report).

### Job Templates (Phase B, M)
- Template builder with tasks/asset types.
- Clone and publish workflow.

### Recurring Jobs (Phase B, M)
- Recurrence rules and schedule preview.

---

## Sidebar: Forms

### Forms Builder (Phase A, M)
- Drag/drop fields, repeat-per-asset sections.
- Rules engine with block/warn.
- Compliance tags per field/section.

### Forms Runner (Phase A, M)
- Offline-first, sync, validation, meter selection.
- Clear submission state + conflicts.

### Smoke Control Library (Phase B, M)
- System types list + generated templates.
- Version history and diff.

---

## Sidebar: Reports

### Reports (Phase B, M)
- PDF export, report viewer, signatures.
- Link report to job/site/client.

### Defects (Phase B, M)
- Group by job; link to reports/quotes/remedials.
- Defect severity + standards references.

### Golden Thread (Phase C, S)
- Timeline view by site/job; filter by standard ref.
- "Weave" explanation text in UI.

---

## Sidebar: Schedule + Finance

### Schedule (Phase B, M)
- Drag/drop calendar with conflict alerts.
- Suggest next slot (explainable).
- Engineer availability display.

### Finance (Phase C, M)
- Quote pipeline + invoices.
- Defect -> Quote -> Remedial -> Invoice chain.

### Profitability (Phase D, L)
- Cost/revenue per job/site/client.

---

## Sidebar: Customers

### Clients (Phase B, M)
- Contracts, SLA, billing settings.

### Sites (Phase B, M)
- Site health summary, access notes, asset list.

### Site Access Notes (Phase C, S)
- Structured notes with last updated.

---

## Sidebar: Manage

### Equipment (Phase C, M)
- Instruments library with calibration tracking.

### Certifications (Phase C, M)
- Engineer certs + expiry alerts.

### Training Records (Phase D, L)
- Training modules, completion tracking.

### Staff Directory (Phase C, M)
- Role/skills map + availability.

---

## Sidebar: Admin

### Entities (Phase A, M)
- Structured entity tables + evidence requirements.

### Templates (Phase A, M)
- Versioning + publish flow.

### Usage (Phase C, S)
- Plan usage view with limits + export.

---

## Cross-Cutting Design Work

### Widget System (Phase A, M)
- Every page feature must have widget variant.
- Chrome: refresh/expand/pop-out/send-to-screen.

### ModuleGate (Phase A, S)
- Show disabled module rationale and CTA.

### Empty/Loading/Error states (Phase A, M)
- Consistent states for all lists and detail pages.

### Golden Weave Copy (Phase C, S)
- Explain linking in context (jobs/forms/defects/reports).

---

## Companion (PWA) Overhaul

### Companion Home (Phase B, M)
- Today view: jobs, alerts, sync status.

### Job Detail (Phase B, M)
- Linked assets/forms/defects.

### Defect Capture (Phase B, M)
- Photo + severity + evidence pack.

### Sync Health (Phase C, S)
- Queue visibility + conflict resolution.

---

## Notes
- Each item must include tests, empty/loading/error states, and audit links where relevant.
- Each item should add at least one widget.
