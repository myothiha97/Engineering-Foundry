import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * The lesson id is kept for saved-progress compatibility. Context now has its
 * own lesson after channels, where cancellation can be explained without
 * assuming concurrency knowledge here.
 */
export const goTimeContext: Lesson = {
  id: "go-time-context",
  slug: "time-context",
  title: "Time and durations",
  description:
    "Represent moments and durations, measure elapsed time, and safely parse, format, and move times across zones.",
  moduleId: "go-5",
  estimatedMinutes: 45,
  difficulty: "beginner",
  prerequisites: ["go-functions-defer"],
  learningObjectives: [
    "Explain the difference between a time.Time and a time.Duration",
    "Measure elapsed time with time.Now and time.Since",
    "Write durations with an explicit unit such as time.Second",
    "Parse and format an RFC3339 timestamp and keep stored times in UTC",
  ],
  concepts: ["time", "duration", "elapsed-time", "deadlines", "formatting", "time-zones"],
  references: [
    {
      title: "Package time",
      url: "https://pkg.go.dev/time",
      teaches: "The official API for moments, durations, clocks, and timers.",
      relevance: "Use it as a lookup after the lesson when you need another time operation.",
      required: false,
      section: "Time; Duration; Parse; Format; Location",
    },
    {
      title: "Monotonic clocks in Go",
      url: "https://pkg.go.dev/time#hdr-Monotonic_Clocks",
      teaches: "Why elapsed-time measurements stay reliable when the wall clock changes.",
      relevance: "Optional depth for understanding why time.Since is preferred for elapsed time.",
      required: false,
      section: "Monotonic clocks",
    },
  ],
  exercises: [
    {
      id: "go5tc-predict-duration",
      type: "prediction",
      prompt: "You write `d := 5 * time.Second`. Predict what `int64(d)` prints and explain why.",
      expectedAnswer:
        "5000000000. A time.Duration stores a count of nanoseconds, and five seconds contains five billion nanoseconds.",
      hints: ["time.Second equals 1,000,000,000 nanoseconds."],
    },
    {
      id: "go5tc-read-elapsed",
      type: "code-reading",
      prompt:
        "Read `start := time.Now(); doWork(); elapsed := time.Since(start)`. Explain what each value represents.",
      expectedAnswer:
        "start is the moment measurement began. elapsed is the length of time between that moment and the call to time.Since.",
      hints: ["One value is a point in time; the other is a length of time."],
    },
    {
      id: "go5tc-implement-expired",
      type: "implementation",
      prompt: "Implement expired so it reports whether now is after the deadline.",
      starterCode:
        'package main\n\nimport "time"\n\nfunc expired(now, deadline time.Time) bool {\n  // return true when now is later than deadline\n  return false\n}',
      expectedAnswer: "func expired(now, deadline time.Time) bool { return now.After(deadline) }",
      hints: ["time.Time has an After method."],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-time-duration",
      kind: "explain",
      description: "Explain the difference between a moment and a duration without notes.",
      required: true,
    },
    {
      id: "measure-elapsed",
      kind: "implement",
      description: "Measure how long a function takes with time.Now and time.Since.",
      required: true,
    },
    {
      id: "predict-unit",
      kind: "predict",
      description: "Predict the result of durations written with and without an explicit unit.",
      required: true,
    },
  ],
  sections: {
    problem: {
      body: "Programs often need to answer two different questions: **when** did something happen, and **how long** did something take? Those sound similar, but they use different Go types.\n\nA `time.Time` is one moment, such as 10:30 this morning. A `time.Duration` is a length of time, such as 250 milliseconds. Keeping those two ideas separate prevents most beginner mistakes in the `time` package.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "A clock reading is a moment: 10:30. A stopwatch result is a duration: 12 seconds. You can subtract two clock readings to get a stopwatch result.",
          },
        },
        {
          type: "points",
          items: [
            "`time.Now()` gives you the current moment as a `time.Time`.",
            "`time.Since(start)` gives you the elapsed `time.Duration` since an earlier moment.",
            "Write duration units explicitly: `500*time.Millisecond` or `2*time.Second`.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Keep one distinction in your head: **Time is a point; Duration is a distance between points.** You compare two `time.Time` values with methods such as `Before`, `After`, and `Equal`. You add or subtract a `time.Duration` when you want to move from one moment to another.\n\nA Duration is stored as a number of nanoseconds. That is why a bare `30` means 30 nanoseconds, not 30 seconds. Attach a unit so the code says what you mean: `30 * time.Second`.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Moments and durations",
            language: "go",
            code: 'start := time.Now()\n\n// pretend some work happens here\ntime.Sleep(100 * time.Millisecond)\n\nelapsed := time.Since(start)\nfmt.Println("took", elapsed)\n\ndeadline := start.Add(2 * time.Second)\nfmt.Println("past deadline?", time.Now().After(deadline))',
            takeaway: "start and deadline are moments. elapsed and 2*time.Second are durations.",
          },
        },
        {
          type: "example",
          example: {
            title: "Convert an instant for a user's time zone",
            language: "go",
            code: 'bangkok, err := time.LoadLocation("Asia/Bangkok")\nif err != nil {\n    return err\n}\n\nshown := t.In(bangkok).Format(time.RFC3339)\nfmt.Println(shown)',
            takeaway:
              "LoadLocation reads an IANA time-zone name and can fail, so check its error. In changes the displayed location, not the instant itself.",
          },
        },
      ],
    },
    diagram: {
      body: "Read this from left to right. Two moments mark positions on a timeline. The space between them is a duration.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Moment → duration → moment",
            kind: "sequence",
            nodes: [
              {
                id: "start",
                label: "start: time.Time",
                detail: "the moment measurement begins",
              },
              {
                id: "elapsed",
                label: "elapsed: time.Duration",
                detail: "the length of time that passed",
                tone: "accent",
              },
              {
                id: "end",
                label: "end: time.Time",
                detail: "the later moment",
              },
            ],
          },
        },
      ],
    },
    mechanics: {
      body: "The everyday API is small. `time.Now()` reads the current time. `time.Since(start)` measures elapsed time. `t.Add(d)` returns a new moment shifted by a duration. `t.Before(other)`, `t.After(other)`, and `t.Equal(other)` compare moments. `time.Sleep(d)` pauses the current goroutine for at least that duration.\n\nFor text, Go formats and parses with a **reference layout**, not tokens such as `YYYY-MM-DD`. The layout is the memorable reference time `Mon Jan 2 15:04:05 MST 2006`; to exchange timestamps between systems, use the ready-made `time.RFC3339` layout. `time.Parse(time.RFC3339, text)` returns a `time.Time`, and `t.Format(time.RFC3339)` returns text. A `time.Time` also carries a location. Keep stored and transmitted instants in UTC (`t.UTC()`), then convert to a user's location only for display with `t.In(location)`.\n\nYou do not need to understand goroutines yet to use `Sleep`; for now, treat it as pausing the current work. The concurrency module explains what Go can run while one goroutine waits.",
      blocks: [
        {
          type: "points",
          items: [
            "Measure elapsed work with `start := time.Now()` and `time.Since(start)`.",
            "Create a future moment with `deadline := time.Now().Add(2*time.Second)`.",
            "Compare moments with methods, not with `==` when time-zone or clock details may differ.",
            "Parse API timestamps with `time.Parse(time.RFC3339, text)`; format with `t.Format(time.RFC3339)`.",
            "Store and transmit instants in UTC; convert to a user location only at the display edge.",
          ],
        },
        {
          type: "example",
          example: {
            title: "Parse, normalize, and format a timestamp",
            language: "go",
            code: 't, err := time.Parse(time.RFC3339, "2026-07-16T09:30:00+07:00")\nif err != nil {\n    return err\n}\n\ncanonical := t.UTC().Format(time.RFC3339)\nfmt.Println(canonical) // 2026-07-16T02:30:00Z',
            takeaway:
              "The offset changes, but the instant does not. RFC3339 keeps the offset explicit and UTC gives storage one canonical zone.",
          },
        },
      ],
    },
    implementation: {
      body: "Start with the most useful patterns: measure one operation with `time.Since`, and use RFC3339 at system boundaries. A printed duration automatically uses a readable unit such as `ms` or `s`; a timestamp needs an explicit layout.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Measure a function",
            language: "go",
            code: 'func measure() {\n    start := time.Now()\n    doWork()\n    fmt.Println("elapsed:", time.Since(start))\n}',
            takeaway:
              "Use time.Since for elapsed time instead of subtracting clock numbers yourself.",
          },
        },
      ],
    },
    experiment: {
      body: "Predict the difference between `time.Sleep(2)` and `time.Sleep(2 * time.Second)`. The first waits for only two nanoseconds—so little time that it appears immediate. The second waits for two seconds. The unit is part of the meaning.",
    },
    "failure-cases": {
      body: "Most beginner time bugs come from mixing up a moment and a duration, or forgetting the duration unit.",
      blocks: [
        {
          type: "points",
          items: [
            "**Using a bare number** → it means nanoseconds. Write `5*time.Second`.",
            "**Adding two moments** → moments are positions, not lengths. Subtract them to get a duration, or add a duration to one moment.",
            "**Using Sleep as real scheduling** → Sleep only waits; it does not guarantee that another task finishes. Use synchronization later in the concurrency module.",
            "**Writing `YYYY-MM-DD` as a layout** → Go treats it as literal text. Use `2006-01-02`, or `time.RFC3339` for API timestamps.",
            "**Dropping the time zone** → the same clock reading can mean different instants. Keep an offset in exchanged timestamps and normalize storage to UTC.",
            "**Ignoring LoadLocation's error** → an unknown or unavailable zone leaves no usable location. Check the error before calling `t.In(location)`.",
          ],
        },
      ],
    },
    "trade-offs": {
      body: "After learning channels, return to `time.Timer` and `time.Ticker` for work that must be stopped, reset, or repeated. They are intentionally optional here because their useful API exposes channels.",
    },
    design: {
      body: "Keep units beside values and pass durations into functions instead of passing unexplained integers. A parameter named `timeout time.Duration` is much clearer than `timeout int`. Use `time.RFC3339` when systems exchange timestamps, store instants in UTC, and keep a user's time-zone choice separately for display. Compare instants with `Equal`, `Before`, or `After` rather than assuming their locations or internal clock data match.",
    },
    mastery: {
      body: "You understand this lesson when you can identify a moment versus a duration, measure elapsed work, spot a missing unit such as `time.Sleep(5)`, and round-trip an RFC3339 timestamp without losing its instant.",
    },
    summary: {
      body: "Keep one model: **`time.Time` is a moment; `time.Duration` is a length of time.** Read the current moment with `time.Now`, measure elapsed time with `time.Since`, always attach a unit such as `time.Second`, and use RFC3339 plus UTC when time crosses a system boundary.",
      blocks: [
        {
          type: "points",
          items: [
            "Moment: `time.Time`.",
            "Length of time: `time.Duration`.",
            "Elapsed time: `time.Since(start)`.",
            "Exchange: `time.RFC3339`; storage: UTC; display: the user's location.",
            "Context and cancellation come later, after goroutines and channels.",
          ],
        },
      ],
    },
  },
};
