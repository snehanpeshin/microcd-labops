# Security Model and Threat Review

## Controls

- Supabase Auth sessions are refreshed through the Next.js proxy and resolved server-side.
- PostgreSQL RLS is enabled for every tenant-owned table.
- Organization membership and role are checked independently of URL or client state.
- Private storage paths begin with the organization UUID; signed URLs should be short lived.
- API payloads use Zod validation. Uploaded MIME types and size are constrained at the bucket and must also be verified server-side before release.
- Stripe webhooks require signature verification before subscription updates.
- Admin and third-party secrets are never exposed through `NEXT_PUBLIC_` variables.
- Demo mode is visibly labeled and rejects any implication that fictional records are real.

## Principal threats

| Threat | Launch control | Remaining work |
| --- | --- | --- |
| Cross-tenant IDOR | RLS, organization filters, not-found errors | Add database integration tests against two seeded tenants |
| Privilege escalation | Role matrix and server checks | Add invitation acceptance tests and admin event alerts |
| Malicious file | Private bucket, allowlist, size cap | Add malware scanning and content sniffing before production uploads |
| Prompt injection/data leakage | Fixed system instruction, evidence-only input, no tool access | Add provider retention review and per-organization AI consent |
| Billing spoof | Signed Stripe webhooks | Add idempotency event table and replay monitoring |
| Spam/abuse | Honeypot and input limits | Add rate limiting and bot protection at the edge |
| Accidental regulated data | Warnings and acceptable-use terms | Add classification labels, DLP evaluation, and customer agreements |

## Before production

Commission an independent penetration test, enable database backups and point-in-time recovery, define incident response and key rotation, configure CSP and rate limiting at the host, add malware scanning, review subprocessors and privacy terms, and perform a documented tenant-isolation test. Do not claim HIPAA, Part 11, ISO, SOC 2, FDA, GDPR, or other compliance without completed evidence and legal review.
