# Engineering Learning Platforms — implementation handoff

This document is the execution plan for continuing the project with a smaller model. Follow it in order. Do not bulk-generate shallow lessons, replace the two visual identities with a generic dashboard, or report placeholder curriculum as complete.

## 1. Product priority

The highest priority is a seamless, visually guided path from fundamentals to advanced Go and backend engineering. The existing frontend learning experience must be completed and made reliable before adding the Go API, authentication, or further infrastructure. Authentication exists to preserve learning state across both applications; it must not consume the product or turn it into a generic LMS.

The learner should always know:

1. What am I learning now?
2. Why does it come now?
3. What prerequisite model does it use?
4. What should I predict, inspect, implement, or debug?
5. What evidence proves understanding?
6. How does this change LedgerFlow?
7. What is the next justified step?

## 2. Current repository state

Root: `/Users/mtkh97/Desktop/projects/learning-backend/gpt5-6`

Already implemented:

- pnpm/Turborepo monorepo.
- Next.js applications:
  - `apps/go-learning`
  - `apps/backend-learning`
- Shared packages for UI, diagrams, CodeMirror, content schemas, learning state, database, authentication configuration, and analytics.
- Go Module 0 vertical-slice lesson in `content/go/module-0/index.ts`.
- Backend Module 0 vertical-slice lesson in `content/backend/module-0/index.ts`.
- PostgreSQL/Drizzle schema and generated migration.
- Local anonymous notes, bookmarks, progress, prediction flow, and focus mode.
- Backend architecture canvas, failure simulator, trade-off lab, and request-timeline experiment.
- Docker, CI, security, deployment, architecture, authoring, and roadmap documentation.
- Desktop/mobile visual screenshots in `output/playwright`.

Verification completed before this handoff:

