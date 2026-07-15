# Go Runtime Lab — Current State & Handoff

> Scope note: from here on the **Go Runtime Lab** (`apps/go-learning`) and the **Backend Systems Atlas** (`apps/backend-learning`) are treated as **individual projects**. This document covers the Go Runtime Lab only. The Backend Atlas is untouched/deferred except for one type-safety fix noted below.

Last updated: 2026-07-15.

> **2026-07-15 beginner simplification supersedes the old authoring model below.**
> The Go course no longer contains LedgerFlow stages or metadata. The 16-stage
> requirement was removed; lessons now render as four core chapters plus collapsed
> optional depth. Repetitive naive/failure/intuition stages were removed, references
> are optional, unit testing moved into fundamentals, and duplicate race-detector and
> deep escape-analysis topics were removed from the visible curriculum. See
> `docs/CONTENT_AUTHORING.md` for the current contract. Older progress notes remain as
> historical context only.

---

## 0a. PROGRESS UPDATE (2026-07-13, evening) — curriculum complete + FE features landed

Everything below §0 describes the state mid-expansion; as of this update:

- **All 43 lessons authored (modules 0–8).** Module 8 (escape analysis, GC tuning,
  reflection, unsafe/cgo, modules & versioning) is done. A full content audit fixed a
  wrong experiment answer (`basic-types` untyped-constant division), a dead reference
  URL, a bogus env var (`GONOSUMCHECK`), and normalized ~200 British spellings to
  American English.
- **Four FE features landed** (see `docs/GO_LAB_FE_COMPLETION_PLAN.md` for specs):
  per-type interactive exercise cards (commit-before-reveal predictions, CodeMirror
  editor with deterministic reference checks), `/dashboard`, `/review` (SM-2 spaced
  queue persisted in the learning engine), `/concepts` (SVG prerequisite graph +
  text-tree alternative), plus workspace header nav and `/?topic=<id>` deep links.
- **Still open:** `/account` auth screens (blocked on the Go API per the handoff
  gate), manual mobile/interaction QA pass, optional readability glosses for
  frontend-only readers (plan doc §3), repo-wide `pnpm lint` is broken pre-existing
  (eslint lints `.next/`; flat config missing `react-hooks/exhaustive-deps`).

---

## 0. PROGRESS UPDATE (2026-07-13) — curriculum expansion in flight

Two big things landed since the 2026-07-12 notes:

**A. Multi-lesson workspace (was single-lesson).** The workspace now opens **any**
authored lesson, not just Module 0. Key pieces:

- `content/go/index.ts` — the **lesson registry**: `goLessons` (array), `goLessonsById`,
  and `goContentModules` (for referential validation). Each `content/go/module-N/index.ts`
  exports its lessons + a `goModuleN: CurriculumModule`.
- `apps/go-learning/app/page.tsx` passes `lessons={goLessons}` (not a single lesson).
- `apps/go-learning/components/go-workspace.tsx` derives the open `lesson` from the
  selected topic's `lessonId` via the registry (`lesson` may be `undefined` in preview
  mode — every use is guarded). The bespoke Module-0 widgets (compile-pipeline diagram,
  init-order experiment, runtime.Version editor) are scoped to `bespokeWidgetLessonId =
"go-source-to-process"` only; every other lesson renders its `diagram`/`experiment`/
  `implementation` stages from its own content blocks. `widgetStages` is now per-lesson.
- `scripts/validate-content.ts` validates `[...goLessons, backendProcessToService]`
  against `[...goContentModules, backendModule0]` — new lessons are picked up automatically.

**B. Modules 0–7 fully authored — 38 Go lessons live.** Modules 0–7 are complete
(all topics `status: "authored"` with `lessonId` set, all 16 stages each, Module-0 voice,
diagrams + multiple examples + exercises + go.dev references). Verified: `content:validate`
= 38 lessons / 9 modules, `pnpm --filter @platform/go-learning typecheck` clean. Each module
was committed separately.

**Remaining: Module 8 (~4 lessons).** 8: runtime/performance (GC, memory model, escape
analysis deep-dive, build/compile internals — see `packages/curriculum/src/go.ts` for topics).
The repo is clean and fully committed at Module 7.

