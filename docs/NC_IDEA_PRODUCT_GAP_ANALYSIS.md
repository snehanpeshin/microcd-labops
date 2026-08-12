# NC IDEA Product Gap Analysis

Audit date: August 12, 2026  
Audited commit: `6559524`  
Scope: application routes, server actions and route handlers, Supabase migrations/RLS, storage, integrations, automated tests, deployment configuration, and product documentation.

## Executive assessment

MicroCD LabOps has a coherent Next.js/Supabase foundation and already implements much of the promised pilot workflow. It is not a mock-only product: organizations, five roles, projects, suppliers, components, lots, inspections, experiments, inventory, equipment, tasks, protocols, samples, device-build genealogy, readiness gates, immutable evidence packets, controlled reports, PDFs, imports, alerts, analytics, exports, a read-only API, Stripe endpoints, and guarded AI drafting are persisted.

The product is **not yet fully pilot-ready**. The highest-risk defect is operational: the AWS Amplify build does not copy `CRON_SECRET`, `OPENAI_*`, or `STRIPE_*` variables into the server runtime artifact. This currently causes the scheduled alert endpoint to return 401 and can leave AI and billing disabled in production despite credentials being configured. The next risks are the absence of database-backed two-tenant integration tests, no project detail/design-revision workspace, incomplete document provenance/OCR review, no usable issue-management UI, and shallow report-data analysis.

The existing architecture should be preserved. Improvements should be delivered as small migrations and vertical slices, not as a rewrite.

## Current architecture

- **Frontend:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, server components by default, and focused client components for interactive workflows.
- **Backend/API:** Next.js server actions and route handlers. Zod validates important inputs. `/api/v1` provides organization-scoped read-only resources and CSV/JSON exports.
- **Database:** Supabase PostgreSQL with ten ordered migrations. Tenant tables carry `organization_id`; RLS and composite organization foreign keys provide the principal isolation boundary.
- **Authentication:** Supabase Auth with SSR session refresh, protected workspace routes, invitation acceptance, and server-derived workspace identity.
- **Tenancy:** Organizations and active organization memberships. Current identity selection takes the first active membership, so multi-workspace switching is not supported.
- **Authorization:** Central permission matrix for Owner, Admin, Engineer, Reviewer, and Viewer, reinforced by RLS and guarded server actions.
- **Files:** Private Supabase Storage bucket, organization-prefixed paths, short-lived signed downloads, size/MIME/signature validation, and metadata in `attachments`. Malware scanning is an interface with a non-scanning beta implementation.
- **Reports:** Persisted sections, datasets, statistics, figures, acceptance criteria, reviews, submit/review/approval functions, approved-record mutation guards, revisions, guarded AI suggestions, and server-generated PDFs.
- **Traceability:** Supplier/component/lot/inspection relationships, device builds with exact component-lot items, experiment-build/equipment links, readiness snapshots, and immutable evidence packets.
- **Integrations:** Stripe checkout/portal/webhooks, Resend email, OpenAI Responses API, GitHub Actions schedules, and AWS Amplify hosting.
- **Testing:** Vitest unit tests cover permission logic and several workflows. Database-backed RLS/IDOR and full lifecycle integration tests are still missing.

## Ten highest-risk gaps

