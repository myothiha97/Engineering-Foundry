# Content authoring

## Beginner-first lesson contract

Create lessons under `content/<course>/<module>/`. Metadata, at least one exercise,
mastery criteria, and the stages that genuinely help the topic are required. Stages
are optional by design; do not add prose just to fill a template.

The Go learner path has four core chapters. Their visible labels should name the
lesson-specific idea rather than repeat the page template:

1. **Concept & mental model** — the problem, one mental model, and a useful visual.
2. **Rules & examples** — the minimum mechanics, one example, and one small prediction.
3. **Best practices & pitfalls** — the recommended approach plus common mistakes a new learner is likely to meet.
4. **Exercises & review** — a short recap, up to three first-pass exercises, and clear mastery evidence.

Trade-offs belong in collapsed optional depth. Best-practice guidance stays visible and
must be understandable without outside research. The Go course is
project-neutral: do not reference LedgerFlow or another product-specific domain.

## Writing rules

- Define a term before using it and prefer one new idea per paragraph.
- Give structured stages a specific `title` such as “Declaring variables and choosing types”; avoid generic headings such as “How it works” when a clearer topic name is available.
- Answer the learner's likely question directly before adding mechanism or nuance.
- Use familiar examples and add a TypeScript/React bridge when it clarifies the idea.
- Keep analogies short, then state exactly where the analogy stops.
- Put backend, operating-system, concurrency, and performance depth after the core idea.
- Avoid absolute claims such as “always,” “random,” or “safe” when Go only specifies a narrower guarantee.

## Exercise evidence

- First pass: prediction, code reading, and one implementation task.
- Optional practice: debugging, refactoring, and design.
- Advanced challenges stay collapsed and are never required for beginner completion.

Reading alone is not mastery, but mastery must not require an optional exercise.

## References

The lesson must stand on its own. External links are optional further reading. Prefer
official Go tutorials and package documentation, link the exact relevant section, and
label the language specification as a lookup reference rather than a beginner tutorial.

## Review checklist

1. Can a frontend developer explain the idea without outside help?
2. Does the first screen answer the most likely beginner question?
3. Are build time, startup, runtime, memory, OS, network, and database concepts separated?
4. Is every visible section doing a different teaching job?
5. Are examples generic and understandable without a personal project?
6. Are guarantees and trade-offs stated accurately?
7. Can the learner demonstrate the core idea with three or fewer first-pass exercises?
8. Does the lesson link at least two relevant official `go.dev` or `pkg.go.dev` sources?
9. Do structured Go examples parse with `gofmt`, and are prose paragraphs below 100 words?

Run both content gates before finishing an authoring pass:

```sh
pnpm content:validate
pnpm content:audit-go-syntax
```