- `pnpm content:validate`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm format:check`
- `pnpm test`
- `pnpm build`
- `pnpm e2e`
- Manual desktop/mobile browser verification.

The user has since reported that some frontend features are not fully working. Treat the verification list above as historical evidence only; rerun the complete frontend audit before adding backend infrastructure.

Important: empty directories may exist from interrupted work:

- `services/learning-api/...`
- `packages/curriculum/src`
- `packages/learning-client/src`
- account/dashboard route directories under both apps.

Reuse them. Do not create competing structures.

## 3. Latest priority override

The user has explicitly reprioritized the project:

1. Complete and stabilize frontend learning features already present in both applications.
2. Finish the Backend Systems Atlas visual redesign and typography system.
3. Verify all frontend interactions and responsive layouts.
4. Only then introduce the Go backend API, authentication, and cross-device persistence.
5. Expand the curriculum and discovery systems after the learning loop is reliable.

Do not start the Go API while core frontend interactions are still visually present but functionally incomplete.

## 4. Frontend feature-completion audit

Before backend work, verify and complete these existing features in both applications:

### Learning flow

- [ ] Stage navigation changes the displayed lesson stage and active state.
- [ ] Continue advances one stage without skipping evidence requirements.
- [ ] The current stage is restored after reload when local progress exists.
- [ ] Focus mode hides unrelated navigation and restores the exact context on exit.
- [ ] Reduced-motion preferences disable nonessential transitions.
- [ ] Keyboard navigation reaches every stage, action, drawer, diagram node, and form.

### Progress and mastery

- [ ] Opening a lesson never marks it mastered.
- [ ] Progress state transitions are recorded locally for anonymous learners.
- [ ] Exercise attempts, failed checks, and mastery evidence are represented distinctly.
- [ ] Mastery cannot be submitted without the required evidence.
- [ ] Progress indicators reflect the actual current stage and not a hardcoded percentage.
- [ ] Review-due and needs-review states are visibly distinct from complete/locked/planned.

### Notes and bookmarks

- [ ] Notes persist through reload and are scoped to the current lesson/concept.
- [ ] Bookmark toggles persist through reload and have visible selected state.
- [ ] Empty notes/bookmarks states are understandable and keyboard accessible.
- [ ] Notes and bookmarks do not write on high-frequency render paths.

### Interactive learning surfaces

- [ ] Go diagrams update the inspector when a node is selected.
- [ ] Backend lifecycle nodes update the operational lens.
- [ ] Prediction exercises require a committed choice before reveal.
- [ ] Correct/incorrect reveal states explain the causal model.
- [ ] Go editor reset, diff, deterministic validation, and result messaging work.
- [ ] Backend architecture stage transitions update requirement, component, and failure mode.
- [ ] Failure simulator advances, resets, and exposes propagation steps.
- [ ] Trade-off lab records the selected decision and its consequence.

### Responsive and theme behavior

- [ ] Verify 1440×1000, 1280×800, 768×1024, and 390×844.
- [ ] No horizontal page overflow on mobile; internal stage/diagram scrolling is intentional and labeled.
- [ ] Mobile uses accessible tabs/drawers for curriculum and inspector panels.
- [ ] All primary body text is readable at 100% browser zoom.
- [ ] Base text should be approximately 15–16px on desktop and never below 14px on mobile for instructional UI.
- [ ] Lesson prose should be approximately 17–19px with 1.65–1.8 line height.
- [ ] Navigation and metadata should generally be at least 12px.
- [ ] Tap targets should be at least 40×40px where practical.

### Backend Systems Atlas visual direction

- [ ] Dark theme is the default with no flash before hydration.
- [ ] Light/dark toggle persists in local storage.
- [ ] The Backend Atlas may use the Go Runtime Lab’s font family (Manrope + IBM Plex Mono), but must not copy its palette or visual identity.
- [ ] Backend Atlas uses its own semantic palette: graphite/green foundations, warm gold system markers, coral failure paths, and distinct architectural surfaces.
- [ ] Backend Atlas uses a wider curriculum rail and operational inspector than the current layout.
- [ ] Theme tokens replace direct hardcoded colors.
- [ ] Both themes preserve contrast, focus states, selected states, and semantic status meaning.

### Frontend acceptance gate

Do not proceed to backend/authentication work until:

- [ ] Every checked feature above has been manually verified.
- [ ] Existing broken or decorative-only controls are either completed or removed.
- [ ] Both applications pass a full keyboard walkthrough.
- [ ] Both applications pass desktop, tablet, and mobile visual review.
- [ ] Screenshots are refreshed in `output/playwright`.

## 5. Non-negotiable implementation rules

- Preserve Go Runtime Lab as a dark, technical, three-panel workbench.
- Preserve Backend Systems Atlas as a dark-first architecture control room with an optional light theme.
- Do not use a grid of generic dashboard cards.
- Keep one dominant action and one clear next step per screen.
- A lesson page opening never grants mastery.
- A module listed in the roadmap is not “implemented” until its lessons contain real explanations, diagrams, exercises, failure cases, LedgerFlow work, and mastery evidence.
- Keep static explanations in React Server Components where possible.
- Use Client Components only for interaction and local/session state.
- The new application backend must be Go, not Next.js route handlers.
- Do not execute learner Go code in the Next.js or learning API process.
- Keep all deferred security/testing/deployment work visible in TODO documentation even if not implemented now.

## 6. Recommended execution order

### Phase 0 — frontend completion and Backend Systems Atlas redesign

This is now the immediate next task. Complete the frontend feature audit and visual redesign before dashboards, authentication, Go API work, or curriculum expansion.

#### Design direction

Visual thesis: a dark-first systems operations workspace with architectural depth, generous instructional typography, restrained coral signals, and layered surfaces that feel like an engineering instrument rather than a documentation page.

Content hierarchy:

1. Persistent application/mode navigation.
2. Current module, lesson, and next learning action.
3. Primary architecture/lesson/failure workspace.
4. Contextual operational inspector.
5. Curriculum and LedgerFlow progression.

Interaction thesis:

- Smooth shared transitions when switching Learn, Architecture, Failure Lab, and Trade-offs.
- Selected architecture/failure nodes visibly move forward in depth and update the inspector.
- Theme changes cross-fade surfaces without animating layout or causing flash on load.

#### Required changes

- Dark theme is the default.
- Add a persistent light/dark theme toggle in the top navigation.
- Save preference locally for anonymous users and later in the authenticated user profile.
- Apply the theme before hydration to prevent a light-theme flash.
- Respect `prefers-color-scheme` only when no explicit preference exists.
- Increase the base application font from the current small scale to approximately 15–16px.
- Instructional lesson body should be approximately 17–19px with 1.65–1.8 line height.
- Navigation and metadata should generally remain at or above 12px.
- Increase tap/click targets to at least 40×40px where practical.
- Widen the curriculum rail and operational inspector at desktop widths.
- Increase spacing between conceptual stages so the interface remains dense but not compressed.
- Keep a readable lesson measure around 65–75 characters.
- Strengthen active-state contrast and distinguish selected, completed, review-due, locked, and planned states without relying only on color.

#### Advanced layout system

Desktop composition:

```text
┌─────────────────────────────────────────────────────────────────────┐
│ brand │ Learn  Architecture  Failure  Trade-offs │ search/theme/user│
├──────────────┬─────────────────────────────────────┬────────────────┤
│ curriculum   │ current context + primary workspace │ operational    │
│ and project  │                                     │ inspector      │
│ progression  │ architecture / lesson / simulation  │ mental model   │
└──────────────┴─────────────────────────────────────┴────────────────┘
```

Recommended desktop rail sizes:

- Curriculum: 260–290px.
- Inspector: 300–340px.
- Primary workspace: remaining width with a minimum useful width around 680px.
- Top bar: 68–72px.

Use CSS grid with named areas and container queries where they materially simplify panel behavior. Avoid hardcoding one layout for every viewport.

Responsive behavior:

- Large desktop: three persistent regions.
- Medium desktop/tablet: curriculum remains visible; inspector becomes a contextual drawer.
- Small tablet: curriculum and inspector become accessible tabs/drawers.
- Mobile: one conceptual stage at a time, with sticky lesson-stage navigation and persistent access to the current mental model.
- Focus mode hides navigation chrome but preserves the diagram and mental-model context.

#### Theme tokens

Use semantic tokens instead of direct color values throughout the backend CSS:

```css
--atlas-bg
--atlas-surface-1
--atlas-surface-2
--atlas-surface-raised
--atlas-sidebar
--atlas-inspector
--atlas-text
--atlas-text-muted
--atlas-border
--atlas-accent
--atlas-accent-soft
--atlas-success
--atlas-warning
--atlas-danger
--atlas-focus
```

Suggested dark direction:

- Near-black blue/green background, not pure black.
- Slightly warmer/lighter work surfaces.
- Off-white primary text.
- Muted sage-gray secondary text.
- Coral/red-orange for active causal paths and primary progression.
- Green only for verified healthy/success states.
- Amber only for review/warning states.

Suggested light direction:

- Preserve a warm neutral paper influence, but increase contrast and reduce beige dominance.
- Use the same semantic meanings as dark mode.

Do not introduce decorative gradients behind routine workspace content or multiple competing accent colors.

#### Typography

- Keep at most two visible type families.
- Use the serif face only for major lesson/architecture titles.
- Use the sans face for instruction, navigation, controls, and explanatory content.
- Use mono sparingly for identifiers, state labels, timings, and traces.
- Remove 8–10px instructional text; that scale is acceptable only for nonessential diagram annotations with an accessible alternative.

#### Files to modify

- `apps/backend-learning/components/backend-workspace.tsx`
- `apps/backend-learning/app/globals.css`
- `apps/backend-learning/app/layout.tsx` if a pre-hydration theme script is required
- Add a small theme provider only if CSS plus a root attribute is insufficient
- Update screenshots in `output/playwright`

#### Redesign acceptance criteria

- Dark theme is the initial experience with no theme flash.
- Toggle persists through reload.
- All body and navigation text is comfortably readable at 100% zoom.
- Learn, Architecture, Failure Lab, and Trade-offs retain full functionality in both themes.
- Desktop uses the advanced three-region layout.
- Mobile presents one clear conceptual stage without horizontal page overflow.
- Contrast and focus states remain visible in both themes.
- Reduced-motion preference is respected.
- The interface still looks like Backend Systems Atlas, not a recolored Go Runtime Lab or generic admin dashboard.
- Verify at 1440×1000, 1280×800, 768×1024, and 390×844 before continuing.

### Phase A — introduce the Go API only after the frontend gate

Use the Go 1.26.4 API architecture described later in this document for registration, login, verification, recovery, sessions, progress persistence, and anonymous migration. Do not start this phase while the frontend acceptance gate is incomplete.

### Phase B — complete curriculum catalogs

Goal: both dashboards expose every fundamental-to-advanced module and topic, dependencies, outcomes, project milestones, and readiness status without pretending all lesson content is authored.

Create `packages/curriculum`:

```text
packages/curriculum/
├── package.json
├── tsconfig.json
└── src/
    ├── types.ts
    ├── go.ts
    ├── backend.ts
    ├── graph.ts
    └── index.ts