1. **Production server configuration is incomplete (P0):** `amplify.yml` omits cron, AI, and Stripe secrets from the SSR runtime artifact. The live alert job returns 401.
2. **Tenant isolation lacks automated database integration coverage (P0):** RLS is extensive, but no executable two-organization test proves reads, writes, files, exports, and APIs remain isolated.
3. **Project is not the central technical workspace (P0):** projects have a list/create page but no detail route, team, linked builds, design revisions, or consolidated activity.
4. **Design/product revision control is absent (P0):** build `revision` text and protocol/report revisions do not substitute for a linked product-design revision entity.
5. **Document capture is generic attachment storage (P0/P1):** no category/metadata model, association table, preview/review workflow, OCR extraction status, validation record, or immutable original/version model.
6. **Issue/nonconformance management is database-only (P0/P1):** the initial `issues` table has no complete service/UI workflow and limited traceability relationships.
7. **CSV analysis and provenance are incomplete (P1):** raw report datasets are preserved as attachments, but mapping, robust preview, plotting, reusable analysis configuration, criteria evaluation, and revision history are limited.
8. **Report provenance and revision browsing are incomplete (P1):** controlled revisions exist, but source-link records, clickable origin presentation, change summaries, and older-revision navigation need strengthening.
9. **Operational dashboard and pilot measurement are partial (P1):** it omits supplier qualification, inspection, lot, and issue queues; internal cross-organization NC IDEA metrics and exact activation/retention calculations are not complete.
10. **Evidence/file lifecycle hardening is incomplete (P1):** scanner is a placeholder, storage deletion can precede metadata deletion, CSP is report-only, and end-to-end private-file authorization is not tested.

## Capability matrix

