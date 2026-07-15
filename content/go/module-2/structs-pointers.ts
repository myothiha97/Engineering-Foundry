import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 2, structs, pointers & methods — group related fields into one type,
 * take an address with &, dereference with *, and attach behavior with value vs
 * pointer receivers. Same beginner-friendly voice as Modules 0 and 1: plain
 * language, one analogy per hard idea, a concrete example before every rule.
 */
export const goStructsPointers: Lesson = {
  id: "go-structs-pointers",
  slug: "structs-pointers",
  title: "Structs, pointers & methods",
  description:
    "Group related fields into one type, share it with a pointer, and choose value vs pointer receivers deliberately — the decision that makes a mutation stick.",
  moduleId: "go-2",
  estimatedMinutes: 60,
  difficulty: "beginner",
  prerequisites: ["go-basic-types"],
  learningObjectives: [
    "Define a struct and build one with a composite literal",
    "Explain what &x, *p, and *T mean and why field access through a pointer needs no *",
    "Choose a value or pointer receiver deliberately and say why",
  ],
  concepts: ["structs", "pointers", "receivers"],
  references: [
    {
      title: "A Tour of Go: Structs",
      url: "https://go.dev/tour/moretypes/1",
      teaches:
        "Declaring structs, building them with composite literals, and accessing fields through a pointer.",
      relevance:
        "The gentlest official walkthrough of exactly the struct and pointer material in this lesson.",
      required: false,
      section: "Structs; Pointers to structs; Struct literals",
    },
    {
      title: "A Tour of Go: Methods and pointer receivers",
      url: "https://go.dev/tour/methods/4",
      teaches:
        "Why a pointer receiver can modify the value it points to and a value receiver cannot.",
      relevance: "Backs the central value-vs-pointer receiver decision of this lesson.",
      required: false,
      section: "Pointer receivers; Methods with value receivers",
    },
    {
      title: "Effective Go — Pointers vs. Values",
      url: "https://go.dev/doc/effective_go#pointers_vs_values",
      teaches:
        "The idiomatic rule of thumb for choosing a receiver type and staying consistent per type.",
      relevance: "The authoritative source for the 'be consistent per type' design guidance.",
      required: false,
      section: "Pointers vs. Values",
    },
  ],
  exercises: [
    {
      id: "go2st-predict-receiver",
      type: "prediction",
      prompt:
        "An Account has a value-receiver method `func (a Account) Deposit(c int64) { a.BalanceC += c }`. You call `acct.Deposit(500)` then print `acct.BalanceC`. Predict the result and say why.",
      expectedAnswer:
        "It prints the original balance, unchanged. A value receiver gets a copy of the Account, so the += modified the copy and was discarded on return. Use a pointer receiver to make it stick.",
      hints: ["What exactly did the method receive — the account, or a copy of it?"],
    },
    {
      id: "go2st-read-autoderef",
      type: "code-reading",
      prompt:
        "Given `p := &acct` (so p is a *Account), read `p.BalanceC = 100`. Explain what Go is really doing, and why you don't have to write `(*p).BalanceC`.",
      hints: [
        "Go auto-dereferences a pointer when you access a field through it.",
        "`p.BalanceC` is shorthand for `(*p).BalanceC`.",
      ],
    },
    {
      id: "go2st-implement-deposit",
      type: "implementation",
      prompt:
        "Implement Deposit so the caller's account balance actually increases. Choose the receiver type that makes the change persist.",
      starterCode:
        'package main\n\nimport "fmt"\n\ntype Account struct {\n  ID       string\n  BalanceC int64 // balance in cents\n}\n\n// Deposit should add c cents to the account\'s balance.\nfunc (a Account) Deposit(c int64) {\n  a.BalanceC += c\n}\n\nfunc main() {\n  acct := Account{ID: "a1", BalanceC: 1000}\n  acct.Deposit(500)\n  fmt.Println(acct.BalanceC) // want: 1500\n}',
      expectedAnswer: "func (a *Account) Deposit(c int64) {\n  a.BalanceC += c\n}",
      hints: [
        "A value receiver is a copy; writes to it vanish when the method returns.",
        "Change `(a Account)` to `(a *Account)` — Go takes the address of acct for you at the call site.",
      ],
    },
    {
      id: "go2st-debug-literal",
      type: "debugging",
      prompt:
        '`acct := Account{"a1", 1000, true}` fails to compile after a new field is added between BalanceC and the bool. Explain why positional literals are fragile and fix it.',
      hints: [
        "A positional literal must list every field in declaration order.",
        'Use a keyed literal like `Account{ID: "a1", BalanceC: 1000, Active: true}`.',
      ],
    },
    {
      id: "go2st-refactor-consistency",
      type: "refactoring",
      prompt:
        "An Account type has some methods on value receivers and some on pointer receivers, seemingly at random. Refactor for a consistent receiver choice and explain the rule you applied.",
      hints: [
        "If any method needs a pointer receiver, it's usual to give them all pointer receivers.",
        "Mixed receivers on one type confuse readers and the method set.",
      ],
    },
    {
      id: "go2st-design-receiver",
      type: "design",
      prompt:
        "Decide whether a Task's `Label()` method (which only formats and returns a string) should use a value or pointer receiver, and state what evidence would flip your choice.",
      hints: [
        "Does the method change the account, or only read it?",
        "Is the type already using pointer receivers elsewhere for consistency?",
      ],
    },
    {
      id: "go2st-advanced-new",
      type: "advanced",
      prompt:
        "Show two ways to allocate a fresh Account and get a *Account back: `new(Account)` and `&Account{...}`. Explain what each produces and when you'd prefer the composite-literal form.",
      hints: [
        "`new(T)` returns a *T pointing at a zero-valued T.",
        '`&Account{ID: "a1"}` also returns a *Account but lets you set fields at the same time.',
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-pointer",
      kind: "explain",
      description:
        "Explain in plain words what &x, *p, and *T mean and why p.Field needs no explicit dereference.",
      required: true,
    },
    {
      id: "predict-receiver",
      kind: "predict",
      description:
        "Correctly predict whether a method's mutation reaches the caller from its receiver type.",
      required: true,
    },
    {
      id: "implement-receiver",
      kind: "implement",
      description:
        "Write a method with the receiver type that makes a mutation persist, and it compiles cleanly.",
      required: true,
    },
    {
      id: "design-receiver",
      kind: "design",
      description: "Defend a value-vs-pointer receiver choice for a method.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "Real programs rarely deal with a lone number or string. They deal with *things* that have several parts at once: a book has a title, an author, and a page count. You could keep those parts in separate variables, but then nothing ties them together and it's easy to update one and forget the rest.\n\nGo's answer is the **struct** — a single type that groups related fields into one value. Once you have a struct, you can attach behavior to it with a **method**. If a method needs to change the original struct instead of a copy, it uses a **pointer**. The next lesson explains that copy-versus-share rule in detail.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "A struct is like a labelled form: one sheet with named blanks — ID, Balance, Status — kept together. A pointer is the *address* of that sheet in a filing cabinet. Handing someone the address lets them edit your sheet; handing them a photocopy does not.",
          },
        },
        {
          type: "points",
          items: [
            "A **struct** bundles related fields into one named type.",
            "A **method** attaches behavior to that type.",
            "A **pointer** lets a method reach back and change the caller's actual struct instead of a copy.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Keep one question ready for every method you write: **does it need to change the receiver?** If yes, use a pointer receiver (`func (a *Account) ...`) so the change reaches the caller. If it only reads, a value receiver (`func (a Account) ...`) is fine and signals 'I won't touch your data'.\n\nThere's a second reason to reach for a pointer even when you only read: **size**. A value receiver copies the whole struct on every call. For a small struct that's free; for a large one it's wasteful. So the rule of thumb is: use a pointer receiver to *modify* or to *avoid copying a large struct* — and be consistent across one type's methods.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "The one-line test",
            text: "Does this method need to mutate the receiver, or is the struct large? Either one → pointer receiver. Otherwise a value receiver is fine — but stay consistent per type.",
          },
        },
        {
          type: "diagram",
          diagram: {
            title: "Value receiver vs pointer receiver",
            kind: "compare",
            nodes: [
              {
                id: "value",
                label: "Value receiver: (a Account)",
                detail:
                  "Gets a copy. Great for read-only methods on small structs. Mutations don't persist.",
              },
              {
                id: "pointer",
                label: "Pointer receiver: (a *Account)",
                detail:
                  "Gets the address. Can mutate the caller's struct and avoids copying large ones.",
                tone: "accent",
              },
            ],
          },
        },
      ],
    },
    mechanics: {
      body: "Now the precise pieces. A struct type is declared with `type Name struct { ... }`, listing each field's name and type. You build a value with a composite literal, and you should prefer the **keyed** form (`Account{ID: \"a1\", BalanceC: 1000}`) over the positional form (`Account{\"a1\", 1000}`) because keyed literals survive reordering or adding fields.\n\nThree pointer operators do the work. `&x` **takes the address** of `x`, producing a value of type `*T` (a 'pointer to T'). `*p` **dereferences** `p` — it follows the address back to the value. And `*T` in a type position *names* the pointer type. The convenience you'll lean on: when you access a field through a pointer, Go **auto-dereferences** for you, so `p.BalanceC` means `(*p).BalanceC` — you never write the clumsy form.",
      blocks: [
        {
          type: "example",
          example: {
            title: "&, *, and auto-dereference",
            language: "go",
            code: 'acct := Account{ID: "a1", BalanceC: 1000}\n\np := &acct          // p is a *Account: the ADDRESS of acct\nfmt.Println(*p)     // dereference: prints the whole Account value\n\np.BalanceC = 1500   // shorthand for (*p).BalanceC = 1500\nfmt.Println(acct.BalanceC) // 1500 — we changed acct through p',
            takeaway:
              "`&acct` is the address, `*p` follows it back, and `p.BalanceC` auto-dereferences so you never type `(*p)`.",
          },
        },
        {
          type: "example",
          example: {
            title: "Keyed literals survive change; positional ones break",
            language: "go",
            code: 'type Account struct {\n    ID       string\n    BalanceC int64\n    Active   bool\n}\n\n// Keyed: order-independent, safe if fields are added.\na := Account{ID: "a1", BalanceC: 1000, Active: true}\n\n// Positional: must match declaration order exactly.\nb := Account{"a1", 1000, true} // fragile — reordering fields silently breaks this',
            takeaway:
              "Prefer keyed literals. They read clearly and don't break when the struct grows.",
          },
        },
        {
          type: "points",
          items: [
            "`type Account struct { ... }` declares the type; keyed literals build it safely.",
            "`&x` → address (`*T`); `*p` → dereference; `*T` → the pointer type in a declaration.",
            "Field access through a pointer auto-dereferences: `p.Field`, never `(*p).Field`.",
          ],
        },
      ],
    },
    diagram: {
      body: "Study the whole method decision as a diagram. For a method that must change the account, the receiver is `*Account` and Go passes the address; for a method that only reads, a value receiver copies the struct. Trace each path and ask: how many boxes exist, and does a write reach the caller's box?",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "How a call reaches (or misses) the caller's struct",
            kind: "compare",
            nodes: [
              {
                id: "byvalue",
                label: "acct.Deposit(500) with (a Account)",
                detail:
                  "Go copies acct into a. Writes to a.BalanceC never reach acct. Deposit is a no-op.",
                tone: "muted",
              },
              {
                id: "bypointer",
                label: "acct.Deposit(500) with (a *Account)",
                detail:
                  "Go passes &acct. a holds acct's address, so a.BalanceC += 500 changes acct.",
                tone: "accent",
              },
            ],
            caption:
              "One character of difference in the receiver — Account vs *Account — decides whether the deposit is real.",
          },
        },
      ],
    },
    implementation: {
      body: "Put it together in a small account type. Read-only methods take a value receiver; the mutating method takes a pointer receiver. Notice the call site doesn't change — you still write `acct.Deposit(500)`. Go automatically takes the address of `acct` when the receiver is a pointer, so methods read naturally whichever receiver you chose.",
      blocks: [
        {
          type: "example",
          example: {
            title: "An account with read and mutate methods",
            language: "go",
            code: 'type Account struct {\n    ID       string\n    BalanceC int64 // balance in cents\n}\n\n// Reads only — a value receiver is fine and can\'t corrupt the account.\nfunc (a Account) IsOverdrawn() bool {\n    return a.BalanceC < 0\n}\n\n// Mutates — must use a pointer receiver so the change persists.\nfunc (a *Account) Deposit(c int64) {\n    a.BalanceC += c\n}\n\nfunc main() {\n    acct := Account{ID: "a1", BalanceC: 1000}\n    acct.Deposit(500)            // Go passes &acct automatically\n    fmt.Println(acct.BalanceC)   // 1500 — persisted\n    fmt.Println(acct.IsOverdrawn()) // false\n}',
            takeaway:
              "Match the receiver to intent: value to read, pointer to mutate. The call site looks the same either way.",
          },
        },
        {
          type: "points",
          items: [
            "Mutating method → `(a *Account)`; read-only on a small struct → `(a Account)`.",
            "Call sites are identical: Go takes the address for a pointer receiver automatically.",
            "Build the account with a keyed composite literal.",
          ],
        },
      ],
    },
    experiment: {
      body: "Predict before you read on — a corrected wrong guess sticks better than a right answer you skim. You have `func (a Account) Deposit(c int64) { a.BalanceC += c }` (note the **value** receiver). You run:\n\n`acct := Account{BalanceC: 1000}` then `acct.Deposit(500)` then `fmt.Println(acct.BalanceC)`.\n\nWhat prints — 1500 or 1000? Commit to an answer.\n\nIt prints **1000**. The value receiver made `Deposit` operate on a copy of `acct`; the copy's balance became 1500 and was thrown away on return, leaving the original at 1000. Now change one character — the receiver to `(a *Account)` — and rerun: it prints **1500**, because the pointer receiver gave the method `acct`'s address, so `a.BalanceC += 500` wrote straight into the caller's box. That single character is the whole lesson: a value receiver copies, a pointer receiver shares.",
    },
    "failure-cases": {
      body: "Most struct-and-pointer bugs at this level come from a short list of recurring mistakes. Here are the ones you'll actually meet, and the signal each gives you.",
      blocks: [
        {
          type: "points",
          items: [
            "**Mutating through a value receiver** → the change is silently lost; the caller sees the old data. Use a pointer receiver.",
            "**Positional composite literal** → `too few values` / wrong fields when the struct changes. Use keyed literals.",
            "**Writing `(*p).Field`** → works but is un-idiomatic; Go auto-dereferences, so write `p.Field`.",
            "**Mixed receivers on one type** → confusing to read and reason about. Pick one style per type and stay consistent.",
            "**Copying a large struct on every method call** → correct but wasteful. A pointer receiver avoids the copy.",
          ],
        },
        {
          type: "example",
          example: {
            title: "The classic value-receiver no-op",
            language: "go",
            code: 'func (a Account) SetActive() { a.Active = true } // value receiver\n\nfunc main() {\n    acct := Account{ID: "a1"}\n    acct.SetActive()\n    fmt.Println(acct.Active) // false — the write went to a copy\n}',
            takeaway:
              "If a method's job is to change the receiver, a value receiver makes it do nothing. Reach for `*Account`.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "Receiver choice is a real trade-off, not a rule with one right answer. Each option buys something and costs something; pick the one you can defend for the type at hand — and once chosen, apply it consistently.",
      blocks: [
        {
          type: "points",
          items: [
            "**Value receiver**: safe from accidental mutation and simple to reason about, but copies the whole struct each call and can't persist changes.",
            "**Pointer receiver**: can mutate and avoids copying large structs, but the method can change your data and you must consider a nil pointer.",
            "**Keyed vs positional literals**: keyed is a little more typing but survives field changes; positional is terse but brittle.",
            "**Consistency per type**: giving every method the same receiver kind costs you the occasional 'unnecessary' pointer, but keeps the type predictable for readers.",
          ],
        },
      ],
    },
    design: {
      body: "Turn the rules into durable habits. Group genuinely related fields into a struct and give it a keyed literal at construction. Default a method to a value receiver when it only reads a small struct; switch to a pointer receiver the moment it must mutate the receiver or the struct is large. Above all, keep a single type's receivers consistent — if one method needs a pointer receiver, it's idiomatic to make them all pointer receivers.",
      blocks: [
        {
          type: "points",
          items: [
            "Model a real-world entity as one struct; build it with keyed literals.",
            "Pointer receiver to mutate or to avoid copying a large struct; value receiver for small read-only methods.",
            "Be consistent per type — don't mix receiver kinds without reason.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Designing the Account method set",
            context:
              "Account already has a Deposit method that must mutate the balance, so it uses a pointer receiver. A new Statement method only formats a string.",
            insight:
              "Even though Statement only reads, giving it a pointer receiver too keeps Account's method set consistent — the idiomatic choice once any method needs a pointer.",
          },
        },
      ],
    },
    mastery: {
      body: "You've mastered this lesson when four signals hold without notes: you can explain what `&x`, `*p`, and `*T` mean and why `p.Field` needs no explicit dereference; correctly predict whether a method's mutation reaches the caller from its receiver type; write a method with the receiver that makes a change persist; and defend a value-vs-pointer receiver choice for a real method. Check a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "Two ideas carry this whole lesson: a **struct** groups related fields into one value, and a **pointer** lets a method change that value instead of a copy. Keep the receiver question ready — mutate or large? then pointer; small and read-only? then value — and 'my method did nothing' stops being a mystery.",
      blocks: [
        {
          type: "points",
          items: [
            "A struct bundles fields; build it with keyed composite literals.",
            "`&x` takes an address, `*p` dereferences, `*T` is the pointer type; `p.Field` auto-dereferences.",
            "Value receiver = copy (read-only); pointer receiver = shared (can mutate, avoids copying large structs).",
            "Be consistent per type; `new(T)` and `&T{}` both give you a *T.",
            "Next: see exactly when assignment and function calls copy a struct and when a pointer shares it.",
          ],
        },
      ],
    },
  },
};
