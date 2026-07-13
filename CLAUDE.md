# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**Engineering Learning Platforms** — a pnpm + Turborepo monorepo shipping two interactive Next.js learning apps that share domain packages (not layouts):

- **Go Runtime Lab** (`apps/go-learning`, port 3000) — dark three-panel language workbench.
- **Backend Systems Atlas** (`apps/backend-learning`, port 3001) — light architecture canvas.

Intentionally a vertical slice, not a full course library. Targets React 19.2 / Next.js 16 / TypeScript 6 (strict). Requires Node ≥24.17 and pnpm 10.15.1 (`corepack enable`).

> This directory is not its own git repo — it lives under the `~/` git tree. `content/` and `services/` are **not** pnpm workspace members (only `apps/*` and `packages/*` are); they are referenced by relative path.

## Commands

Run from the repo root:

```bash
docker compose up -d postgres   # Postgres 17 (learning/learning@localhost:5432/engineering_learning)
pnpm install
pnpm db:generate && pnpm db:migrate && pnpm db:seed
pnpm dev                        # both apps via turbo (Go Lab :3000, Atlas :3001)

pnpm build                      # turbo build (Next standalone)
pnpm typecheck                  # turbo typecheck (tsc --noEmit everywhere)
pnpm lint                       # turbo lint (eslint flat config)
pnpm format / format:check      # prettier
pnpm content:validate           # validate curriculum data — run after editing content/

pnpm db:generate                # drizzle-kit generate (regenerate SQL from schema.ts)
pnpm db:migrate                 # drizzle-kit migrate
pnpm db:seed                    # node --import tsx packages/database/src/seed.ts
```

`.env` is required (`cp .env.example .env`). Keys: `DATABASE_URL`, `BETTER_AUTH_SECRET` (≥32 chars), `BETTER_AUTH_URL`, `NEXT_PUBLIC_GO_APP_URL`, `NEXT_PUBLIC_BACKEND_APP_URL`. These are `turbo.json` `globalEnv`.

## Architecture

### Workspace layout

- `apps/*` — the two Next.js App Router apps.
- `packages/*` — shared `@platform/*` libraries and shared tooling configs.
- `content/` — curriculum data (outside the workspace).
- `services/learning-api` — planned Go backend (outside the workspace; see Current state).
- `scripts/validate-content.ts`, `docs/`, `docker/`.

### Server vs Client boundary (enforced convention)

Route pages and curriculum loading are **React Server Components**. Only **8 files** carry `"use client"` — interactive workspaces, the go-learning dashboard/review/concepts views, the code editor, diagrams, and the persistence provider:

- `apps/{go,backend}-learning/components/*-workspace.tsx`
- `apps/go-learning/components/go-{dashboard,review,concepts}.tsx`
- `packages/code-editor/src/index.tsx`, `packages/diagrams/src/index.tsx`, `packages/learning-engine/src/react.tsx`

Pattern: each route's `app/**/page.tsx` (server) statically imports lesson data from `content/` and passes it as props into one client view component. Keep new static/explanatory UI in Server Components; add a client boundary only for genuinely interactive surfaces.

### Internal packages are source-only

`@platform/*` packages have **no build output** — their `build` script is `tsc --noEmit` and `exports` point at raw `./src/*.ts`. Apps consume the TypeScript source directly via Next `transpilePackages` (see `apps/go-learning/next.config.ts`). Don't add a bundling/dist step to a package.

### Core domain packages

- **`@platform/learning-engine`** (`packages/learning-engine/src/index.ts`) — pure domain logic: `transitionProgress` (monotonic 9-state mastery ladder), `scheduleReview` (SM-2-style spacing, ease floored at 1.3), `masteryScore` (weighted evidence), `resolveAvailableLessons` (prerequisite filtering). The `./react` export (`react.tsx`) is the client `LearningProvider`/`useLearning` anonymous-persistence layer backed by namespaced `localStorage`.
- **`@platform/content-schema`** (`packages/content-schema/src/index.ts`) — Zod schemas; the authoritative **16-stage `lessonStages`** list, and `validateCurriculum(lessons, modules)` which enforces referential integrity (every prerequisite ID and `module.lessonIds` entry must resolve). This array — not the prose in `docs/CONTENT_AUTHORING.md` — is the source of truth for stages.
- **`@platform/database`** (`packages/database/src/`) — Drizzle ORM over postgres-js. `createDatabase(url?)` in `index.ts`, full schema in `schema.ts` (Better Auth tables + progress/mastery/review/notes/bookmarks/sessions/milestones). Owns `db:*`. **PostgreSQL + Drizzle was chosen over Prisma deliberately** so SQL/migrations stay visible. Migrations must be expand/contract (backward-compatible).
- Others: `@platform/authentication`, `@platform/ui`, `@platform/diagrams`, `@platform/code-editor`, `@platform/analytics`, plus `@platform/eslint-config` / `@platform/typescript-config`.

### Auth

Better Auth, configured centrally in `packages/authentication/src/index.ts` (`createAuth()` → Drizzle adapter, email+password, 12-char min, 7-day sessions, trusted origins from the `NEXT_PUBLIC_*_APP_URL` vars). Each app mounts it identically at `app/api/auth/[...all]/route.ts`.

### Content workflow

Lessons are **structured TypeScript** (not MDX), under `content/{go,backend}/module-*/index.ts`, re-exported by `content/index.ts`. Content is representation-neutral — it never imports app components. The Go course is fully authored (43 lessons, modules 0–8); the backend course still has only `module-0`. Run `pnpm content:validate` after any curriculum edit. Lesson prose is American English; verify experiment answers by running the code (see `docs/GO_LAB_FE_COMPLETION_PLAN.md` for current FE state).

## Current state (important)

The README/docs describe an intended end-state; several pieces are intentional **empty scaffolds — reuse, don't recreate**:

- `packages/curriculum`, `packages/learning-client` — empty stubs. `learning-client` is the planned home for shared client behavior across both apps.
- `services/learning-api` — empty; a planned Go backend meant to eventually replace Better Auth (do not run two auth systems permanently).

**`docs/HANDOFF_IMPLEMENTATION_PLAN.md` is the live working doc** and carries a priority override: stabilize the existing frontend learning features and the Backend Atlas redesign first; do not start the Go API while frontend interactions are incomplete. Read it before large changes — its older verification checklist is stale.

Other design constraints (`docs/ARCHITECTURE.md`, `docs/SECURITY.md`): no remote code runner (browser checks are deterministic validation, never represented as executing Go); anonymous→authenticated migration must be idempotent and take max-valid-evidence per target, never a blind overwrite; do not add Redis/queues/Kubernetes until justified.
