import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 6 — data races: what they really are, why they break ordinary reasoning
 * (not just a wrong number), and how to find and kill them with the race
 * detector. Written in the Module 0–5 voice: plain language, one analogy per
 * hard idea, a concrete example before every abstract rule. The throughline is
 * "a race is a missing happens-before, and the detector proves it for you" —
 * you establish ordering with a mutex, atomics, or a channel, then run
 * `-race` against real tests and load to confirm none remain.
 */
export const goRacesDetector: Lesson = {
  id: "go-races-detector",
  slug: "races-detector",
  title: "Data races & the race detector",
  description:
    "Learn what a data race is — unsynchronized concurrent access where at least one goroutine writes — why the result is unreliable, and how to detect and eliminate it with Go's race detector.",
  moduleId: "go-6",
  estimatedMinutes: 50,
  difficulty: "advanced",
  prerequisites: ["go-sync-atomic"],
  learningObjectives: [
    "Define a data race precisely and explain why ordinary sequential reasoning no longer applies",
    "Establish a happens-before relationship with a mutex, atomics, or a channel to make concurrent access safe",
    "Use `go test -race` and `go run -race` against real tests and load to detect and eliminate races",
  ],
  concepts: ["data-race", "race-detector", "happens-before"],
  references: [
    {
      title: "Introducing the Go Race Detector",
      url: "https://go.dev/blog/race-detector",
      teaches:
        "What the race detector is, how to turn it on with `-race`, and the key limitation that it only reports races that actually execute at runtime.",
      relevance:
        "This is the canonical introduction to the exact tool the lesson teaches, straight from the Go team.",
      required: false,
      section: "How to use it; A limitation",
    },
    {
      title: "Data Race Detector",
      url: "https://go.dev/doc/articles/race_detector",
      teaches:
        "The full usage reference — the four supported `-race` commands, how to read the two conflicting-access report, and the runtime and memory cost that makes it a testing tool.",
      relevance:
        "Backs the mechanics of reading a race report and the 'testing tool, not production' trade-off in this lesson.",
      required: false,
      section: "Usage; Report format; Options; Runtime overhead",
    },
    {
      title: "The Go Memory Model",
      url: "https://go.dev/ref/mem",
      teaches:
        "The normative definition of a data race and of happens-before — the guarantee that one memory operation is observed to complete before another.",
      relevance:
        "Confirms the lesson's core claim that the fix for a race is establishing a happens-before ordering, not just 'adding a lock somewhere'.",
      required: false,
      section: "Memory Model; Data races; Synchronization",
    },
  ],
  exercises: [
    {
      id: "go6rc-predict-counter",
      type: "prediction",
      prompt:
        "1000 goroutines each run `counter++` on a shared `int` with no lock, and the program waits for all of them with a WaitGroup. Predict two things before reading on: (1) will the final value reliably be 1000, and (2) will it be the same on every run?",
      expectedAnswer:
        "No and no. `counter++` is a read-modify-write, not one atomic step, so goroutines overwrite each other's updates. The final value is usually less than 1000 and varies from run to run because the interleaving is nondeterministic.",
      hints: [
        "`counter++` is really: read counter, add 1, write it back — three steps.",
        "Two goroutines can both read the same old value and both write back the same new one, losing an increment.",
      ],
    },
    {
      id: "go6rc-read-report",
      type: "code-reading",
      prompt:
        "You run `go test -race` and it prints `WARNING: DATA RACE`, then two stacks labeled `Write at 0x...` and `Previous read at 0x...` on the same address, plus the goroutines that did each. Explain in plain words what the detector observed and what it is NOT claiming.",
      hints: [
        "The two stacks are the two conflicting accesses to the same memory, from different goroutines, with no ordering between them.",
        "It reports a race it actually saw execute; it is not proving your program is race-free elsewhere.",
      ],
    },
    {
      id: "go6rc-implement-safe-counter",
      type: "implementation",
      prompt:
        "Fix the racy counter so 1000 goroutines each add 1 and the final total is reliably 1000. Use a `sync.Mutex` to establish ordering around the shared variable.",
      starterCode:
        'package main\n\nimport (\n\t"fmt"\n\t"sync"\n)\n\nfunc main() {\n\tvar counter int\n\tvar wg sync.WaitGroup\n\tfor i := 0; i < 1000; i++ {\n\t\twg.Add(1)\n\t\tgo func() {\n\t\t\tdefer wg.Done()\n\t\t\tcounter++ // RACE: unsynchronized read-modify-write\n\t\t}()\n\t}\n\twg.Wait()\n\tfmt.Println(counter) // want: 1000\n}',
      expectedAnswer:
        'package main\n\nimport (\n\t"fmt"\n\t"sync"\n)\n\nfunc main() {\n\tvar counter int\n\tvar mu sync.Mutex\n\tvar wg sync.WaitGroup\n\tfor i := 0; i < 1000; i++ {\n\t\twg.Add(1)\n\t\tgo func() {\n\t\t\tdefer wg.Done()\n\t\t\tmu.Lock()\n\t\t\tcounter++\n\t\t\tmu.Unlock()\n\t\t}()\n\t}\n\twg.Wait()\n\tfmt.Println(counter) // 1000\n}',
      hints: [
        "Lock before touching `counter` and unlock after, so only one goroutine is in the critical section at a time.",
        "The unlock/lock pair establishes happens-before: each increment is observed to complete before the next begins.",
      ],
    },
    {
      id: "go6rc-debug-flaky-test",
      type: "debugging",
      prompt:
        "A test passes locally every time but fails ~1 in 50 runs in CI with a corrupted map value. A teammate says 'it's flaky, just retry it'. Explain why that's the wrong conclusion and what single command you'd run to get a definitive answer.",
      hints: [
        "Nondeterministic, load-dependent corruption of shared state is the signature of a data race, not random flakiness.",
        "Run the test under `go test -race` so a race is reported deterministically instead of surfacing as rare corruption.",
      ],
    },
    {
      id: "go6rc-refactor-atomic",
      type: "refactoring",
      prompt:
        "A hot path guards a single monotonically increasing request counter with a `sync.Mutex`, but the mutex is now the bottleneck under load. Refactor it to use `sync/atomic` and explain why the result is still race-free.",
      hints: [
        "`atomic.AddInt64(&n, 1)` performs the read-modify-write as one indivisible operation.",
        "Atomic operations establish happens-before on that variable, so the detector sees an ordering and reports no race.",
      ],
    },
    {
      id: "go6rc-design-race-vs-condition",
      type: "design",
      prompt:
        "You add a mutex around every shared variable and `go test -race` is now clean, but the account still occasionally shows the wrong balance. Explain how a program can be free of data races yet still have a race CONDITION, and how you'd fix the logic.",
      hints: [
        "A data race is unsynchronized memory access; a race condition is a logic bug in the ordering of correctly-synchronized operations.",
        "Check-then-act (read balance, then subtract) can interleave even when each step is individually locked — hold the lock across the whole decision.",
      ],
    },
    {
      id: "go6rc-advanced-prove-free",
      type: "advanced",
      prompt:
        "Write a small program with 100 goroutines updating a shared balance, prove with `go run -race` that your first version races, then fix it and prove the fix is clean. Explain why running `-race` once with 100 goroutines is stronger evidence than running the racy version normally 100 times.",
      hints: [
        "The detector instruments memory accesses and reports the conflict the moment it observes one — it doesn't need the bug to produce a visibly wrong number.",
        "Running normally, a race often produces the 'right' answer by luck; `-race` catches the unsynchronized access itself.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-data-race",
      kind: "explain",
      description:
        "Define a data race precisely (concurrent access, at least one write, no synchronization) and explain why its result cannot be treated like an ordinary sequence of operations.",
      required: true,
    },
    {
      id: "implement-happens-before",
      kind: "implement",
      description:
        "Make a racy shared-counter program correct by establishing a happens-before relationship with a mutex, atomics, or a channel.",
      required: true,
    },
    {
      id: "debug-with-race-detector",
      kind: "debug",
      description:
        "Use `go test -race` / `go run -race` against real tests or load to detect a race and read the two conflicting stacks it reports.",
      required: false,
    },
    {
      id: "design-race-vs-condition",
      kind: "design",
      description:
        "Distinguish a data race from a race condition and defend a synchronization design that eliminates both.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "Once you have goroutines, more than one of them can touch the same piece of memory at the same time. Most of the time nothing looks wrong — the program runs, the tests pass, the numbers add up. Then, under real load in production, a total comes out wrong, a map value is corrupted, or the process crashes for no visible reason. This lesson is about that specific, dangerous class of bug: the **data race**.\n\nA data race is easy to create by accident and hard to catch by looking, because it's **nondeterministic** — it depends on the exact timing of goroutines, which changes from run to run. That's exactly why it hides in tests and only shows up when the system is busiest. The good news: Go ships a tool that finds these bugs for you, and the fix is always the same shape once you can name what's wrong.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "Imagine two people editing the same paper cheque at the same time. One reads the balance ($100), the other also reads $100, each subtracts their own withdrawal, and each writes their result back. One write lands on top of the other, so one withdrawal silently vanishes. Nobody did anything obviously wrong — there was just no rule about whose turn it was.",
          },
        },
        {
          type: "points",
          items: [
            "A **data race** is two or more goroutines touching the same memory at once, with at least one writing and no rule ordering them.",
            "It's **nondeterministic**: same code, different timing, different (sometimes correct-looking) result.",
            "That's why it survives testing and appears under load — the exact bug you least want in a money system.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Hold three facts and everything else follows.\n\nFirst, **synchronization is what creates happens-before. ** A `sync.Mutex` unlock happens-before the next lock of the same mutex; a `sync/atomic` operation orders accesses to that one variable; a send on a channel happens-before the corresponding receive. Any of these turns 'two unordered accesses' into 'a defined order'. Second, **you only need synchronization for *shared, mutable* memory.\n\n** A value only one goroutine ever touches, or one nobody writes after startup, can't race. Third, **a data race is not the same as a race condition. ** A data race is a low-level memory bug (unsynchronized access); a race condition is a *logic* bug about the order of operations — and you can have one without the other.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "The one-sentence rule",
            text: "If two goroutines can touch the same memory and at least one writes, you must establish happens-before between them — with a mutex, an atomic, or a channel — or it is a data race.",
          },
        },
        {
          type: "note",
          note: {
            tone: "warning",
            title: "Data race ≠ race condition",
            text: "A DATA RACE is unsynchronized access to memory. A RACE CONDITION is a logic bug where the correctness depends on timing even though each access is synchronized. Fixing all data races (the detector's job) does not automatically fix race conditions (your logic's job).",
          },
        },
      ],
    },
    mechanics: {
      body: "Now the precise picture. Each goroutine runs on its own, and the Go scheduler can pause and resume them between almost any two machine instructions. So when two goroutines both execute the read-modify-write behind `counter++`, their individual steps can interleave in any order. If both read before either writes, one increment is lost — and which interleaving you get depends on scheduling, which is why the result changes run to run.\n\nSynchronization removes the choice. A **mutex** (mutual-exclusion lock) lets only one goroutine into the **critical section** (the code between `Lock` and `Unlock`) at a time; the unlock establishes happens-before with the next lock, so increments are strictly ordered. A **`sync/atomic`** operation does the read-modify-write as one indivisible hardware step, so there's no gap to interleave into. A **channel** hands the value from one goroutine to another with a guaranteed send-before-receive ordering. Each is a different tool for the same job: creating happens-before.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Two increments, without and with a lock",
            kind: "compare",
            nodes: [
              {
                id: "racy",
                label: "No synchronization",
                detail: "G1 reads 41 · G2 reads 41 · G1 writes 42 · G2 writes 42 → lost update",
                tone: "danger",
              },
              {
                id: "safe",
                label: "Mutex-ordered",
                detail: "G1 lock→read 41→write 42→unlock · then G2 lock→read 42→write 43 → correct",
                tone: "success",
              },
              {
                id: "why",
                label: "The difference",
                detail:
                  "the unlock/lock pair establishes happens-before between the two increments",
                tone: "accent",
              },
            ],
            caption:
              "Same two goroutines. The lock doesn't slow the logic down conceptually — it imposes an order so no update lands on top of another.",
          },
        },
        {
          type: "points",
          items: [
            "The scheduler can interleave goroutines between almost any two steps, so unordered read-modify-writes collide.",
            "A **mutex** serializes the **critical section**; unlock happens-before the next lock.",
            "**Atomics** make the read-modify-write indivisible; a **channel** orders send-before-receive.",
          ],
        },
      ],
    },
    diagram: {
      body: "Picture what the **race detector** does when it runs. It doesn't read your code and reason about it; it *instruments* every memory access at build time, then watches the program actually run. For each access it records which goroutine touched which address and whether any synchronization ordered it. The instant it sees two accesses to the same address from different goroutines with a write and no happens-before between them, it prints a report with both stacks. Follow the flow below.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "How the race detector decides",
            kind: "flow",
            nodes: [
              {
                id: "instr",
                label: "instrument",
                detail: "-race rewrites memory accesses at build time",
              },
              {
                id: "watch",
                label: "observe run",
                detail: "records goroutine + address + synchronization per access",
              },
              {
                id: "check",
                label: "same address, a write, no happens-before?",
                detail: "checked as the program actually executes",
                tone: "accent",
              },
              {
                id: "clean",
                label: "no report",
                detail: "no conflicting access was observed this run",
                tone: "success",
              },
              {
                id: "report",
                label: "WARNING: DATA RACE",
                detail: "prints both conflicting stacks + goroutines",
                tone: "danger",
              },
            ],
            caption:
              "It reports only races it actually observes executing — so you must run it against code paths that really run (real tests, real load).",
          },
        },
      ],
    },
    implementation: {
      body: "You turn the detector on with the `-race` flag, and it works with the commands you already use: `go run -race`, `go test -race`, and `go build -race`. There's nothing else to configure — the compiler and runtime do the instrumentation. Below is the racy counter, the report you get, and the mutex fix that makes it clean. Reading the report is the skill: it names the two conflicting accesses and the goroutines that made them, which points you straight at the shared variable.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Detecting and fixing the race with -race",
            language: "go",
            code: 'package main\n\nimport (\n\t"fmt"\n\t"sync"\n)\n\nfunc main() {\n\tvar counter int\n\tvar mu sync.Mutex // add the lock\n\tvar wg sync.WaitGroup\n\tfor i := 0; i < 1000; i++ {\n\t\twg.Add(1)\n\t\tgo func() {\n\t\t\tdefer wg.Done()\n\t\t\tmu.Lock()\n\t\t\tcounter++ // now inside the critical section\n\t\t\tmu.Unlock()\n\t\t}()\n\t}\n\twg.Wait()\n\tfmt.Println(counter) // reliably 1000\n}\n\n// Before the fix:\n// $ go run -race main.go\n// ==================\n// WARNING: DATA RACE\n// Write at 0x00c0000b4010 by goroutine 8:\n//   main.main.func1()\n//       main.go:15 +0x...\n// Previous read at 0x00c0000b4010 by goroutine 7:\n//   main.main.func1()\n//       main.go:15 +0x...\n// ==================\n//\n// After the fix: (no output, exit 0)',
            takeaway:
              "`-race` names both conflicting accesses and their goroutines. The mutex adds happens-before, and the report disappears.",
          },
        },
        {
          type: "points",
          items: [
            "Enable it with `go run -race`, `go test -race`, or `go build -race` — no other setup.",
            "The report pairs the two conflicting accesses (e.g. `Write at` / `Previous read at`) on the same address.",
            "A clean run prints nothing and exits 0 — but only proves the paths you actually exercised.",
          ],
        },
      ],
    },
    experiment: {
      body: "Before reading on, make a prediction — a corrected wrong guess sticks better than a right answer you skimmed. You take the racy counter (no lock) and run it *without* `-race` a hundred times; sometimes it prints 1000, sometimes less. Then you run it *once* with `go run -race`.\n\nQuestion: to be confident this program has a bug, is it better to run it 100 times normally, or once with `-race`? And why can the normal runs mislead you? Decide now, then reveal.\n\nThe answer: **once with `-race` is far stronger evidence. ** Run normally, a racy program frequently prints the 'right' answer purely by luck of scheduling — so a green run proves nothing, and even 100 green runs don't prove the code is safe.\n\nThe detector doesn't wait for the bug to produce a visibly wrong number; it flags the *unsynchronized access itself* the moment it observes it, whether or not this run happened to lose an increment. That's the whole point: it turns a rare, timing-dependent symptom into a deterministic report.\n\nThe catch, from the same fact: it can only report races on code that actually executes during that run — so you must point it at real tests and real load, not a trivial happy path.",
    },
    "failure-cases": {
      body: "The mistakes here are rarely loud crashes at first — they're silent corruption and false confidence. Here are the ones you'll actually meet and the signal each gives.",
      blocks: [
        {
          type: "points",
          items: [
            "**Assuming `x++` or `x = x + 1` is atomic** → lost updates under load. It's a read-modify-write; guard it with a mutex or use `sync/atomic`.",
            "**Concurrent map access** → not just wrong values but a runtime crash (`concurrent map writes`). Maps are not safe for concurrent write; synchronize or use `sync.Map`.",
            "**Trusting a clean normal run** → a race often prints the right answer by luck. Only `-race` (or a proof of happens-before) tells you it's safe.",
            "**Running `-race` only on the happy path** → it finds nothing because the racy path never executed. Run it against real tests and load.",
            "**Leaving `-race` on in production** → real memory and CPU overhead (roughly 5–10x memory, 2–20x slower). It's a testing tool, not a deployment mode.",
            "**Confusing a clean detector run with correct logic** → the detector finds data races, not race conditions; your ordering logic can still be wrong.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "The 'flaky' test that was a real bug",
            context:
              "A test failed about 1 run in 50 in CI with a corrupted result and passed every time locally. The team marked it flaky and added an automatic retry.",
            insight:
              "Load- and timing-dependent corruption of shared state is the signature of a data race, not flakiness. Running the suite with `go test -race` reproduced it deterministically and pointed at an unguarded shared map. The retry had been hiding a genuine correctness bug.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "The detector and the synchronization tools each have real costs, and choosing well means matching the tool to the situation. The honest trade-offs:",
      blocks: [
        {
          type: "points",
          items: [
            "**Race detector**: catches real races with near-zero false positives, but adds large runtime and memory overhead and only sees executed paths — so it's a CI/testing tool, never a production setting.",
            "**Mutex**: simple and general, protects any critical section, but serializes access and can become a bottleneck or deadlock if misused.",
            "**`sync/atomic`**: very fast for a single counter or flag, but only covers one variable's operation — it can't make a multi-step invariant atomic.",
            "**Channel**: expresses ownership hand-off cleanly ('share by communicating'), but is heavier than a mutex for simply guarding one shared number.",
          ],
        },
        {
          type: "note",
          note: {
            tone: "tip",
            title: "The rule of thumb",
            text: "Guard a single number or flag with an atomic; guard a multi-step critical section with a mutex; hand ownership between goroutines with a channel. Then run `-race` in CI to prove you got it right.",
          },
        },
      ],
    },
    design: {
      body: "Turn this into durable habits. Design so that shared mutable state is rare and obvious: prefer giving each goroutine its own data, or passing ownership over a channel, so there's nothing to race on. Where you genuinely must share, pick the lightest tool that establishes happens-before — an atomic for one counter, a mutex for a critical section — and keep the critical section small.\n\nMost importantly, make `go test -race` part of CI so a race fails the build instead of reaching production. And remember the boundary: the detector proves the *absence of data races on the paths you run*, not the correctness of your *logic* — those race conditions are still yours to reason about.",
      blocks: [
        {
          type: "points",
          items: [
            "Minimize shared mutable state; prefer per-goroutine data or channel hand-off so races can't exist.",
            "Where you must share, use the lightest happens-before tool and keep critical sections small.",
            "Run `go test -race` in CI; treat any report as a build-failing correctness bug.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Data-race-free but still a race condition",
            context:
              "An account service locks the balance for each read and each write individually, so `go test -race` is clean. Yet a withdrawal occasionally overdraws: two goroutines each lock-read the balance ($100), each see enough funds, then each lock-write their subtraction.",
            insight:
              "No data race — every access was synchronized. But the check-then-act decision wasn't atomic: the lock must be held across the *whole* read-decide-write, not each step separately. That's a race condition in the logic, and only correct design fixes it.",
          },
        },
      ],
    },
    mastery: {
      body: "You understand this lesson when you can define a data race, make a racy counter correct with synchronization, run `go test -race` and read the conflicting stacks it reports, and distinguish a data race from a broader race condition.",
    },
    summary: {
      body: "One idea carries this lesson: **a data race is missing synchronization, and the fix is to establish ordering.** When two goroutines access the same memory, at least one writes, and neither access happens before the other, ordinary sequential reasoning does not apply. Establish ordering with a mutex, an atomic, or a channel, then run the race detector against realistic tests.",
      blocks: [
        {
          type: "points",
          items: [
            "Data race = same memory + at least one write + no happens-before relationship.",
            "`counter++` is a read-modify-write, not atomic; concurrent unsynchronized increments lose updates.",
            "Fix by establishing happens-before: a mutex, `sync/atomic`, or a channel.",
            "Detect with `go run -race` / `go test -race` / `go build -race`; it reports only executed races, so run it against real tests and load, and never in production.",
            "A clean detector run means no data races on the paths you ran — not that your logic is free of race conditions.",
          ],
        },
      ],
    },
  },
};
