import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 3, lesson — type assertions and type switches. Same beginner-friendly
 * voice as Modules 0 and 1: plain language, one analogy per hard idea, and a
 * concrete example before every abstract rule. Reformats the go.dev material on
 * type assertions and type switches into learner-facing prose, and shows why you
 * design with interfaces first and reach for assertions only at the boundaries.
 */
export const goAssertionsSwitches: Lesson = {
  id: "go-assertions-switches",
  slug: "assertions-switches",
  title: "Type assertions & type switches",
  description:
    "Recover the concrete type back out of an interface value safely — using the comma-ok assertion, the type switch, and interface feature detection.",
  moduleId: "go-3",
  estimatedMinutes: 50,
  difficulty: "intermediate",
  prerequisites: ["go-interfaces"],
  learningObjectives: [
    "Use the comma-ok assertion to test an interface value's concrete type without risking a panic",
    "Write a type switch that branches on several possible dynamic types, including the nil case",
    "Decide when to design with interfaces versus reaching for an assertion at a boundary",
  ],
  concepts: ["type-assertion", "type-switch"],
  ledgerFlowApplications: [
    "Dispatch on ledger event types (Deposit, Withdrawal, Transfer) decoded from a stream",
    "Feature-detect whether a store also implements an optional Snapshotter capability",
    "Safely unpack values decoded as any from JSON without crashing on an unexpected shape",
  ],
  references: [
    {
      title: "The Go Programming Language Specification: Type assertions",
      url: "https://go.dev/ref/spec#Type_assertions",
      teaches: "The normative rule for x.(T): when it succeeds, what it yields, and when it panics.",
      relevance: "The authoritative definition behind the single-return and comma-ok forms in this lesson.",
      required: true,
      section: "Type assertions",
    },
    {
      title: "The Go Programming Language Specification: Type switches",
      url: "https://go.dev/ref/spec#Type_switches",
      teaches: "How switch x.(type) compares an interface value's dynamic type against each case, including nil.",
      relevance: "Confirms the exact semantics of the type switch used throughout this lesson.",
      required: true,
      section: "Type switches",
    },
    {
      title: "A Tour of Go: Type assertions",
      url: "https://go.dev/tour/methods/15",
      teaches: "The comma-ok assertion with a runnable example you can edit in the browser.",
      relevance: "The gentlest official walkthrough of the safe assertion form.",
      required: false,
      section: "Type assertions",
    },
  ],
  exercises: [
    {
      id: "go3ts-predict-comma-ok",
      type: "prediction",
      prompt:
        "Given `var x any = 7`, predict what `s, ok := x.(string)` binds to s and ok, and what `n, ok := x.(int)` binds instead.",
      expectedAnswer: 's is "" and ok is false; n is 7 and ok is true.',
      hints: [
        "The comma-ok form never panics — it reports success in ok.",
        "On a miss, the value is the target type's zero value.",
      ],
    },
    {
      id: "go3ts-read-switch",
      type: "code-reading",
      prompt:
        "Read a type switch with cases `case int:`, `case string:`, `case nil:`, and `default:`. Explain what type the bound variable `v` has inside each arm.",
      hints: [
        "In each case, v takes the type named by that case.",
        "In the default arm, v keeps the original interface type.",
      ],
    },
    {
      id: "go3ts-implement-describe",
      type: "implementation",
      prompt:
        "Implement describe so it returns \"int\", \"string\", or \"other\" depending on the dynamic type of its any argument.",
      starterCode:
        'package main\n\nimport "fmt"\n\nfunc describe(x any) string {\n  // branch on the dynamic type of x\n  return ""\n}\n\nfunc main() {\n  fmt.Println(describe(3))      // want: int\n  fmt.Println(describe("hi"))   // want: string\n  fmt.Println(describe(true))   // want: other\n}',
      expectedAnswer:
        'func describe(x any) string {\n  switch x.(type) {\n  case int:\n    return "int"\n  case string:\n    return "string"\n  default:\n    return "other"\n  }\n}',
      hints: [
        "Use `switch x.(type)` when you only need the type name, not the value.",
        "The default arm covers every type you did not list.",
      ],
    },
    {
      id: "go3ts-debug-panic",
      type: "debugging",
      prompt:
        "This panics at runtime: `var x any = \"hello\"` then `n := x.(int)`. Explain the panic and fix it so a mismatch is handled instead of crashing.",
      hints: [
        "The single-return assertion panics when the dynamic type does not match.",
        "Switch to the comma-ok form and check ok before using the value.",
      ],
    },
    {
      id: "go3ts-refactor-to-switch",
      type: "refactoring",
      prompt:
        "A function has a chain of four `if v, ok := x.(T); ok { ... }` blocks, one per type. Refactor it into a single type switch and explain what improves.",
      hints: [
        "A type switch binds v to the matched type in each case, no separate ok needed.",
        "One switch reads better than four independent assertions and cannot fall through by accident.",
      ],
    },
    {
      id: "go3ts-design-dispatch",
      type: "design",
      prompt:
        "You must handle Deposit, Withdrawal, and Transfer events. Decide between a type switch over concrete structs and giving each event an `Apply(*Ledger)` method, and state what evidence would make you switch approaches.",
      hints: [
        "How often will new event types be added, and by whom?",
        "A method set pushes each case next to its data; a switch keeps all cases in one place.",
      ],
    },
    {
      id: "go3ts-advanced-feature-detect",
      type: "advanced",
      prompt:
        "Write a function `save(w io.Writer, data []byte)` that writes data, then — only if w also implements `interface{ Sync() error }` — calls Sync. Show how you feature-detect the optional capability without requiring every writer to have it.",
      hints: [
        "Assert to the optional interface with the comma-ok form: `s, ok := w.(interface{ Sync() error })`.",
        "This is exactly how the standard library detects optional capabilities like Flusher.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-two-forms",
      kind: "explain",
      description:
        "Explain the difference between the single-return and comma-ok assertion forms, and when each panics.",
      required: true,
    },
    {
      id: "predict-switch",
      kind: "predict",
      description:
        "Correctly predict which arm of a type switch runs for a given value, including the nil case.",
      required: true,
    },
    {
      id: "implement-dispatch",
      kind: "implement",
      description:
        "Write a type switch that dispatches on several dynamic types and compiles cleanly.",
      required: true,
    },
    {
      id: "design-boundary",
      kind: "design",
      description:
        "Defend a choice between interface-based design and assertion-based dispatch for a real case.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "In the last lesson you learned that an **interface value** hides its concrete type behind a set of methods: a variable of type `io.Writer` might really be a file, a network connection, or a buffer, and your code doesn't care which. That's the whole point of an interface — it lets you work with many types through one shared shape.\n\nBut sometimes you need to go the other way: you're *handed* an interface value and you need to find out — and use — what's actually inside it. Maybe you decoded some JSON into an `any` and need to know if a field is a number or a string. Maybe you want to use a bonus method a value *might* have. That reverse move — recovering the concrete type back out of an interface — is what type assertions and type switches are for.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "An interface value is like a wrapped parcel labelled only 'contents: something you can print'. Most of the time you just print it and never unwrap it. A type assertion is you carefully unwrapping to check what the specific item is — and Go gives you a way to peek safely, or a way that breaks the parcel if you guess wrong.",
          },
        },
        {
          type: "points",
          items: [
            "An interface value carries a **dynamic type** (the concrete type inside) and a value.",
            "A **type assertion** asks: is the thing inside really this specific type?",
            "You need this at *boundaries* — decoding `any`, or detecting an optional capability.",
          ],
        },
      ],
    },
    naive: {
      body: "The instinct many newcomers have is: 'I know what's in there, so I'll just take it out.' In Go that looks like `n := x.(int)` — the single-return **type assertion**. It reads like a cast: give me the `int` inside `x`.\n\nThe trap is what happens when you're wrong. If `x` does *not* actually hold an `int`, this form doesn't return an error or a zero — it **panics**, crashing the program at that line. So the naive version works perfectly in your tests, where you control the input, and then blows up in production the first time a value has an unexpected shape.",
      blocks: [
        {
          type: "example",
          example: {
            title: "The single-return assertion panics on a miss",
            language: "go",
            code: 'var x any = "hello"\n\nn := x.(int) // panic: interface conversion: interface {} is string, not int\nfmt.Println(n)',
            takeaway:
              "`x.(int)` demands an int. Because x is really a string, the program panics right here instead of giving you a bad value.",
          },
        },
        {
          type: "points",
          items: [
            "`x.(T)` (single return) **panics** if x's dynamic type isn't T.",
            "It's only safe when you can *prove* the type — otherwise it's a crash waiting to happen.",
          ],
        },
      ],
    },
    failure: {
      body: "The reason the single-return form is dangerous is that the risky input usually comes from *outside* your code — a decoded request body, a config file, a plugin. Those are exactly the places you can't guarantee the type, and exactly the places a panic hurts most: one malformed message takes down the whole handler.\n\nThe failure isn't the assertion itself; it's using the form that can't fail gracefully in a spot where failure is normal. Go gives you a second form precisely for this: one that *reports* whether the type matched instead of crashing.",
      blocks: [
        {
          type: "scenario",
          scenario: {
            title: "The handler that crashes on one bad field",
            context:
              "A service decodes JSON into `map[string]any` and reads the amount with `amt := m[\"amount\"].(float64)`. Most clients send a number, but one sends the amount as a quoted string. That single request panics, and because the panic unwinds the goroutine, the request dies with a 500 and a stack trace instead of a clean 400.",
            insight:
              "The value came from an untrusted boundary, so a mismatch is expected input — not a bug. The single-return assertion turned normal bad input into a crash.",
          },
        },
      ],
    },
    intuition: {
      body: "Here's the mental shift. Instead of *demanding* a type and hoping, you *ask* for it and get a yes/no answer back. That's the **comma-ok** form: `v, ok := x.(T)`. If the thing inside really is a `T`, then `ok` is `true` and `v` is that value. If it isn't, `ok` is `false` and `v` is the zero value of `T` — and nothing panics.\n\nSo the two forms are the same question with different manners. `x.(T)` says 'this had better be a T'; `v, ok := x.(T)` says 'is this a T? tell me either way'. At any boundary you don't control, you want the polite one.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Two forms of the same assertion",
            kind: "compare",
            nodes: [
              {
                id: "single",
                label: "x.(T) — single return",
                detail: "Match: gives the value. Miss: PANICS.",
                tone: "danger",
              },
              {
                id: "commaok",
                label: "v, ok := x.(T) — comma-ok",
                detail: "Match: v = value, ok = true. Miss: v = zero, ok = false. Never panics.",
                tone: "success",
              },
            ],
            caption: "Same question — 'is x really a T?' — but only the comma-ok form lets you handle 'no' yourself.",
          },
        },
        {
          type: "points",
          items: [
            "`v, ok := x.(T)` never panics — it reports the outcome in `ok`.",
            "On a miss, `v` is T's zero value, so it's safe to read (just don't trust it).",
            "Use comma-ok at any boundary; use the single-return form only when a mismatch would be a real bug.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Keep one picture in mind: **an interface value is a pair — (dynamic type, value).** A type assertion compares the *dynamic type* against the type you name. That comparison has exactly one honest answer, and the comma-ok form hands it to you as a boolean.\n\nWhen you have more than one possible type to check, don't write a ladder of comma-ok assertions — use a **type switch**. It's the same comparison, done once against several candidate types, and it binds the matched value to the right type in each branch. Think of it as a normal `switch`, except each `case` names a *type* instead of a value.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "The one-sentence rule",
            text: "One type to check → comma-ok assertion; several types to check → type switch. Reach for the single-return form only when a wrong type would be a programmer bug, not bad input.",
          },
        },
        {
          type: "example",
          example: {
            title: "One assertion vs many, side by side",
            language: "go",
            code: '// One type in question — comma-ok:\nif n, ok := x.(int); ok {\n    fmt.Println("an int:", n)\n}\n\n// Several types in question — type switch:\nswitch v := x.(type) {\ncase int:\n    fmt.Println("int", v)\ncase string:\n    fmt.Println("string of length", len(v))\n}',
            takeaway: "The type switch is the comma-ok pattern generalized to many types, without the repetition.",
          },
        },
      ],
    },
    mechanics: {
      body: "Now the precise rules. A type assertion `x.(T)` requires `x` to be an interface value. If `T` is a concrete type, the assertion succeeds when `x`'s dynamic type is exactly `T`. If `T` is an *interface* type, it succeeds when `x`'s dynamic type implements `T` — that's how you feature-detect an optional capability. The single-return form panics on failure; the comma-ok form returns `(zero, false)`.\n\nA **type switch** is written `switch v := x.(type) { ... }`. Go evaluates `x`'s dynamic type once and matches it against each `case`. Inside a case that names a single type, `v` *has* that type — so you can call its methods and use it directly. A `case nil:` matches when the interface value itself is nil (it holds no type at all). The `default:` arm catches anything unlisted, and there `v` keeps `x`'s original interface type.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "How a type assertion resolves",
            kind: "flow",
            nodes: [
              { id: "iface", label: "interface value x", detail: "(dynamic type, value)" },
              { id: "ask", label: "x.(T)", detail: "is the dynamic type T (or does it implement T)?" },
              { id: "match", label: "match?", detail: "compared at runtime", tone: "accent" },
              { id: "out", label: "value of type T", detail: "or (zero, false) / panic on miss", tone: "success" },
            ],
            caption: "T can be concrete (exact match) or an interface (implements it). The form you chose decides how a miss is reported.",
          },
        },
        {
          type: "example",
          example: {
            title: "A type switch with nil and default",
            language: "go",
            code: 'func kind(x any) string {\n    switch v := x.(type) {\n    case nil:\n        return "nil"\n    case int:\n        return fmt.Sprintf("int %d", v)   // v is an int here\n    case string:\n        return fmt.Sprintf("string %q", v) // v is a string here\n    default:\n        return fmt.Sprintf("other %T", v)  // v keeps type any\n    }\n}',
            takeaway: "Each case rebinds v to the matched type. The nil arm catches an empty interface; default catches the rest.",
          },
        },
        {
          type: "points",
          items: [
            "`x.(T)` with concrete T → exact type match; with interface T → 'does it implement T?'.",
            "In a single-type `case`, `v` has that concrete type; in `default`, `v` keeps the interface type.",
            "`case nil:` matches an interface value holding no type; you can list several types in one case (then `v` stays the interface type).",
          ],
        },
      ],
    },
    diagram: {
      body: "Let's picture the type switch as the dispatcher it really is. Go looks at the one dynamic type inside the interface value and routes it to exactly one arm — the first case that matches — then binds `v` to the matching type there. Select an arm below to see what matches it and what type `v` takes inside it.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "A type switch routing one value",
            kind: "stack",
            nodes: [
              { id: "nil", label: "case nil:", detail: "matches when the interface holds no type" },
              { id: "int", label: "case int:", detail: "v is an int inside this arm" },
              { id: "str", label: "case string:", detail: "v is a string inside this arm", tone: "accent" },
              { id: "def", label: "default:", detail: "everything else; v keeps the interface type" },
            ],
            caption: "The dynamic type picks exactly one arm — top to bottom, first match wins.",
          },
        },
      ],
    },
    implementation: {
      body: "In practice you'll use these in two spots. The first is unpacking values that arrived as `any` — most often from a JSON decode, where numbers come back as `float64` and you don't fully control the shape. The second is **feature detection**: you have a value behind one interface and want to use an *extra* method it might also have. You assert to a small interface describing just that capability, using comma-ok so a value without it is handled gracefully.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Feature-detect an optional capability",
            language: "go",
            code: 'package main\n\nimport (\n    "fmt"\n    "io"\n)\n\n// save writes data, and flushes to disk only if w can Sync.\nfunc save(w io.Writer, data []byte) error {\n    if _, err := w.Write(data); err != nil {\n        return err\n    }\n    // Not every Writer can Sync — ask, don\'t assume.\n    if s, ok := w.(interface{ Sync() error }); ok {\n        return s.Sync()\n    }\n    return nil\n}\n\nfunc main() { fmt.Println("save uses Sync only when available") }',
            takeaway:
              "Asserting to a small interface with comma-ok lets you use a bonus method when it exists, without forcing every writer to provide it.",
          },
        },
        {
          type: "points",
          items: [
            "Decoding `any`: JSON numbers arrive as `float64`, objects as `map[string]any`, arrays as `[]any`.",
            "Feature detection: assert to `interface{ Extra() }` with comma-ok; the standard library does this (e.g. `http.Flusher`).",
            "Always comma-ok at these boundaries — the input is exactly where you can't guarantee the type.",
          ],
        },
      ],
    },
    experiment: {
      body: "Before reading on, commit to a prediction — correcting a wrong guess sticks better than nodding at a right one. Consider a type switch whose *first* case is `case int64:` and whose *second* case lists two types together, `case int, int32:`. You pass in a plain `int` value.\n\nWhich arm runs, and what is the type of `v` inside it?\n\nThe **second** arm runs — the dynamic type is `int`, which matches the `case int, int32:` list, not `int64` (assertions require an *exact* concrete-type match, and `int` is a distinct type from `int64`). And here's the subtle part: because that case lists *more than one* type, `v` is **not** narrowed to `int` — it keeps the original interface type (`any`). Go can only give `v` a single concrete type, so a multi-type case leaves it as the interface. If you need it as an `int`, give `int` its own case.",
    },
    "failure-cases": {
      body: "Most trouble with assertions comes from a short list of recurring mistakes. Here are the ones you'll actually hit, and the signal each gives.",
      blocks: [
        {
          type: "points",
          items: [
            "**Single-return form on untrusted input** → a runtime panic. Use comma-ok and handle the miss.",
            "**Asserting the wrong numeric type** → JSON gives `float64`, not `int`; `m[\"n\"].(int)` fails. Assert `float64` then convert.",
            "**Expecting narrowing in a multi-type case** → `case int, int64:` leaves `v` as the interface type, not int.",
            "**Forgetting `case nil:`** → a nil interface falls through to `default`, which is often not what you meant.",
            "**Asserting on a nil interface with single-return** → `var x any; x.(int)` panics; comma-ok returns `(0, false)`.",
          ],
        },
        {
          type: "example",
          example: {
            title: "JSON numbers are float64, not int",
            language: "go",
            code: 'var m map[string]any // from json.Unmarshal\n// m["amount"] holds a float64, even for 100\n\n// n := m["amount"].(int)   // panics: it\'s a float64\nf, ok := m["amount"].(float64)\nif ok {\n    cents := int64(f * 100) // convert on purpose\n    _ = cents\n}',
            takeaway: "Decoded JSON numbers are always float64. Assert to float64, then convert — asserting to int panics.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "The real design tension is: should you assert at all? Assertions and type switches are powerful, but reaching for them too eagerly is a sign you're fighting the type system instead of using it. The goal is a choice you can defend, plus the evidence that would change your mind.",
      blocks: [
        {
          type: "points",
          items: [
            "**Interface method vs type switch**: a method puts each behavior next to its type and stays open to new types; a switch centralizes the logic but must be edited for every new type.",
            "**Comma-ok vs single-return**: comma-ok is safe but adds an `if`; single-return is terse but only defensible when a mismatch is a genuine bug.",
            "**Assert-to-interface (feature detect) vs require it**: optional detection keeps the API flexible; requiring the method up front makes the contract explicit but excludes simpler types.",
            "**Type switch vs generics**: a switch handles a fixed, known set of types; generics fit when the logic is uniform across many types.",
          ],
        },
      ],
    },
    design: {
      body: "Turn this into a habit: **design with interfaces first, and treat assertions as a boundary tool.** If you find yourself type-switching over your *own* types deep inside your code, that's usually a missing method — give the types a shared interface and let the method dispatch for you. Keep assertions where they belong: unpacking `any` from decoders, and detecting optional capabilities. And at every one of those boundaries, use comma-ok so untrusted input can never panic your program.",
      blocks: [
        {
          type: "points",
          items: [
            "Prefer a shared interface + method over a type switch on your own types.",
            "Use assertions at boundaries: decoding `any`, feature detection.",
            "Comma-ok on anything you don't control; single-return only for provable bugs.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "The switch that kept growing",
            context:
              "A render function type-switches over Circle, Square, and Triangle to compute area. Every new shape means editing that switch — and a second switch elsewhere for perimeter.",
            insight:
              "Give each shape an `Area()` and `Perimeter()` method behind a `Shape` interface. New shapes then plug in without touching existing code, and the compiler flags any shape that forgets a method.",
          },
        },
      ],
    },
    ledgerflow: {
      body: "Here's the lesson applied to the project you'll build. LedgerFlow ingests a stream of events, each decoded into an `Event` interface value: a `Deposit`, a `Withdrawal`, or a `Transfer`. To apply each one to the running balance, the ledger uses a **type switch** on the concrete event type, binding `v` to the right struct in each arm so it can read that event's specific fields. Because the events arrive from a decoder, this is a genuine boundary — the switch also handles unknown types safely rather than trusting every message.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Dispatching on ledger event types",
            language: "go",
            code: 'type Event interface{ isEvent() }\n\ntype Deposit struct{ AmountC int64 }\ntype Withdrawal struct{ AmountC int64 }\ntype Transfer struct{ AmountC int64; To string }\n\nfunc (Deposit) isEvent()    {}\nfunc (Withdrawal) isEvent() {}\nfunc (Transfer) isEvent()   {}\n\nfunc apply(balanceC int64, e Event) (int64, error) {\n    switch v := e.(type) {\n    case Deposit:\n        return balanceC + v.AmountC, nil\n    case Withdrawal:\n        return balanceC - v.AmountC, nil\n    case Transfer:\n        return balanceC - v.AmountC, nil // v.To also available here\n    default:\n        return balanceC, fmt.Errorf("unknown event %T", v)\n    }\n}',
            takeaway:
              "The type switch binds v to each concrete event so you can read its fields, and the default arm rejects unknown events instead of panicking.",
          },
        },
        {
          type: "points",
          items: [
            "Events decode into an `Event` interface; the ledger switches on the concrete type.",
            "Each arm reads that event's own fields via the narrowed `v`.",
            "The `default` arm turns an unexpected type into an error, not a crash.",
          ],
        },
      ],
    },
    exercises: {
      body: "Practice is what turns 'I recognize this' into 'I can predict and build this'. Work across prediction, code-reading, implementation, debugging, refactoring, and design — each produces a different kind of evidence, so finishing one doesn't cover the rest.",
    },
    mastery: {
      body: "You've mastered this lesson when you can do four things without notes: explain how the single-return and comma-ok forms differ and when each panics, predict which arm of a type switch runs (including for nil), write a type switch that dispatches cleanly on several types, and defend a choice between interface-based design and assertion-based dispatch. Check a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "One idea carries this whole lesson: **an interface value is a (dynamic type, value) pair, and assertions ask what the dynamic type really is.** Ask politely with comma-ok, branch with a type switch, and reach for assertions only at the boundaries.",
      blocks: [
        {
          type: "points",
          items: [
            "`x.(T)` panics on a miss; `v, ok := x.(T)` reports the miss safely.",
            "A type switch (`switch v := x.(type)`) branches on several dynamic types and binds `v` per case.",
            "`case nil:` matches an empty interface; a multi-type case leaves `v` as the interface type.",
            "Assert to an interface (`x.(io.Writer)`) to feature-detect an optional capability.",
            "Design with interfaces first; use assertions at boundaries — decoding `any` and feature detection.",
          ],
        },
      ],
    },
  },
};
