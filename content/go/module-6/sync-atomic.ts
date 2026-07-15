import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 6 — mutexes and atomics: when shared memory guarded by a lock beats
 * passing values over channels. Same beginner-friendly voice as Modules 0–5 and
 * the sibling goroutines/channels lessons: plain language, one analogy per hard
 * idea, a concrete example before the abstract rule. Rigorously correct about
 * the data-race problem, Lock/Unlock discipline, RWMutex read-vs-write rules,
 * atomic single-word operations vs compound read-modify-write, sync.Once, and
 * the never-copy-a-sync-value rule.
 */
export const goSyncAtomic: Lesson = {
  id: "go-sync-atomic",
  slug: "sync-atomic",
  title: "Mutexes & atomics",
  description:
    "Guard shared in-memory state with sync.Mutex and sync.RWMutex, use sync/atomic for single-word counters and flags, and decide deliberately when a lock beats passing the value over a channel.",
  moduleId: "go-6",
  estimatedMinutes: 50,
  difficulty: "advanced",
  prerequisites: ["go-goroutines-scheduler"],
  learningObjectives: [
    "Recognize an unsynchronized shared-state data race and explain why its result is not reliable",
    "Protect an invariant across one or more fields with sync.Mutex and sync.RWMutex, using defer Unlock and never copying the lock",
    "Use sync/atomic for a single-word counter or flag and know exactly where an atomic is not enough",
    "Choose deliberately between passing a value over a channel and guarding shared memory with a lock",
  ],
  concepts: ["sync.Mutex", "sync.WaitGroup", "atomic"],
  references: [
    {
      title: "sync package documentation",
      url: "https://pkg.go.dev/sync",
      teaches:
        "The API and rules for Mutex, RWMutex, WaitGroup, and Once, including the must-not-copy warning.",
      relevance: "The authoritative reference for every lock primitive this lesson uses.",
      required: false,
      section: "Mutex; RWMutex; Once; WaitGroup",
    },
    {
      title: "sync/atomic package documentation",
      url: "https://pkg.go.dev/sync/atomic",
      teaches:
        "The typed atomic values (atomic.Int64, atomic.Value) and the Add/Load/Store/CompareAndSwap operations.",
      relevance:
        "Grounds exactly which single-word operations are atomic and how to call them safely.",
      required: false,
      section: "Int64; Value; CompareAndSwap",
    },
    {
      title: "Effective Go — Concurrency",
      url: "https://go.dev/doc/effective_go#concurrency",
      teaches:
        "Go's 'share memory by communicating' philosophy and where a plain lock is the pragmatic choice.",
      relevance:
        "Frames the central judgement call between channels and locks that this lesson turns on.",
      required: false,
      section: "Share by communicating",
    },
    {
      title: "The Go Memory Model",
      url: "https://go.dev/ref/mem",
      teaches:
        "The formal rules for when one goroutine's write is guaranteed visible to another, via synchronizing operations.",
      relevance:
        "Explains why an unsynchronized read may never see another goroutine's write — the root of the race.",
      required: false,
      section: "Synchronization",
    },
  ],
  exercises: [
    {
      id: "go6ma-predict-race",
      type: "prediction",
      prompt:
        "1,000 goroutines each run `counter++` on a shared unprotected `int`, and main waits for all of them with a WaitGroup before printing counter. Predict what counter prints and whether it is reliable.",
      expectedAnswer:
        "It usually prints a number below 1,000, and different runs may differ. `counter++` is a read-modify-write operation, not one atomic step, so two goroutines can read the same value and overwrite one increment. This is a data race: the program has no sequential-consistency guarantee, and `go run -race` reports it.",
      hints: [
        "`counter++` is three steps (read, add, write), not one indivisible step.",
        "Two goroutines can both read the same old value and both store old+1, so one increment is lost.",
      ],
    },
    {
      id: "go6ma-read-defer",
      type: "code-reading",
      prompt:
        "Read: `func (c *Cache) Get(k string) int { c.mu.Lock(); defer c.mu.Unlock(); return c.m[k] }`. Explain the exact moment the lock is released, and why `defer c.mu.Unlock()` is safer than calling `c.mu.Unlock()` manually just before the return.",
      hints: [
        "The deferred Unlock runs after the return value is evaluated, as the function exits.",
        "defer fires on every exit path — including a future early return or a panic — so the lock can never be leaked.",
      ],
    },
    {
      id: "go6ma-implement-cache",
      type: "implementation",
      prompt:
        "Complete the BalanceCache so Get and Set are safe to call from many goroutines at once. Use a sync.RWMutex so concurrent readers do not block each other, and make sure Set takes the write lock.",
      starterCode:
        'package main\n\nimport "sync"\n\ntype BalanceCache struct {\n  mu       sync.RWMutex\n  balances map[string]int64\n}\n\nfunc NewBalanceCache() *BalanceCache {\n  return &BalanceCache{balances: make(map[string]int64)}\n}\n\nfunc (c *BalanceCache) Get(account string) (int64, bool) {\n  // read the balance under a read lock\n  return 0, false\n}\n\nfunc (c *BalanceCache) Set(account string, balance int64) {\n  // write the balance under a write lock\n}',
      expectedAnswer:
        "func (c *BalanceCache) Get(account string) (int64, bool) {\n  c.mu.RLock()\n  defer c.mu.RUnlock()\n  v, ok := c.balances[account]\n  return v, ok\n}\n\nfunc (c *BalanceCache) Set(account string, balance int64) {\n  c.mu.Lock()\n  defer c.mu.Unlock()\n  c.balances[account] = balance\n}",
      hints: [
        "Get only reads, so it takes RLock/RUnlock — many readers may hold it at once.",
        "Set mutates the map, so it takes the exclusive Lock/Unlock; defer the unlock in both.",
      ],
    },
    {
      id: "go6ma-debug-copy",
      type: "debugging",
      prompt:
        "A Counter has a `mu sync.Mutex` field, and its Inc method has a value receiver: `func (c Counter) Inc() { c.mu.Lock(); c.n++; c.mu.Unlock() }`. `go vet` warns about copying a lock, and increments are still lost under load. Explain the bug and the fix.",
      hints: [
        "A value receiver copies the whole struct — including the mutex — on every call.",
        "Each call locks and mutates its own private copy, so no goroutines are actually mutually excluded; use a pointer receiver so they share one mutex and one counter.",
      ],
    },
    {
      id: "go6ma-refactor-atomic",
      type: "refactoring",
      prompt:
        "A request-count metric is a plain `var requests int` guarded by a dedicated `sync.Mutex` used nowhere else — every handler does Lock, requests++, Unlock. Refactor it to sync/atomic and explain why an atomic is the right fit here but would be wrong for the balance cache map.",
      hints: [
        "Replace the int and its mutex with an `atomic.Int64` and call `requests.Add(1)`; read it with `requests.Load()`.",
        "An atomic protects exactly one word with one indivisible operation; the balance map needs an invariant across many keys and a whole map structure, which only a mutex can guard.",
      ],
    },
    {
      id: "go6ma-design-choose",
      type: "design",
      prompt:
        "You must maintain a running total that is updated by 50 goroutines and read occasionally by one reporter. Compare three designs — a channel that owns the total, a sync.Mutex over a shared int, and an atomic.Int64 — and recommend one with your reasoning.",
      hints: [
        "Consider how much work each does per update and how simple the reader is.",
        "For a single integer updated very frequently, atomic.Int64 is simplest and fastest; a mutex is fine but heavier; a channel-owning goroutine adds machinery you don't need for one number.",
      ],
    },
    {
      id: "go6ma-advanced-compound",
      type: "advanced",
      prompt:
        "Two atomic counters track `hits` and `total`. A goroutine does `hits.Add(1)` then `total.Add(1)` per request, and a reporter reads both to compute a hit ratio. Explain why, even though each Add is atomic, the reporter can still read an inconsistent pair, and how you would fix it if the pair must be consistent.",
      hints: [
        "Atomicity of each Add does not make the two Adds happen together — the reporter can read between them.",
        "If the two numbers must be mutually consistent, they form one invariant across two fields, so guard both with a single mutex instead of two independent atomics.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-race",
      kind: "explain",
      description:
        "Explain, without notes, why unsynchronized concurrent access to shared state is a data race, using `counter++` as the example.",
      required: true,
    },
    {
      id: "implement-guarded",
      kind: "implement",
      description:
        "Write a type whose methods are safe for concurrent use by guarding its state with a sync.Mutex or sync.RWMutex, with correct defer-Unlock discipline and a pointer receiver.",
      required: true,
    },
    {
      id: "predict-atomic",
      kind: "predict",
      description:
        "Correctly predict where a sync/atomic operation is sufficient and where it is not — distinguishing a single-word update from a compound read-modify-write across fields.",
      required: true,
    },
    {
      id: "design-channel-vs-lock",
      kind: "design",
      description:
        "Choose deliberately between passing a value over a channel and guarding shared memory with a lock for a given workload, and defend the choice.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "The last two lessons taught you to run work concurrently with goroutines and to hand values between them over channels. But some state doesn't want to be handed off — it wants to *stay put* and be read and written by many goroutines. A cache of account balances that every request handler consults. A counter of how many requests you've served. A configuration table loaded once and read everywhere.\n\nThe moment two goroutines touch the same variable and at least one of them writes to it, you have a problem that channels don't automatically solve: a **data race**. This lesson is about the two tools for shared state — a **mutex** (a lock that lets only one goroutine in at a time) and **atomics** (indivisible operations on a single value) — and, just as importantly, the judgement call of when to reach for them instead of a channel.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "Think of a shared whiteboard. A channel is handing someone a note across the room — only one person ever holds it. Shared state is the whiteboard everyone can walk up to. If two people write on the same spot at the same instant, you get an unreadable smear. A mutex is a single marker: you can only write when you're holding it, and there's just one.",
          },
        },
        {
          type: "points",
          items: [
            "Some state is naturally shared and read-often — a cache, a counter, a config table — not passed from one owner to the next.",
            "Two goroutines touching the same variable, with at least one writing, is a **data race**.",
            "The tools are a **mutex** (mutual exclusion — one goroutine at a time) and **atomics** (indivisible single-value operations).",
          ],
        },
      ],
    },
    "mental-model": {
      body: 'Reduce the sync tools to a small set of shapes and they stop surprising you.\n\n**`sync.Mutex`** — one key, one holder. Use it when you must protect an *invariant across one or more fields*: "the map and its size counter must always agree," "these two balances must sum to a constant." A mutex is the general answer.\n\n**`sync.RWMutex`** — a smarter lock with two modes: *many readers* (`RLock`) may hold it at once, XOR *one writer* (`Lock`) holds it alone. It only helps when reads vastly outnumber writes, because readers no longer block each other.\n\n**`sync/atomic`** — hardware-level indivisible operations on a *single word* (an `int64`, a pointer). `atomic.Int64` with `Add`, `Load`, `Store`, `CompareAndSwap` makes `counter++` a single uninterruptible step. It protects exactly one value — no more.\n\n**`sync.Once`** — runs a piece of initialization *exactly once*, no matter how many goroutines call it, and makes every caller wait until that first run finishes.',
      blocks: [
        {
          type: "note",
          note: {
            tone: "info",
            title: "The dividing line",
            text: "A mutex protects an INVARIANT — a relationship that must hold across one or more fields, guarded over a stretch of code. An atomic protects ONE WORD with ONE operation. If your 'thing to protect' is a single integer or flag updated in one step, reach for an atomic. If it's a map, a struct, or two values that must stay consistent, reach for a mutex.",
          },
        },
        {
          type: "diagram",
          diagram: {
            title: "Which sync tool for which job?",
            kind: "compare",
            nodes: [
              {
                id: "mutex",
                label: "sync.Mutex",
                detail:
                  "One goroutine at a time. Protects an invariant across a critical section — a map, several fields, a compound update. The general answer.",
                tone: "accent",
              },
              {
                id: "rwmutex",
                label: "sync.RWMutex",
                detail:
                  "Many readers XOR one writer. Same as Mutex but lets concurrent readers in — only worth it when reads vastly outnumber writes.",
                tone: "default",
              },
              {
                id: "atomic",
                label: "sync/atomic",
                detail:
                  "One word (int64, pointer), one indivisible op: Add/Load/Store/CompareAndSwap. Perfect for a counter or flag; nothing wider.",
                tone: "success",
              },
              {
                id: "once",
                label: "sync.Once",
                detail:
                  "Runs an initializer exactly once across all goroutines; every caller waits for that first run to finish.",
                tone: "muted",
              },
            ],
            caption:
              "Match the tool to the shape of what you're protecting: a whole invariant (mutex), a read-heavy invariant (RWMutex), one word (atomic), or one-time setup (Once).",
          },
        },
      ],
    },
    mechanics: {
      body: "Now the precise version. A `sync.Mutex` has two methods: `Lock()` blocks until the lock is free and then takes it, and `Unlock()` releases it. The idiomatic pattern is `mu.Lock()` followed immediately by `defer mu.Unlock()`, so the unlock fires on *every* exit path — normal return, early return, or panic — and you can never leak the lock. The zero value of a Mutex is a ready-to-use unlocked mutex, so you never initialize it.\n\nA `sync.RWMutex` adds `RLock()`/`RUnlock()` for readers alongside `Lock()`/`Unlock()` for writers. Any number of readers can hold the read lock simultaneously, but a writer's `Lock()` waits until all readers have released and then excludes everyone.\n\nAn `atomic.Int64` offers `Add(delta)`, `Load()`, `Store(v)`, and `CompareAndSwap(old, new)` — each a single indivisible operation. `atomic.Value` (or `atomic.Pointer[T]`) atomically stores and loads a whole value by swapping a pointer. `sync.Once.Do(f)` runs `f` on the first call only. In Go 1.25+, `WaitGroup.Go(f)` starts and tracks a function in one call; `f` must not panic.",
      blocks: [
        {
          type: "example",
          example: {
            title: "The canonical mutex pattern: Lock then defer Unlock",
            language: "go",
            code: "type SafeCounter struct {\n    mu sync.Mutex // zero value is ready to use — no initialization\n    n  int\n}\n\n// Pointer receiver: all callers share ONE counter and ONE mutex.\nfunc (c *SafeCounter) Inc() {\n    c.mu.Lock()\n    defer c.mu.Unlock() // released as Inc returns, on every path\n    c.n++               // the critical section — only one goroutine here\n}\n\nfunc (c *SafeCounter) Value() int {\n    c.mu.Lock()\n    defer c.mu.Unlock()\n    return c.n // even a read needs the lock: it pairs with the write\n}",
            takeaway:
              "Lock, defer Unlock, touch the data, done. The pointer receiver is essential — a value receiver would copy the mutex and defeat it. Reads take the lock too, because an unsynchronized read still races with a write.",
          },
        },
        {
          type: "example",
          example: {
            title: "atomic.Int64: a lock-free counter",
            language: "go",
            code: 'import "sync/atomic"\n\nvar requests atomic.Int64\n\nfunc handle() {\n    requests.Add(1) // one indivisible read-add-write; no lock needed\n    // ... serve the request ...\n}\n\nfunc report() int64 {\n    return requests.Load() // atomically read the current value\n}',
            takeaway:
              "`atomic.Int64` turns the racy `counter++` into `requests.Add(1)`, a single uninterruptible step. No Lock/Unlock, no critical section — but it protects exactly this one number and nothing else.",
          },
        },
        {
          type: "points",
          items: [
            "`mu.Lock()` then `defer mu.Unlock()` — the unlock fires on every exit, so the lock is never leaked.",
            "A Mutex's zero value is unlocked and ready; never copy it (pass the containing struct by pointer).",
            "RWMutex: `RLock`/`RUnlock` for many readers, `Lock`/`Unlock` for one writer.",
            "atomic: `Add`, `Load`, `Store`, `CompareAndSwap` — each indivisible, each on a single word.",
            "Go 1.25+: `wg.Go(f)` starts and tracks a non-panicking task; older code uses Add before `go` and deferred Done.",
          ],
        },
        {
          type: "example",
          example: {
            title: "Start and wait for tasks with WaitGroup.Go (Go 1.25+)",
            language: "go",
            code: "var wg sync.WaitGroup\nfor _, job := range jobs {\n    wg.Go(func() {\n        process(job) // the function passed to Go must not panic\n    })\n}\nwg.Wait()",
            takeaway:
              "WaitGroup.Go combines Add, go, and Done safely. When tasks return errors or need shared cancellation, use errgroup instead.",
          },
        },
      ],
    },
    diagram: {
      body: "The move worth watching is what a mutex actually does to overlapping goroutines: it *serializes* them through the critical section. Below, three goroutines all want to increment the same counter. Follow the steps — they don't run the increment at once; the lock forces them into single file, and the lost-update problem disappears because no two reads-and-writes ever overlap.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "A mutex serializes access to the critical section",
            kind: "sequence",
            nodes: [
              {
                id: "g1lock",
                label: "G1 Lock() — takes the key",
                detail: "G2 and G3 arrive and block at the door",
              },
              {
                id: "g1work",
                label: "G1 reads n, adds 1, writes n",
                detail: "no other goroutine can touch n right now",
                tone: "accent",
              },
              {
                id: "g1unlock",
                label: "G1 Unlock() — returns the key",
                detail: "one waiting goroutine is woken",
              },
              {
                id: "g2",
                label: "G2 Lock() → work → Unlock()",
                detail: "now it's G2's turn, alone",
                tone: "success",
              },
              { id: "g3", label: "G3 Lock() → work → Unlock()", detail: "finally G3, also alone" },
              {
                id: "done",
                label: "All three increments counted",
                detail: "no overlap means no lost update",
                tone: "success",
              },
            ],
            caption:
              "The lock converts overlapping access into orderly turns. Each goroutine's read-add-write completes entirely before the next begins.",
          },
        },
        {
          type: "diagram",
          diagram: {
            title: "RWMutex: many readers together, one writer alone",
            kind: "flow",
            nodes: [
              { id: "r1", label: "Reader A RLock", detail: "reading the cache", tone: "success" },
              {
                id: "r2",
                label: "Reader B RLock",
                detail: "reading at the same time — allowed",
                tone: "success",
              },
              {
                id: "r3",
                label: "Reader C RLock",
                detail: "also reading concurrently",
                tone: "success",
              },
              {
                id: "w",
                label: "Writer Lock",
                detail: "waits for A, B, C to finish, then excludes everyone",
                tone: "danger",
              },
            ],
            caption:
              "Readers share the lock freely; a writer waits for all readers to leave and then holds it exclusively. Worth it only when reads dominate.",
          },
        },
      ],
    },
    implementation: {
      body: "Here is the pattern you'll use most in a backend: a small type that owns some shared state and guards every access with a lock, exposing safe methods. Callers never touch the fields directly — they go through methods that Lock and Unlock, so the synchronization lives in one place and can't be forgotten. For a read-heavy structure like a cache, an `RWMutex` lets concurrent readers proceed without blocking each other.",
      blocks: [
        {
          type: "example",
          example: {
            title: "A concurrency-safe balance cache with RWMutex",
            language: "go",
            code: "type BalanceCache struct {\n    mu       sync.RWMutex\n    balances map[string]int64\n}\n\nfunc NewBalanceCache() *BalanceCache {\n    return &BalanceCache{balances: make(map[string]int64)}\n}\n\n// Get is called far more often than Set, so readers use RLock and\n// never block each other.\nfunc (c *BalanceCache) Get(account string) (int64, bool) {\n    c.mu.RLock()\n    defer c.mu.RUnlock()\n    v, ok := c.balances[account]\n    return v, ok\n}\n\n// Set mutates the map, so it takes the exclusive write lock.\nfunc (c *BalanceCache) Set(account string, balance int64) {\n    c.mu.Lock()\n    defer c.mu.Unlock()\n    c.balances[account] = balance\n}",
            takeaway:
              "All access to the map goes through methods that hold the right lock. Reads use RLock (concurrent), writes use Lock (exclusive). The caller can't accidentally touch the map without the lock, because the map field is unexported.",
          },
        },
        {
          type: "example",
          example: {
            title: "sync.Once: load the rate table exactly once",
            language: "go",
            code: "var (\n    once  sync.Once\n    rates map[string]float64\n)\n\nfunc Rates() map[string]float64 {\n    once.Do(func() {\n        rates = loadRatesFromDB() // runs on the FIRST call only\n    })\n    // every caller — even the first — waits until loadRatesFromDB finishes\n    return rates\n}",
            takeaway:
              "No matter how many goroutines call Rates() at once, loadRatesFromDB runs exactly once and everyone waits for it. sync.Once removes the race and the double-initialization you'd get from a hand-rolled `if rates == nil` check.",
          },
        },
        {
          type: "points",
          items: [
            "Keep the state's fields unexported and expose only locked methods — synchronization in one place.",
            "Read-heavy structure → RWMutex, with RLock in readers and Lock in writers.",
            "One-time initialization → sync.Once.Do, which is race-free and runs the body exactly once.",
          ],
        },
      ],
    },
    experiment: {
      body: "Predict before you read on — a wrong guess you correct sticks better than a right answer you skimmed. Consider this program, which tries to guard a counter but with a value receiver:\n\n```\ntype Counter struct {\n    mu sync.Mutex\n    n  int\n}\nfunc (c Counter) Inc() { c.mu.Lock(); c.n++; c.mu.Unlock() } // value receiver!\n\nfunc main() {\n    var c Counter\n    var wg sync.WaitGroup\n    for i := 0; i < 1000; i++ {\n        wg.Add(1)\n        go func() { defer wg.Done(); c.Inc() }()\n    }\n    wg.Wait()\n    fmt.Println(c.n)\n}\n```\n\nWhat prints — 1000, or something else? And what does `go vet` say? Commit to an answer.\n\nHere's what happens: it prints **0**, and `go vet` warns `Inc passes lock by value`. Because `Inc` has a *value* receiver, each call copies the whole `Counter` — mutex and all — so every goroutine locks and increments its own throwaway copy. The original `c.n` is never touched, so it stays 0.\n\nWorse, copying a `sync.Mutex` is a bug in its own right: a copied mutex doesn't share lock state with the original, so it provides no mutual exclusion at all. The fix is a **pointer receiver**, `func (c *Counter) Inc()`, so every call shares the one mutex and the one counter.\n\nThe lesson: a `sync.Mutex` (and `sync.WaitGroup`) must never be copied after first use — always pass the containing struct by pointer.",
    },
    "failure-cases": {
      body: "Almost every locking bug is one of a handful of mistakes about *what the lock actually protects* or *whether you're still holding it*. Here are the ones you'll actually meet.",
      blocks: [
        {
          type: "points",
          items: [
            "**Copying a Mutex or WaitGroup** → the copy shares no state with the original, so it excludes nothing. Use a pointer receiver; heed the `go vet` 'passes lock by value' warning.",
            "**Forgetting to Unlock (or an early return before it)** → the lock is held forever and every other goroutine blocks. Always `defer mu.Unlock()` right after `Lock`.",
            "**Reading without the lock** → a read that races with a write is still a data race, even though reading 'feels' safe. Readers must lock too (RLock at minimum).",
            "**Assuming two atomics are consistent together** → each Add/Store is atomic alone, but a reader can observe one updated and the other not. A cross-field invariant needs one mutex, not two atomics.",
            "**Using RWMutex for a write-heavy load** → readers barely overlap, so you pay RWMutex's extra bookkeeping for nothing. A plain Mutex is simpler and often faster.",
            "**Recursive locking** → calling a method that Locks while you already hold that same Mutex deadlocks; Go's Mutex is not reentrant.",
          ],
        },
        {
          type: "example",
          example: {
            title: "Atomic-per-field does not make the pair consistent",
            language: "go",
            code: "var hits, total atomic.Int64\n\nfunc record(hit bool) {\n    if hit {\n        hits.Add(1)   // atomic, but...\n    }\n    total.Add(1)      // ...the reporter can read BETWEEN these two lines\n}\n\nfunc ratio() float64 {\n    h := hits.Load()  // may be read after hits.Add but before total.Add\n    t := total.Load() // → h/t is briefly inconsistent\n    return float64(h) / float64(t)\n}",
            takeaway:
              "Both operations are individually atomic, yet the two-line update is not. If `hits` and `total` must always be consistent with each other, they form one invariant across two fields — guard both with a single sync.Mutex instead.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "Locks and atomics are cheap and effective, and that ease is exactly what makes them easy to misuse. None of these should scare you off — they mark where to think twice.",
      blocks: [
        {
          type: "points",
          items: [
            "**Mutex vs atomic**: an atomic is faster and lock-free for a single word, but it protects only that word; a mutex is the only tool for an invariant across multiple fields or a whole data structure.",
            "**RWMutex vs Mutex**: RWMutex lets readers run concurrently, a big win when reads dominate — but it has more overhead per operation, so for balanced or write-heavy loads a plain Mutex wins.",
            "**Bigger critical section**: easier to reason about (more is protected at once), but holds the lock longer, so more goroutines queue at the door. Keep critical sections short.",
            "**Locks vs channels**: locks are simplest for 'guard this shared state briefly'; channels are simplest for 'transfer ownership of this value' or 'signal an event'. Forcing one style everywhere is the mistake.",
          ],
        },
      ],
    },
    design: {
      body: "A few durable rules. Decide what *invariant* each lock protects and write it down — a lock without a stated invariant is a lock you'll misuse. Keep critical sections short: lock, touch the shared data, unlock; don't do slow work (I/O, a network call) while holding a lock. Never copy a `sync` value — pass the containing struct by pointer and use pointer receivers. And use `go test -race` in CI so a new race is caught the day it's introduced, not the week it pages someone.\n\nThe deepest design call is channels versus locks, so give it its own rule of thumb below.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "Share memory by communicating — but not always",
            text: "Go's motto is \"don't communicate by sharing memory; share memory by communicating.\" It's a strong default: passing a value over a channel moves ownership so there's nothing to race on. But it is a default, not a law. When state is naturally shared and read often — a cache, a counter, a config table — guarding it with a plain mutex is simpler and clearer than routing every access through a goroutine and a channel. Use a channel to *transfer* or *signal*; use a lock to *guard* shared state in place.",
          },
        },
        {
          type: "scenario",
          scenario: {
            title: "Choosing for a running total updated by 50 goroutines",
            context:
              "Fifty worker goroutines each add to a shared running total thousands of times a second; one reporter reads it occasionally. You weigh a channel-owning goroutine, a sync.Mutex over a shared int, and an atomic.Int64.",
            insight:
              "For a single integer updated this often, atomic.Int64 wins: `total.Add(n)` is lock-free and the reporter's `total.Load()` is trivial. A mutex would also be correct but heavier per update. A channel-owning goroutine adds real machinery — a goroutine, a channel, a select loop — to protect one number, which is over-engineering. Match the tool to the shape: one word, one atomic.",
          },
        },
        {
          type: "points",
          items: [
            "State what invariant each lock protects; keep the critical section short and free of I/O.",
            "Never copy a sync value — pointer receivers, pass structs by pointer.",
            "Channel to transfer/signal; lock to guard shared state in place; atomic for a single word.",
            "Run `go test -race` in CI — races are invisible without it.",
          ],
        },
      ],
    },
    mastery: {
      body: "You understand this when you can explain why unsynchronized shared access is a data race, guard shared state with a mutex, identify when one atomic value is enough, and choose deliberately between a channel and a lock.",
    },
    summary: {
      body: "Two ideas carry this lesson. **Shared state needs synchronization** — two goroutines touching the same variable with at least one writing is a data race, so you cannot reason about it as an ordinary sequence of operations. A `sync.Mutex` serializes access, `sync.RWMutex` allows many readers or one writer, `sync/atomic` makes a single-word operation indivisible, and `sync.Once` runs setup once. **Match the tool to the shape** — a mutex guards an invariant across fields, an atomic guards one value, and a channel coordinates communication.",
      blocks: [
        {
          type: "points",
          items: [
            "A data race makes the program unreliable — use `go test -race`; `counter++` is three steps, not one.",
            "sync.Mutex: Lock then `defer Unlock`; never copy a sync value (pointer receivers).",
            "RWMutex for read-heavy invariants; atomic.Int64 for a single-word counter/flag; sync.Once for one-time init.",
            "Atomics make one operation atomic, not a compound update across fields — that needs a mutex. Channel to transfer, lock to guard. This closes Module 6's concurrency arc.",
          ],
        },
      ],
    },
  },
};
