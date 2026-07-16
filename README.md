# MicroCD LabOps

MicroCD LabOps is a multi-tenant engineering operations SaaS for two connected workflows:

1. Engineering report generation from controlled context, source evidence, transparent calculations, explicit criteria, review, and PDF export.
2. Supplier and material traceability from qualification documents through components, lots, incoming inspections, dispositions, and issues.

The repository includes an explicitly fictional demo workspace. It does **not** claim to be a validated QMS, LIMS, ERP, PLM, CAPA, regulated electronic-signature system, or regulatory solution.

## Local start

Use Node.js 20 or 22 LTS. Node 26 is not supported by the current Next.js toolchain.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. With `NEXT_PUBLIC_DEMO_MODE=true` and no Supabase keys, `/app` uses fictional in-memory records. Do not enter confidential, patient, regulated, or production data in demo mode.

## Production services

1. Create a new Supabase project and run `supabase/migrations/202607140001_initial_labops.sql` in the SQL editor or with the Supabase CLI.
2. Set the Supabase URL, publishable key, and server-only service-role key.
3. Configure the Auth site URL and redirect URL: `https://YOUR_DOMAIN/auth/callback`.
4. Create Stripe recurring Team and Lab prices. Set their IDs and the secret key.
5. Add a Stripe webhook at `https://YOUR_DOMAIN/api/billing/webhook` for `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`.
6. Optionally configure OpenAI for guarded report drafting and Resend for lead notifications.
7. Set `NEXT_PUBLIC_DEMO_MODE=false` only after Supabase is configured and the migration is verified.

## Quality gates

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Security notes

- All customer-owned tables include `organization_id` and enable PostgreSQL RLS.
- The server obtains the authenticated user with Supabase `getUser()` and resolves active membership.
- Server actions and API routes enforce roles in addition to RLS.
- Files are private and must be accessed through short-lived signed URLs.
- Service-role, Stripe, Resend, and OpenAI keys are server-only.
- Stripe subscription state changes only after verified webhook signatures.
- AI output is labeled, prompt-versioned, and requires human review.

See [architecture](docs/ARCHITECTURE.md), [security](docs/SECURITY.md), [deployment](docs/DEPLOYMENT.md), and [launch checklist](docs/LAUNCH_CHECKLIST.md).
