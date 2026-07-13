# Go Runtime Lab — FE completion plan (no backend/DB)

> Completion record for the frontend features that need **no backend or database**.
> Written 2026-07-13 after a full content audit + code survey. Supersedes the stale TODO
> list in `GO_RUNTIME_LAB_STATE.md` §3 (items 1, 2, 3, 5, 6 there are already DONE in code).

## 0. Current state (verified in code, 2026-07-13)

**Done and working** (all in `apps/go-learning/components/go-workspace.tsx`, ~1,390 lines):

- 43/43 lessons authored (modules 0–8); `pnpm content:validate` green (43 lessons / 10 modules).
- Continuous scroll + scroll-spy (IntersectionObserver ~line 641, sectionRefs, smooth scroll).
- Real curriculum nav from `@platform/curriculum` (renders `goCurriculum.modules`, ~line 1165).
- ⌘K CommandPalette (topics + current lesson stages + resources, ~line 259).
- ResourcesHub view (~line 415), focus mode, mobile drawers (`panel: "nav" | "toc"`).
- Notes/bookmarks/progress persistence, evidence-gated mastery, per-module ProjectPanel
  with milestone checklist (~line 215), generic ExerciseCard (~line 150).

**Recently landed foundation work:**

1. Module 8's five lessons, registry wiring, and curriculum status updates landed in
   `60f2500` (`feat(content): author Module 8 — Runtime & Performance`).
2. The content audit fixes landed in `aacefda`: British→American spelling normalization
   (~200 words across 14 files), corrected `basic-types.ts` untyped-constant-division
   experiment (answer is 2, not 2.5 — verified by running Go), fixed
   `GONOSUMCHECK`→`GONOPROXY`/`GONOSUMDB` in `modules-advanced.ts`, and replaced the
   dead Cheney URL in `escape-analysis-deep.ts`.

**Explicitly OUT of scope (needs backend/DB):** `/account/*` auth screens, cross-device
persistence, anonymous→server migration. `app/account/` remains an empty directory from
interrupted work — reuse it rather than creating a parallel structure.

## 1. Feature completion record

| #   | Feature                        | Route/File                                                                  | Status              |
| --- | ------------------------------ | --------------------------------------------------------------------------- | ------------------- |
| A   | Per-type interactive exercises | `go-workspace.tsx` ExerciseCard                                             | **DONE 2026-07-13** |
| B   | Dashboard                      | `app/dashboard/page.tsx` + `components/go-dashboard.tsx`                    | **DONE 2026-07-13** |
| C   | Review queue                   | `app/review/page.tsx` + `components/go-review.tsx` + engine `reviews` state | **DONE 2026-07-13** |
| D   | Concepts knowledge graph       | `app/concepts/page.tsx` + `components/go-concepts.tsx`                      | **DONE 2026-07-13** |
| E   | Nav wiring + verification      | header `.top-links`, `?topic=` deep links via server `searchParams`         | **DONE 2026-07-13** |

All five landed 2026-07-13 in commits `19aee50` through `8c46e30`, with their shared
styles in `14263a8`. Verified: full `pnpm typecheck` green, `content:validate` green,
all four routes SSR 200 on the running dev server, deep links open the right lesson,
and per-type exercise markup renders (commit-gated reveal, GoEditor, sketch textareas).
Known pre-existing issue (NOT from this work): `pnpm lint` fails repo-wide — eslint
lints `.next/` output (missing ignore) and the flat config lacks the
`react-hooks/exhaustive-deps` rule that three older workspace disables reference.
Remaining manual QA: click-through of the new interactions + 390×844 pass.

### A. Per-type interactive exercises

Replace the single generic ExerciseCard flow with per-type interaction. Current card:
progressive hints → optional "Reveal answer" → "Mark worked through" (self-attest).
Exercise types (see `exerciseTypeLabel`, workspace ~line 139): `prediction`,
`code-reading`, `implementation`, `debugging`, `refactoring`, `design`, `advanced`.

- **prediction / code-reading**: require a _committed_ answer before reveal. Textarea
  ("Your prediction…"); "Reveal answer" stays disabled until non-empty. After reveal,
  self-assess buttons "I was right" / "I was wrong" →
  `applyEvent(lessonId, { type: "ATTEMPT_EXERCISE", correct })` +
  `recordEvidence(lessonId, { predictionCorrect: correct })` (only set true; a wrong
  answer routes progress to `needs_review` via the engine ladder) +
  `markExerciseComplete`.
