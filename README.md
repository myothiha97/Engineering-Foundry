# Engineering Learning Platforms

Two interactive technical laboratories in one TypeScript monorepo:

- **Go Runtime Lab** — a dark, three-panel language workbench for compilation, memory, interfaces, errors, concurrency, and tooling.
- **Backend Systems Atlas** — a light architecture canvas for service lifecycle, networking, databases, security, delivery, reliability, and system design.

This repository is intentionally a vertical slice, not hundreds of generated lessons. It establishes the complete learning model and ships one production-shaped module in each course. See [ROADMAP.md](./docs/ROADMAP.md) for the expansion sequence.

## Architecture

```text
structured curriculum ──> content-schema ──> Next.js server components
                                │                    │
                                └─> learning-engine ─┴─> interactive client workspaces
                                            │
anonymous local state ── migration contract ┴── authenticated PostgreSQL state
                                                      │
                                              Drizzle + Better Auth
```

The apps share domain packages, not page layouts. `packages/learning-engine` owns mastery transitions, review scheduling, prerequisite resolution, and anonymous persistence. `packages/content-schema` validates independently editable curriculum data. Drizzle keeps the PostgreSQL model and migrations explicit. Better Auth provides session and credential primitives; deployment should add a transactional email provider before public registration.

## Requirements

- Node.js **24.18 LTS** or newer supported LTS
- pnpm **10.15.1**
- Docker Desktop or PostgreSQL 17+

The project targets React 19.2, Next.js 16.2, TypeScript 6.0, and strict TypeScript. Next.js App Router pages are Server Components; only the interactive workspaces, diagrams, persistence provider, and editor are Client Components.

## Local setup

```bash
corepack enable
cp .env.example .env
docker compose up -d postgres
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open Go Runtime Lab at `http://localhost:3000` and Backend Systems Atlas at `http://localhost:3001`.

## Environment

| Variable                      | Purpose                                                   |
| ----------------------------- | --------------------------------------------------------- |
| `DATABASE_URL`                | PostgreSQL connection string; never expose to the browser |
| `BETTER_AUTH_SECRET`          | 32+ random characters for auth signing/encryption         |
| `BETTER_AUTH_URL`             | Canonical auth origin                                     |
| `NEXT_PUBLIC_GO_APP_URL`      | Cross-app navigation and trusted origin                   |
| `NEXT_PUBLIC_BACKEND_APP_URL` | Cross-app navigation and trusted origin                   |

Generate a development secret with `openssl rand -base64 32`. Production secrets belong in the deployment platform’s secret manager, not `.env` files or images.

## Commands

```bash
pnpm dev                 # both apps
pnpm build               # production builds
pnpm content:validate    # schema + prerequisite integrity
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test                # learning-engine and schema unit tests
pnpm e2e                 # anonymous flow smoke tests
pnpm db:generate         # generate SQL from the Drizzle schema
pnpm db:migrate
```

## Content workflow

Lessons live under `content/{go,backend}` and are validated against `@platform/content-schema`. Each lesson must supply all 16 stages, contextual primary references, exercises across prediction/reading/implementation/debugging/refactoring/design, and evidence-based mastery criteria. Run `pnpm content:validate` before review. Full conventions are in [CONTENT_AUTHORING.md](./docs/CONTENT_AUTHORING.md).

## Database

The shared model includes users, sessions, accounts, progress, mastery history, exercise attempts, spaced-review items, notes, bookmarks, learning sessions, and project milestones. Anonymous state stays local until registration; the synchronization endpoint is the next implementation item and must merge monotonically by evidence rather than blindly overwrite server progress.

## Deployment

The initial target is a small container platform (Fly.io, Railway, or Render) plus managed PostgreSQL. It keeps two Node processes and one database understandable while supporting health checks, rolling deploys, backups, and separate app scaling. Do not add Redis, queues, Kubernetes, or a public code runner until requirements justify them. See [DEPLOYMENT.md](./docs/DEPLOYMENT.md).

## Documentation

- [Architecture decisions](./docs/ARCHITECTURE.md)
- [Content authoring](./docs/CONTENT_AUTHORING.md)
- [Security model](./docs/SECURITY.md)
- [Deployment and operations](./docs/DEPLOYMENT.md)
- [Implementation roadmap](./docs/ROADMAP.md)
- [Detailed continuation handoff](./docs/HANDOFF_IMPLEMENTATION_PLAN.md)
- [Deferred production TODOs](./docs/TODO_FUTURE.md)
