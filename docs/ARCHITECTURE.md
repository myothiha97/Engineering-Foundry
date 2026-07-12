# Architecture decisions

## Monorepo and boundaries

pnpm workspaces and Turborepo provide dependency boundaries, task ordering, and caching without introducing a custom build system. Both apps are independently deployable Next.js App Router applications. Generic behavior lives in packages; brand-specific layout and interaction stay in each app.

## Rendering

Route pages and curriculum loading are React Server Components. Client boundaries exist only for local persistence, lesson controls, interactive SVGs, failure/trade-off simulations, and CodeMirror. This keeps curriculum payloads server-renderable while avoiding hydration for static explanations.

## Content

Structured TypeScript is used in the vertical slice because it provides authoring completion and direct Zod validation. The schema is representation-neutral; MDX bodies can be added later without changing lesson metadata or engine contracts. Content never imports app components.

## Learning state

Progress is a state machine. Opening moves a lesson only to `in_progress`. Mastery requires explanation, mental-model, exercise, project, and verification evidence. A lightweight SM-2-inspired review schedule resurfaces failed or stale concepts. Prerequisites filter recommendations rather than hard-locking all exploration.

Anonymous users use namespaced local storage. Authenticated data belongs in PostgreSQL. Migration should be a signed, idempotent server operation that takes the maximum valid evidence per target, preserves attempts/history, and deletes local state only after acknowledgement.

## Database and ORM

PostgreSQL fits relational progress history, constraints, due-date queries, and transaction semantics. Drizzle was selected over Prisma because the SQL schema and migrations remain visible, its runtime is thin, and it reinforces the platform’s database-learning goal. Indexes begin with session lookup and review due queues; production query evidence should drive additions.

## Authentication

Better Auth supplies session, account, verification, secure-cookie, and credential handling primitives through a shared package. Passwords require at least 12 characters. Public release additionally requires verified email, rate limits at the proxy and endpoint, breached-password checks or a strong provider, recovery-email delivery, audit events, and CSRF/origin verification tests.

## Code execution

Phase 1 validates deterministic exercises in the browser and clearly labels that boundary. Arbitrary Go does not run in Next.js. A later runner must be a separate service using ephemeral sandboxes, non-root users, read-only root filesystems, no network, seccomp/AppArmor, PID/CPU/memory/output/time limits, per-user quotas, and an authenticated internal queue.

## Accessibility and performance

The workspaces use semantic landmarks, visible focus, keyboard-operable diagrams, text alternatives, live result regions, responsive navigation, and reduced-motion overrides. No decorative animation runs continuously. Large curriculum sections should remain server-rendered and code editor loading should become dynamic when content expands.
