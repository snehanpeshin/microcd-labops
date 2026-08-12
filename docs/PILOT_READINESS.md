# Pilot Readiness Checklist

Assessment date: August 12, 2026  
Legend: **Complete** = implemented and sufficiently verified; **Partial** = implemented with a material gap; **Missing** = no usable workflow; **Blocked** = external dependency or decision prevents verification.

| Area | Status | Evidence and remaining work |
|---|---|---|
| Authentication | Complete | Supabase Auth, SSR session refresh, protected routes, signup/login/reset and invitation acceptance are implemented. |
| Tenant isolation | Partial | Broad RLS, org-scoped server queries and composite FKs exist; automated two-organization database/API/file tests are required. |
| Onboarding | Partial | Organization creation and workflow templates exist; the seven-step persisted/skippable activation flow does not. |
| Project creation | Partial | Create/list is persistent; the central project detail workspace, team and full related-record view are missing. |
| Supplier creation | Complete | Persistent registry, contacts, qualification/risk, documents, components, lots and detail history exist. |
| Component creation | Partial | Persistent component/supplier/lot records exist; dedicated traceability detail and builds-where-used need work. |
| Lot creation | Complete | Lots link supplier/component, inspection status/disposition and exact build genealogy. |
| Incoming inspection | Complete | Persisted inspections/results, attachments and disposition updates exist; integration coverage remains desirable. |
| Build creation | Complete | Device builds and exact component-lot genealogy are implemented. A true design-revision link is pending. |
| Experiment creation | Complete | Persistent experiment, protocol, samples, builds, equipment, readiness and evidence workflows exist. |
| CSV import | Partial | Experiment/inventory imports and report datasets exist; x/y mapping, robust preview, analysis history and plots are incomplete. |
| Acceptance criteria | Partial | Structured report criteria and pass/fail exist; reusable/versioned templates and experiment/dataset application do not. |
| Report generation | Complete | Persistent sections, datasets/statistics/figures, guarded AI suggestions and source data are supported. Explicit provenance links need work. |
| Report review | Complete | Submit, review, changes requested/approval controls and immutable approved content are implemented. |
| Revision history | Partial | Controlled new revisions exist; older-revision navigation, change summaries and explicit supersession need improvement. |
| PDF export | Complete | Authenticated engineering-report and evidence-packet PDFs exist; long-table/chart visual regression testing is pending. |
| Document capture | Partial | Private validated uploads exist; categorization, metadata, multi-entity links, preview and reviewed OCR/extraction are missing. |
| Traceability | Partial | Lot/build/experiment genealogy, readiness and evidence exist; design revisions, issues, report provenance and one consolidated view are incomplete. |
| Analytics | Partial | Organization product events and pilot metrics exist; activation/retention/WAO/report-time calculations and internal portfolio reporting are incomplete. |
| Backups | Partial | Backup/recovery procedures are documented; current production restore evidence and drill results require operational verification. |
| Error monitoring | Missing | Operational event storage exists, but no production error-monitoring service/on-call workflow is evident. |
| Privacy | Partial | Privacy/AI-use/retention documents and tenant controls exist; external AI/OCR processing and retention choices require policy decisions. |
| Security | Partial | Strong baseline controls exist; two-tenant integration tests, enforced CSP, scanner integration and production secret rotation remain. |
| Demo workspace | Partial | Realistic fictional read-only data exists; validate a single end-to-end NC IDEA trace story and sample labeling on every route. |

## Current release blocker

The Amplify build omits required server-only runtime variables. Scheduled alerts currently fail authorization, and AI/Stripe availability may be incorrectly disabled. This is the first P0 batch and must be verified in production before the checklist can support an external pilot decision.

## Pilot proof targets

The application should measure—never fabricate—8 pilot organizations, 20+ active users, at least 60% weekly organization engagement, report-preparation time sufficient to evaluate a 40% reduction hypothesis, pilot-to-paid conversion, customer retention and product usage frequency.
