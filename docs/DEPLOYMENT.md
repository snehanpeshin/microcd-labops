# Deployment

## Existing Amplify application and Supabase setup

1. Push this directory to a private Git repository.
2. Create a Supabase project and apply the migration in `supabase/migrations`.
3. Use the existing Amplify application for this repository. Keep its production domain and environment configuration.
4. Add every variable from `.env.example`; keep service-role and provider keys scoped to server environments.
5. Set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS URL.
6. In Supabase **Authentication → URL Configuration**, set the Site URL to `https://labops.microcdlabs.com` and add `https://labops.microcdlabs.com/auth/callback` to Redirect URLs. Keep the Amplify callback URL only if that hostname is still used for testing.
7. In Supabase **Authentication → Email Templates → Confirm sign up**, use a server-verifiable token-hash link:

   ```html
   <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/onboarding">Confirm your email</a>
   ```

   This avoids relying on a PKCE verifier from the browser where signup began. Send a fresh confirmation email after changing the template; previously issued links keep their old format.
8. Create Stripe products/prices and configure the signed webhook endpoint.
9. Configure Supabase Auth email limits, CAPTCHA, redirect allowlists, and leaked-password protection. Do not rely on UI-only throttling.
10. Configure private storage malware scanning or quarantine. `BetaFileScanner` is policy validation only and is not a malware scanner.
11. Set a high-entropy `CRON_SECRET` and configure a daily scheduler to call `POST /api/cron/alerts` with `Authorization: Bearer $CRON_SECRET`. Confirm Resend delivery and notification-delivery deduplication in staging.
12. Deploy with demo mode enabled, run the staging tenant-isolation protocol, Stripe webhook replay tests, invitation lifecycle, CSV import rollback checks, API tenant-boundary tests, and restore drill.
13. Set `NEXT_PUBLIC_DEMO_MODE=false` only after the release owner signs the launch checklist.

## Verification commands

Use Node 22. From a clean checkout run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`. After deploy, confirm `/api/health` returns `status: ok` and the expected commit version. A demo or degraded response is not a production pass.

## Database release safety

Apply all migrations to staging first, including `202607140003_controlled_records.sql`, `202608100008_laboratory_operations.sql`, `202608110009_pilot_readiness.sql`, and `202608110010_device_genealogy_readiness_evidence.sql`. Follow `TENANT_ISOLATION_TEST.md`. Back up before schema changes. Never run service-role credentials in browser code. The readiness migration adds only organization-scoped tables and indexes; evidence rows are intentionally append-only for authenticated users.

## AWS Amplify

The existing application uses Amplify. Its build configuration selects Node 22 and runs lint,
type checks, tests and the production build. Preserve the server-only environment configuration,
verify route handlers and proxy behavior, and test Stripe raw-body webhook handling after
deployment changes. See [AWS consolidation](AWS_CONSOLIDATION_PLAN.md) before replacing
Supabase; changing hosting configuration does not migrate authentication, database policies or files.
