import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 7 — writing and reading Go benchmarks. Same beginner-friendly voice as
 * Modules 0–6: plain language, one analogy per hard idea, a concrete example
 * before the abstract rule. Uses the preferred Go 1.24+ b.Loop API, explains
 * -benchmem output (ns/op, B/op, allocs/op), and notes the older b.N form.
 * benchstat and the
 * "measure, don't guess" discipline are emphasised; pprof is forward-referenced.
 */
export const goBenchmarks: Lesson = {
  id: "go-benchmarks",
  slug: "benchmarks",
  title: "Benchmarks",
  description:
    "Write `BenchmarkXxx(b *testing.B)` functions, run them with `go test -bench=. -benchmem`, and read `ns/op`, `B/op`, and `allocs/op` — so you optimize from measurements, not guesses.",
  moduleId: "go-7",
  estimatedMinutes: 45,
  difficulty: "advanced",
  prerequisites: ["go-unit-table-tests"],
  learningObjectives: [
    "Write a `func BenchmarkXxx(b *testing.B)` using `for b.Loop()` and run it with `go test -bench=. -benchmem`",
    "Read a benchmark result line and explain what `ns/op`, `B/op`, and `allocs/op` each mean",
    "Keep setup outside `b.Loop` and use timer controls only for per-iteration setup",
  ],
  concepts: ["benchmarks", "b.Loop", "allocations"],
  references: [
    {
      title: "testing package — Benchmarks",
      url: "https://pkg.go.dev/testing#hdr-Benchmarks",
      teaches: "The rules for BenchmarkXxx, B.Loop, timer controls, ReportAllocs, and RunParallel.",
      relevance: "The authoritative reference for every benchmark API this lesson uses.",
      required: false,
      section: "Benchmarks",
    },
    {
      title: "More predictable benchmarking with testing.B.Loop — The Go Blog",
      url: "https://go.dev/blog/testing-b-loop",
      teaches: "Why B.Loop is preferred over the older b.N benchmark style in Go 1.24 and later.",
      relevance: "The official explanation of the API used throughout this lesson.",
      required: false,
      section: "Writing benchmarks",
    },
    {
      title: "Go Diagnostics",
      url: "https://go.dev/doc/diagnostics",
      teaches: "How benchmarking fits alongside profiling and tracing, and when to reach for each.",
      relevance:
        "Places micro-benchmarks in context and forward-references the pprof profiling lesson.",
      required: false,
      section: "Profiling",
    },
    {
      title: "benchstat command",
      url: "https://pkg.go.dev/golang.org/x/perf/cmd/benchstat",
      teaches:
        "How to run a benchmark multiple times and compare two sets of results with statistical confidence.",
      relevance:
        "The tool that turns noisy single runs into a trustworthy before/after comparison.",
      required: false,
      section: "Comparing runs",
    },
  ],
  exercises: [
    {
      id: "go7bm-predict-bn",
      type: "prediction",
      prompt:
        "A benchmark uses `for b.Loop()`. Predict who decides when the loop stops: your code or the testing framework.",
      expectedAnswer:
        "The testing framework decides. `b.Loop()` returns true until enough iterations have run to produce a useful timing measurement.",
      hints: [
        "Your code does not choose an iteration count.",
        "The framework controls the loop so it can gather a useful timing sample.",
      ],
    },
    {
      id: "go7bm-read-output",
      type: "code-reading",
      prompt:
        "Interpret this line from `go test -bench=. -benchmem`:\n\nBenchmarkPost-8   250000   4820 ns/op   1360 B/op   14 allocs/op\n\nState what each of the four numbers after the name means.",
      expectedAnswer:
        "`-8` is GOMAXPROCS (8 CPUs). `250000` is the number of completed iterations. `4820 ns/op` is the average time per operation. `1360 B/op` is the average bytes allocated per operation. `14 allocs/op` is the average number of heap allocations per operation.",
      hints: [
        "The number right after the name is how many iterations ran.",
        "ns/op is time; B/op and allocs/op come from -benchmem and describe allocation.",
      ],
    },
    {
      id: "go7bm-implement-b-loop",
      type: "implementation",
      prompt:
        "Write a Go 1.24+ benchmark for `formatAmount(cents int64) string` using `for b.Loop()`. Build the input once before the loop.",
      starterCode:
        'package format\n\nimport "testing"\n\nfunc BenchmarkFormatAmount(b *testing.B) {\n  // TODO: build input, then use b.Loop\n}',
      expectedAnswer:
        'package format\n\nimport "testing"\n\nfunc BenchmarkFormatAmount(b *testing.B) {\n  const cents int64 = 123456 // setup before the loop\n  b.ReportAllocs()\n  for b.Loop() {\n    formatAmount(cents)\n  }\n}',
      hints: [
        "Write `for b.Loop() { ... }` around the operation being measured.",
        "Setup before the loop is automatically excluded; `b.ReportAllocs()` adds allocation statistics.",
      ],
    },
    {
      id: "go7bm-debug-deadcode",
      type: "debugging",
      prompt:
        "A benchmark of a hashing function reports `0.3 ns/op` and `0 allocs/op`, far faster than seems possible. The body is `for i := 0; i < b.N; i++ { hash(data) }` with the return value ignored. Explain what happened and how to fix it.",
      expectedAnswer:
        "Because hash(data)'s result is never used, the compiler sees the call has no observable effect and eliminates it (dead-code elimination). The loop measures nothing, so you get a nonsensically tiny 0.3 ns/op. Fix it by making the result observable: assign it to a package-level sink var (e.g. `sink = hash(data)`) so the compiler must actually perform the call.",
      hints: [
        "A result nothing consumes is work the compiler is free to delete.",
        "Assign the result to a package-level variable so the call has an observable effect.",
      ],
    },
    {
      id: "go7bm-refactor-timer",
      type: "refactoring",
      prompt:
        "This benchmark builds a 100,000-row slice inside the timed loop, so the setup cost swamps the operation being measured. Refactor it so only `sumBalances` is timed.",
      starterCode:
        "func BenchmarkSumBalances(b *testing.B) {\n  for b.Loop() {\n    rows := buildRows(100000) // expensive setup is measured every iteration\n    sumBalances(rows)\n  }\n}",
      expectedAnswer:
        "func BenchmarkSumBalances(b *testing.B) {\n  rows := buildRows(100000) // setup before b.Loop is not timed\n  for b.Loop() {\n    sumBalances(rows)\n  }\n}",
      hints: [
        "Move buildRows out of the loop so it runs exactly once.",
        "With `b.Loop`, one-time setup before the loop is excluded automatically.",
      ],
    },
    {
      id: "go7bm-design-compare",
      type: "design",
      prompt:
        "You changed the transaction-posting path and want to prove it is faster. Design the measurement: how many runs, which tool compares them, and why a single before/after run is not enough evidence.",
      expectedAnswer:
        "A single run is noise: CPU frequency scaling, background processes, and GC timing make one number unreliable. Run the benchmark several times (e.g. `go test -bench=BenchmarkPost -count=10` on a quiet machine) for both the old and new code, save each to a file, then run benchstat old.txt new.txt. benchstat reports the mean, the variation, and whether the difference is statistically significant — so you only claim a speed-up you can actually defend.",
      hints: [
        "Use -count to repeat the benchmark and capture the spread, not one lucky number.",
        "benchstat compares two result files and tells you if the delta is real or just noise.",
      ],
    },
    {
      id: "go7bm-advanced-parallel",
      type: "advanced",
      prompt:
        "Explain when `b.RunParallel` is the right tool instead of a plain `b.Loop` benchmark, and why running benchmarks with the race detector (`-race`) gives misleading timing numbers.",
      expectedAnswer:
        "Use `b.RunParallel` to measure concurrent access and expose contention that a single-goroutine benchmark cannot. Do not compare performance with `-race` enabled: its instrumentation adds large overhead, so the timing describes the detector as well as your code. Run correctness tests with `-race` and performance benchmarks without it.",
      hints: [
        "RunParallel exists to measure contention under concurrency, not single-threaded speed.",
        "-race instruments memory accesses, inflating and distorting timings — keep it off for benchmarks.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-b-loop",
      kind: "explain",
      description:
        "Explain why `b.Loop()` controls the measured loop and when the older `b.N` style may still appear.",
      required: true,
    },
    {
      id: "predict-output",
      kind: "predict",
      description:
        "Given a `-benchmem` result line, correctly state what ns/op, B/op, and allocs/op each mean and which direction is better.",
      required: true,
    },
    {
      id: "implement-bench",
      kind: "implement",
      description:
        "Write a current benchmark with setup before `for b.Loop()` and read its `-benchmem` output.",
      required: true,
    },
    {
      id: "debug-deadcode",
      kind: "debug",
      description:
        "Diagnose a suspiciously fast (sub-nanosecond) benchmark as dead-code elimination and fix it.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "You rewrote a formatter and it feels faster, but people cannot feel nanosecond differences reliably. A Go benchmark runs an operation many times and reports its average time and allocation cost. It turns 'this seems faster' into a result you can compare.\n\nThe rule is simple: **measure before and after an optimization**.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "Optimizing without benchmarking is like dieting without a scale. You might be doing the right thing, but you have no way to know — and you'll happily 'improve' something that was never the problem. A benchmark is the scale: it tells you the number so you stop guessing.",
          },
        },
        {
          type: "points",
          items: [
            "A **benchmark** measures how fast (and how allocation-heavy) a piece of code is.",
            "It lives in a `_test.go` file, like a test, but reports numbers instead of pass/fail.",
            "The rule it enforces: **measure before you optimize** — never trust a hunch about speed.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "A benchmark is a test that reports cost. It lives in a `_test.go` file, has a name beginning with `Benchmark`, and receives `*testing.B`. In current Go, put the operation inside `for b.Loop()`. The testing framework decides how many iterations are needed.\n\nCode before and after `b.Loop` is excluded from timing automatically, and the compiler preserves the work inside the loop. You may still see the older `for i := 0; i < b.N; i++` form in existing projects.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "The anatomy of a benchmark run",
            kind: "flow",
            nodes: [
              {
                id: "setup",
                label: "Setup (once)",
                detail: "build inputs — must be excluded from timing",
                tone: "muted",
              },
              {
                id: "loop",
                label: "for b.Loop()",
                detail: "the framework controls timing and iteration count",
                tone: "accent",
              },
              {
                id: "work",
                label: "Operation",
                detail: "only the code inside the loop is measured",
                tone: "success",
              },
              {
                id: "report",
                label: "Framework reports cost",
                detail: "time and allocations per operation",
                tone: "default",
              },
            ],
            caption: "Setup first, measured work inside b.Loop, then a per-operation report.",
          },
        },
        {
          type: "note",
          note: {
            tone: "info",
            title: "Where benchmarks live",
            text: "Benchmarks go in `_test.go` files alongside your tests, and their names must start with `Benchmark` and take `*testing.B` (mirroring how tests start with `Test` and take `*testing.T`). They are ignored by a normal `go test` run — you have to ask for them with the `-bench` flag.",
          },
        },
      ],
    },
    mechanics: {
      body: "Run benchmarks with `go test -bench=<pattern> -benchmem`. `-bench=.` runs every benchmark, while a name such as `-bench=Format` filters them. A normal `go test` does not run benchmarks. `-benchmem` adds bytes and allocations per operation.\n\nFor Go 1.24 and later, use exactly one `for b.Loop()` loop. One-time setup belongs before it and cleanup after it. If setup must happen during every iteration, use `b.StopTimer()` and `b.StartTimer()` around only that setup. `b.RunParallel` is a separate tool for measuring concurrent access.",
      blocks: [
        {
          type: "example",
          example: {
            title: "The canonical benchmark shape",
            language: "go",
            code: 'package format\n\nimport "testing"\n\nfunc BenchmarkFormatAmount(b *testing.B) {\n    const cents int64 = 123456 // setup is outside the measured loop\n    b.ReportAllocs()\n    for b.Loop() {\n        formatAmount(cents)\n    }\n}',
            takeaway:
              "Setup before `b.Loop` is excluded automatically. Run this with `go test -bench=FormatAmount -benchmem`.",
          },
        },
        {
          type: "example",
          example: {
            title: "Excluding per-iteration setup with Stop/Start",
            language: "go",
            code: "func BenchmarkParse(b *testing.B) {\n    for b.Loop() {\n        b.StopTimer()\n        input := newRandomInput() // required setup for this iteration\n        b.StartTimer()\n        parse(input)\n    }\n}",
            takeaway:
              "When setup must run every iteration, wrap it in StopTimer/StartTimer. When setup can be done once, put it before `b.Loop`.",
          },
        },
        {
          type: "points",
          items: [
            "Run with `go test -bench=. -benchmem`; without `-bench`, benchmarks don't run.",
            "`b.Loop()` automatically excludes setup before the loop and cleanup after it.",
            "`b.ReportAllocs()` turns on the allocation columns for that benchmark.",
            "For new code, prefer one `for b.Loop()` loop; recognize `b.N` as the older style.",
          ],
        },
      ],
    },
    diagram: {
      body: "Reading the output is half the skill, so let's decode a real line. After `go test -bench=. -benchmem`, a benchmark prints something like:\n\n```\nBenchmarkPost-8   250000   4820 ns/op   1360 B/op   14 allocs/op\n```\n\nEach field means something specific. Walk them left to right.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Reading a -benchmem result line",
            kind: "stack",
            nodes: [
              {
                id: "name",
                label: "BenchmarkPost-8",
                detail: "the benchmark name, with -8 = GOMAXPROCS (number of CPUs)",
              },
              { id: "n", label: "250000", detail: "how many iterations completed", tone: "muted" },
              {
                id: "ns",
                label: "4820 ns/op",
                detail: "average nanoseconds per operation — the headline speed number",
                tone: "accent",
              },
              {
                id: "bytes",
                label: "1360 B/op",
                detail: "average bytes allocated per operation (from -benchmem)",
                tone: "default",
              },
              {
                id: "allocs",
                label: "14 allocs/op",
                detail: "average number of heap allocations per operation (from -benchmem)",
                tone: "success",
              },
            ],
            caption:
              "Lower is better on all three: ns/op is time, B/op is memory volume, allocs/op is how many times you hit the allocator.",
          },
        },
        {
          type: "note",
          note: {
            tone: "tip",
            title: "Why allocs/op matters as much as ns/op",
            text: "Allocations aren't just memory — each one is work for the garbage collector later. A function that drops from 14 allocs/op to 2 often gets faster *and* eases GC pressure across the whole program. When you optimize, watch allocs/op, not only the clock.",
          },
        },
      ],
    },
    implementation: {
      body: "`b.Loop` removes two common benchmark traps. It starts timing when the loop begins and stops when the loop ends, so one-time setup and cleanup stay outside the measurement. The compiler also preserves calls inside this special loop, reducing the risk that apparently unused work is deleted.\n\nOlder `b.N` benchmarks often use `b.ResetTimer()` and a package-level sink for the same reasons. Learn to recognize that style, but prefer `b.Loop` for new Go 1.24+ code.",
      blocks: [
        {
          type: "example",
          example: {
            title: "The preferred current shape",
            language: "go",
            code: 'func BenchmarkHash(b *testing.B) {\n    data := []byte("hello") // setup, not timed\n\n    for b.Loop() {\n        hash(data) // measured work\n    }\n}',
            takeaway:
              "Keep one-time setup before the loop and only the operation being measured inside it.",
          },
        },
        {
          type: "points",
          items: [
            "Prefer `for b.Loop()` in Go 1.24 and later.",
            "Put one-time setup before the loop; it is excluded from timing automatically.",
            "Use timer controls only when setup must happen inside every iteration.",
          ],
        },
      ],
    },
    experiment: {
      body: "Predict which benchmark measures only hashing:\n\n```\nfunc BenchmarkA(b *testing.B) {\n    data := makeInput()\n    for b.Loop() { hash(data) }\n}\nfunc BenchmarkB(b *testing.B) {\n    for b.Loop() {\n        data := makeInput()\n        hash(data)\n    }\n}\n```\n\nBenchmark A measures hashing because `makeInput` is before `b.Loop` and is excluded automatically. Benchmark B measures both input creation and hashing because both happen inside the measured loop.",
    },
    "failure-cases": {
      body: "Benchmarks fail quietly — they still print a number, it's just the wrong number. These are the ways that happens in practice.",
      blocks: [
        {
          type: "points",
          items: [
            "**Using an old `b.N` benchmark without guarding useful work** → the compiler may delete an ignored result. Prefer `b.Loop`, or use a sink when maintaining older code.",
            "**Setup inside `b.Loop`** → you measure setup plus the operation. Hoist one-time setup before the loop, or use timer controls for required per-iteration setup.",
            "**Benchmarking with `-race`** → the race detector instruments every memory access, so timings balloon and distort. Run correctness tests with `-race`; run benchmarks without it.",
            "**One run only** → CPU scaling, background load, and GC make a single number noisy. Use `-count=N` and compare with benchstat.",
            "**Unrealistic input size** → a 3-element slice hides the allocation behavior of a 100,000-element one. Measure the size you actually run in production.",
          ],
        },
        {
          type: "example",
          example: {
            title: "Setup leaking into the measurement",
            language: "go",
            code: "// WRONG: input construction is measured too.\nfunc BenchmarkSumBad(b *testing.B) {\n    for b.Loop() {\n        rows := buildRows(100000)\n        sumRows(rows)\n    }\n}\n\n// RIGHT: build once; b.Loop times only sumRows.\nfunc BenchmarkSumGood(b *testing.B) {\n    rows := buildRows(100000)\n    for b.Loop() {\n        sumRows(rows)\n    }\n}",
            takeaway:
              "Setup before `b.Loop` is excluded automatically. If setup must run each iteration, use `StopTimer` and `StartTimer` around that setup.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "Benchmarks are powerful, but a micro-benchmark measures one function in isolation — which is both its strength and its limit. Here's where to think twice.",
      blocks: [
        {
          type: "points",
          items: [
            "**Micro-benchmark vs real workload**: measuring one function precisely can mislead — the function might not be your program's bottleneck at all. Confirm with a profiler on the real workload (that's the pprof lesson).",
            "**More iterations / higher `-count`**: more stable numbers, but longer runs; balance confidence against time.",
            "**RunParallel**: reveals contention under concurrency, but measures a different thing than single-threaded ns/op — use it only when concurrency is the question.",
            "**Optimizing to the benchmark**: you can make a number look great on an unrealistic input and lose in production. Measure realistic sizes and shapes.",
          ],
        },
        {
          type: "note",
          note: {
            tone: "warning",
            title: "A fast function is not a fast program",
            text: "A benchmark tells you a function's cost in isolation. It does NOT tell you whether that function matters. Spending a day shaving 50 ns off code that runs once per request while ignoring a query that runs 10,000 times is a classic trap. Benchmark to compare implementations; profile to find where the time actually goes.",
          },
        },
      ],
    },
    design: {
      body: "A few durable rules. Measure before you optimize: record a baseline, change the code, and compare. Keep one-time setup before `b.Loop` and only the measured operation inside. Never trust one run; repeat and compare with a tool that understands variance.",
      blocks: [
        {
          type: "points",
          items: [
            "Baseline first: benchmark the current code before you touch it, so you can prove the change helped.",
            "Keep the timed loop focused — one-time setup before `b.Loop`, measured work inside.",
            "Repeat with `-count` and compare with benchstat; a single run is not evidence.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Proving a refactor is actually faster",
            context:
              "You rewrote a serialization function and believe it's faster. You run the benchmark once on the old code (5100 ns/op) and once on the new (4900 ns/op) and declare victory.",
            insight:
              "A 4% gap is well within run-to-run noise — you may have proved nothing. Run each with `-count=10`, save to old.txt and new.txt, and run `benchstat old.txt new.txt`. If benchstat reports the difference as insignificant, your 'win' was luck. Only claim a speed-up the tool confirms.",
          },
        },
      ],
    },
    mastery: {
      body: "You understand this lesson when you can write a `b.Loop` benchmark, keep setup outside the measured loop, and explain ns/op, B/op, and allocs/op. Recognizing the older `b.N` style is useful but secondary.",
    },
    summary: {
      body: "Benchmarks replace guesses with measurements. Put the operation inside `for b.Loop()`, run `go test -bench=. -benchmem`, and read time and allocations per operation. Keep setup outside the loop, repeat comparisons with `-count`, and use benchstat instead of trusting one run. A micro-benchmark tells you a function's cost, not whether that function is the real bottleneck.",
      blocks: [
        {
          type: "points",
          items: [
            "Use `func BenchmarkXxx(b *testing.B)` with one `for b.Loop()` loop in Go 1.24+.",
            "Run with `go test -bench=. -benchmem`; read ns/op (time), B/op and allocs/op (allocation) — lower is better.",
            "Put one-time setup before `b.Loop`; it is excluded from timing automatically.",
            "Don't benchmark with -race, don't trust one run — use -count and benchstat. Next up: pprof for finding where the time actually goes.",
          ],
        },
      ],
    },
  },
};
