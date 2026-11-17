# Medical-device operations: FDA mapping and implementation scope

Reviewed against official FDA sources on November 17, 2026.

FDA's Quality Management System Regulation (QMSR), effective February 2, 2026, incorporates ISO 13485:2016. The applicable requirements depend on the device, intended use, establishment activities, exemptions, and lifecycle stage. This document is a curated planning map, not an exhaustive device-specific legal determination. A business operating only as an engineering services provider can have different obligations from a finished-device manufacturer, specification developer, contract manufacturer, importer, or labeler.

## Nine dashboard areas

| Dashboard | Operational requirements to assess | LabOps workflows and source records |
|---|---|---|
| Quality management | QMS scope/responsibilities; document and record control; risk; nonconformances; audits; management review; design controls where applicable | Governance, document control, risk, audit, nonconformance, design/change, safety/performance, and conditional clinical workflows; existing document dockets and Regulatory Navigator |
| Suppliers | Risk-based supplier selection, evaluation, purchasing specifications, outsourced-process controls, monitoring and re-evaluation | Supplier qualification workflow; supplier/component registries; live supplier and risk counts |
| Production and release | Controlled production/service; acceptance and release; process validation where results cannot be fully verified; equipment; environment; labeling/packaging | Production history/release, validation, equipment, environment, labeling workflows; device builds and inspections |
| Complaints | Complaint review, investigation or justified decision not to investigate; specified complaint records; reportability assessment; follow-through | Complaint, service, and postmarket workflows; connected CAPA origins/follow-ups |
| CAPA | Investigation of causes, risk-proportionate actions, verification/validation and effectiveness | CAPA, nonconformance and design-change workflows; linked experiment/report evidence |
| Reporting | Role-specific MDR assessment; reportable corrections/removals; applicable establishment registration/listing and marketing authorization; conditional study reporting | MDR, recall/correction/removal, registration and clinical workflows; manually assessed due dates and submission references |
| Traceability | Identification/UDI; traceability as applicable; storage/preservation/distribution records; product or batch history | UDI, distribution, production-release and recall workflows; build genealogy, material lots, shipment records |
| Training | Role competence, procedure/version-specific training, effectiveness and retraining | Training/competence workflow; protocol and controlled-document source links |
| Software assurance | Intended use and risk-based assurance for production/QMS software; electronic-record/signature applicability; device cybersecurity where applicable | Software-assurance and cybersecurity workflows; assurance/risk/results/record-control fields and evidence links |

## What this release implements

- Nine visual dashboards with operational state distributions, review/deadline queues, area navigation, workflow starters, and existing-registry counts where relevant. Counts are explicitly operational, not compliance scores.
- Twenty-six versioned workflow definitions with required, domain-specific fields and FDA source references. A record's applicability requires a documented rationale.
- Proposed persistence for draft/in-progress/review/changes-requested/reviewed-closure records, due dates, responsible-owner labels, priority, and immutable origin links.
- Organization-scoped evidence references to existing projects, experiments, reports, protocols, samples, equipment, lots, builds, and immutable evidence packets.
- Author and last-editor separation from the closure reviewer; role checks; optimistic concurrency; required information/evidence checks before review; immutable closures for application users.
- Proposed transaction-coupled revision snapshots. Application users cannot insert, rewrite, or delete history directly. Privileged database administrators remain outside that application-level guarantee.
- An evidence-passport JSON export with source references, connected follow-ups, recent event snapshots, and a documented SHA-256 digest. The digest detects byte changes; it does not prove authorship or constitute a digital signature.
- Integration of open high-priority, overdue and review operations records into the existing attention center once persistence is activated.

Production database activation requires explicit approval. Until the additive migration is approved and applied, the dashboards show an activation notice, existing source-registry counts remain live, templates can be inspected, and creation/review actions fail closed. The migration adds three tables, five RLS policies, two trigger functions in a private schema, two triggers, indexes, and 26 public-reference workflow definitions. It does not replay earlier migrations or modify existing business records.

## Important distinctions

The workflow names and mandatory review fields are LabOps implementation choices intended to organize evidence; FDA does not mandate these exact screen titles, field layouts, independent-review rule, or a universal software dashboard.

This release does not implement legally equivalent Part 11 electronic signatures, claim computer-software-assurance completion, automatically decide reportability, submit FDA reports, automatically approve suppliers, or enforce device-build release through these case records. Existing supplier/build status controls remain their own workflows. Evidence links are references to source records, not frozen copies of every source; use existing immutable experiment evidence packets for frozen execution evidence.

