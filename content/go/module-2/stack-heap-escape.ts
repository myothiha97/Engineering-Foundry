import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 2 — where values live: the stack, the heap, and how Go's compiler
 * decides between them via escape analysis. Written in the Module 0/1 voice:
 * plain language, one analogy per hard idea, a concrete example before every
 * abstract rule. The throughline is "intuition, not premature tuning" — Go owns
 * this decision, so you write clear code first and only reach for escape
 * analysis and profiling when a measurement proves it matters.
 */
export const goStackHeapEscape: Lesson = {
  id: "go-stack-heap-escape",
  slug: "stack-heap-escape",
  title: "Stack, heap & escape analysis",
  description:
    "Understand where Go puts your values — the fast per-function stack or the shared, garbage-collected heap — and why deciding that is the compiler's job, not yours.",
  moduleId: "go-2",
  estimatedMinutes: 55,
  difficulty: "advanced",
  prerequisites: ["go-structs-pointers"],
  learningObjectives: [
    "Explain in plain words what the stack and the heap are and how each is reclaimed",
    "Predict whether a simple value stays on the stack or escapes to the heap, and say why",
    "Read `go build -gcflags=-m` output to confirm the compiler's escape decisions instead of guessing",
  ],
  concepts: ["stack", "heap", "escape-analysis", "garbage-collection"],
  references: [
    {
      title: "Go FAQ: Should I define methods on values or pointers? (stack or heap)",
      url: "https://go.dev/doc/faq#stack_or_heap",
      teaches:
        "The official answer to 'where do my values live?' — that the compiler chooses, that a returned local is safe, and that you should not plan your code around it.",
      relevance:
        "This is the canonical statement of the lesson's core message, straight from the Go team.",
      required: false,
      section: "Stack or heap allocation; taking the address of a local variable",
    },
    {
      title: "A Guide to the Go Garbage Collector",
      url: "https://go.dev/doc/gc-guide",
      teaches:
        "How Go's concurrent mark-sweep garbage collector works, what it costs, and how (rarely) to tune it with GOGC/GOMEMLIMIT.",
      relevance:
        "Backs the honest, brief GC overview and the 'you rarely tune it' point in this lesson.",
      required: false,
      section: "The GC cycle; Understanding costs; Optimization guide",
    },
    {
      title: "The Go Programming Language Specification: Allocation",
      url: "https://go.dev/ref/spec#Allocation",
      teaches:
        "What `new` does and the normative guarantee that a value's storage lives as long as it is reachable.",
      relevance:
        "Confirms that lifetime — not the keyword you used — is what makes returning a local pointer safe.",
      required: false,
      section: "Allocation; the built-in function new",
    },
  ],
  exercises: [
    {
      id: "go2es-predict-return-pointer",
      type: "prediction",
      prompt:
        "A function builds a local `struct` and returns `&local` (a pointer to it). Predict two things before running -gcflags=-m: (1) is this safe, and (2) does `local` live on the stack or the heap?",
      expectedAnswer:
        "It is safe. Because the returned pointer outlives the function, `local` escapes to the heap, and the garbage collector frees it once no one references it.",
      hints: [
        "In Go, unlike C, returning a pointer to a local is allowed.",
        "Ask: does anything still reference the value after the function returns?",
      ],
    },
    {
      id: "go2es-read-gcflags",
      type: "code-reading",
      prompt:
        "You run `go build -gcflags=-m` and see `./main.go:7:9: &u escapes to heap`. Explain in plain words what the compiler is telling you and why it decided that.",
      hints: [
        "`-m` prints escape-analysis decisions, one per line.",
        "'escapes to heap' means the value's lifetime reaches beyond the current function.",
      ],
    },
    {
      id: "go2es-implement-sum",
      type: "implementation",
      prompt:
        "Implement `sum` so it adds a slice of ints and returns the total. Keep it a plain value return (no pointers) so nothing needs to escape.",
      starterCode:
        'package main\n\nimport "fmt"\n\nfunc sum(nums []int) int {\n\t// add every element and return the total\n\treturn 0\n}\n\nfunc main() { fmt.Println(sum([]int{1, 2, 3})) } // want: 6',
      expectedAnswer:
        "func sum(nums []int) int {\n\ttotal := 0\n\tfor _, n := range nums {\n\t\ttotal += n\n\t}\n\treturn total\n}",
      hints: [
        "A local `total int` returned by value never escapes.",
        "Range over the slice and accumulate.",
      ],
    },
    {
      id: "go2es-debug-escape-belief",
      type: "debugging",
      prompt:
        "A teammate 'optimizes' a function by changing `return Account{Balance: b}` to build the struct, take its address, and `return &Account{...}` everywhere, claiming pointers are always faster. Explain what's wrong with that reasoning and how you'd check it.",
      hints: [
        "Returning a pointer forces the value onto the heap, which adds GC work.",
        "Reach for `-gcflags=-m` and a benchmark before believing 'faster'.",
      ],
    },
    {
      id: "go2es-refactor-hot-path",
      type: "refactoring",
      prompt:
        "A hot request path allocates a new pointer-to-struct on every call and a profile shows it dominates allocations. Refactor toward fewer heap allocations and state exactly which evidence justified the change.",
      hints: [
        "Could the value be returned or passed by value instead of by pointer?",
        "Keep the change only if the profile (not a guess) showed the allocation mattered.",
      ],
    },
    {
      id: "go2es-design-api-shape",
      type: "design",
      prompt:
        "Design the return type for a `LoadSettings` function: a small value (`Settings`) vs a pointer (`*Settings`). Choose one, justify it in terms of clarity first, and say what would make you switch.",
      hints: [
        "Small, always-present values are natural to return by value.",
        "Reach for a pointer when the value is large or genuinely optional (nil means 'none').",
      ],
    },
    {
      id: "go2es-advanced-prove-escape",
      type: "advanced",
      prompt:
        "Write two tiny functions — one whose local stays on the stack and one whose local escapes — then use `go build -gcflags=-m` to prove which is which, and explain the single line of code that made the difference.",
      hints: [
        "Returning `&local` versus using `local` only inside the function is the key difference.",
        "Read the `-m` output line-by-line; 'does not escape' and 'escapes to heap' are the phrases to find.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-stack-heap",
      kind: "explain",
      description:
        "Explain what the stack and heap are, how each is reclaimed, and why returning a pointer to a local is safe in Go.",
      required: true,
    },
    {
      id: "predict-escape",
      kind: "predict",
      description:
        "Predict whether a simple value stays on the stack or escapes to the heap, and give the lifetime reason.",
      required: true,
    },
    {
      id: "implement-gcflags-check",
      kind: "implement",
      description:
        "Use `go build -gcflags=-m` to confirm an escape decision rather than relying on intuition.",
      required: true,
    },
    {
      id: "design-allocation-choice",
      kind: "design",
      description:
        "Defend a value-vs-pointer API choice on clarity grounds and name the profiling evidence that would change it.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "Every value your program creates — a number, a struct, a slice — has to live *somewhere* in memory while it's in use, and that memory has to be handed back when the value is no longer needed. Go has two places it can put a value: the **stack** and the **heap**. This lesson is about which place Go picks, why, and — most importantly — why that decision belongs to the compiler and not to you.\n\nBeginners often hear 'stack is fast, heap is slow' and immediately try to control it, sprinkling pointers or avoiding them based on folklore. That's backwards. Go was designed so you write clear code and the compiler figures out placement. Understanding the mechanism is genuinely useful — it explains performance and lifetime — but the point of understanding it is to *stop worrying about it*, not to micromanage it.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "Think of a busy kitchen. The stack is your countertop: you grab space for the dish you're cooking right now, and the moment you plate it and move on, that space is instantly clear for the next dish. The heap is the walk-in fridge: shared, holds things that need to outlast the current dish, and someone has to come around later to throw out what nobody wants anymore.",
          },
        },
        {
          type: "points",
          items: [
            "The **stack** and the **heap** are two regions of memory where values can live.",
            "The compiler decides which one each value goes to — you don't annotate it.",
            "Knowing the rule is for *reasoning*, not for hand-tuning every function.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Hold three facts and the rest follows.\n\nFirst, **each goroutine has its own stack** — a private stack of frames, one per active function call. When a function is called, a frame is pushed; when it returns, the frame is popped and everything in it is gone instantly. That's why the stack is fast: reclaiming is just moving a pointer back.\n\nSecond, **the heap is shared** across the whole program, and values there are cleaned up by the **garbage collector (GC)** — a background helper that finds values nothing points to anymore and frees them. Third, **the compiler runs *escape analysis*** at build time to decide, per value, whether it can stay on the stack or must 'escape' to the heap.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "The one-sentence rule",
            text: "A value that can't outlive its function stays on the fast, auto-freed stack; a value that must outlive it escapes to the heap, where the garbage collector reclaims it — and the compiler makes that call for you.",
          },
        },
        {
          type: "note",
          note: {
            tone: "info",
            title: "Jargon, defined",
            text: "Escape analysis: the compile-time step that decides whether a value can stay on the stack or must move ('escape') to the heap. Garbage collector (GC): the runtime helper that automatically frees heap values once nothing references them.",
          },
        },
      ],
    },
    mechanics: {
      body: "Now the precise picture. A **stack frame** is the block of memory for one function call: its parameters, its local variables, and where to return to. Calls nest, so frames stack up; each return pops the top frame and reclaims its space in one cheap step. No value on the stack ever needs the garbage collector.\n\nEscape analysis asks, for each value the function creates: *can I prove this value is unreachable once the function returns? * If yes, it stays in the frame (stack). If it can't prove that — most commonly because the address of the value is returned or stored somewhere longer-lived — the value **escapes** and is allocated on the heap instead.\n\nThe garbage collector then owns its lifetime: it periodically finds heap values that nothing references and frees them. Go's GC is a **concurrent mark-sweep** collector — it does most of its work alongside your running program, with only brief pauses — and it needs almost no tuning in normal apps.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "How the compiler decides",
            kind: "flow",
            nodes: [
              { id: "val", label: "new value", detail: "created inside a function" },
              {
                id: "ask",
                label: "reachable after return?",
                detail: "escape analysis, at compile time",
                tone: "accent",
              },
              {
                id: "stack",
                label: "stack",
                detail: "no → stays in the frame, freed on return",
                tone: "success",
              },
              {
                id: "heap",
                label: "heap",
                detail: "yes → escapes, GC frees it later",
                tone: "danger",
              },
            ],
            caption:
              "Escape analysis is proof-based: unless it can prove the value dies with the function, the value goes to the heap to be safe.",
          },
        },
        {
          type: "points",
          items: [
            "A **stack frame** holds one call's parameters and locals; returning pops it instantly.",
            "A value **escapes** when the compiler can't prove it's dead by the time the function returns.",
            "The **garbage collector** is concurrent mark-sweep — mostly background work, rare tuning.",
          ],
        },
      ],
    },
    diagram: {
      body: "Picture two function calls stacked on top of each other, plus the shared heap beside them. `main` calls `newUser`; while `newUser` runs, its frame sits on top of `main`'s. The `User` value `newUser` builds has its address returned, so it can't live in the frame that's about to disappear — it escapes to the heap, and `main` holds a pointer to it. Select a layer below to see who owns it and when it's freed.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Two stack frames and the shared heap",
            kind: "stack",
            nodes: [
              {
                id: "frame-newuser",
                label: "newUser frame (top)",
                detail: "local u — but its address escaped",
                tone: "muted",
              },
              { id: "frame-main", label: "main frame", detail: "holds *User returned by newUser" },
              {
                id: "heap-user",
                label: "heap: User{...}",
                detail: "the escaped value; freed by GC when unreferenced",
                tone: "danger",
              },
            ],
            caption:
              "When newUser returns, its frame is popped — but the User itself lives safely on the heap because main still points to it.",
          },
        },
      ],
    },
    implementation: {
      body: "You don't *write* escape decisions — you *inspect* them. The tool is the compiler's `-m` flag: `go build -gcflags=-m` prints one line per escape decision, in plain-ish English. This is how you replace guessing with knowing. Below, one local escapes because its address is returned, and one stays on the stack because it's used only locally; the `-m` output tells you exactly which is which.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Reading escape decisions with -gcflags=-m",
            language: "go",
            code: 'package main\n\nimport "fmt"\n\ntype User struct{ Name string }\n\nfunc makeEscapes(name string) *User {\n\tu := User{Name: name}\n\treturn &u // address returned → must outlive the call\n}\n\nfunc staysOnStack(name string) int {\n\tu := User{Name: name}\n\treturn len(u.Name) // u never leaves the function\n}\n\nfunc main() {\n\tfmt.Println(makeEscapes("Ada").Name, staysOnStack("Ada"))\n}\n\n// $ go build -gcflags=-m ./main.go\n// ./main.go:8:2: moved to heap: u        <- makeEscapes\n// ./main.go:14:2: u does not escape      <- staysOnStack',
            takeaway:
              "One line of code — returning `&u` — is the entire difference. The `-m` output confirms it so you never have to guess.",
          },
        },
        {
          type: "points",
          items: [
            "`go build -gcflags=-m` prints escape-analysis decisions; add a second `-m` (`-m -m`) for more detail.",
            "'moved to heap' / 'escapes to heap' = it escaped; 'does not escape' = it stayed on the stack.",
            "Read it to *learn and confirm*, not to chase every allocation.",
          ],
        },
      ],
    },
    experiment: {
      body: "Before reading on, make a prediction — a corrected wrong guess sticks better than a right answer you skimmed. Consider two functions that build the same local `User`:\n\n(A) `func a() *User { u := User{}; return &u }` — returns the address.\n(B) `func b() User { u := User{}; return u }` — returns a copy of the value.\n\nWhich local escapes to the heap, A's or B's? Decide now, then reveal.\n\nThe answer: **A's `u` escapes; B's does not.** In A, a pointer to `u` leaves the function, so `u` must survive past the return — heap. In B, only a *copy* of `u` leaves; the original local dies with the frame, so it stays on the stack. Same struct, same local name — the deciding factor is whether an *address* to it escapes the function. That single distinction, not the size of the struct or how 'important' it feels, is what escape analysis reasons about.",
    },
    "failure-cases": {
      body: "The mistakes here are rarely crashes — they're bad mental models and premature tuning. Here are the ones you'll actually meet and the signal each gives.",
      blocks: [
        {
          type: "points",
          items: [
            "**Fearing returned local pointers** (C habit) → you write convoluted code to avoid something that was always safe. Returning `&local` is fine in Go.",
            "**'Pointers are always faster'** → you return `*T` everywhere, forcing heap allocations and more GC work. Measure before believing it.",
            "**Guessing placement from reading code** → escape rules have surprising cases; run `-gcflags=-m` instead of assuming.",
            "**Tuning the GC without evidence** → twisting `GOGC` or `GOMEMLIMIT` before a profile shows GC is the problem usually just hurts.",
            "**Treating an escape as a bug** → many escapes are correct and necessary; an escape is information, not an error to eliminate.",
          ],
        },
        {
          type: "example",
          example: {
            title: "An escape is not a failure",
            language: "go",
            code: "// This SHOULD escape — the caller needs the value afterward.\nfunc loadConfig() *Config {\n\tc := Config{Env: \"prod\"}\n\treturn &c // correct: c genuinely outlives loadConfig\n}\n\n// 'Fixing' this escape would mean not returning the value at all,\n// which defeats the function's purpose.",
            takeaway:
              "Escaping is the compiler doing its job. Only care about it when a profile says allocations in this path actually cost you.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "The stack and heap each have real costs, and 'good code' means choosing for clarity first and letting the compiler handle placement. The honest trade-offs:",
      blocks: [
        {
          type: "points",
          items: [
            "**Stack**: allocation and freeing are nearly free (pointer bumps), but a value can't outlive its function. Great for short-lived locals.",
            "**Heap**: values can live as long as needed and be shared widely, but each one adds work for the garbage collector. Necessary for out-living values.",
            "**Value vs pointer returns**: returning a small value copies a few bytes on the stack; returning a pointer usually forces a heap allocation. For small structs, by-value is often the cheaper *and* clearer choice.",
            "**Readability vs micro-optimization**: clear code the compiler can optimize beats clever code that hand-manages memory. Optimize only where a profile proves it pays.",
          ],
        },
        {
          type: "note",
          note: {
            tone: "tip",
            title: "The rule of thumb",
            text: "Write the clearest code first. Reach for escape analysis and the profiler only after a measurement shows a specific path is allocation-heavy and that it matters.",
          },
        },
      ],
    },
    design: {
      body: "Turn this into durable habits. Design your function signatures around what makes the code *clear*, not around imagined allocation savings. Return small, always-present values by value; use a pointer when the value is large, must be shared and mutated, or is genuinely optional (where `nil` means 'none'). Trust escape analysis to place things correctly, and trust the garbage collector to clean up — both are mature and need no help in ordinary code. Keep the profiler in your back pocket for the rare hot path.",
      blocks: [
        {
          type: "points",
          items: [
            "Choose value-vs-pointer for clarity and semantics first, not for placement.",
            "Small, always-present result → return by value; large/shared/optional → pointer.",
            "Trust the compiler and GC by default; profile before optimizing a specific path.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Designing a lookup's return type",
            context:
              "A function looks up a small `Balance` value that always exists for a valid account. The author debates returning `Balance` vs `*Balance` for speed.",
            insight:
              "Return the small value by value — it's clearer and avoids a heap allocation. Switch to a pointer only if the value grows large or a profile of this exact call shows the copy matters.",
          },
        },
      ],
    },
    mastery: {
      body: "You've mastered this lesson when you can do four things without notes: explain what the stack and heap are and why returning a local pointer is safe in Go, predict whether a simple value escapes and give the lifetime reason, use `go build -gcflags=-m` to confirm a decision instead of guessing, and defend a value-vs-pointer choice on clarity grounds while naming the profiling evidence that would change it. Check a criterion only when you genuinely have that evidence — reading the stage doesn't count.",
    },
    summary: {
      body: "One idea carries this whole lesson: **a value's lifetime decides where it lives, and the compiler decides that for you.** Values that die with their function stay on the fast, auto-freed stack; values that must outlive it escape to the heap, where the garbage collector cleans up. Because Go handles this, returning a pointer to a local is safe — and your job is to write clear code, not to place memory by hand.",
      blocks: [
        {
          type: "points",
          items: [
            "Stack = per-goroutine, fast, freed automatically when the function returns.",
            "Heap = shared, freed later by the concurrent mark-sweep garbage collector.",
            "A value **escapes** to the heap when it must outlive its function — e.g. you return its address (which is safe in Go).",
            "Confirm decisions with `go build -gcflags=-m`; never guess.",
            "Clarity first; reach for escape analysis and a profile only when a measurement proves it matters.",
          ],
        },
      ],
    },
  },
};
