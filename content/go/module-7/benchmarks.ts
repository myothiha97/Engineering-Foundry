import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 7 — writing and reading Go benchmarks. Same beginner-friendly voice as
 * Modules 0–6: plain language, one analogy per hard idea, a concrete example
 * before the abstract rule. Correct and careful about b.N, -benchmem output
 * (ns/op, B/op, allocs/op), timer control, and the must-know dead-code-
 * elimination trap (assign to a package-level sink). benchstat and the
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
    "Write a `func BenchmarkXxx(b *testing.B)` that loops `b.N` times and run it with `go test -bench=. -benchmem`",
    "Read a benchmark result line and explain what `ns/op`, `B/op`, and `allocs/op` each mean",
    "Prevent the compiler from optimizing away benchmarked work by assigning the result to a package-level sink variable, and use `b.ResetTimer` to exclude setup",
  ],
  concepts: ["benchmarks", "b.N", "allocs"],
  ledgerFlowApplications: [
    "Benchmark the transaction-posting hot path so a refactor is judged by ns/op, not by hunch",
    "Track allocs/op on the balance-recompute step to catch a change that quietly starts allocating per call",
    "Compare two implementations of the posting path with benchstat before committing to the faster one",
  ],
  references: [
    {
      title: "testing package — Benchmarks",
      url: "https://pkg.go.dev/testing#hdr-Benchmarks",
      teaches: "The normative rules for BenchmarkXxx, b.N, ResetTimer, StopTimer/StartTimer, ReportAllocs, and RunParallel.",
      relevance: "The authoritative reference for every benchmark API this lesson uses.",
      required: true,
      section: "Benchmarks",
    },
    {
      title: "Dave Cheney — How to write benchmarks in Go",
      url: "https://dave.cheney.net/2013/06/30/how-to-write-benchmarks-in-go",
      teaches: "Practical benchmarking: the b.N loop, controlling the timer, and the dead-code-elimination trap with a sink variable.",
      relevance: "The classic walkthrough of the exact pitfalls this lesson makes you avoid.",
      required: true,
      section: "Writing benchmarks",
    },
    {
      title: "Go Diagnostics",
      url: "https://go.dev/doc/diagnostics",
      teaches: "How benchmarking fits alongside profiling and tracing, and when to reach for each.",
      relevance: "Places micro-benchmarks in context and forward-references the pprof profiling lesson.",
      required: false,
      section: "Profiling",
    },
    {
      title: "benchstat command",
      url: "https://pkg.go.dev/golang.org/x/perf/cmd/benchstat",
      teaches: "How to run a benchmark multiple times and compare two sets of results with statistical confidence.",
      relevance: "The tool that turns noisy single runs into a trustworthy before/after comparison.",
      required: false,
      section: "Comparing runs",
    },
  ],
  exercises: [
    {
      id: "go7bm-predict-bn",
      type: "prediction",
      prompt:
        "A benchmark's body prints `b.N` at the end. You run it once. Predict whether `b.N` is a fixed number you chose, and explain what actually decides its value.",
      expectedAnswer:
        "You never choose b.N. The testing framework runs the benchmark repeatedly, increasing b.N (1, then more) until the total measured time is long enough to be stable (around a second by default). The final b.N is whatever count reached that duration, so it varies by machine and by how fast the operation is.",
      hints: [
        "You never assign b.N yourself — the framework controls it.",
        "It grows the loop count until the run lasts long enough to time reliably.",
      ],
    },
    {
      id: "go7bm-read-output",
      type: "code-reading",
      prompt:
        "Interpret this line from `go test -bench=. -benchmem`:\n\nBenchmarkPost-8   250000   4820 ns/op   1360 B/op   14 allocs/op\n\nState what each of the four numbers after the name means.",
      expectedAnswer:
        "`-8` is GOMAXPROCS (8 CPUs). `250000` is b.N, the number of iterations that were run. `4820 ns/op` is the average time per operation (nanoseconds). `1360 B/op` is the average bytes allocated per operation. `14 allocs/op` is the average number of distinct heap allocations per operation. Lower ns/op, B/op, and allocs/op are all better.",
      hints: [
        "The number right after the name is how many times the loop ran (b.N).",
        "ns/op is time; B/op and allocs/op come from -benchmem and describe allocation.",
      ],
    },
    {
      id: "go7bm-implement-sink",
      type: "implementation",
      prompt:
        "Write a benchmark for `formatAmount(cents int64) string`. Build the input once outside the timed loop, reset the timer so setup is excluded, and store each result in a package-level sink so the compiler cannot optimize the call away.",
      starterCode:
        'package ledger\n\nimport "testing"\n\n// TODO: package-level sink here\n\nfunc BenchmarkFormatAmount(b *testing.B) {\n  // TODO: build input, reset timer, loop b.N times, defeat dead-code elimination\n}',
      expectedAnswer:
        'package ledger\n\nimport "testing"\n\nvar sinkString string // package-level sink; prevents dead-code elimination\n\nfunc BenchmarkFormatAmount(b *testing.B) {\n  const cents int64 = 123456 // setup: build a realistic input once\n  b.ReportAllocs()\n  b.ResetTimer() // exclude the setup above from the measurement\n  var s string\n  for i := 0; i < b.N; i++ {\n    s = formatAmount(cents)\n  }\n  sinkString = s // publish the result so the call is observably used\n}',
      hints: [
        "Declare `var sinkString string` at package scope and assign the loop's result to it after the loop.",
        "Do the setup first, then call b.ResetTimer() so only the loop is timed; b.ReportAllocs() opts this benchmark into allocation stats.",
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
        'func BenchmarkSumBalances(b *testing.B) {\n  for i := 0; i < b.N; i++ {\n    rows := buildRows(100000) // expensive setup runs every iteration\n    _ = sumBalances(rows)\n  }\n}',
      expectedAnswer:
        'var sinkInt int64\n\nfunc BenchmarkSumBalances(b *testing.B) {\n  rows := buildRows(100000) // build once, before timing\n  b.ResetTimer()            // discard the setup time\n  var total int64\n  for i := 0; i < b.N; i++ {\n    total = sumBalances(rows)\n  }\n  sinkInt = total\n}',
      hints: [
        "Move buildRows out of the loop so it runs exactly once.",
        "Call b.ResetTimer() after the setup, and sink the result to keep the call alive.",
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
        "Explain when `b.RunParallel` is the right tool instead of the plain `b.N` loop, and why running benchmarks with the race detector (`-race`) enabled gives misleading timing numbers.",
      expectedAnswer:
        "Use b.RunParallel when you want to measure code under concurrent access — it runs the body on multiple goroutines across GOMAXPROCS to expose contention (locks, shared state) that a single-goroutine b.N loop cannot. Never benchmark with -race on: the race detector instruments every memory access, adding large and uneven overhead, so the ns/op you get reflects the instrumentation, not the real code. Run correctness tests with -race, and benchmarks without it.",
      hints: [
        "RunParallel exists to measure contention under concurrency, not single-threaded speed.",
        "-race instruments memory accesses, inflating and distorting timings — keep it off for benchmarks.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-bn",
      kind: "explain",
      description:
        "Explain, without notes, why the benchmark body loops `b.N` times and how the framework decides that value.",
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
        "Write a correct benchmark that excludes setup with ResetTimer and defeats dead-code elimination with a package-level sink.",
      required: true,
    },
    {
      id: "debug-deadcode",
      kind: "debug",
      description:
        "Diagnose a suspiciously fast (sub-nanosecond) benchmark as dead-code elimination and fix it.",
      required: true,
    },
  ],
  sections: {
    problem: {
      body: "You've made a function faster — or you think you have. You rewrote the transaction-posting path to avoid a slice copy, and it *feels* quicker. But feelings are terrible at measuring nanoseconds. Maybe your change helped; maybe it helped in one spot and hurt in another; maybe the slow part was somewhere you never looked.\n\nThe discipline that separates real optimization from superstition is simple: **measure before you optimize**. Go builds the measuring tool right into the test framework. A **benchmark** is a special test function that runs your code many times and reports how long each run took and how much memory it allocated — turning \"I think it's faster\" into \"it's 4820 ns/op, down from 6100.\"",
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
    naive: {
      body: "The instinct, before you know about benchmarks, is to time things by hand: grab `time.Now()` before the call, subtract it after, print the difference. It looks reasonable and it's completely unreliable for small operations.\n\nThe problem is that one call of a fast function might take a handful of nanoseconds — far below the resolution and noise floor of a single wall-clock measurement. Run it once and you're mostly measuring clock jitter, the scheduler, and luck. To get a stable number you'd have to run the operation thousands of times in a loop and average — which is exactly the bookkeeping Go's benchmark framework does for you, correctly, if you let it.",
      blocks: [
        {
          type: "example",
          example: {
            title: "The hand-rolled timer you should NOT write",
            language: "go",
            code:
              'func main() {\n    start := time.Now()\n    formatAmount(123456) // one call of a nanosecond-scale function\n    elapsed := time.Since(start)\n    fmt.Println(elapsed) // e.g. "417ns" — mostly noise, not the real cost\n}',
            takeaway:
              "Timing a single fast call measures jitter more than the code. You need many iterations and careful timer control — which is what a real benchmark provides.",
          },
        },
        {
          type: "points",
          items: [
            "Timing one call of a fast function measures noise, not the operation.",
            "A trustworthy number needs many iterations and a controlled timer — don't hand-roll that.",
          ],
        },
      ],
    },
    failure: {
      body: "Even once you switch to a proper `Benchmark` function, there's a trap that fools almost everyone the first time: your benchmark reports a number that is *too good to be true* — like `0.3 ns/op`, which is faster than a single CPU instruction can run a real function. You celebrate. You should be suspicious.\n\nWhat happened is **dead-code elimination**. The Go compiler is allowed to delete work whose result nobody uses, because deleting it can't change the program's observable behavior. If your benchmark loop calls `hash(data)` and throws the result away, the compiler quietly removes the call — so your loop measures *nothing*, and you get a nonsense sub-nanosecond result. The benchmark ran; it just didn't benchmark anything.",
      blocks: [
        {
          type: "scenario",
          scenario: {
            title: "The 0.3 ns/op that isn't real",
            context:
              "A developer benchmarks a hashing routine. The loop body is `hash(data)` with the return value ignored. The benchmark reports 0.3 ns/op and 0 allocs/op. Thrilled, they conclude the hash is essentially free and ship a change built on that assumption.",
            insight:
              "The result was never used, so the compiler eliminated the call — the loop measured an empty body. The real hash costs hundreds of nanoseconds. Assigning the result to a package-level sink variable forces the compiler to actually run it, and the honest number appears.",
          },
        },
      ],
    },
    intuition: {
      body: "Here's the mental image. A benchmark hands the framework one small routine and says, \"run this over and over and tell me the average cost of one run.\" You don't get to pick how many times — the framework does, because it needs enough repetitions that the total time is long enough to measure precisely. It starts small, sees the run was too quick to trust, and keeps *increasing the repeat count* until the whole thing lasts long enough (about a second by default) to give a stable per-operation number.\n\nThat repeat count is the value `b.N`. Your job is to write a loop that runs your operation exactly `b.N` times; the framework's job is to choose `b.N` and divide the total time by it. Think of `b.N` as a dial the framework turns up until the measurement stops being noisy — you just wire your operation into the dial.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "You never set b.N",
            text: "b.N is chosen by the framework, not by you. It runs the benchmark repeatedly with a growing N (1, then larger) until the elapsed time is long enough to be reliable, then reports total_time / N as ns/op. A different machine, or a faster operation, produces a different final N — and that's expected.",
          },
        },
        {
          type: "points",
          items: [
            "The framework runs your operation many times and divides total time by the count.",
            "That count is **b.N**, and the framework grows it until timing is stable — you never set it.",
            "Your loop must run the operation exactly `b.N` times, no more, no less.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "So the durable model is: **a benchmark is a test that reports cost, and `b.N` is the framework's dial for getting a stable number.** A benchmark function has the signature `func BenchmarkXxx(b *testing.B)`, lives in a `_test.go` file, and its heart is the loop `for i := 0; i < b.N; i++ { /* the thing you're measuring */ }`.\n\nEverything else is refinement of one idea: *make sure the loop measures only the operation you care about, and make sure the compiler actually runs it.* Setup should happen outside the timed region (reset the timer after it). The result must be observably used (a sink) so it isn't deleted. Get those two right and the number the framework prints is the real cost of your code.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "The anatomy of a benchmark run",
            kind: "flow",
            nodes: [
              { id: "setup", label: "Setup (once)", detail: "build inputs — must be excluded from timing", tone: "muted" },
              { id: "reset", label: "b.ResetTimer()", detail: "start the clock here, after setup", tone: "accent" },
              { id: "loop", label: "for i := 0; i < b.N; i++", detail: "run the operation b.N times", tone: "default" },
              { id: "sink", label: "sink = result", detail: "keep the call observable so it isn't deleted", tone: "success" },
              { id: "report", label: "framework reports ns/op", detail: "total timed / b.N", tone: "default" },
            ],
            caption: "Setup outside the timer, the operation inside the b.N loop, the result into a sink — then a trustworthy ns/op.",
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
      body: "Now the precise version. You run benchmarks with `go test -bench=<pattern> -benchmem`. The `-bench` flag takes a regular expression matching benchmark names — `-bench=.` runs them all, `-bench=Post` runs those with \"Post\" in the name. Without `-bench`, `go test` skips benchmarks entirely and only runs tests. The `-benchmem` flag adds the memory columns (`B/op` and `allocs/op`) to the output.\n\nInside the function you have a few controls on `b`. `b.ResetTimer()` zeroes the clock so expensive setup before it doesn't count. `b.StopTimer()` / `b.StartTimer()` pause and resume timing around per-iteration setup you can't hoist out of the loop. `b.ReportAllocs()` opts a single benchmark into allocation reporting even without the `-benchmem` flag. And `b.RunParallel(...)` runs the body on multiple goroutines to measure behavior under contention. The one non-negotiable is the loop shape: `for i := 0; i < b.N; i++`.",
      blocks: [
        {
          type: "example",
          example: {
            title: "The canonical benchmark shape",
            language: "go",
            code:
              'package ledger\n\nimport "testing"\n\nvar sink string // package-level sink (explained next stage)\n\nfunc BenchmarkFormatAmount(b *testing.B) {\n    const cents int64 = 123456 // setup: a realistic input\n    b.ReportAllocs()           // report B/op and allocs/op for this benchmark\n    b.ResetTimer()             // exclude the setup above from timing\n    var s string\n    for i := 0; i < b.N; i++ {\n        s = formatAmount(cents) // the operation under test\n    }\n    sink = s // keep the result observable\n}',
            takeaway:
              "Setup, then ResetTimer, then the b.N loop, then publish the result to a sink. Run it with `go test -bench=FormatAmount -benchmem`.",
          },
        },
        {
          type: "example",
          example: {
            title: "Excluding per-iteration setup with Stop/Start",
            language: "go",
            code:
              'func BenchmarkPost(b *testing.B) {\n    for i := 0; i < b.N; i++ {\n        b.StopTimer()\n        tx := newRandomTx() // setup you cannot hoist out (differs each loop)\n        b.StartTimer()\n        sinkErr = post(tx) // only this call is timed\n    }\n}',
            takeaway:
              "When setup must run every iteration, wrap it in StopTimer/StartTimer so only the operation is measured. Prefer ResetTimer when the setup can be done once up front — it's cheaper.",
          },
        },
        {
          type: "points",
          items: [
            "Run with `go test -bench=. -benchmem`; without `-bench`, benchmarks don't run.",
            "`b.ResetTimer()` excludes one-time setup; `b.StopTimer()`/`b.StartTimer()` exclude per-iteration setup.",
            "`b.ReportAllocs()` turns on the allocation columns for that benchmark.",
            "The loop must be `for i := 0; i < b.N; i++` — nothing else.",
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
              { id: "name", label: "BenchmarkPost-8", detail: "the benchmark name, with -8 = GOMAXPROCS (number of CPUs)" },
              { id: "n", label: "250000", detail: "b.N — how many iterations the framework settled on", tone: "muted" },
              { id: "ns", label: "4820 ns/op", detail: "average nanoseconds per operation — the headline speed number", tone: "accent" },
              { id: "bytes", label: "1360 B/op", detail: "average bytes allocated per operation (from -benchmem)", tone: "default" },
              { id: "allocs", label: "14 allocs/op", detail: "average number of heap allocations per operation (from -benchmem)", tone: "success" },
            ],
            caption: "Lower is better on all three: ns/op is time, B/op is memory volume, allocs/op is how many times you hit the allocator.",
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
      body: "The one habit that makes benchmarks trustworthy is defeating **dead-code elimination** with a *sink*. A sink is a package-level variable you assign the operation's result to. Because a package-level variable is observable outside the function, the compiler can't prove the work is useless, so it must actually run it.\n\nWhy package-level and not a local? A local variable the compiler can often still see is unused and delete along with the work. A package-level variable might be read by anything, so the compiler keeps the assignment — and therefore the computation feeding it. Declare one sink per result type you need (`var sinkString string`, `var sinkErr error`), assign inside or just after the loop, and your numbers become honest.",
      blocks: [
        {
          type: "example",
          example: {
            title: "The sink pattern, wrong vs right",
            language: "go",
            code:
              '// WRONG: result ignored — the compiler may delete the call.\nfunc BenchmarkHashBad(b *testing.B) {\n    for i := 0; i < b.N; i++ {\n        hash(data) // 0.3 ns/op nonsense: eliminated\n    }\n}\n\n// RIGHT: result flows to a package-level sink.\nvar sinkHash uint64\n\nfunc BenchmarkHashGood(b *testing.B) {\n    var h uint64\n    for i := 0; i < b.N; i++ {\n        h = hash(data) // must run: its result escapes to sinkHash\n    }\n    sinkHash = h // observable use — defeats dead-code elimination\n}',
            takeaway:
              "Assign the result to a package-level variable so the compiler cannot delete the work. This single habit is the difference between a real measurement and a fantasy.",
          },
        },
        {
          type: "points",
          items: [
            "Declare a **package-level sink** variable and assign the operation's result to it.",
            "A local variable can be optimized away with the work; a package-level one cannot.",
            "One sink per result type (`sinkString`, `sinkErr`, ...); assign in or right after the loop.",
          ],
        },
      ],
    },
    experiment: {
      body: "Predict before you read on — a wrong guess you correct sticks better than a right answer you skimmed. Two benchmarks measure the same `hash(data)` function. Benchmark A ignores the return value; Benchmark B assigns it to a package-level `sink`. Both run `for i := 0; i < b.N; i++`.\n\n```\nfunc BenchmarkA(b *testing.B) {\n    for i := 0; i < b.N; i++ { hash(data) }\n}\nfunc BenchmarkB(b *testing.B) {\n    var h uint64\n    for i := 0; i < b.N; i++ { h = hash(data) }\n    sink = h\n}\n```\n\nWhich reports the true cost of hashing, and roughly what will the other report? Commit to an answer.\n\nHere's the trace. In A, nothing uses the result of `hash(data)`, so the compiler is free to remove the call entirely; the loop body becomes empty and A reports something absurd like 0.3 ns/op — that's not hashing, that's an empty loop. In B, the result flows into `sink`, which is observable, so the compiler must actually compute each hash; B reports the honest cost, maybe 180 ns/op. The lesson: **a benchmark only measures work the compiler is forced to keep.** If your number looks impossibly good, suspect elimination before you celebrate.",
    },
    "failure-cases": {
      body: "Benchmarks fail quietly — they still print a number, it's just the wrong number. These are the ways that happens in practice.",
      blocks: [
        {
          type: "points",
          items: [
            "**Ignored result** → dead-code elimination deletes the call; you measure an empty loop (0.x ns/op). Assign to a package-level sink.",
            "**Setup inside the timed loop** → you measure setup + operation, not the operation. Hoist setup out and call `b.ResetTimer()`, or wrap per-iteration setup in `StopTimer`/`StartTimer`.",
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
            code:
              '// WRONG: buildRows runs b.N times and dominates the timing.\nfunc BenchmarkSumBad(b *testing.B) {\n    for i := 0; i < b.N; i++ {\n        rows := buildRows(100000)\n        sinkInt = sumBalances(rows)\n    }\n}\n\n// RIGHT: build once, reset, then measure only sumBalances.\nfunc BenchmarkSumGood(b *testing.B) {\n    rows := buildRows(100000)\n    b.ResetTimer()\n    var total int64\n    for i := 0; i < b.N; i++ {\n        total = sumBalances(rows)\n    }\n    sinkInt = total\n}',
            takeaway:
              "If setup can be done once, do it before b.ResetTimer(). If it must run each iteration, fence it with StopTimer/StartTimer. Never let setup share the clock with the operation.",
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
      body: "A few durable rules. Measure before you optimize — write the benchmark first, get a baseline, then change the code and compare; a change with no measured win is not an optimization. Keep the timed region pure: setup outside, result into a sink. And never trust one run — noise is real, so repeat and compare with a tool that understands variance rather than eyeballing two numbers.",
      blocks: [
        {
          type: "points",
          items: [
            "Baseline first: benchmark the current code before you touch it, so you can prove the change helped.",
            "Keep the timed loop pure — setup out via ResetTimer, result in via a sink.",
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
    ledgerflow: {
      body: "In LedgerFlow, the hot path is posting a transaction and recomputing the affected balances — it runs on every write, so a few hundred nanoseconds and a couple of allocations there add up fast across a busy ledger. So that path gets a benchmark. We build a realistic transaction once, `b.ResetTimer()` to drop the setup, loop `b.N` times calling `post(tx)`, and assign the result to a package-level sink so the compiler can't optimize the posting away. We run it with `-benchmem` and watch `allocs/op` as closely as `ns/op`, because an accidental per-call allocation in the recompute step would quietly load the garbage collector under production traffic. When we change the path, we run the benchmark with `-count` on old and new code and let benchstat tell us whether the change is a real win — never a hunch.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Benchmarking the posting hot path",
            language: "go",
            code:
              'package ledger\n\nimport "testing"\n\nvar sinkBalances []Balance\n\nfunc BenchmarkPost(b *testing.B) {\n    tx := newRealisticTx() // build one representative transaction\n    b.ReportAllocs()\n    b.ResetTimer() // exclude the setup from the measurement\n    var out []Balance\n    for i := 0; i < b.N; i++ {\n        out = post(tx) // the hot path: post + recompute balances\n    }\n    sinkBalances = out // keep the result observable\n}\n// go test -bench=BenchmarkPost -benchmem -count=10 > new.txt\n// benchstat old.txt new.txt',
            takeaway:
              "Realistic input, ResetTimer to exclude setup, a sink to keep post() alive, -benchmem to watch allocs/op, and benchstat over -count runs to confirm the win.",
          },
        },
      ],
    },
    exercises: {
      body: "Practice is what turns \"I read about benchmarks\" into \"I write one without introducing dead-code elimination.\" Work across predicting how b.N is chosen, reading a -benchmem output line, implementing a correct benchmark with ResetTimer and a sink, debugging a suspiciously fast result, refactoring setup out of the timed loop, and designing a trustworthy before/after comparison. Each produces a different kind of evidence — do them, don't just read them.",
    },
    mastery: {
      body: "You've mastered this when you can explain why the body loops `b.N` times and how the framework picks that value, read a `-benchmem` line and say what ns/op, B/op, and allocs/op each mean, write a benchmark that excludes setup with ResetTimer and defeats dead-code elimination with a package-level sink, and diagnose a sub-nanosecond result as elimination and fix it. Attest a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "Two ideas carry this lesson. **Benchmarks measure so you don't guess** — a `func BenchmarkXxx(b *testing.B)` loops `b.N` times (a count the framework grows until timing is stable), and `go test -bench=. -benchmem` reports ns/op, B/op, and allocs/op, all lower-is-better. **But a benchmark only measures work the compiler keeps** — assign the result to a package-level sink so dead-code elimination doesn't hand you a fantasy 0.3 ns/op, and keep setup out of the timed loop with ResetTimer. Repeat runs and compare with benchstat, because one number is noise. And remember a micro-benchmark tells you a function's cost, not whether it matters — for that you profile.",
      blocks: [
        {
          type: "points",
          items: [
            "`func BenchmarkXxx(b *testing.B)` loops `b.N` times; the framework chooses b.N for stable timing.",
            "Run with `go test -bench=. -benchmem`; read ns/op (time), B/op and allocs/op (allocation) — lower is better.",
            "Assign results to a package-level sink to defeat dead-code elimination; use ResetTimer to exclude setup.",
            "Don't benchmark with -race, don't trust one run — use -count and benchstat. Next up: pprof for finding where the time actually goes.",
          ],
        },
      ],
    },
  },
};
