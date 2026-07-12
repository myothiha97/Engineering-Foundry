# Future TODOs

These items are intentionally deferred. They remain required before a public production release.

## Testing

- [ ] Component tests for account, dashboard, search, graph, review, notes, and bookmarks.
- [ ] Go authentication/progress API unit and PostgreSQL integration tests.
- [ ] Migration upgrade and restore tests.
- [ ] Cross-browser and visual regression coverage.
- [ ] Load, timeout, retry, and dependency-failure tests.

## Cloud and operations

- [ ] Select production hosting and managed PostgreSQL provider.
- [ ] Configure production email delivery.
- [ ] Implement deployment credentials and release pipeline.
- [ ] Configure backups, retention, and restore drills.
- [ ] Deploy logs, metrics, traces, dashboards, and alerts.
- [ ] Document and rehearse rollback and disaster recovery.

## Security hardening

- [ ] Complete threat model and authorization audit.
- [ ] Verify CSRF and origin protections.
- [ ] Add CSP, HSTS, Referrer-Policy, Permissions-Policy, and frame restrictions.
- [ ] Replace local rate limiting with distributed enforcement before scaling horizontally.
- [ ] Add breached-password and credential-stuffing defenses.
- [ ] Add session/device management and revoke-other-sessions controls.
- [ ] Add authentication, migration, and account audit logs.
- [ ] Add secret rotation and dependency/SBOM scanning.
- [ ] Add account data export and deletion workflow.
- [ ] Complete isolation review before exposing arbitrary Go execution.

## Curriculum production

- [ ] Author every planned Go lesson to the full 16-stage standard.
- [ ] Author every planned backend lesson to the full 16-stage standard.
- [ ] Review all compiler/runtime/memory claims against current official Go sources.
- [ ] Review database/network/security content against PostgreSQL docs, RFCs, MDN, and OWASP.
- [ ] Build hidden project reference implementations and assessment rubrics.
- [ ] Conduct learner feedback sessions before marking modules production-complete.
