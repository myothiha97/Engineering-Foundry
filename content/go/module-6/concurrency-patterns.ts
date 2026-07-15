import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 6 capstone — composable concurrency patterns: pipelines, fan-out,
 * fan-in, worker pools, and structured concurrency with errgroup. Same
 * beginner-friendly voice as the rest of Module 6: plain language, one analogy
 * per hard idea, a concrete example before the abstract rule. Rigorously
 * correct about close ownership, WaitGroup-once-close for fan-in, bounding
 * concurrency, and always wiring a cancellation path so nothing leaks. Insists
 * on the judgement call that sequential is often the better answer.
 */
export const goConcurrencyPatterns: Lesson = {
  id: "go-concurrency-patterns",
  slug: "concurrency-patterns",
  title: "Patterns: pipelines, fan-in/out, worker pools",
  description:
    "Compose goroutines, channels, and context into reliable, cancellable, leak-free structures — pipelines, fan-out/fan-in, worker pools, and errgroup — and judge when a plain sequential loop is the better answer.",
  moduleId: "go-6",
  estimatedMinutes: 55,
  difficulty: "advanced",
  prerequisites: ["go-channels-select", "go-context-cancellation"],
  learningObjectives: [
    "Assemble a pipeline of channel-connected stages where each stage ranges over its input and closes its output when done",
    "Apply fan-out to parallelise a slow stage and fan-in to merge many channels into one, closing the merged channel exactly once with a sync.WaitGroup",
    "Build a worker pool that caps concurrency to a scarce resource, and wire every pattern to context cancellation so a cancelled pipeline drains and exits without leaking goroutines",
    "Decide when sequential code is the correct, clearer choice instead of reaching for concurrency by default",
  ],
  concepts: ["pipelines", "fan-in", "fan-out", "worker-pool", "structured-concurrency"],
  references: [
    {
      title: "Go Concurrency Patterns: Pipelines and cancellation",
      url: "https://go.dev/blog/pipelines",
      teaches:
        "How to build pipeline stages connected by channels, fan out and fan in, and cancel every stage cleanly with a shared done/context signal.",
      relevance:
        "The canonical source for every pattern in this lesson; the structure here follows it directly.",
      required: false,
      section: "Pipelines; Fan-out, fan-in; Explicit cancellation",
    },
    {
      title: "Advanced Go Concurrency Patterns",
      url: "https://go.dev/blog/advanced-go-concurrency-patterns",
      teaches:
        "Richer select-driven coordination — combining timeouts, cancellation, and state into concurrent components.",
      relevance: "Deepens the select-plus-cancellation reasoning the pipeline stages rely on.",
      required: false,
      section: "Cancellation; Coordinating with select",
    },
    {
      title: "errgroup package documentation",
      url: "https://pkg.go.dev/golang.org/x/sync/errgroup",
      teaches:
        "How errgroup.WithContext runs a group of goroutines, cancels the context on the first error, and returns that error from Wait; SetLimit bounds concurrency.",
      relevance: "Backs the structured-concurrency section and the errgroup-based worker pool.",
      required: false,
      section: "Group; WithContext; SetLimit",
    },
    {
      title: "Rob Pike — Go Concurrency Patterns (talk)",
      url: "https://go.dev/talks/2012/concurrency.slide",
      teaches:
        "The foundational vocabulary — generators, fan-in, fan-out, and select as coordination — from the language's designer.",
      relevance:
        "The original framing these patterns come from; useful intuition for why they compose.",
      required: false,
      section: "Generator; Fan-in; Select",
    },
  ],
  exercises: [
    {
      id: "go6cp-predict-pipeline",
      type: "prediction",
      prompt:
        "A two-stage pipeline: `gen` sends 1,2,3 on `out` then closes it; `square` does `for n := range in { out <- n*n }` then closes its own out; main ranges over the final channel and prints. Predict what prints, in what order, and whether either range loop hangs.",
      expectedAnswer:
        "It prints 1, 4, 9 in that order, and neither loop hangs. Each stage's `for range` ends automatically when the previous stage closes its output, so square's range ends, square closes its out, and main's range then ends. Order is preserved because a single pipeline stage processes values one at a time in the order received.",
      hints: [
        "A `for range` over a channel ends exactly when that channel is closed and drained.",
        "Each stage closes its OWN output after its input range ends — that closure is what lets the next stage's range terminate.",
      ],
    },
    {
      id: "go6cp-read-fanin-close",
      type: "code-reading",
      prompt:
        "Read a fan-in `merge` that starts one goroutine per input channel, each doing `for v := range c { out <- v }`, and then does `go func() { wg.Wait(); close(out) }()`. Explain precisely why the `close(out)` is inside its own goroutine after `wg.Wait()`, and what breaks if you instead call `close(out)` at the end of each per-channel goroutine.",
      hints: [
        "How many goroutines send on `out`? A channel must be closed exactly once, by no one still sending.",
        "wg.Wait() must not run on the same goroutine that also needs to keep forwarding values, or it would block forwarding.",
      ],
    },
    {
      id: "go6cp-implement-workerpool",
      type: "implementation",
      prompt:
        "Implement `process(ctx, jobs []int, workers int)` that runs a bounded pool of `workers` goroutines draining a jobs channel, doubling each job, and returning the results. It must cap concurrency to `workers`, close channels correctly, and stop early if `ctx` is cancelled. Fill in the worker loop and the shutdown.",
      starterCode:
        'package main\n\nimport (\n\t"context"\n\t"sync"\n)\n\nfunc process(ctx context.Context, jobs []int, workers int) []int {\n\tjobCh := make(chan int)\n\tresCh := make(chan int)\n\n\t// TODO: start `workers` goroutines that drain jobCh, double each job,\n\t// send on resCh, and bail out if ctx is cancelled.\n\n\t// TODO: feed jobs into jobCh (respecting ctx), then close jobCh.\n\n\t// TODO: close resCh once all workers are done (single close by an owner).\n\n\tvar out []int\n\tfor r := range resCh {\n\t\tout = append(out, r)\n\t}\n\treturn out\n}',
      expectedAnswer:
        'package main\n\nimport (\n\t"context"\n\t"sync"\n)\n\nfunc process(ctx context.Context, jobs []int, workers int) []int {\n\tjobCh := make(chan int)\n\tresCh := make(chan int)\n\n\tvar wg sync.WaitGroup\n\tfor i := 0; i < workers; i++ {\n\t\twg.Add(1)\n\t\tgo func() {\n\t\t\tdefer wg.Done()\n\t\t\tfor j := range jobCh {\n\t\t\t\tselect {\n\t\t\t\tcase resCh <- j * 2:\n\t\t\t\tcase <-ctx.Done():\n\t\t\t\t\treturn // stop if cancelled while trying to send\n\t\t\t\t}\n\t\t\t}\n\t\t}()\n\t}\n\n\t// Feed jobs; stop feeding if cancelled so the send never blocks forever.\n\tgo func() {\n\t\tdefer close(jobCh)\n\t\tfor _, j := range jobs {\n\t\t\tselect {\n\t\t\tcase jobCh <- j:\n\t\t\tcase <-ctx.Done():\n\t\t\t\treturn\n\t\t\t}\n\t\t}\n\t}()\n\n\t// One owner closes resCh, exactly once, after all workers finish.\n\tgo func() {\n\t\twg.Wait()\n\t\tclose(resCh)\n\t}()\n\n\tvar out []int\n\tfor r := range resCh {\n\t\tout = append(out, r)\n\t}\n\treturn out\n}',
      hints: [
        "A fixed number of worker goroutines all `for j := range jobCh` — that loop is what caps concurrency to `workers`.",
        "The result channel has many senders (the workers), so no worker may close it; a single goroutine does `wg.Wait(); close(resCh)`.",
        "Every blocking send must be inside a `select` that also watches `ctx.Done()`, or a cancelled pipeline leaks the goroutine on a stuck send.",
      ],
    },
    {
      id: "go6cp-debug-blocked-send-leak",
      type: "debugging",
      prompt:
        "A `producer` goroutine does `for i := 0; ; i++ { ch <- i }` on an unbuffered channel; the consumer reads only the first 5 values with `for i := 0; i < 5; i++ { <-ch }` and then returns. The program looks fine but a profiler shows a goroutine that never dies. Explain the leak and give the fix.",
      hints: [
        "After the consumer stops receiving, what happens to the producer's next `ch <- i`?",
        "A send that blocks forever with no receiver — and no cancellation path — is a leaked goroutine. Give the producer a `ctx`/`done` to select on and cancel it when the consumer is finished.",
      ],
    },
    {
      id: "go6cp-refactor-unbounded-to-pool",
      type: "refactoring",
      prompt:
        "This code fans out one goroutine per URL to fetch 50,000 URLs: `for _, u := range urls { go fetch(u, results) }`. It exhausts file descriptors and hammers the target. Refactor it into a bounded worker pool of N=20 workers reading from a jobs channel, keeping the results collection correct.",
      hints: [
        "Replace 'one goroutine per job' with 'N goroutines each draining a jobs channel' — that is the entire point of a pool.",
        "Send the URLs into a jobs channel and close it; the workers range over it and exit when it closes; use a WaitGroup to know when to close results.",
      ],
    },
    {
      id: "go6cp-design-seq-vs-concurrent",
      type: "design",
      prompt:
        "You must sum a slice of 1,000 integers, and separately you must call 1,000 independent HTTP APIs. For each workload, decide whether to use concurrency or a plain sequential loop, and justify the choice in terms of where the time goes and what complexity concurrency would add.",
      expectedAnswer:
        "Sum the integers sequentially: the work is CPU-cheap and tiny, so goroutine/channel overhead and coordination would cost more than a `for` loop that finishes in microseconds — and a plain loop is clearer and obviously correct. Fetch the 1,000 APIs concurrently but bounded (e.g. a worker pool or errgroup with a limit): each call spends almost all its time waiting on the network, so overlapping the waits is a large real speed-up, and the bound protects the remote service and local resources. The rule: concurrency pays off when work is I/O-bound and independent; sequential wins when work is CPU-cheap, short, or order-sensitive.",
      hints: [
        "Where does the time actually go in each workload — CPU or waiting?",
        "Concurrency helps overlap *waiting*; it adds overhead and complexity that cheap CPU work can't repay.",
      ],
    },
    {
      id: "go6cp-advanced-errgroup",
      type: "advanced",
      prompt:
        "Using `errgroup.WithContext`, write `validateAll(ctx, batches)` that runs a validation function per batch concurrently, bounded to 8 at a time with `g.SetLimit(8)`, so that the first validation error cancels the rest and `g.Wait()` returns that error. Explain how each goroutine learns it should stop early.",
      hints: [
        "`g, ctx := errgroup.WithContext(ctx)` gives you a context that is cancelled the moment any `g.Go` func returns a non-nil error.",
        "Each goroutine should select on `ctx.Done()` (or pass ctx into the validation) so it stops promptly once a sibling has failed; `g.Wait()` returns the first error.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-compose",
      kind: "explain",
      description:
        "Explain, without notes, how pipeline, fan-out, fan-in, and worker-pool differ and compose, and state the close/ownership rule each relies on (the sender closes; a fan-in closes its output once via a WaitGroup).",
      required: true,
    },
    {
      id: "predict-cancellation",
      kind: "predict",
      description:
        "Predict whether a given concurrent structure leaks a goroutine when its consumer stops early or its context is cancelled, and identify exactly which send or receive blocks forever.",
      required: true,
    },
    {
      id: "implement-bounded-pool",
      kind: "implement",
      description:
        "Implement a worker pool that caps concurrency to N, closes its channels correctly, and shuts down cleanly on context cancellation with no leaked goroutines.",
      required: true,
    },
    {
      id: "design-seq-or-concurrent",
      kind: "design",
      description:
        "Given a workload, decide and defend whether concurrency or a sequential loop is the right choice, reasoning from where the time goes and the complexity concurrency adds.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "You now have the primitives: goroutines run work concurrently, channels pass values between them safely, `select` waits on several things at once, and `context` cancels a whole call tree. But primitives aren't systems. A real backend rarely needs just one goroutine and one channel — it needs to read a stream of work, spread a slow step across several workers, collect the results back into one place, cap how much runs at once, and tear the whole thing down cleanly when someone cancels.\n\nStrung together carelessly, those needs produce the two worst kinds of bug: a **leaked goroutine** (one blocked forever on a send nobody will receive, quietly eating memory) and a **deadlock** (everyone waiting on everyone). This lesson is about the handful of *composable patterns* — pipeline, fan-out, fan-in, worker pool, and structured concurrency — that turn the primitives into structures you can trust. And, just as importantly, about knowing when *not* to reach for them.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "Think of a factory line. Raw parts arrive on a conveyor (a channel), pass through stations that each do one job (pipeline stages), and where one station is slow you put several people at it (fan-out) and merge their output back onto one belt (fan-in). A worker pool is the rule that you only have so many people, so you never staff more stations than you have workers. And there's a big red stop button (cancellation) that halts the whole line at once.",
          },
        },
        {
          type: "points",
          items: [
            "Patterns compose the primitives (goroutine, channel, select, context) into reliable structures.",
            "The failure modes to design against are **goroutine leaks** (a blocked send with no receiver) and **deadlocks**.",
            "Every pattern here must have a cancellation path, or a cancelled system leaks instead of draining.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Reduce the patterns to their invariants and they stop surprising you. A pipeline stage is a function that takes a receive-only input channel and returns a receive-only output channel; internally it starts one goroutine that `for v := range in` does its work, sends downstream, and `defer close(out)` so the output closes exactly when the input is drained. Because the *sender* of `out` is this stage, this stage owns closing `out` — always.\n\nFan-in needs one extra idea. When N goroutines all send on one merged channel, none of them may close it (closing while another still sends panics, and closing twice panics). So you count them with a `sync.WaitGroup`: each forwarding goroutine calls `wg.Done()` when its source is drained, and a separate goroutine does `wg.Wait(); close(merged)` — closing once, after the last source finishes. Cancellation threads through all of it: every send is wrapped in a `select` that also watches `ctx.Done()`, so a cancelled stage can return instead of blocking on a send nobody will receive.",
      blocks: [
        {
          type: "example",
          example: {
            title: "The shape of a pipeline stage",
            language: "go",
            code: 'import "context"\n\n// A stage: receive-only in, returns a receive-only out.\nfunc square(ctx context.Context, in <-chan int) <-chan int {\n    out := make(chan int)\n    go func() {\n        defer close(out) // this stage owns out, so it closes out — once\n        for n := range in { // ends when the previous stage closes its output\n            select {\n            case out <- n * n:\n            case <-ctx.Done(): // cancelled: stop instead of blocking on send\n                return\n            }\n        }\n    }()\n    return out\n}',
            takeaway:
              "Every stage follows the same template: make out, start one goroutine, `defer close(out)`, range the input, and guard the send with `select` on `ctx.Done()`. The sender owns the close; cancellation gives a non-blocking exit.",
          },
        },
        {
          type: "note",
          note: {
            tone: "warning",
            title: "The three close mistakes",
            text: "1) A receiver closing a channel — never; only the sender knows no more values are coming. 2) Two senders both closing the merged channel in fan-in — panic; use one WaitGroup-gated close. 3) Forgetting `defer close(out)` in a stage — the next stage's `for range` then hangs forever waiting for values that never stop coming.",
          },
        },
      ],
    },
    mechanics: {
      body: "Now the precise moving parts. A **pipeline** connects stages by channel: `nums := gen(ctx, 2, 3, 4); out := square(ctx, nums)`; each stage returns the channel the next one reads. The first stage (a *generator*) turns a slice or loop into a channel; the last is consumed with `for v := range out`.\n\n**Fan-out**: start k goroutines that all `for v := range in` on the *same* input channel — Go delivers each value to exactly one of them, so they naturally share the load. **Fan-in / merge**: take several `<-chan T`, start one goroutine per input forwarding into a shared `out`, track them with a `WaitGroup`, and close `out` once in a `wg.Wait(); close(out)` goroutine.\n\nA **worker pool** is fan-out with a fixed k chosen to bound concurrency — k workers draining a `jobs` channel, so at most k jobs are in flight regardless of how many jobs exist. **errgroup** (`golang.org/x/sync/errgroup`) packages the common case: `g, ctx := errgroup.WithContext(ctx)`, `g.Go(func() error {...})` per task, optional `g.SetLimit(k)` to bound concurrency, and `g.Wait()` returns the first non-nil error while cancelling `ctx` so siblings stop.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Fan-in: merge many channels, close once with a WaitGroup",
            language: "go",
            code: 'import "sync"\n\nfunc merge(ctx context.Context, ins ...<-chan int) <-chan int {\n    out := make(chan int)\n    var wg sync.WaitGroup\n    wg.Add(len(ins))\n    for _, in := range ins {\n        go func(c <-chan int) {\n            defer wg.Done() // this source is drained\n            for v := range c {\n                select {\n                case out <- v:\n                case <-ctx.Done():\n                    return\n                }\n            }\n        }(in)\n    }\n    go func() { wg.Wait(); close(out) }() // close out exactly once, after all sources\n    return out\n}',
            takeaway:
              "N forwarding goroutines share one `out`; none of them closes it. A single `wg.Wait(); close(out)` goroutine closes it exactly once, after the last source is drained — the only safe way to close a multi-sender channel.",
          },
        },
        {
          type: "points",
          items: [
            "Pipeline: each stage takes an input channel and returns its output channel; chain them.",
            "Fan-out: k goroutines range the *same* input channel; each value goes to exactly one.",
            "Fan-in: forward each source into a shared out; `wg.Wait(); close(out)` closes it once.",
            "Worker pool: fan-out with a fixed k that bounds concurrency; errgroup wraps run-cancel-collect with `SetLimit(k)`.",
          ],
        },
      ],
    },
    diagram: {
      body: "Three pictures cover the whole toolkit. First a **pipeline** as a left-to-right flow: values enter, each stage transforms and passes them on, closure propagates to the end. Then **fan-out/fan-in**: one stage splits across parallel workers and merges back. Then a **worker pool**: a fixed set of workers draining one jobs channel. Trace each and notice where the channels close.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "A pipeline: stages connected by channels",
            kind: "flow",
            nodes: [
              {
                id: "gen",
                label: "generate",
                detail: "turns input into a channel; closes it when the source is exhausted",
              },
              {
                id: "s1",
                label: "stage: filter",
                detail: "ranges its input, sends kept values, closes its output when input drains",
                tone: "accent",
              },
              {
                id: "s2",
                label: "stage: transform",
                detail: "ranges its input, sends results, closes its output",
              },
              {
                id: "sink",
                label: "consume",
                detail: "for v := range final — ends when the last stage closes",
                tone: "success",
              },
            ],
            caption:
              "Closure flows downstream: each stage closes its own output when its input runs dry, so the whole line shuts down in order.",
          },
        },
        {
          type: "diagram",
          diagram: {
            title: "Fan-out then fan-in around a slow stage",
            kind: "flow",
            nodes: [
              { id: "src", label: "one input channel", detail: "the stream of values to process" },
              { id: "w1", label: "worker 1", detail: "ranges the shared input", tone: "accent" },
              {
                id: "w2",
                label: "worker 2",
                detail: "ranges the same input — each value goes to one worker",
                tone: "accent",
              },
              { id: "w3", label: "worker 3", detail: "parallelises the slow step" },
              {
                id: "merge",
                label: "merge (fan-in)",
                detail: "WaitGroup counts workers; close output once all done",
                tone: "success",
              },
            ],
            caption:
              "Fan-out shares one input across k workers; fan-in merges their outputs and closes the merged channel exactly once.",
          },
        },
        {
          type: "diagram",
          diagram: {
            title: "Worker pool: bounded concurrency on a jobs channel",
            kind: "sequence",
            nodes: [
              {
                id: "jobs",
                label: "jobs channel gets N jobs",
                detail: "producer sends all jobs, then closes the channel",
              },
              {
                id: "pool",
                label: "start k workers (k << N)",
                detail: "k is chosen to match a scarce resource",
                tone: "accent",
              },
              {
                id: "drain",
                label: "each worker: for j := range jobs",
                detail: "at most k jobs in flight at once — that is the bound",
              },
              {
                id: "results",
                label: "workers send on results",
                detail: "many senders — nobody closes results yet",
              },
              {
                id: "close",
                label: "wg.Wait(); close(results)",
                detail: "one owner closes results after all workers finish",
                tone: "success",
              },
            ],
            caption:
              "N jobs, only k running at any instant. The pool caps concurrency; a WaitGroup-gated close ends the results stream cleanly.",
          },
        },
      ],
    },
    implementation: {
      body: "Here is a full, cancellable worker pool — the pattern you'll reach for most. A fixed number of workers drain a `jobs` channel; each result goes on a `results` channel; a `WaitGroup` gates a single `close(results)`; and every blocking operation is guarded by `ctx.Done()` so cancellation drains the whole thing. Note what makes it *bounded*: there are exactly `workers` goroutines no matter how many jobs arrive.\n\nWhen your tasks return errors and you want the first failure to cancel the rest, don't hand-roll it — use `errgroup`. It gives you the same bounded, cancellable structure with far less code, and `Wait()` hands back the first error.",
      blocks: [
        {
          type: "example",
          example: {
            title: "A bounded, cancellable worker pool",
            language: "go",
            code: 'import (\n    "context"\n    "sync"\n)\n\nfunc runPool(ctx context.Context, jobs <-chan int, workers int) <-chan int {\n    results := make(chan int)\n    var wg sync.WaitGroup\n    wg.Add(workers)\n    for i := 0; i < workers; i++ {\n        go func() {\n            defer wg.Done()\n            for j := range jobs { // shared input: caps in-flight work at `workers`\n                select {\n                case results <- process(j):\n                case <-ctx.Done(): // cancelled mid-send: exit, do not block\n                    return\n                }\n            }\n        }()\n    }\n    go func() { wg.Wait(); close(results) }() // one owner, one close\n    return results\n}',
            takeaway:
              "Exactly `workers` goroutines exist, so concurrency is bounded regardless of job count. The results channel has many senders, so a single `wg.Wait(); close(results)` goroutine owns the close. Every send is guarded by `ctx.Done()` so cancellation can't leak a worker.",
          },
        },
        {
          type: "example",
          example: {
            title: "The same job, structured with errgroup",
            language: "go",
            code: 'import "golang.org/x/sync/errgroup"\n\nfunc validateAll(ctx context.Context, batches []Batch) error {\n    g, ctx := errgroup.WithContext(ctx) // ctx is cancelled on first error\n    g.SetLimit(8)                       // bound concurrency to 8 at a time\n    for _, b := range batches {\n        g.Go(func() error {\n            return validate(ctx, b) // ctx lets it stop early if a sibling failed\n        })\n    }\n    return g.Wait() // returns the FIRST non-nil error (or nil)\n}',
            takeaway:
              "errgroup packages run-bound-cancel-collect: `SetLimit` bounds concurrency, `WithContext` cancels every sibling on the first error, and `Wait` returns that error. Reach for it whenever tasks can fail.",
          },
        },
        {
          type: "points",
          items: [
            "A worker pool is `workers` goroutines ranging one shared `jobs` channel — that fixed count IS the bound.",
            "Many senders on `results` → nobody but a lone `wg.Wait(); close(results)` goroutine may close it.",
            "Guard every send with `select`/`ctx.Done()`; use errgroup when tasks return errors.",
          ],
        },
      ],
    },
    experiment: {
      body: "Predict before you read on — a wrong guess you correct sticks better than an answer you skimmed. Here is a producer and a consumer that stops early, on an unbuffered channel, with no cancellation:\n\n```\nfunc main() {\n    ch := make(chan int)\n    go func() {\n        for i := 0; ; i++ {\n            ch <- i        // send forever\n        }\n    }()\n    for i := 0; i < 3; i++ {\n        fmt.Println(<-ch)  // consume only 3\n    }\n    // main returns here\n}\n```\n\nDoes this print 0,1,2 and exit cleanly? Is there a leak? Commit to an answer.\n\nHere's what actually happens: it **prints 0, 1, 2 and the program exits** — because when `main` returns, the whole process exits and the blocked producer goroutine is killed along with it. So *this* program doesn't visibly leak.\n\nBut change one thing — make this a request handler inside a long-running server instead of `main` — and it leaks badly: after the consumer reads 3 values and returns, the producer blocks on its 4th `ch <- i` with no receiver and no way to be told to stop. That goroutine lives until the process restarts.\n\nThe lesson: a blocked send with no receiver and no cancellation path is a leak; it only *looks* harmless when the process happens to exit right after. The fix is to give the producer a `ctx` to select on and cancel it when the consumer is done (`defer cancel()`).",
    },
    "failure-cases": {
      body: "Almost every pattern bug is a close-ownership mistake, an unbounded fan-out, or a missing cancellation path. Here are the ones you'll actually hit.",
      blocks: [
        {
          type: "points",
          items: [
            "**Blocked send after the consumer stops** → the sending goroutine leaks forever. Add a `ctx.Done()` case to every send and cancel when the consumer finishes.",
            "**Two goroutines closing one merged channel** → `panic: close of closed channel`. Use a single WaitGroup-gated `close`.",
            "**A stage that forgets to close its output** → the next stage's `for range` hangs forever. Every stage needs `defer close(out)`.",
            "**Unbounded fan-out (one goroutine per job)** → exhausts the scarce resource (sockets, DB connections) and can deadlock the collector. Use a fixed worker pool.",
            "**Cancelling the context but still blocking on a bare `ch <- v`** → cancellation can't unblock a plain send; only a `select` watching `ctx.Done()` can. A leak survives the cancel.",
            "**Collecting a fixed N results when a worker might error and not send** → the collector blocks on the missing receive. Send an error result or use errgroup.",
          ],
        },
        {
          type: "example",
          example: {
            title: "Cancel without a select still leaks",
            language: "go",
            code: "ctx, cancel := context.WithCancel(context.Background())\nout := make(chan int)\ngo func() {\n    out <- expensive() // BUG: bare send; cancel() cannot unblock this\n}()\ncancel()               // consumer gives up...\n// ...but the goroutine is stuck on `out <- ...` forever — a leak.\n\n// Fix: make the send cancellable.\ngo func() {\n    select {\n    case out <- expensive():\n    case <-ctx.Done(): // now cancel() lets the goroutine return\n        return\n    }\n}()",
            takeaway:
              "A context cancel is only a signal — it does nothing to a goroutine blocked on a bare send. Every blocking send in a cancellable system must be inside a `select` that also watches `ctx.Done()`.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "These patterns are powerful, but each buys speed with complexity — name the costs so you choose deliberately, and remember that the cheapest correct option is often a plain loop.",
      blocks: [
        {
          type: "points",
          items: [
            "**Concurrency vs sequential**: concurrency overlaps *waiting*, so it wins for I/O-bound, independent work. For CPU-cheap or short work, goroutine and channel overhead costs more than it saves and a `for` loop is clearer and obviously correct.",
            "**Pipeline stages**: clean separation and natural streaming, but every stage is a goroutine and a channel hop — for a two-line transform, a plain loop beats a four-stage pipeline.",
            "**Fan-out width / pool size**: more workers help only up to the scarce resource; past that they add contention and memory without speeding anything up. Size to the bottleneck, not to the job count.",
            "**errgroup vs hand-rolled pool**: errgroup is less code and gets cancellation right, but hides the channels; a hand-rolled pool is more explicit when you need custom backpressure or result routing.",
            "**Buffering channels between stages**: can smooth bursty producers, but a too-large buffer hides a slow consumer (backpressure) and grows memory. Buffer for a reason, not by reflex.",
          ],
        },
      ],
    },
    design: {
      body: "A few durable rules keep concurrent structures correct. Give every goroutine a guaranteed end — its input channel gets closed, or its context gets cancelled — on *every* path. Let the sender own the close, and in fan-in let exactly one WaitGroup-gated goroutine do it. Bound concurrency to the scarce resource with a pool or `SetLimit`, never to the number of tasks. Guard every blocking send with `select` on `ctx.Done()`. And before any of that, ask the first question honestly: does this work actually benefit from concurrency at all?",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "When sequential is the better answer",
            text: "Reach for a plain loop when the work is CPU-cheap and short (the coordination costs more than it saves), when ordering matters (concurrency reorders unless you add machinery to prevent it), or when there's just not much of it. Concurrency is a tool for overlapping *waiting*, not a badge of sophistication — the simplest correct code wins, and often that's `for _, x := range xs { ... }`.",
          },
        },
        {
          type: "scenario",
          scenario: {
            title: "Sizing the pool to the database, not the batch",
            context:
              "A nightly job must recompute balances for 200,000 accounts against a database with a pool of 25 connections. The first draft launches a goroutine per account and the database immediately starts refusing connections.",
            insight:
              "The bound must match the scarce resource: run ~25 workers (matching the connection pool) draining a jobs channel, so at most 25 queries are ever in flight. The batch size is irrelevant to the bound — 200,000 jobs still flow through 25 workers. Add a shared context so a failure or a shutdown cancels the whole run cleanly.",
          },
        },
        {
          type: "points",
          items: [
            "Every goroutine needs a guaranteed end on every path: input closed or context cancelled.",
            "Sender owns the close; fan-in closes once via a WaitGroup; bound to the scarce resource.",
            "Ask first whether concurrency helps at all — often a sequential loop is correct and clearer.",
          ],
        },
      ],
    },
    mastery: {
      body: "You've mastered this when you can explain how pipeline, fan-out, fan-in, and worker pool differ and compose (and the close/ownership rule each needs), predict whether a given structure leaks a goroutine when its consumer stops early or its context is cancelled, implement a worker pool that bounds concurrency and shuts down cleanly on cancellation, and defend a sequential-vs-concurrent choice from where the time actually goes. Attest a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "Two ideas carry this capstone. **Patterns compose the primitives into reliable systems** — a pipeline chains channel-connected stages, fan-out parallelises a slow one, fan-in merges results (closing the merged channel once via a WaitGroup), and a worker pool bounds concurrency to a scarce resource; errgroup packages the run-bound-cancel-collect case.\n\n**Every one of them must be cancellable and leak-free** — the sender owns the close, each stage watches `ctx.Done()` on its sends, and every goroutine has a guaranteed end. And the meta-lesson: concurrency is for overlapping *waiting*, so when work is CPU-cheap, short, or order-sensitive, a plain sequential loop is the correct, clearer choice.",
      blocks: [
        {
          type: "points",
          items: [
            "Pipeline: stages connected by channels; each ranges its input and `defer close(out)`s its output.",
            "Fan-out parallelises a slow stage; fan-in merges channels and closes the output once with a WaitGroup.",
            "Worker pool = fixed k goroutines draining one jobs channel — bound k to the scarce resource; errgroup adds first-error cancellation and SetLimit.",
            "Guard every blocking send with `select` on `ctx.Done()` so a cancelled system drains instead of leaking — and prefer a sequential loop when concurrency wouldn't pay for its complexity.",
          ],
        },
      ],
    },
  },
};
