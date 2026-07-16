# Tenant isolation test protocol

## Automated controls in this repository

- Every tenant-owned read filters by the authenticated membership organization.
- Browser payloads never select `organization_id` for write actions.
- Composite foreign keys reject cross-organization references.
- RLS protects tenant tables and private storage paths.
- Unit tests verify role policy, indistinguishable cross-tenant failures, and upload policy.

## Required staging integration test

Create users A and B in separate organizations and an owner, engineer, reviewer, and viewer in organization A. Using real Supabase user sessions, attempt SELECT, INSERT, UPDATE, DELETE, attachment signing, invitation acceptance, report review, and foreign-key linking with guessed IDs from the other organization. Every cross-tenant operation must return no row or a generic not-found/authorization result. Verify that a viewer cannot mutate, a reviewer cannot author content, an engineer cannot manage billing or members, an admin cannot grant owner, an author cannot approve their own report, and an approved report's content triggers reject mutation.

Run the same cases through both direct Supabase calls and HTTP endpoints. Save sanitized request IDs and results as release evidence. This test cannot be truthfully marked complete until it runs against the configured staging project with two real tenants.
