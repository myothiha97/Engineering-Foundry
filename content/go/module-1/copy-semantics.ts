import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 1, copy semantics — assignment copies the value, function arguments are
 * copies, block scope, and shadowing. Same beginner-friendly voice as Module 0:
 * plain language, one analogy per hard idea, concrete example before the rule.
 */
export const goCopySemantics: Lesson = {
  id: "go-copy-semantics",
  slug: "copy-semantics",
  title: "Variables, assignment & copy semantics",
  description:
    "Learn when Go copies your data and when it shares it — the default is copy, and that surprises almost everyone.",
  moduleId: "go-2",
  estimatedMinutes: 55,
  difficulty: "beginner",
  prerequisites: ["go-structs-pointers"],
  learningObjectives: [
    "Explain why assignment and function arguments copy the value by default",
    "Predict whether a mutation is seen by the caller or silently lost",
    "Recognize how block scope and `:=` shadowing hide bugs",
  ],
  concepts: ["assignment", "copy-semantics", "scope", "shadowing"],
  references: [
    {
      title: "The Go Programming Language Specification — Assignability",
      url: "https://go.dev/ref/spec#Assignability",
      teaches: "The normative rules for what assignment does to a value.",
      relevance: "Grounds the 'assignment copies the value' rule in the language spec.",
      required: false,
      section: "Assignments; Assignability",
    },
    {
      title: "The Go Programming Language Specification — Declarations and scope",
      url: "https://go.dev/ref/spec#Declarations_and_scope",
      teaches: "How blocks create scopes and how an inner declaration shadows an outer one.",
      relevance: "The authoritative source for the scope and shadowing stages.",
      required: false,
      section: "Declarations and scope; Blocks",
    },
    {
      title: "Effective Go — Variables and new/make",
      url: "https://go.dev/doc/effective_go#variables",
      teaches: "Idiomatic variable declaration and when values live behind pointers.",
      relevance: "Backs the design guidance on copying versus sharing.",
      required: false,
      section: "Data; Allocation",
    },
  ],
  exercises: [
    {
      id: "go1cs-predict-mutate",
      type: "prediction",
      prompt:
        "A function takes a `Transaction` by value and sets `t.Amount = 0` inside it. After the call, is the caller's transaction changed? Predict, then say why.",
      expectedAnswer:
        "No. The function received a copy, so the caller's original is untouched. To change it, pass *Transaction.",
      hints: ["What exactly did the function receive — the record, or a copy of it?"],
    },
    {
      id: "go1cs-read-shadow",
      type: "code-reading",
      prompt:
        "Read a function where `err` is declared with `:=` inside an `if` block and checked again after the block. Explain which `err` each line refers to.",
      hints: ["A `:=` inside a block declares a *new* variable that lives only in that block."],
    },
    {
      id: "go1cs-implement-double",
      type: "implementation",
      prompt:
        "Implement `zeroOut` so that it actually sets the caller's transaction amount to zero. Choose the parameter type that makes the change stick.",
      starterCode:
        'package main\n\nimport "fmt"\n\ntype Transaction struct {\n  ID     string\n  Amount int\n}\n\n// zeroOut should reset the caller\'s transaction amount to 0.\nfunc zeroOut(t Transaction) {\n  t.Amount = 0\n}\n\nfunc main() {\n  tx := Transaction{ID: "a1", Amount: 500}\n  zeroOut(tx)\n  fmt.Println(tx.Amount) // want: 0\n}',
      expectedAnswer:
        "func zeroOut(t *Transaction) {\n  t.Amount = 0\n}\n\n// call site: zeroOut(&tx)",
      hints: [
        "A value parameter is a copy; changes to it vanish when the function returns.",
        "Pass a pointer (*Transaction) and call with &tx so both names refer to the same record.",
      ],
    },
    {
      id: "go1cs-debug-shadow",
      type: "debugging",
      prompt:
        "A handler assigns `config, err := load()` inside an `if`, but the outer `config` stays nil and the program crashes later. Find the shadowing bug and fix it.",
      hints: ["Did the inner `:=` create a new `config` that only existed inside the `if`?"],
    },
    {
      id: "go1cs-refactor-alias",
      type: "refactoring",
      prompt:
        "Code copies a large `Report` struct into three helper functions purely to read one field. Refactor to avoid needless copying without introducing accidental mutation.",
      hints: ["Read-only access can take a pointer; keep the helpers from writing through it."],
    },
    {
      id: "go1cs-design-boundary",
      type: "design",
      prompt:
        "Decide whether `renameTask` should take a Task by value or by pointer, and state the evidence that would flip your choice.",
      hints: ["Does the function need to change the caller's task, or only create a changed copy?"],
    },
    {
      id: "go1cs-advanced-slice",
      type: "advanced",
      prompt:
        "A slice header is copied by value, yet appending in a function sometimes changes the caller's data and sometimes doesn't. Explain why, using capacity and the shared backing array.",
      hints: [
        "The slice header (pointer, length, capacity) is copied; the backing array it points to is shared.",
        "`append` may reallocate when capacity is exceeded, breaking the sharing.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-copy",
      kind: "explain",
      description: "Explain why assignment and function arguments copy by default, without notes.",
      required: true,
    },
    {
      id: "predict-mutation",
      kind: "predict",
      description: "Correctly predict whether a struct mutation reaches the caller.",
      required: true,
    },
    {
      id: "implement-pointer",
      kind: "implement",
      description: "Change a value parameter to a pointer so a mutation actually persists.",
      required: true,
    },
    {
      id: "design-boundary",
      kind: "design",
      description: "Defend a value-vs-pointer choice for a small function.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "You write `b := a`, change `b`, and expect `a` to change too — or you pass a record into a function, the function updates it, and you assume the update stuck. In Go, both assumptions are often wrong.\n\nBy default Go uses **copy semantics**: assigning a value or passing it to a function hands over a *copy*, not the original. The original and the copy are two separate things that happen to look alike for a moment. Miss this and you get bugs where a mutation silently does nothing.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "Assigning a value is like photocopying a form, not passing the original sheet across a desk. Scribble on the photocopy and the original in your drawer is untouched. Go hands out photocopies by default.",
          },
        },
        {
          type: "scenario",
          scenario: {
            title: "The update that never happened",
            context:
              "A function receives a Transaction, sets its status to 'settled', and returns. The caller reads the transaction afterward and sees the old status. No error, no panic — just stale data.",
            insight:
              "The function edited its own copy. The caller's record was never in the room. Naming the copy tells you exactly why the write vanished.",
          },
        },
      ],
    },
    "mental-model": {
      body: "Hold one question in your head every time data moves: **copy or share?** Assignment (`=`, `:=`) and passing a plain value to a function are always *copy*. Passing a pointer (`&x` in, `*T` as the parameter type) is *share*.\n\nA useful default: if a function needs to *change* the caller's data, it must share (take a pointer). If it only needs to *read* the data, a copy is fine — and for small values, often clearer.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Copy vs share",
            kind: "compare",
            nodes: [
              {
                id: "copy",
                label: "Copy (default)",
                detail: "b := a, or func(t Transaction). New box; changes stay local.",
              },
              {
                id: "share",
                label: "Share (pointer)",
                detail:
                  "func(t *Transaction), called with &tx. Same box; changes are visible to the caller.",
                tone: "accent",
              },
            ],
          },
        },
        {
          type: "note",
          note: {
            tone: "tip",
            title: "One-line test",
            text: "Ask: does this function need to *mutate* the caller's data? Yes → pass a pointer. No → a copy is fine.",
          },
        },
      ],
    },
    mechanics: {
      body: "Precisely: assignment copies the value being assigned, and a function call copies each argument into the parameter. For a struct, that means every field is copied. The copy and the original share no memory, so writing to one cannot affect the other.\n\nA **pointer** breaks out of this. `&tx` produces the address of `tx`; a parameter of type `*Transaction` receives that address. Writing through it (`t.Amount = 0`, which Go shortens from `(*t).Amount = 0`) reaches back to the caller's box because both names hold the same address.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Pointer parameter shares the box",
            language: "go",
            code: 'func settle(t *Transaction) { // receives an ADDRESS, not a copy\n    t.Amount = 0              // writes through to the caller\'s box\n}\n\nfunc main() {\n    tx := Transaction{ID: "a1", Amount: 500}\n    settle(&tx)                // pass the address of tx\n    fmt.Println(tx.Amount)     // prints: 0\n}',
            takeaway:
              "The address made `t` and `tx` two names for the same box, so the write stuck.",
          },
        },
        {
          type: "points",
          items: [
            "Struct assignment copies every field; the two structs are fully independent afterward.",
            "`&x` takes an address; a `*T` parameter shares that box with the caller.",
            "Slices, maps, and channels are copied too — but their copy points at the same underlying data (a subtlety, not an exception to copying).",
          ],
        },
      ],
    },
    diagram: {
      body: "Below is the copy-vs-share picture as a diagram you can study. For each side, ask: how many boxes exist, and can a change on one side be seen on the other? Copy makes two boxes; a pointer makes two names for one box.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Two boxes vs one shared box",
            kind: "compare",
            nodes: [
              {
                id: "copyside",
                label: "By value → two boxes",
                detail:
                  "settle(tx): tx and the parameter are separate. Writes to the parameter never reach tx.",
                tone: "muted",
              },
              {
                id: "shareside",
                label: "By pointer → one box",
                detail: "settle(&tx): the parameter holds tx's address. Writes go straight to tx.",
                tone: "accent",
              },
            ],
            caption:
              "Same function body, one word of difference at the boundary, opposite behavior.",
          },
        },
      ],
    },
    implementation: {
      body: "Put it to work. When a function must update the caller's record, take a pointer and call it with `&`. When it only reads, take the value — it's simpler and prevents accidental writes. The choice is a one-word decision at the parameter, but it decides whether your mutation is real or a no-op.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Read by value, mutate by pointer",
            language: "go",
            code: 'type Transaction struct {\n    ID     string\n    Amount int\n}\n\n// Reads only — a copy is fine and cannot corrupt the original.\nfunc isLarge(t Transaction) bool {\n    return t.Amount > 1000\n}\n\n// Mutates — must share, so take a pointer.\nfunc applyFee(t *Transaction, fee int) {\n    t.Amount -= fee\n}\n\nfunc main() {\n    tx := Transaction{ID: "a1", Amount: 1500}\n    fmt.Println(isLarge(tx)) // true, tx unchanged\n    applyFee(&tx, 50)\n    fmt.Println(tx.Amount)   // 1450, change persisted\n}',
            takeaway: "Match the parameter to intent: value to read, pointer to write.",
          },
        },
        {
          type: "points",
          items: [
            "Mutating helper → `*T` parameter, called with `&x`.",
            "Read-only helper on a small struct → plain value parameter.",
          ],
        },
      ],
    },
    experiment: {
      body: "Predict before you read on. You have a `Transaction` struct with an `Amount` field. You pass it to `func discount(t Transaction) { t.Amount = t.Amount / 2 }` and then print `tx.Amount` in the caller. What prints — the halved amount, or the original?\n\nCommit to an answer. The original prints unchanged. `discount` received a copy, halved the copy's field, and the copy was discarded on return. The caller's `tx` was never touched. To halve the real one, the parameter must be `*Transaction` and you must call `discount(&tx)`. This single question is the whole lesson: a value parameter is a copy, so writes to it are local unless you deliberately share via a pointer.",
    },
    "failure-cases": {
      body: "Most copy-semantics bugs come from two roots: expecting a copy to behave like a shared value, or letting `:=` quietly declare a *new* variable that shadows one you meant to reuse. **Shadowing** means an inner declaration hides an outer variable of the same name inside a block.",
      blocks: [
        {
          type: "points",
          items: [
            "**Mutating a value parameter** → the change is lost; the caller sees the old data.",
            "**`:=` inside an `if`/`for` block** → creates a new variable that vanishes at the block's end.",
            "**Reassigning in a loop and expecting the outer variable to update** → often a shadow, not an update.",
            "**Copying a large struct in a hot path** → correct, but wasteful.",
            "**Assuming a slice copy is fully independent** → the backing array is still shared until append reallocates.",
          ],
        },
        {
          type: "example",
          example: {
            title: "Shadowing hides a bug",
            language: "go",
            code: "var config *Config\nif enabled {\n    config, err := load() // := declares a NEW config, scoped to the if\n    if err != nil { return }\n    _ = config            // used here, then gone\n}\n// outer config is still nil here\nuse(config) // nil pointer — surprise",
            takeaway:
              "The inner `config` shadowed the outer one. Use `=` (not `:=`) to assign the outer variable.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "Copy versus share is a real trade-off, not a rule with one right answer. Each side buys something and costs something; pick the one you can defend for the function at hand.",
      blocks: [
        {
          type: "points",
          items: [
            "**Pass by value**: safe from accidental mutation and easy to reason about, but copies cost time and memory for big structs.",
            "**Pass by pointer**: cheap and lets you mutate, but the callee can change your data — sometimes unexpectedly — and you must watch for nil.",
            "**Copying to isolate**: a deliberate copy protects the original from later edits, at the price of extra memory.",
            "**Shadowing with `:=`**: convenient for short-lived locals, but a magnet for 'why is the outer variable still old?' bugs.",
          ],
        },
      ],
    },
    design: {
      body: "Turn it into habits. Default to passing small, read-only values by value — it documents that the function won't mutate them. Reach for a pointer when the function's job is to change the caller's data, or when the struct is large enough that copying it repeatedly is wasteful. Prefer `=` over `:=` when you mean to update an existing variable, and keep variable scopes small so a shadow has less room to hide.",
      blocks: [
        {
          type: "points",
          items: [
            "Mutation is the signal for a pointer; reading is the signal for a value.",
            "Use `=` to update an existing variable; reserve `:=` for genuinely new ones.",
            "Keep scopes tight so shadowing can't quietly diverge two variables.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Designing applyFee",
            context:
              "applyFee must reduce a transaction's stored amount so the change is persisted by the caller.",
            insight:
              "Because it mutates the caller's record, it must take *Transaction. A value parameter would make it a silent no-op.",
          },
        },
      ],
    },
    mastery: {
      body: "You've mastered this when four signals hold: you can explain why the default is copy, correctly predict whether a struct mutation reaches the caller, convert a value parameter to a pointer so a change actually persists, and defend a value-vs-pointer choice for a real function. Check a criterion only when you genuinely have that evidence.",
    },
    summary: {
      body: "One question carries the whole lesson: **copy or share?** Assignment and plain arguments copy; pointers share. Get that right and 'my update did nothing' stops being a mystery.",
      blocks: [
        {
          type: "points",
          items: [
            "Default is copy: `b := a` and value parameters create independent boxes.",
            "Share on purpose with a pointer (`&x` in, `*T` parameter) when you must mutate the caller's data.",
            "Trap: `:=` inside a block shadows an outer variable instead of updating it.",
            "Next: see how slices can copy a small header while still sharing their elements.",
          ],
        },
      ],
    },
  },
};
