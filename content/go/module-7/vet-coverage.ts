import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 7 — coverage, go vet, and static analysis. Same beginner-friendly voice
 * as earlier modules: plain language, one analogy per hard idea, a concrete
 * example before the abstract rule. Correct and careful about what each tool
 * proves and — just as important — what it does NOT: vet is not a linter and
 * a linter is not vet; 100% coverage is not correctness; a curated lint config
 * beats a maximal one. The through-line is a layered mental model of the
 * compiler, vet/lint, and coverage each catching a different class of mistake.
 */
export const goVetCoverage: Lesson = {
  id: "go-vet-coverage",
  slug: "vet-coverage",
  title: "Coverage, go vet & static analysis",
  description:
    "Wire `go vet`, `golangci-lint`, and coverage into your everyday loop so the tooling catches whole classes of mistakes for free — and understand exactly what each one proves and what it doesn't.",
  moduleId: "go-7",
  estimatedMinutes: 45,
  difficulty: "intermediate",
  prerequisites: ["go-unit-table-tests"],
  learningObjectives: [
    "Run `go vet` and explain the kinds of likely-bug mistakes it catches that the compiler happily allows",
    "Measure test coverage with `go test -cover` and a coverage profile, and explain clearly what a coverage percentage does and does not mean",
    "Adopt `golangci-lint` with a curated config and compose vet, lint, formatting, and coverage into a single local check and a CI merge gate",
  ],
  concepts: ["coverage", "go-vet", "static-analysis", "linting"],
  ledgerFlowApplications: [
    "Run `go vet` on every push so a mismatched `Printf` verb in a ledger log line is caught before review",
    "Gate merges to main on `go vet` + `golangci-lint` passing with zero issues",
    "Require a coverage threshold on the money-handling packages so untested balance logic can't slip in",
  ],
  references: [
    {
      title: "go vet — command documentation",
      url: "https://pkg.go.dev/cmd/vet",
      teaches: "What `go vet` reports, the individual analyzers it runs, and how `go test` runs a subset of vet automatically.",
      relevance: "The authoritative list of what vet catches, which this lesson introduces one class at a time.",
      required: true,
      section: "go vet",
    },
    {
      title: "The cover story — the Go Blog",
      url: "https://go.dev/blog/cover",
      teaches: "How Go's coverage tool works, how to produce a profile, and how to view it as HTML or per-function output.",
      relevance: "Grounds the coverage half of the lesson in the original explanation of `go test -cover` and `go tool cover`.",
      required: true,
      section: "Coverage",
    },
    {
      title: "golangci-lint",
      url: "https://github.com/golangci/golangci-lint",
      teaches: "How the aggregator runs many linters at once, how it is configured via `.golangci.yml`, and which linters are enabled by default.",
      relevance: "The tool this lesson recommends for the lint layer of a real CI gate.",
      required: true,
      section: "Linting",
    },
    {
      title: "Staticcheck",
      url: "https://staticcheck.dev",
      teaches: "The set of high-signal static analysis checks that staticcheck adds beyond vet, and why they matter.",
      relevance: "The standout linter inside golangci-lint; explains the depth of analysis available for free.",
      required: false,
      section: "Linting",
    },
  ],
  exercises: [
    {
      id: "go7vc-predict-vet-on-test",
      type: "prediction",
      prompt:
        "You run `go test ./...` with no explicit vet step, and your code has a `fmt.Printf(\"%d\", name)` where `name` is a string. Predict what happens before any of your test assertions run, and why.",
      expectedAnswer:
        "The build/test run reports a vet error like `fmt.Printf format %d has arg name of wrong type string`, because `go test` runs a subset of `go vet` automatically before executing tests. The Printf-format check is in that subset, so it fires even though you never called vet yourself.",
      hints: [
        "`go test` doesn't only compile and run tests — it runs a small set of vet analyzers first.",
        "The Printf format-verb check is one of the analyzers included in that automatic subset.",
      ],
    },
    {
      id: "go7vc-debug-printf",
      type: "debugging",
      prompt:
        "This logging helper compiles fine but `go vet` refuses it. Find the bug vet is complaining about and fix it.\n\n```\nfunc logPosted(amount int64, account string) {\n    log.Printf(\"posted %s to account %d\", amount, account)\n}\n```",
      starterCode:
        'package ledger\n\nimport "log"\n\nfunc logPosted(amount int64, account string) {\n    // go vet: log.Printf format %s has arg amount of wrong type int64\n    log.Printf("posted %s to account %d", amount, account)\n}',
      expectedAnswer:
        'package ledger\n\nimport "log"\n\nfunc logPosted(amount int64, account string) {\n    // %d for the integer amount, %s for the string account\n    log.Printf("posted %d to account %s", amount, account)\n}',
      hints: [
        "The verbs and the arguments are swapped: `%s` is paired with an int64 and `%d` with a string.",
        "`%d` formats integers; `%s` formats strings. Match each verb to its argument's type.",
      ],
    },
    {
      id: "go7vc-read-coverage",
      type: "code-reading",
      prompt:
        "Given this `go tool cover -func` output, say which function is least tested and what a reviewer should do about it:\n\n```\nledger/post.go:12:  Post          100.0%\nledger/post.go:40:  reverse        0.0%\nledger/post.go:71:  validate      85.7%\ntotal:              (statements)  78.9%\n```",
      expectedAnswer:
        "`reverse` at 0.0% is completely untested — no test executes any of its statements. That's the priority: a reviewer should ask for tests on `reverse` (especially since a reversal touches balances) rather than fixating on the 78.9% total. The total looks acceptable, but the average hides a wholly untested function, which is exactly the failure mode of trusting a single percentage.",
      hints: [
        "Read the per-function numbers, not just the total — the total is an average that can hide a zero.",
        "0.0% means no statement in that function ran under any test.",
      ],
    },
    {
      id: "go7vc-implement-check-target",
      type: "implementation",
      prompt:
        "Write a `make check` target (a Makefile) that runs, in order: formatting check, `go vet`, `golangci-lint`, and tests with a coverage profile. It should fail (non-zero exit) if any step fails. Assume `gofmt` and `golangci-lint` are installed.",
      starterCode:
        "# Fill in a `check` target that runs fmt check, vet, lint, and tests+coverage.\n# It must stop at the first failure.\n\ncheck:\n\t# TODO\n",
      expectedAnswer:
        '# Each recipe line runs in its own shell; make stops at the first non-zero exit.\n\n.PHONY: check fmt-check vet lint test\n\ncheck: fmt-check vet lint test\n\nfmt-check:\n\t@test -z "$$(gofmt -l .)" || (echo "gofmt needed on the files above" && gofmt -l . && exit 1)\n\nvet:\n\tgo vet ./...\n\nlint:\n\tgolangci-lint run\n\ntest:\n\tgo test -race -coverprofile=cover.out ./...',
      hints: [
        "`gofmt -l .` lists files that need formatting; if that list is non-empty, the check should fail.",
        "Make stops at the first prerequisite that fails, so listing `fmt-check vet lint test` as prerequisites of `check` gives you the ordering and short-circuit for free.",
      ],
    },
    {
      id: "go7vc-refactor-golangci",
      type: "refactoring",
      prompt:
        "A team turned on every linter golangci-lint offers and now the CI output is thousands of warnings that everyone ignores. Refactor their approach: describe a curated `.golangci.yml` starting point and explain the principle behind trimming the set.",
      expectedAnswer:
        "Start from a small, high-signal set rather than everything. A sane baseline enables `govet`, `staticcheck`, `errcheck`, `ineffassign`, and `unused`, e.g.:\n\n```yaml\nlinters:\n  enable:\n    - govet\n    - staticcheck\n    - errcheck\n    - ineffassign\n    - unused\n```\n\nThe principle: a linter config is only useful if its output is trusted and acted on. Noise trains people to ignore warnings, so a maximal config is worse than a curated one — every enabled linter must earn its place by catching real bugs more often than it cries wolf. Add checks deliberately as the team agrees they're worth it.",
      hints: [
        "The goal isn't the most warnings, it's warnings people actually act on.",
        "Enable a small trusted core (govet, staticcheck, errcheck, ineffassign, unused) and grow it deliberately.",
      ],
    },
    {
      id: "go7vc-design-ci-gate",
      type: "design",
      prompt:
        "Design the merge gate for LedgerFlow's Go backend. Say exactly which checks must pass before a PR can merge, in what order you'd run them, and what coverage threshold (if any) you'd require — and justify the threshold rather than just picking 100%.",
      expectedAnswer:
        "Gate on: (1) formatting (`gofmt`/`goimports` clean), (2) `go vet ./...`, (3) `golangci-lint run` with the curated config, (4) `go test -race ./...` passing, (5) a coverage floor. Run cheap/fast checks first (fmt, vet) so obvious problems fail quickly before the slower test+race run. For the threshold, don't require 100% — chasing it wastes effort on trivial code and tempts people to write assertion-free tests just to color lines green. Set a meaningful floor (e.g. ~80% overall) and optionally a higher bar on the money-handling packages, because coverage there is where an untested branch is most dangerous. The threshold's job is to stop coverage silently rotting, not to prove correctness.",
      hints: [
        "Order matters: run the fast checks (fmt, vet) before the slow ones (tests with -race).",
        "Justify the number: 100% is a poor target because it rewards line-touching over assertion-making; a floor prevents backsliding.",
      ],
    },
    {
      id: "go7vc-advanced-coverage-lies",
      type: "advanced",
      prompt:
        "A function has 100% line coverage and every test passes, yet it ships a bug. Give a concrete example of how that's possible, and state precisely what coverage measures versus what it does not.",
      expectedAnswer:
        "Example: `func Fee(a int) int { return a / 100 }` with a single test `Fee(500) == 5`. Every line runs, so coverage is 100%, but the test never asserts the boundary cases (e.g. `Fee(0)`, negative amounts, or rounding of `550`), so a wrong rounding rule ships undetected. Coverage measures which lines/statements were *executed* by tests; it does not measure whether the tests *asserted the right thing* or exercised the meaningful inputs. Lines can be executed by a test that checks nothing, so 100% coverage is a floor on 'code was run,' never a ceiling on 'code is correct.'",
      hints: [
        "Coverage counts executed lines — it says nothing about whether an assertion checked the result.",
        "A test that calls a function but asserts nothing still counts its lines as covered.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-layers",
      kind: "explain",
      description:
        "Explain, without notes, the division of labor between the compiler, `go vet`/linters, and coverage — what class of mistake each one catches and which it can't.",
      required: true,
    },
    {
      id: "predict-coverage-meaning",
      kind: "predict",
      description:
        "Given a coverage report or a 100%-covered-but-buggy function, correctly state what the number proves and what it does not.",
      required: true,
    },
    {
      id: "debug-vet-finding",
      kind: "debug",
      description:
        "Identify and fix a mistake that `go vet` reports (such as a Printf format/argument mismatch) that the compiler accepted.",
      required: true,
    },
    {
      id: "design-ci-gate",
      kind: "design",
      description:
        "Design a local check plus a CI merge gate composing formatting, vet, lint, and coverage, and justify the coverage threshold you chose.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "Your tests pass. The code compiles. So it's correct — right? Not quite. The compiler only proves your types line up; passing tests only prove the paths you *thought to test* behave as you *thought to assert*. In between sits a huge class of real bugs that compile fine and were never covered by a test: a `Printf` with the wrong verb, an error you forgot to check, a value you assigned but never used, a lock you accidentally copied.\n\nGo ships free tooling that catches these mistakes automatically — before review, before production. `go vet` finds likely bugs the compiler allows. Linters like `golangci-lint` add dozens more checks. Coverage tells you which code your tests never even ran. The skill isn't running the commands — it's knowing what each tool proves, what it *doesn't*, and how to wire them into a loop so the machine does this work for you every time.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "Think of publishing a book. The compiler is the printer refusing pages that physically won't bind — structural, non-negotiable. Vet and linters are a copy editor flagging 'this sentence says the opposite of what you meant' — likely mistakes, not impossible ones. Coverage is a checklist of which chapters anyone actually read before it went to print. Three different jobs; you want all three.",
          },
        },
        {
          type: "points",
          items: [
            "**Compiles + tests pass ≠ correct** — a whole class of bugs slips through both.",
            "`go vet`, linters, and coverage each catch a *different* kind of gap, for free.",
            "The goal is to wire them into your loop so they run automatically, every time.",
          ],
        },
      ],
    },
    naive: {
      body: "The naive stance is: \"I have tests and it compiles, so extra tooling is busywork.\" That treats the compiler as the only automated safety net. But the compiler is deliberately permissive about things that are legal Go yet almost certainly bugs — it will happily accept `fmt.Printf(\"%d\", \"hello\")` because the types of `Printf`'s variadic args are all `interface{}`; the mismatch between the `%d` verb and a string only shows up at *runtime*, as `%!d(string=hello)`.\n\nThe second naive move is chasing a number: \"we need 100% coverage.\" It feels rigorous, but a percentage of *lines executed* says nothing about whether your tests actually *checked* anything. Both mistakes come from trusting one signal to mean more than it does.",
      blocks: [
        {
          type: "example",
          example: {
            title: "The compiler accepts a bug vet rejects",
            language: "go",
            code:
              'package main\n\nimport "fmt"\n\nfunc main() {\n    name := "Ada"\n    // Compiles cleanly. Printf takes ...interface{}, so the types "fit".\n    fmt.Printf("hello %d\\n", name)\n}\n// Runs and prints:  hello %!d(string=Ada)\n// `go vet` says:     Printf format %d has arg name of wrong type string',
            takeaway:
              "The compiler can't reject this — the argument's static type is legal. `go vet` inspects the format string against the arguments and catches the mismatch the compiler is structurally unable to see.",
          },
        },
        {
          type: "points",
          items: [
            "The compiler proves types; it does **not** try to catch likely-bug patterns like format mismatches.",
            "\"100% coverage\" measures lines *run*, not assertions *made* — a misleading target on its own.",
          ],
        },
      ],
    },
    failure: {
      body: "Skipping this tooling fails in the most expensive way: the bug reaches production and *looks fine* until someone reads the output. A mismatched log verb doesn't crash — it silently writes `%!d(string=acct-42)` into your logs, and you only notice when you're paging through them at 2am trying to trace a bad transaction. An unchecked error from a database write doesn't fail loudly — it just… doesn't get handled, and a balance quietly drifts.\n\nThe coverage version of the failure is subtler and more seductive: the team proudly reports \"92% coverage,\" a critical `reverse()` function sits at 0%, and everyone feels safe because the *average* looked good. The number was real; the confidence it created was not.",
      blocks: [
        {
          type: "scenario",
          scenario: {
            title: "The log line that lied for a month",
            context:
              "A ledger service logs every posting with `log.Printf(\"posted %d to %d\", amount, accountID)`, but `accountID` is a string like \"acct-42\". It compiles, tests pass (none check log output), and it ships. For a month, every posting logs `posted 500 to %!d(string=acct-42)`.",
            insight:
              "Nobody was doing anything wrong at review time — the bug is invisible to the compiler and to tests that don't assert on logs. A single `go vet` in CI would have failed the build the moment the code was pushed. The cost of skipping it wasn't zero; it was a month of unusable audit logs.",
          },
        },
      ],
    },
    intuition: {
      body: "Here's the mental image that organizes all of this. Picture three sieves stacked over your code, each with different-sized holes. The **compiler** is the coarse sieve on top: it stops code that's structurally broken — type errors, undefined names. Plenty of bugs fall straight through it. The **vet/lint** sieve sits below: finer holes that catch *suspicious but legal* patterns — the format mismatch, the ignored error, the unreachable line. Below that, **coverage** isn't a sieve at all — it's a flashlight showing you which parts of the code no sieve ever got to inspect, because no test ever ran them.\n\nSo you don't pick one tool; you stack them. Each catches what the one above lets through, and coverage tells you where you're flying blind.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "Static vs dynamic",
            text: "Vet and linters are *static* analysis — they read your code without running it, like a proofreader. Coverage is *dynamic* — it watches your code actually run under tests. That's why they're complementary: static analysis reasons about all code paths but only shallow properties; coverage sees real execution but only of the inputs your tests supply.",
          },
        },
        {
          type: "points",
          items: [
            "**Compiler**: structural correctness (types, syntax) — coarse, non-negotiable.",
            "**Vet / linters**: likely-bug patterns that are legal but wrong — finer, static.",
            "**Coverage**: which code your tests never executed — a flashlight, not a sieve.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Make the division of labor precise. The **compiler** answers *\"is this well-formed?\"* — it will not compile if types don't match. **`go vet`** answers *\"is this a well-known kind of mistake?\"* — it runs a fixed set of *analyzers*, each looking for one specific bug pattern (Printf mismatches, struct tags that won't parse, copying a value that contains a lock, unreachable code). **Linters** (via `golangci-lint`) answer the same *shape* of question but with a much larger, configurable catalogue — including `staticcheck`, which does deeper analysis than vet. **Coverage** answers a completely different question: *\"which lines did my tests actually run?\"*\n\nThe trap is treating these as interchangeable. Vet is **not** a linter replacement (it's a small, curated, false-positive-averse core), and a linter is **not** a vet replacement (many linters assume vet's checks are already covered — indeed golangci-lint runs `govet` as one of its linters). And neither is coverage, which proves nothing about correctness at all.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "info",
            title: "What each tool proves",
            text: "Compiler → the code is type-correct and well-formed. go vet → the code doesn't match a known bug pattern (small, high-confidence set). golangci-lint → a broader, configurable catalogue of bug and style patterns, staticcheck included. Coverage → which lines your tests executed — and nothing about whether they asserted the right thing.",
          },
        },
        {
          type: "diagram",
          diagram: {
            title: "Four tools, four questions",
            kind: "stack",
            nodes: [
              { id: "compiler", label: "Compiler", detail: "\"Is this well-formed?\" Types and syntax. Won't build otherwise.", tone: "muted" },
              { id: "vet", label: "go vet", detail: "\"Is this a known mistake?\" Small, curated, high-confidence analyzers.", tone: "accent" },
              { id: "lint", label: "golangci-lint (+ staticcheck)", detail: "\"Any of these many bug/style patterns?\" Configurable catalogue.", tone: "accent" },
              { id: "cover", label: "coverage", detail: "\"Which lines did tests run?\" A flashlight, not a correctness proof.", tone: "success" },
            ],
            caption: "Each layer answers a different question; you stack them rather than choose between them.",
          },
        },
      ],
    },
    mechanics: {
      body: "Now the commands. **`go vet ./...`** runs the built-in analyzers over every package. You rarely need to invoke it explicitly during testing, because **`go test` automatically runs a subset of vet** before executing your tests — so a Printf mismatch fails the test run even if you never typed `go vet`. (That subset is smaller than full vet; run `go vet` separately in CI to get all analyzers.)\n\n**Coverage** is a flag on `go test`. `go test -cover ./...` prints a percentage per package. `go test -coverprofile=cover.out ./...` writes a machine-readable profile. You then turn that profile into something human: `go tool cover -func=cover.out` prints per-function percentages (and the total), and `go tool cover -html=cover.out` opens a browser view with covered lines in green and *un*covered lines in red — the red is the part you actually read.",
      blocks: [
        {
          type: "example",
          example: {
            title: "The core commands, in order",
            language: "bash",
            code:
              '# Static checks (all analyzers; go test only runs a subset)\ngo vet ./...\n\n# Run tests and report coverage per package\ngo test -cover ./...\n\n# Write a coverage profile, then read it two ways\ngo test -coverprofile=cover.out ./...\ngo tool cover -func=cover.out   # per-function %, plus a total line\ngo tool cover -html=cover.out   # browser view: green = covered, red = not',
            takeaway:
              "Vet for likely bugs; `-coverprofile` to capture what ran; `go tool cover -func` for a quick number and `-html` to see the exact untested lines in red.",
          },
        },
        {
          type: "example",
          example: {
            title: "Reading -func output",
            language: "bash",
            code:
              'go tool cover -func=cover.out\n# ledger/post.go:12:  Post          100.0%\n# ledger/post.go:40:  reverse         0.0%   <- nothing tested this\n# ledger/post.go:71:  validate       85.7%\n# total:              (statements)   78.9%',
            takeaway:
              "The per-function lines are the signal. A healthy-looking 78.9% total hides a `reverse` function at 0.0% — always read the breakdown, not just the total.",
          },
        },
        {
          type: "points",
          items: [
            "`go vet ./...` runs all analyzers; `go test` runs only a *subset* of them automatically.",
            "`-cover` prints a %, `-coverprofile=cover.out` writes a profile for the `cover` tool.",
            "`go tool cover -func` = per-function numbers; `-html` = green/red line view of exactly what's untested.",
          ],
        },
      ],
    },
    diagram: {
      body: "Coverage instrumentation is less magical than it sounds. When you pass `-coverprofile`, the Go toolchain rewrites your code before compiling it: it inserts a tiny counter at the start of each *basic block* (a straight-line run of statements with no branches). Running the tests bumps those counters. Afterward, each block's count is either zero (never ran → red) or non-zero (ran → green). The percentage is just covered statements divided by total statements. Follow the flow below.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "How a coverage percentage is produced",
            kind: "flow",
            nodes: [
              { id: "src", label: "Your source", detail: "the packages under test" },
              { id: "instr", label: "Toolchain inserts counters", detail: "one per basic block", tone: "accent" },
              { id: "run", label: "Tests run", detail: "each executed block bumps its counter" },
              { id: "profile", label: "cover.out written", detail: "count per block: 0 or more" },
              { id: "report", label: "% = covered / total", detail: "0 = red (untested), >0 = green (executed)", tone: "success" },
            ],
            caption: "Coverage counts whether each block *executed* — it never inspects whether a test *asserted* anything about the result.",
          },
        },
      ],
    },
    implementation: {
      body: "The payoff is composing these into one command you run without thinking, and the same command in CI. Locally, a `make check` target chains formatting, vet, lint, and tests-with-coverage, stopping at the first failure. Formatting comes first because it's instant and non-negotiable: `gofmt -l .` lists any files that aren't formatted, and `goimports` additionally fixes import ordering — code that isn't `gofmt`-clean shouldn't even reach the other checks.\n\nThen the exact same steps run in CI as a *merge gate*: the pull request cannot merge unless every step is green. That's what turns \"we should run vet\" into \"vet has run, on every change, with no human deciding to.\"",
      blocks: [
        {
          type: "example",
          example: {
            title: "A local `make check` that mirrors CI",
            language: "bash",
            code:
              '# Makefile — each prerequisite runs in order; make stops at the first failure.\n.PHONY: check fmt-check vet lint test\n\ncheck: fmt-check vet lint test\n\nfmt-check:\n\t@test -z "$(shell gofmt -l .)" || (echo "run gofmt on:" && gofmt -l . && exit 1)\n\nvet:\n\tgo vet ./...\n\nlint:\n\tgolangci-lint run\n\ntest:\n\tgo test -race -coverprofile=cover.out ./...',
            takeaway:
              "One command, cheap checks first (formatting, vet) then the slower `-race` test run. Running the identical steps in CI makes the gate and your local loop the same thing.",
          },
        },
        {
          type: "example",
          example: {
            title: "A curated .golangci.yml (start small)",
            language: "bash",
            code:
              '# .golangci.yml — a trusted core, not everything.\nlinters:\n  enable:\n    - govet        # the vet analyzers, run by golangci-lint too\n    - staticcheck  # deep, high-signal analysis\n    - errcheck     # flags ignored error returns\n    - ineffassign  # assignments whose value is never used\n    - unused       # unused code',
            takeaway:
              "Enable a small set of high-signal linters and grow it deliberately. A config whose output people trust is worth more than one that catches everything and is ignored.",
          },
        },
        {
          type: "points",
          items: [
            "Chain fmt → vet → lint → test so the fastest, cheapest checks fail first.",
            "Run the *same* steps locally (`make check`) and in CI (the merge gate) — no drift.",
            "Curate the linter set; a trusted config beats a maximal, noisy one.",
          ],
        },
      ],
    },
    experiment: {
      body: "Predict before reading on — a wrong guess you correct sticks better than a right answer you skimmed. You write exactly one test for this function and it passes:\n\n```\nfunc Fee(amount int) int { return amount / 100 }\n\nfunc TestFee(t *testing.T) {\n    Fee(500) // note: no assertion, just a call\n}\n```\n\nQuestion one: what coverage does `Fee` report? Question two: does that coverage tell you the function is correct? Commit to answers.\n\nHere's the resolution. `Fee`'s single line executes when the test calls it, so it reports **100% coverage**. But the test never asserts the *result* — it doesn't even check `Fee(500) == 5`. So a completely wrong body like `return amount / 10` would *also* show 100% coverage and *also* pass this test. The lesson lands hard: coverage measured that the line **ran**; it said nothing about whether anything **checked** the outcome. 100% coverage with zero assertions is 0% verification. Coverage points you at untested lines; only assertions test behavior.",
    },
    "failure-cases": {
      body: "The failures here cluster around two confusions: mistaking one tool's guarantee for another's, and treating a coverage number as a correctness score. Here are the ones you'll actually meet.",
      blocks: [
        {
          type: "points",
          items: [
            "**\"Tests pass so vet is redundant\"** → `go test` only runs a *subset* of vet; run full `go vet ./...` (and lint) in CI to catch the rest.",
            "**Chasing 100% coverage** → rewards line-touching over assertion-making and tempts assertion-free tests; set a meaningful floor instead.",
            "**Trusting the total %** → a healthy average can hide a 0%-covered critical function; read the per-function breakdown.",
            "**Enabling every linter** → thousands of warnings train everyone to ignore all of them; curate a trusted core.",
            "**Treating a linter as a vet replacement (or vice versa)** → they overlap but neither subsumes the other; golangci-lint even runs `govet` as one linter.",
            "**Skipping `gofmt`/`goimports`** → formatting is not optional style in Go; unformatted code should fail the check outright.",
          ],
        },
        {
          type: "example",
          example: {
            title: "An unchecked error vet won't catch but errcheck will",
            language: "go",
            code:
              '// Compiles. `go vet` stays silent. But the write error is dropped.\nfunc save(db *sql.DB, id string) {\n    db.Exec("INSERT INTO ledger(id) VALUES ($1)", id) // error ignored\n}\n\n// errcheck (in golangci-lint) flags it; handle the error:\nfunc save(db *sql.DB, id string) error {\n    _, err := db.Exec("INSERT INTO ledger(id) VALUES ($1)", id)\n    return err\n}',
            takeaway:
              "This is why lint isn't optional on top of vet: a dropped error is a classic silent bug vet doesn't flag but `errcheck` does. Different tools, different catches.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "This tooling is close to free, but the choices around it have real tension. None of these should scare you off — they mark where to think twice.",
      blocks: [
        {
          type: "points",
          items: [
            "**More linters**: catch more bugs, but past a point produce noise that gets ignored — signal per warning matters more than warning count.",
            "**Higher coverage floor**: guards more code, but a floor near 100% wastes effort on trivial code and invites gaming — pick a defensible number.",
            "**Strict CI gate**: prevents bad merges, but a slow gate frustrates people; order checks fast-first and keep the whole run quick.",
            "**Static analysis depth (staticcheck)**: finds subtle bugs, but occasional false positives cost time to triage or silence.",
          ],
        },
      ],
    },
    design: {
      body: "A few durable rules. Run the cheap checks first so obvious problems fail in seconds, not minutes. Make the local command and the CI gate identical, so \"passes on my machine\" means \"passes CI.\" Treat coverage as a *floor that stops backsliding*, not a target to maximize — and put the higher bar where the risk is (money-handling code), not everywhere. And curate your linters: every enabled check must earn its place by finding real bugs more often than it cries wolf.",
      blocks: [
        {
          type: "points",
          items: [
            "Fast checks first (fmt, vet) then slow ones (tests with `-race`); same steps locally and in CI.",
            "Coverage is a floor to prevent rot, not a score to maximize — 100% is the wrong goal.",
            "Curate linters to a trusted core; noise is worse than a smaller, respected set.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Setting the gate for LedgerFlow",
            context:
              "The team wants to stop untested balance logic and mismatched log lines from reaching main, without a CI run so slow or noisy that people route around it.",
            insight:
              "Gate on fmt → vet → golangci-lint (curated) → `go test -race` → an ~80% coverage floor overall, with a higher bar on the ledger/money packages. Fast checks fail first; the floor stops coverage rotting; the extra rigor lands exactly where an untested branch is most dangerous. The gate protects the risky code without punishing the trivial code.",
          },
        },
      ],
    },
    ledgerflow: {
      body: "LedgerFlow puts all of this behind a single merge gate. Every pull request must pass, in order: `gofmt`/`goimports` clean, `go vet ./...`, `golangci-lint run` with a curated config (govet, staticcheck, errcheck, ineffassign, unused), `go test -race ./...`, and a coverage floor. The floor is deliberately not 100% — it's a meaningful overall threshold with a higher bar on the money-handling packages, because that's where an untested branch can silently corrupt a balance. The cheap checks (formatting, vet) run first so a mismatched log verb or a stray formatting slip fails the build in seconds, long before the slower race-detector test run. The result: a Printf format bug, a dropped database error, or a newly-untested balance path can't reach main, and no human has to remember to check for them.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "LedgerFlow: the CI merge gate",
            kind: "sequence",
            nodes: [
              { id: "pr", label: "PR opened / pushed", detail: "CI triggers on every change" },
              { id: "fmt", label: "gofmt / goimports check", detail: "instant; unformatted code fails first", tone: "accent" },
              { id: "vet", label: "go vet ./...", detail: "catches Printf mismatches, copied locks, bad tags" },
              { id: "lint", label: "golangci-lint run", detail: "staticcheck + errcheck + more, curated set" },
              { id: "test", label: "go test -race + coverage floor", detail: "slower; must pass and clear the threshold" },
              { id: "merge", label: "Merge allowed", detail: "only when every step is green", tone: "success" },
            ],
            caption: "Cheap checks first, coverage floor on the risky packages, and merge blocked until all green — the tooling does the vigilance.",
          },
        },
      ],
    },
    exercises: {
      body: "Practice is what turns \"I read about vet and coverage\" into \"I reach for `make check` without thinking.\" Work across predicting how `go test` invokes vet, debugging a real Printf format bug, reading a coverage report for the function that actually needs tests, implementing a combined check target, curating a noisy linter config, and designing a merge gate with a justified coverage threshold. Each produces a different kind of evidence — do them, don't just read them.",
    },
    mastery: {
      body: "You've mastered this when you can explain the division of labor between the compiler, vet/linters, and coverage — what each catches and what it can't; correctly state what a coverage percentage does and does not prove (including why a 100%-covered function can still be buggy); find and fix a mistake `go vet` reports that the compiler accepted; and design a local check plus a CI gate composing formatting, vet, lint, and coverage with a threshold you can defend. Attest a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "Two ideas carry this lesson. **Each tool answers a different question** — the compiler proves your code is well-formed, `go vet` and linters catch likely-bug patterns the compiler allows (a Printf mismatch, a dropped error, a copied lock), and coverage shows which lines your tests never ran. You stack them; none replaces another. **And a number is not a proof** — 100% coverage means every line *ran*, not that any test *checked* the result, so it's a floor against rot, never a correctness score. Wire vet, a curated lint set, formatting, and a coverage floor into one `make check` and the identical CI merge gate, and the machine does this vigilance for you on every change.",
      blocks: [
        {
          type: "points",
          items: [
            "Compiler = well-formed; vet/lint = likely-bug patterns the compiler allows; coverage = which lines ran.",
            "`go test` runs a *subset* of vet automatically; run full `go vet ./...` (and lint) in CI for the rest.",
            "Coverage measures execution, not assertions — 100% covered can still be buggy; use a floor, not a target.",
            "Compose fmt → vet → golangci-lint → test+coverage into `make check` and the same CI merge gate.",
          ],
        },
      ],
    },
  },
};
