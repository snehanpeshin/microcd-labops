# Data retention and deletion

This is an operational baseline, not legal advice. Contract terms and counsel-approved policies control production behavior.

| Data class | Beta baseline | Deletion behavior |
| --- | --- | --- |
| Active workspace records | For the account lifetime | Owner-requested deletion after identity verification |
| Soft-deleted projects, reports, suppliers, components, lots | 30 days | Permanently purge after the recovery window |
| Private attachments | Same as parent record | Delete storage object, then metadata; verify both |
| Audit/activity records | 12 months minimum | Restricted, append-only; extend if contract or law requires |
| Security and rate-limit events | 90 days | Aggregate or purge on schedule |
| Stripe event metadata | 13 months | Never store full card data |
| AI usage metadata | 12 months | Prompt content is not stored by LabOps; provider retention must be reviewed |
| Backups | Provider-configured window | Expire automatically under the configured backup policy |

Deletion is not instantaneous across backups. Workspace deletion must be a support-led, owner-confirmed process during beta and should produce an auditable deletion receipt. Legal holds suspend ordinary deletion. Do not accept PHI or regulated production records in the beta.
