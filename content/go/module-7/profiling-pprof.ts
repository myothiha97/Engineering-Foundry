import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 7 capstone — profiling with pprof and the race detector. Same
 * beginner-friendly voice as earlier modules: plain language, one analogy per
 * hard idea, a concrete example before the abstract rule. Correct and careful
 * that profiles are sampled (statistical, not exact), that you optimize the
 * biggest hotspot first, and that -race has no false positives but only finds
 * races that actually execute. Ties the whole loop back to the benchmarks
 * lesson: benchmark -> profile -> fix -> re-benchmark to confirm.
 */
export const goProfilingPprof: Lesson = {
  id: "go-profiling-pprof",
  slug: "profiling-pprof",
  title: "Profiling with pprof & the race detector",
  description:
    "Capture CPU and memory profiles with pprof — from a benchmark or a running server — read them with `go tool pprof`, and let the numbers direct your optimization; then use the race detector to catch data races before they ship.",
  moduleId: "go-7",
  estimatedMinutes: 55,
  difficulty: "advanced",
  prerequisites: ["go-benchmarks"],
  learningObjectives: [
    "Capture a CPU profile and a memory profile, both from a benchmark (`go test -cpuprofile -memprofile`) and from a running server (`net/http/pprof`)",
    "Read a profile with `go tool pprof` — `top`, `list <func>`, and the flame graph — and explain why profiles are sampled rather than exact",
    "Run the disciplined loop (benchmark, profile, fix the top hotspot, re-benchmark to confirm) and use `-race` to catch data races that execute in tests or CI",
  ],
  concepts: ["pprof", "cpu-profile", "heap-profile", "race-detector"],
  references: [
    {
      title: "Diagnostics",
      url: "https://go.dev/doc/diagnostics",
      teaches:
        "The full menu of Go diagnostics — profiling, tracing, and debugging — and where pprof and the race detector fit among them.",
      relevance:
        "The official map of the tools this lesson uses, so you know pprof is one option among several and when to reach for it.",
      required: false,
      section: "Profiling",
    },
    {
      title: "Profiling Go Programs",
      url: "https://go.dev/blog/pprof",
      teaches:
        "A worked walk-through: capture a CPU profile, open it in `go tool pprof`, read `top` and `list`, find the hotspot, and speed the program up.",
      relevance:
        "The canonical end-to-end example of the measure-then-optimize loop this lesson teaches.",
      required: false,
      section: "The loop",
    },
    {
      title: "google/pprof",
      url: "https://github.com/google/pprof",
      teaches:
        "The pprof tool itself — the profile format and the interactive commands (`top`, `list`, `web`) that `go tool pprof` wraps.",
      relevance:
        "Reference for the analysis commands once you are comfortable and want the full set of options.",
      required: false,
      section: "Analyzing",
    },
    {
      title: "Data Race Detector",
      url: "https://go.dev/doc/articles/race_detector.html",
      teaches:
        "What the race detector does, how to enable it with `-race`, its runtime cost, and the important limit that it only reports races that actually execute.",
      relevance:
        "The authoritative source for the race-detector half of this lesson and its correctness caveats.",
      required: false,
      section: "Race detector",
    },
  ],
  exercises: [
    {
      id: "go7pp-predict-sampled",
      type: "prediction",
      prompt:
        "You run the same CPU profile twice on the same benchmark and diff the `top` output. The two lists are similar but the exact percentages differ slightly, and one tiny function appears in one run and not the other. Predict why, and say whether that means the profile is broken.",
      expectedAnswer:
        "The profile is fine. A CPU profile is sampled — the runtime interrupts the program ~100 times a second and records where it is, so the result is a statistical estimate, not an exact count. Two runs sample different instants, so small functions near the noise floor wobble in and out. The big hotspots at the top of `top` stay stable, which is all you rely on.",
      hints: [
        "A CPU profile is built from periodic samples, not from counting every instruction.",
        "Which entries would you trust — the ones at the top with large percentages, or the ones near the bottom at 0.1%?",
      ],
    },
    {
      id: "go7pp-read-top",
      type: "code-reading",
      prompt:
        "Interpret this `go tool pprof` CPU listing and say where you would optimize first:\n\n      flat  flat%   sum%        cum   cum%\n     1.20s 60.00% 60.00%      1.30s 65.00%  ledger.formatLine\n     0.40s 20.00% 80.00%      0.40s 20.00%  runtime.mallocgc\n     0.20s 10.00% 90.00%      2.00s 100%    ledger.PostBatch\n     0.10s  5.00% 95.00%      0.10s  5.00%  strings.Join\n\nExplain what `flat` versus `cum` mean here and why `PostBatch` has a huge `cum` but a small `flat`.",
      expectedAnswer:
        "`flat` is time spent in that function's own code; `cum` (cumulative) is time in that function plus everything it calls. PostBatch has flat 10% but cum 100% because it is the entry point — almost all time is inside the functions it calls, not in PostBatch itself. formatLine is the real hotspot: 60% flat, the most self-time of any function, so optimize it first. The 20% in runtime.mallocgc is a hint that formatLine is allocating a lot, which points at a memory fix.",
      hints: [
        "flat = self time; cum = self time + callees. Sort by flat to find where the CPU actually is.",
        "A high runtime.mallocgc share means allocation pressure — check the heap profile next.",
      ],
    },
    {
      id: "go7pp-implement-capture",
      type: "implementation",
      prompt:
        "Given a benchmark BenchmarkPostBatch in package ledger, write the exact commands to capture both a CPU profile and a memory profile from it, then open the CPU profile and print the top self-time functions. Assume you are in the package directory.",
      starterCode:
        "# 1. run the benchmark and write both profiles\n# 2. open the CPU profile\n# 3. inside pprof, list the top self-time functions",
      expectedAnswer:
        "# capture both profiles from the benchmark\ngo test -run=^$ -bench=BenchmarkPostBatch -benchmem \\\n  -cpuprofile=cpu.out -memprofile=mem.out .\n\n# open the CPU profile interactively\ngo tool pprof cpu.out\n\n# at the (pprof) prompt:\n(pprof) top      # top functions by flat (self) time\n(pprof) top -cum # or sort by cumulative time\n(pprof) list ledger.PostBatch  # annotated source for one function\n\n# open the memory profile the same way; -alloc_space shows total bytes allocated\ngo tool pprof -alloc_space mem.out",
      hints: [
        "`-cpuprofile` and `-memprofile` are flags to `go test`; add `-benchmem` so the bench line also shows allocs.",
        "`-run=^$` disables normal tests so only the benchmark runs; then `go tool pprof <file>` opens the interactive prompt where `top` and `list` live.",
      ],
    },
    {
      id: "go7pp-debug-alloc",
      type: "debugging",
      prompt:
        "A heap profile of the posting path shows most allocations inside formatLine below, and mallocgc is high in the CPU profile too. Find the allocation hotspot and fix it so the function allocates far less.",
      starterCode:
        'func formatLine(entries []Entry) string {\n    out := ""\n    for _, e := range entries {\n        out += e.Account + ": " + e.Amount.String() + "\\n"\n    }\n    return out\n}',
      expectedAnswer:
        "func formatLine(entries []Entry) string {\n    var b strings.Builder\n    for _, e := range entries {\n        b.WriteString(e.Account)\n        b.WriteString(\": \")\n        b.WriteString(e.Amount.String())\n        b.WriteByte('\\n')\n    }\n    return b.String()\n}",
      hints: [
        "`out += ...` in a loop allocates a brand-new backing string on every iteration because strings are immutable — that is O(n^2) allocations.",
        "strings.Builder appends into one growing buffer and allocates once at the end; verify with a benchmark showing allocs/op drop.",
      ],
    },
    {
      id: "go7pp-design-what-to-profile",
      type: "design",
      prompt:
        "Users report the API feels slow under load, but you have no idea whether it is CPU, allocations, or waiting on the database. Design how you would find out: what you would capture, how (benchmark vs live server), and in what order you would read the profiles.",
      expectedAnswer:
        "First reproduce the hot path in a benchmark if you can — it is repeatable and isolates one path. If the slowness only shows under real load, import `net/http/pprof` in the server and pull a live CPU profile from `/debug/pprof/profile` while it is under load. Read the CPU profile first with `top` to see where self-time goes; if `runtime.mallocgc` or GC is high, pull a heap profile (`/debug/pprof/heap`, or `-memprofile` from the bench) and read it with `-alloc_space` to find what allocates most. Optimize the single biggest hotspot, then re-benchmark to confirm — don't guess, and don't optimize anything that isn't near the top of `top`.",
      hints: [
        "Decide benchmark vs live server by whether you can reproduce the load deterministically.",
        "CPU profile first to see where time goes; heap profile next only if allocation/GC shows up as a hotspot.",
      ],
    },
    {
      id: "go7pp-race-ci",
      type: "implementation",
      prompt:
        "Your team keeps shipping intermittent data-race bugs. Explain what `-race` does and why running it once locally is not enough, then write the commands you would add to CI so races are caught automatically.",
      expectedAnswer:
        "`-race` compiles the program with instrumentation that watches every memory read and write at runtime; when it sees two goroutines access the same memory without synchronization and at least one is a write, it prints a report with both stacks. It only catches races that *actually execute* during the run, so a one-off local run that happens not to trigger the racy interleaving proves nothing. Run the whole test suite under `-race` in CI so every path the tests cover is checked on every push:\n\n  go test -race ./...\n\nOptionally also run the app under load with `-race` in a staging job. Accept that `-race` makes the program run several times slower and use more memory, so it belongs in CI/tests, not in the production build.",
      hints: [
        "The detector instruments memory accesses at runtime — it has no false positives but only sees interleavings that happen during the run.",
        "Because coverage is what matters, wire `go test -race ./...` into CI so every tested path is checked, not just whatever you ran once by hand.",
      ],
    },
    {
      id: "go7pp-advanced-alloc-vs-inuse",
      type: "advanced",
      prompt:
        "In `go tool pprof` on a memory profile, `-alloc_space` and `-inuse_space` give very different pictures of the same run: a function dominates `-alloc_space` but barely appears in `-inuse_space`. Explain what each mode measures and what that difference tells you.",
      expectedAnswer:
        "`-alloc_space` is the total bytes allocated over the whole run, including memory that was later freed; `-inuse_space` is the bytes still live at the moment the profile was taken. A function huge in alloc_space but tiny in inuse_space allocates a lot of short-lived garbage that the GC quickly reclaims — it is a churn/GC-pressure problem (fix it to cut CPU spent in GC and mallocgc), not a memory-leak problem. If instead something dominated inuse_space and kept growing, that would point at retained memory or a leak.",
      hints: [
        "One counts everything ever allocated; the other counts only what is still live right now.",
        "High alloc_space + low inuse_space = lots of short-lived garbage = GC pressure, not a leak.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-sampled",
      kind: "explain",
      description:
        "Explain, without notes, that CPU and heap profiles are sampled/statistical, what `flat` vs `cum` and `-alloc_space` vs `-inuse_space` mean, and why you optimize the top of `top` first.",
      required: true,
    },
    {
      id: "implement-capture",
      kind: "implement",
      description:
        "Capture a CPU and memory profile from a benchmark and open them with `go tool pprof` to list the top functions.",
      required: true,
    },
    {
      id: "debug-hotspot",
      kind: "debug",
      description:
        "Given a profile, locate an allocation or CPU hotspot, fix it, and confirm the improvement with a re-run benchmark.",
      required: false,
    },
    {
      id: "design-profiling-plan",
      kind: "design",
      description:
        "Decide what to profile and how (benchmark vs live server, CPU vs heap) for an unknown performance problem, and defend the order.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "You've learned to write benchmarks, so you can now *measure* whether code is fast. But a benchmark only tells you the total time — it doesn't tell you *where* that time went. When BenchmarkPostBatch reports 5ms per operation and you want it to be 1ms, you're stuck with a question the benchmark can't answer: which lines are eating the time?\n\nThe instinct is to stare at the code, pick the part that *looks* slow, and rewrite it. That instinct is almost always wrong, and it wastes days. The professional move is to ask the program itself where its time and memory go, using a **profiler**. Go ships one — **pprof** — built into the toolchain. This lesson is the capstone that ties measurement (benchmarks) to a disciplined optimization loop, plus the **race detector**, the tool that catches the concurrency bugs Module 6 warned you about.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "A benchmark is the bathroom scale: it tells you the total weight but not where it sits. A profile is the body scan: it shows exactly which parts carry the load. You don't diet by guessing which meal was the problem — you measure first, then change the biggest thing.",
          },
        },
        {
          type: "points",
          items: [
            "A **benchmark** tells you *how much* time; a **profile** tells you *where* it goes.",
            "**pprof** is Go's built-in profiler — no extra install, part of the toolchain.",
            "The **race detector** (`-race`) is the sibling tool that finds data races at runtime.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Hold two distinct pictures in your head, because pprof captures two different resources and confusing them sends you optimizing the wrong thing.\n\nA **CPU profile** answers *where is time spent? * — it samples the running stack and shows which functions burn the most CPU. A **memory (heap) profile** answers *where do allocations come from? * — it records where your program asks for memory.\n\nThese are different questions: a function can be a CPU hotspot without allocating, or an allocation hotspot without using much CPU directly (though heavy allocation usually *shows up* in the CPU profile as time spent in `runtime.mallocgc` and garbage collection). The model: **CPU profile for time, heap profile for memory — and heavy allocation quietly costs CPU too, which is why fixing an allocation hotspot often speeds the whole thing up. **",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Two profiles, two questions",
            kind: "compare",
            nodes: [
              {
                id: "cpu",
                label: "CPU profile",
                detail:
                  "Sampled ~100x/sec. Answers 'where is time spent?'. Read with `top` sorted by flat (self) time. Captured with -cpuprofile.",
                tone: "accent",
              },
              {
                id: "heap",
                label: "Heap / memory profile",
                detail:
                  "Sampled allocations. Answers 'where does memory come from?'. -alloc_space = total allocated; -inuse_space = still live. Captured with -memprofile.",
                tone: "success",
              },
            ],
            caption:
              "Different questions, different profiles — but allocation churn also shows up as CPU time in mallocgc and GC.",
          },
        },
        {
          type: "note",
          note: {
            tone: "info",
            title: "alloc_space vs inuse_space",
            text: "A heap profile has two lenses. `-alloc_space` = total bytes allocated over the whole run, including freed memory (find allocation churn / GC pressure). `-inuse_space` = bytes still live right now (find leaks and retained memory). Same data, two questions.",
          },
        },
      ],
    },
    mechanics: {
      body: 'Now the concrete commands. There are two ways to capture a profile.\n\n**From a benchmark** — the repeatable way. Add flags to `go test`: `-cpuprofile=cpu.out` and `-memprofile=mem.out` write the profiles, and `-bench` selects which benchmark to drive. This is ideal because a benchmark isolates one path and runs it many times.\n\n**From a running server** — the live way. Add a blank import `import _ "net/http/pprof"` and the package registers profiling handlers under `/debug/pprof/` on your HTTP server. Then hit `/debug/pprof/profile` (a 30-second CPU profile) or `/debug/pprof/heap` while the server is under real load. Use this when the slowness only appears in production-like conditions.\n\nEither way you get a profile *file*, which you open with `go tool pprof <file>`. That drops you into an interactive prompt.',
      blocks: [
        {
          type: "example",
          example: {
            title: "Capture from a benchmark",
            language: "bash",
            code: "# run one benchmark, write a CPU profile and a memory profile\ngo test -run=^$ -bench=BenchmarkPostBatch -benchmem \\\n  -cpuprofile=cpu.out -memprofile=mem.out .\n\n# -run=^$   disables normal tests (run only the benchmark)\n# -benchmem also prints allocs/op on the bench line\n# -cpuprofile / -memprofile write the profile files",
            takeaway:
              "One `go test` command produces both profile files. This is the repeatable capture you'll use most while optimizing.",
          },
        },
        {
          type: "example",
          example: {
            title: "Capture from a live server",
            language: "go",
            code: 'import (\n    "net/http"\n    _ "net/http/pprof" // blank import registers /debug/pprof/ handlers\n)\n\nfunc main() {\n    // your real server; pprof handlers are now on the default mux\n    go http.ListenAndServe("localhost:6060", nil)\n    runServer()\n}\n\n// then, while it is under load:\n//   go tool pprof http://localhost:6060/debug/pprof/profile   (30s CPU profile)\n//   go tool pprof http://localhost:6060/debug/pprof/heap      (heap profile)',
            takeaway:
              "A single blank import exposes profiling over HTTP. Use it to profile a real, loaded server when a benchmark can't reproduce the problem. Never expose /debug/pprof/ on a public port.",
          },
        },
        {
          type: "points",
          items: [
            "Benchmark capture: `-cpuprofile` / `-memprofile` flags on `go test` — repeatable, isolates one path.",
            'Live capture: `import _ "net/http/pprof"` exposes `/debug/pprof/` — for real load you can\'t reproduce.',
            "Both produce a file (or URL) you open with `go tool pprof`.",
          ],
        },
      ],
    },
    diagram: {
      body: "Once the profile is open, three commands do almost everything. Follow them in order the way you would in a real session: `top` shows the ranked list; `list` zooms into one function's annotated source; `web` (or `svg`) draws the flame graph — a picture where the width of each box is how much time it took, so the widest boxes are the hotspots at a glance.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Reading a profile with `go tool pprof`",
            kind: "sequence",
            nodes: [
              {
                id: "open",
                label: "go tool pprof cpu.out",
                detail: "opens the interactive (pprof) prompt",
              },
              {
                id: "top",
                label: "(pprof) top",
                detail: "ranked list; sort by flat (self time) to find the hotspot",
                tone: "accent",
              },
              {
                id: "list",
                label: "(pprof) list formatLine",
                detail: "annotated source, time attributed line by line",
                tone: "success",
              },
              {
                id: "web",
                label: "(pprof) web",
                detail: "flame graph in the browser (needs graphviz); box width = time",
              },
              {
                id: "act",
                label: "fix the top hotspot",
                detail: "change the one function with the most self-time",
              },
            ],
            caption:
              "top to find it, list to see the exact lines, web for the visual — then change the biggest thing.",
          },
        },
        {
          type: "note",
          note: {
            tone: "tip",
            title: "flat vs cum",
            text: "In `top`, `flat` is time in the function's own code; `cum` (cumulative) is that plus everything it calls. Sort by `flat` to find where the CPU actually is — a function like main or a request handler has huge `cum` (all its callees) but tiny `flat`, and it's not the hotspot.",
          },
        },
      ],
    },
    implementation: {
      body: "Now put it together as the loop this whole module builds toward: **benchmark to measure, profile to locate, fix the hotspot, re-benchmark to confirm.** The confirm step is not optional — it's what separates an engineer from someone who *hopes* their change helped.\n\nHere's the loop applied to the ledger's posting path. The heap profile pointed at `formatLine`, whose `out += ...` in a loop allocates a fresh string every iteration. The fix is `strings.Builder`, which appends into one growing buffer. Then you re-run the benchmark and read the numbers.",
      blocks: [
        {
          type: "example",
          example: {
            title: "The fix: string concat in a loop -> strings.Builder",
            language: "go",
            code: '// BEFORE: heap profile shows this line dominates allocations.\n// Each += builds a brand-new string (strings are immutable) -> O(n^2) allocs.\nfunc formatLine(entries []Entry) string {\n    out := ""\n    for _, e := range entries {\n        out += e.Account + ": " + e.Amount.String() + "\\n"\n    }\n    return out\n}\n\n// AFTER: one growing buffer, one allocation at the end.\nfunc formatLine(entries []Entry) string {\n    var b strings.Builder\n    for _, e := range entries {\n        b.WriteString(e.Account)\n        b.WriteString(": ")\n        b.WriteString(e.Amount.String())\n        b.WriteByte(\'\\n\')\n    }\n    return b.String()\n}',
            takeaway:
              "The profile named the function; the fix is a standard pattern. strings.Builder turns O(n^2) allocations into roughly one.",
          },
        },
        {
          type: "example",
          example: {
            title: "Confirm with a re-run benchmark",
            language: "bash",
            code: "# before\nBenchmarkPostBatch-8   3000   485210 ns/op   204800 B/op   1024 allocs/op\n\n# after switching to strings.Builder\nBenchmarkPostBatch-8   9000   132540 ns/op    16384 B/op      3 allocs/op\n\n# allocs/op dropped from 1024 to 3, B/op and ns/op fell too -> the fix is real",
            takeaway:
              "The re-run benchmark proves it: allocs/op collapsed and time per op fell. Without this step you'd only be guessing the change helped.",
          },
        },
        {
          type: "points",
          items: [
            "Benchmark -> profile -> fix the top hotspot -> **re-benchmark to confirm**.",
            "`-benchmem` shows `allocs/op` and `B/op`, the numbers an allocation fix should move.",
            "Change one thing at a time so the re-run cleanly attributes the improvement.",
          ],
        },
      ],
    },
    experiment: {
      body: "Predict before reading on — a wrong guess you correct sticks better than a right answer you skimmed. You profile a function and `top` shows 45% of self-time inside `runtime.mallocgc` and `runtime.gcBgMarkWorker`, with your own functions spread thin below. Your teammate says \"the CPU profile is useless, none of *our* code is the hotspot — there's nothing to optimize.\" Are they right? Commit to an answer.\n\nThey're wrong, and this is the insight that makes the two profiles click together. Time in `mallocgc` and the GC workers is the CPU *cost of allocating*. The CPU profile is telling you the program's bottleneck is allocation pressure — it just can't tell you *which* of your functions is doing the allocating.\n\nSo you switch tools: open the heap profile with `-alloc_space`, find the function allocating the most, and fix it (often the same `strings.Builder` move). When you re-profile, the `mallocgc`/GC time shrinks because there's less to allocate and collect. One profile diagnosed the *kind* of problem; the other located it. That hand-off — CPU says 'allocation', heap says 'here' — is the core skill of this lesson.",
    },
    "failure-cases": {
      body: "The failures here cluster around two mistakes: acting on a profile you misread, and trusting concurrency code you never checked with `-race`. Here are the ones you'll actually meet.",
      blocks: [
        {
          type: "points",
          items: [
            "**Optimizing by `cum` instead of `flat`** -> you 'fix' main or a handler that just calls everything else, and nothing improves. Sort by flat for self-time.",
            "**Chasing a 0.2% entry** -> it's sampling noise, and even a perfect fix caps your gain near 0.2% (Amdahl). Attack the top of the list.",
            "**Profiling a debug/unoptimized build or an idle server** -> the profile doesn't reflect the real hot path. Profile representative load.",
            "**Forgetting to re-benchmark** -> you assume the change helped; sometimes it made things worse. Always confirm.",
            "**Never running `-race`** -> a data race passes every normal test and corrupts data intermittently in production. Run tests under `-race` in CI.",
            "**Trusting one green `-race` run** -> `-race` only catches races that actually execute; the racy interleaving may not have happened that run. Coverage over the tests is what matters.",
          ],
        },
        {
          type: "example",
          example: {
            title: "A data race the detector catches — and its limit",
            language: "go",
            code: "// Two goroutines write the same counter with no synchronization.\nfunc raceyCount() int {\n    n := 0\n    var wg sync.WaitGroup\n    for i := 0; i < 2; i++ {\n        wg.Add(1)\n        go func() { defer wg.Done(); n++ }() // read-modify-write on shared n\n    }\n    wg.Wait()\n    return n\n}\n\n// go test -race ./...  ->  WARNING: DATA RACE, with both goroutines' stacks.\n// But -race only reports it if this code RUNS during the test. A path\n// your tests never exercise is a race the detector never sees.",
            takeaway:
              "`-race` has no false positives — a report is a real race — but it only finds races that execute. Run your whole suite under it so more paths are covered.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "Profiling and the race detector are powerful, and each has a cost and a scope. None should scare you off — they mark where to think.",
      blocks: [
        {
          type: "points",
          items: [
            "**CPU profile**: cheap enough to run on real workloads (sampled), but the numbers are statistical — trust the top, not tiny entries.",
            "**Heap profile**: shows allocations, but is itself sampled (a default sample rate, ~one sample per 512KB allocated), so treat small allocation entries loosely too.",
            "**Live pprof endpoint**: invaluable for production-only problems, but `/debug/pprof/` must never be exposed publicly — it leaks internals and can be abused.",
            "**Race detector**: no false positives and finds real bugs, but runs the program several times slower and uses more memory, and only sees interleavings that execute — so it lives in tests/CI, not the production binary.",
          ],
        },
      ],
    },
    design: {
      body: "A few durable rules for using these tools well. Never optimize without a profile — measure first, always. When you have a profile, spend your effort on the single biggest hotspot, because Amdahl's law caps what fixing anything smaller can buy you. Reproduce the hot path in a benchmark when you can (repeatable, isolated); reach for the live server endpoint only when the problem won't show up any other way.\n\nAnd treat the race detector as a standing part of CI, not a thing you run once — its value is proportional to how many code paths execute under it.",
      blocks: [
        {
          type: "points",
          items: [
            "Profile before you optimize; re-benchmark after to confirm the change was real.",
            "Optimize the top of `top` first — small hotspots have small ceilings (Amdahl).",
            "Benchmark capture when reproducible; live `net/http/pprof` only for load you can't reproduce.",
            "Run `go test -race ./...` in CI so races are caught across every tested path.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Choosing the tool for an unknown slowdown",
            context:
              "The posting API is slow under load, and you don't know if it's CPU, allocations, or the database. You have a benchmark for PostBatch but the slowness might be broader.",
            insight:
              "Start with the benchmark's CPU profile — it's repeatable. If `top` is dominated by mallocgc/GC, pull the heap profile with -alloc_space to find the allocator. If your own code barely appears and time hides in blocking/DB calls, that's not a CPU problem — capture from the live server under load instead. Let each profile decide the next one.",
          },
        },
      ],
    },
    mastery: {
      body: "You've mastered this when you can explain why profiles are sampled (and what `flat` vs `cum` and `-alloc_space` vs `-inuse_space` mean), capture a CPU and memory profile from a benchmark and read them with `go tool pprof`, locate a hotspot and fix it and confirm the win with a re-run benchmark, and decide what to profile and how for an unknown problem — plus run `-race` where it counts. Attest a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "Two ideas carry this capstone. **Measure, then optimize the top of `top`** — a benchmark tells you how much time, a pprof profile tells you where it goes, and the disciplined loop is benchmark -> profile -> fix the biggest hotspot -> re-benchmark to confirm. Profiles are sampled, so trust the big entries and ignore the noise, and never optimize without one.\n\n**And check your concurrency with `-race`** — the detector instruments memory accesses to report real data races with stacks, at the cost of speed and memory, and it only catches races that actually execute — so run it across your whole test suite in CI.",
      blocks: [
        {
          type: "points",
          items: [
            "Capture profiles from a benchmark (`-cpuprofile`/`-memprofile`) or a live server (`net/http/pprof`).",
            "Read with `go tool pprof`: `top` (sort by flat), `list <func>`, `web` for the flame graph.",
            "CPU profile = where time goes; heap profile = where allocations come from; both are sampled.",
            "Loop: benchmark -> profile -> fix the top hotspot -> re-benchmark. Optimize the biggest thing first (Amdahl).",
            "`go test -race ./...` in CI: no false positives, but only finds races that execute.",
          ],
        },
      ],
    },
  },
};
