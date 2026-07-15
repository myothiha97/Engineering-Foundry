import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 4, dependency direction & consumer-side interfaces — decide WHICH
 * package should own an interface, and answer it the Go way: the consumer
 * defines the small interface it needs, and the concrete implementation depends
 * inward on it. Same beginner-friendly voice as Modules 0–3: plain language,
 * one analogy per hard idea, a concrete example before the abstract rule.
 */
export const goDependencyDirection: Lesson = {
  id: "go-dependency-direction",
  slug: "dependency-direction",
  title: "Dependency direction & interfaces at the consumer",
  description:
    "Decide which package owns an interface. The Go answer: the consumer defines the small interface it needs, so high-level policy stays independent of the database, files, and HTTP clients that implement it.",
  moduleId: "go-4",
  estimatedMinutes: 55,
  difficulty: "intermediate",
  prerequisites: ["go-interfaces"],
  learningObjectives: [
    "Explain why the consumer, not the producer, should define an interface, and point dependencies inward",
    "Apply 'accept interfaces, return structs' and keep interfaces small and defined where they are used",
    "Design package boundaries so the domain imports nothing from the storage package",
  ],
  concepts: ["dependency-inversion", "consumer-interfaces", "package-design"],
  references: [
    {
      title: "Effective Go — Interfaces",
      url: "https://go.dev/doc/effective_go#interfaces",
      teaches:
        "Idiomatic interface design: implicit satisfaction and the preference for small, focused interfaces.",
      relevance:
        "Grounds the 'keep interfaces small and let types satisfy them implicitly' rule this lesson builds on.",
      required: false,
      section: "Interfaces and methods",
    },
    {
      title: "Go Code Review Comments — Interfaces",
      url: "https://go.dev/wiki/CodeReviewComments",
      teaches:
        "The convention that interfaces belong in the package that uses them, not the one that implements them.",
      relevance:
        "The authoritative statement of consumer-side interfaces and 'return concrete types' this lesson centers on.",
      required: false,
      section: "Interfaces",
    },
    {
      title: "Go Blog — Package names",
      url: "https://go.dev/blog/package-names",
      teaches:
        "How to name and scope packages so each has a clear, single purpose and a clean import surface.",
      relevance:
        "Supports drawing package boundaries so the domain stays independent of infrastructure packages.",
      required: false,
      section: "Package names",
    },
  ],
  exercises: [
    {
      id: "go4dd-predict-import",
      type: "prediction",
      prompt:
        "A `service` package defines `type accountStore interface { Get(id string) (Account, error) }` and a `postgres` package defines `*Store` with that method. Predict which package must import the other, and which imports nothing from its partner.",
      expectedAnswer:
        "The postgres package imports the service package (for the Account type and to satisfy the contract in spirit), while the service package imports nothing from postgres. The interface lives with the consumer, so the concrete implementation depends inward on the domain — not the other way around.",
      hints: [
        "The interface is declared in the consumer (service), so the consumer never names the concrete type.",
        "Dependencies point toward the stable domain, not toward infrastructure.",
      ],
    },
    {
      id: "go4dd-read-consumer-iface",
      type: "code-reading",
      prompt:
        "You see `type accountStore interface { Get(id string) (Account, error) }` at the top of `service.go`, and `postgres.Store` never mentions `accountStore` anywhere. Explain how the store still satisfies the interface and why this arrangement is deliberate.",
      hints: [
        "Go satisfies interfaces implicitly — no `implements` keyword and no import needed to 'register'.",
        "Defining the interface in the consumer keeps the producer unaware of who uses it.",
      ],
    },
    {
      id: "go4dd-implement-store-iface",
      type: "implementation",
      prompt:
        "Inside the service package, define the smallest interface a `TransferService` needs to load and save an account, then write a constructor that accepts it. Keep the interface local to the consumer.",
      starterCode:
        "package service\n\ntype Account struct {\n  ID       string\n  BalanceC int64 // cents\n}\n\n// TODO: define a small consumer-side interface the service needs,\n// then a NewTransferService constructor that accepts it.\n\ntype TransferService struct {\n  // TODO\n}",
      expectedAnswer:
        "type accountStore interface {\n  Get(id string) (Account, error)\n  Save(a Account) error\n}\n\ntype TransferService struct {\n  store accountStore\n}\n\nfunc NewTransferService(store accountStore) *TransferService {\n  return &TransferService{store: store}\n}",
      hints: [
        "List only Get and Save — the methods this service actually calls.",
        "Accept the interface in the constructor; the concrete store is passed in from main.",
      ],
    },
    {
      id: "go4dd-debug-wrong-direction",
      type: "debugging",
      prompt:
        "A `domain` package imports a `postgres` package so it can name `postgres.Store` in a field. The team can no longer test the domain without a database, and a new file backend forces edits to domain code. Explain the dependency-direction mistake and fix it.",
      hints: [
        "The dependency points the wrong way: domain depends on infrastructure.",
        "Move the interface into the domain and depend on it; let postgres satisfy it from the outside.",
      ],
    },
    {
      id: "go4dd-refactor-fat-producer",
      type: "refactoring",
      prompt:
        "A `storage` package exports a 12-method `Repository` interface 'just in case', and every consumer imports it even though each uses two or three methods. Refactor toward consumer-side interfaces and say what coupling this removes.",
      hints: [
        "Delete the producer-side interface; let storage export the concrete `*Store` instead.",
        "Each consumer declares its own small interface listing only the methods it calls.",
      ],
    },
    {
      id: "go4dd-design-boundary",
      type: "design",
      prompt:
        "Design the package layout for a task-list feature so its rules are independent of the database. Name the packages, say where the interface lives, and state the direction of every import.",
      hints: [
        "Interface in the service/domain package; concrete store in a postgres package.",
        "postgres imports the domain; the domain imports nothing from postgres.",
      ],
    },
    {
      id: "go4dd-advanced-cycle",
      type: "advanced",
      prompt:
        "Putting the interface in the producer package created an import cycle: `service` imports `postgres` for the interface, and `postgres` imports `service` for the domain types. Explain why consumer-side interfaces break the cycle, and give the idiomatic layout.",
      hints: [
        "Go forbids import cycles — two packages cannot import each other.",
        "If only one package (postgres) imports the other (service), there is no cycle. Move the interface to the consumer.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-direction",
      kind: "explain",
      description:
        "Explain why the consumer defines the interface and why dependencies should point inward toward the domain, not outward toward infrastructure.",
      required: true,
    },
    {
      id: "predict-imports",
      kind: "predict",
      description:
        "Given a service and a store package, predict which imports which and which package stays free of the other.",
      required: true,
    },
    {
      id: "implement-consumer-iface",
      kind: "implement",
      description:
        "Define a small consumer-side interface and a constructor that accepts it, with the concrete type wired in from main.",
      required: true,
    },
    {
      id: "design-boundary",
      kind: "design",
      description:
        "Design a package boundary where the domain imports nothing from storage and defend the import direction.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "In the last lesson you learned that a small interface lets a service depend on behavior instead of a concrete type. That raises a question the previous lesson didn't answer: *which package should own the interface?* You have a `service` package with the business rules and a `postgres` package that talks to the database. The interface has to be declared somewhere — but where?\n\nThe answer decides how your whole program is wired. Put it in the wrong place and your business logic ends up importing your database code, which means you can't test the logic without a database and you can't change the database without editing the logic. Put it in the right place and the two stay independent, each free to change on its own.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "A wall socket is a contract defined by the room, not by the appliance. The room says 'anything with this plug shape works here'; a lamp, a charger, and a kettle all fit. The socket (the consumer of power delivery) owns the shape — the appliances conform to it. If every appliance defined its own socket, the room would need a hole for each one.",
          },
        },
        {
          type: "points",
          items: [
            "Two packages need to agree on a contract: the **consumer** (service) and the **producer** (postgres store).",
            "The interface can live in either package — and the choice changes which package depends on which.",
            "Getting it wrong couples your business logic to your database; getting it right keeps them independent.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Carry three rules and every 'where does this interface go?' question answers itself. **One:** define the interface *where it's used*, not where it's implemented — the consumer owns the contract. **Two:** 'accept interfaces, return structs' — functions take the small interface they need and return concrete types, so callers get everything without being boxed in. **Three:** point dependencies *inward*, toward the stable domain; infrastructure (databases, files, HTTP clients) sits on the outside and depends inward.\n\nThe payoff has a name: the domain package imports *nothing* from the storage package. Storage implements the domain's interface, so the arrow runs from storage into the domain — never the other way.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "Three-question test",
            text: "Who calls this contract? → put the interface there. Am I returning a value? → return the concrete struct, not an interface. Which way does the import point? → inward, toward the domain.",
          },
        },
        {
          type: "example",
          example: {
            title: "Accept interfaces, return structs",
            language: "go",
            code: "// Accept a small interface: callers can pass any store.\nfunc NewTransferService(store accountStore) *TransferService {\n    return &TransferService{store: store} // return the concrete struct\n}\n\n// accountStore is the consumer's local contract.\ntype accountStore interface {\n    Get(id string) (Account, error)\n    Save(a Account) error\n}",
            takeaway:
              "Accepting an interface keeps callers flexible; returning a concrete `*TransferService` gives them the full type without hiding it behind an abstraction.",
          },
        },
      ],
    },
    mechanics: {
      body: "Here's the precise arrangement. The consumer package declares an **unexported** interface (lowercase name, e.g. `accountStore`) listing only the methods it calls. It never imports the producer. The producer package declares a concrete type (`*Store`) with those methods and — because Go satisfies interfaces implicitly — automatically qualifies, without importing the consumer's interface or writing any `implements` clause.\n\nThe wiring happens in `main` (or another composition point): `main` imports both packages, constructs the concrete `postgres.Store`, and passes it into the service's constructor, where it's accepted as the interface. The producer usually *does* import the domain for shared types like `Account`, so imports run one way — from infrastructure into the domain — and Go's ban on import cycles is never triggered.",
      blocks: [
        {
          type: "example",
          example: {
            title: "The consumer defines the contract it needs",
            language: "go",
            code: "// package service — the CONSUMER\npackage service\n\n// Small, unexported, defined right where it is used.\ntype accountStore interface {\n    Get(id string) (Account, error)\n    Save(a Account) error\n}\n\ntype TransferService struct {\n    store accountStore // depends on behavior, not on *postgres.Store\n}\n\nfunc (s *TransferService) Move(from, to string, cents int64) error {\n    src, err := s.store.Get(from)\n    if err != nil {\n        return err\n    }\n    // ...move money, then save...\n    return s.store.Save(src)\n}",
            takeaway:
              "`service` names no database type. It depends only on the two methods it actually calls.",
          },
        },
        {
          type: "diagram",
          diagram: {
            title: "Import direction across packages",
            kind: "flow",
            nodes: [
              { id: "main", label: "main", detail: "imports both; wires them together" },
              {
                id: "pg",
                label: "postgres.Store",
                detail: "imports service for Account",
                tone: "accent",
              },
              {
                id: "svc",
                label: "service (owns accountStore)",
                detail: "imports nothing outward",
                tone: "success",
              },
            ],
            caption:
              "Arrows point inward: main and postgres depend on service; service depends on neither.",
          },
        },
        {
          type: "points",
          items: [
            "Consumer declares a small, often unexported interface listing only the methods it uses.",
            "Producer's concrete type satisfies it implicitly — no import of the interface, no `implements`.",
            "`main` imports both and injects the concrete type where the interface is expected.",
          ],
        },
      ],
    },
    diagram: {
      body: "Study the two layouts side by side, because the difference is entirely about which way the arrows run. In the producer-owned version, the arrow from `service` reaches *out* to `postgres` — policy depends on detail. In the consumer-owned version, the arrow from `postgres` reaches *in* to `service` — detail depends on policy. Trace each import and watch which package could be compiled and tested completely on its own.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Dependency inversion, before and after",
            kind: "sequence",
            nodes: [
              {
                id: "s1",
                label: "Before: interface in postgres",
                detail: "service must import postgres to see it",
              },
              {
                id: "s2",
                label: "service ──▶ postgres",
                detail: "policy depends on the database package",
                tone: "danger",
              },
              {
                id: "s3",
                label: "After: interface in service",
                detail: "postgres imports service for Account; service is self-contained",
              },
              {
                id: "s4",
                label: "postgres ──▶ service",
                detail: "database depends on the domain — inverted",
                tone: "success",
              },
            ],
            caption:
              "Moving the interface into the consumer reverses the arrow: the domain becomes the stable center.",
          },
        },
        {
          type: "note",
          note: {
            tone: "warning",
            title: "The rule to memorize",
            text: "If your domain package appears in the import list of your storage package, good. If your storage package appears in the import list of your domain package, the arrow is backwards.",
          },
        },
      ],
    },
    implementation: {
      body: "Put it together end to end: a consumer that owns its interface, a producer that satisfies it without knowing, and a `main` that wires them. Notice that `postgres` imports `service` for the `Account` type but never mentions `accountStore` — implicit satisfaction means the store doesn't need to see the interface to fulfill it. The service, in turn, imports nothing from `postgres`, so it compiles and tests entirely on its own.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Producer satisfies the consumer's interface implicitly",
            language: "go",
            code: '// package postgres — the PRODUCER\npackage postgres\n\nimport "example.com/app/service" // for the Account type\n\ntype Store struct{ /* db handle */ }\n\n// These methods happen to match service.accountStore exactly.\nfunc (s *Store) Get(id string) (service.Account, error) {\n    return service.Account{ID: id}, nil // ...real query...\n}\nfunc (s *Store) Save(a service.Account) error {\n    return nil // ...real upsert...\n}',
            takeaway:
              "`postgres.Store` never names `accountStore`. It satisfies the contract just by having the right methods.",
          },
        },
        {
          type: "example",
          example: {
            title: "main wires the concrete store into the service",
            language: "go",
            code: 'package main\n\nimport (\n    "example.com/app/postgres"\n    "example.com/app/service"\n)\n\nfunc main() {\n    store := &postgres.Store{}                 // concrete producer\n    svc := service.NewTransferService(store)   // accepted as accountStore\n    _ = svc.Move("a1", "a2", 500)\n}',
            takeaway:
              "Only `main` knows both packages. The service and the store never import each other's concrete details.",
          },
        },
        {
          type: "points",
          items: [
            "Consumer owns the interface and imports nothing outward.",
            "Producer imports the domain for shared types, satisfies the interface implicitly.",
            "`main` is the single composition point that injects the concrete type.",
          ],
        },
      ],
    },
    experiment: {
      body: "Predict before you read on — a corrected wrong guess sticks better than a right answer you skim. Suppose you move `accountStore` *out* of the `service` package and into the `postgres` package, so it becomes `postgres.AccountStore`. The `service` package now imports `postgres` to reference the interface, and `postgres` still imports `service` for the `Account` type.\n\nDoes this compile? Commit to yes or no.\n\nIt does **not** compile — Go reports an *import cycle*. `service` imports `postgres` (for the interface) and `postgres` imports `service` (for `Account`), and Go forbids two packages from importing each other. This isn't a style preference the compiler is enforcing; it's a hard rule that falls straight out of putting the interface on the wrong side.\n\nMove the interface back into `service` and the cycle vanishes: now only `postgres` imports `service`, a single inward arrow, and everything builds. The compiler is quietly pushing you toward the correct dependency direction — consumer-side interfaces are the layout that even *typechecks*.",
    },
    "failure-cases": {
      body: "Bad dependency direction produces a recognizable set of symptoms. Learn the signal each one gives so you catch it before it spreads.",
      blocks: [
        {
          type: "points",
          items: [
            "**Domain imports the database package** → you can't unit-test the domain without a database. Move the interface into the domain.",
            "**Import cycle between service and store** → compile error; the interface is on the producer side. Move it to the consumer.",
            "**Fat 'just in case' producer interface** → callers couple to methods they never use, and every fake must stub all of them. Split into small consumer-side interfaces.",
            "**Returning an interface instead of a struct** → callers lose access to methods not on the interface. Return the concrete type; accept interfaces only as parameters.",
            "**Adding a new backend forces domain edits** → the abstraction lives in the wrong package. With the interface in the consumer, a new backend is a new implementer, no domain change.",
          ],
        },
        {
          type: "example",
          example: {
            title: "Return structs, not interfaces",
            language: "go",
            code: "// AWKWARD: hides the concrete type; callers can only use interface methods.\nfunc NewStore() accountStore { return &postgres.Store{} }\n\n// IDIOMATIC: return the concrete type; callers keep full access.\nfunc NewStore() *postgres.Store { return &postgres.Store{} }",
            takeaway:
              "Accept interfaces as inputs for flexibility, but return concrete structs so callers aren't boxed into a narrow contract.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "Consumer-side interfaces are the idiomatic default, but they're still a trade-off. Know what each choice costs so you can defend the one you pick.",
      blocks: [
        {
          type: "points",
          items: [
            "**Interface at the consumer**: keeps the domain independent and testable, but the same store may end up satisfying several small interfaces across different consumers.",
            "**Interface at the producer**: convenient when many packages truly share one contract, but couples every consumer to the producer package.",
            "**Small interfaces**: trivially satisfied and easy to fake, but you maintain several tiny contracts instead of one central one.",
            "**No interface at all (use the concrete type)**: simplest to read when there's exactly one implementation and no test double, but locks the caller to that type.",
          ],
        },
        {
          type: "note",
          note: {
            tone: "info",
            title: "Idiom",
            text: "Don't create an interface until a consumer actually needs to vary the implementation. Start with the concrete type; introduce the small interface at the point of use the moment you need a second implementer (often a test fake).",
          },
        },
      ],
    },
    design: {
      body: "Turn the rules into habits. Define each interface in the package that consumes it, listing only the methods that consumer calls — this keeps it small and keeps the producer unaware of its callers. Accept interfaces as parameters and return concrete structs. Draw your package boundaries so infrastructure depends inward on the domain and the domain depends on nothing external. And resist the urge to add an interface before a second implementation exists — the concrete type is fine until then.",
      blocks: [
        {
          type: "points",
          items: [
            "Define interfaces where they're consumed; include only the methods that consumer calls.",
            "Accept interfaces, return structs.",
            "Point every import inward: infrastructure → domain, never domain → infrastructure.",
            "Introduce an interface only when a real second implementer (or test fake) appears.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Designing a storage boundary",
            context:
              "The task feature needs to load and save tasks. The team debates whether to put the `Repository` interface in a shared `storage` package or next to the service that uses it.",
            insight:
              "Define a two-method `accountStore` inside `service`. The `postgres` package implements it and imports `service` for `Account`; `service` imports nothing from `postgres`. The domain stays testable and the database stays swappable.",
          },
        },
      ],
    },
    mastery: {
      body: "You have mastered this lesson when you can explain why the consumer owns the interface and predict which package imports which.\n\nYou should also be able to implement a small consumer-side interface, wire a concrete implementation from `main`, and defend a package boundary where the domain imports nothing from storage. Use the criteria below as the evidence; opening the lesson alone does not count.",
    },
    summary: {
      body: "One rule carries this lesson: **the consumer defines the interface it needs, and dependencies point inward toward the domain.** Keep interfaces small and declare them where they're used, accept interfaces but return structs, and let infrastructure depend on the domain rather than the other way around. Do that and your business logic stays testable without a database, and your database stays swappable without touching the business logic.",
      blocks: [
        {
          type: "points",
          items: [
            "Define the interface where it's consumed, not where it's implemented.",
            "Accept interfaces, return structs.",
            "Point imports inward: infrastructure depends on the domain; the domain depends on nothing external.",
            "Keep interfaces small; introduce one only when a real second implementer appears.",
            "The core rules do not import storage code; the outer storage package implements the small contract they require.",
          ],
        },
      ],
    },
  },
};
