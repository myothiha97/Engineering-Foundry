import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 6 — channels and select: Go's primary way for goroutines to
 * communicate and coordinate. Same beginner-friendly voice as Modules 0–5:
 * plain language, one analogy per hard idea, a concrete example before the
 * abstract rule. Rigorously correct about unbuffered rendezvous semantics,
 * close rules, nil-channel blocking, and select's non-deterministic choice.
 */
export const goChannelsSelect: Lesson = {
  id: "go-channels-select",
  slug: "channels-select",
  title: "Channels & select",
  description:
    "Coordinate goroutines by passing values over typed channels, choose safely between multiple channel operations with select, and know exactly when a send, receive, or close blocks or panics.",
  moduleId: "go-6",
  estimatedMinutes: 60,
  difficulty: "advanced",
  prerequisites: ["go-goroutines-scheduler"],
  learningObjectives: [
    "Use unbuffered and buffered channels to hand values between goroutines and reason about when each blocks",
    "Close a channel correctly and detect closure with the comma-ok receive and for-range",
    "Wait on multiple channel operations with select, including a non-blocking default, without deadlocking",
  ],
  concepts: ["channels", "select", "buffering", "close"],
  references: [
    {
      title: "A Tour of Go — Channels",
      url: "https://go.dev/tour/concurrency/2",
      teaches:
        "The basic send/receive syntax, buffering, and how a channel synchronizes two goroutines.",
      relevance:
        "Grounds the core mechanics of make, <-, and buffered vs unbuffered channels this lesson turns on.",
      required: false,
      section: "Channels; Buffered Channels; Range and Close; Select",
    },
    {
      title: "Effective Go — Channels",
      url: "https://go.dev/doc/effective_go#channels",
      teaches:
        "Idiomatic channel patterns and the rules for closing, ranging, and directional channel types.",
      relevance:
        "Backs the close discipline and directional-type design rules the lesson insists on.",
      required: false,
      section: "Channels",
    },
    {
      title: "Go Concurrency Patterns: Pipelines and cancellation",
      url: "https://go.dev/blog/pipelines",
      teaches:
        "How to chain channel stages into pipelines and cancel them cleanly by closing a done channel.",
      relevance: "Extends fan-out and collection into a complete pipeline with cancellation.",
      required: false,
      section: "Fan-out, fan-in; Explicit cancellation",
    },
  ],
  exercises: [
    {
      id: "go6ch-predict-rendezvous",
      type: "prediction",
      prompt:
        "A `main` function creates `ch := make(chan int)` (unbuffered), then on the same goroutine runs `ch <- 1` with no other goroutine started. Predict what happens when the program runs.",
      expectedAnswer:
        "It deadlocks: `fatal error: all goroutines are asleep - deadlock!`. An unbuffered send blocks until a receiver is ready, but main is the only goroutine and it is now blocked on the send, so no receiver can ever appear.",
      hints: [
        "An unbuffered send blocks until some other goroutine is ready to receive.",
        "If the only goroutine is the one blocked on the send, who is left to receive?",
      ],
    },
    {
      id: "go6ch-read-commaok",
      type: "code-reading",
      prompt:
        "Read: `ch := make(chan int, 1); ch <- 7; close(ch); a, ok1 := <-ch; b, ok2 := <-ch`. State the values of a, ok1, b, and ok2, and explain why the second receive does not block.",
      hints: [
        "A buffered channel holds its values even after close; receives drain the buffer first.",
        "Once the buffer is empty and the channel is closed, receives return the zero value immediately with ok=false.",
      ],
    },
    {
      id: "go6ch-implement-worker",
      type: "implementation",
      prompt:
        "Complete `sum` so it splits `nums` across two goroutines, each sending its partial sum on the channel, then combines both results. Use an unbuffered channel and no other synchronization.",
      starterCode:
        'package main\n\nimport "fmt"\n\nfunc partial(nums []int, ch chan<- int) {\n  s := 0\n  for _, n := range nums {\n    s += n\n  }\n  // send the partial sum on ch\n}\n\nfunc sum(nums []int) int {\n  ch := make(chan int)\n  mid := len(nums) / 2\n  // start two goroutines over the two halves, then receive both results\n  return 0\n}\n\nfunc main() { fmt.Println(sum([]int{1, 2, 3, 4, 5})) }',
      expectedAnswer:
        "func partial(nums []int, ch chan<- int) {\n  s := 0\n  for _, n := range nums {\n    s += n\n  }\n  ch <- s\n}\n\nfunc sum(nums []int) int {\n  ch := make(chan int)\n  mid := len(nums) / 2\n  go partial(nums[:mid], ch)\n  go partial(nums[mid:], ch)\n  a, b := <-ch, <-ch\n  return a + b\n}",
      hints: [
        "The channel is send-only (chan<- int) inside partial — just `ch <- s`.",
        "Two goroutines each send once, so main receives exactly twice and adds the results.",
      ],
    },
    {
      id: "go6ch-debug-doubleclose",
      type: "debugging",
      prompt:
        "Two producer goroutines each finish and call `close(ch)` on the shared channel so the consumer's `for v := range ch` will end. The program sometimes crashes with `panic: close of closed channel`. Explain the cause and give the idiomatic fix.",
      hints: [
        "Closing a channel that is already closed panics; only one goroutine may close a channel, and only once.",
        "Have the producers signal completion (e.g. a sync.WaitGroup) and let a single owner close the channel exactly once after all producers finish.",
      ],
    },
    {
      id: "go6ch-refactor-nonblocking",
      type: "refactoring",
      prompt:
        "A metrics loop does `v := <-events` to read the next event, but this blocks the loop whenever no event is ready, stalling a periodic flush. Refactor it so the read is non-blocking: take an event if one is ready, otherwise fall through and do the flush.",
      hints: [
        "Wrap the receive in a `select` with a `default` case.",
        "The `default` case runs immediately when no other case is ready, making the whole select non-blocking.",
      ],
    },
    {
      id: "go6ch-design-directional",
      type: "design",
      prompt:
        "Design the signatures for a `producer` and a `consumer` function that share one `chan int`, using directional channel types so the compiler prevents each function from misusing the channel. Explain what each direction forbids and why that is safer than passing a bidirectional channel everywhere.",
      hints: [
        "A send-only parameter is `chan<- int`; a receive-only parameter is `<-chan int`.",
        "A send-only channel cannot be received from or closed by the receiver side — the type system encodes the contract.",
      ],
    },
    {
      id: "go6ch-advanced-timeout",
      type: "advanced",
      prompt:
        "Using select and `time.After`, write a `fetchWithTimeout` that starts a slow operation on a goroutine, returns its result if it arrives within a deadline, and otherwise returns a timeout error. Explain what happens to the goroutine if the timeout fires first, and why the result channel should be buffered.",
      hints: [
        "`select { case r := <-done: ...; case <-time.After(d): ... }` races the result against the timer.",
        "If the timeout wins, the worker may still send later — buffer the result channel with capacity 1 so that send never blocks a now-abandoned goroutine (a leak).",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-rendezvous",
      kind: "explain",
      description:
        "Explain, without notes, why an unbuffered send blocks until a receiver is ready and how a buffered channel changes that, plus the three close rules (only the sender closes; send-on-closed panics; receive-from-closed returns the zero value).",
      required: true,
    },
    {
      id: "predict-select",
      kind: "predict",
      description:
        "Correctly predict the behavior of a select statement — which case runs, when default fires, and when the whole thing blocks — for a given set of ready and not-ready channels.",
      required: true,
    },
    {
      id: "implement-fanout",
      kind: "implement",
      description:
        "Implement a fan-out that starts N worker goroutines, collects their results over one channel, and terminates cleanly with a single close by the owner.",
      required: true,
    },
    {
      id: "design-cancellation",
      kind: "design",
      description:
        "Design a shutdown path where closing one done channel signals every worker to stop, and defend why close (not a value send) is the right broadcast primitive.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "You already know how to start a goroutine — a function running concurrently. But a goroutine that can't tell anyone what it computed is useless, and two goroutines poking at the same variable is how you get corrupted data. So the real question of concurrency isn't \"how do I run things at once?\" — it's \"how do these independent workers hand each other values and agree on timing *safely*?\"\n\nThe tempting answer from other languages is: put the data in a shared variable and guard it with a lock. Go offers a different default. Instead of many goroutines reaching into the same memory, one goroutine *sends* the value to another over a **channel** — a typed pipe. Ownership of the value moves with the message, so there's nothing shared to corrupt.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "A channel is a conveyor belt between two workstations. One worker places a part on the belt; the other picks it up. Neither reaches across into the other's bench. The belt itself enforces the hand-off — and if it's a belt with no buffer space, the sender has to wait until someone is standing there to take the part.",
          },
        },
        {
          type: "note",
          note: {
            tone: "info",
            title: "Go's motto for this",
            text: '"Don\'t communicate by sharing memory; share memory by communicating." Instead of guarding shared state with locks, pass the state itself down a channel so only one goroutine holds it at a time.',
          },
        },
        {
          type: "points",
          items: [
            "A **channel** is a typed conduit: `chan int` carries ints, `chan string` carries strings — nothing else.",
            "Sending a value over a channel hands ownership to the receiver, so there is no shared variable to race on.",
            "Channels also **synchronize**: the hand-off itself coordinates the timing of the two goroutines.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Reduce channels to a few rules and they stop surprising you. A send is `ch <- v`; a receive is `v := <-ch`. When a channel is **closed** with `close(ch)`, it means \"no more values will ever be sent.\" There are three iron rules about closing, and violating them is either a panic or a silent bug.\n\nRule 1: **only the sender closes a channel, never a receiver** — the sender is the one who knows no more values are coming. Rule 2: **sending on a closed channel panics** — it's a programming error, loud on purpose. Rule 3: **receiving from a closed channel returns immediately** with the element type's zero value; the comma-ok form `v, ok := <-ch` gives `ok == false` once the channel is closed and drained. One more: a **nil channel blocks forever** on both send and receive — occasionally useful in select, but usually a bug.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Close, comma-ok, and range",
            language: "go",
            code: "ch := make(chan int, 2)\nch <- 10\nch <- 20\nclose(ch) // sender promises: nothing more will be sent\n\n// comma-ok: ok is false once the channel is closed AND drained\na, ok := <-ch // a=10, ok=true  (buffered value)\nb, ok := <-ch // b=20, ok=true  (buffered value)\nc, ok := <-ch // c=0,  ok=false (drained + closed → zero value)\n\n// range receives until the channel is closed and drained, then stops\nfor v := range ch { // this loop body never runs: ch is already drained\n    fmt.Println(v)\n}",
            takeaway:
              "Buffered values survive close and come out first; after they're drained, receives return the zero value with ok=false, and `for range` ends.",
          },
        },
        {
          type: "note",
          note: {
            tone: "warning",
            title: "Common traps",
            text: 'Closing a channel twice panics; so does sending on a closed one. `ok == false` does NOT mean "empty" — a closed channel still hands out buffered values first. And you never *need* to close a channel just to free it (the GC handles that) — close it only to signal "done" to receivers.',
          },
        },
      ],
    },
    mechanics: {
      body: "Now the precise version. `make(chan T)` builds an unbuffered channel; `make(chan T, n)` builds one with a buffer of `n`. A send `ch <- v` and a receive `<-ch` are the only two operations, plus `close(ch)`. `for v := range ch` repeatedly receives until the channel is closed and drained, then exits the loop — it's the idiomatic way to consume a stream of values whose count you don't know in advance.\n\nIn function signatures you can restrict a channel's direction: `chan<- int` is **send-only** (you may only send) and `<-chan int` is **receive-only** (you may only receive). Read the arrow as pointing into or out of the channel. These directional types are a compile-time contract: a receive-only channel can't accidentally be closed or sent on, which encodes who owns each end.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Directional types make the contract compile-checked",
            language: "go",
            code: 'import "fmt"\n\n// send-only: this goroutine may only put values in and close.\nfunc produce(out chan<- int, n int) {\n    for i := 0; i < n; i++ {\n        out <- i\n    }\n    close(out) // the sender closes when done — its job, not the consumer\'s\n}\n\n// receive-only: this goroutine may only take values out.\nfunc consume(in <-chan int) {\n    for v := range in { // ends automatically when produce closes out\n        fmt.Println(v)\n    }\n}\n\nfunc main() {\n    ch := make(chan int)   // bidirectional here...\n    go produce(ch, 3)      // ...narrowed to send-only inside produce\n    consume(ch)            // ...and receive-only inside consume\n}',
            takeaway:
              "One bidirectional channel is created, then passed as send-only or receive-only. The compiler now rejects a consumer that tries to close or send — the type states who owns which end.",
          },
        },
        {
          type: "points",
          items: [
            "`make(chan T)` = unbuffered rendezvous; `make(chan T, n)` = buffered with capacity n.",
            "`for v := range ch` receives until the channel is closed and drained — the standard stream consumer.",
            "`chan<- T` (send-only) and `<-chan T` (receive-only) turn the ownership convention into a compiler-checked contract.",
          ],
        },
      ],
    },
    diagram: {
      body: "The single most important thing to internalize is the difference between an unbuffered rendezvous and a buffered hand-off — it's the source of most channel deadlocks. Compare the two below. On the left, the send cannot complete until a receiver is present; on the right, the send lands in the buffer and the sender keeps going. Select a side to see the detail.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Unbuffered vs buffered: when does a send block?",
            kind: "compare",
            nodes: [
              {
                id: "unbuf",
                label: "Unbuffered — rendezvous",
                detail:
                  "make(chan int). `ch <- v` blocks until another goroutine is at `<-ch`. Send and receive complete together, at the same instant.",
                tone: "accent",
              },
              {
                id: "buf",
                label: "Buffered — shelf of size N",
                detail:
                  "make(chan int, N). `ch <- v` succeeds immediately while the buffer has room; it blocks only when the buffer is full. Receive blocks only when empty.",
                tone: "success",
              },
            ],
            caption:
              "The deadlock trap lives on the left: an unbuffered send with no receiver ready blocks forever.",
          },
        },
        {
          type: "diagram",
          diagram: {
            title: "An unbuffered send/receive, step by step",
            kind: "sequence",
            nodes: [
              {
                id: "s1",
                label: "Goroutine A: ch <- 42",
                detail: "A blocks here — arm out, waiting for a receiver",
              },
              {
                id: "s2",
                label: "Goroutine B reaches v := <-ch",
                detail: "the rendezvous is now possible",
              },
              {
                id: "s3",
                label: "value 42 crosses the channel",
                detail: "hand-off happens atomically",
                tone: "accent",
              },
              {
                id: "s4",
                label: "both A and B proceed",
                detail: "A's send and B's receive complete together",
                tone: "success",
              },
            ],
            caption:
              "Neither goroutine moves past the operation until the other is ready. That is the rendezvous.",
          },
        },
      ],
    },
    implementation: {
      body: "The workhorse pattern is **fan-out, then collect**: start several worker goroutines, let each send its result on one shared channel, and receive exactly as many results as you started workers. Because every send is matched by a receive, nothing leaks and nothing deadlocks. When the number of results is open-ended instead of fixed, switch to closing the channel and ranging over it — with a single owner responsible for the close.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Fan out work, collect results over one channel",
            language: "go",
            code: 'package main\n\nimport "fmt"\n\nfunc square(n int, out chan<- int) {\n    out <- n * n // each worker sends exactly one result\n}\n\nfunc main() {\n    nums := []int{2, 3, 4, 5}\n    results := make(chan int) // unbuffered is fine: receives keep pace\n\n    for _, n := range nums {\n        go square(n, results) // fan out: one goroutine per input\n    }\n\n    total := 0\n    for range nums { // collect exactly len(nums) results, then stop\n        total += <-results\n    }\n    fmt.Println(total) // 4 + 9 + 16 + 25 = 54 (order of arrival varies)\n}',
            takeaway:
              "Start N workers, receive N times. The count is known, so no close is needed — main simply receives exactly as many values as it fanned out.",
          },
        },
        {
          type: "example",
          example: {
            title: "Open-ended stream: one owner closes, consumer ranges",
            language: "go",
            code: "func generate(out chan<- int) {\n    for i := 1; i <= 5; i++ {\n        out <- i\n    }\n    close(out) // the sole sender closes when the stream ends\n}\n\nfunc main() {\n    ch := make(chan int)\n    go generate(ch)\n    for v := range ch { // loop ends automatically when generate closes ch\n        fmt.Println(v)\n    }\n}",
            takeaway:
              "When you don't know the count up front, let the single sender close the channel and consume with `for range` — the loop ends exactly when the channel closes.",
          },
        },
        {
          type: "points",
          items: [
            "Known count → receive that many times; no close required.",
            "Unknown count → the one owning sender closes, the consumer uses `for v := range ch`.",
            "Never let a receiver close, and never close from more than one goroutine.",
          ],
        },
      ],
    },
    experiment: {
      body: "Predict before you read on — a wrong guess you correct sticks better than an answer you skimmed. Consider this program exactly as written, with nothing else running:\n\n```\nfunc main() {\n    ch := make(chan int) // unbuffered\n    ch <- 1              // send\n    fmt.Println(<-ch)    // receive\n}\n```\n\nDoes it print 1, or something else? Commit to an answer.\n\nHere's what actually happens: the program **deadlocks** and the runtime aborts with `fatal error: all goroutines are asleep - deadlock! `. The line `ch <- 1` is an unbuffered send, so it blocks until some *other* goroutine is ready to receive. But the only goroutine is `main`, and it is now frozen on that send — it never reaches the receive on the next line.\n\nWith every goroutine blocked and none able to make progress, Go's runtime detects the deadlock and stops. The fix is to run the send and receive on different goroutines (e.g. `go func() { ch <- 1 }()` then `<-ch`), or to make the channel buffered with `make(chan int, 1)` so the send has somewhere to land without a waiting receiver.",
    },
    "failure-cases": {
      body: "Almost every channel bug is one of a handful of mistakes about *when an operation blocks* or *who is allowed to close*. Here are the ones you'll actually hit.",
      blocks: [
        {
          type: "points",
          items: [
            "**Unbuffered send with no receiver** → deadlock. The classic beginner crash; give it a receiving goroutine or a buffer.",
            "**Sending on a closed channel** → `panic: send on closed channel`. Make sure senders stop before the close, and only the owner closes.",
            "**Closing twice (or from multiple senders)** → `panic: close of closed channel`. Elect a single owner to close exactly once.",
            "**Ranging over a channel nobody closes** → the `for range` blocks forever waiting for more values. Someone must close it.",
            "**Receiver closing the channel** → breaks the contract and invites a send-on-closed panic; only the sender closes.",
            "**A nil channel** (declared but never `make`d) → both send and receive block forever, so a select case on it is never chosen.",
          ],
        },
        {
          type: "example",
          example: {
            title: "Send on a closed channel — a real panic",
            language: "go",
            code: "ch := make(chan int, 1)\nclose(ch)\nch <- 1 // panic: send on closed channel\n\n// Contrast: receiving from a closed channel is always safe.\nch2 := make(chan int)\nclose(ch2)\nv, ok := <-ch2 // v = 0, ok = false — no panic, returns immediately",
            takeaway:
              "Closing changes the two ends asymmetrically: sending afterward panics, but receiving afterward is safe and returns the zero value with ok=false.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "Channels are the idiomatic default, but they aren't free and aren't always the right tool. Name the costs so you choose deliberately.",
      blocks: [
        {
          type: "points",
          items: [
            "**Unbuffered vs buffered**: unbuffered gives you a synchronization guarantee (sender knows the receiver got it); buffered decouples timing but hides backpressure and can mask a slow consumer.",
            "**Channels vs a mutex**: channels shine for *transferring ownership* and *signaling*; for a simple counter or a shared map guarded briefly, a `sync.Mutex` is simpler and faster. Don't force everything through a channel.",
            "**Buffer size is a real decision**: too small and senders stall; too large and you paper over a bottleneck and grow memory. Pick a size you can justify, not a guess.",
            "**close as a broadcast**: closing a channel wakes *every* receiver at once — perfect for shutdown, but it's one-shot and irreversible; you can't reopen it.",
          ],
        },
      ],
    },
    design: {
      body: "A few durable rules keep channel code correct. Make the *sender* own the close, and prefer a single, clearly-designated owner. Encode direction in function signatures (`chan<- T` / `<-chan T`) so the compiler enforces who does what. Reach for `select` when a goroutine must wait on more than one thing — a result, a timeout, or a cancellation signal — and use `close(done)` to broadcast shutdown to many workers at once.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "select in one glance",
            text: "`select` waits on several channel operations and runs one that can proceed. If several are ready, Go makes a pseudo-random choice; this is not a fairness guarantee. An optional `default` runs immediately when no other case is ready, making the select non-blocking.",
          },
        },
        {
          type: "example",
          example: {
            title: "select: race a result against a timeout, with cancellation",
            language: "go",
            code: 'import "time"\n\nfunc fetch(done <-chan struct{}, result <-chan int) (int, error) {\n    select {\n    case v := <-result: // whichever is ready first wins\n        return v, nil\n    case <-time.After(200 * time.Millisecond):\n        return 0, fmt.Errorf("timed out")\n    case <-done: // closing done unblocks this case for every waiter\n        return 0, fmt.Errorf("cancelled")\n    }\n}',
            takeaway:
              "One select waits on three possibilities at once. `time.After` gives a timeout channel; a closed `done` channel broadcasts cancellation to every goroutine selecting on it.",
          },
        },
        {
          type: "points",
          items: [
            "The sender owns the close; prefer one clear owner and close exactly once.",
            "Use directional types in signatures so misuse is a compile error.",
            "`select` for multi-way waits; `default` for non-blocking; `close(done)` to broadcast shutdown.",
          ],
        },
      ],
    },
    mastery: {
      body: "You've mastered this when you can explain why an unbuffered send blocks until a receiver is ready and how buffering changes it, recite the three close rules without notes, predict which select case runs (and when the whole select blocks), and implement a clean fan-out that terminates with a single close. Attest a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "One idea carries this lesson: **share memory by communicating**. A channel moves a value — and ownership of it — from one goroutine to another, and the hand-off itself is the synchronization point, so there's no shared variable left to race on.",
      blocks: [
        {
          type: "points",
          items: [
            "Unbuffered = rendezvous (send blocks until a receiver is ready); buffered `make(chan T, n)` lets the sender run ahead until the buffer fills.",
            "Close rules: only the sender closes; send-on-closed panics; receive-from-closed returns the zero value with ok=false; a nil channel blocks forever.",
            "`for v := range ch` drains until close; `select` waits on many operations, `default` makes it non-blocking, and closing a `done` channel broadcasts shutdown.",
            "Encode ownership with directional types `chan<- T` / `<-chan T`. Next up: sync primitives and the race detector.",
          ],
        },
      ],
    },
  },
};
