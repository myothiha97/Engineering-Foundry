import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 8 — escape analysis in depth. The deep follow-up to the stack/heap
 * lesson: same beginner-friendly voice (plain language, one analogy per hard
 * idea, concrete before abstract), but advanced depth. Correct and careful:
 * the cost is escaping (heap alloc + GC pressure), not pointer indirection;
 * stack allocation is never guaranteed by a keyword; always profile first,
 * confirm with -gcflags=-m, change, then re-measure allocs/op.
 */
export const goEscapeAnalysisDeep: Lesson = {
  id: "go-escape-analysis-deep",
  slug: "escape-analysis-deep",
  title: "Escape analysis in depth",
  description:
    "Read the compiler's escape-analysis output with `go build -gcflags=-m`, understand exactly why a value is forced onto the heap, and restructure hot code to keep values on the stack — measured, not guessed.",
  moduleId: "go-8",
  estimatedMinutes: 55,
  difficulty: "advanced",
  prerequisites: ["go-stack-heap-escape", "go-profiling-pprof"],
  learningObjectives: [
    "Run `go build -gcflags=-m` (and `-m -m`) and correctly interpret \"moved to heap\", \"escapes to heap\", and \"does not escape\"",
    "Explain the common reasons a value escapes — returning a pointer, storing it somewhere longer-lived, interface conversion, closures, and unknown-size allocations",
    "Reduce allocations on a hot path by restructuring code, then confirm the win with a benchmark's allocs/op rather than trusting intuition",
  ],
  concepts: ["escape-analysis", "gcflags", "inlining", "allocation"],
  ledgerFlowApplications: [
    "Run `-gcflags=-m` on LedgerFlow's transaction-posting path to see which values the compiler moves to the heap",
    "Find a posting-path value that escapes only because it is returned as a pointer, and restructure to return it by value so it stays on the stack",
    "Prove the change with a benchmark: watch allocs/op drop after removing the escape, not just the wall-clock time",
  ],
  references: [
    {
      title: "A Guide to the Go GC",
      url: "https://go.dev/doc/gc-guide",
      teaches:
        "How the garbage collector works and why fewer heap allocations mean less GC pressure and more predictable latency.",
      relevance:
        "Grounds why escaping matters: the cost you are avoiding is heap allocation plus the GC work it creates.",
      required: true,
      section: "Understanding costs",
    },
    {
      title: "cmd/compile — Go compiler flags",
      url: "https://pkg.go.dev/cmd/compile",
      teaches:
        "The `-m` (and `-m -m`) diagnostic flags that print escape-analysis and inlining decisions, and `//go:noinline`.",
      relevance:
        "The authoritative reference for the exact flags this lesson uses to read escape decisions.",
      required: true,
      section: "Compiler directives",
    },
    {
      title: "Profiling Go Programs",
      url: "https://go.dev/blog/pprof",
      teaches:
        "How to profile CPU and memory so you optimize the code that actually matters instead of guessing.",
      relevance:
        "Reinforces the prerequisite discipline: profile first to find the hot path, then read `-m` on that function.",
      required: true,
      section: "Memory profiling",
    },
    {
      title: "Dave Cheney — High Performance Go Workshop (escape analysis)",
      url: "https://dave.cheney.net/high-performance-go-workshop/gophercon-2019.html",
      teaches:
        "A practitioner's walkthrough of reading escape-analysis output and reasoning about where allocations come from.",
      relevance:
        "A worked, hands-on companion to the mechanics section for anyone who wants a second explanation.",
      required: false,
      section: "Escape analysis",
    },
  ],
  exercises: [
    {
      id: "go8ea-predict-return-pointer",
      type: "prediction",
      prompt:
        "A function `func newUser(name string) *User { u := User{Name: name}; return &u }` creates a local `u` and returns its address. Predict whether `u` lives on the stack or the heap, and what `-gcflags=-m` will report.",
      expectedAnswer:
        "`u` escapes to the heap. Because the function returns `&u`, the value must outlive the call, so the compiler cannot free it when the frame returns. `-gcflags=-m` reports something like `moved to heap: u`.",
      hints: [
        "Where would `&u` point after `newUser` returns if `u` had stayed on the stack?",
        "The compiler moves a value to the heap when it can prove the value outlives its function frame.",
      ],
    },
    {
      id: "go8ea-read-m-output",
      type: "code-reading",
      prompt:
        "You run `go build -gcflags=-m ./...` and see these three lines:\n  ./post.go:12:6: can inline amount\n  ./post.go:20:9: leaking param: p to result ~r0 level=0\n  ./post.go:31:13: ...interface{} arg does not escape\nExplain in plain language what each line tells you.",
      expectedAnswer:
        "Line 1: the compiler can inline `amount` (paste its body into callers), which may remove a call and enable further escape wins. Line 2: parameter `p` \"leaks\" — it flows out of the function through the return value, so whatever `p` points to must be heap-safe for callers. Line 3: the variadic `...interface{}` arg to something like `fmt` did NOT escape here, so no allocation was forced for it in this call.",
      hints: [
        "\"can inline\" is an inlining decision, not an escape.",
        "\"leaking param ... to result\" means the parameter's pointee flows out via the return value.",
        "\"does not escape\" is the good outcome — the value stayed on the stack.",
      ],
    },
    {
      id: "go8ea-refactor-return-value",
      type: "refactoring",
      prompt:
        "The hot function below allocates on every call because it returns a pointer. Rewrite it so the result does not escape, without changing what callers get to read.",
      starterCode:
        'type Balance struct {\n    Cents int64\n    Currency string\n}\n\n// Called millions of times on the posting path.\nfunc computeBalance(entries []Entry) *Balance {\n    b := &Balance{Currency: "USD"}\n    for _, e := range entries {\n        b.Cents += e.Cents\n    }\n    return b\n}',
      expectedAnswer:
        'type Balance struct {\n    Cents int64\n    Currency string\n}\n\n// Return by value: the small struct is copied out, nothing escapes.\nfunc computeBalance(entries []Entry) Balance {\n    b := Balance{Currency: "USD"}\n    for _, e := range entries {\n        b.Cents += e.Cents\n    }\n    return b\n}',
      hints: [
        "Returning `*Balance` forces `b` to the heap because the pointer outlives the frame.",
        "`Balance` is small; returning it by value copies a few bytes and keeps it on the stack. Confirm with `-gcflags=-m` and a benchmark.",
      ],
    },
    {
      id: "go8ea-debug-interface-box",
      type: "debugging",
      prompt:
        "A logging helper `func logAmount(v int64) { log.Printf(\"amount=%d\", v) }` shows up as a top allocator in the memory profile, even though it looks like it allocates nothing. Explain where the allocation comes from and one way to reduce it.",
      expectedAnswer:
        "`log.Printf` takes `...interface{}`. Passing `v` (an int64) as an `interface{}` boxes it — the value is converted to an interface, which usually escapes to the heap. That per-call boxing is the allocation. Reduce it by logging less on the hot path, by sampling/guarding the log, or by using a lower-allocation logging approach; the point is the interface conversion, not the format string.",
      hints: [
        "What type does the argument become when it is passed to a `...interface{}` parameter?",
        "Assigning a concrete value to an interface often forces it to the heap.",
      ],
    },
    {
      id: "go8ea-refactor-preallocate",
      type: "refactoring",
      prompt:
        "`func amounts(entries []Entry) []int64 { var out []int64; for _, e := range entries { out = append(out, e.Cents) } return out }` reallocates its backing array several times as it grows. Rewrite it to allocate once, and say why the final result still escapes.",
      starterCode:
        'func amounts(entries []Entry) []int64 {\n    var out []int64\n    for _, e := range entries {\n        out = append(out, e.Cents)\n    }\n    return out\n}',
      expectedAnswer:
        'func amounts(entries []Entry) []int64 {\n    out := make([]int64, 0, len(entries)) // one allocation, sized up front\n    for _, e := range entries {\n        out = append(out, e.Cents)\n    }\n    return out\n}\n// The returned slice still escapes (it outlives the call), but we now pay for\n// ONE heap allocation of a known size instead of several regrowths.',
      hints: [
        "`append` on a nil slice grows the backing array in steps, each a fresh allocation.",
        "`make([]int64, 0, len(entries))` reserves capacity once; the returned slice must still live past the call, so it stays on the heap — just allocated a single time.",
      ],
    },
    {
      id: "go8ea-design-reduce-allocs",
      type: "design",
      prompt:
        "Your team wants to cut allocations on the posting path. Describe the disciplined order of steps you would follow, and name two concrete restructurings you would consider only after the measurement points to a specific function.",
      expectedAnswer:
        "First profile (pprof) to find the hot, allocation-heavy function — never optimize blind. Write a benchmark and record allocs/op as the baseline. Read `-gcflags=-m` on that function to see WHY it allocates. Then apply a targeted change: e.g. return a small struct by value instead of a pointer, or preallocate a slice with `make(..., 0, n)`; for a proven per-request buffer, reuse it via `sync.Pool`. Finally re-run the benchmark and confirm allocs/op dropped. Change one thing at a time.",
      hints: [
        "The prerequisite discipline: profile first, then read `-m`, then change, then re-measure.",
        "Good targets: pointer-return that forces an escape, unsized `append` growth, and repeated per-request buffers.",
      ],
    },
    {
      id: "go8ea-advanced-inline-escape",
      type: "advanced",
      prompt:
        "A tiny helper that returns `&T{}` shows `moved to heap` when called normally, but after the compiler inlines it into its caller the value stays on the stack. Explain how inlining can turn an escape into a stack allocation, and what `//go:noinline` would do here.",
      expectedAnswer:
        "When the helper is a separate call, the compiler must assume the returned pointer escapes past the helper's frame, so it heap-allocates. Inlining pastes the helper's body into the caller, so the value's real lifetime is now visible within the caller's frame; if it doesn't actually outlive the caller, escape analysis can keep it on the stack. `//go:noinline` forbids inlining, forcing the separate-call view and (here) the heap allocation — useful for isolating behavior in benchmarks.",
      hints: [
        "Escape analysis reasons within the scope it can see; inlining widens that scope.",
        "`//go:noinline` blocks the inline, so you see the un-inlined escape decision.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-why-escape",
      kind: "explain",
      description:
        "Explain, without notes, what escape analysis is and name the common reasons a value is moved to the heap (returned pointer, stored in something longer-lived, interface conversion, closure capture, unknown size).",
      required: true,
    },
    {
      id: "predict-m-output",
      kind: "predict",
      description:
        "Given a short function, correctly predict whether a value escapes and what `-gcflags=-m` will report for it.",
      required: true,
    },
    {
      id: "implement-reduce-alloc",
      kind: "implement",
      description:
        "Restructure a function to remove an unnecessary escape (e.g. return by value, preallocate) and confirm the reduction with a benchmark's allocs/op.",
      required: true,
    },
    {
      id: "debug-hidden-alloc",
      kind: "debug",
      description:
        "Diagnose an unexpected heap allocation caused by interface boxing or a `fmt`/`log` call and describe how you would reduce it.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "You already know the two places a value can live: the **stack** (cheap scratch memory for a function call, freed automatically the instant the function returns) and the **heap** (longer-lived memory the garbage collector has to track and clean up). Heap allocations aren't free — each one is work to allocate, and each one gives the garbage collector more to scan later, which shows up as latency spikes on a busy server.\n\nSo the natural question for any hot path is: *which of my values ended up on the heap, and why?* The answer isn't obvious from the source — Go has no `new`-vs-stack keyword you control. The compiler decides, using a pass called **escape analysis**. This lesson is about reading that decision, understanding what drives it, and nudging your code so fewer values escape — measured every step, never guessed.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "Think of the stack as a whiteboard next to your desk: you scribble on it during a task and wipe it clean the moment you're done — instant, no bookkeeping. The heap is the shared filing cabinet: anything that has to outlive your current task goes there, but now someone (the GC) has to periodically walk the cabinet and throw out what's no longer needed. Escape analysis is the compiler deciding, per value, whiteboard or cabinet.",
          },
        },
        {
          type: "points",
          items: [
            "Stack memory is cheap and auto-freed; heap memory costs an allocation and adds GC work.",
            "You don't pick stack or heap directly — the compiler's **escape-analysis** pass decides per value.",
            "On a hot path, an avoidable heap allocation is an avoidable cost, so it's worth learning to read the decision.",
          ],
        },
      ],
    },
    naive: {
      body: "Two beliefs trip people up here. The first is: \"I'll just avoid pointers — pointers are slow.\" So they copy big structs around to dodge `*T`, convinced the indirection is the enemy. The second is the opposite reflex: \"I'll pass pointers everywhere to avoid copying,\" assuming that's always the cheaper move.\n\nBoth miss what actually costs money. The expense isn't the pointer or the indirection — it's whether the value **escapes to the heap**. A pointer to a value that stays on the stack is perfectly cheap. A large value that escapes is expensive whether or not you took its address. Optimizing \"pointers\" instead of \"escapes\" is optimizing the wrong thing.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "warning",
            title: "Myth-buster: \"pointers are slow\"",
            text: "Pointer indirection is nearly free on modern CPUs. The real cost people blame on pointers is the heap allocation and GC pressure that happens when a value *escapes* — and escaping is what taking an address can trigger, not the dereference itself. Fix the escape, not the pointer.",
          },
        },
        {
          type: "points",
          items: [
            "\"Avoid all pointers\" and \"use pointers everywhere\" are both cargo-cult rules.",
            "The cost that matters is the heap allocation caused by **escaping**, not indirection.",
            "You can't reason about this by staring at the source — you have to read the compiler's decision.",
          ],
        },
      ],
    },
    failure: {
      body: "Because the escape decision is invisible in the source, the failure mode is quiet: your code is correct and even looks efficient, yet a memory profile shows a helper you'd never suspect at the top of the allocation list. You guess at a fix, change something, and the number doesn't move — or gets worse — because you changed a value that was never escaping in the first place.\n\nThe underlying trap is optimizing by intuition. Go's compiler is doing real analysis you can't fully predict by eye (it's deliberately *conservative* — when it can't prove a value is safe on the stack, it plays safe and heap-allocates). Guessing wastes effort and sometimes pessimizes the code. The discipline that fixes this is the same one from the profiling lesson: measure first, then read the compiler, then change one thing, then measure again.",
      blocks: [
        {
          type: "scenario",
          scenario: {
            title: "The optimization that changed nothing",
            context:
              "A developer sees the posting path is slow, assumes a big struct being copied is the culprit, and rewrites a dozen functions to pass `*Posting` instead of `Posting`. The benchmark's allocs/op goes UP, and latency is unchanged.",
            insight:
              "The struct was living happily on the stack — copying it was cheap. Switching to pointers made several of those values escape to the heap, adding allocations. Nobody had run `-gcflags=-m` or a benchmark first, so the 'fix' targeted an imaginary problem and created a real one.",
          },
        },
      ],
    },
    intuition: {
      body: "Here's the mental image. Escape analysis is the compiler asking one question about every value you create: **\"Can I prove this value stops being needed the moment its function returns?\"** If yes, it goes on the stack and vanishes for free when the frame pops. If the compiler *can't* prove that — because a reference to the value leaks out past the frame, or its lifetime is unclear — the value \"escapes\" and is allocated on the heap so it can safely outlive the call.\n\nSo a value escapes whenever something that outlives the function can still reach it after the function returns. Return its address? A caller now holds a reference that outlives the frame — escape. Store its pointer in a global, a heap object, or a channel? Same. Hide it inside an `interface{}` whose lifetime the compiler can't bound? Escape. The whole art is spotting these \"reference leaks out\" moments.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "The one question",
            text: "For any value, ask: does a reference to it survive past the function that made it? If yes, it must be on the heap. If the compiler can't be sure, it assumes yes (it's conservative). Stack allocation is what you *earn* by keeping the value's lifetime provably local.",
          },
        },
        {
          type: "points",
          items: [
            "A value escapes when a reference to it can outlive the function that created it.",
            "The compiler is conservative: unsure means heap, to stay correct.",
            "Stack allocation is never guaranteed by a keyword — it's a property the compiler proves.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Keep two facts fixed. First: **you never command stack or heap directly.** There is no keyword. `new(T)` does *not* mean heap, and a plain `T{}` literal does *not* mean stack — either can end up either place depending on whether it escapes. The compiler is the sole decider. Second: **escape is about lifetime, not about pointers per se.** Taking an address (`&x`) is only a problem when that address then leaves the frame.\n\nSo the model is: *values are stack-allocated by default, and get promoted to the heap exactly when the compiler can see (or can't rule out) that they outlive their frame.* Your job as an optimizer is to shorten and clarify lifetimes so the compiler can safely keep more values on the stack — and to read `-gcflags=-m` to check whether it did.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Stack (cheap, scoped) vs heap (tracked, long-lived)",
            kind: "compare",
            nodes: [
              {
                id: "stack",
                label: "Stack allocation",
                detail:
                  "For values whose lifetime the compiler proves is local. Freed automatically when the frame returns. No GC involvement. This is the outcome you want on hot paths.",
                tone: "success",
              },
              {
                id: "heap",
                label: "Heap allocation (escape)",
                detail:
                  "For values that outlive their frame, or whose lifetime the compiler can't bound. Costs an allocation now and GC scanning later.",
                tone: "danger",
              },
            ],
            caption:
              "No keyword picks the side — escape analysis does, based on whether a reference outlives the frame.",
          },
        },
        {
          type: "note",
          note: {
            tone: "info",
            title: "`new(T)` is not \"heap\"",
            text: "`new(T)` just returns `*T` to a zeroed T; if that pointer never escapes, the T sits on the stack. Conversely a bare `T{}` literal escapes if you return its address. The syntax you used is not the deciding factor — the lifetime is.",
          },
        },
      ],
    },
    mechanics: {
      body: "Now the precise tooling. You read the compiler's decision with `go build -gcflags=-m` (add a second `-m`, i.e. `-gcflags='-m -m'`, for a more verbose explanation of *why*). It prints one line per interesting decision. The vocabulary you need to recognize:\n\n- **`moved to heap: x`** — a named local `x` was promoted to the heap (classic: you returned `&x`).\n- **`&x escapes to heap`** / **`... escapes to heap`** — this expression's value must live on the heap.\n- **`x does not escape`** — the good outcome; it stayed on the stack.\n- **`leaking param: p to result ~r0`** — parameter `p` flows out through the return, so its pointee must be heap-safe for callers.\n\nThe same flag also prints **inlining** decisions like `can inline f` and `inlining call to f`. Inlining matters because pasting a small function's body into its caller widens the scope escape analysis can see, which sometimes turns an escape into a stack allocation. You can forbid it with the `//go:noinline` directive when you want to isolate behavior.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Reading `-gcflags=-m` on a returned-pointer function",
            language: "bash",
            code:
              "$ go build -gcflags=-m ./ledger/\n# ledger\n./post.go:8:6: can inline newPosting\n./post.go:9:2: moved to heap: p\n./post.go:14:22: leaking param: entries to result ~r0 level=0\n\n# newPosting returns &p, so p is 'moved to heap'.\n# 'leaking param: entries' means the entries slice flows out via the return.\n# 'can inline newPosting' is an inlining decision, not an escape.",
            takeaway:
              "Each line names a file:line and a decision. \"moved to heap\" and \"escapes to heap\" are the ones costing you allocations; \"does not escape\" is the win.",
          },
        },
        {
          type: "example",
          example: {
            title: "The two classic escapes in source",
            language: "go",
            code:
              'type Posting struct{ Cents int64 }\n\n// (1) Returning a pointer to a local: p escapes.\nfunc newPosting(c int64) *Posting {\n    p := Posting{Cents: c} // -m: "moved to heap: p"\n    return &p              // the address outlives this frame\n}\n\n// (2) Interface conversion: the boxed int escapes.\nfunc describe(n int64) {\n    var any interface{} = n // -m: "n escapes to heap"\n    _ = any\n}',
            takeaway:
              "Both escape for the same reason: a reference to the value can be reached after the frame returns — directly via the returned pointer, or indirectly via the interface box.",
          },
        },
        {
          type: "points",
          items: [
            "`go build -gcflags=-m` prints escape + inlining decisions; `-m -m` explains them in more detail.",
            "Learn the phrases: `moved to heap`, `escapes to heap`, `does not escape`, `leaking param ... to result`.",
            "Inlining widens the scope escape analysis sees; `//go:noinline` turns it off for a function.",
          ],
        },
      ],
    },
    diagram: {
      body: "It helps to see the decision as a short checklist the compiler walks for each value. Follow it top to bottom: the first condition that forces the value to outlive its frame sends it to the heap; if none do, it stays on the stack.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "How the compiler decides: stack or heap",
            kind: "flow",
            nodes: [
              {
                id: "make",
                label: "A value is created",
                detail: "any local: struct literal, new(T), make(...), &x",
              },
              {
                id: "ref",
                label: "Does a reference leave the frame?",
                detail: "returned pointer, stored in a global/heap object/channel, captured by an escaping closure",
                tone: "accent",
              },
              {
                id: "iface",
                label: "Or boxed into an interface / unknown size?",
                detail: "assigned to interface{}, passed to fmt's ...interface{}, or make([]T, n) with non-constant n",
                tone: "accent",
              },
              {
                id: "heap",
                label: "Escapes → heap",
                detail: "allocated on the heap so it can safely outlive the call; GC now tracks it",
                tone: "danger",
              },
              {
                id: "stack",
                label: "Provably local → stack",
                detail: "freed for free when the frame returns; no GC involvement",
                tone: "success",
              },
            ],
            caption:
              "If any 'reference outlives the frame' condition fires (or the compiler can't rule it out), the value escapes; otherwise it stays on the stack.",
          },
        },
      ],
    },
    implementation: {
      body: "The optimization workflow is small and rigid, and it comes straight from the profiling lesson: **profile → benchmark → read `-m` → change one thing → re-measure.** You never skip the measurement steps, because escape analysis is too subtle to eyeball.\n\nThe most reliable meter is a benchmark's **allocs/op**. Write a `Benchmark` for the hot function and run it with `-benchmem`; the `allocs/op` column is your before-and-after truth. Then read `-gcflags=-m` on that function to see *why* it allocates, apply one targeted restructuring (return by value, preallocate, avoid boxing), and run the benchmark again to confirm the number dropped.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Measure allocs/op with a benchmark",
            language: "bash",
            code:
              "$ go test -bench=BalancePath -benchmem ./ledger/\nBefore:  BenchmarkBalancePath-8   500000   2410 ns/op   96 B/op   3 allocs/op\n# read the compiler's reasoning:\n$ go build -gcflags=-m ./ledger/ 2>&1 | grep balance\n./balance.go:12:9: moved to heap: b\n# ...restructure to return by value, then re-run:\nAfter:   BenchmarkBalancePath-8   900000   1180 ns/op    0 B/op   0 allocs/op",
            takeaway:
              "allocs/op is the honest scoreboard. 3 allocs/op → 0 allocs/op is the kind of confirmation that turns a guess into a real optimization.",
          },
        },
        {
          type: "example",
          example: {
            title: "Removing an escape: return by value, and preallocate",
            language: "go",
            code:
              'type Balance struct{ Cents int64; Currency string }\n\n// BEFORE: returns *Balance -> "moved to heap: b"\nfunc computeBalance(es []Entry) *Balance {\n    b := &Balance{Currency: "USD"}\n    for _, e := range es { b.Cents += e.Cents }\n    return b\n}\n\n// AFTER: return the small struct by value -> stays on the stack.\nfunc computeBalance(es []Entry) Balance {\n    b := Balance{Currency: "USD"}\n    for _, e := range es { b.Cents += e.Cents }\n    return b\n}\n\n// Preallocate when a slice must escape anyway: one alloc, not several.\nfunc amounts(es []Entry) []int64 {\n    out := make([]int64, 0, len(es)) // sized once\n    for _, e := range es { out = append(out, e.Cents) }\n    return out\n}',
            takeaway:
              "Return small values instead of pointers to keep them on the stack; when a result genuinely must escape (like a returned slice), preallocate its capacity so you pay for exactly one allocation.",
          },
        },
        {
          type: "points",
          items: [
            "Benchmark with `-benchmem`; `allocs/op` is your before/after meter.",
            "Common wins: return small structs by value; preallocate slices with `make(T, 0, n)`; avoid needless interface boxing.",
            "For a proven per-request buffer that must be reused, `sync.Pool` recycles allocations instead of making new ones.",
          ],
        },
      ],
    },
    experiment: {
      body: "Predict before you read on — a corrected wrong guess sticks better than a skimmed right one. Here are two nearly identical functions:\n\n```\nfunc a() int {\n    x := 42\n    return x        // returns the value\n}\n\nfunc b() *int {\n    x := 42\n    return &x       // returns the address\n}\n```\n\nFor each, does `x` land on the stack or the heap? Commit to an answer for both.\n\nNow the result. In `a`, `x` is copied out by value; nothing holds a reference to the local after the frame returns, so `x` stays on the **stack** and `-gcflags=-m` says nothing about it. In `b`, you return `&x`; the caller now holds a pointer that outlives `b`'s frame, so the compiler prints `moved to heap: x` and allocates it on the **heap**. Same tiny function, one character of difference (`&`), and one of them costs an allocation on every call. The lesson: escape is decided by whether a reference outlives the frame, and the only way to be sure is to read `-m` — don't trust the shape of the code.",
    },
    "failure-cases": {
      body: "The escapes you'll actually meet cluster around a handful of patterns. Learn to spot them in `-gcflags=-m`, and remember that spotting one doesn't mean you must fix it — only fix escapes on paths the profiler flagged as hot.",
      blocks: [
        {
          type: "points",
          items: [
            "**Returning a pointer to a local** → `moved to heap`. Return by value if the type is small.",
            "**Storing a pointer somewhere longer-lived** (global, field of a heap object, channel) → the pointee escapes.",
            "**Interface conversion / boxing** → assigning a concrete value to `interface{}` (including passing to `fmt`/`log`'s `...interface{}`) usually escapes it.",
            "**Closures capturing by reference** → a variable captured by a closure that outlives the function escapes so the closure can still see it.",
            "**Unknown-size allocations** → `make([]T, n)` with a non-constant `n` can't be sized on the stack, so it goes to the heap.",
          ],
        },
        {
          type: "example",
          example: {
            title: "The `fmt`/`log` allocation that hides in plain sight",
            language: "go",
            code:
              'func logAmount(v int64) {\n    // v is passed as interface{} to a ...interface{} parameter,\n    // so it is boxed -> "v escapes to heap" on every call.\n    log.Printf("amount=%d", v)\n}\n\n// -gcflags=-m shows something like:\n//   ./log.go:3:20: v escapes to heap\n//   ./log.go:3:12: ...interface{} arg does not escape (the slice itself)',
            takeaway:
              "A logging call that looks allocation-free can be a top allocator because arguments are boxed into interfaces. On a hot path, log less or guard the call — the culprit is the boxing, not the format string.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "Chasing zero allocations is not automatically good engineering. Each of these techniques buys something and costs something; none should be applied without a profile pointing at the function first.",
      blocks: [
        {
          type: "points",
          items: [
            "**Return by value vs pointer**: value avoids the escape but copies the struct — a win for small types, a loss for large ones. Measure at the size you actually have.",
            "**Preallocating slices**: one allocation instead of several, but you must know (or estimate) the size; over-reserving wastes memory.",
            "**`sync.Pool` reuse**: removes per-request allocations, but adds real complexity and correctness hazards (dirty reused buffers). Only for a proven, hot allocation.",
            "**Fighting inlining with `//go:noinline`**: useful to isolate behavior in a benchmark, but forcing decisions by hand is fragile — the compiler's defaults are usually right.",
            "**Readability**: allocation-avoiding code can get gnarly. Don't trade clarity for allocations the profiler never flagged.",
          ],
        },
      ],
    },
    design: {
      body: "A few durable rules. Profile before you optimize: `-gcflags=-m` tells you *where* values go, but pprof tells you *which functions matter* — read `-m` only on the ones the profile flagged. Prefer clear lifetimes over clever pointer tricks; a value the compiler can prove is local is a value it keeps on the stack for free. And treat allocs/op from a benchmark as the source of truth — if the number didn't move, the change didn't help, however clever it looked.",
      blocks: [
        {
          type: "points",
          items: [
            "Profile first (pprof), then read `-gcflags=-m` on the hot function only.",
            "Design for local lifetimes so the compiler can keep values on the stack; don't scatter pointers by reflex.",
            "Change one thing, then re-measure allocs/op — the benchmark, not intuition, decides if it worked.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "A disciplined allocation cut on the posting path",
            context:
              "Latency on the posting path is spiky. A memory profile shows `computeBalance` allocating on every call. The team is tempted to sprinkle `sync.Pool` everywhere.",
            insight:
              "They read `-gcflags=-m` on just `computeBalance`, see `moved to heap: b` because it returns `*Balance`, and change it to return `Balance` by value. The benchmark drops from 3 allocs/op to 0. No pool, no complexity — the smallest change the measurement justified, and nothing touched on paths the profile never flagged.",
          },
        },
      ],
    },
    ledgerflow: {
      body: "This is exactly how LedgerFlow tunes its transaction-posting path. The path is hot — it runs on every posted entry — so it's a legitimate target once pprof confirms it's allocating. The team runs `go build -gcflags=-m ./ledger/` and reads the output for that path, and finds a `computeBalance`-style helper reporting `moved to heap: b` purely because it returned a `*Balance`. Since `Balance` is small, they restructure it to return the value instead of a pointer, so it stays on the stack. Then they prove the win the only way that counts: a benchmark with `-benchmem` shows allocs/op on the posting path drop to zero for that function. Same behavior for callers, one fewer allocation per posted entry, and less GC pressure under load — a real latency improvement, measured rather than assumed.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "LedgerFlow: cutting an allocation on the posting path",
            kind: "sequence",
            nodes: [
              { id: "profile", label: "pprof flags the posting path", detail: "computeBalance is allocating hot" },
              { id: "bench", label: "Benchmark baseline", detail: "-benchmem shows 3 allocs/op", tone: "accent" },
              { id: "readm", label: "Read -gcflags=-m", detail: "\"moved to heap: b\" — b escapes because it's returned as *Balance", tone: "danger" },
              { id: "change", label: "Return Balance by value", detail: "small struct, lifetime now provably local" },
              { id: "confirm", label: "Re-benchmark", detail: "0 allocs/op on that function — confirmed", tone: "success" },
            ],
            caption: "Profile to pick the target, read -m for the reason, make one change, re-measure to prove it.",
          },
        },
      ],
    },
    exercises: {
      body: "Practice is what turns \"I read about escape analysis\" into \"I read `-gcflags=-m` without flinching.\" Work across predicting whether a value escapes, reading real `-m` output line by line, refactoring away an escape (return by value, preallocate), debugging a hidden interface-boxing allocation, and designing a disciplined measure-first workflow. Each produces a different kind of evidence — do them, don't just read them.",
    },
    mastery: {
      body: "You've mastered this when you can explain what escape analysis is and name the common causes of escape from memory, predict whether a value escapes and what `-gcflags=-m` will say about it, restructure a function to remove an unnecessary escape and prove the drop in allocs/op with a benchmark, and diagnose a hidden allocation from interface boxing. Attest a criterion only when you genuinely have that evidence — reading the lesson doesn't count; measuring a real before/after does.",
    },
    summary: {
      body: "Two ideas carry this lesson. **Escape analysis decides stack vs heap, and you read it with `-gcflags=-m`** — a value escapes to the heap whenever a reference to it can outlive the function that made it (returned pointer, stored somewhere longer-lived, boxed into an interface, captured by a closure, or unknown size), and the compiler is conservative when unsure. **Optimize by measurement, not intuition** — pointers aren't the cost, escaping is; so profile first, read `-m` on the hot function, make one change (return by value, preallocate, avoid boxing), and confirm with a benchmark's allocs/op.",
      blocks: [
        {
          type: "points",
          items: [
            "Escape analysis moves a value to the heap when a reference to it outlives its frame; stack allocation is earned, never keyword-forced.",
            "Read decisions with `go build -gcflags=-m` (`-m -m` for detail): `moved to heap`, `escapes to heap`, `does not escape`, `leaking param`.",
            "The cost is heap allocation + GC pressure, not pointer indirection — fix the escape, not the pointer.",
            "Profile → benchmark → read `-m` → change one thing → re-measure allocs/op. Never optimize blind.",
          ],
        },
      ],
    },
  },
};
