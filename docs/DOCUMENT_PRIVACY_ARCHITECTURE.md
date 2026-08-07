# Documentation privacy architecture

## Implemented boundary

The Documentation Hub local-only mode stores encrypted document envelopes in browser IndexedDB. Plaintext and the passphrase remain in the active browser process only. The application uses Web Crypto AES-256-GCM with a random 96-bit IV and PBKDF2-SHA-256 with a random salt to derive a non-exportable key. Encrypted JSON backup export is customer initiated.

This is a web MVP, not an independently reviewed cryptographic product. PBKDF2 was selected because it is available in audited browser platform APIs; Argon2id should be evaluated for a desktop/PWA release. Browser extensions, local malware, XSS, a compromised browser, screenshots, and a stolen unlocked device remain in the trust boundary.

## Data flow

```text
User input -> browser memory -> AES-GCM encryption -> IndexedDB ciphertext
                                      -> explicit encrypted backup download
```

No Documentation Hub plaintext endpoint or cloud-sync endpoint exists in this release. Existing engineering reports, supplier records, uploads, account data, billing, and separately approved AI drafting continue to use the existing server-backed architecture and must not be described as local-only.

## Threat model and controls

| Threat | Current control | Remaining risk |
| --- | --- | --- |
| Cloud/database administrator | Local document plaintext is never uploaded | Account and operational metadata remain visible |
| Network interception | No local-document content request; HTTPS elsewhere | Traffic timing and IP metadata remain visible |
| Tampered ciphertext | AES-GCM authentication rejects modification | Compromised application JavaScript can access unlocked data |
| Lost key | No support or administrator recovery key | Permanent loss without the passphrase/export |
| Stolen device | Ciphertext at rest in IndexedDB | Weak passphrases and unlocked sessions reduce protection |
| Malicious upload | Local picker allowlist and no automatic parsing | Full signature validation and sandboxed preview remain future work |
| External AI | Disabled in the Documentation Hub | Existing report AI requires separate organization approval |

## Metadata

Local document titles, sections, and content are inside the encrypted envelope. IndexedDB exposes an opaque object ID, ciphertext size, and update time. Infrastructure may still observe account identity, IP address, timing, and application access frequency.

## Recovery and deletion

MicroCD Labs does not receive the local passphrase and cannot recover local drafts. Encrypted exports contain ciphertext and KDF metadata, not plaintext or the passphrase. Local deletion removes the IndexedDB object but cannot guarantee immediate physical erasure from browser or device backups.

## Before stronger claims

Do not claim zero knowledge, end-to-end encrypted cloud sync, HIPAA, GxP, Part 11, GDPR, ISO certification, or validated-system status. Required next work includes independent cryptographic review, CSP/XSS hardening, Argon2id evaluation, encrypted import UX, device-key strategy, malware scanning, penetration testing, privacy/legal review, and a ciphertext-only tenant-isolated sync service.