### How to resume (proven per-module recipe)

For each remaining module (4: errors/design · 5: stdlib+I/O incl database/sql · 6: concurrency ·
7: testing/tooling · 8: runtime/performance), repeat:

1. **Draft in parallel:** spawn one subagent per topic (see `packages/curriculum/src/go.ts`
   for each module's topics, ids, concepts, prerequisites, whyNow, outcome, ledgerFlow).
   Give each subagent: the exact `Lesson` schema (from `packages/content-schema/src/index.ts`),
   the voice calibration, Module 0 + a Module 1 lesson as exemplars, and the **schema
   gotcha** (a block's `title` goes INSIDE its `diagram`/`note`/`example` object, never at
   the block level). Ask for a file at `content/go/module-N/<slug>.ts` exporting one `Lesson`.
2. **Pre-wire while they draft:** create `content/go/module-N/index.ts` (re-export lessons +
   `goModuleN`), add imports/lessons/`goContentModules` entry to `content/go/index.ts`, and
   flip each topic in `packages/curriculum/src/go.ts` from `status: "planned"` to
   `status: "authored"` + `lessonId: "..."`.
3. **Verify:** `pnpm content:validate` + `pnpm --filter @platform/go-learning typecheck`.
   Spot-review correctness-critical claims (e.g. concurrency race semantics, `database/sql`
   pooling). Open each lesson in the running app to confirm zero page errors.
4. **Commit** the module (per-module commit rhythm; no Co-Authored-By line).

Lesson `prerequisites` must reference lesson ids already in `goLessons` (earlier modules or
same-batch siblings) or validation fails.

---

## 1. Product vision (what the user wants)

A **comprehensive, reliable Go learning portal**, fundamental → advanced, that someone can use to become a Go engineer:

- **Coverage of all of Go** — everything on https://go.dev/learn and the https://go.dev/doc/ index (tutorials, Effective Go, spec, modules, diagnostics, memory model, GC guide, database/sql, etc.).
- **Beginner-friendly writing** — plain language, define jargon, analogy + concrete-before-abstract. Calibration confirmed by user: _do not over-simplify_; Module 0's current voice is the target. Length is "ideal" — not too long, not too short.
- **Diagrams woven into explanations** and **multiple code examples** per topic (not just prose).
- **Lots of resources / references**, including popular **GitHub repos** and quality **videos**, attached per module and in a dedicated resources hub. Reformat authoritative content from official go.dev docs.
- **Problem-solving first** — exercises/challenges between sessions and **mini-projects per module**; the UI must be designed specifically around doing, not just reading. "Most of the actual learning is in solving problems."
- **Flexible navigation** — nothing locked; any module/lesson/stage is freely explorable. Planned content is inspectable but not "masterable."
- **Search** — a real command palette over the whole catalog.
- **Layout (confirmed):** left = module's lessons (curriculum), center = lesson content with **Further reading pinned at the very bottom of the page**, right = "On this page" outline (the current lesson's stages), Obsidian-style.
- **NEW (not yet built):** middle content should be **one continuous scrollable page** (all stages stacked) with **scroll-spy** — as you scroll, the outline (and curriculum) highlight the current section automatically. Currently it is page-by-page (click a stage → replace content).

---

## 2. Current state — DONE & verified

- **Typecheck**: 11/11 packages pass (`pnpm typecheck`).
- **Content validation**: passes (`pnpm content:validate`) — 2 lessons / 2 modules.
- **Renders correctly** at 1440/1280/768/390; no horizontal overflow. Screenshots in `output/playwright/`.

Delivered:

1. **Shared learning provider** (`packages/learning-engine/src/react.tsx`) — persists per-lesson **progress, stage, notes, bookmarks, evidence**; `hydrated` flag; **debounced** localStorage writes; `applyEvent` uses the engine's `transitionProgress`; `masteryScoreFor`, `recordEvidence`, `getEvidence`.
2. **Richer content schema** (`packages/content-schema/src/index.ts`):
   - `stageContentSchema` = `body` + optional `keyPoints` + `example` + `scenario` + **`blocks[]`**.
   - `blocks` is a discriminated union: `text | points | example | scenario | diagram | note`.
   - `stageDiagramSchema` (kinds: `flow | stack | sequence | compare`, declarative nodes — no coordinates).
   - `stageNoteSchema` (tones: `tip | analogy | warning | info`).
   - `resourceSchema` (`repo | doc | article | video | book | course | tool | playground`, optional `stars`).
   - `sections` is now `z.record(stage, string | stageContent)`; use `normalizeStage()` when rendering. **Backward compatible** (Backend content is still plain strings and still validates).
