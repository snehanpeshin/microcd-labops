# Deployment

## Production path: AWS Amplify + Firebase + Supabase

1. Push this directory to a private Git repository.
2. Create a Supabase project and apply the migration in `supabase/migrations`.
3. Create a Firebase web app, enable email/password authentication, configure authorized domains, and deploy `functions/usercreated` with `firebase deploy --only functions`.
4. In Supabase **Authentication → Third-party Auth**, register the Firebase project ID. The Firebase function adds `role: authenticated` to new users; backfill that claim before launch if users predate the function.
5. Create an AWS Amplify application with this repository as its root.
6. Add every variable from `.env.example`; keep service-role and provider keys scoped to server environments. Firebase `NEXT_PUBLIC_` web settings identify the app and are not server secrets.
7. Set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS URL and add that domain to Firebase Authentication authorized domains.
8. Create Stripe products/prices and configure the signed webhook endpoint.
9. Configure Firebase Authentication email templates, password policy, abuse controls, and authorized domains. Do not rely on UI-only throttling.
10. Configure private storage malware scanning or quarantine. `BetaFileScanner` is policy validation only and is not a malware scanner.
11. Deploy with demo mode enabled, run the staging tenant-isolation protocol, Stripe webhook replay tests, invitation lifecycle, and restore drill.
12. Set `NEXT_PUBLIC_DEMO_MODE=false` only after the release owner signs the launch checklist.

## Verification commands

Use Node 22. From a clean checkout run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`. After deploy, confirm `/api/health` returns `status: ok` and the expected commit version. A demo or degraded response is not a production pass.

## Database release safety

Apply all migrations to staging first, including `202607140003_controlled_records.sql`. Follow `TENANT_ISOLATION_TEST.md`. Back up before schema changes. Never run service-role credentials in browser code.

## Legacy callback

`/auth/callback` remains temporarily available for legacy Supabase Auth links. New production signup, verification, sign-in, and password-reset flows use Firebase Authentication and do not depend on a PKCE verifier.