| Required capability | Current implementation | Missing functionality | Relevant files/components | Database changes needed | API changes needed | UI changes needed | Security implications | Priority | Complexity |
|---|---|---|---|---|---|---|---|---|---|
| Organizations/workspaces | **Partial.** Organizations, memberships, settings and org-scoped records with RLS exist. | Workspace switcher; support for intentional active organization when a user belongs to several. | `src/lib/auth.ts`, onboarding, settings, API identity | Optional user active-workspace preference | Workspace-selection endpoint/action | Workspace switcher and clear tenant context | Never accept an unverified org ID; re-resolve membership server-side. | P0 | M |
| Tenant isolation | **Partial.** RLS, server scope checks and composite org FKs are broad. | Executable two-tenant tests for DB, API, export and files. | migrations, `src/lib/security`, API/files routes | Test fixtures only; patch any constraints discovered | Integration test harness | No major UI work | Highest-impact confidentiality risk; service-role routes require explicit scope assertions. | P0 | M |
| Five-role RBAC | **Mostly complete.** Central permission matrix and RLS use Owner/Admin/Engineer/Reviewer/Viewer. | Database-backed authorization matrix and tighter review/action coverage. | `src/lib/security/permissions.ts`, actions, RLS | Possibly RPC permission normalization | None initially | Consistent disabled/hidden states with explanations | UI checks are advisory; server/RLS remain authoritative. | P0 | S-M |
| Projects | **Partial.** Persisted create/list with experiment/report counts. | Detail page, owner/team, lifecycle dates, linked designs/builds/components/docs/activity. | projects page, workspace data/actions | Project-member table; additional lifecycle fields if required | Project detail query/actions | Central tabbed project workspace | Project links must be org-constrained. | P0 | M-L |
| Design/revision control | **Missing.** No product-design entity. | Revision number/status/effective date/owner/documents/change chain and links. | builds, projects, attachments | `designs`, `design_revisions`, link tables and same-org FKs | CRUD/revise/approve actions | Lightweight design registry/detail/history | Approved revisions should be immutable; preserve history. | P0 | L |
| Supplier management | **Mostly complete.** Contacts, qualification/risk, documents, supplied components, lots, inspection history and detail page exist. | Supplier issues, re-evaluation alerts, some edit/history polish. | suppliers pages/actions, qualification tables | Issue links; optional qualification event history | Update/archive actions as needed | Qualification timeline and issue panel | Qualification changes need audit events and role enforcement. | P1 | M |
| Components | **Partial.** Part/revision/category/specification/supplier and lot relationships exist. | Dedicated component detail, approved-supplier semantics, builds-where-used and richer document history. | components page, build genealogy | Optional component status/history; document links | Detail query/actions | Component traceability detail | Same-org supplier/component links are already essential. | P1 | M |
| Lot-level traceability | **Mostly complete.** Lots link supplier/component/inspection and exact lots link to builds. | Stronger lot-to-experiment/report navigation and issue links. | lots detail, builds, genealogy data | Issue/source-link tables; optional direct view | Consolidated trace query | Bidirectional where-used timeline | Preserve historical lots; avoid destructive cascades. | P0 | M |
| Incoming inspections | **Mostly complete.** Inspection records/results, pass/fail, lot status/disposition and attachments exist. | Rich criteria templates, issue creation on failure, lifecycle integration tests. | inspections page/actions, `inspection_results` | Inspection criteria templates; issue links | Transactional disposition RPC may help | Failure follow-up and history | Inspection-to-lot consistency constraint exists; test atomicity. | P0 | M |
| Product/prototype builds | **Mostly complete.** Device builds, exact component/lot items, status and experiment links exist. | Link to true design revision, documents, builder identity/history and full reverse navigation. | builds pages, migration `...0010...` | Design revision/document links; builder FK | Detail query expansion | Revision/source links and build activity | Material selection is server-validated; retain same-org composite FKs. | P0 | M |
| Experiment/test records | **Mostly complete.** Objective, method/protocol, conditions, results/conclusion, samples, builds, equipment, readiness and evidence exist. | More complete inline raw-data/document/criteria/report story and deviation handling. | experiments pages, lab/traceability actions | Source-link and document association tables | Aggregated experiment-detail query | Consolidated story/tabs | Readiness must be recalculated server-side and snapshots immutable. | P0 | M |
| CSV import and analysis | **Partial.** Experiment/inventory CSV imports, preview, report datasets/statistics and original attachments exist. | Quoted-field-safe client preview, x/y mapping, plots, reusable config, analysis revisions and explicit original hash. | imports, report dataset route, report builder | Dataset analysis versions/config/results; explicit original hash/version | Preview/analyze/commit endpoints | Mapping wizard, validation, plots | Never mutate raw files; formula/CSV injection protection on export. | P1 | L |
| Acceptance criteria | **Partial.** Structured report criteria and pass/fail exist. | First-class reusable templates, more operators, experiment/dataset links and units/source provenance. | report actions/UI, `acceptance_criteria` | Criteria template/version and application tables | Template CRUD/apply | Criteria library and clear evaluation | Approved applications must not change when a template changes. | P1 | M-L |
| Engineering reports | **Mostly complete.** Persisted sections, data/statistics/figures, submit/review/approve, revisions, AI suggestions and PDF exist. | Deeper auto-population, explicit engineering-decision/deviation blocks and source links. | report pages/actions/PDF/AI | Report-source and decision links | Source-link endpoints/actions | Source inspector and report assembly UX | Approved content mutation guards already exist; extend to sources. | P0 | M |
| Report provenance | **Partial.** Related records and evidence are available but provenance is not a dedicated model. | Clickable source links for each report datum/section/criterion. | report detail/PDF, data layer | `report_source_links` with entity type/id/snapshot | Resolve/add/remove source actions | Inline “source” chips and provenance panel | Validate entity type/id and org; snapshot display-critical metadata. | P1 | M-L |
| Report review/approval | **Mostly complete.** Controlled statuses, reviewer records, timestamps and immutable approved content. | Comment threads/changes-requested UX and fuller reviewer assignment/history. | controlled workflow migration, report page/actions | Optional review comments/events | Review action expansion | Review queue and threaded decisions | Reviewer must not inherit owner rights; controlled RPCs are preferred. | P0 | M |
| Revision history | **Partial.** New revisions and immutable approved revisions exist. | Revision index/navigation, change summary enforcement and explicit supersession chain. | report actions/page | Previous/supersedes FK and change summary if absent | Revision list/detail | Revision timeline and older revision access | Historical revisions remain readable and immutable. | P1 | M |
| PDF export | **Mostly complete.** Server PDF includes controlled report content and evidence packets have PDFs. | Visual regression tests for long tables/charts/page breaks and richer provenance. | PDF routes, `src/lib/pdf` | None initially | None | Export state/errors | Auth and org scope already required; avoid externally hosted private assets. | P1 | M |
| Document capture/Cleanote | **Partial.** Secure attachments and entity metadata exist. | Categories, metadata, multi-entity links, preview, OCR interface/status, extracted text review/verification. | files routes, attachment UI, scanner | `documents`, `document_links`, `document_extractions`, versions/status | Upload metadata, extraction and verification routes | Mobile capture, preview, categorize, review | Original immutable; AI/OCR clearly unverified until a human verifies it. | P0/P1 | L |
| Global search | **Partial.** Search covers projects, experiments, samples, inventory, equipment and protocols. | Reports, builds, components, suppliers, lots and documents; ranking/pagination. | search page, `globalSearch` | Search indexes or RPC/full-text vector | Search endpoint/RPC | Entity context/filtering | Scope every search branch by org; prevent wildcard abuse. | P1 | M |
| Traceability view | **Partial.** Build genealogy, lot detail, experiment links, readiness and evidence packets provide useful slices. | One end-to-end project→revision→lot→inspection→build→experiment→dataset→report view. | build/lot/experiment/evidence pages | Design/source/issue links | Aggregated trace endpoint/query | Usable timeline/table with drill-down | Do not expose cross-org graph edges. | P1 | L |
| Dashboard | **Partial.** Operational tasks, experiments, reports, resource warnings and activity are real. | Active projects, supplier qualification, lots awaiting inspection, failed inspections, issues and pilot status. | dashboard page/data | No major changes beyond issue data | Optimized dashboard query/RPC | Role-aware queue cards and useful empty states | Avoid cross-customer analytics in tenant dashboard. | P1 | M |
| Pilot analytics | **Partial.** Product events and organization pilot metrics exist. | Exact activation funnel, WAO/retention and report-time calculations; internal multi-org view. | analytics page, product event code | Metric snapshots/definitions; internal access role | Internal analytics job/endpoint | Founder-only portfolio view; transparent org view | Aggregate/minimize data; normal users only see their organization. | P1 | M-L |
| Onboarding | **Partial.** Organization creation and workflow templates/get-started exist. | Seven-step guided checklist, invites/project/supplier/experiment/data/report progress and skip states. | onboarding, get-started, template runs | Onboarding-state/events | Progress action/query | Persistent progress checklist | Server-derived completion prevents spoofed activation metrics. | P0 | M |
| Demo workspace | **Partial.** Fictional demo data and read-only demo presentation exist. | Confirm one complete NC IDEA trace chain including revision, CSV, approval and clear sample labeling everywhere. | demo data providers/routes | Seed migration/script if moving to DB | None initially | Guided demo path | Demo data must never mingle with customer data or enable writes. | P1 | M |
| Issues/nonconformance | **Mostly missing.** A basic `issues` table exists without a complete workflow. | Registry/detail/actions, ownership, investigation/disposition, attachments and all entity links. | initial migration; no dedicated route | Extend issues plus entity/document links and status events | CRUD/status actions | Lightweight issue workflow | Audit changes; restrict disposition to appropriate roles. | P0/P1 | M-L |
| File storage | **Partial.** Private bucket, signed URLs, MIME/signature/size checks and org paths exist. | Real malware/quarantine provider, atomic delete strategy, integration tests, stronger evidence retention. | files routes/policy/scanner, storage RLS | File status/hash/quarantine/version fields | Quarantine/restore/delete workflow | Upload state and failed-scan feedback | Current beta scanner does not scan; prevent metadata/storage divergence. | P0/P1 | M-L |
| Security hardening | **Partial.** Strong baseline RLS, server auth, validation and private storage. | Automated IDOR suite, enforced CSP, secret-rotation process, CSRF review, dependency/monitoring pipeline. | middleware, headers, APIs, docs | Test only initially | Endpoint matrix audit | Minimal | Service-role paths and exposed credentials require the most scrutiny. | P0 | M |
| Data integrity | **Mostly complete baseline.** Composite org FKs, uniqueness, locks and indexes exist. | Design/document/source/issue constraints; deliberate archive rules; delete consistency. | migrations | New same-org composite FKs and archive policies | Transactional actions/RPCs | Archive semantics | Avoid cascades for evidence-bearing records. | P0/P1 | M |
| Audit events | **Partial.** `activity_log`, operational events and AI usage record important actions. | Consistent before/after status payloads and coverage for every required lifecycle event. | activity helpers/actions | Structured JSON old/new payload fields or event table | Central audit helper | Entity timelines | Audit rows should be append-only and org-scoped. | P1 | M |
| UI/UX consistency | **Mostly complete baseline.** Shared headers, cards, tables, badges, forms, empty/loading/error states. | Better detail navigation, filters/pagination, confirmation patterns and denser traceability workflows. | shared UI, workspace routes, globals | None | None | Project hub, document capture, source links | Accessibility and clear permissions matter more than animation. | P1 | M |
| Mobile/tablet | **Partial.** Responsive grids/forms exist. | Device testing for photo capture, inspection entry and report approval; sticky actions/table fallbacks. | workspace pages/CSS | None | None | Targeted responsive refinements | Keep destructive/approval confirmations clear on small screens. | P1 | M |
| Performance | **Partial.** Server-rendered pages and useful indexes exist. | Pagination, consolidated dashboard/search queries, query profiling and bundle budgets. | data modules, dashboard/search/table pages | Additional search/index changes after profiling | Paginated endpoints/queries | Pagination/virtualization where useful | Limits also reduce denial-of-service and data overfetch risk. | P1 | M |
| Billing | **Partial.** Stripe checkout, portal and idempotent verified webhooks exist. | Runtime secrets currently omitted; Settings “Manage subscription” is not wired to portal; production lifecycle test. | billing routes, settings, `amplify.yml` | None initially | Existing portal route needs client action | Wire manage/subscribe states | Webhook signature and server-only secrets must remain enforced. | P0/P2 | S-M |
| Alerts | **Implemented but broken in production.** Preferences, deliveries, Resend digest route and scheduled workflow exist. | Amplify runtime secret packaging; live verification and observable failure reporting. | cron route, workflow, `amplify.yml` | None | Existing endpoint | Optional delivery status UI | Constant-time secret check and no secret logging; current live endpoint returns 401. | P0 | S |
| AI assistance | **Implemented but runtime-risky.** Owner opt-in, quotas, evidence-grounded drafting, usage logs, labels and explicit acceptance exist. | Amplify runtime key packaging, live verification, provider/retention operational policy. | AI route/service/settings/report UI, `amplify.yml` | Existing org and usage fields suffice | Existing guarded route | Clearly mention assistance and limitations | Never send cross-org/private data outside selected evidence; rotate exposed credentials. | P0 | S-M |
| Customer exports/API | **Mostly complete.** Scoped read-only API, OpenAPI route and owner/admin exports exist. | Evidence-resource query bug; resource expansion, documented stability/version policy. | `src/lib/api/v1.ts`, API routes/developers | None initially | Fix evidence ordering/deleted filters; add missing resources deliberately | Developer docs polish | API identity currently selects first membership; fix with workspace selection. | P1 | M |

