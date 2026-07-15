import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 1, control flow — if, for, switch, and labels. Written in the same
 * beginner-friendly voice as the Module 0 lessons: plain language, one analogy
 * per hard idea, concrete examples before abstractions. The two surprises this
 * lesson keeps front-and-center: Go has exactly one loop keyword (`for`), and
 * `switch` does NOT fall through by default.
 */
export const goControlFlow: Lesson = {
  id: "go-control-flow",
  slug: "control-flow",
  title: "Control flow: if, for, switch",
  description:
    "Write idiomatic Go branches and loops: one loop keyword, the if-with-init guard, and a switch that never falls through by accident.",
  moduleId: "go-1",
  estimatedMinutes: 50,
  difficulty: "beginner",
  prerequisites: ["go-basic-types"],
  learningObjectives: [
    "Use `for` in all three forms (C-style, condition-only, and infinite) plus `for range`",
    "Apply the `if err := ...; err != nil` guard that scopes a variable to the branch",
    "Write a `switch` without fallthrough and use a tagless switch as a clean if/else chain",
  ],
  concepts: ["if", "for", "switch", "labels"],
  references: [
    {
      title: "The Go Programming Language Specification — For statements",
      url: "https://go.dev/ref/spec#For_statements",
      teaches: "The normative rules for all forms of the single `for` loop, including `for range`.",
      relevance: "The authoritative source for why Go needs only one loop keyword.",
      required: false,
      section: "For statements; For statements with range clause",
    },
    {
      title: "The Go Programming Language Specification — Switch statements",
      url: "https://go.dev/ref/spec#Switch_statements",
      teaches: "How expression and tagless switches evaluate, and why cases do not fall through.",
      relevance: "Backs the biggest surprise in the lesson: no automatic fallthrough.",
      required: false,
      section: "Expression switches; Fallthrough statements",
    },
    {
      title: "Effective Go — Control structures",
      url: "https://go.dev/doc/effective_go#control-structures",
      teaches: "The idiomatic way Go teams actually write if, for, and switch day to day.",
      relevance: "Turns the raw rules into the conventions you should imitate.",
      required: false,
      section: "If; For; Switch",
    },
  ],
  exercises: [
    {
      id: "go1cf-predict-fallthrough",
      type: "prediction",
      prompt:
        'Predict the output of a switch on `n := 2` whose `case 2` prints "two" and whose `case 3` prints "three", with no `fallthrough` keyword. Does it print one line or two?',
      expectedAnswer:
        'It prints only "two". Go runs the matching case and then leaves the switch — cases never fall through unless you write `fallthrough`.',
      hints: ["Go is the opposite of C here.", "There is no `break` needed to stop a case."],
    },
    {
      id: "go1cf-read-if-init",
      type: "code-reading",
      prompt:
        "Given `if v, ok := m[key]; ok { use(v) }`, explain where `v` and `ok` are visible and where they are not.",
      hints: ["The init statement declares variables scoped to the if — including its else."],
    },
    {
      id: "go1cf-implement-sum",
      type: "implementation",
      prompt:
        "Implement `sum` so it returns the total of all ints in the slice using a `for range` loop.",
      starterCode:
        'package main\n\nimport "fmt"\n\nfunc sum(nums []int) int {\n\t// range over nums and accumulate the total\n\treturn 0\n}\n\nfunc main() { fmt.Println(sum([]int{1, 2, 3, 4})) } // 10',
      expectedAnswer:
        "func sum(nums []int) int {\n\ttotal := 0\n\tfor _, n := range nums {\n\t\ttotal += n\n\t}\n\treturn total\n}",
      hints: ["Use `_` to ignore the index you don't need.", "`for range` gives you index, value."],
    },
    {
      id: "go1cf-debug-infinite",
      type: "debugging",
      prompt:
        "A `for i := 0; i < len(items); { process(items[i]) }` loop hangs forever. Explain why and fix it.",
      hints: [
        "Look at what changes `i` each pass.",
        "A condition-only loop still needs the counter to move.",
      ],
    },
    {
      id: "go1cf-refactor-elseif",
      type: "refactoring",
      prompt:
        "Refactor a long `if/else if/else` chain that compares one variable against several string states into a tagless switch (a switch with no expression after the keyword).",
      hints: [
        "A `switch { case cond: ... }` reads each case as a boolean.",
        "Each case is an independent condition.",
      ],
    },
    {
      id: "go1cf-design-states",
      type: "design",
      prompt:
        'Design the branch structure for handling a transaction that can be "pending", "cleared", or "reconciled", and state why a switch is safer than nested ifs here.',
      hints: [
        "Consider what happens when a new state is added later.",
        "A switch groups all cases in one place.",
      ],
    },
    {
      id: "go1cf-advanced-labels",
      type: "advanced",
      prompt:
        "Write a nested loop that scans a 2D grid and stops all looping the moment it finds a target value, using a labeled `break` so a single `break` exits both loops at once.",
      hints: [
        "Put a label before the outer `for`.",
        "`break Outer` targets the labeled loop, not just the inner one.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-one-loop",
      kind: "explain",
      description:
        "Explain, without notes, how one `for` keyword covers C-style, while-style, and infinite loops.",
      required: true,
    },
    {
      id: "predict-no-fallthrough",
      kind: "predict",
      description: "Correctly predict that a Go switch case does not fall through to the next.",
      required: true,
    },
    {
      id: "implement-if-init",
      kind: "implement",
      description:
        "Write the `if err := ...; err != nil` guard with the error scoped to the branch.",
      required: true,
    },
    {
      id: "design-tagless-switch",
      kind: "design",
      description:
        "Choose between a tagless switch and an if/else chain for a real branching problem and defend it.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "Every program has to make decisions (do this *or* that) and repeat work (do this *again*). In most languages you learn a pile of keywords for this: `if`, `while`, `do-while`, `for`, `foreach`, plus a `switch` with its own quirks. It's a lot of surface area, and much of it overlaps.\n\nGo deliberately went the other way. It has `if`, `switch`, and exactly **one** loop keyword: `for`. Fewer moving parts means less to memorize — but it also means two things will surprise you if you're coming from C, Java, or JavaScript. This lesson is about mastering the small set and internalizing those two surprises before they bite you.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "Think of a Swiss Army knife with one blade that folds into three shapes versus a drawer full of single-purpose tools. Go's `for` is the one blade: same keyword, three shapes. You carry less, but you have to learn how the one blade folds.",
          },
        },
        {
          type: "points",
          items: [
            "Go's entire control flow is `if`, `for`, and `switch` — no `while`, no `do-while`, no ternary `?:`.",
            "Surprise #1: **one loop keyword** (`for`) does the job of `while` and `for` combined.",
            "Surprise #2: a `switch` case **does not fall through** to the next — the opposite of C.",
          ],
        },
      ],
    },
    "mental-model": {
      body: 'Hold two ideas and the whole lesson follows. **First: omission, not new keywords.** Loops differ only by which of the three `for` clauses you leave out — there is nothing else to learn. **Second: a switch case is a self-contained block.** Matching a case runs *only* that case and then leaves the switch; falling through is the rare, explicit exception, never the rule.\n\nThe same "self-contained" idea applies to `if`: an `if` can start with a short init statement (`if x := f(); cond`), and any variable it declares there lives only inside that `if` and its `else`. The branch owns its variable and nothing leaks out.',
      blocks: [
        {
          type: "example",
          example: {
            title: "The if-with-init guard, annotated",
            language: "go",
            code: 'if err := save(tx); err != nil { // err is born here\n    return fmt.Errorf("save failed: %w", err)\n} // err dies here — it does not pollute the surrounding scope\n\n// err is NOT visible on this line — that is the point',
            takeaway:
              "`if init; cond` scopes the declared variable to the branch. This is why Go code guards errors right where they happen without leaking `err` everywhere.",
          },
        },
        {
          type: "note",
          note: {
            tone: "info",
            title: "Why this pattern is everywhere",
            text: "Go functions return errors as ordinary values, so you check them constantly. The `if err := ...; err != nil` guard keeps each check tight and each `err` local — you'll see it in almost every real Go function.",
          },
        },
      ],
    },
    mechanics: {
      body: "Now the precise rules. A **`for` with a `range` clause** iterates over a collection and hands you two values per pass: for a slice or array that's `index, value`; for a map it's `key, value`; for a string it's `byte-index, rune`. Use the blank identifier `_` to discard either one.\n\nA **`switch`** evaluates its cases top to bottom and runs the *first* one that matches, then exits — no `break` needed. A case can list several values (`case 1, 2, 3:`). A **tagless switch** (`switch { }` with no expression) treats each `case` as a boolean condition, giving you a clean if/else-if chain. And `break`/`continue` normally affect the innermost loop, but a **label** lets one `break` or `continue` target an outer loop by name.",
      blocks: [
        {
          type: "example",
          example: {
            title: "for range over the common collections",
            language: "go",
            code: 'for i, v := range nums {      // slice: index, value\n    fmt.Println(i, v)\n}\n\nfor key := range counts {     // map: key only (value dropped)\n    fmt.Println(key)\n}\n\nfor _, r := range "héllo" {   // string: index dropped, r is a rune\n    fmt.Println(r)\n}',
            takeaway: "`range` adapts to what you iterate. Drop what you don't need with `_`.",
          },
        },
        {
          type: "diagram",
          diagram: {
            title: "How a switch evaluates",
            kind: "sequence",
            nodes: [
              { id: "eval", label: "Evaluate the tag", detail: "e.g. the value after `switch`" },
              { id: "match", label: "Find the first matching case", detail: "top to bottom" },
              { id: "run", label: "Run that case's body", detail: "and only that one" },
              {
                id: "exit",
                label: "Leave the switch",
                detail: "no fallthrough unless you ask",
                tone: "success",
              },
            ],
          },
        },
        {
          type: "points",
          items: [
            "`case 1, 2, 3:` matches any of several values — no fallthrough needed to group them.",
            "A tagless `switch { case cond: }` is the idiomatic long if/else-if chain.",
            "Labels turn a single `break`/`continue` into a jump out of (or to) an outer loop.",
          ],
        },
      ],
    },
    diagram: {
      body: "The map below puts the three loop shapes side by side against the one skeleton they all come from. Select a shape and read which clauses it keeps and which it omits — the differences are entirely about omission, never about a different keyword. This is the single most important mental picture in the lesson.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "The one skeleton and its three shapes",
            kind: "compare",
            nodes: [
              {
                id: "skeleton",
                label: "for init; cond; post {}",
                detail: "The full skeleton — every loop is this with parts removed.",
              },
              {
                id: "counting",
                label: "Keep all three",
                detail: "for i := 0; i < n; i++ — counting loop.",
              },
              {
                id: "condonly",
                label: "Keep only cond",
                detail: 'for x < 10 — the "while" shape.',
                tone: "accent",
              },
              {
                id: "forever",
                label: "Keep nothing",
                detail: "for {} — infinite; exit with break/return.",
                tone: "danger",
              },
            ],
            caption: "No `while`, no `do-while`. Just `for` with clauses added or removed.",
          },
        },
      ],
    },
    implementation: {
      body: "The practical payoff is a handful of patterns you'll reach for constantly. Guard errors the moment they appear with an if-init. Loop over batches with `for range`. Reach for a tagless switch whenever an if/else-if chain grows past two or three branches — it reads cleaner and groups every case in one place.\n\nBelow is all three patterns in one small, idiomatic function: it ranges over transactions, guards a fallible call, and branches on state with a switch.",
      blocks: [
        {
          type: "example",
          example: {
            title: "if-init, for range, and a switch working together",
            language: "go",
            code: 'func total(txs []Tx) (int, error) {\n    sum := 0\n    for _, tx := range txs {          // for range over the batch\n        if err := tx.Validate(); err != nil { // if-init guard\n            return 0, fmt.Errorf("bad tx %s: %w", tx.ID, err)\n        }\n        switch tx.State {              // expression switch, no fallthrough\n        case "cleared", "reconciled":  // group values in one case\n            sum += tx.Amount\n        case "pending":\n            // skip: not counted yet\n        default:\n            return 0, fmt.Errorf("unknown state %q", tx.State)\n        }\n    }\n    return sum, nil\n}',
            takeaway:
              "Three idioms, one function: scoped error guard, `for range` iteration, and a switch that groups states and rejects the unexpected via `default`.",
          },
        },
        {
          type: "points",
          items: [
            "Guard errors inline with `if err := ...; err != nil` so `err` stays local.",
            "Use `for range` for collections; use `_` to drop the index or value you don't need.",
            "A `default` case catches states you didn't plan for — treat the unexpected loudly.",
          ],
        },
      ],
    },
    experiment: {
      body: 'Before you read on, commit to a guess. Consider this switch:\n\n```\nn := 1\nswitch n {\ncase 1:\n    fmt.Println("one")\ncase 2:\n    fmt.Println("two")\n}\n```\n\nComing from C, you might expect that after matching `case 1`, execution keeps going into `case 2` and prints both lines. Does it? Pick an answer before scrolling.\n\nReveal: it prints only `one`. In Go, a matched case runs its body and then *leaves the switch* automatically — there is no implicit fallthrough. To get the C behavior of continuing into `case 2`, you\'d have to write the keyword `fallthrough` as the last statement of `case 1`, and even then it jumps into `case 2`\'s body *without* re-checking `n == 2`. Because fallthrough is opt-in and rare, Go switches are far safer to read: one match, one branch.',
    },
    "failure-cases": {
      body: "Most control-flow bugs for newcomers come from a handful of shapes. Learn to name them and the fix is usually obvious.",
      blocks: [
        {
          type: "points",
          items: [
            "**Infinite condition-only loop** → you wrote `for cond {}` but nothing inside ever changes `cond`. Move the counter.",
            "**Expecting fallthrough** → assuming a matched case runs the next one too. It doesn't; group values with `case a, b:`.",
            "**Accidental `fallthrough`** → left in from a C port; it fires unconditionally into the next body.",
            "**Leaking loop variable** → trying to use a `for`/`if` init variable after the block; it's scoped to the block only.",
            "**Inner `break` when you meant outer** → a plain `break` exits only the innermost loop; use a label to exit an outer one.",
          ],
        },
        {
          type: "example",
          example: {
            title: "A label to break out of nested loops",
            language: "go",
            code: "Search:\nfor _, row := range grid {\n    for _, cell := range row {\n        if cell == target {\n            found = true\n            break Search // exits BOTH loops, not just the inner one\n        }\n    }\n}",
            takeaway:
              "A plain `break` would only leave the inner loop. `break Search` jumps out of the labeled outer loop.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "Go's minimalism here is a deliberate trade, and it's worth naming the costs alongside the wins.",
      blocks: [
        {
          type: "points",
          items: [
            "**One loop keyword**: less to learn and read, but ex-C/Java developers must retrain the reflex to look for `while`.",
            "**No implicit fallthrough**: switches are safe to skim, but porting C code that relied on fallthrough needs care.",
            "**No ternary `?:`**: fewer cryptic one-liners, at the cost of a few more lines for simple conditional assignments.",
            "**Tagless switch vs if/else**: cleaner for many branches, but for a single condition a plain `if` is still simpler.",
            "**Labels**: precise control over nested loops, but overuse reads like `goto` — reserve them for genuine nested exits.",
            "**Modern range forms**: `for i := range 5` yields 0 through 4. Go 1.23+ also permits iterator functions (such as `iter.Seq`), which are worth learning when an API returns one; slices, maps, strings, and channels remain the everyday forms.",
          ],
        },
      ],
    },
    design: {
      body: "A few durable rules turn the mechanics into good taste. Reach for a switch (usually tagless) once branching grows past two or three conditions — it centralizes every case and makes a missing one visible. Always give a state-matching switch a `default` that treats the unexpected as an error rather than silently ignoring it. Keep the `if err := ...; err != nil` guard tight to the call it checks so errors are handled where they occur. And use labels only for genuine nested-loop exits, never as a general-purpose jump.",
      blocks: [
        {
          type: "points",
          items: [
            "Prefer a tagless switch over a long if/else-if chain; it groups cases and reads top-down.",
            "Give state switches a `default` that fails loudly on the unexpected.",
            "Keep error guards adjacent to the fallible call; let the scoped `err` die with the branch.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Designing for a new job state",
            context:
              'Six months in, an upload job adds a "paused" state. With states scattered across nested ifs, you would hunt through the codebase; with one switch per decision point and a `default` that errors, missed cases become visible immediately.',
            insight:
              "A switch with a `default` is a design tool: it makes 'I forgot a case' a visible, loud failure instead of a silent wrong answer.",
          },
        },
      ],
    },
    mastery: {
      body: "You've mastered this lesson when you can explain how one `for` keyword covers every loop shape, correctly predict that a Go switch case never falls through on its own, write the `if err := ...; err != nil` guard with the error properly scoped, and defend when a tagless switch beats an if/else chain. Attest each criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "Two surprises carry this entire lesson: Go has **one loop keyword** (`for`, in three shapes you get by omitting clauses), and a **switch never falls through** by default. Add the `if err := ...; err != nil` guard and the tagless switch, and you can write idiomatic Go control flow.",
      blocks: [
        {
          type: "points",
          items: [
            '`for` is the only loop: full, condition-only ("while"), and infinite are just omitted clauses.',
            "`for range` iterates collections; use `_` to drop the index, key, or value you don't need.",
            "A switch runs one matching case and exits; group values with `case a, b:`; `fallthrough` is rare and explicit.",
            "The `if init; cond` guard scopes its variable to the branch; a tagless switch is the clean if/else-if chain.",
            "Trap: expecting switch cases to fall through automatically. In Go they stop after the matching case.",
          ],
        },
      ],
    },
  },
};