- **implementation / debugging / refactoring** (when `starterCode` exists): render
  `GoEditor` from `@platform/code-editor` (already imported in workspace; has reset/diff
  and an `onResult` callback — check its props in `packages/code-editor/src/index.tsx`)
  instead of the static `<pre>`. Deterministic validation ONLY (normalized string /
  token-based comparison against `expectedAnswer` if present, else self-attest).
  **SECURITY.md rule: never represent checks as executing Go — label them
  "deterministic check", no fake "run" button.**
- **design / advanced**: small textarea for the learner's reasoning (persist via
  `setNote` under a namespaced key or keep component-local), then self-attest.
- On completion of any exercise: `recordEvidence(lessonId, { exercisePassed: true })`
  only when the outcome was actually correct/attested.
- Keep the card look (`exercise-card` CSS classes in `apps/go-learning/app/globals.css`);
  extend, don't redesign.

### B. Dashboard (`app/dashboard/page.tsx`)

Server page (statically imports `goLessons` from `content/go` + passes to client view,
same pattern as `app/page.tsx` → `GoWorkspace`). New client file
`apps/go-learning/components/go-dashboard.tsx` wrapped in
`<LearningProvider storageKey="go-runtime-lab">` (MUST reuse this exact storageKey or
the dashboard sees empty state).

Layout per HANDOFF doc Phase C (NO stat-card mosaics; one strong progress path):

- Left: full module rail (modules 0–8 from `goCurriculum`) with per-module progress
  (count topics whose lesson progress is `mastered` / `exercise_completed`…).
- Center: "Continue current lesson" as the PRIMARY action — from `lastVisited` +
  `stages[lessonId]` (deep-link back to workspace; see nav note in E), the exact next
  recommended lesson + one-sentence reason (first authored topic in curriculum order
  whose prerequisites are all mastered but which isn't itself mastered — reuse
  `resolveAvailableLessons` from `@platform/learning-engine`).
- Right: mastery distribution (counts per `ProgressState`), review-due list (after C:
  from review state; before C: lessons in `needs_review`), current module project +
  milestone progress (`getMilestones`), recent notes/bookmarks.
- Learner should know "what's next and why" in <5s; keyboard reachable.

### C. Review queue (`app/review/page.tsx`)

Needs a small **engine extension** first (packages are source-only; edit directly):
`packages/learning-engine/src/react.tsx`:

- Add to `LocalState`: `reviews: Record<string, { lastReviewedAt: string; intervalDays: number; ease: number; dueAt: string; reason: string }>`
  (default `{}` in `initial` AND in `hydrate()` fallbacks — old payloads must tolerate).
- Add context methods: `getReview(id)`, `recordReviewOutcome(id, correct: boolean, reason?)`
  → calls `scheduleReview({ lastReviewedAt: new Date(), intervalDays: prev?.intervalDays ?? 1, ease: prev?.ease ?? 2.5, correct })`
  from `./index` and stores result (dates as ISO strings).
- Seed review items automatically: when `applyEvent` lands a lesson in `needs_review`
  (wrong exercise attempt / failed mastery), create/refresh a review entry with
  `dueAt = now`, reason = "incorrect answer" / "mastery verification failed".

Page: server shell + client `go-review.tsx` (same provider/storageKey). List items due
(`dueAt <= now`) with reason + lesson link. Per HANDOFF Phase F: NOT a flashcard UI —
each item reopens compact context: show the lesson's `mental-model` stage body +
require a typed prediction/explanation BEFORE reveal (reuse the commit-then-reveal
pattern from A), record correctness → `recordReviewOutcome`, show next due date,
then link back to the recommended next step. Empty state explains how items get here.

### D. Concepts graph (`app/concepts/page.tsx`)

Per HANDOFF Phase E: controlled **SVG**, not React Flow. Data: `allTopics(goCurriculum)`
(TopicRef has id/title/moduleId/moduleTitle/status/prerequisites…).

- Columns by module (x = module order), nodes stacked vertically; edges =
  `topic.prerequisites` (draw as cubic paths between columns).
- Node visual state from learner progress (mastered / in progress / review due / not
  started) — needs the provider, so client component `go-concepts.tsx`.
- Select a node → side panel: concepts list, prerequisites (clickable), dependents
  (computed reverse edges), "Open lesson" link, whyNow/outcome/ledgerFlowApplication.
- Filters: by module, by progress state.
- **A11y/mobile requirement**: a text-tree alternative (`<details>`/list) rendered
  alongside; keyboard focus order follows graph order.
- `validateGraph` in `packages/curriculum/src/graph.ts` already checks cycles/unknown
  prereqs at validate time — the page can trust the data.

