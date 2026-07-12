import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 3, embedding & composition — put a type into a struct without a field
 * name so its fields and methods are PROMOTED to the outer type. Same
 * beginner-friendly voice as Modules 0, 1 and 2: plain language, one analogy per
 * hard idea, a concrete example before every rule. The recurring warning:
 * embedding is forwarding, not inheritance — the embedded value never knows it
 * lives inside something bigger.
 */
export const goEmbedding: Lesson = {
  id: "go-embedding",
  slug: "embedding",
  title: "Embedding & composition",
  description:
    "Go has no inheritance. Instead it has embedding: drop a type into a struct with no field name and its fields and methods are promoted to the outer type — composition that forwards, not a subclass that overrides.",
  moduleId: "go-3",
  estimatedMinutes: 50,
  difficulty: "intermediate",
  prerequisites: ["go-interfaces"],
  learningObjectives: [
    "Embed a type in a struct and call the outer type's promoted fields and methods",
    "Explain why embedding is composition (has-a forwarding), not inheritance (is-a with overriding)",
    "Predict which method wins when the outer type and an embedded type both define it, and when promotion is ambiguous",
  ],
  concepts: ["embedding", "composition", "promotion"],
  ledgerFlowApplications: [
    "Layer HTTP middleware by embedding a base handler and adding one behavior around it",
    "Build a logging decorator that embeds a Store and forwards every method except the one it wraps",
    "Compose a read-write ledger interface from separate Reader and Writer interfaces via interface embedding",
  ],
  references: [
    {
      title: "Effective Go — Embedding",
      url: "https://go.dev/doc/effective_go#embedding",
      teaches:
        "How struct and interface embedding promote fields and methods, and why Go offers embedding instead of subclassing.",
      relevance:
        "The authoritative prose on exactly this lesson's topic, including the io.ReadWriter interface-embedding example.",
      required: true,
      section: "Embedding",
    },
    {
      title: "Go language spec — Struct types",
      url: "https://go.dev/ref/spec#Struct_types",
      teaches:
        "The precise rules for embedded (anonymous) fields, the promotion of their fields and methods, and when promotion is ambiguous.",
      relevance:
        "The exact rules behind shadowing and ambiguous-promotion errors covered in the failure-cases stage.",
      required: true,
      section: "Struct types; Promoted fields and methods",
    },
    {
      title: "A Tour of Go: Method promotion via embedding",
      url: "https://go.dev/tour/methods/10",
      teaches: "A minimal, runnable illustration of an embedded type contributing methods to the outer type.",
      relevance: "The gentlest official example to reinforce the core promotion idea before the harder cases.",
      required: false,
      section: "Interfaces and methods",
    },
  ],
  exercises: [
    {
      id: "go3em-predict-promotion",
      type: "prediction",
      prompt:
        "`Logger` has a method `Log(s string)`. `Server` embeds `Logger` (no field name). You write `srv.Log(\"up\")` where srv is a Server. Predict whether this compiles and what runs, and say why.",
      expectedAnswer:
        "It compiles and runs Logger's Log on the embedded Logger value. Because Logger is embedded, its method Log is promoted to Server, so srv.Log(\"up\") is shorthand for srv.Logger.Log(\"up\"). Go forwards the call to the embedded value.",
      hints: ["An embedded type has no field name — what name does Go give it?", "Promotion means you can call the method on the outer type directly."],
    },
    {
      id: "go3em-read-shadow",
      type: "code-reading",
      prompt:
        "`Base` has `func (b Base) Name() string { return \"base\" }`. `Widget` embeds `Base` and also defines `func (w Widget) Name() string { return \"widget\" }`. Read `w.Name()` and explain which string comes back and why.",
      hints: ["When the outer type defines a method with the same name, it shadows the promoted one.", "The embedded Base.Name is still reachable — how would you call it explicitly?"],
    },
    {
      id: "go3em-implement-decorator",
      type: "implementation",
      prompt:
        "Implement a LoggingStore that embeds a Store and overrides only Save to log before delegating to the embedded Store. Get and Delete must keep working untouched via promotion.",
      starterCode:
        'package main\n\nimport "fmt"\n\ntype Store interface {\n  Save(id string)\n  Get(id string)\n  Delete(id string)\n}\n\ntype memStore struct{}\n\nfunc (memStore) Save(id string)   { fmt.Println("saved", id) }\nfunc (memStore) Get(id string)    { fmt.Println("got", id) }\nfunc (memStore) Delete(id string) { fmt.Println("deleted", id) }\n\n// LoggingStore should embed a Store, log on Save, then delegate.\n// Get and Delete should be promoted automatically (do not redefine them).\ntype LoggingStore struct {\n  // TODO: embed a Store here\n}\n\n// TODO: define Save so it logs then calls the embedded Store\'s Save\n\nfunc main() {\n  var s Store = LoggingStore{Store: memStore{}}\n  s.Save("a1") // want: a log line, then "saved a1"\n  s.Get("a1")  // want: "got a1" (promoted, untouched)\n}',
      expectedAnswer:
        'type LoggingStore struct {\n  Store // embedded interface\n}\n\nfunc (l LoggingStore) Save(id string) {\n  fmt.Println("log: saving", id)\n  l.Store.Save(id) // delegate to the embedded value\n}',
      hints: [
        "Embed the Store interface with no field name; Get and Delete are promoted for free.",
        "Define only Save on LoggingStore — it shadows the promoted Save — and call l.Store.Save(id) to forward.",
      ],
    },
    {
      id: "go3em-debug-ambiguous",
      type: "debugging",
      prompt:
        "`Combined` embeds both `A` and `B`, and each defines a method `Ping()`. The program compiles fine until you add a line `c.Ping()`. Explain the error and fix it.",
      hints: ["Two embedded types promote the same method name — the compiler can't pick one.", "Ambiguous promotion is only an error when you actually use it; qualify the call as c.A.Ping() or define Ping on Combined."],
    },
    {
      id: "go3em-refactor-inheritance",
      type: "refactoring",
      prompt:
        "A developer coming from Java wrote a Base struct with a `Describe()` method that calls `b.kind()`, expecting an embedding type to override kind() and have Describe pick it up (virtual dispatch). It doesn't. Refactor to a design that actually works in Go and explain why the original can't.",
      hints: ["The embedded Base has no reference to the outer type — there is no super and no virtual dispatch.", "Pass the behavior in explicitly (an interface field or a function), rather than expecting the base to call back up."],
    },
    {
      id: "go3em-design-interface-embedding",
      type: "design",
      prompt:
        "Design a ReadWriteLedger interface for LedgerFlow by embedding two smaller interfaces rather than listing every method in one big interface. State what this buys you and one cost.",
      hints: ["io.ReadWriter is literally `interface { Reader; Writer }` — follow that shape.", "Small interfaces compose and are easier to implement and mock; the cost is one more name to track."],
    },
    {
      id: "go3em-advanced-method-set",
      type: "advanced",
      prompt:
        "If `Base` has a method with a POINTER receiver `func (b *Base) Touch()`, and `Widget` embeds `Base` (by value, not `*Base`), is `Touch` promoted onto a `Widget` value? What about onto a `*Widget`? Explain using method sets.",
      hints: ["A pointer-receiver method is only in the method set of the addressable/pointer form.", "The promoted method set of *Widget includes *Base's methods; a non-addressable Widget value does not get Touch."],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-composition",
      kind: "explain",
      description:
        "Explain in plain words why embedding is composition (has-a forwarding), not inheritance, and what 'promotion' means.",
      required: true,
    },
    {
      id: "predict-shadowing",
      kind: "predict",
      description:
        "Correctly predict which method runs when the outer type shadows a promoted method, and when promotion is ambiguous.",
      required: true,
    },
    {
      id: "implement-decorator",
      kind: "implement",
      description:
        "Write a decorator that embeds a type, overrides one method, and lets the rest be promoted — and it compiles cleanly.",
      required: true,
    },
    {
      id: "design-interface-embedding",
      kind: "design",
      description: "Compose a larger interface from smaller embedded interfaces and defend the split.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "You've built a `Logger` with a `Log` method and a `Store` with `Save`, `Get`, and `Delete`. Now you want a new type that behaves *exactly* like `Store` but writes a log line before each save. In a language with classes you'd reach for inheritance: `class LoggingStore extends Store`, override `save`, done.\n\nGo has no classes and no inheritance — there is no `extends`. So how do you reuse all of `Store`'s behavior and change just one method, without copying every method by hand? Go's answer is **embedding**: you drop one type inside another with no field name, and the inner type's fields and methods become callable on the outer type as if they were its own.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "Embedding is like hiring an assistant and putting their desk inside your office. When someone asks you to file a document, you don't do it yourself — you turn to the assistant at the embedded desk and they handle it. Callers address *you*; the work is *forwarded*. You are not a kind of assistant; you *have* one.",
          },
        },
        {
          type: "points",
          items: [
            "**Embedding**: place a type in a struct with no field name.",
            "**Promotion**: the embedded type's fields and methods become callable directly on the outer type.",
            "This is **composition** (the outer type *has* the inner one), not inheritance (the outer type *is* the inner one).",
          ],
        },
      ],
    },
    naive: {
      body: "The first instinct, coming from other languages, is to look for `extends` — a way to say 'LoggingStore is a Store and inherits its methods'. Go simply doesn't have it, so that door is closed.\n\nThe second instinct is to give up on reuse and write a wrapper by hand: a struct with a named `inner Store` field, then re-declare `Save`, `Get`, and `Delete` on the wrapper so each one calls `w.inner.Save(...)` and so on. It works, but it's pure boilerplate — you rewrite every method just to forward it, and the day someone adds a method to `Store` you have to remember to forward that one too.",
      blocks: [
        {
          type: "example",
          example: {
            title: "The hand-written forwarding wrapper (boilerplate)",
            language: "go",
            code:
              'type LoggingStore struct {\n    inner Store // a NAMED field\n}\n\n// Every method must be re-declared just to forward it.\nfunc (l LoggingStore) Save(id string) {\n    fmt.Println("log: saving", id)\n    l.inner.Save(id)\n}\nfunc (l LoggingStore) Get(id string)    { l.inner.Get(id) }    // pure forwarding\nfunc (l LoggingStore) Delete(id string) { l.inner.Delete(id) } // pure forwarding',
            takeaway: "A named field means you hand-forward every method — even the ones you don't want to change.",
          },
        },
        {
          type: "points",
          items: [
            "There is no `extends` in Go — inheritance isn't available.",
            "A named field works but forces you to re-declare every method just to forward it.",
          ],
        },
      ],
    },
    failure: {
      body: "The hand-written wrapper isn't wrong, but it fails you where it hurts: maintenance. Because each forwarding method is written out by hand, the compiler can't tell you when you've missed one. Add a `Count()` method to the `Store` interface and your `LoggingStore` silently stops satisfying it — and if `LoggingStore` is only ever used behind the concrete type, you might not notice until a call site breaks.\n\nThe deeper trap is conceptual, and it bites hardest for people arriving from Java or Python: assuming Go *does* have inheritance in disguise, and expecting a 'base' method to call back into an 'override'. It never does. Whatever mechanism you pick, if you carry the inheritance mental model into Go, your predictions about which code runs will be wrong.",
      blocks: [
        {
          type: "scenario",
          scenario: {
            title: "The forwarding method nobody remembered",
            context:
              "A LoggingStore hand-forwards Save, Get, and Delete. Months later a Count method is added to the Store interface and to memStore. The team assumes LoggingStore 'wraps a Store, so it's covered' — but no one added a Count forwarder. LoggingStore quietly no longer satisfies Store, and a `var s Store = LoggingStore{...}` assignment fails to compile at a distant call site.",
            insight: "Hand-forwarding puts the burden on human memory. Embedding moves that burden to the compiler: new methods are promoted automatically.",
          },
        },
        {
          type: "points",
          items: [
            "Hand-forwarding rots: new methods on the wrapped type aren't forwarded until someone remembers.",
            "The costlier failure is mental: expecting inheritance-style overriding that Go does not have.",
          ],
        },
      ],
    },
    intuition: {
      body: "Replace both instincts with one picture. When you embed a type — write it in the struct with *no field name* — Go still gives it a field, and the field's name is the type's own name. So embedding `Logger` gives you a field you can reach as `srv.Logger`. The new part is **promotion**: you can also skip that middle name and call `srv.Log(...)` directly, and Go quietly forwards it to `srv.Logger.Log(...)`.\n\nCrucially, forwarding runs on the *embedded value*. The embedded `Logger` has no idea it lives inside a `Server`; it just does its own job when called. That is the whole difference from inheritance in one sentence: **the inner type never looks up at the outer type.** There is no `super`, no virtual dispatch, no callback into an 'override'.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Embedding promotes; the call forwards down, never up",
            kind: "flow",
            nodes: [
              { id: "call", label: "srv.Log(\"up\")", detail: "called on the outer Server", tone: "accent" },
              { id: "promote", label: "promotion", detail: "shorthand for srv.Logger.Log(\"up\")" },
              { id: "embed", label: "srv.Logger", detail: "the embedded value (field named after its type)" },
              { id: "run", label: "Logger.Log runs", detail: "on the Logger; it never sees Server", tone: "success" },
            ],
            caption: "Promotion lets you call the method on the outer type; Go forwards down to the embedded value, which never knows about the outer type.",
          },
        },
        {
          type: "points",
          items: [
            "An embedded field's implicit name is its type name: `srv.Logger`.",
            "Promotion lets you write `srv.Log(...)` and Go forwards to `srv.Logger.Log(...)`.",
            "The call runs on the embedded value — the inner type never references the outer one.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Carry one sentence with you: **embedding is automatic forwarding, not subclassing.** Read every embedded type as 'this outer type *has* one of these and lends out its methods', never 'this outer type *is* one of these'.\n\nThat reframing answers the hard questions on its own. Which method runs if both types define `Name()`? The outer one — because it's a real method on the outer type, and a promoted method is only a fallback for a name the outer type doesn't define. Can a base method call an overridden one? No — the embedded value can't see up, so there's nothing to call. When you feel the urge to reach 'up' from an embedded type, that's the signal you wanted inheritance, and the Go move is to pass the behavior in explicitly instead.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "The one-line test",
            text: "Say it out loud: does the outer type HAVE the inner one (composition — embed it) or IS it the inner one (inheritance — Go can't do that, rethink the design)? If any part of your plan needs the base to call back into a subclass, you've left Go's model.",
          },
        },
        {
          type: "diagram",
          diagram: {
            title: "Inheritance vs embedding",
            kind: "compare",
            nodes: [
              {
                id: "inherit",
                label: "Inheritance (not in Go)",
                detail: "Subclass IS-A base. Base methods dispatch virtually into overrides via super/vtable — base sees the subclass.",
                tone: "muted",
              },
              {
                id: "embed",
                label: "Embedding (Go)",
                detail: "Outer HAS-A inner. Methods are promoted and forwarded to the inner value, which never sees the outer.",
                tone: "accent",
              },
            ],
            caption: "Same reuse goal, fundamentally different mechanism: dispatch up vs forward down.",
          },
        },
      ],
    },
    mechanics: {
      body: "Now the precise pieces. Inside a struct, an **embedded field** is written as just a type with no name: `Logger` instead of `log Logger`. Its implicit field name is the unqualified type name (`Logger`, or for `pkg.Type` just `Type`). Every exported field and method of the embedded type is **promoted**: reachable on the outer type unless the outer type declares something with the same name.\n\nTwo rules govern conflicts. First, **depth wins**: a field or method declared directly on the outer type (depth 0) shadows one promoted from an embedded type (depth 1). Second, **same-depth ties are ambiguous**: if two embedded types both promote `Ping()` at the same depth and the outer type doesn't define its own, `c.Ping()` is a compile error — but only *when you use it*; merely embedding both is fine. You resolve it by qualifying (`c.A.Ping()`) or by declaring `Ping` on the outer type. Interfaces embed too: `interface { Reader; Writer }` produces an interface with the union of both method sets.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Embedded field, its implicit name, and promotion",
            language: "go",
            code:
              'type Logger struct{ prefix string }\n\nfunc (l Logger) Log(s string) { fmt.Println(l.prefix, s) }\n\ntype Server struct {\n    Logger      // embedded: no field name\n    Addr string // ordinary named field\n}\n\nfunc main() {\n    srv := Server{Logger: Logger{prefix: "[srv]"}, Addr: ":8080"}\n    srv.Log("starting")       // promoted: same as srv.Logger.Log("starting")\n    fmt.Println(srv.prefix)   // promoted field: same as srv.Logger.prefix\n    fmt.Println(srv.Logger.prefix) // the explicit form still works\n}',
            takeaway: "Embed with a bare type name; its exported fields and methods are promoted, and the embedded value is still reachable as srv.Logger.",
          },
        },
        {
          type: "example",
          example: {
            title: "Interface embedding: build big from small",
            language: "go",
            code:
              'type Reader interface{ Read(p []byte) (int, error) }\ntype Writer interface{ Write(p []byte) (int, error) }\n\n// The standard library\'s io.ReadWriter is literally this:\ntype ReadWriter interface {\n    Reader // embed the interface\n    Writer // embed the interface\n}\n// ReadWriter now requires BOTH Read and Write.',
            takeaway: "Embedding an interface unions its method set — small interfaces compose into larger ones with no duplication.",
          },
        },
        {
          type: "points",
          items: [
            "Embedded field = a bare type name; its implicit name is the unqualified type name.",
            "Promotion exposes the embedded type's exported fields and methods on the outer type.",
            "Depth wins (outer shadows promoted); same-depth conflicts are an error only *when used*.",
            "Interface embedding unions method sets: `interface { Reader; Writer }`.",
          ],
        },
      ],
    },
    diagram: {
      body: "Study shadowing as a lookup, because that's exactly what the compiler does. When you write `w.Name()`, Go searches for `Name` starting at the outer type (depth 0) and only descends into embedded types (depth 1, 2, …) if it isn't found. The first depth at which it finds the name wins; a tie at that depth with no winner is the ambiguity error. Trace both columns below.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Name lookup: shadowing vs ambiguity",
            kind: "compare",
            nodes: [
              {
                id: "shadow",
                label: "Outer defines Name() too",
                detail: "Depth 0 has Name → outer wins. w.Name() runs Widget.Name; the promoted Base.Name is a fallback reachable only as w.Base.Name().",
                tone: "accent",
              },
              {
                id: "ambiguous",
                label: "Two embedded types define Ping()",
                detail: "Depth 0 has no Ping; two matches at depth 1 tie → c.Ping() is a compile error. Fix: qualify c.A.Ping() or define Ping on the outer type.",
                tone: "danger",
              },
            ],
            caption: "Resolution is by depth: the shallowest single match wins; a shallowest tie with no outer definition is an error, but only when the name is actually used.",
          },
        },
      ],
    },
    implementation: {
      body: "Put it together in the decorator you set out to build. `LoggingStore` embeds the `Store` interface, so it satisfies `Store` for free — `Get` and `Delete` are promoted straight to the embedded value. Then you declare only `Save` on `LoggingStore`; because it's a real method at depth 0, it shadows the promoted `Save`, and inside it you forward to `l.Store.Save(id)` after logging.\n\nNotice what you did *not* write: no `Get`, no `Delete`, no re-declaration of anything you didn't want to change. Add a method to `Store` tomorrow and `LoggingStore` promotes it automatically. That's embedding earning its keep.",
      blocks: [
        {
          type: "example",
          example: {
            title: "A logging decorator via embedding",
            language: "go",
            code:
              'type Store interface {\n    Save(id string)\n    Get(id string)\n    Delete(id string)\n}\n\ntype LoggingStore struct {\n    Store // embed the interface: Get and Delete are promoted\n}\n\n// Override ONLY Save; it shadows the promoted Save.\nfunc (l LoggingStore) Save(id string) {\n    fmt.Println("log: saving", id)\n    l.Store.Save(id) // forward to the wrapped store\n}\n\nfunc main() {\n    var s Store = LoggingStore{Store: memStore{}}\n    s.Save("a1") // "log: saving a1" then memStore\'s "saved a1"\n    s.Get("a1")  // "got a1" — promoted, untouched\n}',
            takeaway: "Embed to inherit behavior, declare one method to override it, and forward with l.Store.Save — the rest is promoted for free.",
          },
        },
        {
          type: "points",
          items: [
            "Embed the interface so the wrapper satisfies it automatically.",
            "Declare only the method you want to change; it shadows the promoted one.",
            "Forward explicitly via the embedded field (`l.Store.Save(id)`).",
          ],
        },
      ],
    },
    experiment: {
      body: "Predict before you read on — a corrected wrong guess sticks better than a right answer you skim. Consider a design that looks like classic inheritance:\n\n`type Animal struct{}` with `func (a Animal) Describe() string { return \"I am a \" + a.Sound() }` and `func (a Animal) Sound() string { return \"...\" }`. Then `type Dog struct { Animal }` embeds Animal and *also* defines `func (d Dog) Sound() string { return \"woof\" }`.\n\nYou call `d.Describe()` on a Dog. Does it return `\"I am a woof\"` (Dog's Sound) or `\"I am a ...\"` (Animal's Sound)? Commit to an answer.\n\nIt returns **\"I am a ...\"**. `Describe` is a method on `Animal`, and inside it `a` *is* an `Animal` — a plain embedded value that has no idea a `Dog` wraps it. So `a.Sound()` resolves to `Animal.Sound`, not `Dog.Sound`. There is no virtual dispatch and no `super`: the embedded value never looks up. If you truly need `Describe` to use the outer type's `Sound`, you can't get it from embedding — you pass the behavior in, e.g. give `Describe` a `Sound()`-providing interface as a parameter. This one prediction is the entire 'embedding is not inheritance' lesson made concrete.",
    },
    "failure-cases": {
      body: "Most embedding bugs at this level come from a short list of recurring mistakes. Here are the ones you'll actually meet, and the signal each gives you.",
      blocks: [
        {
          type: "points",
          items: [
            "**Expecting virtual dispatch** → a base method calls its own version, not your 'override'; the embedded value can't see the outer type. Pass behavior in explicitly.",
            "**Ambiguous promotion** → `ambiguous selector c.Ping` when two embedded types promote the same name at the same depth. Qualify (`c.A.Ping()`) or define it on the outer type.",
            "**Forgetting to forward in an override** → you shadow `Save` but never call `l.Store.Save`, so the wrapped work silently doesn't happen.",
            "**Embedding by value when you meant to share** → embedding `Base` copies it; embedding `*Base` shares one. Pointer-receiver methods are only promoted onto the pointer form.",
            "**Nil embedded interface** → embedding an interface whose value is nil compiles, then panics on the first promoted call. Initialize the embedded field.",
          ],
        },
        {
          type: "example",
          example: {
            title: "Ambiguity is an error only when used",
            language: "go",
            code:
              'type A struct{}\nfunc (A) Ping() string { return "a" }\ntype B struct{}\nfunc (B) Ping() string { return "b" }\n\ntype Combined struct { A; B } // compiles fine on its own\n\nfunc main() {\n    c := Combined{}\n    // c.Ping()      // compile error: ambiguous selector c.Ping\n    fmt.Println(c.A.Ping()) // "a" — qualify to disambiguate\n}',
            takeaway: "Embedding two types that share a method name is legal; the error only fires when you call the ambiguous name unqualified.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "Embedding is a real trade-off, not a free win. It buys concise reuse and automatic forwarding, but it also widens your type's surface and can surprise readers who expect inheritance. Pick it deliberately.",
      blocks: [
        {
          type: "points",
          items: [
            "**Embedding vs a named field**: embedding promotes everything automatically (great for decorators); a named field exposes nothing and forces explicit forwarding (great when you want a small, controlled surface).",
            "**Convenience vs encapsulation**: promotion leaks *all* the embedded type's exported methods onto yours, whether or not they make sense for the outer type — a bigger, sometimes leakier API.",
            "**Interface embedding**: composing small interfaces keeps them easy to implement and mock, at the cost of one more named interface to track.",
            "**Familiarity cost**: readers from OOP languages may misread embedding as inheritance and expect overriding to dispatch up — a comment or clear naming pays off.",
          ],
        },
      ],
    },
    design: {
      body: "Turn the rules into durable habits. Reach for embedding when the outer type genuinely *is composed of* the inner one and you want its behavior forwarded — decorators, middleware, and 'a Server that also logs' are the sweet spot. Prefer a named field when you want to hide the inner type and expose only a curated few methods. Keep interfaces small and compose the big ones by embedding, the way the standard library builds `io.ReadWriter` from `Reader` and `Writer`. And whenever you catch yourself wanting the base to call the derived type, stop — that's inheritance, and the Go answer is to inject the behavior explicitly.",
      blocks: [
        {
          type: "points",
          items: [
            "Embed for forwarding/reuse (decorators, middleware); use a named field to keep a tight, curated surface.",
            "Build large interfaces by embedding small ones; keep each small interface single-purpose.",
            "If you need dispatch 'up' into the outer type, inject behavior via an interface field or function — don't fake inheritance.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Choosing embedding for LedgerFlow middleware",
            context: "LedgerFlow needs an audited version of its Store that records who changed what, without touching the existing store code. The team embeds Store in an AuditStore and overrides only the mutating methods (Save, Delete), leaving reads promoted.",
            insight: "Embedding is the right tool because AuditStore genuinely HAS a Store and wants to forward most of it — and new read methods on Store are promoted automatically, so the audit layer never falls behind.",
          },
        },
      ],
    },
    ledgerflow: {
      body: "This is exactly how LedgerFlow layers cross-cutting behavior. Its HTTP handlers and its storage both use embedding to add one concern at a time without rewriting the thing underneath. An `AuditStore` embeds the plain `Store` and overrides only `Save` and `Delete` to append an audit record before forwarding; every read method is promoted untouched. A `LoggingHandler` embeds a base handler and wraps just `ServeHTTP`. Stack them and you get middleware — each layer embeds the next and changes one method.\n\nInterface embedding shows up on the domain side: LedgerFlow's `Ledger` interface is composed from a `Reader` (balance queries) and a `Writer` (posting transactions), mirroring `io.ReadWriter`. Code that only reads takes a `Reader`; code that posts takes the full `Ledger`. The payoff is the same one embedding gives everywhere: reuse behavior by composition, override the one method that matters, and let the compiler carry the rest forward.",
      blocks: [
        {
          type: "example",
          example: {
            title: "An audit decorator over the ledger's Store",
            language: "go",
            code:
              'type Store interface {\n    Save(id string, amountC int64)\n    Get(id string) int64\n    Delete(id string)\n}\n\ntype AuditStore struct {\n    Store            // embed: Get is promoted, untouched\n    who   string\n}\n\n// Override only the mutating methods; forward after auditing.\nfunc (a AuditStore) Save(id string, amountC int64) {\n    fmt.Printf("audit: %s saved %s = %d\\n", a.who, id, amountC)\n    a.Store.Save(id, amountC)\n}\nfunc (a AuditStore) Delete(id string) {\n    fmt.Printf("audit: %s deleted %s\\n", a.who, id)\n    a.Store.Delete(id)\n}',
            takeaway: "AuditStore embeds Store, overrides the two writes, and promotes Get for free — composition adds a concern without rewriting the store.",
          },
        },
        {
          type: "diagram",
          diagram: {
            title: "Stacking behavior by embedding",
            kind: "stack",
            nodes: [
              { id: "log", label: "LoggingStore", detail: "embeds the layer below; wraps Save", tone: "accent" },
              { id: "audit", label: "AuditStore", detail: "embeds the layer below; wraps Save & Delete" },
              { id: "mem", label: "memStore", detail: "the real storage; does the work", tone: "success" },
            ],
            caption: "Each layer embeds the next and overrides one method — middleware built from composition, not a class hierarchy.",
          },
        },
      ],
    },
    exercises: {
      body: "Practice is what turns 'I recognize this' into 'I can predict and build it'. Work across prediction, code-reading, implementation, debugging, refactoring, design, and one advanced method-set puzzle. Each produces a different kind of evidence, so finishing one doesn't cover the others — especially the ones that probe the difference between embedding and inheritance.",
    },
    mastery: {
      body: "You've mastered this lesson when four signals hold without notes: you can explain why embedding is composition (has-a forwarding) and not inheritance, and what promotion means; correctly predict which method runs when the outer type shadows a promoted one and when promotion is ambiguous; write a decorator that embeds a type, overrides one method, and lets the rest be promoted; and compose a larger interface from smaller embedded ones and defend the split. Check a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "One idea carries this whole lesson: **embedding is composition, not inheritance.** Drop a type into a struct with no field name and its fields and methods are *promoted* — callable on the outer type, which forwards them down to the embedded value. The outer type shadows any name it defines itself; two embedded types that promote the same name clash only when you use it. The embedded value never looks up at the outer type, so there is no `super` and no virtual dispatch — when you want that, inject the behavior instead.",
      blocks: [
        {
          type: "points",
          items: [
            "Embed a type with no field name; its exported fields and methods are promoted to the outer type.",
            "Promotion forwards the call down to the embedded value — composition (has-a), never inheritance (is-a).",
            "Outer definitions shadow promoted ones (depth wins); same-depth name clashes error only when used.",
            "Interface embedding unions method sets: `interface { Reader; Writer }` builds `io.ReadWriter`.",
            "No super, no virtual dispatch: the embedded value can't see the outer type — inject behavior when you need dispatch 'up'.",
          ],
        },
      ],
    },
  },
};
