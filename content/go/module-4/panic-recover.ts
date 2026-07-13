import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 4 — panic, recover, and the discipline of when to use them. Same
 * beginner-friendly voice as Modules 0–3: plain language, one analogy per hard
 * idea, a concrete example before the abstract rule. Careful and correct about
 * the fact that recover only works inside a deferred call, returns nil when
 * there is no panic, and that panic is reserved for unrecoverable programmer
 * errors — not the ordinary error values from the previous lesson.
 */
export const goPanicRecover: Lesson = {
  id: "go-panic-recover",
  slug: "panic-recover",
  title: "panic, recover & when to use them",
  description:
    "Understand how panic unwinds the stack running deferred calls, how recover stops that unwinding from inside a defer, and — most importantly — the discipline of reserving panic for unrecoverable programmer errors while handling ordinary failures with error values.",
  moduleId: "go-4",
  estimatedMinutes: 50,
  difficulty: "intermediate",
  prerequisites: ["go-functions-defer"],
  learningObjectives: [
    "Explain what panic does to the call stack and how deferred calls still run while it unwinds",
    "Use recover correctly — only inside a deferred function — and predict when it returns nil",
    "Reserve panic for unrecoverable programmer errors and keep recover at the edges, converting a panic into a 500 without crashing the server",
  ],
  concepts: ["panic", "recover", "deferred-recovery"],
  ledgerFlowApplications: [
    "Wrap each HTTP handler in a top-level recover that turns an unexpected panic into a logged 500, so one bad request cannot crash the whole API",
    "Keep panic out of ordinary paths — a missing account or a bad amount is a returned error, never a panic",
    "Recover inside any goroutine LedgerFlow spawns, since a panic in a goroutine with no recover takes down the entire process",
  ],
  references: [
    {
      title: "Defer, Panic, and Recover",
      url: "https://go.dev/blog/defer-panic-and-recover",
      teaches: "How panic unwinds the stack running deferred calls, and how recover regains control from inside a defer.",
      relevance: "The official narrative this lesson's mechanics and implementation stages are built on.",
      required: true,
      section: "Panic and Recover",
    },
    {
      title: "The Go Programming Language Specification — Handling panics",
      url: "https://go.dev/ref/spec#Handling_panics",
      teaches: "The normative rules for what panic and recover do, including that recover returns nil outside a panicking deferred call.",
      relevance: "Settles the exact recover-returns-nil and deferred-only behavior the lesson turns on.",
      required: true,
      section: "Handling panics",
    },
    {
      title: "Effective Go — Recover",
      url: "https://go.dev/doc/effective_go#recover",
      teaches: "The idiomatic library-boundary use of recover to contain a failure without propagating a panic to callers.",
      relevance: "Grounds the design rule that recover belongs at edges, converting panics into errors.",
      required: false,
      section: "Recover",
    },
  ],
  exercises: [
    {
      id: "go4pr-predict-defers-run",
      type: "prediction",
      prompt:
        "A function does `defer fmt.Println(\"cleanup\")`, then calls `panic(\"boom\")`, then has a line `fmt.Println(\"after panic\")`. Predict exactly what prints (and what does not) before the program crashes.",
      expectedAnswer:
        "\"cleanup\" prints; \"after panic\" does not. panic stops normal execution immediately, so the line after it never runs, but deferred calls still run as the stack unwinds — so the cleanup fires, then the program crashes with \"boom\".",
      hints: ["panic halts the current sequence of statements right away.", "Deferred calls still run while the panic unwinds the stack."],
    },
    {
      id: "go4pr-read-recover-nil",
      type: "code-reading",
      prompt:
        "Read `defer func() { fmt.Println(recover()) }()` in a function that returns normally without ever panicking. State what it prints and explain why.",
      hints: ["recover only returns a non-nil value when there is an active panic.", "With no panic in flight, recover returns nil."],
    },
    {
      id: "go4pr-implement-safe-handler",
      type: "implementation",
      prompt:
        "Complete safeHandler so that if the wrapped work panics, the panic is caught, logged, and turned into a 500 response instead of crashing the server. The recover must be in the right place to actually catch the panic.",
      starterCode:
        'package main\n\nimport (\n  "log"\n  "net/http"\n)\n\nfunc safeHandler(w http.ResponseWriter, r *http.Request) {\n  // recover any panic from doWork and turn it into a 500\n\n  doWork(w, r) // may panic on a programmer bug\n}\n\nfunc doWork(w http.ResponseWriter, r *http.Request) {\n  var m map[string]int\n  m["count"] = 1 // panics: assignment to entry in nil map\n}',
      expectedAnswer:
        'func safeHandler(w http.ResponseWriter, r *http.Request) {\n  defer func() {\n    if rec := recover(); rec != nil {\n      log.Printf("handler panic: %v", rec)\n      http.Error(w, "internal server error", http.StatusInternalServerError)\n    }\n  }()\n  doWork(w, r)\n}',
      hints: [
        "recover only works inside a deferred function, so the recover must live in a deferred closure that runs before safeHandler returns.",
        "Guard on `if rec := recover(); rec != nil` so the success path is untouched, then write the 500.",
      ],
    },
    {
      id: "go4pr-debug-goroutine-crash",
      type: "debugging",
      prompt:
        "A developer relied on net/http's built-in per-request recovery, but their handler launches `go processInBackground(job)` and that goroutine panics. The whole server crashes anyway. Explain why the server's recovery didn't save them and give the fix.",
      hints: [
        "A recover only catches panics on its own goroutine's stack; net/http's recovery runs on the request goroutine, not the one you spawned.",
        "A panic in a goroutine with no recover of its own crashes the entire process — add a deferred recover inside the goroutine.",
      ],
    },
    {
      id: "go4pr-refactor-panic-to-error",
      type: "refactoring",
      prompt:
        "A `parseAmount(s string)` function calls `panic(\"invalid amount\")` when the input doesn't parse. Callers hate it because a bad request from a user crashes their code. Refactor it to report the failure the idiomatic Go way.",
      hints: [
        "A malformed user input is an ordinary, expected failure — not an unrecoverable programmer bug — so it should be a returned error.",
        "Change the signature to `(Amount, error)` and return the error instead of panicking.",
      ],
    },
    {
      id: "go4pr-design-boundary",
      type: "design",
      prompt:
        "Design where recover should and should not live in a small web service with handlers, a service layer, and a store layer. State the single place recover belongs and why the inner layers should never recover.",
      hints: [
        "Inner layers should return errors, not swallow panics, so bugs stay visible during development.",
        "One recover at the outermost edge (per request, per goroutine) contains the blast radius without hiding logic bugs from the layers below.",
      ],
    },
    {
      id: "go4pr-advanced-named-return",
      type: "advanced",
      prompt:
        "Using a named return value, write a function `doTx() (err error)` whose deferred function recovers from a panic and converts it into a returned error — so the caller sees an ordinary error rather than a crash — while leaving the non-panic path returning nil. Explain why this requires a named return.",
      hints: [
        "A deferred closure can read and reassign a named return value after the function's body has stopped.",
        "Inside the defer, `if rec := recover(); rec != nil { err = fmt.Errorf(\"recovered: %v\", rec) }` sets the return value only when a panic happened.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-unwind",
      kind: "explain",
      description:
        "Explain, without notes, what panic does to the call stack, why deferred calls still run during unwinding, and what recover does when called inside a deferred function versus outside one.",
      required: true,
    },
    {
      id: "predict-recover-nil",
      kind: "predict",
      description:
        "Correctly predict recover's return value in both cases: during an active panic (the panic value) and with no panic in flight (nil).",
      required: true,
    },
    {
      id: "implement-edge-recovery",
      kind: "implement",
      description:
        "Write a top-level recover in a handler or goroutine that converts a panic into a logged error or 500 without crashing the process.",
      required: true,
    },
    {
      id: "design-panic-policy",
      kind: "design",
      description:
        "Decide, for a set of realistic failures, which deserve a panic (unrecoverable programmer errors) and which are ordinary errors — and defend where recover belongs.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "In the last lesson you learned Go's normal way to signal that something went wrong: return an `error` value and let the caller check it. That covers the failures you *expect* — a file that isn't there, a number that won't parse, a user who typed nonsense. But Go has a second, louder mechanism, **panic**, and beginners reach for it far too often because it feels like the `throw` they knew in other languages.\n\nA **panic** is Go's way of saying \"something is so broken that continuing normally makes no sense\" — it stops the current work immediately and starts tearing the program down. The problem this lesson solves is knowing *which* mechanism to use. Use panic where an error belongs and you turn a routine bad request into a crashed server. Use it correctly and it stays a rare, honest signal of a real bug.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "An `error` is like a waiter telling you the kitchen is out of the fish — expected, handled, you just order something else. A `panic` is the fire alarm: everyone stops what they're doing and evacuates. You do not pull the fire alarm because the fish is off.",
          },
        },
        {
          type: "points",
          items: [
            "`panic` stops normal execution and begins unwinding the call stack.",
            "`recover` can catch a panic — but *only* from inside a deferred function.",
            "The hard rule: panic is for **unrecoverable programmer errors** (bugs, impossible states), not for the ordinary failures you handle with error values.",
          ],
        },
      ],
    },
    naive: {
      body: "Coming from languages with exceptions, the instinct is: \"if something goes wrong, throw, and catch it somewhere up top.\" Translated to Go, that becomes \"panic on any failure and recover in one big handler.\" It looks tidy — no error returns cluttering the code — and it even seems to work.\n\nThe trouble is that panic and recover are not exceptions. They are a blunt, whole-stack mechanism meant for the rare case where the program's assumptions are already violated. Using them for ordinary failures hides those failures from the type system, makes control flow invisible, and — as you'll see — quietly breaks the moment a goroutine is involved.",
      blocks: [
        {
          type: "example",
          example: {
            title: "panic used where an error belongs",
            language: "go",
            code:
              'func parseAmount(s string) int {\n    n, err := strconv.Atoi(s)\n    if err != nil {\n        panic("invalid amount: " + s) // WRONG: a bad user input is not a bug\n    }\n    return n\n}\n\nfunc handler(w http.ResponseWriter, r *http.Request) {\n    amount := parseAmount(r.FormValue("amount")) // a typo here can crash the request\n    _ = amount\n}',
            takeaway:
              "A user typing \"abc\" is a normal, expected failure. Panicking on it turns routine bad input into a stack unwind — an error return is the right tool.",
          },
        },
        {
          type: "points",
          items: [
            "Exceptions-everywhere does not translate to Go; panic is not a general control-flow tool.",
            "Ordinary, expected failures should stay as `error` values the caller checks.",
          ],
        },
      ],
    },
    failure: {
      body: "The exceptions-style approach fails in a way that's easy to miss until production. As long as everything runs on one goroutine and you have a recover somewhere above, it limps along. But panic's reach is exactly one goroutine's stack — and the moment work moves to a new goroutine, a recover on the original stack can't see it.\n\nThe root cause is a mismatch of scope: people imagine recover as a program-wide safety net, but it is local to the deferred call on the panicking goroutine. A panic in a goroutine with no recover **of its own** doesn't get caught by anyone — it crashes the entire process.",
      blocks: [
        {
          type: "scenario",
          scenario: {
            title: "The background goroutine that took down the whole server",
            context:
              "A team knew net/http recovers from panics per request, so they stopped worrying about panics. One handler kicked off `go sendReceiptEmail(order)` to avoid blocking the response. When a malformed order made that function panic, there was no recover on the new goroutine — and the entire server process died, dropping every in-flight request, not just the one.",
            insight:
              "net/http's recovery protects the *request* goroutine. Any goroutine you start yourself is on its own — it needs its own deferred recover, or one panic ends the whole program.",
          },
        },
      ],
    },
    intuition: {
      body: "Here's the mental image. Calling functions builds a stack of paused frames, like a stack of plates — each call sets a plate on top, each return takes one off. A **panic** flips that: instead of returning normally, it starts throwing plates off the top one by one, running each frame's deferred calls as it goes, until the stack is empty and the program crashes.\n\n**recover** is the one thing that can stop the throwing. But it can only act during the split second a frame's deferred call is running — that's the only moment Go lets you say \"stop, I'll take it from here.\" Catch it there and the unwinding halts; the function containing that defer returns normally, and the program lives on.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "Why recover must be inside a defer",
            text: "Deferred calls are the *only* code that runs while a panic unwinds a frame. So the only place you can intercept a panic is inside a deferred function — a bare `recover()` anywhere else runs when there's no panic in flight and simply returns nil.",
          },
        },
        {
          type: "points",
          items: [
            "A panic unwinds the stack frame by frame, running each frame's deferred calls on the way.",
            "`recover` stops the unwinding, but only from inside a deferred function.",
            "If nothing recovers, the unwinding reaches the top of the goroutine and the program crashes.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Keep three rules and panic/recover stop being mysterious. **Rule 1: panic stops the normal flow immediately** — the lines after `panic(...)` in that function never run, but deferred calls do run as the stack unwinds. **Rule 2: recover only does something inside a deferred function that's running because of a panic** — call it anywhere else and it returns nil. **Rule 3: recover returns the value passed to panic**, so you can inspect or log it; if there was no panic, it returns nil, which is exactly how you tell the two situations apart.\n\nThat nil is the whole trick behind the standard pattern: `if rec := recover(); rec != nil { ... }` runs its body *only* when a panic actually happened, leaving the normal return path completely untouched.",
      blocks: [
        {
          type: "example",
          example: {
            title: "recover returns nil when there's no panic",
            language: "go",
            code:
              'func calm() {\n    defer func() {\n        // no panic happened, so recover() is nil and this branch is skipped\n        if rec := recover(); rec != nil {\n            fmt.Println("recovered:", rec)\n        }\n    }()\n    fmt.Println("all good") // returns normally; the deferred recover sees nil\n}\n// Output:\n// all good',
            takeaway:
              "With no panic in flight, `recover()` is nil, so the guarded branch never runs. The same deferred code is harmless on the happy path and active only on a panic.",
          },
        },
        {
          type: "note",
          note: {
            tone: "warning",
            title: "Common trap",
            text: "`recover()` called directly in the function body (not inside a deferred call) always returns nil — even mid-panic — because by the time a panic is unwinding, only deferred calls run. Recovering \"in place\" simply does not work.",
          },
        },
      ],
    },
    mechanics: {
      body: "Now the precise version. `panic(v)` takes any value `v` (often a string or an `error`), stops the current function's normal execution, and begins unwinding: for each frame on the way up, Go runs that frame's deferred calls, then discards the frame. If the unwinding reaches the top of the goroutine with no recover, the runtime prints the panic value and a stack trace and terminates the whole program.\n\n`recover()` is a built-in that returns the value given to the active panic. Called inside a deferred function while a panic is unwinding, it *stops* the unwinding: control does not keep climbing the stack; instead the function whose defer recovered returns normally to its caller. Called at any other time — no panic, or not inside a defer — it returns nil and does nothing else. Both are built-ins; you don't import anything.",
      blocks: [
        {
          type: "example",
          example: {
            title: "A deferred recover stops the unwinding",
            language: "go",
            code:
              'func safeDivide(a, b int) (result int, err error) {\n    defer func() {\n        if rec := recover(); rec != nil {\n            err = fmt.Errorf("recovered: %v", rec) // named return set here\n        }\n    }()\n    return a / b, nil // b == 0 panics with a runtime error\n}\n\nfunc main() {\n    r, err := safeDivide(10, 0)\n    fmt.Println(r, err) // 0 recovered: runtime error: integer divide by zero\n}',
            takeaway:
              "The divide-by-zero panic unwinds into safeDivide's deferred call, recover catches it, and the named return `err` is set — so the caller gets an ordinary error instead of a crash.",
          },
        },
        {
          type: "points",
          items: [
            "`panic(v)` unwinds the stack, running deferred calls; unrecovered, it crashes the program.",
            "`recover()` returns the panic value inside a deferred call, and nil otherwise.",
            "Recovering into a **named return** lets you convert a panic into a returned error the caller can handle.",
          ],
        },
      ],
    },
    diagram: {
      body: "The clearest way to feel this is to watch a panic travel up the stack. Below, `main` calls `outer`, which calls `inner`, which panics. Read the sequence: the panic climbs frame by frame, running each defer, until `outer`'s deferred recover catches it and normal flow resumes.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "A panic unwinds until a deferred recover catches it",
            kind: "sequence",
            nodes: [
              { id: "call", label: "main → outer → inner", detail: "three frames stacked, inner on top" },
              { id: "panic", label: "inner calls panic(\"boom\")", detail: "normal execution in inner stops now", tone: "danger" },
              { id: "u1", label: "unwind inner", detail: "inner's deferred calls run, frame discarded" },
              { id: "u2", label: "unwind into outer", detail: "outer's deferred func runs — and calls recover()", tone: "accent" },
              { id: "caught", label: "recover() returns \"boom\"", detail: "unwinding STOPS here", tone: "success" },
              { id: "resume", label: "outer returns normally to main", detail: "program lives; main never saw a panic", tone: "success" },
            ],
            caption: "The panic climbs the stack running defers; outer's deferred recover halts it, so outer returns normally and main continues.",
          },
        },
      ],
    },
    implementation: {
      body: "The one pattern worth memorizing is the **edge recover**: at the outer boundary of a request or a goroutine, a deferred closure recovers any panic, logs it, and turns it into a safe response instead of a crash. This keeps a single buggy request from taking down the server, while still surfacing the bug in your logs so you can fix it. Note that Go's own `net/http` already wraps each request in recovery like this — but any goroutine *you* spawn is not covered, so you add your own there.",
      blocks: [
        {
          type: "example",
          example: {
            title: "The edge recover — panic becomes a logged 500",
            language: "go",
            code:
              'func recoverMiddleware(next http.Handler) http.Handler {\n    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {\n        defer func() {\n            if rec := recover(); rec != nil {\n                log.Printf("panic serving %s: %v", r.URL.Path, rec)\n                http.Error(w, "internal server error", http.StatusInternalServerError)\n            }\n        }()\n        next.ServeHTTP(w, r) // if a handler panics, the defer above catches it\n    })\n}\n\n// A goroutine you start yourself needs its OWN recover:\ngo func() {\n    defer func() {\n        if rec := recover(); rec != nil {\n            log.Printf("background task panic: %v", rec)\n        }\n    }()\n    processInBackground(job)\n}()',
            takeaway:
              "One deferred recover at the edge converts an unexpected panic into a 500 and a log line. Because recover is per-goroutine, each goroutine you launch needs its own.",
          },
        },
        {
          type: "points",
          items: [
            "Put recover at the outermost edge: per HTTP request, and inside every goroutine you spawn.",
            "Log the panic value so the underlying bug stays visible — recover contains the damage, it doesn't fix the bug.",
            "`net/http` recovers the request goroutine for you; goroutines you start are your responsibility.",
          ],
        },
      ],
    },
    experiment: {
      body: "Predict before you read on — a wrong guess you correct sticks better than a right answer you skimmed. Consider this function, which recovers *directly* in its body instead of inside a defer:\n\n```\nfunc tryRecover() {\n    fmt.Println(\"start\")\n    panic(\"boom\")\n    if rec := recover(); rec != nil { // reached only if we get here\n        fmt.Println(\"recovered:\", rec)\n    }\n    fmt.Println(\"end\")\n}\n```\n\nDoes this catch the panic? What prints? Commit to an answer.\n\nHere's the trace. `panic(\"boom\")` stops normal execution *immediately* — so the very next line, the `recover()` call, is never reached. Nothing in the function body after a panic runs; only deferred calls do. Since there is no deferred recover here, the panic unwinds straight past this frame and crashes the program. Output: just `start`, then a crash. This is the single most common mistake: recover must live in a **deferred** function, because that's the only code that runs while a panic unwinds. Move that `if rec := recover()...` block into a `defer func() { ... }()` at the top and it would catch the panic.",
    },
    "failure-cases": {
      body: "The failures here cluster around two misunderstandings: *where* recover works, and *what* deserves a panic in the first place. Here are the ones you'll actually meet — the first three are the real runtime panics you'll trip on most.",
      blocks: [
        {
          type: "points",
          items: [
            "**Writing to a nil map** → `assignment to entry in nil map`; a `map` declared but never made with `make` (or a literal) panics on write. This is a programmer error — initialize the map.",
            "**Index out of range** → `slice[i]` with `i` past the length panics; validate the index or length before indexing.",
            "**Nil pointer dereference** → calling a method or reading a field on a nil pointer panics; check for nil first. These three are bugs, so a panic is the *correct* signal — fix the code, don't recover in place.",
            "**recover outside a defer** → returns nil and catches nothing; it must be inside a deferred function.",
            "**Expecting recover to be program-wide** → it's per-goroutine; a spawned goroutine needs its own recover or one panic crashes everything.",
            "**Panicking on ordinary failures** → bad input, missing rows, network hiccups are errors, not panics; returning them keeps callers in control.",
          ],
        },
        {
          type: "example",
          example: {
            title: "A real panic: writing to a nil map",
            language: "go",
            code:
              'var counts map[string]int          // declared, but nil — never made\ncounts["clicks"]++                 // panic: assignment to entry in nil map\n\n// Fix: make the map before writing.\ncounts = make(map[string]int)\ncounts["clicks"]++                 // fine\n\n// Reading a nil map is safe (returns the zero value); only writing panics.\nvar other map[string]int\nfmt.Println(other["x"])            // prints 0, no panic',
            takeaway:
              "A nil-map write is a programmer bug, so panicking is Go's correct, loud signal. The fix is to initialize the map — not to wrap the write in a recover.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "panic and recover are powerful, and the power cuts both ways. None of these should scare you off — they mark where to think twice.",
      blocks: [
        {
          type: "points",
          items: [
            "**panic vs error**: panic is loud and unmissable for real bugs, but it's the wrong tool for expected failures — those belong in return values callers can handle.",
            "**recover at the edge**: contains the blast radius of one request, but if you recover too deeply (in inner layers) you hide real bugs and make debugging miserable.",
            "**converting panic to error**: lets a library present a clean error surface, but overusing it turns panic into disguised control flow — reserve it for genuine boundaries.",
            "**recover's per-goroutine scope**: keeps failures local, but means every goroutine you spawn is a separate crash risk you must guard.",
          ],
        },
      ],
    },
    design: {
      body: "A few durable rules. Default to returning errors; reach for panic only when a program invariant is already broken — an impossible state, a bug that means continuing would be worse than stopping. Keep recover at the outermost edges (per request, per goroutine) and never in the inner service or store layers, so bugs stay visible where you can fix them. When a library must not leak a panic to its callers, recover at its public boundary and return an error instead.",
      blocks: [
        {
          type: "points",
          items: [
            "Errors are the default; panic is reserved for unrecoverable programmer errors.",
            "recover lives only at edges — per request and inside each spawned goroutine — never in inner layers.",
            "At a library boundary, convert a panic into a returned error so callers stay in control.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Where recover belongs in a layered service",
            context:
              "A service has thin HTTP handlers, a service layer with the business logic, and a store layer that talks to the database. A bug somewhere deep could panic.",
            insight:
              "Put exactly one recover at the request edge (plus one in any goroutine). The service and store layers return errors and never recover — so logic bugs surface loudly in development, while in production a single panic becomes a 500 instead of an outage.",
          },
        },
      ],
    },
    ledgerflow: {
      body: "This is exactly how LedgerFlow's API stays up. Every request passes through one recovery middleware: if a handler hits an unexpected panic — a nil-map write, an index out of range, a nil dereference from some code path nobody tested — the deferred recover logs it with the request path and returns a plain 500, so that one bad request fails alone instead of taking the server down with it. The business rules underneath never panic for ordinary problems: a missing account, an overdraft, a malformed amount are all returned errors that flow back as a clean 4xx.\n\nAnd because recover is per-goroutine, any background work LedgerFlow spawns — sending a receipt, recalculating a rollup — carries its own deferred recover. A panic there is logged and contained, never allowed to escape and crash the process that's still serving live requests.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "A LedgerFlow request: panic contained at the edge",
            kind: "sequence",
            nodes: [
              { id: "mw", label: "recovery middleware", detail: "defer recover() armed for this request", tone: "accent" },
              { id: "h", label: "handler → service → store", detail: "ordinary failures return errors (4xx)" },
              { id: "bug", label: "unexpected panic (e.g. nil map)", detail: "a real bug on some path", tone: "danger" },
              { id: "rec", label: "middleware recover catches it", detail: "logs path + panic value" },
              { id: "resp", label: "return 500, server stays up", detail: "only this request fails", tone: "success" },
            ],
            caption: "Ordinary failures are errors; a genuine bug panics, is caught once at the edge, logged, and turned into a 500 — the server keeps serving everyone else.",
          },
        },
      ],
    },
    exercises: {
      body: "Practice is what turns \"I read about panic\" into \"I reach for the right tool without thinking.\" Work across predicting what runs during a panic, reading recover's nil behavior, implementing an edge recover, debugging a goroutine crash, refactoring a misused panic into an error, and designing where recovery belongs. Each produces a different kind of evidence — do them, don't just read them.",
    },
    mastery: {
      body: "You've mastered this when you can explain what panic does to the stack and why deferred calls still run, predict recover's value both during a panic and when there's none, write an edge recover that turns a panic into a logged 500 without crashing the process, and decide which realistic failures deserve a panic versus an error. Attest a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "Three ideas carry this lesson. **panic unwinds the stack** running deferred calls on the way, and crashes the program if nothing catches it. **recover only works inside a deferred function** — it returns the panic value there and nil everywhere else, which is how the standard `if rec := recover(); rec != nil` guard stays inert on the happy path. And the discipline that matters most: **panic is for unrecoverable programmer errors; ordinary failures are error values.** Keep recover at the edges — per request and per goroutine — and one bad request becomes a 500, not an outage.",
      blocks: [
        {
          type: "points",
          items: [
            "panic stops normal flow and unwinds the stack, running defers; unrecovered, it crashes the whole program.",
            "recover returns the panic value only inside a deferred call, and nil otherwise — so it must live in a defer.",
            "Reserve panic for real bugs (nil-map write, index out of range, nil deref); handle expected failures with errors.",
            "recover is per-goroutine: guard every goroutine you spawn. Next up: methods and interfaces.",
          ],
        },
      ],
    },
  },
};