```

Core types:

```ts
type CurriculumStatus = "authored" | "in_authoring" | "planned";

type CurriculumTopic = {
  id: string;
  title: string;
  concepts: string[];
  prerequisites: string[];
  whyNow: string;
  learnerOutcome: string;
  ledgerFlowApplication: string;
  status: CurriculumStatus;
};

type CurriculumModule = {
  id: string;
  order: number;
  title: string;
  description: string;
  prerequisiteModuleIds: string[];
  topics: CurriculumTopic[];
  project: {
    title: string;
    outcome: string;
    milestones: string[];
  };
};
```

Go catalog must include every requested module:

0. How Go Works
1. Values and Program Execution
2. Memory and Data Structures
3. Type System and Abstraction
4. Errors and Program Design
5. Standard Library and I/O
6. Concurrency
7. Testing and Tooling

Do not omit:

- Compilation, linking, package initialization, runtime, GC overview, build cache, cross-compilation, static binaries.
- Untyped constants, zero values, copy semantics, shadowing, defer.
- Slice headers/backing arrays/reallocation/aliasing, maps, stack/heap, escape analysis, strings/bytes/runes/Unicode.
- Method sets, nil interfaces, typed nil, assertions/switches, generics/constraints.
- Error wrapping/inspection, sentinel/typed errors, panic/recovery, dependency direction, consumer-defined interfaces.
- Reader/Writer, files, JSON, time, logging, CLI, HTTP, middleware, context.
- Scheduler model, blocking, channels/select, mutexes/atomics, races, cancellation, leaks, structured concurrency, when sequential is better.
- Unit/integration/table tests, benchmarks, fuzzing, coverage, mocks/fakes, profiling, race detector, vet/static analysis.

Go projects:

1. Execution and value inspector
2. Data transformation CLI
3. File-based expense manager
4. Modular transaction engine
5. HTTP financial data service
6. Concurrent transaction processor
7. LedgerFlow Core

Backend catalog must include all requested modules:

0. From Process to Network Service
1. Networking and HTTP
2. API Design
3. Relational Databases
4. Authentication and Security
5. Application Architecture
6. Performance and Caching
7. Asynchronous Processing
8. Testing Strategy
9. Containers and Delivery
10. Cloud Infrastructure
11. Observability and Reliability
12. System Design

Use the complete topic lists from the original project objective. Explicitly cover concurrency control, transaction isolation, migrations/backups/recovery, threat modeling, cache invalidation, delivery guarantees/idempotent consumers, container networking, CI/CD/rollback, infrastructure costs, SLIs/SLOs, CAP, replication, partitioning, consistency, availability, durability, failure domains, and scaling.

Backend project milestones must map to LedgerFlow Stages 1–12.

Acceptance:

- Every topic has prerequisites, `whyNow`, learner outcome, and LedgerFlow use.
- `graph.ts` detects cycles and unknown prerequisites.
- Only the existing Module 0 slices have `status: "authored"` initially.
- Dashboard never displays planned content as completed or available for mastery.

### Phase C — guided dashboards and curriculum maps

Create shared behavior in `packages/learning-client` while keeping visual rendering app-specific.

Recommended shared exports:

```text
packages/learning-client/src/
├── api.ts
├── auth-provider.tsx
├── progress-provider.tsx
├── recommendations.ts
├── search.ts
├── review.ts
└── index.ts
```

Add routes:

- `apps/go-learning/app/dashboard/page.tsx`
- `apps/backend-learning/app/dashboard/page.tsx`

Go dashboard composition:

- Left: complete module dependency rail.
- Center: current learning path and next conceptual stage.
- Right: current mental model, review queue, and LedgerFlow milestone.
- Use compiler/runtime/memory visual language.
- Make “Continue current lesson” the primary action.

Backend dashboard composition:

- Left: system evolution timeline.
- Center: current architecture stage and justified next component.
- Right: failure/review queue and current LedgerFlow operational responsibility.
- Use request paths, system nodes, and state transitions.

Dashboard information:

- Current module and lesson.
- Exact next lesson and why it is recommended.
- Prerequisites already mastered and still weak.
- Due review concepts.
- Exercise and project evidence.
- Mastery distribution.
- LedgerFlow stage and next milestone.
- Recent notes/bookmarks.
- Full curriculum path with authored/planned distinction.

Avoid stat-card mosaics. Use one strong progress path, tables/lists, dividers, and a single current-state canvas.

Add links to dashboard from both current workspace headers and brands.

Acceptance:

- User understands the next step in under five seconds.
- Keyboard can reach every module/topic/action.
- Planned modules remain inspectable but cannot be marked complete.
- Mobile uses tabs/drawers without losing the current mental-model card.

### Phase D — global search

Search should initially be client-side over validated curriculum content. Do not add Elasticsearch.

Index fields:

- lesson titles/descriptions
- concepts
- mental models
- failure cases
- exercise prompts
- project milestones
- LedgerFlow applications
- references

Implement:

- `packages/learning-client/src/search.ts`
- searchable command palette in both app headers
- `/search?q=` route only if deep-linking materially improves use

Result groups:

- Lessons
- Concepts
- Exercises
- Failure cases
- Projects
- LedgerFlow applications

Each result shows course, module, prerequisite status, authored/planned status, and the correct action: open, review prerequisite, or inspect roadmap.

Acceptance:

- Search works with keyboard only.
- Empty and no-result states explain what is indexed.
- Planned topics are clearly labeled.
- No large lesson content is duplicated into React components.

### Phase E — interactive knowledge graph

Do not begin with React Flow unless native SVG becomes inadequate. A controlled SVG graph is faster and easier to make accessible.

Graph behavior:

- Nodes: concepts and module-level clusters.
- Edges: prerequisite, related, and LedgerFlow application.
- Filters: course, module, mastered, review due, authored/planned.
- Selecting a node opens prerequisites, dependents, lessons, exercises, project uses, and LedgerFlow applications.
- Provide a text/tree alternative for screen readers and mobile.
- Graph influences recommendations; it is not decoration.

Recommended routes:

- `/concepts`
- `/concepts/[conceptId]`

Acceptance:

- Unknown/cyclic dependencies fail content validation.
- Keyboard navigation follows graph order.
- Recommendations explain their graph reason.

### Phase F — review queue

Use the existing `scheduleReview` implementation in `packages/learning-engine` as the starting point.

Review item reasons:

- incorrect answer
- learner marked unclear
- mastery verification failed
- foundational concept is stale
- prerequisite for an upcoming lesson

Review session flow:

1. Show the original context and learner’s prior evidence.
2. Require a prediction/explanation before reveal.
3. Record confidence and correctness separately.
4. Recompute interval.
5. Return to the recommended curriculum step.

Do not create a flashcard UI. Reviews should reopen compact experiments, diagrams, debugging traces, or design decisions.

Routes:

- `/review`
- `/review/[reviewItemId]`

### Phase G — Go authentication and progress API

The current shared Better Auth package should be retired after the Go service is working. Do not run two authentication systems permanently.

Use Go 1.26.4, which was the current installed and official stable version at handoff.

Structure:

```text
services/learning-api/
├── go.mod
├── cmd/api/main.go
├── internal/
│   ├── auth/
│   ├── config/
│   ├── httpapi/
│   ├── progress/
│   ├── review/
│   └── store/
└── migrations/
```

Recommended dependencies:

- `github.com/jackc/pgx/v5` for PostgreSQL.
- `golang.org/x/crypto/bcrypt` or Argon2id with a carefully reviewed parameter wrapper.
- Standard `net/http` first; add a router only if route variables/middleware justify it.

Session model:

- Opaque random 256-bit session token in an HttpOnly cookie.
- Store only SHA-256 token hash in PostgreSQL.
- `Secure` in production, `SameSite=Lax`, explicit expiration.
- Rotate on login and password reset.
- Revoke all sessions after password reset.
- Do not store learning progress in JWT claims.

Database additions:

```sql
auth_credentials(user_id, password_hash, created_at, updated_at)
auth_sessions(id, user_id, token_hash, expires_at, created_at, last_seen_at, user_agent, ip_address)
email_tokens(id, user_id, purpose, token_hash, expires_at, consumed_at, created_at)
anonymous_migrations(id, user_id, anonymous_id, idempotency_key, migrated_at)
```

API contract:

```text
POST /v1/auth/register
POST /v1/auth/login
POST /v1/auth/logout
GET  /v1/auth/session
POST /v1/auth/verify-email
POST /v1/auth/resend-verification
POST /v1/auth/request-password-reset
POST /v1/auth/reset-password

