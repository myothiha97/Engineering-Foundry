import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 7 — unit and table-driven tests. Same beginner-friendly voice as the
 * earlier modules: plain language, one analogy per hard idea, a concrete
 * example before the abstract rule. Correct and careful about the testing
 * package (TestXxx, t.Errorf vs t.Fatalf, t.Helper), the idiomatic
 * table-driven + t.Run subtest pattern, ==/reflect.DeepEqual/go-cmp, package
 * foo vs foo_test, TestMain, and the t.Parallel + Go 1.22 loop-variable notes.
 */
export const goUnitTableTests: Lesson = {
  id: "go-unit-table-tests",
  slug: "unit-table-tests",
  title: "Unit & table-driven tests",
  description:
    "Write real Go tests with the `testing` package, then scale them with the idiomatic table-driven pattern and `t.Run` subtests so one loop covers many input/expected cases clearly.",
  moduleId: "go-7",
  estimatedMinutes: 45,
  difficulty: "intermediate",
  prerequisites: ["go-functions-defer"],
  learningObjectives: [
    "Write a `func TestXxx(t *testing.T)` in a `_test.go` file and run it with `go test`, choosing `t.Errorf` vs `t.Fatalf` deliberately",
    "Convert repetitive one-per-case tests into a single table-driven test that loops a slice of cases through `t.Run` subtests",
    "Compare results correctly with `==` versus `reflect.DeepEqual` (and know when to reach for go-cmp), and test exported behaviour rather than internals",
  ],
  concepts: ["testing", "table-tests", "subtests", "t.Run"],
  ledgerFlowApplications: [
    "Cover a balance rule with a table of many input/expected rows in one test",
    "Give each posting-rule case a readable subtest name so a failure points straight at the offending row",
    "Assert on exported behaviour (the computed balance) instead of private helper internals",
  ],
  references: [
    {
      title: "Tutorial: Add a test",
      url: "https://go.dev/doc/tutorial/add-a-test",
      teaches:
        "The end-to-end mechanics of writing your first `_test.go`, running `go test`, and reporting failures with `t.Errorf`/`t.Fatalf`.",
      relevance:
        "The canonical first introduction to Go testing that this lesson builds directly on.",
      required: true,
      section: "Writing a test",
    },
    {
      title: "Package testing",
      url: "https://pkg.go.dev/testing",
      teaches:
        "The full `*testing.T` API: `Run` for subtests, `Helper`, `Fatal` vs `Error`, `Parallel`, and `TestMain`.",
      relevance:
        "The authoritative reference for every method used in the table-driven pattern shown here.",
      required: true,
      section: "testing.T",
    },
    {
      title: "Effective Go",
      url: "https://go.dev/doc/effective_go",
      teaches:
        "Idiomatic Go conventions, including naming, package layout, and the spirit of clear, minimal tests.",
      relevance:
        "Grounds the `got`/`want` naming and test-exported-behaviour advice in the official style.",
      required: false,
      section: "Names",
    },
    {
      title: "stretchr/testify",
      url: "https://github.com/stretchr/testify",
      teaches:
        "A popular assertion/mock library (`assert`, `require`) some teams layer on top of the standard `testing` package.",
      relevance:
        "Shows the common third-party alternative so you can recognise it, while this lesson stays on the standard library.",
      required: false,
      section: "assert",
    },
  ],
  exercises: [
    {
      id: "go7ut-predict-fatal",
      type: "prediction",
      prompt:
        "A test calls `t.Fatalf(\"setup failed\")` on line 3 and then has three more assertions after it. Predict how many of those later assertions run in this test, and what happens to other tests in the file.",
      expectedAnswer:
        "None of the later assertions in this test run: t.Fatalf reports the failure and immediately stops the current test function (it calls runtime.Goexit). Other Test functions in the file are unaffected — they still run.",
      hints: [
        "Fatal-family calls stop the current test; Error-family calls mark it failed but keep going.",
        "Stopping one test does not stop the others in the package.",
      ],
    },
    {
      id: "go7ut-read-subtest",
      type: "code-reading",
      prompt:
        "Read the test below and state exactly what `go test -run 'TestBalance/overdraft'` runs and why.\n\nfunc TestBalance(t *testing.T) {\n  cases := []struct{ name string; in, want int }{\n    {\"deposit\", 100, 100},\n    {\"overdraft\", -50, -50},\n  }\n  for _, tc := range cases {\n    t.Run(tc.name, func(t *testing.T) { /* ... */ })\n  }\n}",
      hints: [
        "The `-run` flag matches test names, and subtest names are joined to the parent with a slash.",
        "`t.Run(name, ...)` registers a subtest called TestBalance/<name>.",
      ],
    },
    {
      id: "go7ut-implement-table",
      type: "implementation",
      prompt:
        "Write a table-driven test `TestAbs` for `func Abs(n int) int` (absolute value). Cover at least a positive, a negative, and zero, using named subtests and `got`/`want` naming.",
      starterCode:
        'package math\n\n// Abs returns the absolute value of n.\nfunc Abs(n int) int {\n  if n < 0 {\n    return -n\n  }\n  return n\n}\n\n// TODO: write TestAbs as a table-driven test with subtests.',
      expectedAnswer:
        'package math\n\nimport "testing"\n\nfunc TestAbs(t *testing.T) {\n  cases := []struct {\n    name string\n    in   int\n    want int\n  }{\n    {"positive", 5, 5},\n    {"negative", -5, 5},\n    {"zero", 0, 0},\n  }\n  for _, tc := range cases {\n    t.Run(tc.name, func(t *testing.T) {\n      got := Abs(tc.in)\n      if got != tc.want {\n        t.Errorf("Abs(%d) = %d, want %d", tc.in, got, tc.want)\n      }\n    })\n  }\n}',
      hints: [
        "Declare a slice of anonymous structs with name/in/want fields.",
        "Loop the cases through t.Run(tc.name, func(t *testing.T){...}) and compare got to want with !=.",
      ],
    },
    {
      id: "go7ut-refactor-to-table",
      type: "refactoring",
      prompt:
        "Refactor these three near-identical tests into one table-driven test with subtests, keeping the same coverage.\n\nfunc TestAddPositive(t *testing.T) {\n  if got := Add(2, 3); got != 5 { t.Errorf(\"got %d, want 5\", got) }\n}\nfunc TestAddNegative(t *testing.T) {\n  if got := Add(-2, -3); got != -5 { t.Errorf(\"got %d, want -5\", got) }\n}\nfunc TestAddZero(t *testing.T) {\n  if got := Add(0, 0); got != 0 { t.Errorf(\"got %d, want 0\", got) }\n}",
      expectedAnswer:
        'func TestAdd(t *testing.T) {\n  cases := []struct {\n    name    string\n    a, b    int\n    want    int\n  }{\n    {"positive", 2, 3, 5},\n    {"negative", -2, -3, -5},\n    {"zero", 0, 0, 0},\n  }\n  for _, tc := range cases {\n    t.Run(tc.name, func(t *testing.T) {\n      if got := Add(tc.a, tc.b); got != tc.want {\n        t.Errorf("Add(%d, %d) = %d, want %d", tc.a, tc.b, got, tc.want)\n      }\n    })\n  }\n}',
      hints: [
        "The three tests differ only in their inputs and expected output — those become rows.",
        "One assertion body inside t.Run replaces the three copied bodies.",
      ],
    },
    {
      id: "go7ut-debug-shared-state",
      type: "debugging",
      prompt:
        "A table-driven test calls `t.Parallel()` inside each subtest and appends every case's result to a shared `results` slice declared in the outer test. It passes sometimes and fails or panics other times. Explain the bug and the fix.",
      hints: [
        "Parallel subtests run at the same time; what happens when several append to the same slice concurrently?",
        "Either don't share mutable state across parallel subtests (assert inside each subtest), or synchronise access.",
      ],
    },
    {
      id: "go7ut-debug-fatal-vs-error",
      type: "debugging",
      prompt:
        "A test opens a database with `db, err := open()`, checks the error with `t.Errorf` (not Fatalf), then immediately calls `db.Query(...)`. When `open` fails the test crashes with a nil-pointer panic instead of a clean failure message. Explain why and give the one-word fix.",
      hints: [
        "t.Errorf marks the test failed but keeps executing the following lines.",
        "If setup could not produce a usable value, you must stop before using it.",
      ],
    },
    {
      id: "go7ut-design-cases",
      type: "design",
      prompt:
        "You are writing table tests for a `PostingRule` that validates a ledger entry (amount, currency, account). Describe how you would choose the rows of your table so the table itself documents the rule, and what each case's `name` should communicate.",
      hints: [
        "Think in categories: the happy path, each boundary, and each distinct way it can fail.",
        "A good subtest name reads like a sentence about the rule, e.g. \"rejects zero amount\".",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-fatal-error",
      kind: "explain",
      description:
        "Explain the difference between `t.Fatalf` and `t.Errorf` and when each is the right choice.",
      required: true,
    },
    {
      id: "predict-subtest-run",
      kind: "predict",
      description:
        "Correctly predict which subtests `go test -run` selects given a table-driven test and a pattern.",
      required: true,
    },
    {
      id: "implement-table",
      kind: "implement",
      description:
        "Write a table-driven test with named subtests, clear `got`/`want` messages, and the correct comparison operator.",
      required: true,
    },
    {
      id: "design-cases",
      kind: "design",
      description:
        "Design a table of cases for a nontrivial rule so the table documents the behaviour, covering happy path, boundaries, and failures.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "You've written functions that add, validate, and transform data. How do you know they're correct — not just today, but after the next change six months from now? Clicking through the app by hand is slow, forgettable, and stops the moment you look away. What you want is a machine that re-checks your rules every time, tells you the instant something breaks, and does it in a second.\n\nThat machine is built into Go. A **test** is just a function you write that calls your code and complains if the answer is wrong; `go test` finds and runs them all. Tests aren't a separate discipline bolted on afterwards — in Go they live right next to the code, use the standard toolchain, and are part of what it means to have written the function at all.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "A test is like a smoke detector wired into every room of your code. You install it once; from then on it watches quietly and screams the moment something starts to smell wrong — long before you'd have noticed by walking through the house yourself.",
          },
        },
        {
          type: "points",
          items: [
            "A **test** is a function that runs your code and reports a failure if the result is wrong.",
            "In Go, tests live in `_test.go` files next to the code and run with `go test`.",
            "Tests are part of writing the code, not an afterthought — they're your safety net for every future change.",
          ],
        },
      ],
    },
    naive: {
      body: "The first instinct, once you know the syntax, is to write one test function per case. Need to check `Abs(5)`, `Abs(-5)`, and `Abs(0)`? Write `TestAbsPositive`, `TestAbsNegative`, `TestAbsZero`. Each is short, each is obvious, and for two or three cases it's completely fine.\n\nThe trouble starts when the cases multiply. A real rule has ten or twenty interesting inputs, and you find yourself copy-pasting the same three-line assertion, changing only the numbers. The bodies drift apart, one gets a typo in its error message, and adding a new case means writing a whole new function. The logic is identical; only the data differs — and duplicating logic to vary data is exactly the smell Go's table-driven pattern removes.",
      blocks: [
        {
          type: "example",
          example: {
            title: "One test per case — fine at first, painful at scale",
            language: "go",
            code:
              'func TestAbsPositive(t *testing.T) {\n    if got := Abs(5); got != 5 {\n        t.Errorf("Abs(5) = %d, want 5", got)\n    }\n}\n\nfunc TestAbsNegative(t *testing.T) {\n    if got := Abs(-5); got != 5 {\n        t.Errorf("Abs(-5) = %d, want 5", got)\n    }\n}\n\nfunc TestAbsZero(t *testing.T) {\n    if got := Abs(0); got != 0 {\n        t.Errorf("Abs(0) = %d, want 0", got)\n    }\n}',
            takeaway:
              "Three functions, one idea. The assertion is copy-pasted with only the numbers changed — add a tenth case and you copy it again.",
          },
        },
        {
          type: "points",
          items: [
            "One-test-per-case is readable for a handful of inputs.",
            "It duplicates identical assertion logic to vary only the data — that duplication is the problem.",
          ],
        },
      ],
    },
    failure: {
      body: "Duplicated tests fail you in a quiet, corrosive way. Because each case is its own hand-written function, they slowly diverge: one uses `t.Errorf` and another accidentally uses `t.Fatalf`; one's message says `want 5` while the code checks against 6; a fourth case that *should* exist never gets written because adding it is a chore. The suite looks thorough but has gaps, and the gaps are invisible.\n\nThe deeper failure is a wrong reflex about **stopping**. Beginners reach for `t.Fatalf` everywhere (or `t.Errorf` everywhere) without thinking about which they need. Use `Errorf` where you meant `Fatalf` and the test barrels on past a broken precondition — then crashes with a confusing nil-pointer panic instead of a clean \"setup failed\" message. Use `Fatalf` where `Errorf` would do and one bad case hides all the others, so you fix one thing, re-run, discover the next, and iterate blindly.",
      blocks: [
        {
          type: "scenario",
          scenario: {
            title: "The assertion that lied by omission",
            context:
              "A team had twelve hand-written tests for a balance calculator. During a refactor, one test's expected value was left at the old number by mistake. It still passed, because a copy-paste had pointed its assertion at the wrong variable. The bug shipped.",
            insight:
              "Twelve near-identical functions are twelve chances for a subtle divergence. A single table with twelve rows has one assertion body — get that right once and every row is checked the same way. Less repetition means fewer places to be silently wrong.",
          },
        },
      ],
    },
    intuition: {
      body: "Here's the shift. Stop thinking of a test as *a function* and start thinking of it as *a question asked of many inputs*: \"for each of these inputs, is the output what I expect?\" Once you see it that way, the shape is obvious — a **list of cases** (each case an input paired with its wanted output) and **one loop** that asks the question of every case.\n\nThat's the table-driven test. The \"table\" is a slice of little structs; each struct is a row with a name, some inputs, and the expected result. You loop over the rows and run the same check on each. To keep the rows from blurring together in the output, you wrap each one in `t.Run(name, ...)`, which turns it into a named **subtest** — its own labelled entry in the results that you can point to, filter to, and read in a failure message.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "The table is data; the loop is logic",
            text: "Separating the two is the whole trick. Adding a case becomes adding a line of data — no new logic, no copy-paste. The single loop body is the only place the assertion lives, so it's the only place it can be wrong.",
          },
        },
        {
          type: "points",
          items: [
            "Model a test as one question asked of many input/expected rows.",
            "The **table** is a slice of case structs (name + inputs + want).",
            "`t.Run(name, ...)` makes each row a named **subtest** you can filter and identify.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Hold three facts about the tooling in your head and the rest follows. **First**, `go test` discovers tests by convention: any function named `TestXxx(t *testing.T)` (capital letter after `Test`) in a file ending `_test.go` is a test. No registration, no config. **Second**, a test doesn't `return` a pass/fail — it *reports* failures by calling methods on `t`. If it never reports anything, it passed. **Third**, `t` also lets you carve a test into subtests with `t.Run`, and those subtests nest their names with a slash (`TestBalance/overdraft`), which is what makes them filterable.\n\nSo the model is: **you describe cases as data, the toolchain runs your function, and `t` is the channel through which you speak failures.** You never call your test yourself and you never print pass/fail — you hand the toolchain functions and let it drive.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "How go test finds and runs a test",
            kind: "flow",
            nodes: [
              { id: "file", label: "foo_test.go", detail: "file name ends in _test.go", tone: "muted" },
              { id: "func", label: "func TestFoo(t *testing.T)", detail: "name starts with Test + capital", tone: "accent" },
              { id: "run", label: "go test runs it", detail: "no registration needed — found by convention" },
              { id: "report", label: "t.Errorf / t.Fatalf", detail: "the only way the test signals failure", tone: "danger" },
              { id: "result", label: "PASS if nothing reported", detail: "silence means success", tone: "success" },
            ],
            caption: "Convention finds the test; the *t* value is how it reports. No return value carries the result.",
          },
        },
        {
          type: "note",
          note: {
            tone: "info",
            title: "t.Fatalf vs t.Errorf",
            text: "`t.Errorf` marks the test failed and keeps running the rest of it (good for collecting several independent check failures). `t.Fatalf` marks it failed and stops this test immediately (good when continuing makes no sense — e.g. setup produced a nil you're about to dereference). Rule of thumb: Fatal when the next line can't safely run, Error otherwise.",
          },
        },
      ],
    },
    mechanics: {
      body: "Now the precise pattern. Declare `cases` as a slice of an **anonymous struct** with a `name` field, the input fields, and a `want` field. Loop with `for _, tc := range cases` and, inside, call `t.Run(tc.name, func(t *testing.T) { ... })`. Note that the subtest's function takes *its own* `t` — use that inner `t` for the assertion, not the outer one. Inside, compute `got`, compare it to `tc.want`, and on mismatch call `t.Errorf` with a message that prints both.\n\nTwo small correctness notes. Since **Go 1.22**, each loop iteration gets a fresh `tc`, so capturing `tc` in the subtest closure is safe (in older Go you'd add `tc := tc` inside the loop — you'll still see that line in existing code). And if you want subtests to run concurrently, call `t.Parallel()` as the first line inside each `t.Run` body — but only when the cases don't share mutable state.",
      blocks: [
        {
          type: "example",
          example: {
            title: "The canonical table-driven test",
            language: "go",
            code:
              'func TestAbs(t *testing.T) {\n    cases := []struct {\n        name string // labels the subtest\n        in   int    // the input\n        want int    // the expected output\n    }{\n        {"positive", 5, 5},\n        {"negative", -5, 5},\n        {"zero", 0, 0},\n    }\n    for _, tc := range cases {\n        t.Run(tc.name, func(t *testing.T) { // note: its own t\n            got := Abs(tc.in)\n            if got != tc.want {\n                t.Errorf("Abs(%d) = %d, want %d", tc.in, got, tc.want)\n            }\n        })\n    }\n}',
            takeaway:
              "Data (the rows) and logic (the one assertion) are cleanly separated. Adding a case is adding a line; the check lives in exactly one place.",
          },
        },
        {
          type: "example",
          example: {
            title: "A test helper with t.Helper()",
            language: "go",
            code:
              'func assertEqual(t *testing.T, got, want int) {\n    t.Helper() // report failures at the CALLER\'s line, not this line\n    if got != want {\n        t.Errorf("got %d, want %d", got, want)\n    }\n}\n\n// In the subtest: assertEqual(t, Abs(tc.in), tc.want)',
            takeaway:
              "`t.Helper()` tells the toolchain this function is a helper, so a failure is blamed on the line that called it — where the useful context is — not on the line inside the helper.",
          },
        },
        {
          type: "points",
          items: [
            "`cases` is a slice of anonymous structs: `name` + inputs + `want`.",
            "`t.Run(tc.name, func(t *testing.T){...})` — assert with the *inner* `t`.",
            "Go 1.22+ gives each iteration a fresh `tc`, so the closure captures the right row.",
          ],
        },
      ],
    },
    diagram: {
      body: "It helps to see how the one loop expands into many labelled subtests, and how a failure in one row is isolated. Below, a three-row table becomes three subtests under one parent. The `negative` row fails; the other two still run and pass, and the failure message names exactly the subtest and the mismatched values.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "One table, many named subtests",
            kind: "stack",
            nodes: [
              { id: "parent", label: "TestAbs (parent)", detail: "runs the loop over cases", tone: "accent" },
              { id: "s1", label: "TestAbs/positive", detail: "Abs(5) == 5 → PASS", tone: "success" },
              { id: "s2", label: "TestAbs/negative", detail: "Abs(-5) != 5 → FAIL (isolated)", tone: "danger" },
              { id: "s3", label: "TestAbs/zero", detail: "Abs(0) == 0 → PASS", tone: "success" },
            ],
            caption: "Each row is its own labelled subtest. One row's failure doesn't stop the others, and the label points straight at the culprit.",
          },
        },
      ],
    },
    implementation: {
      body: "Beyond the shape, two decisions matter for correct tests: **how you compare** results, and **what** you test. For simple comparable values — numbers, strings, booleans — use `==` (and `!=` in the `if`). But `==` doesn't work on slices, maps, or structs containing them; comparing those with `==` either won't compile or won't do what you want. For those, use `reflect.DeepEqual(got, want)`, which walks the values and compares them element by element. For richer needs (ignoring fields, better diffs) many teams use Google's `go-cmp` (`cmp.Equal` / `cmp.Diff`), but the standard library alone covers most cases.\n\nAs for *what* to test: test **exported behaviour**, not private internals. Verify that `Balance()` returns the right number, not that some unexported helper was called in a particular order. Behaviour-focused tests survive refactors; internal-structure tests break every time you tidy the code, teaching you to distrust your own suite.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Choosing the right comparison",
            language: "go",
            code:
              '// Comparable value: use ==\ngot := Abs(-5)\nif got != want {\n    t.Errorf("Abs(-5) = %d, want %d", got, want)\n}\n\n// Slice / map / struct-with-slices: use reflect.DeepEqual\ngot := Split("a,b,c", ",")     // []string{"a","b","c"}\nwant := []string{"a", "b", "c"}\nif !reflect.DeepEqual(got, want) {\n    t.Errorf("Split(...) = %v, want %v", got, want)\n}\n// (go-cmp: if !cmp.Equal(got, want) { t.Errorf(cmp.Diff(want, got)) })',
            takeaway:
              "`==` for simple comparable values; `reflect.DeepEqual` for slices/maps/composite structs. Reach for go-cmp only when you need to ignore fields or want a readable diff.",
          },
        },
        {
          type: "note",
          note: {
            tone: "info",
            title: "package foo vs package foo_test",
            text: "A `_test.go` file can declare `package foo` (an internal test — it can see unexported names) or `package foo_test` (an external test — it can only use exported names, like a real caller would). Prefer `foo_test` when you can: testing through the public API keeps tests honest about what users actually depend on. `TestMain(m *testing.M)`, if you define it, runs once for the whole package and lets you do setup before `m.Run()` and teardown after — handy for spinning up a shared resource.",
          },
        },
        {
          type: "points",
          items: [
            "`==`/`!=` for comparable scalars; `reflect.DeepEqual` for slices, maps, composite structs.",
            "Name results `got` and `want` and print both in the message — it's the convention and it reads well.",
            "Test exported behaviour, not private internals, so tests survive refactors.",
          ],
        },
      ],
    },
    experiment: {
      body: "Predict before you read on — a wrong guess you correct sticks better than a right answer you skimmed. You have a table-driven `TestBalance` with cases named `deposit`, `overdraft`, and `zero`. You run:\n\n```\ngo test -run 'TestBalance/overdraft' -v\n```\n\nWhich subtests execute, and what does `-v` add? Commit to an answer.\n\nHere's what happens. The `-run` pattern matches test names as a regular expression, and subtest names are joined to their parent with a slash. `TestBalance/overdraft` matches the parent `TestBalance` and, within it, only the `overdraft` subtest — so the loop still runs but `deposit` and `zero` are skipped, and only `overdraft` actually executes its body. `-v` (verbose) prints a line for each test and subtest as it runs (`=== RUN   TestBalance/overdraft`, `--- PASS: ...`), which is how you confirm exactly which cases ran. The lesson: named subtests aren't just tidy output — they're addressable, so you can rerun a single failing row in isolation while you fix it.",
    },
    "failure-cases": {
      body: "The failures here cluster around two things: reaching for the wrong stop-behaviour (`Fatal` vs `Error`), and sharing state between subtests that run in parallel. Here are the ones you'll actually meet.",
      blocks: [
        {
          type: "points",
          items: [
            "**`Errorf` where you needed `Fatalf`** → the test keeps running past a broken precondition and panics on a nil value instead of failing cleanly. Use `Fatalf` when the next line can't safely run.",
            "**`Fatalf` inside a loop of checks** → the first failing case stops the whole test, hiding the others. Prefer `Errorf` for independent per-case assertions.",
            "**`t.Parallel()` + shared mutable state** → parallel subtests race on the same slice/map/variable, giving flaky failures or panics. Don't share mutable state; assert inside each subtest.",
            "**Comparing slices/maps with `==`** → won't compile, or compares the wrong thing. Use `reflect.DeepEqual` (or go-cmp).",
            "**Testing internals** → tests break on every refactor even when behaviour is unchanged. Assert on exported behaviour instead.",
          ],
        },
        {
          type: "example",
          example: {
            title: "Fatal calling t.Fatalf from a helper goroutine is wrong",
            language: "go",
            code:
              '// WRONG: Fatalf stops only the goroutine it runs in, not the test.\ngo func() {\n    if err := do(); err != nil {\n        t.Fatalf("boom: %v", err) // does NOT reliably fail the test\n    }\n}()\n\n// RIGHT: signal the failure back and Fatalf on the test\'s goroutine,\n// or use t.Errorf which is safe to call from any goroutine.',
            takeaway:
              "`t.Fatalf` must be called from the goroutine running the test, because it stops that goroutine. From a spawned goroutine, use `t.Errorf` or send the error back to the test's goroutine.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "Table-driven tests are the default for good reason, but they're not free of judgement. None of these should steer you away from the pattern — they mark where to think.",
      blocks: [
        {
          type: "points",
          items: [
            "**Table-driven vs one-per-case**: tables scale and de-duplicate, but for two trivial cases a plain test can be clearer — don't build a table for the sake of it.",
            "**`reflect.DeepEqual` vs go-cmp**: DeepEqual is standard-library and zero-dependency; go-cmp gives readable diffs and field-ignoring at the cost of an extra dependency.",
            "**Parallel subtests**: faster suites, but only safe when cases don't share mutable state — and the speed-up rarely matters for fast unit tests.",
            "**`package foo` vs `foo_test`**: internal tests can reach unexported helpers (occasionally useful); external tests keep you honest about the public API. Prefer external.",
          ],
        },
      ],
    },
    design: {
      body: "A few durable rules. Let the **table document the behaviour**: choose rows for the happy path, every boundary, and each distinct way the code can fail, and give each a `name` that reads like a sentence about the rule (`\"rejects zero amount\"`). Pick `Fatal` vs `Error` by asking \"can the next line safely run if this failed?\" Compare with the operator that fits the type. And test what a caller depends on — the exported behaviour — so your suite is a spec, not a mirror of your current internals.",
      blocks: [
        {
          type: "points",
          items: [
            "Choose table rows to cover happy path + boundaries + each failure mode; make names read like sentences.",
            "`Fatal` when the next line can't run without this; `Error` for independent checks.",
            "Test exported behaviour, name results `got`/`want`, and pick the right comparison for the type.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "A table that reads like a spec",
            context:
              "A posting rule must accept a positive amount in a known currency, reject a zero or negative amount, and reject an unknown currency. Written as a table, the case names are: \"accepts positive amount\", \"rejects zero amount\", \"rejects negative amount\", \"rejects unknown currency\".",
            insight:
              "Someone reading only the case names learns the rule without reading the implementation. The table isn't just tests — it's executable documentation of the behaviour, and any new rule becomes a new row.",
          },
        },
      ],
    },
    ledgerflow: {
      body: "This is exactly how LedgerFlow tests its balance and posting rules. A single `TestApplyPosting` holds a table of rows — a deposit that raises the balance, a withdrawal that lowers it, an overdraft that should be rejected, a zero amount that should be rejected, a foreign-currency entry — each row an input entry paired with the expected resulting balance (or expected error). One `t.Run(tc.name, ...)` loop drives them all, so the assertion lives in one place and adding a new rule case is adding one line. Crucially, the tests check the **exported** result — the balance the rest of the system sees — not the private recalculation helper, so the money rules can be refactored freely as long as the numbers stay correct. When a case fails, the subtest name (`TestApplyPosting/rejects_overdraft`) points straight at the offending rule.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "LedgerFlow: one table covering the balance rules",
            kind: "stack",
            nodes: [
              { id: "table", label: "TestApplyPosting (table)", detail: "rows = entry + expected balance/error", tone: "accent" },
              { id: "dep", label: "/deposit", detail: "+100 → balance 100 → PASS", tone: "success" },
              { id: "wd", label: "/withdrawal", detail: "-30 → balance 70 → PASS", tone: "success" },
              { id: "od", label: "/rejects_overdraft", detail: "-200 on 70 → error expected", tone: "danger" },
              { id: "zero", label: "/rejects_zero", detail: "0 → error expected", tone: "danger" },
            ],
            caption: "Every money rule is a row; the loop is the logic. Add a rule, add a row — and a failure names the exact rule that broke.",
          },
        },
      ],
    },
    exercises: {
      body: "Practice is what turns \"I've read about table tests\" into \"I write one without thinking.\" Work across predicting `Fatal` behaviour, reading a `-run` subtest filter, implementing a table-driven test from scratch, refactoring copy-pasted tests into a table, debugging a shared-state-in-parallel bug and a Fatal-vs-Error mistake, and designing the rows for a real rule. Each produces a different kind of evidence — do them, don't just read them.",
    },
    mastery: {
      body: "You've mastered this when you can explain when to use `t.Fatalf` versus `t.Errorf`, predict which subtests a `go test -run` pattern selects, write a clean table-driven test with named subtests and correct comparisons, and design a table whose rows document a nontrivial rule. Attest a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "Two ideas carry this lesson. **Tests are ordinary Go** — a `func TestXxx(t *testing.T)` in a `_test.go` file, found by convention and run with `go test`, that reports failures through `t` (with `t.Fatalf` to stop and `t.Errorf` to continue). **Table-driven tests scale that cleanly** — model a test as one question asked of many rows, put the cases in a slice of structs, and loop them through `t.Run(name, ...)` so each becomes a named, filterable subtest with the assertion written exactly once. Compare with the operator the type needs, test exported behaviour, and let the table document the rule.",
      blocks: [
        {
          type: "points",
          items: [
            "A test is `func TestXxx(t *testing.T)` in `_test.go`; `t.Fatalf` stops it, `t.Errorf` continues.",
            "Table-driven: a slice of case structs (name + inputs + want) looped through `t.Run` subtests.",
            "`==` for comparable scalars, `reflect.DeepEqual` (or go-cmp) for slices/maps/structs; name results `got`/`want`.",
            "Test exported behaviour, not internals; each subtest name is filterable via `go test -run Test/case`.",
          ],
        },
      ],
    },
  },
};
