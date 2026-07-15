import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 1, lesson 1 — basic types, constants, and zero values. Written in the
 * same beginner-friendly voice as Module 0: plain language, one analogy per hard
 * idea, a concrete example before every abstract rule. Reformats go.dev material
 * on types, untyped constants, and conversions into learner-facing prose.
 */
export const goBasicTypes: Lesson = {
  id: "go-basic-types",
  slug: "basic-types",
  title: "Basic types, constants & zero values",
  description:
    "Learn Go's basic types, how variable types can be written or inferred, zero values, and constant rules.",
  moduleId: "go-1",
  estimatedMinutes: 55,
  difficulty: "beginner",
  prerequisites: ["go-source-to-process"],
  learningObjectives: [
    "Recognize Go's basic type families and the byte and rune aliases",
    "Predict the type Go infers from a variable's initializer",
    "Predict the zero value of any basic type without running the code",
    "Explain how an untyped constant chooses a type when it meets a variable",
    "Convert between numeric types explicitly and say why Go refuses to do it for you",
  ],
  concepts: [
    "types",
    "basic-type-families",
    "type-inference",
    "variable-declarations",
    "untyped-constants",
    "zero-values",
    "conversions",
  ],
  references: [
    {
      title: "A Tour of Go: Basics",
      url: "https://go.dev/tour/basics",
      teaches:
        "The basic types, variable declarations, zero values, and type conversions with runnable examples.",
      relevance: "The gentlest official walkthrough of exactly the material in this lesson.",
      required: false,
      section:
        "Variables with initializers; Short variable declarations; Zero values; Type conversions",
    },
    {
      title: "Constants — The Go Blog",
      url: "https://go.dev/blog/constants",
      teaches: "Why Go has untyped constants and how they take on a type only when used.",
      relevance: "The authoritative explanation behind the untyped-constant stages of this lesson.",
      required: false,
      section: "The concept of untyped constants; Default type",
    },
    {
      title: "The Go Programming Language Specification: The zero value",
      url: "https://go.dev/ref/spec#The_zero_value",
      teaches: "The normative rule that every variable is initialized to its type's zero value.",
      relevance: "Confirms zero values are a language guarantee, not an accident of the compiler.",
      required: false,
      section: "The zero value; Constants; Iota",
    },
  ],
  exercises: [
    {
      id: "go1bt-predict-zero",
      type: "prediction",
      prompt:
        "Given `var count int`, `var name string`, `var active bool`, and `var ratio float64`, predict what each prints with fmt.Println before running it.",
      expectedAnswer: '0, "" (an empty line), false, 0',
      hints: [
        "No initializer means the zero value.",
        "The zero value of a string is the empty string, not nil.",
      ],
    },
    {
      id: "go1bt-read-constant",
      type: "code-reading",
      prompt:
        'Read `var name = "myo"`, `age := 30`, and `var score float64 = 10`. State the type of each variable and explain where that type came from.',
      expectedAnswer:
        "name is string, inferred from the string initializer. age is int, inferred from the integer literal's default type. score is float64 because the declaration states that type explicitly and 10 fits it.",
      hints: [
        "A string literal defaults to string and an integer literal defaults to int when no other type is supplied.",
        "An explicit type wins when the declaration includes one.",
      ],
    },
    {
      id: "go1bt-implement-cents",
      type: "implementation",
      prompt:
        "Implement toCents so it converts a whole-dollar int amount into an int64 number of cents.",
      starterCode:
        'package main\n\nimport "fmt"\n\nfunc toCents(dollars int) int64 {\n  // return the amount expressed in cents\n  return 0\n}\n\nfunc main() { fmt.Println(toCents(3)) } // want: 300',
      expectedAnswer: "func toCents(dollars int) int64 { return int64(dollars) * 100 }",
      hints: [
        "int and int64 are different types — convert explicitly.",
        "100 is an untyped constant, so it adapts to int64 for free.",
      ],
    },
    {
      id: "go1bt-debug-conversion",
      type: "debugging",
      prompt:
        "This does not compile: `var a int = 5` then `var b float64 = a * 2`. Explain the error and fix it without changing a's type.",
      hints: [
        "Go never mixes numeric types in one expression implicitly.",
        "Wrap a in a conversion: float64(a).",
      ],
    },
    {
      id: "go1bt-refactor-money",
      type: "refactoring",
      prompt:
        "A balance is stored as `var balance float64`. Refactor the type and any arithmetic so money is represented exactly, and explain what breaks if you leave it as float64.",
      hints: [
        "Integer cents avoid binary-fraction rounding.",
        "0.1 + 0.2 is not exactly 0.3 in float64.",
      ],
    },
    {
      id: "go1bt-design-id",
      type: "design",
      prompt:
        "Choose a base type for a user identifier (numeric counter vs opaque string) and state what evidence would make you switch.",
      hints: [
        "Do you ever do arithmetic on an ID?",
        "Will IDs come from an external system or database sequence?",
      ],
    },
    {
      id: "go1bt-advanced-precision",
      type: "advanced",
      prompt:
        "Show, with a short program, a decimal value that float64 cannot store exactly, then rewrite the same calculation in integer cents and prove the integer version is exact.",
      hints: ["Print 0.1 + 0.2 with %.17f.", "Compare against the same sum done as ints."],
    },
  ],
  masteryCriteria: [
    {
      id: "predict-inference",
      kind: "predict",
      description:
        "Predict the type produced by `var name = value` and `name := value`, and explain that the type stays fixed.",
      required: true,
    },
    {
      id: "explain-untyped",
      kind: "explain",
      description:
        "Explain in plain words what an untyped constant is and when it acquires a type.",
      required: true,
    },
    {
      id: "predict-zero",
      kind: "predict",
      description: "Correctly predict the zero value for numeric, string, and boolean variables.",
      required: true,
    },
    {
      id: "implement-conversion",
      kind: "implement",
      description:
        "Write code that converts between numeric types explicitly and compiles cleanly.",
      required: true,
    },
    {
      id: "design-money-type",
      kind: "design",
      description: "Defend a base-type choice for a quantity and an identifier.",
      required: false,
    },
  ],
  sections: {
    problem: {
      title: "Why Go cares about types",
      body: "Every program is, at bottom, values moving around: a count, a name, a price, a yes/no flag. Before you can do anything useful in Go, you have to say what *kind* of value each thing is — its **type**. A type is a promise about what a value can hold and what you're allowed to do with it.\n\nBeginners coming from languages like Python or JavaScript often expect Go to be flexible: mix an integer and a decimal, and it'll 'just figure it out'. Go deliberately doesn't. It picks a small set of clear rules up front, and those rules stop a whole category of quiet bugs — the kind where a number is silently rounded or a currency ends up a penny short.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "A type is like a labelled container in a kitchen. A jar marked 'flour' won't accept eggs, and you can't pour it as if it were liquid. Go checks the label before every operation, so mismatches are caught while you're cooking — not when the dish reaches the table.",
          },
        },
        {
          type: "points",
          items: [
            "A **type** says what values fit and which operations are legal.",
            "Go refuses to silently mix number types — you convert on purpose.",
            "Getting the base type right (especially for money) prevents bugs you'd otherwise ship.",
          ],
        },
      ],
    },
    "mental-model": {
      title: "Variables, zero values & constants",
      body: "Keep two ideas in your head and most of this lesson follows from them.\n\nFirst, **every variable starts at its zero value** — the type's natural 'nothing yet'. Numbers start at `0`, strings at `\"\"` (empty), booleans at `false`. You never read garbage. Second, **a plain literal like `42` or `3.14` is an *untyped constant*** — a value that has no fixed type until you use it somewhere. When it meets a variable, it *becomes* that variable's type if it fits. This is why `var x float64 = 42` is fine even though `42` looks like an integer: the untyped constant `42` happily becomes a `float64`.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "The one-sentence rule",
            text: "Variables have types and start at their zero value; untyped constants have no type until they're used, then they adopt the type they're used as.",
          },
        },
        {
          type: "note",
          note: {
            tone: "info",
            title: "Go can infer a variable's type",
            text: '`var name = "myo"` infers `string` from the initializer. Inside a function, `name := "myo"` is shorthand for the same declaration. The inferred type is still fixed; `name` cannot later hold an `int`.',
          },
        },
        {
          type: "example",
          example: {
            title: "One constant, several types",
            language: "go",
            code: "const answer = 42     // untyped: no type yet\n\nvar i int = answer     // becomes int\nvar f float64 = answer // becomes float64\nvar b byte = answer    // becomes byte (uint8) — fits in 0..255",
            takeaway:
              "The single constant 42 takes on a different type at each use. A typed variable could not do this.",
          },
        },
      ],
    },
    mechanics: {
      title: "Declaring variables and choosing types",
      body: "Go variables always have one fixed type, but you do not always have to write that type yourself. You can state it explicitly, let Go infer it from the value on the right, or use the shorter `:=` form inside a function.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Four common declaration forms",
            language: "go",
            code: 'var name string = "myo" // explicit type: string\nvar city = "Bangkok"     // inferred type: string\nage := 30                 // inferred type: int; inside functions only\nvar count int             // no value supplied, so count starts at 0',
            takeaway:
              "name and city are both strings, and age is an int. Inference saves typing; it does not make the variable dynamically typed.",
          },
        },
        {
          type: "note",
          note: {
            tone: "tip",
            title: "Start with four everyday types",
            text: "Use `bool` for true/false, `string` for text, `int` for ordinary whole numbers, and `float64` for ordinary decimal calculations. These cover most beginner programs.",
          },
        },
        {
          type: "points",
          items: [
            "Signed integers: `int`, `int8`, `int16`, `int32`, `int64` — they can be negative.",
            "Unsigned integers: `uint`, `uint8`, `uint16`, `uint32`, `uint64`, `uintptr` — they cannot be negative.",
            "Floating point: `float32`, `float64`. An inferred decimal such as `rate := 1.5` becomes `float64`.",
            "Aliases: `byte` means `uint8`; `rune` means `int32` and represents a Unicode code point.",
            "Complex numbers: `complex64`, `complex128`. They exist for specialized numeric work and can wait until you actually need them.",
            "Use an exact-sized type when a protocol, file format, database column, or numeric range requires it; otherwise prefer `int` or `float64`.",
          ],
        },
        {
          type: "note",
          note: {
            tone: "info",
            title: "Constants follow a different rule",
            text: "A `const` value is fixed and computable at compile time. A plain constant such as `42` starts untyped: it can become an `int`, `float64`, or another numeric type when used, as long as the value fits. With no target type, an integer defaults to `int`, a decimal to `float64`, text to `string`, and a boolean to `bool`.",
          },
        },
        {
          type: "diagram",
          diagram: {
            title: "How an untyped constant gets a type",
            kind: "flow",
            nodes: [
              { id: "lit", label: "literal 42", detail: "untyped constant" },
              { id: "ctx", label: "used where?", detail: "assigned / passed / :=" },
              {
                id: "fit",
                label: "does it fit?",
                detail: "range checked at compile time",
                tone: "accent",
              },
              {
                id: "typed",
                label: "typed value",
                detail: "int, float64, byte, …",
                tone: "success",
              },
            ],
            caption:
              "If the context gives no type, the constant falls back to its default type (int for 42).",
          },
        },
        {
          type: "example",
          example: {
            title: "Zero values and fit-checking",
            language: "go",
            code: 'var count int      // 0\nvar label string   // "" (empty string)\nvar ok bool        // false\nvar ratio float64  // 0\n\nvar small uint8 = 255 // ok\n// var big uint8 = 256 // compile error: constant 256 overflows uint8',
            takeaway:
              "Zero values are guaranteed, and a constant that can't fit its target is rejected before the program ever runs.",
          },
        },
        {
          type: "example",
          example: {
            title: "iota numbers related constants",
            language: "go",
            code: "const (\n    StatusPending = iota // 0\n    StatusReady          // 1\n    StatusDone           // 2\n)",
            takeaway:
              "iota advances once per line inside this const block. It creates constants at compile time; it is not a counter that changes while the program runs.",
          },
        },
        {
          type: "points",
          items: [
            "Use `:=` for obvious local values; use `var x T` when the explicit type or its zero value matters.",
            "An inferred variable still has a fixed type and cannot later hold a different kind of value.",
            "A constant adopts the surrounding type when it fits; otherwise the compiler rejects it.",
            "A constant that doesn't fit its target type is a compile-time error, not a runtime surprise.",
          ],
        },
      ],
    },
    diagram: {
      title: "Zero values at a glance",
      body: "Let's picture what a variable actually is: a labelled box with a type and a current value. The moment you declare it, the box exists and holds the zero value — even before you assign anything. Select a box below to see its type, its zero value, and what it can hold.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Declared variables and their zero values",
            kind: "stack",
            nodes: [
              { id: "int", label: "var count int", detail: "zero value: 0" },
              { id: "float", label: "var ratio float64", detail: "zero value: 0" },
              {
                id: "string",
                label: "var name string",
                detail: 'zero value: "" (empty)',
                tone: "accent",
              },
              { id: "bool", label: "var active bool", detail: "zero value: false" },
            ],
            caption:
              "No initializer needed — declaring a variable already fills its box with the type's zero value.",
          },
        },
      ],
    },
    implementation: {
      title: "Converting between number types",
      body: "In practice you'll spend most of your effort on two moves: declaring variables (often letting Go infer the obvious type) and converting between numeric types on purpose. Conversion uses the syntax `T(value)` — the type name followed by the value in parentheses. This is the explicit request Go requires before it will treat one number type as another.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Explicit conversion, done on purpose",
            language: "go",
            code: 'package main\n\nimport "fmt"\n\nfunc main() {\n    var count int = 3\n    var rate float64 = 1.5\n\n    total := float64(count) * rate // convert count first\n    fmt.Println(total)             // 4.5\n\n    cents := int64(count) * 100    // int -> int64 on purpose\n    fmt.Println(cents)             // 300\n}',
            takeaway:
              "`float64(count)` and `int64(count)` are you telling Go exactly which type to use. Nothing is converted behind your back.",
          },
        },
        {
          type: "points",
          items: [
            "Convert with `T(value)`: `float64(count)`, `int64(x)`, `int(f)`.",
            "Converting a float to an int truncates toward zero (drops the fraction) — it does not round.",
            "Untyped constants like `100` need no conversion; they adapt to the surrounding type.",
          ],
        },
      ],
    },
    experiment: {
      title: "When integer division happens",
      body: "Before reading on, commit to a prediction — a corrected wrong guess teaches more than a right answer you skimmed. Consider this code:\n\n`const c = 10` then `var x float64 = c / 4`.\n\nWill `x` be `2` or `2.5`? Decide now, then reveal.\n\nThe answer is **2** — and it surprises almost everyone. Both `c` and `4` are *untyped integer* constants, so `c / 4` is computed first, as **integer constant arithmetic**: `10 / 4` truncates to `2`. Only then does that finished result become a `float64`. The target type converts the answer; it does not reach inside the expression and change how the division ran.\n\nTo keep the fraction, put a float in the expression: `var x float64 = c / 4.0` gives `2.5`, because one float-kind operand promotes the whole constant division to floating-point. That's the precise sense in which untyped constants 'bend to context': each constant adapts to where it's *used* — but an all-integer expression still does integer math.",
    },
    "failure-cases": {
      title: "Common type and conversion mistakes",
      body: "Most type bugs at this level come from a handful of recurring mistakes. Here are the ones you'll actually meet, and the signal each gives you.",
      blocks: [
        {
          type: "points",
          items: [
            "**Mixing types in one expression** → compile error `mismatched types`. Convert one side explicitly.",
            "**float64 for money** → slow rounding drift that never reconciles. Use integer cents.",
            "**Constant overflow** → `constant N overflows T` at compile time. The value doesn't fit the target.",
            "**Expecting rounding on float→int** → `int(2.9)` is `2`, not `3`; conversion truncates.",
            '**Assuming a variable is nil/undefined** → it\'s actually the zero value; `""` and `0` are real, usable values.',
          ],
        },
        {
          type: "example",
          example: {
            title: "Truncation, not rounding",
            language: "go",
            code: "fmt.Println(int(2.9))  // 2, not 3\nfmt.Println(int(-2.9)) // -2  (toward zero)",
            takeaway:
              "Converting a float to an int throws the fraction away. If you want rounding, use math.Round first.",
          },
        },
      ],
    },
    "trade-offs": {
      title: "Choosing the right number type",
      body: "Type choices come with costs, and the right answer depends on what you're modelling. The goal is a choice you can defend, plus the evidence that would change your mind.",
      blocks: [
        {
          type: "points",
          items: [
            "**int vs int64**: `int` is simplest and machine-sized; pick `int64` when a value must be exactly 64 bits (database columns, wire formats).",
            "**float64 vs integer cents**: floats are convenient for measurements but wrong for money; integers stay exact but you track the unit yourself.",
            "**string vs numeric IDs**: strings are opaque and flexible; numeric IDs are compact and sortable but tempt you into meaningless arithmetic.",
            "**Explicit conversions everywhere**: more typing, but every type change is visible and intentional — no silent surprises.",
          ],
        },
      ],
    },
    design: {
      title: "Practical type choices",
      body: "Turn the rules into durable habits. Inside a function, use `:=` when the initializer makes the type obvious; use `var x T` when the zero value or explicit type matters. At package level, use `var` because `:=` is not allowed. Default to the plain types (`int`, `string`, `bool`) and only reach for sized variants when a real constraint demands it. Keep every numeric conversion explicit.",
      blocks: [
        {
          type: "points",
          items: [
            "Use `:=` for obvious local initialization; use `var` for package variables and intentional zero values.",
            "Prefer `int`, `string`, `bool`; justify any sized type.",
            "Money is integer cents (or a decimal type) — never float64.",
            "Design so the zero value is a valid, usable default.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "A struct that's safe before it's filled",
            context:
              "A new Account is created with no fields set yet. Its balance-in-cents is int64, so it starts at 0 — an accurate empty balance.",
            insight:
              "Because the zero value is meaningful, you don't need special 'uninitialized' handling. The type does that work for you.",
          },
        },
      ],
    },
    mastery: {
      title: "What you should be able to do",
      body: "You've mastered this lesson when you can recognize the basic type families, predict an inferred variable type, explain what an untyped constant is and when it gets a type, predict any basic type's zero value, and write correct explicit conversions.",
    },
    summary: {
      title: "Types, constants & zero values: recap",
      body: "Three ideas carry this lesson: **a variable's type may be written or inferred**, **a declaration without an initializer uses the zero value**, and **an untyped constant gets a type from its context**.",
      blocks: [
        {
          type: "points",
          items: [
            '`var name = "myo"` and `name := "myo"` infer `string`; the type remains fixed.',
            "Go's basic families are booleans, strings, integers, floats, and complex numbers; byte and rune are integer aliases.",
            'Zero values: `0`, `""`, `false` — always defined, never garbage.',
            "Untyped constants adopt the type of the context they're used in (or their default type).",
            "Go never converts numeric types implicitly — write `T(value)`.",
            "Money is integer cents, not float64.",
            "Next: use these values as function inputs and results.",
          ],
        },
      ],
    },
  },
};
