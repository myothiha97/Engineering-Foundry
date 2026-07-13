import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 8 — reflection. Same beginner-friendly voice as the earlier modules:
 * plain language, one analogy per hard idea, a concrete example before the
 * abstract rule. Correct and careful about what reflection is (runtime type
 * inspection), the reflect core (TypeOf/ValueOf, Type vs Kind, struct tags,
 * settability), Rob Pike's three laws, and — above all — the discipline of
 * reaching for interfaces/generics/codegen FIRST. Ties directly to the two
 * prerequisites: interfaces store a (type, value) pair that reflection reads,
 * and encoding/json is the canonical library that walks fields reflectively
 * and honours `json:"..."` tags.
 */
export const goReflection: Lesson = {
  id: "go-reflection",
  slug: "reflection",
  title: "Reflection",
  description:
    "Inspect and manipulate types and values at runtime with the `reflect` package — how `encoding/json` uses it to read struct tags and marshal a value — while understanding why you should reach for interfaces, generics, or code generation first.",
  moduleId: "go-8",
  estimatedMinutes: 50,
  difficulty: "advanced",
  prerequisites: ["go-interfaces", "go-json"],
  learningObjectives: [
    "Explain what reflection is — inspecting and changing types and values at runtime — and connect it to the (type, value) pair an interface already stores",
    "Use the reflect core correctly: `reflect.TypeOf`, `reflect.ValueOf`, the difference between Kind and Type, and reading struct tags with `field.Tag.Get(\"json\")`",
    "State the settability rule (you can only Set through a pointer's `.Elem()`) and predict the classic panic when you call SetX on an unaddressable Value",
    "Decide when reflection is justified (codecs, ORMs, validators) versus when interfaces, generics, or code generation are the better tool",
  ],
  concepts: ["reflect", "type-info", "struct-tags"],
  ledgerFlowApplications: [
    "Understand how `encoding/json` reflects over a Transaction's fields and honours each `json:\"...\"` tag when marshalling it to the API response",
    "Recognize when a tiny bit of reflection is justified in ledger tooling (a one-off CSV-export helper driven by struct tags) and when a plain method or generics is clearer",
    "Avoid reflection on the hot transaction-write path, where its runtime cost and lost type safety are not worth paying",
  ],
  references: [
    {
      title: "The Laws of Reflection",
      url: "https://go.dev/blog/laws-of-reflection",
      teaches:
        "Rob Pike's three laws: reflection goes from an interface value to a reflection object and back, and a reflect.Value can only be modified if it is settable.",
      relevance:
        "The definitive mental model for this whole lesson — how the (type, value) pair flows into reflect and back out.",
      required: true,
      section: "Laws of reflection",
    },
    {
      title: "reflect package documentation",
      url: "https://pkg.go.dev/reflect",
      teaches:
        "The API surface: Type and Value, TypeOf and ValueOf, Kind, Field, Tag.Get, Elem, and the settability rules.",
      relevance:
        "The reference for every function this lesson uses, including which calls panic and why.",
      required: true,
      section: "reflect package",
    },
    {
      title: "encoding/json package documentation",
      url: "https://pkg.go.dev/encoding/json",
      teaches:
        "How Marshal and Unmarshal use reflection to walk fields and how the `json:\"name,omitempty\"` struct tag drives encoding.",
      relevance:
        "The canonical real-world consumer of reflection + tags, and the go-json prerequisite made concrete.",
      required: true,
      section: "encoding/json",
    },
    {
      title: "JSON and Go",
      url: "https://go.dev/blog/json",
      teaches:
        "A worked walk-through of marshalling and unmarshalling Go structs, and how field names and tags map to JSON keys.",
      relevance:
        "Shows the tag-driven encoding from the user's side, complementing the reflect-side view in this lesson.",
      required: false,
      section: "JSON and Go",
    },
  ],
  exercises: [
    {
      id: "go8rf-predict-kind-type",
      type: "prediction",
      prompt:
        "For `type Celsius float64; var c Celsius = 21`, predict what `reflect.TypeOf(c)` and `reflect.TypeOf(c).Kind()` each report. Explain the difference between the two answers.",
      expectedAnswer:
        "`TypeOf(c)` reports the named type `main.Celsius`; `Kind()` reports `float64`. Type is the specific declared type; Kind is the underlying category the type is built from — many distinct types can share one Kind.",
      hints: [
        "Type is the exact declared type; Kind is the underlying base category (Int, Float64, Struct, Slice, Ptr, ...).",
        "A named type keeps its own Type identity but inherits the Kind of what it is defined from.",
      ],
    },
    {
      id: "go8rf-read-interface-pair",
      type: "code-reading",
      prompt:
        "Read `var w io.Writer = os.Stdout; t := reflect.TypeOf(w)`. Explain, in terms of the (type, value) pair an interface stores, what `t` ends up being and why it is the concrete type rather than the interface type.",
      hints: [
        "An interface value holds two things: the concrete type stored in it and the value itself.",
        "`reflect.TypeOf` takes an `interface{}` and reads the concrete type out of that pair — the static interface type is not what survives.",
      ],
    },
    {
      id: "go8rf-implement-walk-fields",
      type: "implementation",
      prompt:
        "Implement `describe(v any)` that, for a struct value, prints each field's name, its `json` struct tag, and its value using reflection. For example, for a struct with fields `ID int` and `Note string \\`json:\"note,omitempty\"\\`` it should print one line per field. Use `reflect.TypeOf`/`reflect.ValueOf` and `field.Tag.Get(\"json\")`.",
      starterCode:
        'package main\n\nimport (\n  "fmt"\n  "reflect"\n)\n\ntype Transaction struct {\n  ID   int    `json:"id"`\n  Note string `json:"note,omitempty"`\n}\n\nfunc describe(v any) {\n  // TODO: walk the struct fields and print name, json tag, and value\n}\n\nfunc main() {\n  describe(Transaction{ID: 7, Note: "coffee"})\n}',
      expectedAnswer:
        'package main\n\nimport (\n  "fmt"\n  "reflect"\n)\n\ntype Transaction struct {\n  ID   int    `json:"id"`\n  Note string `json:"note,omitempty"`\n}\n\nfunc describe(v any) {\n  t := reflect.TypeOf(v)\n  val := reflect.ValueOf(v)\n  if t.Kind() != reflect.Struct {\n    fmt.Println("not a struct")\n    return\n  }\n  for i := 0; i < t.NumField(); i++ {\n    field := t.Field(i)\n    tag := field.Tag.Get("json")\n    fmt.Printf("%s tag=%q value=%v\\n", field.Name, tag, val.Field(i))\n  }\n}\n\nfunc main() {\n  describe(Transaction{ID: 7, Note: "coffee"})\n}\n// ID tag="id" value=7\n// Note tag="note,omitempty" value=coffee',
      hints: [
        "Get the Type with `reflect.TypeOf(v)` and the Value with `reflect.ValueOf(v)`; loop `i` from 0 to `t.NumField()`.",
        "`t.Field(i)` gives a StructField (with `.Name` and `.Tag`); read the tag with `field.Tag.Get(\"json\")` and the value with `val.Field(i)`.",
      ],
    },
    {
      id: "go8rf-debug-settability",
      type: "debugging",
      prompt:
        "This code panics with \"reflect: reflect.Value.SetString using unaddressable value\". Explain why, and fix it so the string is actually changed.\n\n```\nname := \"old\"\nv := reflect.ValueOf(name)\nv.SetString(\"new\")\n```",
      starterCode:
        'package main\n\nimport (\n  "fmt"\n  "reflect"\n)\n\nfunc main() {\n  name := "old"\n  v := reflect.ValueOf(name)\n  v.SetString("new") // panics: unaddressable value\n  fmt.Println(name)\n}',
      expectedAnswer:
        'package main\n\nimport (\n  "fmt"\n  "reflect"\n)\n\nfunc main() {\n  name := "old"\n  v := reflect.ValueOf(&name).Elem() // Elem() of a pointer is addressable and settable\n  v.SetString("new")\n  fmt.Println(name) // new\n}\n// Why: reflect.ValueOf(name) copies the value, so the Value is unaddressable\n// and Set panics. Pass a pointer and take .Elem() to get a settable Value.',
      hints: [
        "`reflect.ValueOf(x)` makes a copy — there is nothing addressable behind it, so it cannot be set.",
        "Pass `&name` and call `.Elem()` to reach the addressable value the pointer points at; that Value is settable.",
      ],
    },
    {
      id: "go8rf-read-omitempty",
      type: "code-reading",
      prompt:
        "Given `type T struct { Name string `json:\"name,omitempty\"`; Age int `json:\"-\"` }` and a zero value `T{}`, describe what `json.Marshal` produces and explain how reflection and the tags produce that result.",
      hints: [
        "Marshal reflects over each field, reads its json tag, and decides the key name and whether to include it.",
        "`omitempty` drops a field that holds its zero value; a tag of `-` means never encode the field at all.",
      ],
    },
    {
      id: "go8rf-design-vs-generics",
      type: "design",
      prompt:
        "You need a function that sums a numeric field across a slice of records for three different struct types. Compare three approaches — reflection, generics, and code generation — and recommend one, justifying it on type safety, performance, and maintainability.",
      hints: [
        "Reflection is flexible but loses compile-time checks and is slow; generics keep type safety and speed but need the types to share a shape; codegen produces plain fast code at the cost of a build step.",
        "If the field can be expressed through an interface or a type parameter, prefer generics — Go 1.18+ removed many former reflection use-cases.",
      ],
    },
    {
      id: "go8rf-advanced-three-laws",
      type: "advanced",
      prompt:
        "State Rob Pike's three laws of reflection in your own words and use them to explain the full round trip: a concrete value goes into `reflect.ValueOf`, you read its Type and fields, and you get back a usable value — noting exactly where settability enters.",
      hints: [
        "Law 1: reflection goes from an interface value to a reflection object. Law 2: it can go back from a reflection object to an interface value.",
        "Law 3: to modify a reflection object it must be settable — which is why you need a pointer's .Elem(), not a plain ValueOf.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-type-value-pair",
      kind: "explain",
      description:
        "Explain what reflection is and how it reads the (type, value) pair an interface stores, including the difference between Type and Kind.",
      required: true,
    },
    {
      id: "predict-settability-panic",
      kind: "predict",
      description:
        "Predict when a reflect Set call will panic for an unaddressable value, and state the pointer/.Elem() fix.",
      required: true,
    },
    {
      id: "implement-tag-walk",
      kind: "implement",
      description:
        "Write reflection code that walks a struct's fields and reads each field's name, `json` tag, and value.",
      required: true,
    },
    {
      id: "design-reflection-vs-alternatives",
      kind: "design",
      description:
        "Choose between reflection, generics, and code generation for a task and defend the choice on type safety, speed, and maintainability.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "Almost all the Go you've written so far is *statically typed*: the compiler knows every type at build time, checks that you use it correctly, and picks the right code to run. That's exactly what you want — mistakes turn into compile errors, not surprises at 3am.\n\nBut some code has to work with types it has never seen. Think about `json.Marshal`: it can turn *any* struct into JSON, including structs that didn't exist when the `encoding/json` package was written. It can't have been compiled against your `Transaction` type. So how does it look inside a value it knows nothing about, find the field names, read the `json:\"...\"` tags, and build the output? The answer is **reflection**: the ability to inspect and manipulate types and values at *runtime*, after compilation, when the concrete type is finally known.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "Normal typed code is like a factory line built for one specific product — fast, but it only handles that product. Reflection is a worker who receives an unlabelled box, opens it, reads what's inside, and figures out what to do on the spot. Far more flexible, much slower, and easy to get wrong — you gave up the guarantees the factory line had.",
          },
        },
        {
          type: "points",
          items: [
            "**Reflection** = inspecting and manipulating types and values at *runtime*, not compile time.",
            "It exists because some code (codecs, ORMs, validators) must handle types it was never compiled against.",
            "`json.Marshal(anyStruct)` is the everyday example — it reflects over fields and tags it has never seen.",
          ],
        },
      ],
    },
    naive: {
      body: "Before reflection, the natural instinct is to reach for the empty interface. You accept `any` (an alias for `interface{}`), and then... you're stuck. An `any` can hold a value of any type, but with only the interface in hand you can't loop over a struct's fields or read a tag — the language gives you no syntax for \"list the fields of whatever this is.\"\n\nThe other naive move is the opposite extreme: write a separate marshalling function for every struct by hand. That works, but it doesn't scale — every new type needs new code, and a general library like `encoding/json` couldn't be written that way at all. Reflection is what bridges the gap: it lets you open up an `any` at runtime and discover its structure.",
      blocks: [
        {
          type: "example",
          example: {
            title: "An `any` alone can't reveal its fields",
            language: "go",
            code:
              'func printFields(v any) {\n    // v holds a struct... but there is no built-in syntax to list\n    // its fields or read its struct tags from here. A type switch\n    // only helps if you already know every possible type:\n    switch x := v.(type) {\n    case Transaction:\n        fmt.Println(x.ID) // only works for types you enumerate by hand\n    }\n}',
            takeaway:
              "The empty interface can *carry* any value, but plain Go gives you no way to walk an unknown struct's fields. That is precisely the gap reflection fills.",
          },
        },
        {
          type: "points",
          items: [
            "`any`/`interface{}` can hold any value but offers no built-in way to enumerate fields or tags.",
            "Hand-writing a function per type doesn't scale and can't power a general library.",
          ],
        },
      ],
    },
    failure: {
      body: "So people reach for reflection — and often reach for it too early, or misuse it. Reflection *feels* like a superpower: suddenly you can inspect anything. But it comes with two costs that don't show up until runtime, which is the worst time to discover them.\n\nFirst, it **defeats the type checker**. Code that would have been a compile error becomes a runtime panic — a wrong field name, a wrong Kind, a Set on something you can't set. Second, it is **slow**: because the type isn't known until runtime, there's no compile-time dispatch, so every operation does bookkeeping the compiler would otherwise have eliminated. Used on a hot path, or used where a plain method or generics would do, reflection quietly makes code both more fragile and slower.",
      blocks: [
        {
          type: "scenario",
          scenario: {
            title: "The validator that panics only in production",
            context:
              "A team writes a \"generic\" validator using reflection to read `validate:\"required\"` tags. It works on every struct they test. Months later a new struct is passed by pointer instead of by value; the reflection code assumes a struct Kind, calls a method that isn't there, and panics on a live request.",
            insight:
              "The compiler could never help, because the type wasn't known until runtime. A bug that would have been a red squiggle in typed code became a production panic. Reflection trades compile-time safety for runtime flexibility — spend that trade deliberately.",
          },
        },
      ],
    },
    intuition: {
      body: "Here's the mental image that unlocks reflection. Remember how an **interface value** works (from the interfaces lesson): it's really a pair — the *concrete type* stored in it, and the *value* itself. When you write `var w io.Writer = os.Stdout`, `w` secretly holds \"(type = *os.File, value = the stdout pointer).\"\n\nReflection is simply a way to *read that pair at runtime* and act on it. You hand a value to the `reflect` package, and it gives you back two objects: a **reflect.Type** (the type half of the pair) and a **reflect.Value** (the value half). From the Type you can ask \"what are your fields? what's your Kind?\"; from the Value you can read the actual data and — under one strict rule — change it. That's the whole idea: interface stores a (type, value) pair; reflection is the tool that opens it back up.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "From interface pair to reflection objects and back",
            kind: "flow",
            nodes: [
              {
                id: "iface",
                label: "interface value",
                detail: "holds a (concrete type, value) pair — e.g. (Transaction, {ID:7})",
              },
              {
                id: "typeof",
                label: "reflect.TypeOf / ValueOf",
                detail: "reads the pair out of the interface",
                tone: "accent",
              },
              {
                id: "objs",
                label: "reflect.Type + reflect.Value",
                detail: "inspect fields, Kind, tags; read (and if settable, write) the data",
                tone: "success",
              },
              {
                id: "back",
                label: ".Interface()",
                detail: "convert a reflect.Value back to an ordinary interface value",
              },
            ],
            caption: "Law 1 goes right (interface → reflection objects); Law 2 goes back (reflection object → interface).",
          },
        },
        {
          type: "note",
          note: {
            tone: "tip",
            title: "Reflection reads what the interface already knows",
            text: "Reflection isn't magic that invents type information out of nothing. The (type, value) pair is already sitting inside every interface value at runtime — reflection just gives you an API to read and use it.",
          },
        },
      ],
    },
    "mental-model": {
      body: "Rob Pike gave the definitive model as the **three laws of reflection**:\n\n1. **Reflection goes from an interface value to a reflection object.** You pass a value (as an `interface{}`) to `reflect.TypeOf` or `reflect.ValueOf` and get back a `reflect.Type` / `reflect.Value`.\n2. **Reflection goes from a reflection object back to an interface value.** `value.Interface()` returns an `any` you can type-assert back to a concrete type. The round trip is lossless.\n3. **To modify a reflection object, the value must be settable.** You can only change data through reflection if the `reflect.Value` is *addressable* — which, in practice, means you gave reflection a *pointer* and used `.Elem()` to reach what it points at. A plain `reflect.ValueOf(x)` copies `x`, so there's nothing addressable behind it and Set panics.\n\nHold onto law 3 especially: it's the source of the single most common reflection bug.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "info",
            title: "The three laws in one breath",
            text: "1) interface value → reflection object (TypeOf/ValueOf). 2) reflection object → interface value (.Interface()). 3) you can only Set a reflection object that is settable — i.e. reached through a pointer's .Elem().",
          },
        },
        {
          type: "example",
          example: {
            title: "The round trip: value in, value out",
            language: "go",
            code:
              'var x float64 = 3.4\nv := reflect.ValueOf(x)          // law 1: interface -> reflect.Value\nfmt.Println(v.Type())            // float64\nfmt.Println(v.Kind())            // float64 (the underlying category)\nback := v.Interface().(float64)  // law 2: reflect.Value -> interface -> float64\nfmt.Println(back)                // 3.4',
            takeaway:
              "You go in with `ValueOf` and come back out with `.Interface()` plus a type assertion. Nothing is lost — the pair you put in is the pair you get back.",
          },
        },
      ],
    },
    mechanics: {
      body: "The two entry points are `reflect.TypeOf(x)` → a **reflect.Type**, and `reflect.ValueOf(x)` → a **reflect.Value**. Both take an `interface{}`, so they read the concrete type out of the interface pair.\n\nThe distinction you must keep straight is **Kind vs Type**. **Type** is the exact declared type — `main.Transaction`, `main.Celsius`, `*os.File`. **Kind** is the underlying *category* the type is built from — `Struct`, `Slice`, `Ptr`, `Int`, `Float64`, `String`, and so on. Many different Types share one Kind: both `Celsius` and `Fahrenheit` have Kind `Float64`. You switch on Kind when you want to handle \"any struct\" or \"any slice\" uniformly.\n\nFor a struct, you iterate fields with `Type.NumField()` and `Type.Field(i)`, which returns a **StructField**. Its `.Name` is the field name and its `.Tag` is the struct tag; you read a specific tag with `field.Tag.Get(\"json\")`. To read the field's *value*, use `Value.Field(i)` on the reflect.Value.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Type vs Kind",
            kind: "compare",
            nodes: [
              {
                id: "type",
                label: "reflect.Type",
                detail: "The exact declared type: main.Transaction, main.Celsius, *os.File. Distinct per declaration.",
                tone: "accent",
              },
              {
                id: "kind",
                label: "reflect.Kind",
                detail: "The underlying category: Struct, Slice, Ptr, Int, Float64, String. Many Types share one Kind.",
                tone: "success",
              },
            ],
            caption: "Ask Type for identity (\"which type exactly?\"); ask Kind for shape (\"is it a struct/slice/pointer?\").",
          },
        },
        {
          type: "example",
          example: {
            title: "Walking a struct's fields and tags",
            language: "go",
            code:
              'type Transaction struct {\n    ID   int    `json:"id"`\n    Note string `json:"note,omitempty"`\n}\n\nfunc dump(v any) {\n    t := reflect.TypeOf(v)\n    val := reflect.ValueOf(v)\n    for i := 0; i < t.NumField(); i++ {\n        f := t.Field(i)                 // a reflect.StructField\n        fmt.Printf("%s -> tag %q, value %v\\n",\n            f.Name, f.Tag.Get("json"), val.Field(i))\n    }\n}\n// dump(Transaction{ID: 7, Note: "coffee"}) prints:\n// ID   -> tag "id",             value 7\n// Note -> tag "note,omitempty", value coffee',
            takeaway:
              "`Type.Field(i)` gives you the name and tag; `Value.Field(i)` gives you the data. That pairing is the core of every reflection-based codec.",
          },
        },
        {
          type: "points",
          items: [
            "`reflect.TypeOf` → reflect.Type (the type half); `reflect.ValueOf` → reflect.Value (the value half).",
            "**Type** = exact declared type; **Kind** = underlying category (Struct, Slice, Ptr, Int, ...). Switch on Kind for \"any struct.\"",
            "Iterate struct fields with `Type.Field(i)`; read a tag with `field.Tag.Get(\"json\")`; read data with `Value.Field(i)`.",
          ],
        },
      ],
    },
    diagram: {
      body: "Now the part that trips up everyone: **settability**. Reading through reflection is always fine; *writing* has a rule. You can only call `SetString`, `SetInt`, and friends on a `reflect.Value` that is **addressable** — one that points at real, modifiable storage. `reflect.ValueOf(x)` copies `x` into the reflect.Value, so there's no original storage behind it and Set panics. The fix is to hand reflection a *pointer* and call `.Elem()`, which follows the pointer to the addressable value it points at.\n\nFollow the steps below: a plain value gives an unsettable Value (Set panics); a pointer's `.Elem()` gives a settable Value (Set works).",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Why Set needs a pointer's Elem()",
            kind: "sequence",
            nodes: [
              { id: "plain", label: "reflect.ValueOf(x)", detail: "copies x — the Value is not addressable" },
              { id: "setpanic", label: "v.SetString(...)", detail: "PANIC: using unaddressable value", tone: "danger" },
              { id: "ptr", label: "reflect.ValueOf(&x)", detail: "a Value of Kind Ptr, pointing at x's storage" },
              { id: "elem", label: ".Elem()", detail: "follows the pointer to the addressable x", tone: "accent" },
              { id: "setok", label: "v.SetString(...)", detail: "works — x itself is now changed", tone: "success" },
            ],
            caption: "No pointer, no Set. Reflection can only write where there is real storage to write to.",
          },
        },
        {
          type: "note",
          note: {
            tone: "warning",
            title: "The classic panic",
            text: "\"reflect: reflect.Value.SetString using unaddressable value\" almost always means you passed a value where you needed a pointer. Reach for `reflect.ValueOf(&x).Elem()` whenever you intend to Set.",
          },
        },
      ],
    },
    implementation: {
      body: "Let's connect this to the prerequisite you already know: `encoding/json`. When you call `json.Marshal(tx)`, the package doesn't have code compiled for your `Transaction` — it *reflects* over it. It takes the value as an `interface{}`, gets its reflect.Type and reflect.Value, checks the Kind is Struct, then loops the fields. For each field it reads `field.Tag.Get(\"json\")` to decide the JSON key name and options like `omitempty`, reads the field's value with `Value.Field(i)`, and writes the pair into the output. Unmarshal does the reverse — and because it must *write* into your struct, you pass a *pointer* (`json.Unmarshal(data, &tx)`); that's law 3 (settability) in action.\n\nHere is a stripped-down marshaller that shows the shape of what `encoding/json` does. It's not complete, but every idea in it is real.",
      blocks: [
        {
          type: "example",
          example: {
            title: "A tiny tag-driven marshaller (the shape of encoding/json)",
            language: "go",
            code:
              'func toJSON(v any) string {\n    t := reflect.TypeOf(v)\n    val := reflect.ValueOf(v)\n    var parts []string\n    for i := 0; i < t.NumField(); i++ {\n        f := t.Field(i)\n        name := f.Tag.Get("json") // honour the struct tag\n        if name == "" {\n            name = f.Name // fall back to the field name\n        }\n        parts = append(parts,\n            fmt.Sprintf("%q:%q", name, fmt.Sprint(val.Field(i))))\n    }\n    return "{" + strings.Join(parts, ",") + "}"\n}\n// toJSON(Transaction{ID: 7, Note: "coffee"})\n// => {"id":"7","note,omitempty":"coffee"}  (real json also parses the options)',
            takeaway:
              "Reflect over the type, read each `json` tag, read each value, assemble the output. The real package parses the tag's options (like `omitempty`) and handles nested types — but this is the skeleton.",
          },
        },
        {
          type: "points",
          items: [
            "`json.Marshal` reads your value as `interface{}`, reflects over the fields, and uses each `json:\"...\"` tag as the key.",
            "`json.Unmarshal(data, &v)` takes a **pointer** because it must Set your fields — settability (law 3) again.",
            "You almost never call `reflect` yourself for JSON — the library does it. This is what reflection is *for*.",
          ],
        },
      ],
    },
    experiment: {
      body: "Predict before you read on — a wrong guess you correct sticks better than a right answer you skimmed. Consider:\n\n```\nname := \"old\"\nv := reflect.ValueOf(name)\nv.SetString(\"new\")\nfmt.Println(name)\n```\n\nWhat happens — does it print `new`, print `old`, or panic? Commit to an answer.\n\nHere's the trace. `reflect.ValueOf(name)` receives `name` *by value*: the string is copied into an interface and then into the reflect.Value. There is no addressable storage behind that Value — it's a copy with no home. So `v.SetString(\"new\")` doesn't print anything: it **panics** with \"reflect: reflect.Value.SetString using unaddressable value.\" To actually change `name`, you must give reflection its address: `v := reflect.ValueOf(&name).Elem()`. Now `v` refers to the real `name`, is settable, and `v.SetString(\"new\")` makes `fmt.Println(name)` print `new`. The lesson: reading needs nothing special, but writing needs a pointer and `.Elem()`.",
    },
    "failure-cases": {
      body: "Reflection failures nearly all trace back to two things: forgetting settability, and forgetting that the type checker is no longer watching your back. Here are the ones you'll actually meet.",
      blocks: [
        {
          type: "points",
          items: [
            "**Set on an unaddressable Value** → `SetString`/`SetInt` on `reflect.ValueOf(x)` panics. Pass `&x` and use `.Elem()`.",
            "**Wrong Kind assumption** → calling `NumField()` on a non-struct (e.g. a pointer or slice) panics. Check `Kind()` first, and use `.Elem()` to unwrap a pointer.",
            "**Setting an unexported field** → reflection can read but not Set fields that start with a lowercase letter; attempting it panics. Only exported fields are settable.",
            "**Typos become runtime errors** → a mistyped tag key or field name compiles fine and fails at runtime, because reflection sidesteps the compiler.",
            "**Reflection on a hot path** → correct but needlessly slow; a plain method call or generics is far faster where the type is known.",
          ],
        },
        {
          type: "example",
          example: {
            title: "Guard the Kind before you assume a struct",
            language: "go",
            code:
              'func fields(v any) {\n    t := reflect.TypeOf(v)\n    if t.Kind() == reflect.Ptr { // unwrap a pointer first\n        t = t.Elem()\n    }\n    if t.Kind() != reflect.Struct {\n        return // NumField would panic on a non-struct\n    }\n    for i := 0; i < t.NumField(); i++ {\n        fmt.Println(t.Field(i).Name)\n    }\n}',
            takeaway:
              "Always check Kind (and unwrap pointers with `.Elem()`) before calling struct-only methods like `NumField`. Reflection won't warn you at compile time.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "Reflection is powerful and occasionally indispensable, but every use spends real currency. None of these should scare you off writing a codec — they mark where to think twice before choosing reflection over a simpler tool.",
      blocks: [
        {
          type: "points",
          items: [
            "**Flexibility vs safety**: handles types unknown at compile time, but every mistake becomes a runtime panic instead of a compile error.",
            "**Generality vs speed**: one function fits all types, but there's no compile-time dispatch, so it's markedly slower than typed code.",
            "**Reflection vs generics**: generics (Go 1.18+) keep full type safety and speed and have replaced many former reflection use-cases — prefer them when the types share a shape.",
            "**Reflection vs code generation**: codegen (e.g. `go generate`) emits plain, fast, type-checked code, at the cost of a build step and generated files to maintain.",
            "**Readability**: reflection code is harder to read and to change — keep it confined to library boundaries, not sprinkled through app logic.",
          ],
        },
      ],
    },
    design: {
      body: "A few durable rules. Treat reflection as a *library-author's* tool, not an application tool: codecs, ORMs, and validators earn it because they genuinely must handle arbitrary types; your business logic almost never does. Before you reach for `reflect`, ask whether an interface (a shared method), generics (a shared shape), or code generation would do the job with the type checker still on your side — usually one of them will. And when you do reflect, confine it to a small, well-tested function and check `Kind()` before assuming a shape.",
      blocks: [
        {
          type: "points",
          items: [
            "Reflection is for libraries (codecs, ORMs, validators) — most app code should never call `reflect` directly.",
            "Try interfaces, then generics, then code generation *before* reflection; each keeps more compile-time safety.",
            "If you must reflect, isolate it in one small function, check `Kind()` first, and test it hard.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Choosing the tool for a CSV export",
            context:
              "You want to export several ledger struct types to CSV, using a `csv:\"...\"` tag for column headers. Reflection could read the tags generically; generics could work if the rows shared an interface; codegen could emit a fast exporter per type.",
            insight:
              "If the export is a one-off internal tool and the tags vary per type, a small reflection helper is justified — flexibility matters more than speed. If it runs on every request over millions of rows, generate the exporters or use an interface method, so the hot path stays fast and type-checked.",
          },
        },
      ],
    },
    ledgerflow: {
      body: "In LedgerFlow, reflection is present but invisible — and that's the point. When a handler returns a `Transaction` as JSON, it calls `json.Marshal`, which reflects over the struct, reads each `json:\"...\"` tag, and builds the response body. LedgerFlow never writes reflection code for this; it just adds the right struct tags (`json:\"amount\"`, `json:\"note,omitempty\"`) and lets the standard library do the reflective walk. That's reflection used exactly as intended: hidden inside a well-tested library, driven by declarative tags.\n\nWhere LedgerFlow deliberately *avoids* reflection is its own hot path — recording transactions. That code knows its types at compile time, so it uses plain methods and (where a shape is shared) generics, keeping the type checker engaged and the path fast. A tiny bit of reflection is fine in an occasional export or admin tool; it has no place in the per-transaction write loop.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "LedgerFlow: reflection lives inside json.Marshal, not your code",
            kind: "sequence",
            nodes: [
              { id: "tx", label: "Transaction{Amount, Note, ...}", detail: "a plain struct with json:\"...\" tags" },
              { id: "call", label: "json.Marshal(tx)", detail: "handler calls it — no reflect code of its own", tone: "accent" },
              { id: "reflect", label: "json reflects over fields", detail: "reads each field's value and json tag" },
              { id: "tags", label: "tags drive the keys", detail: "\"amount\", omitempty dropped when zero", tone: "success" },
              { id: "json", label: "JSON response body", detail: "returned to the API client" },
            ],
            caption: "You supply the tags; the library supplies the reflection. Your code stays typed and fast.",
          },
        },
      ],
    },
    exercises: {
      body: "Practice is what turns \"I read about reflection\" into \"I know when *not* to reach for it.\" Work across predicting Type vs Kind, reading how an interface's (type, value) pair flows into reflect, implementing a field-and-tag walk, debugging a settability panic, reading how tags drive `omitempty`, and designing a choice between reflection, generics, and codegen. Each produces a different kind of evidence — do them, don't just read them.",
    },
    mastery: {
      body: "You've mastered this when you can explain what reflection is and how it reads the (type, value) pair an interface stores (including Type vs Kind), predict when a reflect Set call panics and give the pointer/`.Elem()` fix, write reflection code that walks a struct's fields and reads each `json` tag, and choose deliberately between reflection, generics, and code generation for a task. Attest a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "Two ideas carry this lesson. **Reflection reads the pair an interface already holds** — you hand a value to `reflect.TypeOf`/`reflect.ValueOf`, get back a Type and a Value, inspect Kind and fields, read `json` tags, and (through a pointer's `.Elem()`) even Set. That's how `encoding/json` marshals a struct it was never compiled against. **But reflection costs safety and speed** — it defeats the type checker so bugs surface at runtime, and it's slow because there's no compile-time dispatch — so reach for interfaces, generics, or code generation first, and keep reflection confined to libraries like codecs and validators.",
      blocks: [
        {
          type: "points",
          items: [
            "Reflection = runtime type inspection: `TypeOf` → Type, `ValueOf` → Value; Kind is the underlying category, Type is the exact type.",
            "Rob Pike's three laws: interface → reflection object, back again, and you can only Set a *settable* (addressable) Value.",
            "Settability needs a pointer's `.Elem()`; `SetX` on a plain `ValueOf` panics as unaddressable.",
            "`encoding/json` is reflection's canonical user — tags drive the keys. Prefer generics/interfaces/codegen first; keep reflection in libraries.",
          ],
        },
      ],
    },
  },
};
