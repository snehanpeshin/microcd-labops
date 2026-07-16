# Architecture

## Application

Next.js App Router provides the public site, authenticated workspace, API routes, and PDF output. Server components are the default. Interactive upload and form workflows use small client components. Supabase supplies PostgreSQL, Auth, and private object storage. Stripe, OpenAI, and Resend are optional server integrations.

## Tenant boundary

`organizations` is the tenant root. `organization_members` maps a user to one organization and role for the launch release. Every operational record stores `organization_id`. RLS checks active membership for reads and an allowed role for writes. Application queries must still filter by the current organization, and authorization failures should not reveal whether another tenant's record exists.

## Report lifecycle

Draft → in progress → ready for review → changes requested or approved → archived. Sections preserve whether text was user-authored or AI-assisted. Criteria outcomes are deterministic; overrides require a reason and actor. An approval records user, time, revision, and decision but is not represented as a regulated electronic signature.

## Traceability chain

Supplier → supplier document → supplier/component mapping → component revision → shipment/lot → incoming inspection → issue/disposition. Reports may reference inspections and projects. Attachments use generic record references while their metadata and storage path remain tenant-scoped.

## MVP boundaries

Implemented foundations include authentication setup, tenant schema/RLS, roles, demo dashboard, report analysis and PDF slice, supplier trace chain, guarded AI endpoint, Stripe checkout/webhook skeleton, lead capture, legal pages, and tests. Production CRUD forms beyond the showcased vertical slices, XLSX parsing, report chart authoring, complete invitation acceptance, scheduled notifications, full-text search, bulk export, and advanced analytics are roadmap items.
