# Security notes

## Implemented foundations

- Server-only database URL and auth secret.
- Strict Zod curriculum validation and typed learning state.
- Better Auth session model, secure cookies in production, bounded session lifetime, and trusted origins.
- Drizzle parameterization; no string-built SQL.
- React output escaping; curriculum is structured data rather than unsanitized runtime HTML.
- Non-root production container and minimal Alpine runtime.
- No arbitrary code execution in the web process.
- CI uses least-privilege repository permissions.

## Required before public release

- Add email verification/recovery delivery and endpoint rate limiting.
- Add a Content Security Policy with nonces, HSTS, Referrer-Policy, Permissions-Policy, and frame restrictions.
- Add authorization tests for every progress/note/bookmark mutation.
- Encrypt backups, test restore, rotate secrets, and add dependency/SBOM scanning.
- Sanitize MDX at build time if raw HTML is ever enabled.
- Add audit events for account and synchronization actions.
- Threat-model anonymous-to-account progress migration and reject cross-user IDs.

## Code runner boundary

There is intentionally no remote Go runner. Deterministic browser checks are not a security sandbox and are never represented as executing Go. A future runner must be network-isolated, ephemeral, resource-capped, non-root, and unreachable except through an authenticated broker.
