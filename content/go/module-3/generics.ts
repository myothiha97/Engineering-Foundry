import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 3, lesson — generics: type parameters and constraints. Written in the
 * same beginner-friendly voice as Modules 0/1/2: plain language, one analogy per
 * hard idea, a concrete example before every abstract rule. Reformats go.dev
 * material on type parameters, constraints (type sets), and inference into
 * learner-facing prose, and is careful to teach when NOT to reach for generics.
 */
export const goGenerics: Lesson = {
  id: "go-generics",
  slug: "generics",
  title: "Generics: type parameters & constraints",
  description:
    "Write one function or type that works for many types without losing type safety or falling back to any-plus-casts — using type parameters, constraints as type sets, and inference.",
  moduleId: "go-3",
  estimatedMinutes: 60,
  difficulty: "intermediate",
  prerequisites: ["go-interfaces"],
  learningObjectives: [
    "Write a generic function with type parameters and read its `[T any, U any]` signature out loud",
    "Explain what a constraint is as a *set of types*, and use `any`, `comparable`, and a custom `~`-based constraint correctly",
    "Decide when generics genuinely remove duplication and when a single concrete type or a plain interface is the better choice",
  ],
  concepts: ["generics", "type-parameters", "constraints", "inference"],
  ledgerFlowApplications: [
    "Build a generic, type-safe Result[T] helper so every fallible call carries either a value or an error without per-type boilerplate",
    "Write one Map/Filter over slices of transactions, accounts, or amounts instead of copy-pasting a loop per type",
    "Constrain a Sum helper to a numeric type set so it totals int64 cents but refuses to compile on a string",
  ],
  references: [
    {
      title: "Tutorial: Getting started with generics",
      url: "https://go.dev/doc/tutorial/generics",
      teaches:
        "A hands-on walkthrough that builds a generic Sum function step by step, introducing type parameters and constraints from scratch.",
      relevance:
        "The gentlest official path through exactly the syntax and ideas this lesson teaches.",
      required: true,
      section: "Add a generic function; Add a type parameter; Declare a type constraint",
    },
    {
      title: "When to use generics — The Go Blog",
      url: "https://go.dev/blog/when-generics",
      teaches:
        "The judgment call: which situations genuinely benefit from type parameters and which are better served by a plain interface or a single concrete type.",
      relevance:
        "The authoritative source behind this lesson's 'when NOT to use generics' stages — the part beginners most often get wrong.",
      required: true,
      section: "When are type parameters useful; When are they not",
    },
    {
      title: "Type parameter declarations — Go spec",
      url: "https://go.dev/ref/spec#Type_parameter_declarations",
      teaches:
        "The normative rules for declaring type parameters and how a constraint interface defines a set of permitted types.",
      relevance:
        "Confirms that constraints are type sets and that `~T` means 'any type whose underlying type is T', not a loose convention.",
      required: false,
      section: "Type parameter declarations; Type sets; Type constraints",
    },
  ],
  exercises: [
    {
      id: "go3ge-predict-infer",
      type: "prediction",
      prompt:
        "Given `func First[T any](s []T) T { return s[0] }`, predict the type of `x` in `x := First([]int{1, 2, 3})` and in `y := First([]string{\"a\"})`, and say whether you had to write the type argument yourself.",
      expectedAnswer:
        "x is int and y is string. You write neither type argument — the compiler infers T from the slice element type.",
      hints: [
        "T is chosen from the argument you pass, not written in the call.",
        "The return type T follows whatever T was inferred to be.",
      ],
    },
    {
      id: "go3ge-read-constraint",
      type: "code-reading",
      prompt:
        "Read `type Number interface { ~int | ~int64 | ~float64 }`. Explain in plain words what set of types satisfies it, and what the `~` changes compared with writing the types without it.",
      hints: [
        "A constraint names a set of types, not a set of methods here.",
        "`~int` means 'any type whose underlying type is int' — so a `type Cents int` still qualifies.",
      ],
    },
    {
      id: "go3ge-implement-map",
      type: "implementation",
      prompt:
        "Implement a generic Map that turns a []T into a []U by applying f to each element. It must compile and preserve length.",
      starterCode:
        'package main\n\nimport "fmt"\n\n// Map applies f to every element of s and returns the results.\nfunc Map[T any, U any](s []T, f func(T) U) []U {\n\t// build and return the mapped slice\n\treturn nil\n}\n\nfunc main() {\n\tlengths := Map([]string{"a", "bb", "ccc"}, func(s string) int { return len(s) })\n\tfmt.Println(lengths) // want: [1 2 3]\n}',
      expectedAnswer:
        "func Map[T any, U any](s []T, f func(T) U) []U {\n\tout := make([]U, len(s))\n\tfor i, v := range s {\n\t\tout[i] = f(v)\n\t}\n\treturn out\n}",
      hints: [
        "Preallocate with make([]U, len(s)) so the result matches the input length.",
        "range gives you the index and the T value; assign f(v) into the output slice.",
      ],
    },
    {
      id: "go3ge-debug-comparable",
      type: "debugging",
      prompt:
        "This does not compile: `func Contains[T any](s []T, target T) bool { for _, v := range s { if v == target { return true } }; return false }`. Explain the error and fix it with the smallest possible change.",
      hints: [
        "`any` does not promise the type supports `==`.",
        "There is a built-in constraint whose whole job is to permit == and !=.",
      ],
    },
    {
      id: "go3ge-refactor-dedup",
      type: "refactoring",
      prompt:
        "You have two near-identical functions, SumInts([]int) int and SumFloats([]float64) float64, differing only in element type. Refactor them into one generic Sum, choosing an appropriate constraint, and say what you gained and what you gave up.",
      hints: [
        "Define a constraint that is the type set {int, float64} (add `~` if you want named types to qualify).",
        "The gain is one implementation; the cost is a slightly more abstract signature to read.",
      ],
    },
    {
      id: "go3ge-design-when-not",
      type: "design",
      prompt:
        "A teammate proposes making your Logger generic: `type Logger[T any] struct{...}`, even though it only ever logs strings. Argue for or against, citing the go.dev guidance on when generics help.",
      hints: [
        "Generics pay off when the *same logic* runs over many types; one concrete type is not that case.",
        "If behavior differs per type, an interface (method set) is usually clearer than a type parameter.",
      ],
    },
    {
      id: "go3ge-advanced-result",
      type: "advanced",
      prompt:
        "Design a generic Result[T] type that holds either a value of type T or an error, with constructors Ok and Err and a method Unwrap() (T, error). Then show how it improves a function that parses an amount into int64 cents. Discuss whether Result is idiomatic in Go and when you would prefer the plain (T, error) return instead.",
      hints: [
        "A struct with a value T and an error field is enough — no union type needed.",
        "Go already returns (value, error) idiomatically; Result shines mainly when you must store or pass many pending outcomes around uniformly.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-constraint-type-set",
      kind: "explain",
      description:
        "Explain, in plain words, that a constraint is a set of permitted types, and what `any`, `comparable`, and `~int` each allow.",
      required: true,
    },
    {
      id: "predict-inference",
      kind: "predict",
      description:
        "Correctly predict the inferred type parameters and result type of a generic call without a written type argument.",
      required: true,
    },
    {
      id: "implement-generic-fn",
      kind: "implement",
      description:
        "Write a generic function (e.g. Map or Filter) with correct type parameters that compiles and is type-safe.",
      required: true,
    },
    {
      id: "design-when-generics",
      kind: "design",
      description:
        "Decide, with justification, when to use a type parameter versus a plain interface or a single concrete type.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "Sooner or later you write the same function twice. A `Max` for `int` and a `Max` for `float64`. A `Contains` for `[]string` and a `Contains` for `[]int`. The bodies are identical — only the types differ. Copy-paste feels wrong, and it is: every copy is another place a bug can hide and another thing to keep in sync.\n\nBefore Go 1.18 you had two escape hatches, and both hurt. You could write the function once per type (duplication), or you could use `interface{}` (now spelled `any`) and cast values back with type assertions — which throws away the compiler's help and can panic at runtime. **Generics** give you a third option: write the logic *once*, and let it work for many types while the compiler still checks every use.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "A generic function is like a recipe written with a blank where the main ingredient goes: 'roast the ___ for 20 minutes.' The steps never change; you fill in 'chicken' or 'potatoes' at cooking time. Go fills in the *type* at compile time — and refuses to cook if the ingredient doesn't fit the recipe.",
          },
        },
        {
          type: "points",
          items: [
            "The same logic repeated per type is duplication waiting to drift.",
            "`any` + type assertions removes duplication but also removes the compiler's safety net.",
            "Generics let you write logic once *and* keep full type checking.",
          ],
        },
      ],
    },
    naive: {
      body: "The instinct many newcomers reach for is `any` (the empty interface). 'I'll just accept any value and figure out the type inside.' It compiles, so it feels fine.\n\nThe trouble is that `any` erases what you know. The moment a value is stored as `any`, the compiler no longer knows it's an `int`, so you can't add it, compare it, or index it without first asserting `v.(int)` — and if you assert the wrong type, your program panics at runtime. You've moved a whole class of errors from compile time (cheap, safe) to runtime (expensive, in production).",
      blocks: [
        {
          type: "example",
          example: {
            title: "any throws away type safety",
            language: "go",
            code: 'func SumAny(nums []any) any {\n\ttotal := 0\n\tfor _, n := range nums {\n\t\ttotal += n.(int) // assertion: panics if n is not an int\n\t}\n\treturn total\n}\n\n// SumAny([]any{1, 2, "oops"}) compiles fine, then PANICS at runtime.',
            takeaway:
              "With any, the compiler can't stop you passing a string. The mistake surfaces only when the code runs.",
          },
        },
        {
          type: "points",
          items: [
            "`any` accepts everything, so the compiler can prove nothing about the value.",
            "You pay with type assertions and the runtime panics they invite.",
          ],
        },
      ],
    },
    failure: {
      body: "The `any` approach doesn't just risk panics — it hides real bugs behind code that *looks* correct. A signature like `func Process(items []any) any` tells a caller nothing: what can I pass? what do I get back? The types that used to document your intent are gone.\n\nThe duplication approach fails differently but just as surely. Two copies of `Max` start identical; six months later someone fixes an edge case in the `int` version and forgets the `float64` one. Now they silently disagree. Neither escape hatch is safe — the failure is having no way to say 'same logic, different type' directly.",
      blocks: [
        {
          type: "scenario",
          scenario: {
            title: "The copy that drifted",
            context:
              "A team keeps SumInts and SumFloats side by side. A rounding fix lands in SumFloats during a rush. Weeks later a report built on SumInts is off, and no one connects it to the 'unrelated' fix.",
            insight:
              "The two functions were never truly separate — they were one idea copied twice. Generics would have made them a single source of truth.",
          },
        },
      ],
    },
    intuition: {
      body: "Here's the shift in thinking. A normal function is parameterised by *values*: you pass in `3` and `4`, it works on those numbers. A generic function is *also* parameterised by a **type**: you (or the compiler) pass in `int`, and the function specialises to work on ints.\n\nSo a type parameter is just another kind of input — but one that's chosen at compile time, not runtime. Written `[T any]`, it reads as 'let `T` stand for some type; the caller decides which.' Inside the function you use `T` exactly like any other type name. When someone calls it with an `int` slice, `T` *is* `int` for that call, and the compiler checks everything as if you'd written `int` by hand.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Two kinds of parameters",
            kind: "compare",
            nodes: [
              {
                id: "value",
                label: "Value parameters",
                detail: "func Add(a, b int) — you pass values like 3 and 4",
              },
              {
                id: "type",
                label: "Type parameters",
                detail: "func Max[T any](a, b T) — you (or the compiler) pass a type like int",
                tone: "accent",
              },
            ],
            caption:
              "Generics add a second slot: the type itself becomes an input, filled in at compile time.",
          },
        },
        {
          type: "note",
          note: {
            tone: "tip",
            title: "Read it out loud",
            text: "`func Map[T any, U any](s []T, f func(T) U) []U` reads as: 'for any two types T and U, take a slice of T and a function from T to U, and give back a slice of U.'",
          },
        },
      ],
    },
    "mental-model": {
      body: "Two ideas carry this whole lesson.\n\nFirst, **a type parameter is a placeholder type the caller fills in.** You declare it in square brackets before the value parameters: `func Name[T any](...)`. Inside, `T` behaves like a real type.\n\nSecond — and this is the part beginners miss — **a constraint is a *set of types*, and it decides what you're allowed to do with a value of that type.** The constraint `any` permits every type but promises no operations (you can pass it around, that's all). The constraint `comparable` is the set of types that support `==` and `!=`. A custom constraint like `Number` names an explicit set (`int`, `float64`, …) and thereby permits arithmetic. The rule of thumb: *you can only do to a `T` what its constraint guarantees every type in the set can do.*",
      blocks: [
        {
          type: "note",
          note: {
            tone: "info",
            title: "The one-sentence rule",
            text: "A type parameter says 'some type goes here'; its constraint says 'and here's the set of types allowed, which fixes what operations are legal on it.'",
          },
        },
        {
          type: "points",
          items: [
            "`any` — the set of all types; permits no operations beyond assignment and passing around.",
            "`comparable` — the set of types you can compare with `==` / `!=` (so map keys, equality checks).",
            "A custom constraint like `Number` — an explicit set of types that unlocks the operations they share (e.g. `+`).",
          ],
        },
      ],
    },
    mechanics: {
      body: "Now the precise rules. You declare type parameters in square brackets immediately after the function name, each with a constraint: `func Map[T any, U any](s []T, f func(T) U) []U`. Every type parameter *must* have a constraint — `any` is the do-nothing constraint you use when the body doesn't need any special operation.\n\nA **constraint** is written as an interface, but with a twist. Alongside (or instead of) methods, its body can list a *type set* using `|`: `int | int64 | float64`. A type satisfies the constraint if it's in that set. Prefix an element with `~` — as in `~int` — to mean 'any type whose **underlying type** is `int`'. That matters because a named type like `type Cents int64` has underlying type `int64`; `~int64` includes it, plain `int64` does not. Finally, `comparable` is a built-in constraint for the set of types usable with `==`, and it's what you need whenever your generic code compares values.",
      blocks: [
        {
          type: "example",
          example: {
            title: "A custom constraint as a type set",
            language: "go",
            code: 'type Number interface {\n\t~int | ~int64 | ~float64\n}\n\n// Sum works for any type in the Number set — and any named\n// type built on those, thanks to ~.\nfunc Sum[T Number](nums []T) T {\n\tvar total T // zero value of T\n\tfor _, n := range nums {\n\t\ttotal += n // legal: every type in Number supports +\n\t}\n\treturn total\n}\n\ntype Cents int64\n_ = Sum([]Cents{100, 250}) // ok: Cents has underlying type int64',
            takeaway:
              "The `+` is only allowed because *every* type in the Number set supports it. `~int64` is what lets the named type Cents qualify.",
          },
        },
        {
          type: "points",
          items: [
            "Declare type params in `[...]` after the name; every one needs a constraint (`any` = no requirement).",
            "A constraint's type set lists allowed types with `|`; a `T` may only use operations shared by the whole set.",
            "`~int` = 'underlying type is int', so named types like `type Cents int` still match.",
            "`comparable` is the built-in set for `==` / `!=`.",
          ],
        },
      ],
    },
    diagram: {
      body: "Picture what actually happens when you call a generic function. You write one call with a concrete type; the compiler resolves the type parameter, checks the type satisfies the constraint, and then type-checks the body as if `T` were that concrete type. Follow the steps below for `Sum([]int{1, 2, 3})`.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "From generic call to type-checked code",
            kind: "sequence",
            nodes: [
              {
                id: "call",
                label: "1. Call site",
                detail: "Sum([]int{1,2,3}) — no type argument written",
              },
              {
                id: "infer",
                label: "2. Infer T",
                detail: "argument is []int, so T = int",
                tone: "accent",
              },
              {
                id: "check",
                label: "3. Check constraint",
                detail: "is int in the Number set? yes",
                tone: "success",
              },
              {
                id: "body",
                label: "4. Type-check body",
                detail: "total += n is checked as int arithmetic",
              },
            ],
            caption:
              "If step 3 fails — say you pass []string — you get a clear compile error, never a runtime surprise.",
          },
        },
      ],
    },
    implementation: {
      body: "In practice the generic functions you'll write most are collection helpers: `Map`, `Filter`, `Contains`, `Keys`. They're the textbook case for generics because the logic is genuinely identical across element types — only the type changes. Here's `Map` and `Filter` written once, working for any element type.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Map and Filter, written once",
            language: "go",
            code: 'package main\n\nimport "fmt"\n\n// Map turns a []T into a []U by applying f to each element.\nfunc Map[T any, U any](s []T, f func(T) U) []U {\n\tout := make([]U, len(s))\n\tfor i, v := range s {\n\t\tout[i] = f(v)\n\t}\n\treturn out\n}\n\n// Filter keeps only the elements for which keep returns true.\nfunc Filter[T any](s []T, keep func(T) bool) []T {\n\tvar out []T\n\tfor _, v := range s {\n\t\tif keep(v) {\n\t\t\tout = append(out, v)\n\t\t}\n\t}\n\treturn out\n}\n\nfunc main() {\n\tnames := []string{"ada", "grace", "linus"}\n\tlengths := Map(names, func(n string) int { return len(n) })\n\tfmt.Println(lengths) // [3 5 5]\n\n\tnums := []int{1, 2, 3, 4}\n\tevens := Filter(nums, func(n int) bool { return n%2 == 0 })\n\tfmt.Println(evens) // [2 4]\n}',
            takeaway:
              "One Map handles strings-to-ints and anything else; one Filter handles any element type. No duplication, full type safety, no casts.",
          },
        },
        {
          type: "example",
          example: {
            title: "Contains needs comparable, not any",
            language: "go",
            code: '// == is only allowed because T is constrained to comparable.\nfunc Contains[T comparable](s []T, target T) bool {\n\tfor _, v := range s {\n\t\tif v == target {\n\t\t\treturn true\n\t\t}\n\t}\n\treturn false\n}',
            takeaway:
              "Choose the *narrowest* constraint that permits what you do. Comparing values needs comparable; `any` would not compile.",
          },
        },
      ],
    },
    experiment: {
      body: "Before reading on, commit to a prediction — a corrected wrong guess sticks better than a right answer you skimmed.\n\nSuppose you write `func Contains[T any](s []T, target T) bool { ... v == target ... }` using the constraint `any` instead of `comparable`. Will it compile? Decide now, then reveal.\n\nThe answer is **no, it does not compile.** The error is roughly `invalid operation: v == target (incomparable types in type set)`. Here's why: the constraint `any` is the set of *all* types, and not all types support `==` — a slice, a map, or a function value can't be compared. Because `any` can't promise every possible `T` supports `==`, the compiler refuses the operation for the whole function, even though the `int` you had in mind would have been fine. Switch the constraint to `comparable` and it compiles, because now `T` is restricted to exactly the types where `==` is legal. This is the mental-model rule in action: *you can only do to a `T` what its constraint guarantees for every type in the set.*",
    },
    "failure-cases": {
      body: "Most generics trouble at this level comes from a short list of recurring mistakes. Here they are with the signal each one gives.",
      blocks: [
        {
          type: "points",
          items: [
            "**Using an operation the constraint doesn't guarantee** → `invalid operation`. Comparing with `any`, adding without a numeric constraint — narrow the constraint.",
            "**Forgetting `~` in a constraint** → a named type like `type Cents int64` won't match `int64`. Write `~int64` to include underlying types.",
            "**Reaching for generics with one concrete type** → needless abstraction. If only strings ever pass through, don't parameterise.",
            "**Type parameter that appears only in the return** → the compiler can't infer it, so callers must write it explicitly, e.g. `New[int]()`. Often a sign the design should change.",
            "**Choosing generics where an interface fits better** → if behavior differs per type (different method bodies), a method set (interface) is clearer than a type set.",
          ],
        },
        {
          type: "example",
          example: {
            title: "When inference can't help you",
            language: "go",
            code: 'func Zero[T any]() T {\n\tvar z T\n\treturn z\n}\n\n// x := Zero()      // ERROR: cannot infer T (it\'s only in the return)\nx := Zero[int]()    // ok: you supply the type argument\n_ = x',
            takeaway:
              "Inference works from the arguments. If T shows up only in the result, the caller must name it — a hint the API may want an argument or a concrete type.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "Generics are a tool, not a default. The go.dev guidance is blunt: reach for type parameters when you're writing the *same code* over many types; otherwise prefer an interface or a single concrete type. Here's the balance to weigh.",
      blocks: [
        {
          type: "points",
          items: [
            "**Generic vs duplicated**: generics give one source of truth; the cost is a signature that's slightly more abstract to read.",
            "**Generic vs interface**: use a type parameter when the *logic* is identical across types (Map, Filter). Use an interface when the *behavior* differs per type (each implements the method its own way).",
            "**Generic vs one concrete type**: if only one type ever flows through, a plain function is simpler and clearer — don't parameterise on principle.",
            "**Readability cost**: `[T Number]` and `~int64` are extra vocabulary a reader must know; spend it only where the reuse pays for it.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Interface, not generic",
            context:
              "You have shapes — Circle, Rectangle — that each compute Area differently. Someone suggests `Area[T Shape](s T)`.",
            insight:
              "The behavior differs per type, so a plain `interface { Area() float64 }` is clearer: each shape supplies its own method. Generics fit when the logic is the same, not when it varies.",
          },
        },
      ],
    },
    design: {
      body: "Turn the rules into habits. Default to concrete types and interfaces; introduce a type parameter only when you catch yourself writing the same logic for a second type. When you do, pick the *narrowest* constraint that permits your operations — `comparable` if you compare, a numeric set if you add, `any` only when the body treats values as opaque. And prefer the standard library's `slices` and `maps` packages before hand-rolling your own generic helpers.",
      blocks: [
        {
          type: "points",
          items: [
            "Add generics to remove real duplication, not speculatively.",
            "Constrain as tightly as the operations require — the constraint documents what the code does.",
            "If behavior varies per type, choose an interface; if logic is identical, choose a type parameter.",
            "Check `slices`/`maps` in the standard library before writing your own Map/Filter/Contains.",
          ],
        },
      ],
    },
    ledgerflow: {
      body: "Here's the lesson applied to the project you'll build. LedgerFlow constantly transforms and filters collections — transactions, accounts, amounts — and many operations can fail. Two generic helpers earn their place. A `Result[T]` type carries either a value or an error uniformly, so a batch of pending parses can be stored and inspected without a bespoke struct per type. And a single `Map`/`Filter` over slices replaces a loop copied for every element type. Note the discipline: `Result` and the collection helpers are genuinely reused across types, which is exactly when generics pay off — a per-account report that only ever handles one type would stay a plain function.",
      blocks: [
        {
          type: "example",
          example: {
            title: "A generic, type-safe Result helper",
            language: "go",
            code: 'type Result[T any] struct {\n\tvalue T\n\terr   error\n}\n\nfunc Ok[T any](v T) Result[T]  { return Result[T]{value: v} }\nfunc Err[T any](e error) Result[T] { return Result[T]{err: e} }\n\nfunc (r Result[T]) Unwrap() (T, error) { return r.value, r.err }\n\n// Parsing a user-entered amount into exact int64 cents:\nfunc parseCents(s string) Result[int64] {\n\tcents, err := strconv.ParseInt(s, 10, 64)\n\tif err != nil {\n\t\treturn Err[int64](err)\n\t}\n\treturn Ok(cents)\n}',
            takeaway:
              "One Result[T] serves int64 cents, AccountID, or any type — value or error, checked by the compiler, with no per-type boilerplate.",
          },
        },
        {
          type: "points",
          items: [
            "`Result[T]` unifies fallible outcomes across every domain type.",
            "One `Map`/`Filter` replaces a per-type loop for transactions, accounts, amounts.",
            "Use generics where the reuse is real; keep single-type helpers plain.",
          ],
        },
      ],
    },
    exercises: {
      body: "Practice is what turns 'I recognize this' into 'I can predict and build this.' Work across prediction, code-reading, implementation, debugging, refactoring, and design — each produces a different kind of evidence, so finishing one doesn't cover the rest. Pay special attention to the design exercise on *when not* to reach for generics; that judgment is what separates using the feature from overusing it.",
    },
    mastery: {
      body: "You've mastered this lesson when you can do four things without notes: explain that a constraint is a set of types and say what `any`, `comparable`, and `~int` each allow; predict the inferred type parameters of a generic call with no written type argument; write a generic function like `Map` that compiles and stays type-safe; and defend a choice between a type parameter, a plain interface, and a single concrete type. Check a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "Generics let you write logic **once** and run it over many types while the compiler keeps checking every use — replacing both copy-paste duplication and unsafe `any` + casts. The whole feature rests on two ideas: a **type parameter** is a placeholder type the caller fills in, and a **constraint** is a *set of types* that fixes what operations are legal on it.",
      blocks: [
        {
          type: "points",
          items: [
            "Declare type params in `[...]`: `func Map[T any, U any](s []T, f func(T) U) []U`.",
            "Constraints are type sets: `any` (all types, no ops), `comparable` (==), custom like `~int | ~float64` (arithmetic).",
            "`~T` means 'underlying type is T', so named types qualify.",
            "The compiler usually *infers* type arguments from the values you pass — you rarely write them.",
            "Use generics for identical logic across types; prefer an interface for differing behavior and a concrete type for a single case.",
          ],
        },
      ],
    },
  },
};
