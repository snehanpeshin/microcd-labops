# Backup and recovery runbook

## Production baseline

Use a paid Supabase plan with automated database backups and point-in-time recovery appropriate to the pilot contract. Confirm the actual retention window in the Supabase dashboard; this repository cannot enable or prove provider backups. Keep storage-object recovery separate from database recovery because database backups do not necessarily restore deleted storage objects.

## Restore drill

1. Record the incident start time, affected organization, and last known good timestamp.
2. Freeze writes by enabling a hosting maintenance response or revoking application database access.
3. Create a new recovery project. Never overwrite the only production copy during a drill.
4. Restore the database to the selected timestamp and reconcile private storage objects against `attachments.storage_path`.
5. Run the two-tenant isolation suite and sample report, supplier, lot, inspection, attachment, membership, and subscription checks.
6. Rotate service credentials if compromise is possible, update hosting secrets, and redeploy.
7. Have the incident owner approve cutover, preserve logs, and document recovery-point and recovery-time results.

## Required evidence

Before private beta, store screenshots or provider exports showing backup status, retention, the latest successful backup, named incident owner, and one successful staging restore. Repeat the drill at least quarterly during beta and after material schema changes.
