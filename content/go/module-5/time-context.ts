import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 5 — time & context. Same beginner-friendly voice as Modules 0–4:
 * plain language, one analogy per hard idea, a concrete example before the
 * abstract rule. Careful and correct about time.Duration being a typed int64
 * of nanoseconds, and about the deferred-cancel discipline that context
 * requires. This lesson sets up the cancellation used heavily in the later
 * concurrency and database/sql work.
 */
export const goTimeContext: Lesson = {
  id: "go-time-context",
  slug: "time-context",
  title: "time & context",
  description:
    "Measure and express durations with the time package, then carry a deadline and a cancellation signal down a call tree with context.Context.",
  moduleId: "go-5",
  estimatedMinutes: 55,
  difficulty: "intermediate",
  prerequisites: ["go-functions-defer"],
  learningObjectives: [
    "Express and measure elapsed time with time.Duration, time.Now, and time.Since instead of bare numbers",
    "Create a context with a deadline or cancel signal and always release it with defer cancel()",
    "Propagate a context.Context down a call tree and react to ctx.Done() and ctx.Err() correctly",
  ],
  concepts: ["time", "context", "deadlines", "cancellation"],
  ledgerFlowApplications: [
    "Bound every incoming request with a context deadline so a slow query can't hold a connection forever",
    "Pass ctx as the first argument from handler to service to store, so one cancellation stops the whole chain",
    "Use time.Since on a request's start to log how long each handler took",
  ],
  references: [
    {
      title: "Go Concurrency Patterns: Context (The Go Blog)",
      url: "https://go.dev/blog/context",
      teaches:
        "Why context exists, how a deadline or cancellation propagates down a call tree, and the defer cancel() discipline.",
      relevance: "The canonical narrative for the cancellation and deadline model this whole lesson is built on.",
      required: true,
      section: "The Context package",
    },
    {
      title: "package context (pkg.go.dev)",
      url: "https://pkg.go.dev/context",
      teaches:
        "The exact signatures of Background, WithTimeout, WithCancel, Done, Err, and the documented rules for using them.",
      relevance: "Settles the precise API behavior — that cancel must be called and that ctx is the first parameter.",
      required: true,
      section: "Overview",
    },
    {
      title: "package time (pkg.go.dev)",
      url: "https://pkg.go.dev/time",
      teaches: "That Duration is an int64 of nanoseconds, and how Now, Since, and After produce and consume durations.",
      relevance: "Backs the time half of the lesson: why you write 5*time.Second and never a bare 5.",
      required: false,
      section: "Duration",
    },
  ],
  exercises: [
    {
      id: "go5tc-predict-duration",
      type: "prediction",
      prompt:
        "You write `d := 5 * time.Second`. Predict what `int64(d)` prints and explain why, given what a time.Duration actually is.",
      expectedAnswer:
        "5000000000 — a time.Duration is an int64 count of nanoseconds, and 5 seconds is 5,000,000,000 ns.",
      hints: ["Duration is not seconds; it is nanoseconds.", "time.Second is the constant 1_000_000_000 of that unit."],
    },
    {
      id: "go5tc-read-cancel",
      type: "code-reading",
      prompt:
        "Read `ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)` followed by a function that never calls cancel. State what leaks and what would have prevented it.",
      hints: [
        "WithTimeout starts a timer and tracks resources tied to the returned context.",
        "The fix is a single line placed right after this one.",
      ],
    },
    {
      id: "go5tc-implement-deadline",
      type: "implementation",
      prompt:
        "Complete fetch so it gives the work at most 3 seconds and never leaks the context. Return ctx.Err() if the deadline passes before the work finishes.",
      starterCode:
        'package main\n\nimport (\n  "context"\n  "time"\n)\n\n// slowWork blocks until it either finishes or ctx is done.\nfunc slowWork(ctx context.Context) error {\n  select {\n  case <-time.After(5 * time.Second):\n    return nil // pretend the work took 5s\n  case <-ctx.Done():\n    return ctx.Err()\n  }\n}\n\nfunc fetch() error {\n  // give slowWork at most 3 seconds, and release the context afterwards\n  return slowWork( /* ctx */ nil)\n}',
      expectedAnswer:
        'func fetch() error {\n  ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)\n  defer cancel()\n  return slowWork(ctx)\n}',
      hints: [
        "WithTimeout returns two things: the context and a cancel func.",
        "defer cancel() on the very next line so it runs no matter how fetch returns.",
      ],
    },
    {
      id: "go5tc-debug-bareint",
      type: "debugging",
      prompt:
        "A developer wrote `context.WithTimeout(ctx, 30)` expecting a 30-second timeout, and it fired almost instantly. Explain the bug and fix it.",
      hints: [
        "The second argument is a time.Duration, i.e. nanoseconds.",
        "30 means 30 nanoseconds; you meant 30*time.Second.",
      ],
    },
    {
      id: "go5tc-refactor-ctx-param",
      type: "refactoring",
      prompt:
        "A service stores its context in a struct field (`type Service struct { ctx context.Context }`) and reuses it across many requests. Explain why this is wrong and refactor to the idiomatic shape.",
      hints: [
        "A context describes one operation's deadline, not a long-lived object's state.",
        "Pass ctx as the first parameter of each method instead of storing it.",
      ],
    },
    {
      id: "go5tc-design-propagate",
      type: "design",
      prompt:
        "Design the flow for an HTTP handler that must finish within 500ms across three layers (handler -> service -> store). Describe where the context is created, how it travels, and where Done() is checked.",
      hints: [
        "Create the deadline once at the top with WithTimeout and defer cancel().",
        "Every layer takes ctx as its first argument and passes the same ctx downward.",
      ],
    },
    {
      id: "go5tc-advanced-err",
      type: "advanced",
      prompt:
        "After a select on ctx.Done() returns, you need to tell whether the operation timed out or was cancelled by the caller. Write the code that distinguishes the two and explain which sentinel error each case matches.",
      hints: [
        "ctx.Err() returns context.DeadlineExceeded when a deadline passed.",
        "It returns context.Canceled when cancel() was called first. Compare with errors.Is.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-duration",
      kind: "explain",
      description:
        "Explain, without notes, that time.Duration is an int64 of nanoseconds and why you write 5*time.Second rather than a bare 5.",
      required: true,
    },
    {
      id: "implement-timeout",
      kind: "implement",
      description:
        "Write a function that bounds work with context.WithTimeout and releases the context with defer cancel() on every path.",
      required: true,
    },
    {
      id: "predict-cancel-err",
      kind: "predict",
      description:
        "Given a context that is done, correctly predict whether ctx.Err() is context.DeadlineExceeded or context.Canceled.",
      required: true,
    },
    {
      id: "design-propagation",
      kind: "design",
      description:
        "Design a handler-to-store call flow that creates one context at the top and propagates it as the first argument through every layer.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "Two problems show up the moment your programs talk to the outside world. First, you need to talk about *time* — how long to wait, how long something took, how far in the future a deadline is. Second, and harder: when a request is taking too long, or the user hangs up, or you simply asked for more than you need, you want to **stop the work** — and not just the one function you're in, but every function it called, all the way down.\n\nGo answers the first with the `time` package and its `Duration` type, and the second with `context.Context` — a value that carries a deadline and a \"please stop now\" signal down a call tree. This lesson does time first because context is built out of it, and cancellation is the foundation for everything you'll write later in concurrency and database code.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "A context is like a group tour with a return-by time written on everyone's ticket. The guide (your top-level function) sets the deadline; every side-trip (the functions it calls) carries the same ticket and glances at it. When time's up — or the guide blows the whistle early — everyone heads back at once.",
          },
        },
        {
          type: "points",
          items: [
            "`time.Duration` names a length of time (a timeout, an interval), not a point in time.",
            "`context.Context` carries a deadline and a cancellation signal down a chain of calls.",
            "Together they let one decision at the top — \"stop\" — reach every function below.",
          ],
        },
      ],
    },
    naive: {
      body: "The naive way to handle time is to pass plain numbers around: `sleep(5)`, `timeout(30)`. But 5 *what*? Seconds? Milliseconds? The number doesn't say, and two functions can disagree. The naive way to handle cancellation is worse: there isn't one. If a function is three calls deep and busy, nothing tells it the caller already gave up — so it runs to completion, wasting time on a result nobody will read.\n\nGo pushes you away from both. Durations are a real type with units baked in, and cancellation is an explicit value you pass down, not something you bolt on later.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Bare numbers hide their units",
            language: "go",
            code:
              "// What unit is 30? The signature doesn't say, and the caller can only guess.\nfunc doWork(timeout int) { /* ... */ }\n\ndoWork(30) // 30 seconds? milliseconds? nobody knows\n\n// Go's way: the unit is part of the value.\nfunc doWorkCtx(ctx context.Context) { /* ... */ }\n\nctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)\ndefer cancel()\ndoWorkCtx(ctx) // unmistakably 30 seconds",
            takeaway:
              "A bare int leaves the unit to guesswork. `30*time.Second` is self-documenting and impossible to misread.",
          },
        },
      ],
    },
    failure: {
      body: "Skip context and the failure is invisible until you're under load. Picture a web server: a user opens a page, the request runs a database query, and the user closes the tab after a second. Without cancellation, that query keeps running to the end. Multiply by thousands of impatient users and your database is grinding through work whose answers are already thrown away — while *new* requests wait for a connection that a dead request is still holding.\n\nThe root problem is that the work has no way to hear \"stop.\" There's no shared signal linking the caller who gave up to the function still toiling three levels down.",
      blocks: [
        {
          type: "scenario",
          scenario: {
            title: "The query that outlives the request",
            context:
              "A handler runs a 10-second report query. The client disconnects after 1 second. With no context, the handler and the database keep working for 9 more seconds, holding a connection the whole time. Under load, connections run out and healthy requests start failing.",
            insight:
              "Cancellation has to travel *with* the work. If the handler had passed a context tied to the request, the client's disconnect would close ctx.Done(), the query would abort, and the connection would come back immediately.",
          },
        },
      ],
    },
    intuition: {
      body: "Here's the mental image for context. Every function in a call chain holds the *same* small object — the context. The context has one job: it can be **done**. \"Done\" happens either because a deadline arrived or because someone called `cancel()`. When it happens, a little door (`ctx.Done()`) swings open, and every function watching that door sees it open at the same instant and can stop.\n\nContexts form a tree. You start from a root, `context.Background()`, and each time you add a timeout or a cancel you get a *child* context. Cancelling a parent cancels all its children — the whistle blows once and the whole tour turns around. Children can finish early on their own, but they can never outlast a cancelled parent.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "Done() is a channel that closes",
            text: "`ctx.Done()` returns a channel. You don't send anything on it; it's simply *closed* when the context is done. A closed channel makes every `<-ctx.Done()` receive succeed instantly, which is how many watchers all wake at once from a single event.",
          },
        },
        {
          type: "points",
          items: [
            "A context is either alive or **done** — done means deadline reached or cancel() called.",
            "`context.Background()` is the empty root; every other context descends from it.",
            "Cancelling a parent cancels every child; a child cannot outlive a cancelled parent.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Two facts make `time.Duration` stop surprising you. **First: a Duration is just an `int64` counting nanoseconds.** `time.Second` is not magic — it's the constant `1000000000` of that type. So `5 * time.Second` is arithmetic on int64s that happens to mean five seconds. **Second: because the unit is nanoseconds, a bare number is almost never what you want** — `30` means thirty *nanoseconds*, which is essentially instant.\n\nFor context, hold one rule above all: **every function that creates a cancellable context also gets a `cancel` function, and you must call it** — always with `defer cancel()` on the next line. Calling cancel doesn't mean \"something went wrong\"; it means \"I'm done with this context, release its timer and resources.\" Forgetting it leaks those resources until the deadline eventually fires.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Durations are nanoseconds; multiply the units",
            language: "go",
            code:
              'd := 5 * time.Second\nfmt.Println(int64(d)) // 5000000000  (nanoseconds)\nfmt.Println(d)        // 5s          (Duration prints human-friendly)\n\n// Composing units reads like English:\ntimeout := 1*time.Minute + 30*time.Second // 90s\n\n// The trap: a bare number is nanoseconds, not seconds.\nvar oops time.Duration = 30 // 30ns — fires almost immediately',
            takeaway:
              "Always attach a unit: `30*time.Second`, never a bare `30`. A Duration printed shows units, but the underlying value is an int64 of nanoseconds.",
          },
        },
        {
          type: "note",
          note: {
            tone: "warning",
            title: "Always defer cancel()",
            text: "`WithTimeout` and `WithCancel` both return `(ctx, cancel)`. Even if the timeout will fire on its own, you must still call cancel to free resources promptly. `defer cancel()` right after the call is the standard, forget-proof pattern.",
          },
        },
      ],
    },
    mechanics: {
      body: "The precise API. On the time side: `time.Now()` returns the current `time.Time`; `time.Since(start)` returns the `Duration` elapsed since a past time (shorthand for `time.Now().Sub(start)`); and `time.After(d)` returns a channel that delivers a value after duration `d` — handy inside a `select`.\n\nOn the context side: `context.Background()` is the root context. `context.WithTimeout(parent, d)` returns a child that becomes done after `d` *and* a `cancel` func. `context.WithCancel(parent)` returns a child you cancel manually, plus its `cancel`. A context exposes `ctx.Done()` — a channel closed when it's done — and `ctx.Err()`, which is `nil` while alive, then either `context.DeadlineExceeded` (a timeout fired) or `context.Canceled` (someone called cancel). By convention `ctx` is the **first parameter** of any function that takes one, and you never store it in a struct.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Measuring time and reading a context's state",
            language: "go",
            code:
              'start := time.Now()\n// ... do some work ...\nelapsed := time.Since(start)      // a Duration, e.g. 42ms\nfmt.Printf("took %s\\n", elapsed)\n\nctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)\ndefer cancel()\n\nselect {\ncase <-ctx.Done():\n    // the door opened: deadline hit or cancel() called\n    fmt.Println("stopped:", ctx.Err()) // DeadlineExceeded or Canceled\ncase <-time.After(1 * time.Second):\n    fmt.Println("work finished in time")\n}',
            takeaway:
              "`time.Since` gives you elapsed Duration; `ctx.Done()` is the channel you select on, and `ctx.Err()` tells you *why* it closed.",
          },
        },
        {
          type: "points",
          items: [
            "`time.Now()` -> current time; `time.Since(start)` -> Duration elapsed; `time.After(d)` -> channel firing after d.",
            "`context.Background()` is the root; `WithTimeout`/`WithCancel` return `(ctx, cancel)`.",
            "`ctx.Done()` is a channel that closes; `ctx.Err()` is nil, then `DeadlineExceeded` or `Canceled`.",
            "Pass `ctx` as the first parameter; never store it in a struct field.",
          ],
        },
      ],
    },
    diagram: {
      body: "Cancellation is easiest to grasp as a tree with one signal flowing down it. The root has no deadline; a `WithTimeout` child adds one; the functions below all share that child and all watch its `Done()` door. When the door opens — deadline or cancel — the signal reaches every node at once.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "One cancel signal flows down the context tree",
            kind: "flow",
            nodes: [
              { id: "bg", label: "context.Background()", detail: "the empty root — never cancelled on its own", tone: "muted" },
              { id: "to", label: "WithTimeout(bg, 500ms)", detail: "child with a deadline; returns ctx + cancel", tone: "accent" },
              { id: "svc", label: "service(ctx, ...)", detail: "takes ctx as first arg, passes it down" },
              { id: "store", label: "store.Query(ctx, ...)", detail: "watches ctx.Done(); aborts if it closes" },
              { id: "done", label: "ctx.Done() closes", detail: "deadline hit OR cancel() called → every layer stops", tone: "danger" },
            ],
            caption: "The deadline is set once at the top. The same ctx travels down; when Done() closes, all layers react together.",
          },
        },
      ],
    },
    implementation: {
      body: "The workhorse pattern is four lines and you'll write it constantly: create a bounded context, `defer cancel()`, then hand `ctx` to the work. Any function that might block or do I/O takes `ctx` first and either passes it further down or watches `ctx.Done()` in a `select`. That's the whole discipline.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Bound work with a deadline and propagate it",
            language: "go",
            code:
              'func handleReport(w http.ResponseWriter, r *http.Request) {\n    // one deadline for the whole request\n    ctx, cancel := context.WithTimeout(r.Context(), 500*time.Millisecond)\n    defer cancel() // release the timer no matter how we return\n\n    report, err := buildReport(ctx) // ctx is the FIRST argument\n    if err != nil {\n        http.Error(w, err.Error(), http.StatusGatewayTimeout)\n        return\n    }\n    fmt.Fprint(w, report)\n}\n\nfunc buildReport(ctx context.Context) (string, error) {\n    select {\n    case <-time.After(2 * time.Second): // pretend the query is slow\n        return "done", nil\n    case <-ctx.Done():\n        return "", ctx.Err() // DeadlineExceeded → we stop early\n    }\n}',
            takeaway:
              "Set the deadline once at the top with defer cancel(), pass ctx down as the first arg, and let the deepest blocking call watch ctx.Done().",
          },
        },
        {
          type: "points",
          items: [
            "Create -> `defer cancel()` -> pass `ctx` down: the standard three-step opening.",
            "`r.Context()` (in an HTTP handler) is already tied to the client; deriving from it means a disconnect cancels your work too.",
            "The deepest blocking operation does the actual `select { case <-ctx.Done(): ... }`.",
          ],
        },
      ],
    },
    experiment: {
      body: "Predict before you read on — a wrong guess you correct sticks better than a right answer you skimmed. Here's the code:\n\n```\nctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)\ndefer cancel()\n\nstart := time.Now()\nselect {\ncase <-time.After(1 * time.Second):\n    fmt.Println(\"work done\")\ncase <-ctx.Done():\n    fmt.Println(\"stopped:\", ctx.Err())\n}\nfmt.Println(\"elapsed:\", time.Since(start).Round(10*time.Millisecond))\n```\n\nWhich branch of the select wins, what does it print, and roughly how long does it take? Commit to an answer.\n\nHere's the trace. Two channels race: `time.After(1s)` fires after a full second, but `ctx.Done()` closes after only 100ms because the timeout is shorter. The shorter timer wins, so the `ctx.Done()` branch runs. `ctx.Err()` is `context.DeadlineExceeded` (a deadline elapsed, nobody called cancel first), so it prints `stopped: context deadline exceeded`. And `time.Since(start)` is about **100ms**, not a second — the whole point of the deadline is that we did *not* wait for the slow work. If instead you'd called `cancel()` before the deadline, the same branch would win but `ctx.Err()` would read `context.Canceled`.",
    },
    "failure-cases": {
      body: "The failures here cluster around two things: forgetting the units on a Duration, and mishandling the `cancel` func. These are the ones you'll actually hit.",
      blocks: [
        {
          type: "points",
          items: [
            "**Passing a bare number as a Duration** -> `WithTimeout(ctx, 30)` is 30 nanoseconds and fires instantly; write `30*time.Second`.",
            "**Never calling cancel** -> the context's timer and bookkeeping leak until the deadline; always `defer cancel()`.",
            "**Storing ctx in a struct** -> a context describes one operation, not an object's lifetime; pass it as the first argument instead.",
            "**Ignoring ctx.Done()** -> a function that takes ctx but never checks it can't actually be stopped; watch Done() in your blocking select.",
            "**Stuffing request data into context values** -> context is for deadlines and cancellation; use ctx values sparingly, only for truly request-scoped metadata, never as a general parameter bag.",
          ],
        },
        {
          type: "example",
          example: {
            title: "The cancel leak, and the one-line fix",
            language: "go",
            code:
              '// WRONG: cancel is never called → resources leak until the timeout fires\nfunc leaky() error {\n    ctx, _ := context.WithTimeout(context.Background(), time.Second)\n    return doWork(ctx)\n}\n\n// RIGHT: defer cancel() releases everything on every return path\nfunc clean() error {\n    ctx, cancel := context.WithTimeout(context.Background(), time.Second)\n    defer cancel()\n    return doWork(ctx)\n}',
            takeaway:
              "Discarding cancel with `_` is the classic leak — `go vet` even warns about it. The fix is one line: `defer cancel()`.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "Context is powerful and a little intrusive; naming the costs keeps you from misusing it.",
      blocks: [
        {
          type: "points",
          items: [
            "**ctx as the first parameter everywhere**: threads cleanly through a whole stack, but it does add a parameter to nearly every function — accept that; it's the idiom.",
            "**Deadlines vs cancel**: a deadline is fire-and-forget (good for request bounds); manual cancel gives precise control but you own calling it.",
            "**Context values**: convenient for request IDs, but easy to abuse as a hidden argument bag — keep them rare and request-scoped.",
            "**time.After in a loop**: each call allocates a timer that isn't collected until it fires; in a hot loop prefer a reusable time.Timer.",
          ],
        },
      ],
    },
    design: {
      body: "A few durable rules. Create a context's deadline **once, at the top** of an operation (a request handler, a job) and `defer cancel()` immediately. Thread that same `ctx` down as the first argument of every function that does I/O or might block. Let the deepest blocking call watch `ctx.Done()`. Reserve context values for genuinely request-scoped metadata, and never store a context in a struct — it belongs to an operation, not an object.",
      blocks: [
        {
          type: "points",
          items: [
            "Set the deadline once at the top; `defer cancel()` on the next line.",
            "`ctx` is always the first parameter, propagated downward unchanged (or narrowed with a tighter deadline).",
            "Watch `ctx.Done()` at the point that actually blocks; return `ctx.Err()` when it closes.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "One deadline for a whole request",
            context:
              "An API endpoint must respond within 500ms. It calls a service, which calls a store, which runs a query.",
            insight:
              "The handler creates `ctx, cancel := context.WithTimeout(r.Context(), 500*time.Millisecond)`, defers cancel, and passes ctx to the service, which passes it to the store, which passes it to the query. One deadline governs all three layers; if any layer overruns, the whole chain unwinds with context.DeadlineExceeded.",
          },
        },
      ],
    },
    ledgerflow: {
      body: "This is exactly how LedgerFlow keeps its API responsive. Every incoming HTTP request already carries a context (`r.Context()`) tied to the client connection; each handler derives a child with a deadline — `ctx, cancel := context.WithTimeout(r.Context(), ...)` — and `defer cancel()`. That `ctx` is passed as the first argument from the handler into the service layer, and from the service into the store, where the balance query runs `db.QueryContext(ctx, ...)`. If the deadline passes, or the user closes their tab, `ctx.Done()` closes and the query aborts, returning the database connection immediately instead of holding it hostage.\n\nOn the time side, LedgerFlow stamps `start := time.Now()` at the top of a handler and logs `time.Since(start)` on the way out, so every request records how long it took — the raw material for spotting the slow endpoints later.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "A LedgerFlow request bounded by one deadline",
            kind: "sequence",
            nodes: [
              { id: "req", label: "handler: ctx, cancel := WithTimeout(r.Context(), 500ms)", detail: "one deadline for the request" },
              { id: "def", label: "defer cancel()", detail: "release the timer on every return", tone: "accent" },
              { id: "svc", label: "service.GetBalance(ctx, id)", detail: "ctx first arg, passed straight down" },
              { id: "store", label: "store: db.QueryContext(ctx, ...)", detail: "the query watches ctx for you" },
              { id: "done", label: "deadline hit → query aborts, connection freed", detail: "no slow query holds a connection hostage", tone: "success" },
            ],
            caption: "Create once, defer cancel, propagate as the first argument. The deepest layer (the SQL driver) honours Done() automatically.",
          },
        },
      ],
    },
    exercises: {
      body: "Practice is what turns \"I read about context\" into \"I reach for context without thinking.\" Work across predicting a duration's raw value, spotting a cancel leak, implementing a bounded call, debugging a bare-number timeout, and designing a propagation flow. Each produces a different kind of evidence — do them, don't just read them.",
    },
    mastery: {
      body: "You've mastered this when you can explain that a time.Duration is an int64 of nanoseconds (and why `5*time.Second` beats a bare number), write a function that bounds work with WithTimeout and always defers cancel, predict whether a done context reports DeadlineExceeded or Canceled, and design a call flow that creates one context at the top and threads it through every layer. Attest a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "Two ideas carry this lesson. **A Duration is a typed count of nanoseconds** — always attach a unit (`5*time.Second`), and measure elapsed time with `time.Since(start)`. **A context carries a deadline and a cancellation signal down a call tree** — start from `context.Background()` (or `r.Context()`), derive a child with `WithTimeout`/`WithCancel`, `defer cancel()` immediately, pass `ctx` as the first argument, and watch `ctx.Done()` where you block. This cancellation model is the backbone of the concurrency and database work coming next.",
      blocks: [
        {
          type: "points",
          items: [
            "`time.Duration` is int64 nanoseconds; write `5*time.Second`, never a bare `5`.",
            "`WithTimeout`/`WithCancel` return `(ctx, cancel)` — always `defer cancel()`.",
            "Pass `ctx` as the first parameter; check `ctx.Done()` and read `ctx.Err()` (DeadlineExceeded vs Canceled).",
            "Never store a context in a struct. Next up: concurrency, where cancellation really pays off.",
          ],
        },
      ],
    },
  },
};