A reviewed closure is a human workflow decision. It does not establish that a device, QMS, record set, or software system satisfies all applicable regulatory requirements. Production use as a regulated record system requires documented intended use, procedures, role provisioning, retention/backup/restore decisions, applicable Part 11 controls, and risk-based assurance. Database-level policy/trigger verification remains an activation gate after the production migration is authorized.

## Reporting-clock handling

Manufacturer MDR reports generally use 30 calendar days after awareness for reportable deaths, serious injuries, and malfunctions; qualifying five-day reports use five work days. Reportable corrections/removals generally require reporting within ten working days of initiation. Applicability, event definitions, exceptions, supplemental reporting, calendar rules, and the actual deadline must be confirmed by responsible regulatory personnel. LabOps stores the assessed due date and submission reference; it does not calculate a legal deadline from incomplete facts or file a report.

## Differentiation roadmap

| Opportunity | Value | Current state / next gate |
|---|---|---|
| Connected device evidence passport | Carry investigation context, revision history and supporting evidence across teams | Export code and linked-origin model included; persistence pending activation; qualified assurance before regulated reliance |
| Automatic change-impact graph | Show which requirements, methods, lots, training, risks and release decisions are affected by a changed source | Origin/follow-up links included; automatic traversal and controlled change impact remain future work |
| Recall rehearsal | Reconstruct affected lots/builds/shipments, reconcile quantities and record a simulated effectiveness exercise | Existing genealogy sources and recall template provide the foundation; simulation engine and verified coverage remain future work |
| Release rehearsal | Explain each unmet release prerequisite with the exact underlying evidence and accountable owner | Existing experiment readiness and new operations dashboard are separate foundations; native production release enforcement requires a defined, validated integration |
| Procedure-to-competence impact | Identify affected staff when an approved procedure changes and demonstrate retraining effectiveness | Training records included; revision-triggered assignments, staff matrix and automatic reminders remain future work |
| FDA source-change impact review | Version official sources and route changes to affected product/QMS requirements | Curated dated source references included; monitored retrieval, diff review and human-approved mapping remain future work |
| Instrument-to-evidence connectors | Capture source files, device/firmware/configuration, checksums and run context with minimal manual transcription | Requires connector-specific authorization, data-integrity tests and intended-use assurance; no equipment control is introduced here |

A defensible differentiation is evidence continuity from engineering through quality and postmarket decisions. Adding unsupported compliance badges or automatic approvals would undermine that value.

## Official sources

- [QMSR / incorporated ISO 13485 framework](https://www.fda.gov/medical-devices/postmarket-requirements-devices/quality-management-system-regulation-qmsr)
- [QMSR FAQs, including inspectable management-review and audit records](https://www.fda.gov/medical-devices/quality-management-system-regulation-qmsr/quality-management-system-regulation-frequently-asked-questions)
- [QMSR final rule, including 21 CFR 820.35 and 820.45](https://www.fda.gov/media/177022/download)
- [Manufacturer/importer mandatory reporting](https://www.fda.gov/medical-devices/postmarket-requirements-devices/mandatory-reporting-requirements-manufacturers-importers-and-device-user-facilities)
- [Recalls, corrections and removals](https://www.fda.gov/medical-devices/postmarket-requirements-devices/recalls-corrections-and-removals-devices)
- [Registration and listing](https://www.fda.gov/medical-devices/how-study-and-market-your-device/device-registration-and-listing)
- [UDI system](https://www.fda.gov/medical-devices/device-advice-comprehensive-regulatory-assistance/unique-device-identification-system-udi-system)
- [Part 11 scope and application guidance](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/part-11-electronic-records-electronic-signatures-scope-and-application)
- [Computer software assurance guidance, February 2026](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/computer-software-assurance-production-and-quality-management-system-software)
- [Device cybersecurity guidance, February 2026](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/cybersecurity-medical-devices-quality-management-system-considerations-and-content-premarket)
- [IDE responsibilities](https://www.fda.gov/medical-devices/investigational-device-exemption-ide/ide-responsibilities)
- [FDA device databases: classification, authorizations, recalls, MAUDE, standards and TPLC](https://www.fda.gov/medical-devices/device-advice-comprehensive-regulatory-assistance/medical-device-databases)
