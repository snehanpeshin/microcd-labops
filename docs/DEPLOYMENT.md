# Deployment

## Recommended path: Vercel + Supabase

1. Push this directory to a private Git repository.
2. Create a Supabase project and apply the migration in `supabase/migrations`.
3. Create a Vercel project with this repository as its root.
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

Apply all migrations to staging first, including `202607140003_controlled_records.sql`, `202608100008_laboratory_operations.sql`, and `202608110009_pilot_readiness.sql`. Follow `TENANT_ISOLATION_TEST.md`. Back up before schema changes. Never run service-role credentials in browser code.

## AWS Amplify

Amplify can host Next.js, but Vercel is the lower-friction launch path for this App Router project. If Amplify is required, use Node 20+, set the same environment variables in Amplify Hosting, verify support for Next.js route handlers and proxy behavior, and test Stripe raw-body webhook handling before production cutover.