GET  /v1/me/dashboard
GET  /v1/me/progress
POST /v1/me/progress/events
POST /v1/me/anonymous-migration
GET  /v1/me/reviews
POST /v1/me/reviews/{id}/attempts
GET  /v1/me/notes
POST /v1/me/notes
DELETE /v1/me/notes/{id}
GET  /v1/me/bookmarks
POST /v1/me/bookmarks
DELETE /v1/me/bookmarks/{targetType}/{targetId}
```

Use progress events rather than a client-controlled final state:

```json
{
  "eventId": "uuid",
  "course": "go",
  "lessonId": "go-source-to-process",
  "type": "EXERCISE_COMPLETED",
  "occurredAt": "...",
  "evidence": { "exerciseId": "...", "attemptId": "..." }
}
```

The server validates transitions. The client cannot submit `mastered: true` directly.

Development email behavior:

- Introduce an `EmailSender` interface.
- Local implementation logs verification/reset URLs to the terminal.
- Production implementation remains TODO until email service selection.
- Never expose reset tokens from a production API response.

Rate limiting:

- Implement a bounded in-memory limiter for initial local/single-instance use.
- Keys: IP + normalized email for register/login/recovery.
- Return `429` plus `Retry-After`.
- Document that distributed rate limiting is required before horizontal scaling.

### Phase H — account UI

Routes in both apps can share forms through `packages/learning-client`, but visual shells must remain course-specific:

- `/account/login`
- `/account/register`
- `/account/verify-email`
- `/account/forgot-password`
- `/account/reset-password`

Account screens should be focused and restrained:

- Explain the benefit: cross-device progress, notes, review history, and LedgerFlow milestones.
- Do not use marketing hero copy.
- Preserve a visible link back to anonymous learning.
- Show field-level validation and live-region server errors.
- Disable duplicate submission.
- On successful registration, migrate anonymous state only after authenticated session confirmation.

### Phase I — anonymous-to-account migration

Current local shape is in `packages/learning-engine/src/react.tsx`.

Add a versioned envelope:

```ts
type AnonymousLearningSnapshot = {
  schemaVersion: 1;
  anonymousId: string;
  createdAt: string;
  progress: Record<string, ProgressState>;
  bookmarks: string[];
  notes: Record<string, string>;
  attempts: LocalAttempt[];
  masteryEvidence: LocalEvidence[];
};
```

Migration algorithm:

1. Authenticate user.
2. Read and validate local snapshot with Zod.
3. Generate stable idempotency key from anonymous ID + snapshot version/hash.
4. POST to `/v1/me/anonymous-migration`.
5. In one transaction:
   - lock/check migration key
   - insert attempts/evidence/history
   - merge progress by valid evidence, not enum rank alone
   - union bookmarks
   - preserve conflicting notes as separate revisions or append with source marker
   - create review items for failed attempts
   - record migration
6. Return canonical server snapshot.
7. Replace local cache with canonical snapshot.
8. Delete anonymous payload only after successful acknowledgement.

Never allow a client to choose another `userId` in migration payloads.

### Phase J — curriculum lesson expansion

Do not generate every lesson in one pass.

Author in this order because each unlocks LedgerFlow work:

Go:

1. Values, copy semantics, functions, errors.
2. Arrays/slices/backing arrays/maps/structs/pointers.
3. Methods/interfaces/nil/generics.
4. Packages/dependency direction/configuration.
5. Reader/Writer/JSON/files/HTTP/context.
6. Goroutines/channels/mutexes/cancellation/leaks/races.
7. Testing/profiling/tooling.

Backend:

1. Complete request lifecycle: DNS → TCP → TLS → HTTP → proxy → Go API → response.
2. API contracts, idempotency, pagination, compatibility.
3. PostgreSQL schema, indexes, plans, transactions, isolation, locks, pools, migrations, backups.
4. Authentication, authorization, sessions, cookies, OWASP threat model.
5. Modular monolith and dependency boundaries.
6. Measurement, caching, invalidation, capacity.
7. Queues, retries, idempotent workers, eventual consistency.
8. Testing strategy.
9. Docker, CI/CD, configuration, rollback.
10. Cloud primitives, managed services, costs, DR.
11. Logs, metrics, traces, health, SLOs, incidents.
12. Replication, partitioning, CAP, failure domains, production scaling plan.

Each lesson must follow the 16-section schema already enforced by `lessonSchema`.

## 5. Deferred TODOs that must remain visible

Create `docs/TODO_FUTURE.md` and keep these grouped as deferred—not silently forgotten.

Testing deferred by user for now:

- Component tests for account, dashboards, search, graph, and review UI.
- Go API unit/integration tests.
- PostgreSQL migration tests.
- Cross-browser and visual regression tests.
- Load/failure tests.

Cloud/deployment deferred by user:

- Production hosting selection.
- Managed PostgreSQL provisioning.
- Email provider.
- Backup/restore drill.
- Monitoring/alerting deployment.
- CI/CD production credentials.

Security hardening deferred by user but required before public release:

- Formal threat model and authorization audit.
- CSRF/origin tests.
- CSP, HSTS, Permissions-Policy, and other headers.
- Distributed rate limiting.
- Credential stuffing/breached-password defense.
- Session management UI and device revocation.
- Audit logs.
- Secret rotation.
- Dependency/SBOM scanning.
- Account deletion/export workflow.
- Secure Go code runner isolation review.

## 6. Documentation changes

When the Go API is introduced:

- Update root `README.md` architecture diagram and local setup.
- Update `.env.example` with:
  - `LEARNING_API_URL`
  - `NEXT_PUBLIC_LEARNING_API_URL`
  - `SESSION_COOKIE_DOMAIN`
  - email sender variables when selected
- Update `docker-compose.yml` with the Go API service.
- Update Dockerfiles to build Go 1.26.4 service.
- Deprecate and then remove `packages/authentication` Better Auth code.
- Document cookie behavior for localhost and production sibling origins.

## 7. Verification commands after every phase

Use Node 24.18+ for final JavaScript verification. The previous local machine had Node 22 and emitted an expected engine warning.

```bash
corepack enable
pnpm install
pnpm content:validate
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
```

Go service:

```bash
cd services/learning-api
go fmt ./...
go vet ./...
go test ./...
go build ./cmd/api
```

Manual product verification:

1. Open both dashboards at 1440×1000 and 390×844.
2. Confirm next lesson and reason are immediately visible.
3. Navigate curriculum using keyboard only.
4. Search for a concept shared across courses, such as context or transactions.
5. Select a graph node and open prerequisites/dependents.
6. Complete an anonymous prediction and write a note.
7. Register, verify, and confirm migration.
8. Open the other application and confirm canonical progress appears.
9. Fail a knowledge check and confirm review scheduling.
10. Confirm planned lessons cannot be marked mastered.

## 8. Definition of done for the requested continuation

The continuation is complete only when:

- Both full curriculum maps include every requested fundamental and advanced topic.
- The UI guides the learner through prerequisites and explains every recommendation.
- Both apps share authenticated progress through the Go API.
- Registration, login, verification, recovery, logout, and local migration work end-to-end.
- Dashboard, search, graph, and review queue are functional, not static mockups.
- Existing authored lessons retain their distinct, high-quality interactive workspaces.
- Planned lessons are clearly labeled and cannot falsely grant mastery.
- Deferred testing, deployment, and security work is recorded in `TODO_FUTURE.md`.
- README and architecture docs describe the actual implementation, not the old Better Auth design.

## 9. Suggested commits

Keep changes reviewable:

1. `feat: expose complete guided curriculum paths`
2. `feat: add course dashboards and concept discovery`
3. `feat: persist learning identity through go api`
4. `feat: migrate anonymous learning evidence on signup`
5. `feat: surface graph-driven review recommendations`
6. `docs: preserve deferred production hardening work`

Do not combine curriculum generation, authentication replacement, and all UI changes into one commit.
