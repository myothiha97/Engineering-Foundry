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
    "Learn Go's numeric, string, and boolean types, the value every variable starts with, and the constant rules that stop whole classes of bugs.",
  moduleId: "go-1",
  estimatedMinutes: 55,
  difficulty: "beginner",
  prerequisites: ["go-source-to-process"],
  learningObjectives: [
    "Predict the zero value of any basic type without running the code",
    "Explain how an untyped constant chooses a type when it meets a variable",
    "Convert between numeric types explicitly and say why Go refuses to do it for you",
  ],
  concepts: ["types", "untyped-constants", "zero-values", "conversions"],
  ledgerFlowApplications: [
    "Choose int64 cents (never float64) to represent money exactly",
    "Model account and transaction identifiers with a purpose-built string or int type",
    "Rely on zero values so a freshly created record starts in a known, safe state",
  ],
  references: [
    {
      title: "A Tour of Go: Basics",
      url: "https://go.dev/tour/basics",
      teaches: "The basic types, variable declarations, zero values, and type conversions with runnable examples.",
      relevance: "The gentlest official walkthrough of exactly the material in this lesson.",
      required: true,
      section: "Basic types; Zero values; Type conversions",
    },
    {
      title: "Constants — The Go Blog",
      url: "https://go.dev/blog/constants",
      teaches: "Why Go has untyped constants and how they take on a type only when used.",
      relevance: "The authoritative explanation behind the untyped-constant stages of this lesson.",
      required: true,
      section: "The concept of untyped constants; Default type",
    },
    {
      title: "The Go Programming Language Specification: The zero value",
      url: "https://go.dev/ref/spec#The_zero_value",
      teaches: "The normative rule that every variable is initialized to its type's zero value.",
      relevance: "Confirms zero values are a language guarantee, not an accident of the compiler.",
      required: false,
      section: "The zero value; Constants",
    },
  ],
  exercises: [
    {
      id: "go1bt-predict-zero",
      type: "prediction",
      prompt:
        "Given `var count int`, `var name string`, `var active bool`, and `var ratio float64`, predict what each prints with fmt.Println before running it.",
      expectedAnswer: "0, \"\" (an empty line), false, 0",
      hints: ["No initializer means the zero value.", "The zero value of a string is the empty string, not nil."],
    },
    {
      id: "go1bt-read-constant",
      type: "code-reading",
      prompt:
        "Read `const big = 1 << 40` followed by `var n int32 = big`. Explain whether this compiles, and what determines the answer.",
      hints: ["Untyped constants are checked against the target type when assigned.", "How many bits does int32 hold?"],
    },
    {
      id: "go1bt-implement-cents",
      type: "implementation",
      prompt:
        "Implement toCents so it converts a whole-dollar int amount into an int64 number of cents.",
      starterCode:
        'package main\n\nimport "fmt"\n\nfunc toCents(dollars int) int64 {\n  // return the amount expressed in cents\n  return 0\n}\n\nfunc main() { fmt.Println(toCents(3)) } // want: 300',
      expectedAnswer: "func toCents(dollars int) int64 { return int64(dollars) * 100 }",
      hints: ["int and int64 are different types — convert explicitly.", "100 is an untyped constant, so it adapts to int64 for free."],
    },
    {
      id: "go1bt-debug-conversion",
      type: "debugging",
      prompt:
        "This does not compile: `var a int = 5` then `var b float64 = a * 2`. Explain the error and fix it without changing a's type.",
      hints: ["Go never mixes numeric types in one expression implicitly.", "Wrap a in a conversion: float64(a)."],
    },
    {
      id: "go1bt-refactor-money",
      type: "refactoring",
      prompt:
        "A balance is stored as `var balance float64`. Refactor the type and any arithmetic so money is represented exactly, and explain what breaks if you leave it as float64.",
      hints: ["Integer cents avoid binary-fraction rounding.", "0.1 + 0.2 is not exactly 0.3 in float64."],
    },
    {
      id: "go1bt-design-id",
      type: "design",
      prompt:
        "Choose a base type for a LedgerFlow account identifier (numeric counter vs opaque string) and state what evidence would make you switch.",
      hints: ["Do you ever do arithmetic on an ID?", "Will IDs come from an external system or database sequence?"],
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
      id: "explain-untyped",
      kind: "explain",
      description: "Explain in plain words what an untyped constant is and when it acquires a type.",
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
      description: "Write code that converts between numeric types explicitly and compiles cleanly.",
      required: true,
    },
    {
      id: "design-money-type",
      kind: "design",
      description: "Defend a base-type choice for money and identifiers in LedgerFlow.",
      required: false,
    },
  ],
  sections: {
    problem: {
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
    naive: {
      body: "Here's the model many newcomers bring: 'a number is a number, and Go will convert whenever it needs to.' So they write an `int` next to a `float64` and expect it to work.\n\nIt doesn't compile. Go treats `int`, `int64`, and `float64` as genuinely different types, and it will never mix them in an expression without you asking. The second wrong assumption is subtler: people think a variable with no value is somehow 'empty' or 'undefined' the way it is in JavaScript. In Go there is no undefined — an uninitialized variable already holds a well-defined **zero value**.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Mixing number types is a compile error",
            language: "go",
            code: 'var count int = 3\nvar rate float64 = 1.5\n\n// total := count * rate  // does NOT compile:\n// invalid operation: mismatched types int and float64',
            takeaway: "int and float64 are separate types. Go stops here rather than guessing how to combine them.",
          },
        },
        {
          type: "points",
          items: [
            "There is no implicit numeric conversion — not even int → int64.",
            "There is no 'undefined': a declared variable always has a value.",
          ],
        },
      ],
    },
    failure: {
      body: "The most expensive version of this mistake is money. It's tempting to store a price as `float64` because prices have decimal points. But `float64` stores numbers in binary fractions, and most decimal amounts — like 0.10 — cannot be represented exactly. The tiny errors are invisible in one calculation and disastrous after thousands.\n\nThis is not a Go quirk; it's how floating-point works everywhere. The failure is choosing the wrong base type for the job. The fix is to pick a type that represents your values *exactly*, which for money means whole units — cents as an integer.",
      blocks: [
        {
          type: "example",
          example: {
            title: "float64 cannot hold 0.10 exactly",
            language: "go",
            code: 'fmt.Printf("%.17f\\n", 0.1+0.2)\n// prints: 0.30000000000000004\n// not 0.30000000000000000',
            takeaway: "Adding money as float64 accumulates rounding error. A ledger built on this will slowly disagree with itself.",
          },
        },
        {
          type: "scenario",
          scenario: {
            title: "The balance that drifts",
            context:
              "A wallet stores its balance as float64 and adds many small transactions. After a few thousand entries the displayed total is off by a cent, and it never reconciles against the bank statement.",
            insight: "No single line is 'wrong' — the base type simply can't represent the values exactly. Integer cents would have stayed exact.",
          },
        },
      ],
    },
    intuition: {
      body: "Let's replace the guesswork with a simple picture. Go's basic types fall into a few families, and you mostly reach for one obvious member of each.\n\nFor whole numbers use `int` (Go's default integer, sized to the machine). For amounts that truly need a fraction, like a physics measurement, use `float64`. For text use `string`. For yes/no use `bool`. Everything else — `int32`, `uint8`, `float32` — is a specialized variant you choose only when you have a specific reason, such as matching a fixed storage size.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "The families of basic types",
            kind: "compare",
            nodes: [
              { id: "ints", label: "Integers", detail: "int (default), int8/16/32/64, uint... — whole numbers" },
              { id: "floats", label: "Floating point", detail: "float64 (default), float32 — fractional numbers" },
              { id: "strings", label: "Strings", detail: "string — immutable UTF-8 text" },
              { id: "bools", label: "Booleans", detail: "bool — true or false", tone: "accent" },
            ],
          },
        },
        {
          type: "points",
          items: [
            "Reach for `int`, `float64`, `string`, `bool` by default.",
            "Sized types (`int32`, `uint8`, …) are for specific storage or protocol needs.",
            "For money, prefer an integer count of the smallest unit (cents) — not a float.",
          ],
        },
      ],
    },
    "mental-model": {
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
          type: "example",
          example: {
            title: "One constant, several types",
            language: "go",
            code: 'const answer = 42     // untyped: no type yet\n\nvar i int = answer     // becomes int\nvar f float64 = answer // becomes float64\nvar b byte = answer    // becomes byte (uint8) — fits in 0..255',
            takeaway: "The single constant 42 takes on a different type at each use. A typed variable could not do this.",
          },
        },
      ],
    },
    mechanics: {
      body: "Now the precise rules. When you write `var x int`, Go reserves storage and sets it to the zero value; declaring and leaving it is completely safe. When you write a literal, it is an **untyped constant** carrying a *default type* (integers default to `int`, floats to `float64`, text to `string`, `true`/`false` to `bool`). The default type is used only when the context can't tell Go what to make it — for example `x := 42` gives `x` the type `int`.\n\nWhen an untyped constant is assigned to a typed variable, Go checks it *fits* that type. `var b uint8 = 255` is fine; `var b uint8 = 256` is a compile-time error, because 256 doesn't fit in 8 bits. This checking happens while compiling, so overflow bugs of this kind can't reach runtime.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "How an untyped constant gets a type",
            kind: "flow",
            nodes: [
              { id: "lit", label: "literal 42", detail: "untyped constant" },
              { id: "ctx", label: "used where?", detail: "assigned / passed / :=" },
              { id: "fit", label: "does it fit?", detail: "range checked at compile time", tone: "accent" },
              { id: "typed", label: "typed value", detail: "int, float64, byte, …", tone: "success" },
            ],
            caption: "If the context gives no type, the constant falls back to its default type (int for 42).",
          },
        },
        {
          type: "example",
          example: {
            title: "Zero values and fit-checking",
            language: "go",
            code: 'var count int      // 0\nvar label string   // "" (empty string)\nvar ok bool        // false\nvar ratio float64  // 0\n\nvar small uint8 = 255 // ok\n// var big uint8 = 256 // compile error: constant 256 overflows uint8',
            takeaway: "Zero values are guaranteed, and a constant that can't fit its target is rejected before the program ever runs.",
          },
        },
        {
          type: "points",
          items: [
            "Default types: integer → `int`, floating → `float64`, text → `string`, boolean → `bool`.",
            "`:=` uses the constant's default type (`n := 42` makes `n` an `int`).",
            "A constant that doesn't fit its target type is a compile-time error, not a runtime surprise.",
          ],
        },
      ],
    },
    diagram: {
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
              { id: "string", label: "var name string", detail: "zero value: \"\" (empty)", tone: "accent" },
              { id: "bool", label: "var active bool", detail: "zero value: false" },
            ],
            caption: "No initializer needed — declaring a variable already fills its box with the type's zero value.",
          },
        },
      ],
    },
    implementation: {
      body: "In practice you'll spend most of your effort on two moves: declaring variables (and leaning on their zero values) and converting between numeric types on purpose. Conversion uses the syntax `T(value)` — the type name followed by the value in parentheses. This is the explicit request Go requires before it will treat one number type as another.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Explicit conversion, done on purpose",
            language: "go",
            code: 'package main\n\nimport "fmt"\n\nfunc main() {\n    var count int = 3\n    var rate float64 = 1.5\n\n    total := float64(count) * rate // convert count first\n    fmt.Println(total)             // 4.5\n\n    cents := int64(count) * 100    // int -> int64 on purpose\n    fmt.Println(cents)             // 300\n}',
            takeaway: "`float64(count)` and `int64(count)` are you telling Go exactly which type to use. Nothing is converted behind your back.",
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
      body: "Before reading on, commit to a prediction — a corrected wrong guess teaches more than a right answer you skimmed. Consider this code:\n\n`const c = 10` then `var x float64 = c / 4`.\n\nWill `x` be `2` or `2.5`? Decide now, then reveal.\n\nThe answer is **2.5**. Because `c` is an *untyped* constant and the target is `float64`, the whole expression `c / 4` is computed as floating-point, giving `2.5`. Now change it to `var y int = c / 4`: here the division happens in integer arithmetic, so `y` is `2` (the fraction is dropped). Same literals, different result — because the *type they resolve to* decides whether the division keeps its fraction. That is the entire point of untyped constants: they bend to their context.",
    },
    "failure-cases": {
      body: "Most type bugs at this level come from a handful of recurring mistakes. Here are the ones you'll actually meet, and the signal each gives you.",
      blocks: [
        {
          type: "points",
          items: [
            "**Mixing types in one expression** → compile error `mismatched types`. Convert one side explicitly.",
            "**float64 for money** → slow rounding drift that never reconciles. Use integer cents.",
            "**Constant overflow** → `constant N overflows T` at compile time. The value doesn't fit the target.",
            "**Expecting rounding on float→int** → `int(2.9)` is `2`, not `3`; conversion truncates.",
            "**Assuming a variable is nil/undefined** → it's actually the zero value; `\"\"` and `0` are real, usable values.",
          ],
        },
        {
          type: "example",
          example: {
            title: "Truncation, not rounding",
            language: "go",
            code: 'fmt.Println(int(2.9))  // 2, not 3\nfmt.Println(int(-2.9)) // -2  (toward zero)',
            takeaway: "Converting a float to an int throws the fraction away. If you want rounding, use math.Round first.",
          },
        },
      ],
    },
    "trade-offs": {
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
      body: "Turn the rules into durable habits. Default to the plain types (`int`, `string`, `bool`) and only reach for sized variants when a real constraint demands it. Represent money as an integer count of the smallest unit, never `float64`. Lean on zero values so a freshly declared value is already in a safe, known state. And keep every numeric conversion explicit so the reader can see exactly where a type changes.",
      blocks: [
        {
          type: "points",
          items: [
            "Prefer `int`, `string`, `bool`; justify any sized type.",
            "Money is integer cents (or a decimal type) — never float64.",
            "Design so the zero value is a valid, usable default.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "A struct that's safe before it's filled",
            context: "A new Account is created with no fields set yet. Its balance-in-cents is int64, so it starts at 0 — an accurate empty balance.",
            insight: "Because the zero value is meaningful, you don't need special 'uninitialized' handling. The type does that work for you.",
          },
        },
      ],
    },
    ledgerflow: {
      body: "Here's the whole lesson applied to the project you'll build. LedgerFlow tracks money, so its most important type decision is how to represent an amount. It stores every amount as an `int64` number of **cents**, so arithmetic is exact and totals always reconcile. Identifiers are kept as their own string-based type so no one can accidentally add two account IDs together. And because Go guarantees zero values, a newly created transaction starts with an amount of `0` and an empty description — a safe, predictable starting point.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Money as exact integer cents",
            language: "go",
            code: 'type AccountID string       // opaque: no arithmetic on IDs\n\ntype Transaction struct {\n    ID       AccountID\n    AmountC  int64  // amount in cents, exact\n    Note     string // zero value "" is fine\n}\n\n// $12.34 is stored as:\nvar t Transaction\nt.AmountC = 1234 // twelve dollars and thirty-four cents',
            takeaway: "Cents-as-int64 keeps every balance exact; a distinct ID type stops meaningless math on identifiers.",
          },
        },
        {
          type: "points",
          items: ["Amounts: `int64` cents, exact and reconcilable.", "IDs: a named string type, never arithmetic.", "New records rely on zero values for a safe initial state."],
        },
      ],
    },
    exercises: {
      body: "Practice is what turns 'I recognize this' into 'I can predict and build this'. Work across prediction, code-reading, implementation, debugging, refactoring, and design — each produces a different kind of evidence, so finishing one doesn't cover the rest.",
    },
    mastery: {
      body: "You've mastered this lesson when you can do four things without notes: explain what an untyped constant is and when it gets a type, predict any basic type's zero value, write correct explicit conversions, and defend a base-type choice for money and IDs. Check a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "Two ideas carry this whole lesson: **variables start at their zero value**, and **untyped constants have no type until they're used**. Keep those straight and Go's number rules stop feeling strict and start feeling predictable.",
      blocks: [
        {
          type: "points",
          items: [
            "Zero values: `0`, `\"\"`, `false` — always defined, never garbage.",
            "Untyped constants adopt the type of the context they're used in (or their default type).",
            "Go never converts numeric types implicitly — write `T(value)`.",
            "Money is integer cents, not float64.",
            "Next up: composite values and how Go copies them.",
          ],
        },
      ],
    },
  },
};
