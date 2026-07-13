import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 6 — context and cancellation: how a Go program tells goroutines
 * "stop, we don't need this work anymore" and propagates that signal down a
 * whole tree of calls. Same beginner-friendly voice as Modules 0–5: plain
 * language, one analogy per hard idea, a concrete example before the abstract
 * rule. Careful and correct about cooperative cancellation, always calling
 * cancel, ctx.Err() semantics, and never storing a Context in a struct.
 * Builds directly on go-channels-select (Done-style receives, select) and
 * go-time-context (time, deadlines).
 */
export const goContextCancellation: Lesson = {
  id: "go-context-cancellation",
  slug: "context-cancellation",
  title: "Context & cancellation",
  description:
    "Propagate cancellation and deadlines through a tree of goroutines with `context.Context`, wire `select` on `ctx.Done()`, and always call `cancel` so no goroutine, timer, or query is left running after nobody wants its result.",
  moduleId: "go-6",
  estimatedMinutes: 50,
  difficulty: "advanced",
  prerequisites: ["go-channels-select", "go-time-context"],
  learningObjectives: [
    "Explain what a `context.Context` is and why cancellation in Go is cooperative — propagated and observed, never forced onto a goroutine",
    "Create derived contexts with `WithCancel`, `WithTimeout`, and `WithDeadline`, and always release them by calling the returned `cancel` (even on the timeout path)",
    "Wire `select { case <-ctx.Done(): ... }` through a goroutine tree so cancelling a parent stops every child, and read `ctx.Err()` to tell Canceled from DeadlineExceeded",
  ],
  concepts: ["context", "cancellation", "deadlines", "leaks"],
  ledgerFlowApplications: [
    "Cancel in-flight transaction processing the moment the client disconnects or the request's context is cancelled",
    "Give a batch of DB queries a single deadline via WithTimeout so one slow query can't hang the whole request",
    "On server shutdown, cancel the root context so every worker goroutine stops and drains instead of being killed mid-write",
  ],
  references: [
    {
      title: "context package — pkg.go.dev",
      url: "https://pkg.go.dev/context",
      teaches: "The Context interface, Background/TODO, WithCancel/WithTimeout/WithDeadline, Done, Err, and the usage rules.",
      relevance: "The authoritative reference for every API and convention this lesson teaches.",
      required: true,
      section: "Overview; Functions",
    },
    {
      title: "Go Concurrency Patterns: Context (The Go Blog)",
      url: "https://go.dev/blog/context",
      teaches: "Why context exists, how cancellation propagates down a request's goroutine tree, and worked server examples.",
      relevance: "The canonical narrative introduction that this lesson's mental model follows.",
      required: true,
      section: "Introduction; Derived contexts",
    },
    {
      title: "Contexts and structs (The Go Blog)",
      url: "https://go.dev/blog/context-and-structs",
      teaches: "Why a Context should be passed as the first argument, not stored in a struct field.",
      relevance: "Backs the 'never store a Context in a struct' rule the design section insists on.",
      required: false,
      section: "The Context should flow through your program",
    },
    {
      title: "Effective Go — Concurrency",
      url: "https://go.dev/doc/effective_go#concurrency",
      teaches: "How goroutines, channels, and select compose — the primitives context is built on.",
      relevance: "Grounds the select-on-Done mechanics in the concurrency foundation from earlier lessons.",
      required: false,
      section: "Concurrency",
    },
  ],
  exercises: [
    {
      id: "go6cc-predict-timeout-err",
      type: "prediction",
      prompt:
        "A function runs `ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)` then `defer cancel()`, and does `select { case <-time.After(200*time.Millisecond): fmt.Println(\"work done\") case <-ctx.Done(): fmt.Println(\"stopped:\", ctx.Err()) }`. Predict exactly what it prints and why.",
      expectedAnswer:
        "It prints `stopped: context deadline exceeded`. The 50ms timeout fires long before the 200ms work finishes, so `ctx.Done()` is closed first; that case wins the select, and `ctx.Err()` returns `context.DeadlineExceeded`, whose message is \"context deadline exceeded\".",
      hints: [
        "Which channel becomes ready first — the 200ms timer or the 50ms context deadline?",
        "After a deadline fires, does ctx.Err() return Canceled or DeadlineExceeded?",
      ],
    },
    {
      id: "go6cc-read-cancel-propagation",
      type: "code-reading",
      prompt:
        "Read: `parent, cancelP := context.WithCancel(context.Background()); child, cancelC := context.WithTimeout(parent, time.Hour); _ = cancelC; cancelP()`. State what happens to `child.Done()` and what `child.Err()` returns after `cancelP()` runs.",
      hints: [
        "Cancelling a parent context cancels all contexts derived from it.",
        "The child was cancelled because its parent was — not because its own one-hour deadline passed.",
      ],
    },
    {
      id: "go6cc-implement-worker",
      type: "implementation",
      prompt:
        "Implement `process` so it runs `doWork` on a goroutine but gives up after a 2-second timeout. Use `context.WithTimeout`, always release the context, and `select` on the result channel versus `ctx.Done()`. Return the result, or `ctx.Err()` if the timeout fires first.",
      starterCode:
        'package main\n\nimport (\n\t"context"\n\t"time"\n)\n\nfunc doWork() int {\n\ttime.Sleep(5 * time.Second) // pretend this is slow\n\treturn 42\n}\n\nfunc process(ctx context.Context) (int, error) {\n\t// give doWork at most 2 seconds, then give up\n\t// TODO: derive a timeout context, run doWork on a goroutine,\n\t// and select on its result vs ctx.Done()\n\treturn 0, nil\n}',
      expectedAnswer:
        'package main\n\nimport (\n\t"context"\n\t"time"\n)\n\nfunc doWork() int {\n\ttime.Sleep(5 * time.Second) // pretend this is slow\n\treturn 42\n}\n\nfunc process(parent context.Context) (int, error) {\n\tctx, cancel := context.WithTimeout(parent, 2*time.Second)\n\tdefer cancel() // ALWAYS release — even on the timeout path\n\n\tresult := make(chan int, 1) // buffered so the goroutine never blocks on send\n\tgo func() {\n\t\tresult <- doWork()\n\t}()\n\n\tselect {\n\tcase v := <-result:\n\t\treturn v, nil\n\tcase <-ctx.Done():\n\t\treturn 0, ctx.Err() // DeadlineExceeded after 2s\n\t}\n}',
      hints: [
        "context.WithTimeout returns both a ctx and a cancel func; defer cancel() immediately.",
        "Make the result channel buffered (capacity 1) so the abandoned goroutine's send never blocks if the timeout wins.",
      ],
    },
    {
      id: "go6cc-debug-leak",
      type: "debugging",
      prompt:
        "This worker is supposed to be cancellable, but goroutines pile up over time even after their contexts are cancelled. Explain the leak and fix it.\n\n```\nfunc watch(ctx context.Context, updates <-chan int) {\n    go func() {\n        for {\n            v := <-updates // waits here forever\n            fmt.Println(\"update\", v)\n        }\n    }()\n}\n```",
      hints: [
        "The goroutine blocks on `<-updates` and never looks at `ctx.Done()`, so cancelling the context does nothing to it.",
        "Cancellation is cooperative: a goroutine only stops if it actually selects on ctx.Done(). Add a select with a `case <-ctx.Done(): return` alongside the receive.",
      ],
    },
    {
      id: "go6cc-refactor-deadline",
      type: "refactoring",
      prompt:
        "A handler calls three DB queries in sequence, each with its own `context.WithTimeout(ctx, 5*time.Second)`. The overall request should never take more than 5 seconds total, but this lets it run up to 15. Refactor so all three queries share a single 5-second budget derived from the incoming request context.",
      hints: [
        "Derive one WithTimeout context at the top of the handler and pass that same ctx into all three queries.",
        "A deadline is absolute wall-clock time, so a context passed to later calls carries the time already spent — the budget shrinks as you go.",
      ],
    },
    {
      id: "go6cc-design-shutdown",
      type: "design",
      prompt:
        "Design how a server should cancel all in-flight work on shutdown. You have a root context, dozens of worker goroutines processing transactions, and a SIGTERM handler. Describe how cancellation propagates and why this is better than killing the process outright.",
      hints: [
        "Create the root context with WithCancel at startup; pass it (or children of it) into every worker; call cancel() when SIGTERM arrives.",
        "Cancelling lets workers observe ctx.Done(), stop cleanly, and roll back or finish partial writes — a hard kill leaves half-done transactions.",
      ],
    },
    {
      id: "go6cc-advanced-withvalue",
      type: "advanced",
      prompt:
        "A teammate stores the database handle and the current user's ID in the context with `context.WithValue` and pulls them out deep in the call stack. Explain what `WithValue` is actually for, why the DB handle is a misuse, and why the user ID (a request-scoped value) is borderline-acceptable.",
      hints: [
        "WithValue is for request-scoped data that crosses API boundaries — request IDs, auth tokens, trace spans — not for passing optional parameters or dependencies.",
        "A DB handle is a dependency: pass it explicitly as an argument. Hiding it in an untyped context key defeats the compiler and makes the function's real inputs invisible.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-cooperative",
      kind: "explain",
      description:
        "Explain, without notes, why Go cancellation is cooperative — that a Context signals via a closed Done channel and a goroutine must select on it to stop — and why cancellation can never be forced.",
      required: true,
    },
    {
      id: "predict-err",
      kind: "predict",
      description:
        "Given a context built with WithTimeout or WithCancel, correctly predict which select case runs and whether ctx.Err() returns Canceled or DeadlineExceeded.",
      required: true,
    },
    {
      id: "implement-cancellable",
      kind: "implement",
      description:
        "Write a function that runs work on a goroutine under a WithTimeout context, selects on the result versus ctx.Done(), and always calls cancel.",
      required: true,
    },
    {
      id: "design-shutdown",
      kind: "design",
      description:
        "Design a graceful-shutdown path where cancelling one root context propagates through a goroutine tree and stops every worker cleanly.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "You can now start goroutines and coordinate them with channels and select. But real backends need to answer a harder question: how do you tell work to *stop*? A client closes their browser tab mid-request; a query is taking too long and you'd rather give up than hang; the server is shutting down and needs every in-flight job to wind down cleanly. In all three cases, work is still running that nobody wants the result of anymore — and you need a way to say \"never mind, stop.\"\n\nThe naive instinct is that you should be able to reach in and kill a goroutine, the way you might kill a process. Go deliberately gives you no such button. Instead it gives you `context.Context`: a small value you pass into functions that carries a *cancellation signal* and an optional *deadline*. Cancellation in Go is **cooperative** — you signal that work should stop, and well-written goroutines watch for that signal and return on their own.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "Think of a manager who can't physically drag a worker away from their desk. What the manager *can* do is flip a big red 'we're done here' light that everyone can see. A conscientious worker glances at the light between tasks and, when it's on, packs up and leaves. A worker with their head down who never looks up keeps working forever. Context is that light; `ctx.Done()` is glancing at it.",
          },
        },
        {
          type: "points",
          items: [
            "A **`context.Context`** is a value you thread through function calls that carries a cancellation signal and optional deadline.",
            "Cancellation is **cooperative**: you signal 'stop', and goroutines must *choose* to observe the signal and return.",
            "There is no way to forcibly kill a goroutine — a goroutine that ignores the signal keeps running (and leaks).",
          ],
        },
      ],
    },
    naive: {
      body: "Coming from other languages, two wrong instincts show up immediately. The first is \"there must be a `thread.kill()` or `goroutine.cancel()` somewhere.\" There isn't. Forcibly stopping a goroutine mid-execution would leave locks held, files half-written, and transactions half-committed — so Go simply doesn't offer it.\n\nThe second instinct is to roll your own signal: pass a shared `stop bool` or a bare `chan struct{}` down to each goroutine. That can work for one goroutine, but it falls apart the moment you have a *tree* of them — a handler that calls a service that spawns three workers that each open a query. Now you're threading your ad-hoc stop channel through every layer by hand, and there's no standard way to also attach a deadline or a reason. Context is the standardized, composable version of exactly that idea.",
      blocks: [
        {
          type: "example",
          example: {
            title: "A hand-rolled stop channel — the idea context standardizes",
            language: "go",
            code:
              'func worker(stop <-chan struct{}) {\n\tfor {\n\t\tselect {\n\t\tcase <-stop: // someone closed stop → time to leave\n\t\t\treturn\n\t\tdefault:\n\t\t\tdoOneUnit()\n\t\t}\n\t}\n}\n\nfunc main() {\n\tstop := make(chan struct{})\n\tgo worker(stop)\n\ttime.Sleep(time.Second)\n\tclose(stop) // broadcast "stop" to every worker selecting on it\n}',
            takeaway:
              "This is the right idea — a closed channel broadcasts 'stop' (you saw close-as-broadcast in the channels lesson). Context wraps this pattern, adds deadlines and a reason (`ctx.Err()`), and gives it a tree structure so parents cancel children automatically.",
          },
        },
        {
          type: "points",
          items: [
            "There is no `kill()` for goroutines — forcing a stop would corrupt locks, files, and transactions.",
            "A hand-rolled `stop` channel works for one goroutine but doesn't scale to a tree or carry deadlines.",
            "Context is the standard library's composable version: cancellation + deadline + reason, with parent→child propagation.",
          ],
        },
      ],
    },
    failure: {
      body: "Skip cancellation and the failure is the quietest, most expensive kind: a **goroutine leak**. The work finishes from the caller's point of view — the handler returned, the client got a response — but a goroutine deep inside is still blocked, waiting on a channel or a query reply that will never come. It holds memory, maybe a database connection, forever. One leak is invisible; thousands, accumulated over days of traffic, exhaust the connection pool and take the service down.\n\nThe root cause is always the same: the caller gave up, but the callee was never told. Either no context was passed, or a context was passed but the goroutine never selected on `ctx.Done()`. A cancellation signal that nobody listens for is the same as no signal at all.",
      blocks: [
        {
          type: "scenario",
          scenario: {
            title: "The disconnect that leaks a goroutine per request",
            context:
              "A LedgerFlow endpoint starts a goroutine to compute an expensive report and reads the answer off a channel. The client frequently closes the connection early. Each abandoned request leaves its report goroutine blocked forever trying to send on a channel no one will read. Under load, goroutine count and DB connections climb until the service falls over.",
            insight:
              "The request's context was cancelled the instant the client disconnected — the signal was right there. But the report goroutine never selected on `ctx.Done()`, so it never noticed. Wiring `case <-ctx.Done(): return` into that goroutine turns the leak into a clean early exit.",
          },
        },
      ],
    },
    intuition: {
      body: "Here's the mental image that makes context click. A context is a **node in a tree**, and each node holds a `Done()` channel that starts open and gets *closed* exactly once — when this context is cancelled. Closing a channel, as you know, is a broadcast: every goroutine selecting on `<-ctx.Done()` wakes up at once. That's the entire signalling mechanism. There's nothing magic; it's the closed-channel-as-broadcast trick from the channels lesson, given a standard shape.\n\nThe tree part is what makes it powerful. When you *derive* a child context from a parent, you create a child node. Cancel the parent and every descendant's `Done()` closes too — cancellation flows *down* the tree. So one `cancel()` at the top of a request tears down the whole subtree of goroutines beneath it, no matter how deep. A child can also be cancelled on its own (its own timeout fires, say) without touching its parent.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "It's just a closed channel",
            text: "`ctx.Done()` returns a channel. Cancellation *is* closing that channel. Everything you learned about `close` in the channels lesson applies: a closed channel makes every `<-ch` return immediately, so `select { case <-ctx.Done(): ... }` unblocks for every waiter simultaneously.",
          },
        },
        {
          type: "points",
          items: [
            "Each context has a `Done()` channel that is **closed once**, when that context is cancelled.",
            "Deriving a child context builds a child node; cancelling a parent cancels every descendant.",
            "A child can be cancelled independently (e.g. its own timeout) without affecting the parent.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Reduce context to a handful of rules and it stops feeling mysterious. Every context tree has a **root**: `context.Background()`, an empty context that is never cancelled and has no deadline — use it in `main`, in tests, and at the top of a request. (`context.TODO()` is identical but signals \"I haven't decided which context belongs here yet\" — a placeholder you should later replace.)\n\nFrom a root you build **derived** contexts. `context.WithCancel(parent)` returns a child and a `cancel` function you call to cancel it. `context.WithTimeout(parent, d)` cancels itself automatically after duration `d`. `context.WithDeadline(parent, t)` does the same at an absolute time `t`. All three return `(ctx, cancel)`, and here is the rule you must never break: **always call `cancel`** — normally via `defer cancel()` — even when a timeout will fire on its own. `cancel` releases the resources the context holds (a timer, and its slot in the parent's child list); skipping it leaks them until the parent is cancelled. Finally, `ctx.Err()` tells you *why* it's done: `nil` while still active, `context.Canceled` if someone called cancel, `context.DeadlineExceeded` if a timeout/deadline fired.",
      blocks: [
        {
          type: "example",
          example: {
            title: "The core API in one place",
            language: "go",
            code:
              'ctx := context.Background() // root: never cancelled, no deadline\n\n// Manual cancellation:\nctx, cancel := context.WithCancel(ctx)\ndefer cancel() // ALWAYS — releases resources even if you also cancel elsewhere\n\n// Automatic cancellation after a duration:\nctx, cancel := context.WithTimeout(ctx, 3*time.Second)\ndefer cancel() // still required — releases the timer even after it fires\n\n// Automatic cancellation at an absolute time:\nctx, cancel := context.WithDeadline(ctx, time.Now().Add(3*time.Second))\ndefer cancel()\n\n// Why it stopped:\n<-ctx.Done()          // unblocks when cancelled\nswitch ctx.Err() {\ncase context.Canceled:         // someone called cancel()\ncase context.DeadlineExceeded: // a timeout/deadline fired\n}',
            takeaway:
              "Background is the root; WithCancel/WithTimeout/WithDeadline derive children and each returns a cancel you must call. ctx.Done() signals *that* it stopped; ctx.Err() says *why*.",
          },
        },
        {
          type: "note",
          note: {
            tone: "warning",
            title: "defer cancel() is not optional",
            text: "It is tempting to skip cancel() on a WithTimeout because \"it'll time out anyway.\" Don't. Until cancel runs, the context keeps a timer alive and stays linked in its parent's children — a resource leak the race detector won't catch but `go vet` will flag as a lost cancel. `defer cancel()` on the very next line, every time.",
          },
        },
      ],
    },
    mechanics: {
      body: "Now the precise version. `Context` is an interface with four methods, but you rarely implement it — you consume it. `Done() <-chan struct{}` returns the receive-only channel that closes on cancellation. `Err() error` returns why (`nil`, `Canceled`, or `DeadlineExceeded`). `Deadline() (time.Time, bool)` reports the deadline if one is set. `Value(key any) any` fetches a request-scoped value (covered below).\n\nBy firm convention, a `Context` is passed as the **first parameter** of a function, named `ctx`: `func Query(ctx context.Context, id int) (Row, error)`. This isn't cosmetic — it's why `net/http` and `database/sql` already thread cancellation for you. An `*http.Request` carries a context (`r.Context()`) that is cancelled when the client disconnects, and every `database/sql` method has a `...Context` variant (`QueryContext`, `ExecContext`) that aborts the query when the context is cancelled. Pass the request's context down and cancellation propagates through the standard library without any work from you.",
      blocks: [
        {
          type: "example",
          example: {
            title: "ctx first; the stdlib already respects it",
            language: "go",
            code:
              'func handler(w http.ResponseWriter, r *http.Request) {\n\tctx := r.Context() // cancelled automatically if the client disconnects\n\n\t// database/sql aborts this query if ctx is cancelled mid-flight:\n\trow := db.QueryRowContext(ctx, "SELECT balance FROM accounts WHERE id = $1", id)\n\n\tvar balance int64\n\tif err := row.Scan(&balance); err != nil {\n\t\t// if the client left, err will reflect the cancelled context\n\t\thttp.Error(w, err.Error(), http.StatusInternalServerError)\n\t\treturn\n\t}\n\tfmt.Fprintln(w, balance)\n}',
            takeaway:
              "You didn't write any cancellation logic here — passing r.Context() into QueryContext is enough. The context convention is what lets the standard library cancel your query when the caller gives up.",
          },
        },
        {
          type: "points",
          items: [
            "`Context` methods: `Done()` (closes on cancel), `Err()` (why), `Deadline()`, `Value()`.",
            "Convention: pass `ctx context.Context` as the **first argument**, named `ctx`.",
            "`net/http` (`r.Context()`) and `database/sql` (`QueryContext`/`ExecContext`) already honor context — thread it through and cancellation is free.",
          ],
        },
      ],
    },
    diagram: {
      body: "Two pictures carry this lesson. The first is the **context tree**: one root, children derived from it, and cancellation flowing downward — cancel the parent and every descendant's `Done()` closes. The second is the **select-on-Done** race that every cancellable goroutine runs: it waits on its real work *and* on `ctx.Done()` at the same time, and whichever fires first decides the outcome.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "The context tree: cancellation flows down",
            kind: "flow",
            nodes: [
              { id: "root", label: "context.Background()", detail: "the root — never cancelled, no deadline" },
              { id: "req", label: "WithCancel → request ctx", detail: "one per request; cancelled on disconnect or shutdown", tone: "accent" },
              { id: "q", label: "WithTimeout → query ctx", detail: "child with a 5s budget for a DB call" },
              { id: "w", label: "worker goroutines", detail: "each selects on its ctx.Done()", tone: "muted" },
            ],
            caption: "Cancel the request ctx and both the query ctx and the workers below it are cancelled too — one signal tears down the whole subtree.",
          },
        },
        {
          type: "diagram",
          diagram: {
            title: "Every cancellable goroutine races work against Done()",
            kind: "sequence",
            nodes: [
              { id: "wait", label: "select waits on two channels", detail: "the result channel AND ctx.Done()" },
              { id: "cancel", label: "caller cancels (or deadline fires)", detail: "ctx.Done() is closed", tone: "danger" },
              { id: "wake", label: "case <-ctx.Done() unblocks", detail: "the closed channel makes this case ready", tone: "accent" },
              { id: "exit", label: "goroutine returns ctx.Err()", detail: "clean early exit — no leak", tone: "success" },
            ],
            caption: "If work finishes first, the result case wins; if cancellation comes first, the Done case wins and the goroutine returns instead of blocking forever.",
          },
        },
      ],
    },
    implementation: {
      body: "The workhorse pattern is: **derive a context, run work on a goroutine, and `select` on the result versus `ctx.Done()`**. The result channel is buffered with capacity 1 — a detail that matters. If cancellation wins the race, the caller returns and stops reading the channel; a buffered slot means the abandoned goroutine's send still succeeds and it can exit, instead of blocking forever on a send nobody will receive (that would be the very leak we're trying to avoid — you saw this exact reasoning in the channels timeout exercise).\n\nInside long-running work, the pattern is to check `ctx.Done()` in the loop, so the work abandons itself promptly when cancelled rather than only at the end.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Run work under a timeout, select on Done()",
            language: "go",
            code:
              'func fetchBalance(parent context.Context, id int) (int64, error) {\n\tctx, cancel := context.WithTimeout(parent, 2*time.Second)\n\tdefer cancel() // release the timer no matter which case wins\n\n\tresult := make(chan int64, 1) // buffered: the goroutine can always send and exit\n\tgo func() {\n\t\tresult <- slowLookup(id) // pretend this hits a slow store\n\t}()\n\n\tselect {\n\tcase v := <-result:\n\t\treturn v, nil // work finished in time\n\tcase <-ctx.Done():\n\t\treturn 0, ctx.Err() // timed out or cancelled — DeadlineExceeded / Canceled\n\t}\n}',
            takeaway:
              "Derive → defer cancel → run on a goroutine → select on result vs ctx.Done(). The buffered channel guarantees the goroutine can exit even when the timeout wins, so nothing leaks.",
          },
        },
        {
          type: "example",
          example: {
            title: "A long-running loop that honors cancellation",
            language: "go",
            code:
              'func process(ctx context.Context, txs []Tx) error {\n\tfor _, tx := range txs {\n\t\tselect {\n\t\tcase <-ctx.Done():\n\t\t\treturn ctx.Err() // stop promptly; do not process the rest\n\t\tdefault:\n\t\t\tif err := save(ctx, tx); err != nil { // pass ctx down so the DB call is cancellable too\n\t\t\t\treturn err\n\t\t\t}\n\t\t}\n\t}\n\treturn nil\n}',
            takeaway:
              "Check ctx.Done() each iteration with a non-blocking select (the `default` runs the work when not cancelled). Pass ctx into `save` so cancellation reaches the DB query, not just the loop.",
          },
        },
        {
          type: "points",
          items: [
            "Derive → `defer cancel()` → goroutine → `select` on result vs `ctx.Done()`.",
            "Buffer the result channel (cap 1) so an abandoned goroutine can still send and exit — no leak.",
            "In loops, select on `ctx.Done()` each iteration and pass `ctx` into every call you make.",
          ],
        },
      ],
    },
    experiment: {
      body: "Predict before you read on — a wrong guess you correct sticks better than an answer you skimmed. Consider this program exactly as written:\n\n```\nfunc main() {\n    ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)\n    defer cancel()\n\n    select {\n    case <-time.After(1 * time.Second):\n        fmt.Println(\"work finished\")\n    case <-ctx.Done():\n        fmt.Println(\"gave up:\", ctx.Err())\n    }\n}\n```\n\nWhat prints? Commit to an answer.\n\nHere's the trace. The select waits on two channels: `time.After(1s)`, which becomes ready after one second, and `ctx.Done()`, which closes when the 50ms timeout fires. The context's 50ms deadline arrives *first* by a wide margin, so its channel closes and that case wins. The program prints **`gave up: context deadline exceeded`** — the string form of `context.DeadlineExceeded`, the error `ctx.Err()` returns after a timeout. The one-second timer never gets a chance. Change the timeout to `2*time.Second` and the other case wins instead, printing `work finished`. The lesson: `WithTimeout` is just a context whose `Done()` closes on a timer, and racing it against work with `select` is the whole cancellation pattern in miniature.",
    },
    "failure-cases": {
      body: "Almost every context bug is one of a handful of mistakes about *listening* for the signal or *releasing* the context. Here are the ones you'll actually hit.",
      blocks: [
        {
          type: "points",
          items: [
            "**Goroutine ignores `ctx.Done()`** → it blocks forever on a channel or query; cancelling does nothing. The #1 leak. Always add a `case <-ctx.Done(): return`.",
            "**Forgetting `defer cancel()`** → the context keeps a timer and a link to its parent alive until the parent is cancelled. `go vet` flags the lost cancel; fix it with `defer cancel()`.",
            "**Not passing `ctx` down the call chain** → an inner DB query keeps running after the caller gave up. Thread ctx into every call, especially `...Context` stdlib methods.",
            "**Unbuffered result channel with a timeout** → when the timeout wins, the worker's send blocks forever (no receiver) — a leak. Buffer the result channel with capacity 1.",
            "**Storing a Context in a struct** → couples a long-lived object to one request's lifetime; the wrong context gets used and cancellation misfires. Pass ctx as an argument instead.",
            "**Checking `ctx.Err()` when you meant `Done()`** → `Err()` returns nil while active; polling it in a tight loop burns CPU. Block on `<-ctx.Done()` (or select on it) instead of spinning on Err().",
          ],
        },
        {
          type: "example",
          example: {
            title: "The leak: a goroutine that never watches Done()",
            language: "go",
            code:
              '// BUG: cancelling ctx does nothing — this goroutine only watches jobs.\ngo func() {\n\tfor {\n\t\tjob := <-jobs // blocks here forever if no jobs arrive\n\t\thandle(job)\n\t}\n}()\n\n// FIX: race the real work against cancellation.\ngo func() {\n\tfor {\n\t\tselect {\n\t\tcase <-ctx.Done(): // cancellation now actually stops the goroutine\n\t\t\treturn\n\t\tcase job := <-jobs:\n\t\t\thandle(job)\n\t\t}\n\t}\n}()',
            takeaway:
              "A context you never select on is a signal nobody hears. Adding `case <-ctx.Done(): return` alongside the receive is what makes the goroutine actually cancellable.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "Context is the standard way to thread cancellation, but it has costs and edges worth naming so you use it deliberately.",
      blocks: [
        {
          type: "points",
          items: [
            "**Cooperative, not preemptive**: context is clean and safe, but a goroutine that doesn't check `Done()` can't be stopped — correctness depends on discipline everywhere, not one call site.",
            "**Threading ctx everywhere**: passing `ctx` as the first argument through every function is verbose, but it's the price of composable cancellation and the stdlib depends on it.",
            "**Timeout vs deadline**: `WithTimeout` is relative ('2s from now') and convenient; `WithDeadline` is absolute and better when a fixed wall-clock cutoff must be shared across calls.",
            "**`WithValue` is a sharp tool**: handy for request-scoped data crossing boundaries (request IDs, auth), but easy to abuse as a bag of hidden globals — it's untyped and invisible to the compiler.",
            "**Cancellation is one-shot**: a cancelled context stays cancelled; you can't reset it. Need a fresh signal? Derive a new context.",
          ],
        },
      ],
    },
    design: {
      body: "A few durable rules keep context code correct. Pass `ctx` as the first parameter and **never store it in a struct** — a Context describes the lifetime of one operation, so binding it to a long-lived object means later calls use a stale or wrong context. Derive a context as close as possible to where the work starts, `defer cancel()` on the next line, and pass the *same* ctx down so one deadline governs the whole subtree. Reserve `WithValue` for request-scoped values that genuinely cross API boundaries (a request ID, an auth token, a trace span) — never for optional parameters or dependencies like a DB handle, which belong in the function signature where the compiler can see them.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "warning",
            title: "Never store a Context in a struct",
            text: "It's tempting to stash `ctx` in a struct field to avoid passing it around. Don't. A struct usually outlives a single request, so its stored context becomes stale — you'll cancel the wrong work or none at all. Pass ctx explicitly as the first argument to each method that needs it; the Go blog 'Contexts and structs' is emphatic about this.",
          },
        },
        {
          type: "example",
          example: {
            title: "WithValue: request-scoped values only",
            language: "go",
            code:
              '// A private key type avoids collisions with other packages\' keys.\ntype ctxKey string\n\nconst requestIDKey ctxKey = "requestID"\n\n// OK: a request-scoped value that crosses API boundaries.\nctx = context.WithValue(ctx, requestIDKey, "req-abc-123")\n\nfunc logStep(ctx context.Context, msg string) {\n\tid, _ := ctx.Value(requestIDKey).(string) // type-assert back out\n\tlog.Printf("[%s] %s", id, msg)\n}\n\n// NOT OK: don\'t hide dependencies or optional params in the context.\n// ctx = context.WithValue(ctx, "db", dbHandle) // pass db as an argument instead',
            takeaway:
              "WithValue carries data that rides along with a request (IDs, auth, tracing) using an unexported key type. Dependencies and options are function arguments, not context payload.",
          },
        },
        {
          type: "points",
          items: [
            "Pass `ctx` first; **never** store it in a struct — it describes one operation's lifetime.",
            "Derive near the work, `defer cancel()` immediately, pass the same ctx down so one deadline governs the subtree.",
            "`WithValue` is for request-scoped values crossing boundaries, with an unexported key type — not for optional params or dependencies.",
          ],
        },
      ],
    },
    ledgerflow: {
      body: "This is exactly how LedgerFlow keeps shutdowns fast and requests honest. Every request handler starts from `r.Context()`, which Go cancels the instant the client disconnects. LedgerFlow threads that context into the service layer and on into every `QueryContext`/`ExecContext` call, so when a client abandons a request, the in-flight transaction processing and its DB queries stop rather than churning away on work no one will read. For a batch of related queries, the handler derives one `WithTimeout` child so the whole request shares a single time budget — one slow query can't blow past it.\n\nGraceful shutdown uses the tree. At startup LedgerFlow builds a root context with `WithCancel` and passes children of it into every worker goroutine. When SIGTERM arrives, it calls the root `cancel()` once: cancellation flows down the tree, every worker's `ctx.Done()` closes, and they stop and drain cleanly instead of being killed mid-write — no half-committed transactions.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "LedgerFlow: one cancel tears down all in-flight work",
            kind: "sequence",
            nodes: [
              { id: "sig", label: "SIGTERM arrives", detail: "operator or orchestrator asks the server to stop", tone: "danger" },
              { id: "cancel", label: "root cancel() called", detail: "the single WithCancel root is cancelled", tone: "accent" },
              { id: "prop", label: "Done() closes down the tree", detail: "every request ctx and worker ctx below it is cancelled" },
              { id: "drain", label: "workers observe ctx.Done()", detail: "they stop pulling work and finish or roll back the current unit" },
              { id: "exit", label: "process exits cleanly", detail: "no goroutine leak, no half-written transaction", tone: "success" },
            ],
            caption: "Cancellation propagates from one root down to every goroutine — the opposite of a hard kill that abandons in-flight writes.",
          },
        },
        {
          type: "points",
          items: [
            "Thread `r.Context()` into the service layer and every DB call so a client disconnect stops in-flight work.",
            "Give a batch of queries one shared `WithTimeout` budget instead of a fresh timeout per call.",
            "Cancel one `WithCancel` root on SIGTERM to stop every worker cleanly during shutdown.",
          ],
        },
      ],
    },
    exercises: {
      body: "Practice is what turns \"I read about context\" into \"I reach for `defer cancel()` and `select on Done()` without thinking.\" Work across predicting which case wins and what `ctx.Err()` returns, reading how cancellation propagates parent→child, implementing a timeout-bounded worker, debugging a goroutine that ignores `Done()`, refactoring three timeouts into one shared budget, designing a shutdown path, and reasoning about `WithValue` misuse. Each produces a different kind of evidence — do them, don't just read them.",
    },
    mastery: {
      body: "You've mastered this when you can explain why cancellation is cooperative and can never be forced, predict which select case runs and whether `ctx.Err()` is Canceled or DeadlineExceeded, write a function that runs work under a `WithTimeout` and selects on `ctx.Done()` while always calling cancel, and design a graceful-shutdown path where one root cancel propagates through a goroutine tree. Attest a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "One idea carries this lesson: **cancellation is a signal you propagate, not a force you apply**. A `context.Context` is a tree node whose `Done()` channel closes once when it's cancelled; goroutines that `select` on `ctx.Done()` stop cleanly, and goroutines that don't keep running and leak. Cancel a parent and the whole subtree cancels with it.",
      blocks: [
        {
          type: "points",
          items: [
            "`context.Background()` is the root; `WithCancel`/`WithTimeout`/`WithDeadline` derive children and each returns a `cancel` you must always call (`defer cancel()`).",
            "`ctx.Done()` is a channel that closes on cancellation; `ctx.Err()` says why — `Canceled` vs `DeadlineExceeded`.",
            "Cancellation is cooperative and flows parent→child: a goroutine only stops if it selects on `Done()`; pass `ctx` first and into every call.",
            "Never store a Context in a struct; use `WithValue` only for request-scoped values. `net/http` and `database/sql` already honor context. Next module builds on this concurrency foundation.",
          ],
        },
      ],
    },
  },
};
