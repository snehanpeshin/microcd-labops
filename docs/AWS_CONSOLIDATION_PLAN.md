# LabOps AWS consolidation plan — 17 November 2026

Status: architecture and migration preparation only. No production database, users, files,
identity permissions, DNS or paid AWS resources are changed by this plan.

## Recommendation

Keep the existing Amplify application and migrate in stages toward managed PostgreSQL on
Amazon RDS, Cognito user pools, and private S3 storage. Preserve the relational model and
application record IDs. Do not rewrite this schema into DynamoDB for consolidation alone.
RDS versus Aurora sizing must follow a workload and cost review; no savings are assumed.

Self-hosting Supabase on AWS is an alternative with fewer application API changes, but the
team would operate its database, Auth, PostgREST, Storage and supporting services. It is
not the same as replacing Supabase with AWS-managed equivalents. Prefer the managed AWS
target if reducing platform dependencies is the long-term goal and the migration effort is justified.

## What exists in the repository

- Amplify hosts the Next.js application; `amplify.yml` produces `.next`.
- 53 TypeScript/TSX source files reference Supabase; 12 SQL migration files define the database.
- Supabase SSR clients maintain sessions, validate users and select organization membership.
- Public tables and RPC functions rely on `auth.uid()`, `auth.users`, authenticated roles,
  organization membership, RLS policies and server-side role checks.
- Supabase private storage and signed URLs are part of attachment and evidence workflows.
- Stripe, OpenAI and email are separate integrations, not automatically migrated with the database.
- The live public website and repository do not establish tenant counts, data size, object
  volume, auth providers, backup coverage, billing, or actual production environment settings.
  Those must be inventoried through authorized account access before choosing resources.

| Existing responsibility | Proposed AWS responsibility | Required application work |
| --- | --- | --- |
| Amplify Next.js hosting | Existing Amplify app | Preserve domain, routes and runtime environment |
| Supabase PostgreSQL/PostgREST/RPC | RDS PostgreSQL behind server-only repository methods | Replace SDK queries and RPC transport; preserve SQL transactions and constraints |
| Supabase Auth and SSR cookies | Cognito user pool and server-validated sessions | Rewrite callback, signup, recovery, refresh, invitations and session validation |
| `auth.uid()` and organization RLS | Verified application identity plus transaction-scoped PostgreSQL context | Preserve tenant isolation and least-privileged database roles |
| Supabase private Storage | Private S3 objects with short-lived signed access | Preserve organization checks, file policy, object mapping and download authorization |
| Operational secrets | AWS-managed runtime secret configuration | Ensure server-only access; never copy secrets into source or client bundles |
| Alert scheduling | Existing scheduler initially; optional EventBridge later | Preserve deduplication, role scope and delivery controls |

## Implementation stages and acceptance gates

1. **Inventory and restore rehearsal.** Establish active users and tenants, tables/functions/
   extensions, database version and volume, object inventory, auth providers, integrations,
   and existing AWS resources. Obtain consistent backups and restore into an isolated staging
   environment. Inventory contains counts and checksums, not customer content in source control.
2. **Provider boundaries.** Introduce interfaces for identity/session, database repositories,
   transactions and private object storage. Keep Supabase as the active provider while
   contract tests verify unchanged behavior. This release's shared CSV parser is independent
   of the provider and validates preview/import structure consistently.
3. **Database and authorization.** Port the 12 migrations, functions, triggers and policies to
   staging PostgreSQL. Replace Supabase-specific auth helpers intentionally. Map verified
   identity to an existing application UUID and organization membership. Set transaction-local
   user/tenant context server-side and test connection reuse. An application connection must
   not bypass RLS; an untrusted client must not select its own tenant context. Test every role
   against own-tenant and foreign-tenant records, including RPC, exports, attachments and jobs.
4. **Identity and objects.** Maintain a mapping between Cognito `sub` and existing user UUIDs;
   do not rewrite author IDs or historical audit entries. Choose an explicitly tested password
   reset or Cognito migration-trigger flow, including OAuth/MFA users and dormant accounts.
   A PostgreSQL dump is not a Cognito password import. Copy objects separately, verify counts,
   byte sizes and checksums, preserve original paths through a mapping, and test private access.
   Preserve evidence-packet bytes/checksums and historical snapshots without regeneration.
5. **Staging workflow rehearsal.** Exercise login/recovery/invitations, organization selection,
   protocol revisions, experiment readiness, inventory transactions and CSV rollback,
   independent approvals, audit activity, immutable packets, file quarantine/access, billing
   webhooks, email deduplication and AI authorization. Run the existing tenant-isolation protocol
   and a restore drill. Verify health/version reporting with real dependencies, not demo mode.
6. **Reviewed production cutover.** Select an acceptable maintenance window and tested rollback
   thresholds. Freeze writes, take the final consistent backup, reconcile data and objects,
   switch provider configuration, invalidate sessions as required, and run smoke tests.
   If writes occur on the new system, rollback needs a tested reconciliation path; changing an
   environment variable back alone is insufficient. Retain the original service and backups
   until the agreed retention period and verification are complete.

## Decisions required before provisioning or cutover

- Production usage, database/object size, region and recovery requirements.
- Target AWS monthly budget and reviewed resource estimate, including networking, backups,
  secrets, monitoring, storage and data transfer. Consolidation is not a guarantee of lower cost.
- Identity migration strategy and any user-facing reset/reauthentication communication.
- Restore evidence, acceptance criteria, maintenance window and rollback ownership.
- Email readiness: the AWS account's us-east-1 SES service was still in sandbox mode during
  the 17 November review. Verify the selected Cognito/email delivery path before relying on it.

## Sources

- Supabase self-hosted restore scope, token implications and separate object migration:
  https://supabase.com/docs/guides/self-hosting/restore-from-platform
- Supabase self-hosting responsibilities:
  https://supabase.com/docs/guides/self-hosting
- Cognito user migration trigger:
  https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-import-using-lambda.html
- S3 private objects and presigned access:
  https://docs.aws.amazon.com/AmazonS3/latest/userguide/ShareObjectPreSignedURL.html
