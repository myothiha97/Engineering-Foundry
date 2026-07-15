# Go Runtime Lab — content truth audit (report only)

## Context

The Go Runtime Lab exists to replace the official Go docs as the primary learning path — because go.dev is dry, fragmented, and hard to read. That premise only holds if the rewrite is **as true as the source it replaces**. A learner coming from frontend cannot detect a wrong claim; they will simply learn it wrong and carry it into production code.

The site is 40 reachable lessons / ~150k words, and today **nothing verifies that any of it is factually correct**:

- `pnpm content:validate` checks Zod schema, prerequisite integrity, stage presence, prose style, and paragraph length. It verifies references only with `new URL(url).hostname === "go.dev"` — **a string check that never fetches**. A 404 on a `go.dev` URL passes.
- `docs/GO_OFFICIAL_CONTENT_AUDIT.md` (2026-07-16) _asserts_ an official source per lesson but verified none of them. **Proof: it cites `https://go.dev/blog/monotonic`, which is a 404 that does not exist.** A hand-written matrix is exactly how that survives.

**Goal:** a precise, evidence-backed findings report — what is wrong, what is missing, what is incomplete, what is flawed, what could improve. **This plan produces a report only.** No content edits, no tooling. The user executes fixes with Codex.

**Out of scope (user's call):** Go code snippet compilation / type-checking / running exercise answers. Prose _about_ code is still audited; the code itself is not compiled.

## Hard constraint: the content is live

Codex is actively editing this repo (session "reformat-go-tour"). **Verified during exploration:** `content/go/module-1/functions-defer.ts` changed at 02:17 mid-session, invalidating a finding I had already recorded. Therefore:

- Pin the audit to `git rev-parse HEAD` + record `git status` at start (`e3d3268`, 62 modified files uncommitted).
- **Re-verify every finding against live content immediately before writing it up.** A stale finding is worse than no finding — it burns Codex cycles and destroys trust in the report.
- Do not edit `content/`, `packages/`, or `docs/CONTENT_AUTHORING.md` — all contested.

## Evidence rules (non-negotiable)

The user's standard: _"i want every info to be correct and precise"_ and _"actually referencing the official sources like https://go.dev/ref/spec"_.

1. **Every claim I challenge must quote the official source verbatim.** Never from memory.
2. **Build a local corpus; grep it.** `curl` → strip tags → grep. Proven during exploration:
   ```
   curl -s -L https://go.dev/ref/spec -o spec.html
   sed -e 's/<[^>]*>//g' spec.html | sed -e 's/&lt;/</g; s/&gt;/>/g; s/&amp;/\&/g' > spec.txt
   grep -n "pseudo-random" spec.txt   # → "chosen via a uniform pseudo-random selection"
   ```
3. **Do not trust `WebFetch` summaries for normative wording.** Verified failure mode: asked for verbatim select-statement rules, it returned plausible text plus _"the section was truncated… these quotes reflect the standard normative language"_ — i.e. reconstructed from memory. Use raw fetch + grep for anything normative.
4. **Report uncertainty as uncertainty.** Mark each finding `CONFIRMED` (verbatim quote) or `NEEDS REVIEW` (judgement). Never inflate.

## Corpus to fetch (offline, greppable)

`go.dev/ref/spec`, `go.dev/ref/mem`, `go.dev/doc/effective_go`, `go.dev/wiki/CodeReviewComments`, `go.dev/doc/faq`, `go.dev/doc/gc-guide`, `go.dev/ref/mod`, `go.dev/doc/diagnostics`, plus `pkg.go.dev` for each package the course teaches (`fmt`, `errors`, `io`, `os`, `encoding/json`, `time`, `net/http`, `database/sql`, `context`, `sync`, `sync/atomic`, `testing`, `reflect`, `unsafe`, `runtime`, `runtime/debug`) and the cited blog posts (`slices-intro`, `maps`, `strings`, `constants`, `go1.13-errors`, `defer-panic-and-recover`, `laws-of-reflection`, `pipelines`, `context`, `json`, `cover`, `pprof`, `routing-enhancements`, `testing-b-loop`).

## Audit scope (measured, not assumed)

| Surface                | Count                                          | Source of truth                                                                        |
| ---------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| Reachable lessons      | **40**                                         | `content:validate` prints "Validated 41 lessons across 10 modules" (40 Go + 1 backend) |
| Authored stages/lesson | 11 (+`trade-offs` collapsed)                   | `go-workspace.tsx` `stageMeta` renders 12 of 16                                        |
| Prose                  | ~150k words                                    | —                                                                                      |
| References             | 140 (120 unique URLs, 35 anchored)             | all inside `references:`                                                               |
| Diagrams               | 80 (27 sequence, 25 compare, 20 flow, 8 stack) | `stageDiagramSchema`                                                                   |
| Exercises              | 285 (135 with `expectedAnswer`)                | 130 visible, 155 collapsed                                                             |
| Mastery criteria       | 167                                            | —                                                                                      |

**Audit the 40 reachable lessons only.** `races-detector.ts` and `escape-analysis-deep.ts` are authored but unreachable and unvalidated — deliberate de-duplication (race detector is covered in `profiling-pprof.ts`, escape analysis in the reachable `stack-heap-escape.ts`). Auditing them is wasted effort; report them as dead files instead.

## Workstreams

### 1. Prose factual accuracy vs official docs — the core

Per module (9 modules, parallelizable via subagents), check every factual claim in all 11 stages against the local corpus. Each subagent gets the corpus path and must return verbatim quotes.

Classify each finding: **Wrong** (contradicts source) · **Imprecise** (narrower/looser than the spec guarantees) · **Overclaimed** (absolute where Go guarantees less — `CONTENT_AUTHORING.md` explicitly bans "always/random/safe") · **Unsupported** (no official basis).

High-risk claim classes to target: memory-model/happens-before wording, scheduler and GC as "implementation detail" vs guarantee, `select`/map/goroutine ordering, `defer` argument-evaluation timing, method sets & addressability, `nil` interface vs `nil` pointer, slice aliasing/capacity growth, `context` semantics, `time` monotonic behavior, `errors.Is/As` unwrap rules.

_Calibration — the content is good; do not manufacture findings._ Spot-checks already passed against verbatim spec text: map order "unspecified" (not "random"), `select` "pseudo-random… not a fairness guarantee", nil-channel-never-ready, machine-sized `int`. Report accuracy honestly, including what is correct.

### 2. Reference integrity (140 refs)

- Liveness + anchor existence — **already run**: 119/120 content URLs live, all 35 anchors valid, all 48 `packages/curriculum` URLs live. **One dead: `https://go.dev/blog/monotonic` (404)** in `content/go/module-5/time-context.ts`; correct source is `pkg.go.dev/time#hdr-Monotonic_Clocks`.
- **Does each reference actually support the claim?** Verify the `section:` field names real sections in the target page, and that `teaches`/`relevance` are accurate.
- Flag non-official sources (4 github.com, `dave.cheney.net`, `staticcheck.dev`, `arp242.net`) — allowed as further reading, but must not be load-bearing for a normative claim.

### 3. Missing / incomplete content (gap analysis)

Diff the 40 lessons against a professional baseline: spec table of contents, Effective Go, Go Code Review Comments, and the stdlib surface a backend Go dev ships with. Report gaps prioritized by "will this bite them in production?" — do **not** author content. Explicitly check topics a FE→Go learner needs and are easy to omit: struct tags beyond JSON, `context` propagation discipline, graceful shutdown, connection-pool tuning, `io.Closer` error handling, logging/`slog`, generics limits, project layout, dependency/version hygiene, race detector reachability.

### 4. Diagrams (80)

Check each for factual correctness (node labels, `detail`, and the ordering a `sequence`/`flow` implies), not aesthetics. A diagram that implies a wrong ordering or a false causal step is a correctness bug. Confirm the 4 `kind`s match the concept being taught.

### 5. Exercises & mastery (285 / 167)

Verify prompts are unambiguous, `expectedAnswer` is _correct as a claim_, and `hints` don't mislead. Check `CONTENT_AUTHORING.md`'s contract holds: ≤3 first-pass exercises, mastery never requires a collapsed/optional exercise. **Defer** compile/run verification of answers (out of scope this pass) — call that out as a known residual risk.

### 6. Structural flaws & improvements

Already confirmed, to be written up with file refs:

- **`reference.section` + `reference.relevance` never render** (`packages/ui/src/index.tsx:204-234` renders only title/url/required/teaches) — 280 authored strings reach no screen, including the exact "which part of the doc" pointers (e.g. `"The zero value; Constants; Iota"`). This directly defeats the goal of visible official sourcing.
- **`lesson.learningObjectives`** — schema-required on every lesson, read by no component.
- **Count drift**: `CLAUDE.md:76` + 3 docs say "43 lessons"; truth is 42 on disk / **40 reachable**.
- **2 dead duplicate files** (above) — unreachable _and_ excluded from `content:validate`.
- `naive`/`failure`/`intuition`/`ledgerflow` are dead schema (0 uses); `type:"text"` block branch unused; `.tone-default` has no CSS (cosmetic).
- The `content:validate` reference check is hostname-only — the reason the 404 survived. (Recommendation only; user builds it via Codex.)

## Deliverable

`docs/GO_CONTENT_AUDIT_FINDINGS.md` — new file (avoids clobbering Codex's untracked `GO_OFFICIAL_CONTENT_AUDIT.md`), pinned to a commit SHA, structured for Codex execution:

- **Verdict** — honest overall state, what's solid vs what's not.
- **Findings table** — `file:line` · claim · official source _verbatim_ · why wrong · suggested fix · `CONFIRMED`/`NEEDS REVIEW` · severity.
- **Missing content** — prioritized, with the official source that defines the gap.
- **Flaws & improvements** — structural/renderer issues.
- **Residual risk** — what this pass did _not_ verify (code correctness), so nobody mistakes it for a full audit the way the last doc was.

Severity: **S1** wrong (teaches a falsehood) · **S2** imprecise/overclaimed · **S3** missing core info · **S4** improvement.

## Verification

1. Re-run `pnpm content:validate` to confirm the 40/41 baseline still holds at report time.
2. For every S1/S2, re-grep the local corpus and paste the verbatim line — no finding ships without its quote.
3. Re-read each cited `file:line` against live content immediately before finalizing (Codex is editing).
4. Re-run the URL/anchor sweep at the end; confirm the `monotonic` 404 still stands and no new dead links appeared.
5. Sanity-check the report against a known-good sample (map order, select, nil channel) — if the method flags those as wrong, the method is broken.
