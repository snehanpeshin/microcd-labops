# Launch Checklist

- [ ] Legal counsel reviews Terms, Privacy, Acceptable Use, AI disclosure, and subscription terms.
- [ ] Security reviewer tests two-tenant isolation, roles, private files, session expiry, and IDOR cases.
- [ ] Supabase backups, alerts, MFA for administrators, and key rotation are configured.
- [ ] Rate limiting, Supabase Auth CAPTCHA/limits, secure headers, and CSP enforcement are verified. CSP begins report-only and must be tightened from observed violations.
- [ ] A real malware-scanning or quarantine provider replaces `BetaFileScanner`; file policy checks alone are not malware scanning.
- [ ] Stripe test-mode checkout, cancellation, upgrade, failed payment, and webhook replay are verified.
- [ ] Email domain authentication and transactional templates are verified.
- [ ] AI provider terms, retention, opt-in, and sensitive-data restrictions are documented.
- [ ] Demo data is visibly fictional and no unsupported customer/compliance claims exist.
- [ ] Accessibility keyboard, screen-reader, contrast, zoom, and reduced-motion review passes.
- [ ] Mobile, tablet, laptop, and desktop visual checks pass.
- [ ] Pilot support owner, response expectations, backup restore drill, and incident contacts are documented.
- [ ] `/api/health` returns `ok` in production and external uptime/error alerts page a named owner.
- [ ] The staging protocol in `TENANT_ISOLATION_TEST.md` passes with two real tenants and saved evidence.
- [ ] Report submit, independent approval, immutable approved content, new revision, and approved PDF snapshot are verified.

## Pilot outcome

Measure whether one customer can create a report from evidence or trace a received lot to supplier and inspection in less time, with fewer missing fields, than their current workflow. Do not use vanity signups as the primary pilot success criterion.