## Proposed data-model changes

Changes should be split into reversible, additive migrations and use composite `(id, organization_id)` foreign keys wherever one tenant record references another.

1. **Design control:** `designs`, `design_revisions`, `design_revision_components`, `design_revision_documents`; immutable effective/approved revisions with `previous_revision_id`.
2. **Project team/workspace:** `project_members` plus optional project lifecycle fields; link designs and documents through explicit same-org relationships.
3. **Documents:** promote evidence-bearing files to `documents`; add `document_versions`, polymorphism-safe or typed `document_links`, and `document_extractions` with Original/Extracted/Reviewed/Verified status, reviewer and timestamps.
4. **Report provenance:** `report_source_links` referencing approved entity types, source record, optional field/path, and a display snapshot. Add explicit revision predecessor/supersession and required change summary.
5. **Criteria:** `acceptance_criterion_templates`, immutable template versions, and criterion applications linked to experiments/datasets/report sections.
6. **Issues:** extend `issues` and add typed link tables for project/supplier/component/lot/build/experiment/report plus status/audit events.
7. **Dataset analysis:** add dataset versions or immutable imports, file hash, column schema, analysis configurations, generated results and figure links. Keep originals in private storage.
8. **Analytics/onboarding:** structured onboarding progress and internal metric snapshots derived from append-only product events; do not expose portfolio analytics to customer roles.
9. **Files:** scanner/quarantine status, SHA-256, retention category and storage operation status to support recoverable/consistent deletion.
10. **Workspace selection:** store an active organization preference or require an explicit verified workspace slug/header for API tokens belonging to multiple organizations.