3. **Comprehensive Go curriculum** (`packages/curriculum/`, NEW workspace package):
   - `types.ts` — `Curriculum / CurriculumModule / CurriculumTopic` with `status: authored | in_authoring | planned`, prerequisites, whyNow, outcome, ledgerFlowApplication, per-module `resources`, and `project`.
   - `go.ts` — **modules 0–8**, fundamental → advanced: 0 process model, 1 values, 2 memory/data, 3 types/generics, 4 errors, 5 stdlib+I/O (incl. `database/sql`), 6 concurrency, 7 testing/tooling, 8 runtime/performance. Each module carries official go.dev references + popular GitHub repos. Only topic `go-source-to-process` is `authored` (linked to the Module 0 lesson); the rest are `planned`.
   - `graph.ts` — `allTopics`, `validateGraph` (unknown-prereq + cycle detection), `availableTopics`.
   - `resources.ts` — global hub list: Tour, Go by Example, Effective Go, spec, golang/go, awesome-go, learn-go-with-tests, learngo, go-patterns, uber-go/guide, project-layout, Go blog, How to Write Go Code, FAQ, gopls, Managing dependencies, plus **videos** (freeCodeCamp, Rob Pike ×2, justforfunc).
   - Wired into the app: `apps/go-learning/package.json` dep + `next.config.ts` `transpilePackages`.
