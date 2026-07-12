import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 3, interfaces, method sets & nil interfaces — describe behavior with a
 * contract of methods, let Go satisfy it implicitly, keep the contract small,
 * and understand why an interface value is a (type, value) pair so the typed-nil
 * trap stops being a mystery. Same beginner-friendly voice as Modules 0, 1, and
 * 2: plain language, one analogy per hard idea, a concrete example before the
 * abstract rule.
 */
export const goInterfaces: Lesson = {
  id: "go-interfaces",
  slug: "interfaces",
  title: "Interfaces, method sets & nil interfaces",
  description:
    "Describe what a value can *do* with a small set of method signatures, let Go satisfy the contract implicitly, and step around the typed-nil trap that fools almost everyone.",
  moduleId: "go-3",
  estimatedMinutes: 60,
  difficulty: "intermediate",
  prerequisites: ["go-structs-pointers"],
  learningObjectives: [
    "Define a small interface and explain why Go satisfies it implicitly (no `implements` keyword)",
    "Predict from a type's method set whether T or only *T satisfies an interface",
    "Explain why an interface holding a typed nil pointer is not equal to nil, and avoid the bug",
  ],
  concepts: ["interfaces", "method-sets", "nil-interface", "typed-nil"],
  ledgerFlowApplications: [
    "Define a small AccountRepository interface so services depend on behavior, not on Postgres",
    "Swap a real database store for an in-memory fake in tests because both satisfy the same interface",
    "Avoid returning a typed-nil error from a store method so `if err != nil` stays trustworthy",
  ],
  references: [
    {
      title: "A Tour of Go: Interface values with nil underlying values",
      url: "https://go.dev/tour/methods/9",
      teaches: "Why an interface value can be non-nil even when the concrete value it holds is a nil pointer.",
      relevance: "The official, minimal demonstration of the exact typed-nil behavior this lesson centers on.",
      required: true,
      section: "Interface values with nil underlying values",
    },
    {
      title: "Effective Go — Interfaces",
      url: "https://go.dev/doc/effective_go#interfaces",
      teaches: "Idiomatic interface design: implicit satisfaction and the preference for small interfaces.",
      relevance: "Backs the 'keep interfaces small and let types satisfy them implicitly' design guidance.",
      required: true,
      section: "Interfaces and methods; Interfaces and other types",
    },
    {
      title: "The Go Programming Language Specification — Interface types",
      url: "https://go.dev/ref/spec#Interface_types",
      teaches: "The precise definition of an interface type and how a type's method set determines what it satisfies.",
      relevance: "The authoritative source for method sets and what it means to implement an interface.",
      required: false,
      section: "Interface types; Method sets",
    },
  ],
  exercises: [
    {
      id: "go3if-predict-typednil",
      type: "prediction",
      prompt:
        "Given `var p *os.File = nil` and `var r io.Reader = p`, predict what `r == nil` prints and explain why in terms of the interface's (type, value) pair.",
      expectedAnswer:
        "It prints false. Assigning p to the interface r stored a non-nil type descriptor (*os.File) alongside the nil pointer value, so the interface itself holds a type and is not nil — even though the pointer inside it is nil.",
      hints: ["An interface value is a pair: a concrete type and a value.", "Which half of the pair is nil, and which is not?"],
    },
    {
      id: "go3if-read-implicit",
      type: "code-reading",
      prompt:
        "A `File` type has a `Read(p []byte) (int, error)` method but the source never mentions io.Reader. Explain how `var r io.Reader = File{}` compiles anyway.",
      hints: ["Go has no `implements` keyword.", "If a type has all of an interface's methods, it satisfies that interface automatically."],
    },
    {
      id: "go3if-implement-stringer",
      type: "implementation",
      prompt:
        "Make Account satisfy the fmt.Stringer interface (`String() string`) so that fmt.Println prints a friendly label instead of the raw struct.",
      starterCode:
        'package main\n\nimport "fmt"\n\ntype Account struct {\n  ID       string\n  BalanceC int64 // cents\n}\n\n// TODO: give Account a String() string method so it satisfies fmt.Stringer.\n\nfunc main() {\n  a := Account{ID: "a1", BalanceC: 1500}\n  fmt.Println(a) // want: a1: 1500c\n}',
      expectedAnswer:
        'func (a Account) String() string {\n  return fmt.Sprintf("%s: %dc", a.ID, a.BalanceC)\n}',
      hints: [
        "Stringer is just `interface { String() string }` — a one-method contract.",
        "A value receiver is fine here since String only reads the account.",
      ],
    },
    {
      id: "go3if-debug-methodset",
      type: "debugging",
      prompt:
        "`Deposit` has a pointer receiver `func (a *Account) Deposit(int64)`. The code `var d Depositor = Account{}` (where Depositor requires Deposit) fails to compile. Explain the method-set reason and fix it.",
      hints: ["A value of type T does not include methods that have a pointer receiver.", "Assign a *Account (e.g. `&Account{}`), not an Account."],
    },
    {
      id: "go3if-refactor-smaller",
      type: "refactoring",
      prompt:
        "A `Storage` interface declares eight methods but a report function only ever calls `Get`. Refactor so the function depends on the smallest interface it needs, and say what that buys you.",
      hints: ["Prefer small interfaces — a one-method interface like io.Writer is idiomatic.", "Define the interface where it is consumed, listing only the methods used."],
    },
    {
      id: "go3if-design-repository",
      type: "design",
      prompt:
        "Design a minimal AccountRepository interface for LedgerFlow that a service needs to load and save an account, and justify why the service should depend on it rather than on a concrete Postgres store.",
      hints: ["List only the methods the service actually calls.", "What does depending on behavior instead of a concrete type let you swap in tests?"],
    },
    {
      id: "go3if-advanced-typednil-err",
      type: "advanced",
      prompt:
        "A function returns `var e *StoreError = nil` as its `error` result, and callers find `if err != nil` is true even on success. Explain the typed-nil mechanism and give the idiomatic fix.",
      hints: ["Returning a typed nil pointer as an interface stores a non-nil type descriptor.", "Return the untyped `nil` literal directly on the success path instead of a nil typed pointer."],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-implicit",
      kind: "explain",
      description: "Explain what an interface is (a set of method signatures) and why Go satisfies it implicitly, with no `implements` keyword.",
      required: true,
    },
    {
      id: "predict-methodset",
      kind: "predict",
      description: "Predict from a method's receiver whether T or only *T satisfies a given interface.",
      required: true,
    },
    {
      id: "explain-typednil",
      kind: "explain",
      description: "Explain why an interface holding a nil typed pointer is itself not equal to nil, using the (type, value) pair.",
      required: true,
    },
    {
      id: "design-interface",
      kind: "design",
      description: "Design a small, consumer-side interface (e.g. a LedgerFlow repository) and defend keeping it minimal.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "So far your code has always named the *exact* type it works with: a function takes an `Account`, a method lives on `*Account`. That's fine until you need the same code to work with several different types that all do the same *kind* of thing. A logger might write to a file, to the network, or to an in-memory buffer for a test. If you hard-code one concrete type, you can't swap in another without rewriting the function.\n\nGo's answer is the **interface** — a named set of method signatures. An interface describes *what a value can do* (its behavior) instead of *what a value is* (its data). Any type that has those methods can be used wherever the interface is expected, and — this is the part that surprises newcomers — it happens automatically, with no keyword linking the type to the interface.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "An interface is a job description, not a person. 'Anyone who can Read and Write' is the description; a File, a network socket, and a memory buffer are all people who happen to qualify. You hire by the job description and let any qualified worker show up.",
          },
        },
        {
          type: "points",
          items: [
            "An **interface** is a set of method signatures — a contract about behavior, not data.",
            "Any type with those methods **satisfies** the interface, automatically.",
            "Code written against the interface works with every type that qualifies, present and future.",
          ],
        },
      ],
    },
    naive: {
      body: "The instinct from other languages is to look for an `implements` keyword — to explicitly declare 'File implements Reader'. Go has no such keyword, and beginners waste time hunting for it or trying to write it.\n\nThe second naive move is to make interfaces *big* — one giant `Storage` interface with a dozen methods, on the theory that a bigger contract is more useful. It's the opposite: a fat interface is hard to satisfy (a type must implement all dozen methods) and it couples callers to methods they never use.",
      blocks: [
        {
          type: "example",
          example: {
            title: "There is no `implements` — and no need for one",
            language: "go",
            code:
              'type Reader interface {\n    Read(p []byte) (int, error)\n}\n\ntype File struct{ name string }\n\n// File never says "implements Reader". It just has the method.\nfunc (f File) Read(p []byte) (int, error) {\n    return 0, nil\n}\n\nfunc main() {\n    var r Reader = File{} // works: File has Read, so it satisfies Reader\n    _ = r\n}',
            takeaway: "Satisfaction is implicit: having the right methods *is* implementing the interface.",
          },
        },
        {
          type: "points",
          items: [
            "Don't look for `implements` — Go decides satisfaction by matching method signatures.",
            "Don't build fat interfaces — every extra method makes the contract harder to satisfy.",
          ],
        },
      ],
    },
    failure: {
      body: "The mistake that actually bites — and it bites *everyone* eventually — is subtler than a missing keyword. It shows up when an interface value looks nil but isn't. You return a nil pointer as an `error`, your caller checks `if err != nil`, and the check is unexpectedly **true** on a successful call. No panic, no compile error — just an error that appears out of nowhere.\n\nThe cause is that an interface value is not a single thing; it's a *pair* of a concrete type and a value. A nil pointer of a real type fills in the type half, so the interface as a whole is not nil. This is the **typed-nil** trap, and it turns a clean success path into a phantom failure.",
      blocks: [
        {
          type: "scenario",
          scenario: {
            title: "The error that came from nowhere",
            context:
              "A store method returns `var e *StoreError = nil` on success, typed as its `error` return. The caller writes the textbook `if err != nil { return err }`. On a perfectly successful save, that branch fires and the request fails — yet the pointer really was nil.",
            insight: "The interface `err` held (type: *StoreError, value: nil). Its value half was nil, but its type half was not — so `err != nil` was true. The nil pointer was hidden inside a non-nil interface.",
          },
        },
        {
          type: "points",
          items: [
            "An interface value carries both a concrete *type* and a *value*.",
            "A nil pointer of a concrete type makes the type half non-nil, so the interface is not nil.",
          ],
        },
      ],
    },
    intuition: {
      body: "Hold two pictures in mind. First, satisfying an interface is like passing a checklist: the interface lists methods, and if your type has every one of them (right names, right signatures), it's in — no paperwork, no declaration.\n\nSecond, an interface value is a small **two-slot box**: one slot names the concrete type inside (the *type descriptor*), the other holds the actual value. An interface is `nil` only when **both** slots are empty. Put a nil `*Account` into the box and the type slot still says '*Account' — so the box is not empty, even though the value slot is.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "An interface value is a (type, value) pair",
            kind: "compare",
            nodes: [
              {
                id: "trulynil",
                label: "var i error  // never assigned",
                detail: "type slot: empty, value slot: empty → i == nil is TRUE",
                tone: "success",
              },
              {
                id: "typednil",
                label: "var p *StoreError = nil; var i error = p",
                detail: "type slot: *StoreError, value slot: nil → i == nil is FALSE",
                tone: "danger",
              },
            ],
            caption: "The interface is nil only when BOTH slots are empty. A typed nil fills the type slot.",
          },
        },
        {
          type: "points",
          items: [
            "Interface satisfaction = 'has all the listed methods'. No declaration needed.",
            "An interface value = (concrete type, value). Nil only when both halves are empty.",
            "A nil pointer of a real type fills the type half → the interface is not nil.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Carry three rules and the whole topic falls into place. **One:** to see if a type satisfies an interface, ask only 'does it have all these methods?' **Two:** prefer the *smallest* interface that does the job — the standard library's `io.Writer` has exactly one method, and that's a feature, because anything that can write satisfies it. **Three:** an interface value is a (type, value) pair, so 'is this interface nil?' is a different question from 'is the pointer inside it nil?'.\n\nThe smallness rule has a name in Go culture: 'the bigger the interface, the weaker the abstraction'. A one-method interface is trivially satisfied and endlessly reusable; a ten-method interface is a straitjacket.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "Three-question test",
            text: "Does the type have every method? → it satisfies the interface. Is this the smallest contract that works? → prefer it. Am I comparing the interface or the value inside it? → they can differ.",
          },
        },
        {
          type: "example",
          example: {
            title: "Small interfaces are easy to satisfy",
            language: "go",
            code:
              '// The whole io.Writer contract — one method.\ntype Writer interface {\n    Write(p []byte) (n int, err error)\n}\n\n// A file, a network connection, and a bytes.Buffer all have Write,\n// so all three satisfy Writer with zero extra work.\nfunc save(w Writer, data []byte) error {\n    _, err := w.Write(data)\n    return err\n}',
            takeaway: "A one-method interface is satisfied by everything that can do that one thing — maximum reuse.",
          },
        },
      ],
    },
    mechanics: {
      body: "Now the precise pieces. You declare an interface with `type Name interface { ... }`, listing method signatures (name, parameters, results) and no bodies. A type satisfies it by having methods whose signatures match — that's the whole rule.\n\nThe subtlety is the **method set**: the exact list of methods a given type 'has' for interface purposes. A value of type `T` has only the methods declared with a **value receiver** (`func (x T) M()`). A pointer `*T` has **both** value-receiver *and* pointer-receiver methods (`func (x *T) M()`). So if a method uses a pointer receiver, only `*T` — not `T` — carries it, and only `*T` satisfies an interface that needs it. Trying to assign a `T` value there is the classic compile error `T does not implement I (M method has pointer receiver)`.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Method sets decide who satisfies the interface",
            language: "go",
            code:
              'type Depositor interface {\n    Deposit(c int64)\n}\n\ntype Account struct{ BalanceC int64 }\n\n// Pointer receiver → only *Account has this method.\nfunc (a *Account) Deposit(c int64) { a.BalanceC += c }\n\nfunc main() {\n    var d Depositor\n\n    d = &Account{}   // OK: *Account\'s method set includes Deposit\n    // d = Account{}  // COMPILE ERROR: Account (value) lacks Deposit\n    _ = d\n}',
            takeaway: "A pointer-receiver method belongs to *T only. If an interface needs it, satisfy it with *T.",
          },
        },
        {
          type: "diagram",
          diagram: {
            title: "Method sets of T vs *T",
            kind: "compare",
            nodes: [
              {
                id: "valueT",
                label: "value T",
                detail: "method set = value-receiver methods only",
                tone: "muted",
              },
              {
                id: "ptrT",
                label: "pointer *T",
                detail: "method set = value-receiver AND pointer-receiver methods",
                tone: "accent",
              },
            ],
            caption: "*T is a superset: it has every method T has, plus the pointer-receiver ones.",
          },
        },
        {
          type: "points",
          items: [
            "`type I interface { M(...) ... }` lists signatures; matching methods satisfy it.",
            "Method set of `T`: value-receiver methods only. Method set of `*T`: value- and pointer-receiver methods.",
            "A pointer-receiver method → only `*T` satisfies an interface needing it.",
          ],
        },
      ],
    },
    diagram: {
      body: "Study the typed-nil trap as one picture, because reading the mechanism is faster than debugging it at 2am. Follow a nil `*StoreError` as it's assigned to an `error` interface and then compared with `nil`. Watch which slot gets filled and why the comparison lands where it does.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "How a nil pointer becomes a non-nil interface",
            kind: "sequence",
            nodes: [
              { id: "s1", label: "var p *StoreError = nil", detail: "p is a nil pointer of a concrete type" },
              { id: "s2", label: "var err error = p", detail: "interface gets type=*StoreError, value=nil", tone: "accent" },
              { id: "s3", label: "err == nil ?", detail: "type slot is filled → comparison is FALSE", tone: "danger" },
              { id: "s4", label: "if err != nil { ... }", detail: "branch fires on a successful call — the phantom error", tone: "danger" },
            ],
            caption: "Assigning a typed nil pointer to an interface fills the type slot, so the interface is not nil.",
          },
        },
        {
          type: "note",
          note: {
            tone: "warning",
            title: "The rule to memorize",
            text: "`var p *T = nil; var i I = p` makes `i != nil` TRUE. The interface is nil only when it was never given a concrete type at all.",
          },
        },
      ],
    },
    implementation: {
      body: "Put it together end to end. Define a tiny interface, write a concrete type that satisfies it implicitly, and pass the type wherever the interface is expected. Then contrast the two ways a function can return an error so the success path stays truly nil — return the untyped `nil` literal, never a nil typed pointer dressed up as an error.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Define, satisfy, and use a small interface",
            language: "go",
            code:
              'type Notifier interface {\n    Notify(msg string) error\n}\n\ntype EmailNotifier struct{ addr string }\n\n// EmailNotifier satisfies Notifier just by having Notify.\nfunc (e EmailNotifier) Notify(msg string) error {\n    fmt.Printf("email %s: %s\\n", e.addr, msg)\n    return nil\n}\n\n// send depends on behavior, not on EmailNotifier specifically.\nfunc send(n Notifier, msg string) error {\n    return n.Notify(msg)\n}\n\nfunc main() {\n    _ = send(EmailNotifier{addr: "a@b.com"}, "hello")\n}',
            takeaway: "`send` works with any Notifier — swap in an SMSNotifier tomorrow and nothing in send changes.",
          },
        },
        {
          type: "example",
          example: {
            title: "Return untyped nil so success is really nil",
            language: "go",
            code:
              '// WRONG: returns a typed nil pointer as an error.\nfunc saveBad() error {\n    var e *StoreError = nil\n    return e // interface = (*StoreError, nil) → NOT nil to the caller\n}\n\n// RIGHT: return the untyped nil literal on success.\nfunc saveGood() error {\n    return nil // interface = (nil, nil) → truly nil\n}',
            takeaway: "On the success path return the bare `nil`, not a nil pointer of a concrete error type.",
          },
        },
        {
          type: "points",
          items: [
            "Declare a small interface; any type with the methods satisfies it implicitly.",
            "Functions taking the interface work with every satisfying type, including test fakes.",
            "Return the untyped `nil` on success — never a nil typed pointer through an interface return.",
          ],
        },
      ],
    },
    experiment: {
      body: "Predict before you read on — a corrected wrong guess sticks better than a right answer you skim. Consider this program:\n\n`type I interface{ M() }`\n`type T struct{}`\n`func (t *T) M() {}`\n`var p *T = nil`\n`var i I = p`\nthen `fmt.Println(i == nil)`.\n\nWhat prints — `true` or `false`? Commit to an answer.\n\nIt prints **false**. Even though `p` is a nil pointer, assigning it to the interface `i` stored two things: the concrete type `*T` in the type slot and the nil pointer in the value slot. An interface equals `nil` only when *both* slots are empty — here the type slot holds `*T`, so `i` is not nil. Change the program to `var i I` with no assignment and `i == nil` becomes **true**, because now neither slot was ever filled. The single act of assigning a typed value — even a nil one — is what makes the interface non-nil. That is the entire typed-nil trap.",
    },
    "failure-cases": {
      body: "Interface bugs at this level cluster around a short list. Learn the signal each one gives so you recognize it on sight.",
      blocks: [
        {
          type: "points",
          items: [
            "**Returning a typed nil pointer as an error** → `if err != nil` is true on success. Return the untyped `nil` literal instead.",
            "**Assigning a T value where an interface needs a pointer-receiver method** → compile error `T does not implement I (M has pointer receiver)`. Use `&T{}`.",
            "**Comparing the interface to nil when you meant the value inside** → they can differ; a non-nil interface can wrap a nil pointer.",
            "**Fat interfaces** → hard to satisfy and hard to fake in tests. Split into the small pieces callers actually use.",
            "**Looking for an `implements` keyword** → there isn't one; satisfaction is purely by matching methods.",
          ],
        },
        {
          type: "example",
          example: {
            title: "The pointer-receiver compile error",
            language: "go",
            code:
              'type Stringer interface{ String() string }\n\ntype Money struct{ cents int64 }\nfunc (m *Money) String() string { return fmt.Sprintf("%dc", m.cents) }\n\nvar s Stringer = Money{}  // ERROR: Money does not implement Stringer\n                          //        (String method has pointer receiver)\nvar ok Stringer = &Money{} // OK: *Money has String in its method set',
            takeaway: "If the method has a pointer receiver, only `*T` satisfies the interface — assign a pointer.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "Interfaces are a genuine trade-off, not a free win. Each choice buys flexibility at some cost in indirection; pick the one you can defend for the code at hand.",
      blocks: [
        {
          type: "points",
          items: [
            "**Program to an interface**: lets you swap implementations (real vs fake) freely, but adds a layer of indirection and one more name to understand.",
            "**Small interface**: trivially satisfied and easy to fake, but you may end up with several tiny interfaces instead of one big name.",
            "**Value receiver on the method**: both `T` and `*T` satisfy the interface, but the method can't mutate. **Pointer receiver**: can mutate, but only `*T` satisfies — callers must hold a pointer.",
            "**Concrete type directly**: simplest to read when you only ever use one type, but locks the code to it and makes testing harder.",
          ],
        },
        {
          type: "note",
          note: {
            tone: "info",
            title: "Idiom",
            text: "In Go you usually define an interface where it's *consumed*, not where the concrete type lives — and you keep it to the methods that consumer actually calls.",
          },
        },
      ],
    },
    design: {
      body: "Turn the rules into habits. Define interfaces at the point of use, listing only the methods that caller needs — this keeps them small and easy to satisfy. Let types satisfy interfaces implicitly; don't invent registration ceremony. When a method needs a pointer receiver, remember that only `*T` will satisfy the interface, and design your call sites to hold pointers. And guard every interface-typed error return so the success path returns a genuine, untyped nil.",
      blocks: [
        {
          type: "points",
          items: [
            "Define the interface where it's consumed; include only the methods that consumer calls.",
            "Prefer small interfaces — one or two methods beats a fat contract.",
            "If a satisfying method has a pointer receiver, plan for callers to hold `*T`.",
            "Return untyped `nil` on success; never leak a typed nil through an interface return.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Designing LedgerFlow's repository interface",
            context: "A transfer service needs to load two accounts and save them back. The Postgres store has fifteen methods, but the service calls only Get and Save.",
            insight: "Define a two-method AccountRepository next to the service. Postgres satisfies it implicitly, an in-memory fake satisfies it in tests, and the service depends on neither directly.",
          },
        },
      ],
    },
    ledgerflow: {
      body: "This is exactly how LedgerFlow keeps its business logic testable and its database swappable. A transfer service doesn't take a concrete Postgres struct; it takes a small `AccountRepository` interface with just the methods it needs — say `Get(id) (*Account, error)` and `Save(*Account) error`. The real Postgres store satisfies it implicitly, and in tests an in-memory fake satisfies the same interface, so the service can run without a database.\n\nThe typed-nil trap is the ledger's landmine here. A store method that returns `var e *StoreError = nil` on success will make every caller's `if err != nil` fire — a transfer would be reported as failed even though it committed. Returning the untyped `nil` on the success path is what keeps 'did the save succeed?' an honest question.",
      blocks: [
        {
          type: "example",
          example: {
            title: "A small repository interface with a real and a fake implementation",
            language: "go",
            code:
              'type AccountRepository interface {\n    Get(id string) (*Account, error)\n    Save(a *Account) error\n}\n\n// Real store (satisfies the interface implicitly).\ntype PostgresStore struct{ /* db handle */ }\nfunc (s *PostgresStore) Get(id string) (*Account, error) { /* ... */ return &Account{}, nil }\nfunc (s *PostgresStore) Save(a *Account) error         { /* ... */ return nil }\n\n// In-memory fake for tests (also satisfies it).\ntype FakeStore struct{ accounts map[string]*Account }\nfunc (f *FakeStore) Get(id string) (*Account, error) { return f.accounts[id], nil }\nfunc (f *FakeStore) Save(a *Account) error          { f.accounts[a.ID] = a; return nil }\n\n// The service depends only on the interface.\nfunc transfer(repo AccountRepository, from, to string, c int64) error {\n    // load, move money, save — repo could be Postgres or the fake\n    return nil\n}',
            takeaway: "One small interface lets the same transfer logic run against Postgres in production and a fake in tests.",
          },
        },
        {
          type: "diagram",
          diagram: {
            title: "Service depends on behavior, not on Postgres",
            kind: "flow",
            nodes: [
              { id: "svc", label: "transfer service", detail: "calls Get and Save" },
              { id: "iface", label: "AccountRepository", detail: "2-method contract", tone: "accent" },
              { id: "pg", label: "PostgresStore", detail: "satisfies it (production)" },
              { id: "fake", label: "FakeStore", detail: "satisfies it (tests)", tone: "success" },
            ],
            caption: "Both stores satisfy the same small interface, so the service never names a database type.",
          },
        },
      ],
    },
    exercises: {
      body: "Practice turns 'I recognize this' into 'I can predict and build it'. Work across prediction, code-reading, implementation, debugging, refactoring, design, and one advanced typed-nil puzzle. Each kind produces different evidence, so clearing one doesn't cover the rest — the typed-nil prediction in particular is worth doing before you ever hit it in real code.",
    },
    mastery: {
      body: "You've mastered this lesson when four signals hold without notes: you can explain what an interface is and why Go satisfies it implicitly with no `implements` keyword; predict from a method's receiver whether `T` or only `*T` satisfies an interface; explain why an interface holding a nil typed pointer is itself not equal to nil, using the (type, value) pair; and design a small consumer-side interface and defend keeping it minimal. Check a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "Two ideas carry this lesson: an **interface** is a contract of method signatures that Go satisfies **implicitly**, and an interface **value is a (type, value) pair** — which is why a nil pointer can hide inside a non-nil interface. Keep interfaces small, remember that pointer-receiver methods live only on `*T`, and return untyped `nil` on success, and the typed-nil bug stops being a mystery.",
      blocks: [
        {
          type: "points",
          items: [
            "An interface is a set of method signatures — behavior, not data — satisfied implicitly.",
            "Prefer small interfaces; one-method contracts like io.Writer are the ideal.",
            "Method set: `T` has value-receiver methods; `*T` has both — so pointer-receiver methods need `*T`.",
            "An interface value is (type, value); it's nil only when both are empty — a typed nil is not nil.",
            "Return untyped `nil` on success. Next up: errors and how Go models failure as values.",
          ],
        },
      ],
    },
  },
};
