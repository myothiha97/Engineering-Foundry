import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 6 — goroutines and the Go scheduler. Same beginner-friendly voice as
 * Modules 0–5: plain language, one analogy per hard idea, a concrete example
 * before the abstract rule. Correct and careful about the GMP model, blocking,
 * and the main-returns-kills-everything trap. Channels are deliberately left to
 * the next lesson; sync.WaitGroup is introduced only briefly.
 */
export const goGoroutinesScheduler: Lesson = {
  id: "go-goroutines-scheduler",
  slug: "goroutines-scheduler",
  title: "Goroutines & the scheduler",
  description:
    "Start concurrent work with `go f()`, understand how the runtime multiplexes many goroutines onto a few threads, and never let main return while work is still running.",
  moduleId: "go-6",
  estimatedMinutes: 55,
  difficulty: "advanced",
  prerequisites: ["go-functions-defer"],
  learningObjectives: [
    "Start a goroutine with `go f()` and explain why it is far cheaper than an OS thread",
    "Reason about how the runtime scheduler multiplexes goroutines onto threads using the GMP model, and what happens when a goroutine blocks",
    "Recognise that a program exits when main returns, and wait for outstanding goroutines instead of leaking them",
  ],
  concepts: ["goroutines", "scheduler", "GMP", "blocking"],
  ledgerFlowApplications: [
    "Process a batch of transactions concurrently instead of one strictly after another",
    "Cap parallelism to the number of CPUs so the database and CPU are not oversubscribed",
    "Wait for every in-flight transaction to finish before the request handler returns its response",
  ],
  references: [
    {
      title: "A Tour of Go — Goroutines",
      url: "https://go.dev/tour/concurrency/1",
      teaches: "The basic syntax and meaning of `go f()` and that goroutines run in the same address space.",
      relevance: "The canonical first introduction to starting a goroutine, which this lesson builds on.",
      required: true,
      section: "Goroutines",
    },
    {
      title: "Effective Go — Goroutines",
      url: "https://go.dev/doc/effective_go#goroutines",
      teaches: "Why goroutines are cheap, how they are multiplexed onto OS threads, and how blocking is handled.",
      relevance: "Grounds the mental model of many goroutines over a few threads with the official explanation.",
      required: true,
      section: "Goroutines",
    },
    {
      title: "The Go Programming Language Specification — Go statements",
      url: "https://go.dev/ref/spec#Go_statements",
      teaches: "The normative rules for the `go` statement, including when its function and arguments are evaluated.",
      relevance: "Settles exactly what `go f(x)` evaluates immediately versus what runs concurrently.",
      required: false,
      section: "Go statements",
    },
  ],
  exercises: [
    {
      id: "go6gs-predict-exit",
      type: "prediction",
      prompt:
        "A program's main function runs `go fmt.Println(\"hello from goroutine\")` and then immediately returns, with nothing after it. Predict whether the line reliably prints, and explain why.",
      expectedAnswer:
        "It usually prints nothing. `go` starts the goroutine but does not wait; main returns almost immediately, the program exits, and the runtime kills the not-yet-scheduled goroutine before it runs.",
      hints: [
        "Starting a goroutine does not pause the goroutine that started it.",
        "What happens to every other goroutine the moment main returns?",
      ],
    },
    {
      id: "go6gs-read-argeval",
      type: "code-reading",
      prompt:
        "Read `i := 1; go fmt.Println(i); i = 2`. State what the goroutine prints and explain which value it captures, given the rules for the `go` statement.",
      hints: [
        "The go statement evaluates the function value and its arguments when the go statement executes, not when the goroutine later runs.",
        "So the argument is frozen at 1, just like a deferred call's arguments are frozen at the defer line.",
      ],
    },
    {
      id: "go6gs-implement-wait",
      type: "implementation",
      prompt:
        "Fix runAll so that all three greetings are guaranteed to print before the function returns, using a sync.WaitGroup.",
      starterCode:
        'package main\n\nimport (\n  "fmt"\n)\n\nfunc runAll(names []string) {\n  for _, name := range names {\n    go fmt.Println("hello", name)\n  }\n  // the goroutines may not have run yet when runAll returns\n}',
      expectedAnswer:
        'package main\n\nimport (\n  "fmt"\n  "sync"\n)\n\nfunc runAll(names []string) {\n  var wg sync.WaitGroup\n  for _, name := range names {\n    wg.Add(1)\n    go func() {\n      defer wg.Done()\n      fmt.Println("hello", name)\n    }()\n  }\n  wg.Wait()\n}',
      hints: [
        "Call wg.Add(1) before starting each goroutine, and defer wg.Done() inside it.",
        "Call wg.Wait() after the loop so runAll blocks until every goroutine has finished.",
      ],
    },
    {
      id: "go6gs-debug-leak",
      type: "debugging",
      prompt:
        "A handler starts `go processTransaction(tx)` for each transaction and returns its HTTP response straight away. In tests it looks fast, but in production some transactions are never persisted and the count is wrong. Explain the bug and the fix.",
      hints: [
        "The handler does not wait for the goroutines, so the response (and sometimes the process) can finish before the work does.",
        "Wait for the goroutines with a WaitGroup before responding, or only start background work whose lifetime you actually manage.",
      ],
    },
    {
      id: "go6gs-design-pool",
      type: "design",
      prompt:
        "You must process 100,000 transactions concurrently, but each one touches a database with only 20 connections. Explain why launching 100,000 goroutines at once is a problem here even though goroutines are cheap, and sketch how you would cap concurrency.",
      hints: [
        "Goroutines are cheap, but the database connections and CPU are not — starting all of them oversubscribes those scarce resources.",
        "Bound the number running at once (for example a fixed pool of worker goroutines) so no more than ~20 are in flight.",
      ],
    },
    {
      id: "go6gs-advanced-gomaxprocs",
      type: "advanced",
      prompt:
        "Explain the difference between concurrency and parallelism in terms of GMP. If GOMAXPROCS is 1, can two goroutines still make progress? What changes when GOMAXPROCS is 4?",
      hints: [
        "Concurrency is many goroutines in progress (interleaved); parallelism is many running at the exact same instant.",
        "GOMAXPROCS sets the number of P's, which caps how many goroutines run truly simultaneously — with 1 P they interleave on one thread; with 4 P's up to 4 run at once.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-cheap",
      kind: "explain",
      description:
        "Explain, without notes, why a goroutine is much cheaper than an OS thread and how the runtime runs many of them on a few threads.",
      required: true,
    },
    {
      id: "predict-exit",
      kind: "predict",
      description:
        "Correctly predict what a program prints when main returns before a goroutine it started has a chance to run.",
      required: true,
    },
    {
      id: "implement-wait",
      kind: "implement",
      description:
        "Write code that starts several goroutines and reliably waits for all of them to finish before continuing.",
      required: true,
    },
    {
      id: "design-bounded",
      kind: "design",
      description:
        "Design a concurrent workload that caps parallelism to a scarce resource and defend the bound you chose.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "So far your programs have done one thing at a time: line after line, top to bottom. But real backends often have lots of independent work waiting at once — a hundred transactions to record, ten API calls to make, files to read. Doing them strictly one after another wastes time, because most of that work spends its life *waiting* (for the database, the network, the disk) rather than using the CPU.\n\nGo's answer is the **goroutine**: a function that runs concurrently with the rest of your program. You start one by writing `go` in front of a function call. The hard part isn't the syntax — it's understanding what actually happens when you do, because getting it wrong produces bugs that vanish in tests and appear in production.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "Think of a single cook (your program) who can only stand at one station. Concurrency is that cook starting the rice, then chopping vegetables while the rice cooks, then checking the oven — one person, many tasks in flight, none of them blocking the others. A goroutine is you handing the cook one more task to juggle.",
          },
        },
        {
          type: "points",
          items: [
            "A **goroutine** is a function running concurrently with the rest of your program.",
            "You start one with `go f()` — the call returns immediately and `f` runs alongside.",
            "Most backend work is spent *waiting*, so overlapping it is where the speed-up comes from.",
          ],
        },
      ],
    },
    naive: {
      body: "If you've met threads in other languages, the natural assumption is: \"a goroutine is just Go's word for an OS thread.\" So you reason about them the way you would about threads — expensive, heavyweight, a few dozen at most before the machine struggles.\n\nThat assumption leads you to under-use them (afraid to start many) and to misunderstand what `go f()` costs. The other naive move is to write `go f()` and assume the line waits for `f` to finish, the way an ordinary call does. It doesn't — and that gap is the source of the classic beginner bug.",
      blocks: [
        {
          type: "example",
          example: {
            title: "`go f()` does NOT wait",
            language: "go",
            code:
              'func main() {\n    go fmt.Println("from the goroutine")\n    fmt.Println("from main")\n}\n// Often prints only:\n// from main\n// (main returns before the goroutine gets a chance to run)',
            takeaway:
              "The `go` line starts the goroutine and moves on immediately. main reaches its end and the program exits — usually before the goroutine ever prints.",
          },
        },
        {
          type: "points",
          items: [
            "A goroutine is **not** an OS thread — treating it as one makes you afraid to start many.",
            "`go f()` starts `f` and returns at once; it does not pause to wait for `f`.",
          ],
        },
      ],
    },
    failure: {
      body: "The wait-for-nothing assumption fails in the most misleading way possible: it often *looks* like it works. On a fast, idle laptop the goroutine sometimes squeezes in before main returns, so your test passes. On a busy production machine, or with slightly different timing, it doesn't — and the work silently never happens.\n\nThe root cause is a rule you must burn into memory: **when `main` returns, the whole program exits immediately, and every still-running goroutine is killed abruptly** — no cleanup, no defer, no warning. A goroutine whose result you never wait for is usually a bug, because you've given it no chance to finish.",
      blocks: [
        {
          type: "scenario",
          scenario: {
            title: "The transactions that vanish under load",
            context:
              "A request handler loops over incoming transactions and does `go save(tx)` for each, then returns \"200 OK\" right away. Every test passes. In production, under real traffic, a fraction of transactions are never written to the database and the totals don't add up.",
            insight:
              "The handler never waited for the save goroutines. When timing is tight — or the process shuts down — it returns (or exits) before some saves run, and those goroutines are killed mid-flight. The fix is to *wait* for the work, not to fire and forget it.",
          },
        },
      ],
    },
    intuition: {
      body: "Here's the mental image that fixes everything. Picture a small number of workers (real OS threads) and a big pile of index cards (goroutines), each card describing a task. A worker picks up a card and works on it. The instant that task has to *wait* for something — the database to reply, a lock to free up — the worker doesn't sit idle: it puts the card down and grabs another one. When the waited-for thing is ready, the parked card goes back in the pile to be picked up again later.\n\nThat's the Go **scheduler**: a piece of the runtime that hands goroutines to threads and, crucially, swaps a *blocked* goroutine off a thread so a *runnable* one can use it. Because the cards are cheap and the swap happens inside Go (not by asking the operating system), you can have hundreds of thousands of goroutines running on just a handful of threads.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "Concurrency is not parallelism",
            text: "Concurrency is having many tasks *in progress* and interleaving them (one worker juggling many cards). Parallelism is many tasks running at the *exact same instant* (many workers). Goroutines give you concurrency always; how much runs truly in parallel depends on how many workers the runtime uses.",
          },
        },
        {
          type: "points",
          items: [
            "Many cheap goroutines are multiplexed onto a few OS threads by the runtime **scheduler**.",
            "When a goroutine **blocks** (waiting on I/O, a channel, or a lock), the scheduler parks it and runs another on that thread.",
            "The swap happens in user space, inside Go — so it's far cheaper than an OS thread switch.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Why are goroutines so cheap? Because a goroutine starts with a tiny **stack** — the scratch memory a function uses for its local variables — of just a few kilobytes, and that stack *grows on demand* if the goroutine needs more. An OS thread, by contrast, reserves a large fixed stack (often megabytes) and is managed by the operating system, which makes creating and switching them comparatively expensive.\n\nSo the model is: **goroutines are a Go-runtime concept, threads are an operating-system concept, and the runtime maps the many onto the few.** You reason in goroutines; the runtime worries about threads. This is why starting 100,000 goroutines is reasonable, while starting 100,000 OS threads would melt the machine.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Many goroutines, few threads",
            kind: "compare",
            nodes: [
              {
                id: "goroutine",
                label: "Goroutine (G)",
                detail: "Runtime concept. Starts at a few KB of stack that grows on demand. Cheap to create; you can have hundreds of thousands.",
                tone: "success",
              },
              {
                id: "thread",
                label: "OS thread (M)",
                detail: "Operating-system concept. Large fixed stack, OS-managed. Expensive; you keep only a handful.",
                tone: "muted",
              },
            ],
            caption: "The runtime multiplexes many goroutines onto a few threads — that mismatch in cost is the whole point.",
          },
        },
        {
          type: "note",
          note: {
            tone: "warning",
            title: "Common trap",
            text: "\"Cheap\" means cheap to *create*, not free to *ignore*. Each goroutine still uses memory and may hold resources (a database connection, a lock). Starting a goroutine you never wait for — a bare `go f()` whose result nothing consumes — is usually a bug, not a shortcut.",
          },
        },
      ],
    },
    mechanics: {
      body: "Now the precise version. The scheduler is described by three letters — the **GMP model**. **G** is a goroutine (one task). **M** is a *machine*, i.e. an OS thread — the thing that actually executes code. **P** is a *processor*: a scheduling context that holds a queue of runnable goroutines and the permission to run one. A thread (M) must hold a P to run Go code, and it runs the G's from that P's queue.\n\nThe number of P's is set by **GOMAXPROCS**, which defaults to the number of CPU cores. That number is the ceiling on how many goroutines run *truly in parallel* at once — because only one G runs per P at a time. When a G blocks on a channel, mutex, or syscall, the scheduler detaches it and lets the P pick the next runnable G, so the thread keeps doing useful work instead of stalling.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "info",
            title: "The GMP letters",
            text: "G = goroutine (the task). M = machine, an OS thread (the worker that runs code). P = processor, a scheduling context with a run queue (the permission slot). GOMAXPROCS = how many P's exist = how many goroutines can run in parallel.",
          },
        },
        {
          type: "example",
          example: {
            title: "The argument is evaluated now; the body runs later",
            language: "go",
            code:
              'func main() {\n    i := 1\n    go fmt.Println(i) // i is read NOW (=1) when the go statement runs\n    i = 2             // this change is not seen by the goroutine above\n    time.Sleep(10 * time.Millisecond) // give the goroutine a chance (demo only)\n}\n// Prints: 1',
            takeaway:
              "The `go` statement evaluates the function and its arguments immediately; only the call itself is deferred to the goroutine. So the argument froze at 1 — just like a deferred call freezes its arguments.",
          },
        },
        {
          type: "points",
          items: [
            "A thread (M) needs a P to run Go code; it runs goroutines (G) from that P's queue.",
            "GOMAXPROCS = number of P's = the cap on goroutines running in parallel (defaults to CPU count).",
            "A blocked G is parked and the P runs another G — the thread doesn't sit idle.",
          ],
        },
      ],
    },
    diagram: {
      body: "Let's watch a block-and-swap happen, because it's the move that makes the scheduler worth understanding. Below, one thread (M) holds one P with two runnable goroutines queued. G1 runs, then asks the database for data and must wait. Follow the steps: instead of the thread stalling, the scheduler parks G1 and lets the P run G2. When the database replies, G1 becomes runnable again.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "A goroutine blocks; the thread keeps working",
            kind: "sequence",
            nodes: [
              { id: "run1", label: "M runs G1 (holds P)", detail: "the thread executes G1's code" },
              { id: "block", label: "G1 blocks on a DB read", detail: "it must wait for the network reply", tone: "danger" },
              { id: "park", label: "scheduler parks G1", detail: "G1 is set aside; it is not using the thread", tone: "accent" },
              { id: "run2", label: "P runs G2 on the same M", detail: "the thread stays busy instead of idling", tone: "success" },
              { id: "ready", label: "DB reply arrives", detail: "G1 becomes runnable again and rejoins a queue" },
              { id: "resume", label: "G1 resumes later", detail: "picked up by a P when one is free" },
            ],
            caption: "The blocked goroutine costs almost nothing — the thread simply runs a different goroutine while it waits.",
          },
        },
      ],
    },
    implementation: {
      body: "The correct pattern is: start your goroutines, then **wait** for them before you move on. The standard tool is `sync.WaitGroup` — a counter you increment before starting each goroutine and decrement when each finishes; `Wait()` blocks until the counter hits zero. (We introduce it briefly here; the mutexes lesson covers `sync` in depth.)\n\nThe recipe is small and mechanical: `wg.Add(1)` before each `go`, `defer wg.Done()` as the goroutine's first line, and `wg.Wait()` after the loop. That turns fire-and-forget into fire-and-join, so the work is guaranteed to complete.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Start many, then wait for all with sync.WaitGroup",
            language: "go",
            code:
              'func saveAll(txs []Tx) {\n    var wg sync.WaitGroup\n    for _, tx := range txs {\n        wg.Add(1) // register one goroutine BEFORE starting it\n        go func() {\n            defer wg.Done() // mark this one done however it exits\n            save(tx)\n        }()\n    }\n    wg.Wait() // block here until every goroutine has called Done\n    // now it is safe to continue: all saves have finished\n}',
            takeaway:
              "Add before you start, Done as you finish, Wait before you continue. The function no longer returns until every goroutine is truly done. (Go 1.22+ gives each iteration its own `tx`, so the closure captures the right one.)",
          },
        },
        {
          type: "points",
          items: [
            "`wg.Add(1)` before the `go`, never inside the goroutine (it might not run in time).",
            "`defer wg.Done()` as the goroutine's first line, so it fires on every exit path.",
            "`wg.Wait()` blocks the caller until the counter returns to zero.",
          ],
        },
      ],
    },
    experiment: {
      body: "Predict before you read on — a wrong guess you correct sticks better than a right answer you skimmed. Consider this program on a machine where GOMAXPROCS is 1 (only one goroutine can run at a time):\n\n```\nfunc main() {\n    go fmt.Println(\"A\")\n    go fmt.Println(\"B\")\n    fmt.Println(\"main\")\n}\n```\n\nWhat prints, and can you rely on the order? Commit to an answer.\n\nHere's the trace. `main` starts goroutine A, starts goroutine B, then prints \"main\" itself — and then main returns. Even with GOMAXPROCS at 1, the two goroutines are runnable, but main never gave up the thread or waited, so it ran to its end first. When main returns the program exits and A and B are killed. The reliable output is just **main**; \"A\" and \"B\" might occasionally slip in on faster timing, but you cannot count on it. The lesson: order and even *whether* a goroutine runs is not guaranteed unless you synchronise — and GOMAXPROCS controls parallelism, not whether main waits.",
    },
    "failure-cases": {
      body: "The failures here cluster around two misunderstandings: forgetting that main's return kills everything, and confusing cheap-to-create with free-to-run-unbounded. Here are the ones you'll actually meet.",
      blocks: [
        {
          type: "points",
          items: [
            "**Fire-and-forget `go f()`** → main (or the caller) returns before `f` runs; the work is silently lost. Wait with a WaitGroup.",
            "**Waiting with `time.Sleep`** → a guess, not a guarantee; too short loses work, too long wastes time. Use synchronisation, not sleeps.",
            "**Unbounded goroutines** → 100,000 goroutines each grabbing a scarce resource (a DB connection) oversubscribes it and thrashes. Cap concurrency.",
            "**Assuming an order** → the scheduler makes no promise about which runnable goroutine goes first. If you need order, coordinate it.",
            "**Expecting a shared variable to be safe** → two goroutines touching the same variable without synchronisation is a data race (that's the mutexes/channels lesson).",
          ],
        },
        {
          type: "example",
          example: {
            title: "Sleep is not synchronisation",
            language: "go",
            code:
              'func main() {\n    go doWork()\n    time.Sleep(100 * time.Millisecond) // HOPE it finished in time — it might not\n}\n\n// Correct: actually wait for it.\nfunc main() {\n    var wg sync.WaitGroup\n    wg.Add(1)\n    go func() { defer wg.Done(); doWork() }()\n    wg.Wait() // guaranteed: doWork has finished\n}',
            takeaway:
              "A sleep guesses how long the work takes; a WaitGroup knows when it's actually done. Never use time.Sleep to wait for a goroutine.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "Goroutines are cheap and easy, and that ease is exactly what makes them easy to misuse. None of these should scare you off — they mark where to think twice.",
      blocks: [
        {
          type: "points",
          items: [
            "**More goroutines**: better overlap of waiting work, but each still costs memory and may hold a scarce resource — unbounded fan-out backfires.",
            "**Raising GOMAXPROCS**: more parallelism on CPU-bound work, but no help when the bottleneck is a database with few connections.",
            "**WaitGroup (fire-and-join)**: correct and simple, but the caller blocks until the slowest goroutine finishes.",
            "**Background goroutines that outlive a request**: sometimes necessary, but you must own their lifetime or they leak and get killed on shutdown.",
          ],
        },
      ],
    },
    design: {
      body: "A few durable rules. Never start a goroutine without a plan for how you'll know it finished — pair every fan-out with a wait. Match your concurrency to the scarcest resource, not to how many tasks you have: if the database has 20 connections, don't run 20,000 saves at once. And remember the whole program dies when main returns, so top-level background work needs an explicit wait before you exit.",
      blocks: [
        {
          type: "points",
          items: [
            "Every `go` you start should have a corresponding way to wait for it.",
            "Bound concurrency to the scarce resource (connections, CPU), not to the task count.",
            "main returning exits the process and kills goroutines — wait before you let it return.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Sizing a worker pool to the database",
            context:
              "You have 100,000 transactions to persist and a database pool of 20 connections. Launching a goroutine per transaction starts 100,000 at once, all fighting for 20 connections.",
            insight:
              "Cap it: run a fixed set of ~20 worker goroutines that pull transactions from a shared list, so no more than 20 are in flight at a time. Concurrency matches the resource, and the WaitGroup tells you when the batch is done.",
          },
        },
      ],
    },
    ledgerflow: {
      body: "This is exactly how LedgerFlow processes a batch of transactions. Instead of recording them one strictly after another, it fans them out across goroutines so the time each one spends waiting on the database overlaps with the others' work. But it does two disciplined things: it caps the number running at once to the size of the database connection pool (so it never oversubscribes the database), and it uses a `sync.WaitGroup` to wait for every transaction to finish before the request handler returns its response — so a client never gets \"done\" while writes are still in flight, and no save is killed by the handler returning early.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "LedgerFlow: bounded concurrent transaction processing",
            kind: "sequence",
            nodes: [
              { id: "in", label: "Batch of transactions arrives", detail: "e.g. 5,000 to persist" },
              { id: "pool", label: "Start N workers (N = pool size)", detail: "cap concurrency to the DB connections", tone: "accent" },
              { id: "work", label: "Workers process concurrently", detail: "one blocked on the DB lets others proceed" },
              { id: "wait", label: "wg.Wait() for all", detail: "handler blocks until every save is done" },
              { id: "resp", label: "Return the response", detail: "reported done only when it truly is", tone: "success" },
            ],
            caption: "Concurrency for speed, a bound for safety, and a wait so the response never lies.",
          },
        },
      ],
    },
    exercises: {
      body: "Practice is what turns \"I read about goroutines\" into \"I reach for a WaitGroup without thinking.\" Work across predicting what a fire-and-forget program prints, reading argument-evaluation timing, implementing a correct wait, debugging a dropped-work leak, and designing a bounded workload. Each produces a different kind of evidence — do them, don't just read them.",
    },
    mastery: {
      body: "You've mastered this when you can explain why a goroutine is cheaper than an OS thread and how the runtime multiplexes many onto a few, predict what a program prints when main returns before a goroutine runs, write code that starts several goroutines and reliably waits for all of them, and design a workload that caps concurrency to a scarce resource. Attest a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "Two ideas carry this lesson. **Goroutines are cheap and concurrent** — `go f()` starts a function alongside your program, and the runtime scheduler (the GMP model) juggles hundreds of thousands of them over a few OS threads, parking any that block so the threads stay busy. **But you must wait for them** — when main returns the whole program exits and outstanding goroutines are killed, so a bare `go f()` you never join is usually a bug.",
      blocks: [
        {
          type: "points",
          items: [
            "`go f()` starts a goroutine and returns immediately; it does not wait.",
            "GMP: goroutines (G) run on threads (M) via processors (P); GOMAXPROCS = P count = parallelism cap.",
            "A blocked goroutine is parked cheaply in user space so its thread runs another.",
            "Wait for goroutines (e.g. sync.WaitGroup) before continuing; main returning kills them. Next up: channels for goroutines to communicate.",
          ],
        },
      ],
    },
  },
};