## Roadmap

### P0 — before the first external pilot

1. Repair production runtime configuration for cron, AI and Stripe; verify live scheduled alerts and service visibility.
2. Add database-backed two-tenant authorization tests for records, service-role routes, exports and private files; fix findings.
3. Deliver a project detail workspace and lightweight design/revision model linked to builds and experiments.
4. Complete a minimal issue/nonconformance workflow and failure-to-issue path.
5. Add the document capture foundation: immutable original, categorization, metadata, links, preview and human-review statuses (OCR provider can follow).
6. Complete one end-to-end pilot path and test: supplier lot → inspection → build → experiment/readiness → dataset/criteria → report → review/approval → new revision.
7. Turn onboarding into a persisted, skippable activation checklist and validate the demo workspace against that path.

### P1 — during the first 5–8 pilots

1. Add reusable/versioned acceptance criteria, x/y CSV mapping, plots and analysis versions.
2. Add report source links, revision navigation/change summaries and richer PDF provenance/layout tests.
3. Deliver the consolidated traceability view, expanded global search and operational dashboard queues.
4. Complete pilot activation, WAO, retention and report-preparation-time metrics plus an internal-only portfolio view.
5. Integrate an OCR service behind the extraction interface with mandatory human review; integrate real malware scanning/quarantine.
6. Standardize filtering, pagination, confirmations and tablet/mobile workflows based on pilot usability sessions.

