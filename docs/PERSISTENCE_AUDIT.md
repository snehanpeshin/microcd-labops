# Persistence Audit

Audit date: July 14, 2026

Classification meanings:

- **Fully persistent**: stored in PostgreSQL or private object storage and used by the production UI.
- **Partially persistent**: schema or write path exists, but the complete UI workflow does not read and write it.
- **Demo-only**: deliberately fictional data shown only when demo mode is active.
- **Mock-only**: production-looking UI uses static or browser-only state.
- **Broken**: a visible action cannot complete its stated workflow.
- **Not implemented**: required workflow has no product path.

## Screen and workflow inventory

| Area | Current classification | Evidence and launch gap |
| --- | --- | --- |
| Marketing and legal pages | Fully persistent (source-controlled content) | No database requirement. Attorney review remains required. |
| Signup, login, password reset | Partially persistent | Supabase Auth calls exist. No automated email-verification or abuse-control test. |
| Workspace onboarding | Partially persistent | `create_workspace` persists organization, owner membership, and trial subscription. Redirect/error recovery requires integration tests. |
| Dashboard | Demo-only | All metrics and activity use `src/lib/data/demo.ts`. |
| Projects | Mock-only | List is static and “Create project” has no form or write action. |
| Engineering report list/detail | Mock-only | Static demo records; detail and PDF export do not load PostgreSQL records. |
| Report builder | Mock-only | CSV is processed in the browser and the draft is stored in `localStorage`; no dataset, statistics, criteria, or report persistence. |
| AI drafting | Partially persistent | Auth and role checks exist, but report/project ownership, organization opt-in, usage, cost, and persisted acceptance are missing. |
| PDF export | Demo-only | Generates only the fictional report; no immutable approved-revision snapshot. |
| Suppliers | Mock-only | Static demo list/detail; no persistent creation or qualification workflow. |
| Components | Mock-only | Static demo list; no persistent create/link workflow. |
| Lots and shipments | Mock-only | Static demo records; no persistent receipt workflow. |
| Inspections | Mock-only | Static demo records; no persistent inspection results or atomic lot disposition update. |
| Issues | Not implemented | Table exists, but there is no screen or workflow. |
| Activity log | Mock-only | Static demo activity. Existing schema policy incorrectly permits engineers to insert audit entries and must be corrected. |
| Notifications | Not implemented | Table exists, but there is no server workflow or UI. |
| Settings | Mock-only | Shows hardcoded organization/member/plan values; save and invite controls are disabled. |
| Invitations | Not implemented | Basic table exists, but no secure issue, email, validation, acceptance, revoke, or resend lifecycle. |
| File storage | Partially persistent | Private bucket and basic path policies exist. No server upload authorization, content signature check, signed-download route, usage accounting, audit, or deletion workflow. |
| Leads/demo requests | Partially persistent | Validated server insert and honeypot exist. Rate limiting and confirmation email are missing. |
| Stripe checkout | Partially persistent | Checkout and signature verification exist. Annual plans, portal, limits, idempotent events, invoice failures, and tests are missing. |
| Subscription state | Partially persistent | Webhook upserts one subscription row. Event idempotency and complete event coverage are missing. |
| Data export/deletion | Not implemented | No owner workflow, asynchronous export, retention, or deletion process. |
| Health and monitoring | Not implemented | No health endpoint, correlation IDs, structured operational errors, or monitoring provider adapter. |

## Database inventory

The initial migration defines organizations, memberships, projects, reports, sections, criteria, reviews, suppliers, supplier documents, components, supplier-component relationships, lots, shipments, inspections, issues, attachments, activity, notifications, subscriptions, and leads. Definitions alone do not make a workflow persistent. The production UI must query and mutate these tables through authenticated, organization-scoped server paths.

Missing launch records include invitation lifecycle fields, report revision snapshots, uploaded datasets, generated statistics, figures, supplier contacts, qualification decisions, inspection measurements, Stripe event idempotency, AI usage, rate-limit counters, file usage, and operational failure logs.

## Beta gate

The application is **NO-GO** for accepting payment or storing customer engineering files at this audit baseline. A private fictional-data pilot may be demonstrated only with the visible demo notice and without implying persistent production workflows.
