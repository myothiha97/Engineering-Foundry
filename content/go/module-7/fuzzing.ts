import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 7 — native Go fuzzing (Go 1.18+). Same beginner-friendly voice as the
 * earlier modules: plain language, one analogy per hard idea, a concrete example
 * before the abstract rule. Correct and careful about FuzzXxx signatures, seed
 * corpus vs. generated inputs, the testdata/fuzz crasher file, per-package /
 * one-target-per-run limits, and the two great fuzz-friendly properties
 * (no-panic and round-trip invariants). Builds on table tests: there YOU pick
 * the inputs; here the machine picks them.
 */
export const goFuzzing: Lesson = {
  id: "go-fuzzing",
  slug: "fuzzing",
  title: "Fuzzing",
  description:
    "Let the machine invent inputs for you: write a `FuzzXxx` test, seed its corpus with `f.Add`, assert a property that must always hold, and turn every crasher it finds into a permanent regression test.",
  moduleId: "go-7",
  estimatedMinutes: 45,
  difficulty: "advanced",
  prerequisites: ["go-unit-table-tests"],
  learningObjectives: [
    "Write a `func FuzzXxx(f *testing.F)` fuzz test, seed its corpus with `f.Add`, and assert a property inside `f.Fuzz`",
    "Explain the difference between running the seed corpus with plain `go test` and generating new inputs with `go test -fuzz`",
    "Triage a discovered crasher by reading its saved `testdata/fuzz` file, and choose fuzz-friendly properties (no-panic, round-trip, differential) instead of hand-picked cases",
  ],
  concepts: ["fuzzing", "corpus", "seed"],
  references: [
    {
      title: "Go Fuzzing tutorial",
      url: "https://go.dev/doc/tutorial/fuzz",
      teaches:
        "A step-by-step first fuzz test: writing FuzzXxx, seeding with f.Add, running -fuzz, and fixing the first crasher it reports.",
      relevance:
        "The canonical hands-on introduction this lesson mirrors — do it once and the mechanics click.",
      required: false,
      section: "Add a fuzz test",
    },
    {
      title: "Go Fuzzing (reference docs)",
      url: "https://go.dev/security/fuzz/",
      teaches:
        "The full model: supported input types, the seed vs. generated corpus, where crashers are saved, and command-line flags like -fuzz and -fuzztime.",
      relevance: "The authoritative reference for every rule stated in this lesson.",
      required: false,
      section: "Overview",
    },
    {
      title: "testing package — type F",
      url: "https://pkg.go.dev/testing#F",
      teaches:
        "The exact API of *testing.F: Add for seeding and Fuzz for registering the fuzz target.",
      relevance:
        "Settles the precise signatures and the rule that f.Add argument types must match the f.Fuzz parameters.",
      required: false,
      section: "type F",
    },
  ],
  exercises: [
    {
      id: "go7fz-predict-plaintest",
      type: "prediction",
      prompt:
        "You wrote `FuzzParse` with two `f.Add(...)` seeds, then run plain `go test ./...` (no `-fuzz` flag) on CI. Predict what the fuzz test does during that run.",
      expectedAnswer:
        "It runs as an ordinary test: it executes the fuzz target once for each seed you added with f.Add (and any inputs saved under testdata/fuzz), and does not generate new random inputs. It only generates new inputs when you pass -fuzz=FuzzParse.",
      hints: [
        "The `-fuzz` flag is what switches on input generation.",
        "Without it, the seed corpus still runs — that is why fuzz tests double as regular tests on CI.",
      ],
    },
    {
      id: "go7fz-read-signature",
      type: "code-reading",
      prompt:
        'Read this and say why it fails to compile:\n\n```go\nfunc FuzzParse(f *testing.F) {\n    f.Add("12.50")\n    f.Fuzz(func(t *testing.T, n int) {\n        _ = Parse(n)\n    })\n}\n```\nWhat is the rule being violated?',
      expectedAnswer:
        "The seed added with f.Add is a string, but the f.Fuzz target's fuzz argument is an int. The types of the f.Add arguments must match, in order, the types of the f.Fuzz function's arguments after the *testing.T. Change the seed to an int, or change the target parameter to string.",
      hints: [
        "Line up each f.Add argument with the corresponding f.Fuzz parameter after t.",
        "Fuzzable argument types are a fixed set (string, []byte, int, the numeric types, bool, rune, ...); the seed type must equal the target's type.",
      ],
    },
    {
      id: "go7fz-implement-roundtrip",
      type: "implementation",
      prompt:
        "Write a fuzz test `FuzzAmountRoundTrip` for an amount codec with `func FormatAmount(cents int64) string` and `func ParseAmount(s string) (int64, error)`. Seed the corpus with at least three int64 values (include 0 and a negative), then assert the round-trip invariant: parsing the formatted amount must return the original cents with no error.",
      starterCode:
        'package money\n\nimport "testing"\n\n// FormatAmount renders cents as e.g. "12.50"; ParseAmount is its inverse.\nfunc FuzzAmountRoundTrip(f *testing.F) {\n\t// TODO: seed the corpus, then register the fuzz target\n}',
      expectedAnswer:
        'package money\n\nimport "testing"\n\nfunc FuzzAmountRoundTrip(f *testing.F) {\n\tf.Add(int64(0))\n\tf.Add(int64(1250))\n\tf.Add(int64(-99))\n\tf.Fuzz(func(t *testing.T, cents int64) {\n\t\tgot, err := ParseAmount(FormatAmount(cents))\n\t\tif err != nil {\n\t\t\tt.Fatalf("ParseAmount(FormatAmount(%d)) returned error: %v", cents, err)\n\t\t}\n\t\tif got != cents {\n\t\t\tt.Errorf("round-trip mismatch: got %d, want %d", got, cents)\n\t\t}\n\t})\n}',
      hints: [
        "Each f.Add takes one int64 seed, and the f.Fuzz target's single fuzz parameter must also be int64.",
        "The property is Parse(Format(x)) == x: format the fuzzed cents, parse it back, and fail if it errors or differs.",
      ],
    },
    {
      id: "go7fz-design-property",
      type: "design",
      prompt:
        "You want to fuzz `ParseTransaction(raw string) (Transaction, error)`, which turns a raw CSV line into a typed transaction. A returned error is a legitimate outcome for malformed input, so 'it never errors' is a bad property. Propose one or two fuzz-friendly properties that this parser must satisfy for ALL inputs.",
      expectedAnswer:
        "Good properties: (1) No-panic — for any input string, ParseTransaction must return normally (a Transaction or an error), never panic or hang; the test just calls it and lets a panic fail the run. (2) Round-trip on the success path — if err == nil, then re-parsing the formatted transaction must reproduce it: ParseTransaction(Format(tx)) == tx. Optionally (3) differential — compare against a slow, obviously-correct reference parser and require identical results. Each holds for every input, which is exactly what fuzzing needs.",
      hints: [
        "A property must be true for EVERY input, so it can't assume the input is valid.",
        "The two workhorses are 'never panics' and 'Parse and Format are inverses on the success path'.",
      ],
    },
    {
      id: "go7fz-debug-crasher",
      type: "debugging",
      prompt:
        'Running `go test -fuzz=FuzzParseAmount` stops and reports a failure, saving `testdata/fuzz/FuzzParseAmount/a1b2c3`. The file\'s fuzzed value is the string `""` (empty). ParseAmount does `parts := strings.Split(s, "."); whole := parts[0]; frac := parts[1]` and panics with index out of range. Explain the bug and fix it.',
      expectedAnswer:
        'For an input with no \'.\', strings.Split returns a slice of length 1, so parts[1] is out of range and panics — the fuzzer found the empty string reaches that line. The fix is to handle the shape of the input before indexing: check len(parts) (or use strings.Cut) and return an error for malformed input instead of indexing blindly, e.g. `whole, frac, ok := strings.Cut(s, "."); if !ok { return 0, fmt.Errorf("missing decimal point: %q", s) }`. The saved crasher file stays in testdata/fuzz so plain `go test` replays the empty string forever as a regression test.',
      hints: [
        "strings.Split never guarantees more than one element — indexing parts[1] assumes a '.' was present.",
        "The saved file under testdata/fuzz is the exact failing input; run `go test` (no -fuzz) to replay just that case while you fix it.",
      ],
    },
    {
      id: "go7fz-read-corpusfile",
      type: "code-reading",
      prompt:
        'A teammate opens a crasher file at `testdata/fuzz/FuzzParse/f9c2` and sees:\n\n```\ngo test fuzz v1\nstring("1,,3")\n```\nExplain what this file is, what the two lines mean, and what happens to it on the next `go test`.',
      expectedAnswer:
        'It is a saved corpus entry that the fuzzer wrote when the fuzz target failed on this input. The first line is a format header (go test fuzz v1); the following line is the fuzzed argument and its type — here a single string value "1,,3". Because it lives under testdata/fuzz/FuzzParse, plain `go test` (no -fuzz) automatically re-runs FuzzParse with exactly this input, so it acts as a permanent regression test. It should be committed to the repo.',
      hints: [
        "The first line is a version header; each remaining line is one typed fuzz argument.",
        "Files under testdata/fuzz/<Name> are part of the seed corpus that runs during ordinary `go test`.",
      ],
    },
    {
      id: "go7fz-advanced-fuzztime",
      type: "advanced",
      prompt:
        "`go test -fuzz=FuzzParse` runs until it finds a failure or you interrupt it, which is fine locally but wrong for CI. Explain how you would run fuzzing in CI, why the fuzz target must be deterministic and fast, and what limits Go places on how many fuzz targets run per invocation.",
      expectedAnswer:
        "Use -fuzztime (e.g. `go test -fuzz=FuzzParse -fuzztime=30s`) so the fuzzing phase has a bounded budget and CI terminates; plain `go test` (seed corpus only) also runs on every CI build. The target must be deterministic — same input always same result — or the saved crasher won't reproduce, and it must be fast because the fuzzer runs it enormous numbers of times, so no network, sleeps, or randomness inside it. Go fuzzes one target per invocation: -fuzz takes a single target and fuzzing is per-package, so you can't generate inputs for several FuzzXxx functions in one run (the rest still execute their seed corpus as normal tests).",
      hints: [
        "There are two knobs: -fuzztime bounds the generative phase; the seed corpus runs regardless.",
        "Nondeterminism or slowness breaks reproduction and throughput; and -fuzz names exactly one target.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-corpus",
      kind: "explain",
      description:
        "Explain, without notes, the difference between the seed corpus (added with f.Add, run by plain `go test`) and generated inputs (produced only under `go test -fuzz`), and where discovered crashers are saved.",
      required: true,
    },
    {
      id: "predict-plaintest",
      kind: "predict",
      description:
        "Correctly predict what a fuzz test does under plain `go test` versus `go test -fuzz`, including what happens to files under testdata/fuzz.",
      required: true,
    },
    {
      id: "implement-fuzz",
      kind: "implement",
      description:
        "Write a FuzzXxx test that seeds the corpus with f.Add and asserts a round-trip or no-panic property inside f.Fuzz, with seed types matching the target arguments.",
      required: true,
    },
    {
      id: "design-property",
      kind: "design",
      description:
        "Choose a fuzz-friendly property (no-panic, round-trip, or differential) for a given parser and justify why it holds for every input rather than only hand-picked ones.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "In the last lesson you wrote table tests: you listed inputs and their expected outputs by hand, and the test checked each one. That's excellent for the cases you can think of. But bugs love the cases you *can't* think of — the empty string, the input with two dots, the number one bigger than you tested, the weird byte that isn't valid UTF-8. Attackers and real users find those inputs constantly; your handwritten table never will, because you can only write down what you already imagined.\n\n**Fuzzing** flips who chooses the inputs. Instead of you picking a dozen cases, the machine generates thousands of them automatically, mutating and combining them to probe your code for inputs that make it misbehave. Your job shrinks to one thing: state a rule that must be true *no matter what* the input is. The fuzzer's job is to hunt for an input that breaks the rule.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "A table test is a spelling quiz where you also wrote the questions — you'll never quiz yourself on a word you forgot exists. Fuzzing is handing your program to a mischievous toddler who mashes the keyboard for hours: they don't know what 'valid' means, which is exactly why they find the input that crashes it.",
          },
        },
        {
          type: "points",
          items: [
            "**Table tests**: you pick the inputs — great coverage of the cases you imagined, blind to the rest.",
            "**Fuzzing**: the machine picks the inputs — it explores the space you didn't think of.",
            "You stop writing individual cases and start writing a **property** that must hold for every input.",
          ],
        },
      ],
    },
    "mental-model": {
      body: 'So the durable model is: **table tests check specific answers; fuzz tests check universal rules.** In a table test you assert `ParseAmount("12.50") == 1250` — a fact about one input. In a fuzz test you assert something that must hold for *all* inputs, like "this never panics" or "parsing what I formatted gives back the original." The machine\'s job is to search for a counterexample to your rule.\n\nThat reframing is the whole skill. You stop asking "what output do I expect for this input?" (which you can\'t answer for a random string) and start asking "what must be true regardless of the input?" A rule that survives millions of generated inputs is far stronger evidence of correctness than a dozen cases you chose because they were easy to reason about.',
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Two ways to test the same parser",
            kind: "compare",
            nodes: [
              {
                id: "table",
                label: "Table test",
                detail:
                  "You supply inputs AND expected outputs. Checks specific answers you can predict. Blind to inputs you didn't list.",
                tone: "muted",
              },
              {
                id: "fuzz",
                label: "Fuzz test",
                detail:
                  "You supply seeds AND a property. The machine invents inputs and hunts for one that breaks the property.",
                tone: "success",
              },
            ],
            caption:
              "Same parser, different question: 'is this answer right?' versus 'is this rule always true?'",
          },
        },
        {
          type: "note",
          note: {
            tone: "warning",
            title: "Common trap",
            text: 'Fuzzing does not replace table tests — it complements them. Table tests pin down exact expected outputs (that "12.50" really is 1250); fuzzing proves rules hold across inputs you can\'t enumerate. You want both.',
          },
        },
      ],
    },
    mechanics: {
      body: "Now the precise Go mechanics. A fuzz test is a function named `FuzzXxx` taking a single `*testing.F` — the same naming rule as `TestXxx`, in a `_test.go` file. Inside, you do two things. First, **seed the corpus** by calling `f.Add(...)` one or more times with example inputs. Second, **register the fuzz target** with `f.Fuzz`, passing a function whose first parameter is `*testing.T` and whose remaining parameters are the fuzzed inputs.\n\nThe one rule you must not break: the types you pass to `f.Add` must match, in order, the fuzzed parameters of the `f.Fuzz` function (the ones after `t`). If your target takes `(t *testing.T, in string)`, every `f.Add` must pass a single `string`. Only a fixed set of types can be fuzzed — `string`, `[]byte`, the integer types (`int`, `int64`, ...), the floats, `bool`, and `rune`/`byte` — because the fuzzer has to know how to generate and mutate them.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "info",
            title: "The anatomy of a fuzz test",
            text: "func FuzzXxx(f *testing.F) — the entry point. f.Add(seed) — put example inputs in the corpus. f.Fuzz(func(t *testing.T, in T){...}) — the target run against every input. Seed types == target's fuzzed parameter types, in order.",
          },
        },
        {
          type: "example",
          example: {
            title: "A minimal fuzz test, annotated",
            language: "go",
            code: 'func FuzzParseAmount(f *testing.F) {\n    f.Add("12.50") // seed: one string, matches the target parameter below\n    f.Add("0.00")  // more seeds give the mutator better starting points\n    f.Fuzz(func(t *testing.T, in string) {\n        // `in` is a generated input: sometimes a seed, usually a mutation of one\n        _, _ = ParseAmount(in) // property here: it must simply return, never panic\n    })\n}',
            takeaway:
              "f.Add fills the seed corpus; f.Fuzz's function runs against every input the fuzzer produces. The seed type (string) matches the fuzzed parameter (string) — that pairing is mandatory.",
          },
        },
        {
          type: "points",
          items: [
            "Name it `FuzzXxx(f *testing.F)` in a `_test.go` file — one fuzz target per function.",
            "`f.Add(...)` seeds the corpus; the target is `f.Fuzz(func(t *testing.T, ...) {...})`.",
            "Seed types must match the target's fuzzed parameters; only fuzzable types (string, []byte, ints, floats, bool, rune) are allowed.",
          ],
        },
      ],
    },
    diagram: {
      body: "The most confusing thing for beginners is that the *same* fuzz function behaves differently depending on how you run it. Plain `go test` treats it as a regular test and only runs the seed corpus. `go test -fuzz=FuzzXxx` switches on generation: it runs the seeds, then mutates them to produce new inputs, running until it finds a failure or you stop it. When it finds a failure it writes the offending input to `testdata/fuzz/FuzzXxx/<hash>`. Follow the two paths below.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "The same fuzz test, two run modes",
            kind: "sequence",
            nodes: [
              {
                id: "seeds",
                label: "You write FuzzParse with f.Add seeds",
                detail: "seeds live in code (and testdata/fuzz files)",
              },
              {
                id: "plain",
                label: "`go test` → seed corpus only",
                detail: "runs each seed once as a normal test; no new inputs",
                tone: "muted",
              },
              {
                id: "fuzz",
                label: "`go test -fuzz=FuzzParse` → generate",
                detail: "runs seeds, then mutates them into thousands of new inputs",
                tone: "accent",
              },
              {
                id: "search",
                label: "Runs until failure or interrupt",
                detail: "or until -fuzztime elapses",
                tone: "default",
              },
              {
                id: "save",
                label: "On failure: save the crasher",
                detail: "writes the exact input to testdata/fuzz/FuzzParse/<hash>",
                tone: "danger",
              },
              {
                id: "regress",
                label: "Crasher becomes a seed",
                detail: "future `go test` replays it forever as a regression test",
                tone: "success",
              },
            ],
            caption:
              "Generation happens only under -fuzz. Every failing input it finds is saved and then replayed by ordinary test runs.",
          },
        },
      ],
    },
    implementation: {
      body: "The highest-value pattern is the **round-trip property**: if a value can be formatted to text and parsed back, then `Parse(Format(x))` must equal `x` for every `x`. It's a perfect fuzz property because it's true by definition of what a codec is, it needs no hand-picked expected outputs, and it catches a huge class of bugs where formatting and parsing quietly disagree. Here we fuzz the *cents*, format them, parse them back, and demand we get the original cents.\n\nNotice what the target does *not* do: it doesn't compare against a table of expected strings. It states a rule — round-trip identity — and lets the fuzzer search for any `cents` value that violates it (a huge amount, a negative, a value that formats with trailing-zero quirks).",
      blocks: [
        {
          type: "example",
          example: {
            title: "A round-trip fuzz test for an amount codec",
            language: "go",
            code: 'func FuzzAmountRoundTrip(f *testing.F) {\n    f.Add(int64(0))    // seed with the tricky values you already know\n    f.Add(int64(1250))\n    f.Add(int64(-99))  // negatives are a classic round-trip breaker\n    f.Fuzz(func(t *testing.T, cents int64) {\n        s := FormatAmount(cents)          // e.g. -99 -> "-0.99"\n        got, err := ParseAmount(s)        // parse the text back\n        if err != nil {\n            t.Fatalf("ParseAmount(%q) failed for cents=%d: %v", s, cents, err)\n        }\n        if got != cents {                 // the property: it must round-trip\n            t.Errorf("round-trip: cents=%d formatted to %q parsed back as %d", cents, s, got)\n        }\n    })\n}',
            takeaway:
              "The fuzzed input is the int64 `cents`; the property is Parse(Format(x)) == x. Seed types (int64) match the target parameter (int64). No expected-output table needed — the rule IS the check.",
          },
        },
        {
          type: "points",
          items: [
            "Seed with the tricky values you already know (0, negative, large) — they give the mutator a head start.",
            "Format then parse, and fail on either an unexpected error or a mismatch.",
            "The property, not a table, is the assertion: `Parse(Format(x)) == x` for all x.",
          ],
        },
      ],
    },
    experiment: {
      body: 'Predict before you read on — a wrong guess you correct sticks better than a right answer you skimmed. You have this fuzz test for a parser, and you run it two ways:\n\n```\nfunc FuzzParse(f *testing.F) {\n    f.Add("12.50")\n    f.Fuzz(func(t *testing.T, in string) {\n        _, _ = Parse(in) // Parse panics on the empty string\n    })\n}\n```\n\nFirst you run `go test` (no flags). Then you run `go test -fuzz=FuzzParse`. Which run catches the empty-string panic? Commit to an answer.\n\nHere\'s the trace. Under plain `go test`, only the seed corpus runs — just `"12.50"` (plus anything already in testdata/fuzz). `"12.50"` doesn\'t panic, so the test **passes**; the bug hides. Under `go test -fuzz=FuzzParse`, the fuzzer starts from `"12.50"` and mutates it — deleting characters, shortening it — and within moments generates the empty string, which panics.\n\nThe run **fails**, prints the crashing input, and writes it to `testdata/fuzz/FuzzParse/<hash>`. From then on, even plain `go test` catches it, because that saved file is now part of the seed corpus. The lesson: generation only happens under `-fuzz`, but once a crasher is saved it protects you forever.',
    },
    "failure-cases": {
      body: "The failures here cluster around three misunderstandings: thinking plain `go test` fuzzes, choosing a property that isn't actually universal, and writing a target the fuzzer can't work with. Here are the ones you'll actually meet.",
      blocks: [
        {
          type: "points",
          items: [
            "**Expecting `go test` to generate inputs** → it doesn't; without `-fuzz` it only runs the seed corpus. You must pass `-fuzz=FuzzXxx` to generate.",
            '**Seed type ≠ target type** → `f.Add("x")` with a target parameter of `int` won\'t compile. Match each seed to its fuzzed parameter, in order.',
            "**A property that isn't universal** → asserting `err == nil` for a parser that *should* reject bad input means every malformed generated input 'fails' falsely. Assert no-panic, or round-trip on the success path only.",
            "**A slow or nondeterministic target** → network calls, sleeps, or randomness inside f.Fuzz cripple throughput and make saved crashers fail to reproduce. Keep the target fast and pure.",
            "**Running unbounded in CI** → bare `-fuzz` runs until it fails or is killed. Use `-fuzztime` to bound it, and let plain `go test` run the corpus on every build.",
          ],
        },
        {
          type: "example",
          example: {
            title: "A bad property vs. a good one",
            language: "go",
            code: '// BAD: malformed input SHOULD error, so this fails on almost every generated input.\nf.Fuzz(func(t *testing.T, in string) {\n    _, err := ParseAmount(in)\n    if err != nil {\n        t.Errorf("unexpected error for %q", in) // wrong: errors are legitimate here\n    }\n})\n\n// GOOD: a rule true for ALL inputs — it must never panic.\nf.Fuzz(func(t *testing.T, in string) {\n    _, _ = ParseAmount(in) // a panic fails the run; an error is a fine outcome\n})',
            takeaway:
              "A fuzz property must hold for every input. 'Never errors' is false for a parser (bad input should error); 'never panics' is a rule that genuinely must always hold.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "Fuzzing is powerful but it is not free, and it doesn't replace anything you already do. None of these should scare you off — they mark where to think twice.",
      blocks: [
        {
          type: "points",
          items: [
            "**Finding power vs. setup cost**: fuzzing finds inputs you'd never write, but you must first express a real property — code with no invariant to state gains little.",
            "**Fuzzing vs. table tests**: fuzzing proves universal rules; table tests pin exact expected outputs. You need both, not one instead of the other.",
            "**Generative run vs. CI**: unbounded `-fuzz` is great locally but must be bounded with `-fuzztime` (or a scheduled long run) so CI terminates.",
            "**Target speed**: the fuzzer runs your target millions of times, so a slow or impure target (I/O, randomness) wrecks throughput and reproducibility.",
            "**One target per run**: `-fuzz` fuzzes a single target and is per-package, so you generate for one FuzzXxx at a time; the rest only run their seed corpus.",
          ],
        },
      ],
    },
    design: {
      body: "A few durable rules. First, pick a property that is true for *every* input — the two workhorses are 'never panics' and the round-trip 'Parse(Format(x)) == x'; a differential check against a slow reference implementation is a strong third. Second, seed the corpus with the tricky values you already know (empty, zero, negative, boundary) so the mutator starts near the danger. Third, keep the fuzz target fast and deterministic, because it runs enormous numbers of times and its findings must reproduce. And always commit the crashers the fuzzer saves — they are free, permanent regression tests.",
      blocks: [
        {
          type: "points",
          items: [
            "Assert a universal property (no-panic, round-trip, or differential), never an expected output per input.",
            "Seed with known-tricky values so the fuzzer starts near the corners.",
            "Keep the target deterministic and fast; commit every saved crasher as a regression test.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Choosing the property for ParseTransaction",
            context:
              "`ParseRecord(raw string)` turns one CSV line into a typed Record and returns an error for malformed lines. You want to fuzz it, but 'never errors' is the wrong property because bad lines should fail.",
            insight:
              "Use two properties. (1) No-panic: call ParseTransaction(raw) for any input and let a panic fail the run — untrusted upload data must never crash the importer. (2) Round-trip on success: if err == nil, then ParseTransaction(Format(tx)) must equal tx — formatting and parsing can never silently disagree. Both hold for every input, which is exactly what fuzzing needs.",
          },
        },
      ],
    },
    mastery: {
      body: "You've mastered this when you can explain the difference between the seed corpus and generated inputs and where crashers are saved, predict what a fuzz test does under `go test` versus `go test -fuzz`, write a FuzzXxx test that seeds with f.Add and asserts a round-trip or no-panic property with matching types, and choose a fuzz-friendly property for a parser and defend why it holds for every input. Attest a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "Two ideas carry this lesson. **Fuzzing lets the machine pick the inputs** — you write `func FuzzXxx(f *testing.F)`, seed the corpus with `f.Add`, and assert a property inside `f.Fuzz` that must hold for every input; `go test -fuzz` then mutates your seeds into thousands of inputs hunting for a counterexample, while plain `go test` just runs the seed corpus.\n\n**Every crasher becomes permanent** — a discovered failure is saved to `testdata/fuzz/FuzzXxx/<hash>` and replayed by ordinary test runs forever, so bugs found once can't regress. The skill is picking the right property: no-panic, round-trip `Parse(Format(x)) == x`, or a differential check against a reference.",
      blocks: [
        {
          type: "points",
          items: [
            "`FuzzXxx(f *testing.F)`: `f.Add` seeds the corpus; `f.Fuzz(func(t, in){...})` is the target; seed types must match the target's parameters.",
            "Plain `go test` runs only the seed corpus; `go test -fuzz=FuzzXxx` generates new inputs (bound it with `-fuzztime`).",
            "Crashers are saved to `testdata/fuzz/FuzzXxx/<hash>`, committed, and replayed forever as regression tests.",
            "Assert a universal property — no-panic or round-trip — not an expected output per input; keep the target fast and deterministic.",
          ],
        },
      ],
    },
  },
};
