import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 1 — functions, multiple returns, defer, and closures. Same
 * beginner-friendly voice as Module 0: plain language, one analogy per hard
 * idea, a concrete example before the abstract rule. Careful and correct about
 * defer argument-evaluation timing and Go 1.22+ loop-variable semantics.
 */
export const goFunctionsDefer: Lesson = {
  id: "go-functions-defer",
  slug: "functions-defer",
  title: "Functions, multiple returns, defer & closures",
  description:
    "Write functions that return an error alongside a result, guarantee cleanup with defer, and reason correctly about what a closure captures.",
  moduleId: "go-1",
  estimatedMinutes: 60,
  difficulty: "beginner",
  prerequisites: ["go-basic-types"],
  learningObjectives: [
    "Declare functions with typed parameters and results, pass functions as values, and use variadic parameters",
    "Return and consume a (result, error) pair the idiomatic Go way",
    "Use defer for cleanup that runs no matter how a function exits, and predict its timing",
    "Explain what a closure captures and avoid the loop-variable capture pitfall",
  ],
  concepts: [
    "functions",
    "function-values",
    "variadic-parameters",
    "multiple-returns",
    "defer",
    "closures",
  ],
  references: [
    {
      title: "The Go Programming Language Specification — Function declarations",
      url: "https://go.dev/ref/spec#Function_declarations",
      teaches:
        "Function declarations, parameter and result lists, variadic parameters, and function values.",
      relevance: "Backs the core function syntax and variadic rules in this lesson.",
      required: false,
      section: "Function declarations; Function types; Calls",
    },
    {
      title: "The Go Programming Language Specification — Defer statements",
      url: "https://go.dev/ref/spec#Defer_statements",
      teaches:
        "The normative rules for when a deferred call's arguments are evaluated and when it runs.",
      relevance: "Settles the argument-evaluation timing and LIFO ordering this lesson turns on.",
      required: false,
      section: "Defer statements",
    },
    {
      title: "Defer, Panic, and Recover",
      url: "https://go.dev/blog/defer-panic-and-recover",
      teaches: "How defer works in practice and why it is the standard tool for reliable cleanup.",
      relevance: "Backs the mechanics and implementation stages with the official explanation.",
      required: false,
      section: "Defer",
    },
    {
      title: "Effective Go — Defer",
      url: "https://go.dev/doc/effective_go#defer",
      teaches:
        "Idiomatic patterns for pairing acquire/release with defer and keeping cleanup next to setup.",
      relevance: "Grounds the design rules for cleanup close to where a resource is opened.",
      required: false,
      section: "Defer",
    },
  ],
  exercises: [
    {
      id: "go1fd-predict-order",
      type: "prediction",
      prompt:
        "A function runs `defer fmt.Println(1)`, then `defer fmt.Println(2)`, then `defer fmt.Println(3)`, then returns. Predict the exact order the numbers print.",
      expectedAnswer:
        "3, 2, 1 — deferred calls run in last-in, first-out order as the function returns.",
      hints: ["Each defer pushes onto a stack.", "The last one deferred is the first one run."],
    },
    {
      id: "go1fd-read-capture",
      type: "code-reading",
      prompt:
        "Read `i := 10; defer fmt.Println(i); i = 20`. State what prints when the function returns, and explain which line fixed the printed value.",
      hints: [
        "A deferred call's arguments are evaluated when the defer statement runs, not when the call fires.",
      ],
    },
    {
      id: "go1fd-implement-close",
      type: "implementation",
      prompt:
        "Complete readAll so the file is always closed, even if reading fails, and the function returns both the bytes and any error.",
      starterCode:
        'package main\n\nimport (\n  "io"\n  "os"\n)\n\nfunc readAll(path string) ([]byte, error) {\n  f, err := os.Open(path)\n  if err != nil {\n    return nil, err\n  }\n  // ensure f is closed on every path out of this function\n\n  return io.ReadAll(f)\n}',
      expectedAnswer:
        "func readAll(path string) ([]byte, error) {\n  f, err := os.Open(path)\n  if err != nil {\n    return nil, err\n  }\n  defer f.Close()\n  return io.ReadAll(f)\n}",
      hints: [
        "Open first, check the error, then defer the close.",
        "defer runs on both the success and error return.",
      ],
    },
    {
      id: "go1fd-debug-loop",
      type: "debugging",
      prompt:
        "In Go 1.19 a developer wrote `for _, u := range users { go func() { save(u) }() }` and every goroutine saved the last user. Explain the pre-1.22 cause and give two fixes (one that works on old Go, one that relies on modern Go).",
      hints: [
        "Before Go 1.22 the loop variable was one shared variable reused each iteration.",
        "Old fix: pass u as an argument or shadow it with `u := u`. Modern fix: Go 1.22+ gives each iteration its own u.",
      ],
    },
    {
      id: "go1fd-refactor-unlock",
      type: "refactoring",
      prompt:
        "A method calls `mu.Lock()` and then has three separate return statements, each calling `mu.Unlock()` right before it. Refactor it so the unlock cannot be forgotten on a new code path.",
      hints: [
        "Replace the repeated manual unlocks with a single `defer mu.Unlock()` after the lock.",
      ],
    },
    {
      id: "go1fd-design-counter",
      type: "design",
      prompt:
        "Design a `newCounter()` that returns a function; each call to the returned function yields the next integer starting at 1. Explain what state the closure captures and why separate counters do not interfere.",
      hints: [
        "The returned function captures a local variable by reference.",
        "Each call to newCounter creates a fresh variable.",
      ],
    },
    {
      id: "go1fd-advanced-return",
      type: "advanced",
      prompt:
        "Using a named return value, write a deferred function that wraps any returned error with extra context (e.g. the operation name) without changing the success path. Explain why this only works with named returns.",
      hints: [
        "Named returns let a deferred closure read and reassign the return value after the return statement runs.",
        "Guard on `if err != nil` inside the deferred func so success is untouched.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-defer-timing",
      kind: "explain",
      description:
        "Explain, without notes, when a deferred call's arguments are evaluated versus when the call runs, and why the order is LIFO.",
      required: true,
    },
    {
      id: "predict-capture",
      kind: "predict",
      description:
        "Correctly predict what a closure prints given a reassignment between capture and call.",
      required: true,
    },
    {
      id: "implement-cleanup",
      kind: "implement",
      description:
        "Write a function that opens a resource and guarantees its release with defer on every exit path.",
      required: true,
    },
    {
      id: "design-callback",
      kind: "design",
      description:
        "Design a closure-based factory (like a counter or handler builder) and defend what state it captures.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: 'You already know how to run a program. Now you need to split it into reusable pieces — **functions** — and two everyday problems show up immediately. First, a function often needs to say more than one thing at once: not just "here is the answer" but also "did it even work?". Second, whenever a function grabs something that must be handed back — an open file, a network connection, a lock — it has to release it on *every* way out, including the error paths you\'d rather not think about.\n\nBeginners usually solve the second problem by copying a cleanup line before every `return`. It works until someone adds a fourth `return` and forgets the cleanup. Go gives you tools that make both problems disappear: multiple return values, and `defer`.',
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: 'Think of `defer` as a sticky note you write the moment you borrow something: "put this back before you leave the room." You write it once, right after you borrow, and no matter which door you leave by, the note fires on your way out.',
          },
        },
        {
          type: "points",
          items: [
            "A Go function can return **several values at once** — the common shape is `(result, error)`.",
            "`defer` schedules cleanup that runs when the function returns, on every path.",
            "A **closure** is a function that remembers variables from where it was created — powerful, and the source of one classic bug.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Keep two rules and defer stops surprising you. **Rule 1: a deferred call runs when the surrounding function returns**, not when the line is reached. **Rule 2: a deferred call's arguments are evaluated immediately, at the moment the `defer` statement runs** — even though the call itself waits.\n\nRule 2 is the one that catches everyone. The call is frozen with the argument values it had *then*, and those values don't change later even if the variable does.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Arguments freeze at the defer line",
            language: "go",
            code: 'func demo() {\n    i := 10\n    defer fmt.Println("deferred:", i) // i is read NOW → 10 is captured\n    i = 20\n    fmt.Println("normal:  ", i)       // prints 20\n}\n// Output:\n// normal:   20\n// deferred: 10',
            takeaway:
              "`i` was 10 when the defer statement ran, so the deferred call prints 10 — even though i became 20 before the call actually fired.",
          },
        },
        {
          type: "note",
          note: {
            tone: "warning",
            title: "Common trap",
            text: "If you *want* the deferred call to see the final value, defer a closure that reads the variable — `defer func() { fmt.Println(i) }()` — instead of passing it as an argument. The closure reads i when it runs; a plain argument is frozen when deferred.",
          },
        },
      ],
    },
    mechanics: {
      body: "Now the precise version. A function's return type can list several types in parentheses, e.g. `(int, error)`. The caller receives them in order and, by convention, checks the trailing `error` first — a non-nil error means the other values may be meaningless.\n\nGo also allows **named return values**: you name the results in the signature (`func f() (n int, err error)`), which pre-declares those variables. A plain `return` then sends their current values. This matters for defer, because a deferred closure can read *and even change* a named return value after `return` has run but before the caller sees it.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Parameters, function values, and variadic arguments",
            language: "go",
            code: "func add(x, y int) int { return x + y }\n\nfunc apply(x, y int, operation func(int, int) int) int {\n    return operation(x, y)\n}\n\nfunc sum(values ...int) int { // values is []int inside sum\n    total := 0\n    for _, value := range values {\n        total += value\n    }\n    return total\n}\n\nfunc main() {\n    result := apply(2, 3, add)\n    more := []int{1, 2, 3}\n    total := sum(more...) // expand a slice into variadic arguments\n    fmt.Println(result, total)\n}",
            takeaway:
              "A function has a type and can be passed like another value. A final `...T` parameter accepts zero or more values; use `slice...` to pass an existing slice.",
          },
        },
        {
          type: "example",
          example: {
            title: "The (result, error) idiom and named returns",
            language: "go",
            code: 'import "strconv"\n\n// two return values: the parsed number and whether it worked\nfunc parsePort(s string) (int, error) {\n    n, err := strconv.Atoi(s)\n    if err != nil {\n        return 0, err // caller sees a non-nil error\n    }\n    return n, nil\n}\n\nfunc caller() {\n    port, err := parsePort("8080")\n    if err != nil {\n        // handle it; port is not trustworthy here\n        return\n    }\n    _ = port // safe to use: err was nil\n}',
            takeaway:
              "Return the error next to the result and check it first. A non-nil error means the result may be a zero placeholder.",
          },
        },
        {
          type: "points",
          items: [
            "Parameters name their types; adjacent parameters may share one type: `func add(x, y int) int`.",
            "Functions are values: store them, pass them to another function, or return them.",
            "A variadic `...T` parameter must be last and behaves as `[]T` inside the function.",
            "Multiple returns: `func f() (T1, T2)`; callers read them positionally.",
            "The `(result, error)` idiom puts the error last; check it before trusting the result.",
            "Named returns pre-declare result variables, so a deferred closure can post-process them.",
          ],
        },
      ],
    },
    diagram: {
      body: "The clearest way to feel LIFO is to watch three defers register on the way down and fire on the way back up. Read the sequence below: steps 1–3 push notes as the function runs forward; steps 4–6 pop them in reverse as it returns.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Three defers: pushed in order, run in reverse",
            kind: "sequence",
            nodes: [
              {
                id: "d1",
                label: "defer close(A)",
                detail: "pushed first — sits at the bottom of the stack",
              },
              { id: "d2", label: "defer close(B)", detail: "pushed second" },
              {
                id: "d3",
                label: "defer close(C)",
                detail: "pushed last — sits on top",
                tone: "accent",
              },
              { id: "ret", label: "function returns", detail: "now the stack unwinds, top first" },
              {
                id: "r3",
                label: "run close(C)",
                detail: "last deferred, first to run",
                tone: "success",
              },
              { id: "r2", label: "run close(B)", detail: "then the middle one" },
              {
                id: "r1",
                label: "run close(A)",
                detail: "first deferred, last to run",
                tone: "success",
              },
            ],
            caption:
              "Deferred calls form a stack: last in, first out. C opened last, so C closes first.",
          },
        },
      ],
    },
    implementation: {
      body: "The idiomatic pattern is tiny and you'll use it constantly: acquire the resource, check the error, then immediately `defer` its release. Setup and teardown sit on adjacent lines, so a reader can verify at a glance that nothing leaks — and future edits that add new return statements are automatically covered.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Acquire, check, defer — the whole pattern",
            language: "go",
            code: 'func rowCount(db *sql.DB) (int, error) {\n    rows, err := db.Query("SELECT id FROM accounts")\n    if err != nil {\n        return 0, err\n    }\n    defer rows.Close() // released on every return below, no matter which\n\n    n := 0\n    for rows.Next() {\n        n++\n    }\n    if err := rows.Err(); err != nil {\n        return 0, err // rows.Close() still runs\n    }\n    return n, nil    // rows.Close() runs here too\n}',
            takeaway:
              "One `defer rows.Close()` right after the successful Query covers both the error return and the success return. Add a third return later and it is covered for free.",
          },
        },
        {
          type: "points",
          items: [
            "Order is always: acquire → check error → `defer` release.",
            "Defer *after* the error check, so you don't try to close something that failed to open.",
            "The cleanup now lives one line from the acquisition — easy to audit.",
          ],
        },
      ],
    },
    experiment: {
      body: "Predict before you read on — a wrong guess you correct sticks better than a right answer you skimmed. Consider this loop, deferred inside a single function:\n\n```\nfunc printAll() {\n    for i := 0; i < 3; i++ {\n        defer fmt.Println(i)\n    }\n}\n```\n\nWhat does it print, and in what order? Commit to an answer.\n\nHere's the trace. Each iteration hits the `defer` and evaluates its argument *right then*, so it captures the current `i`: first 0, then 1, then 2, pushing three frozen calls onto the stack. The loop finishes, the function returns, and the stack unwinds top-first. Output: **2, then 1, then 0**. Two rules combined to produce it — arguments froze at each defer line (so the values are 0, 1, 2, not three 2s), and the calls ran in LIFO order (so they came out reversed).",
    },
    "failure-cases": {
      body: "The failures in this lesson cluster around two misunderstandings: *when* a deferred argument is read, and *what* a closure captures. Here are the ones you'll actually meet.",
      blocks: [
        {
          type: "points",
          items: [
            "**Expecting a deferred argument to see a later value** → it was frozen at the defer line; defer a closure instead if you want the final value.",
            "**`defer` inside a loop** → all the cleanups pile up and only run when the *function* returns, not each iteration. In a long loop, extract the body into its own function.",
            "**Deferring before the error check** → you may close a handle that never opened; defer only after you confirm success.",
            "**Ignoring a deferred call's own error** → `defer f.Close()` throws away Close's error, which matters for writes; capture it via a named return if the write must be durable.",
            "**Assuming a closure copies a variable** → it captures by reference; if the variable changes, the closure sees the change.",
          ],
        },
        {
          type: "example",
          example: {
            title: "The loop-variable capture pitfall (and the modern fix)",
            language: "go",
            code: "ids := []int{1, 2, 3}\n\n// Go 1.22+: each iteration gets its OWN i, so this is correct today.\nfor _, id := range ids {\n    go func() { fmt.Println(id) }() // prints 1, 2, 3 (in some order)\n}\n\n// Before Go 1.22: i was ONE shared variable reused every iteration, so all\n// goroutines saw its final value. The classic fix was to shadow it:\nfor _, id := range ids {\n    id := id // make a fresh per-iteration copy\n    go func() { fmt.Println(id) }()\n}",
            takeaway:
              "As of Go 1.22 each loop iteration has its own variable, so the naive version is correct. On older Go the shared loop variable caused every closure to print the last value — shadow with `id := id` there.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "Defer and closures are convenient, and convenience has costs worth naming. None of these should scare you off — they just mark where to think twice.",
      blocks: [
        {
          type: "points",
          items: [
            "**defer for cleanup**: bulletproof and readable, but it runs at *function* exit — wrong granularity inside a hot loop.",
            "**deferring a call vs a closure**: a plain call freezes its arguments (predictable); a closure sees later changes (flexible) — pick deliberately.",
            "**named returns**: enable post-processing in a defer, but overused they hurt readability; reserve them for error-wrapping or documentation.",
            "**closures capturing state**: great for callbacks, but a captured variable is shared mutable state — mind concurrency.",
          ],
        },
      ],
    },
    design: {
      body: "A few durable rules. Put the release right next to the acquisition with `defer`, so the pair is impossible to separate. Return errors as values and check them at the call site — don't reach for panic to signal ordinary failure. Reach for a closure when you genuinely need a function to carry state or context with it, and be explicit in your head about what it captures.",
      blocks: [
        {
          type: "points",
          items: [
            "Pair every acquire with a `defer` release on the very next line after the error check.",
            "Errors are return values; check them, don't throw them.",
            "Use a closure to carry state; know whether you want frozen or live capture.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "A counter that carries its own state",
            context:
              "You want a `next()` that returns 1, 2, 3, ... and two independent counters that don't interfere.",
            insight:
              "`newCounter()` declares a local `n` and returns a closure that increments and returns it. Each call to newCounter creates a fresh `n`, so the two returned functions capture different variables — separate state, no globals.",
          },
        },
      ],
    },
    mastery: {
      body: "You've mastered this when you can explain defer's two timing rules without notes, predict what a closure prints when a variable changes between capture and call, write a function that guarantees resource release on every path, and design a closure-based factory and defend what it captures. Attest a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "Two ideas carry this lesson. **Errors are values** — return them next to your result and check them. **`defer` binds cleanup to acquisition** — it runs at function return, in LIFO order, with its arguments frozen at the defer line. Add closures, which capture variables by reference, and you have Go's whole toolkit for cleanup and callbacks.",
      blocks: [
        {
          type: "points",
          items: [
            "Functions have types and can be passed or returned; a final `...T` parameter accepts a variable number of arguments.",
            "Return `(result, error)`; the caller checks the error first.",
            "`defer` runs at function return, last-in-first-out; arguments are evaluated when the defer statement runs.",
            "Want the final value in a deferred call? Defer a closure, not a plain call.",
            "Closures capture variables from the surrounding function; Go 1.22+ gives each loop iteration its own variable.",
          ],
        },
      ],
    },
  },
};
