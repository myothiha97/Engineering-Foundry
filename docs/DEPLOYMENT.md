# Deployment and operations

## Initial target

Deploy each app as a container on Fly.io, Railway, or Render and use the provider’s managed PostgreSQL. This is simpler to operate than Kubernetes, keeps costs bounded, and supports rolling deploys, TLS, health checks, logs, and horizontal app scaling.

## Release

1. CI validates content, types, lint, format, tests, builds, and smoke flows.
2. Build immutable images tagged with commit SHA.
3. Back up the database and run additive/backward-compatible migrations as a release job.
4. Deploy apps, verify readiness and synthetic learning flow, then promote traffic.
5. Remove old schema only in a later release after all old app versions are gone.

## Rollback

Roll back to the previous image. Database migrations must use expand/contract so app rollback does not require destructive schema rollback. If data repair is necessary, stop writes and run a reviewed forward repair.

## Backups and monitoring

Use daily automated backups with point-in-time recovery where supported, retain at least 14 days, and run a quarterly restore drill. Alert on elevated 5xx rate, auth failure anomalies, PostgreSQL saturation, exhausted connections, migration failure, slow page response, and failed synthetic lesson completion. Track availability, p95 server latency, error rate, and review-job lag as initial SLIs.

## Local containers

`docker compose up --build` runs PostgreSQL and both applications. The provided compose file is for development, not an internet-facing production topology.