4. **Shared UI primitives** (`packages/ui/src/index.tsx`): `StageArticle` (renders body + keyPoints + blocks + example + scenario), `StageDiagram` (CSS-laid-out, themable), `StageNote`, `CodeExample`, `Scenario`, `ReferenceList`, `ResourceList`, inline `code`/**bold** formatter. Depends on `@platform/content-schema`.
5. **Module 0 authored** (`content/go/module-0/index.ts`): beginner-friendly rewrite of all 16 stages with woven diagrams (flow/sequence/compare), analogy/warning notes, and multiple examples. Metadata/exercises/references preserved.
6. **Go workspace** (`apps/go-learning/components/go-workspace.tsx`): confirmed layout — left curriculum, center content, **right "On this page" outline**, **Further reading + note pinned at the page bottom**, evidence-gated mastery, stage-restore-on-reload, mobile drawers (curriculum + TOC), inline diagram inspector.
7. **Styles** (`apps/go-learning/app/globals.css`): full system for the above (layout, structured content, diagrams, notes, resource cards, right TOC, mobile drawers). Typography to spec (17px prose, ≥40px tap targets).
8. Small enablers: `code-editor` `onResult` callback; `diagrams` Space-key a11y.

Other:

- `apps/backend-learning/components/backend-workspace.tsx` got a **one-line** type-safety fix only (`normalizeStage(...).body`) — **not redesigned**. Backend is a separate project now.
- Root `CLAUDE.md` created.

---

## 3. Outstanding TODO (prioritized)

> **2026-07-13 UPDATE — this list is stale.** Items 1, 2, 3, 5, 6 below are DONE in code,
> and all 43 lessons (modules 0–8) are authored. The implementation record for the
> completed frontend work (interactive exercises, dashboard, review queue, concepts
> graph, and navigation) is **`docs/GO_LAB_FE_COMPLETION_PLAN.md`**. Remaining work is
> limited to the backend-dependent account flow, manual QA, and optional follow-ups.

1. **Continuous scroll + scroll-spy (NEW, top priority).** Render all 16 stages stacked in the scrollable center column (each with an `id`). Add an IntersectionObserver so the right outline (and the curriculum) highlight the section currently in view, and clicking the outline smooth-scrolls to it. Replace the current page-by-page swap. Keep evidence hooks (mark reviewed as sections pass).
2. **Fix the middle empty-gap fully / polish** the confirmed 3-column layout after the scroll change.
3. **Flexible full curriculum nav.** Left panel should render the real modules 0–8 from `@platform/curriculum` (not the 3 hardcoded PLANNED rows). Every module/topic clickable; authored → open lesson, planned → an inspectable **topic preview** (summary, whyNow, outcome, concepts, resources). Nothing locked.
4. **Problem-solving UI (#9).** Make the exercises stage interactive per type (prediction/code-reading/implementation/debugging/refactoring/design), add between-session **challenge checkpoints**, and surface each module's **mini-project** (the `project` field already exists in the catalog) with milestones. Record completion as evidence.
5. **Search command palette (⌘K).** Client-side index over the catalog (modules, topics, concepts, stage titles, exercises, resources); select → navigate. (Fake search was removed earlier; build the real one.)
6. **Resources hub page/view.** Render `goResources` + per-module resources (repos/docs/videos) as a dedicated destination, plus per-lesson references at the page bottom (already wired for Module 0).
7. **Author lessons for modules 1–8**, reformatted from official go.dev docs, in the confirmed voice, each with diagrams + multiple examples + exercises + references. Flip each topic's `status` to `authored` and set `lessonId` as they land. Keep `content:validate` green.
8. **Verify end-to-end** after each chunk (typecheck, content:validate, screenshots at the 4 viewports, exercise/mastery/persistence flows).

### Styling notes

- **Global font size reduced ~10%** — `apps/go-learning/app/globals.css` sets `html { font-size: 90% }` because the user reads at ~90% browser zoom. The app is fully rem-based, so this one knob scales everything uniformly. If further tuning is needed, adjust this value rather than individual rules. (Applied 2026-07-12; verify it renders after a dev restart due to the Turbopack CSS-cache gotcha in §5.)

---

## 4. Architecture quick map

- Monorepo: pnpm + Turborepo. Apps in `apps/*`, packages in `packages/*`. `content/` and `services/` are **not** workspace members (relative-path imports).
- Go app pages are Server Components; the single interactive client component is `components/go-workspace.tsx` (`"use client"`), fed lesson data from `content/go/module-0` by `app/page.tsx`.
- Internal packages are **source-only** (`build` = `tsc --noEmit`, `exports` point at `./src`); apps consume them via `transpilePackages`.
- Data flow: `@platform/curriculum` (map) + `content/go/*` (authored lessons, validated by `@platform/content-schema`) → `go-workspace` renders via `@platform/ui` components → learner state persists via `@platform/learning-engine/react` (localStorage key `go-runtime-lab`).

---

## 5. Gotchas (important for the next agent)

- **Turbopack dev CSS cache is sticky.** Large edits to `globals.css` often are **not** picked up by HMR — the dev server serves a stale CSS chunk. Fix: kill the dev server, `rm -rf apps/go-learning/.next`, restart. Always verify with:
  `css=$(curl -s localhost:3000 | grep -oE '/_next/[^"]*\.css' | head -1); curl -s "localhost:3000$css" | grep -c <new-class>`
- **Node 22 is installed; project wants ≥24.17.** You'll see an engine WARN on every pnpm command — it's expected and harmless (the app runs fine).
- **Dev script**: `apps/go-learning` `dev` is `next dev` (port 3000 by default). The user runs their own dev server — don't fight over the port; screenshot the running one (read-only) rather than starting a competing server (Next 16 refuses a 2nd dev server).
- **Verify commands**: `pnpm typecheck`, `pnpm content:validate` (run after any content/schema edit), `pnpm --filter @platform/go-learning typecheck` for a fast app-only check.
- When adding a new workspace package, run `pnpm install` to create the symlink and add it to the app's `transpilePackages`.

---

## 6. How to run & verify

```bash
corepack enable
pnpm install
pnpm --filter @platform/go-learning dev   # http://localhost:3000
pnpm content:validate
pnpm typecheck
```

Screenshot script pattern (Playwright chromium is cached); run from repo root so Node resolves `@playwright/test`:

```js
import { chromium } from "@playwright/test";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto("http://localhost:3000", { waitUntil: "networkidle" });
await p.screenshot({ path: "output/playwright/go.png" });
await b.close();
```