### E. Navigation + verification

- Workspace header: links to Dashboard / Concepts / Review (and brand → `/`).
  Dashboard/review/concepts headers: link back to the workspace. Keep the dark
  three-panel visual identity; one dominant action per screen.
- Deep-linking: workspace currently holds selection in component state only. Add
  support for `/?topic=<topicId>` (read `useSearchParams` in `GoWorkspace` or pass
  from server page via `searchParams`) so dashboard/review/concepts can open a
  specific lesson. Keep it minimal — no router restructure.
- Verify: `pnpm content:validate`, `pnpm typecheck`, boot dev, click through all four
  routes, exercise each new interaction, check browser console clean, spot-check
  1440×1000 and 390×844 (mobile drawers still work). Update screenshots in
  `output/playwright/` if practical.
- Commit per feature (A–E), no Co-Authored-By.

## 2. Infrastructure cheat sheet (verified 2026-07-13)

**`useLearning()` API** (`packages/learning-engine/src/react.tsx`): state
`{ progress, completedLessons, bookmarks, notes, stages, evidence, exerciseCompletions, projectMilestones, lastVisited, hydrated }`

- methods `setProgress, toggleLessonComplete, resetLesson, applyEvent, toggleBookmark,
setNote, setStage, recordEvidence, getEvidence, getExerciseCompletions,
markExerciseComplete, getMilestones, toggleMilestone, masteryScoreFor`.
  localStorage key: **`go-runtime-lab`**; writes are debounced 350ms; wait for
  `hydrated` before restoring UI.

**Engine ladder** (`packages/learning-engine/src/index.ts`): 9 monotonic states;
`ATTEMPT_EXERCISE{correct:false}` → `needs_review`; `VERIFY_MASTERY{passed}` →
`mastered`/`needs_review`. `scheduleReview` = SM-2-ish, ease floor 1.3, wrong resets
interval to 1 day. `resolveAvailableLessons(lessons, masteredSet)` filters by prereqs.

**Curriculum** (`@platform/curriculum`): `goCurriculum.modules[]` (each: id, order,
title, topics[], project, resources), `allTopics(goCurriculum)` → TopicRef flat list,
`goResources` global hub list. All 43 topics `status: "authored"` with `lessonId`.

**Content registry**: `content/go/index.ts` exports `goLessons`, `goLessonsById`,
`goContentModules`. Server pages import statically and pass as props.

**Patterns/constraints:**

- Only add `"use client"` for genuinely interactive surfaces; server shells for routes.
- Internal packages are source-only (`exports` → `./src/*.ts`, consumed via
  `transpilePackages` in `apps/go-learning/next.config.ts`).
- All styling lives in `apps/go-learning/app/globals.css`; rem-based with
  `html { font-size: 90% }`; prose ~17px, tap targets ≥40px; reuse existing class
  vocabulary (`lesson-head`, `exercise-card`, `ghost-btn`, `solid-btn`,
  `module-project`, `palette-*`, `hub-*`).
- No code execution anywhere — deterministic validation only, honestly labeled.
- Opening a page must never grant mastery/progress by itself.

**Gotchas:**

- Turbopack dev serves stale CSS after big `globals.css` edits → kill dev,
  `rm -rf apps/go-learning/.next`, restart.
- Node 22 installed vs ≥24.17 wanted → pnpm engine WARN on every command; harmless.
- Don't start a second dev server if the user has one on :3000 (Next 16 refuses);
  check `lsof -nP -iTCP:3000 -sTCP:LISTEN` first. Sibling repo
  `~/Desktop/projects/learning-backend/gpt5-6` sometimes holds :3000/:3001 — kill its
  stale `turbo dev` tree if ports are taken (this happened 2026-07-13).
- Turbo cache in this repo replays logs from the gpt5-6 copy (identical task hashes);
  cosmetic, ignore.

## 3. Optional follow-ups (user has NOT yet approved — ask first)

1. **Readability glosses for frontend-only devs** (~7 surgical note-style edits):
   SQL-in-60-seconds primer + `dsn` gloss in `module-5/database-sql.ts`; JS
   event-loop→goroutine bridge analogy in `module-6/goroutines-scheduler.ts`; SIGTERM
   gloss in `module-6/context-cancellation.ts`; cgroup/container gloss in
   `module-8/gc-tuning.ts`; libc/ldd/scratch-image glosses in `module-8/unsafe-cgo.ts`;
   CI + container parentheticals at first use in `module-0/index.ts`.
2. Compile-test all ~150 Go example snippets inside lesson `blocks` (the one audit gap).