### P2 — commercial readiness

1. Refine plans, subscription lifecycle, self-service billing states and entitlements.
2. Expand/version the customer API, webhooks and validated import/export connectors.
3. Add SSO/audit export/retention administration only when customer interviews rank them.
4. Profile and scale high-volume search, analytics, PDFs and storage; add production SLOs and error monitoring.
5. Build advanced automation only from demonstrated pilot demand; do not imply regulatory validation.

## Founder/product decisions required

These do not block the production runtime fix, but they should be decided before their associated P0/P1 batch:

1. What constitutes a **design** versus a **design revision**, and which role may make a revision effective?
2. Should one user actively switch among multiple organizations, and how should bearer API tokens choose a workspace?
3. Which document categories and retention expectations matter for the first pilot, and may a customer opt out of external OCR/AI processing?
4. What is the smallest useful issue workflow: who may disposition an issue, and is reviewer approval required?
5. Are acceptance-criteria templates organization-wide, project-specific, or both, and who controls approved templates?
6. Which event precisely starts “report preparation time” for the NC IDEA claim: report creation, first edit, or explicit start?
7. Who may view cross-organization pilot metrics internally, and what minimum aggregation/privacy threshold should apply?

## First P0 batch

The first implementation batch is limited to **production server-runtime configuration**. It will update the Amplify environment allowlist to include only required server variable families, add a regression test, run lint/typecheck/tests/build, deploy, and verify the authenticated scheduled-alert endpoint. It does not alter the database or broad product behavior.
