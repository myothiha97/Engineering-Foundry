import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 7 — mocks, fakes & test doubles. Same beginner-friendly voice as the
 * earlier modules: plain language, one analogy per hard idea, a concrete example
 * before the abstract rule. Careful about the vocabulary (stub vs fake vs mock
 * vs spy), the Go idiom of consumer-defined small interfaces + dependency
 * injection, and the correctness traps of over-mocking and mocking types you
 * don't own. Ties directly back to go-interfaces (implicit satisfaction) and the
 * LedgerFlow Service→Store split.
 */
export const goMocksFakes: Lesson = {
  id: "go-mocks-fakes",
  slug: "mocks-fakes",
  title: "Mocks, fakes & test doubles",
  description:
    "Substitute a dependency in a test with a stand-in — a stub, a fake, or a mock — by injecting a small consumer-defined interface, so you can test business rules fast without a real database.",
  moduleId: "go-7",
  estimatedMinutes: 50,
  difficulty: "advanced",
  prerequisites: ["go-interfaces"],
  learningObjectives: [
    "Name the common test doubles — stub, fake, mock, and spy — and pick the right one for a given test",
    "Inject a dependency as a small, consumer-defined interface so tests can pass a stand-in instead of the real thing",
    "Write a hand-written in-memory fake that satisfies a Store interface and use it to test a service's business rules",
    "Recognise over-mocked, brittle tests and refactor them toward testing behaviour instead of interactions",
  ],
  concepts: ["mocks", "fakes", "interfaces", "dependency-injection"],
  ledgerFlowApplications: [
    "Define the Store interface next to the service that consumes it, not next to the database code",
    "Test LedgerFlow's balance and overdraft rules against an in-memory fake store, with no Postgres running",
    "Use a recording mock only where a test genuinely needs to prove a specific call happened (e.g. an audit write)",
  ],
  references: [
    {
      title: "Effective Go — Interfaces",
      url: "https://go.dev/doc/effective_go#interfaces",
      teaches:
        "How interfaces are satisfied implicitly in Go, so any type with the right methods — including a test fake — fits without declaring it.",
      relevance:
        "Implicit satisfaction is exactly what lets you swap a real dependency for a fake in tests with no extra wiring.",
      required: true,
      section: "Interfaces and other types",
    },
    {
      title: "Go Code Review Comments — Interfaces",
      url: "https://go.dev/wiki/CodeReviewComments#interfaces",
      teaches:
        "The \"accept interfaces, return structs\" guidance and that interfaces belong in the consuming package, not the implementing one.",
      relevance:
        "This is the rule that makes doubles easy: the consumer defines a small interface, so tests can supply any stand-in.",
      required: true,
      section: "Interfaces",
    },
    {
      title: "The Go Blog — Errors are values / interface design (Go blog on interfaces)",
      url: "https://go.dev/blog/errors-are-values",
      teaches:
        "How designing to small behavioural interfaces keeps code composable and testable rather than tied to a concrete type.",
      relevance:
        "Reinforces why narrow interfaces (often one method) are what you inject and fake, not sprawling ones.",
      required: false,
      section: "Interface design",
    },
    {
      title: "stretchr/testify — mock package",
      url: "https://github.com/stretchr/testify",
      teaches:
        "A popular assertion and mocking library, including testify/mock for recording calls and asserting expectations.",
      relevance:
        "Shows what a mock framework offers and where a hand-written double is simpler — the judgement this lesson builds.",
      required: false,
      section: "mock",
    },
  ],
  exercises: [
    {
      id: "go7mf-predict-fake",
      type: "prediction",
      prompt:
        "A `TransferService` depends on a `Store` interface. In a test you pass an in-memory fake seeded with account A holding 100. You call `Transfer(A, B, 30)`. Predict what the fake's stored balance for A is afterwards, and why the test never touches Postgres.",
      expectedAnswer:
        "A holds 70. The service calls the same Store methods regardless of which implementation is behind the interface; the fake updates its in-memory map instead of a database, so the business rule (debit 30) runs exactly as in production but with no DB. The test is fast and deterministic.",
      hints: [
        "The service only knows the interface, not whether the real DB or a fake is behind it.",
        "The fake implements the same methods — it just stores state in a map.",
      ],
    },
    {
      id: "go7mf-read-doubles",
      type: "code-reading",
      prompt:
        "Read the three stand-ins below and name each as stub, fake, or mock. (a) always returns `Account{Balance: 100}, nil` and ignores its arguments; (b) keeps a `map[string]Account`, so Save then Get round-trips; (c) records every call and later fails the test if Save was not called exactly once. Justify each label.",
      starterCode:
        "// (a)\nfunc (s stubStore) Get(id string) (Account, error) { return Account{Balance: 100}, nil }\n\n// (b)\nfunc (f *fakeStore) Save(a Account) error { f.m[a.ID] = a; return nil }\nfunc (f *fakeStore) Get(id string) (Account, error) { return f.m[id], nil }\n\n// (c)\nfunc (m *mockStore) Save(a Account) error { m.saveCalls++; return nil }\n// test: if m.saveCalls != 1 { t.Fatalf(\"want 1 Save, got %d\", m.saveCalls) }",
      expectedAnswer:
        "(a) is a stub: it returns a fixed canned answer and has no real behaviour. (b) is a fake: a working lightweight implementation you can Save into and Get back out of. (c) is a mock: it records calls and the test verifies an expectation (Save happened exactly once).",
      hints: [
        "Stub = canned answer; fake = working simplified implementation; mock = records/verifies calls.",
        "Ask: does it store real state? does the test assert on how it was called?",
      ],
    },
    {
      id: "go7mf-implement-fake",
      type: "implementation",
      prompt:
        "Given the `Store` interface and `AccountService` below, write an in-memory fake `fakeStore` that satisfies `Store`, then write a test that seeds account \"a\" with balance 100, calls `svc.Withdraw(\"a\", 40)`, and asserts the stored balance is 60 and that withdrawing 1000 returns an insufficient-funds error.",
      starterCode:
        "package bank\n\ntype Account struct {\n\tID      string\n\tBalance int\n}\n\ntype Store interface {\n\tGet(id string) (Account, error)\n\tSave(a Account) error\n}\n\ntype AccountService struct{ store Store }\n\nfunc NewAccountService(s Store) *AccountService { return &AccountService{store: s} }\n\nfunc (s *AccountService) Withdraw(id string, amount int) error {\n\tacc, err := s.store.Get(id)\n\tif err != nil {\n\t\treturn err\n\t}\n\tif acc.Balance < amount {\n\t\treturn ErrInsufficientFunds\n\t}\n\tacc.Balance -= amount\n\treturn s.store.Save(acc)\n}",
      expectedAnswer:
        "package bank\n\nimport (\n\t\"errors\"\n\t\"testing\"\n)\n\ntype fakeStore struct{ m map[string]Account }\n\nfunc newFakeStore() *fakeStore { return &fakeStore{m: map[string]Account{}} }\n\nfunc (f *fakeStore) Get(id string) (Account, error) {\n\tacc, ok := f.m[id]\n\tif !ok {\n\t\treturn Account{}, errors.New(\"not found\")\n\t}\n\treturn acc, nil\n}\n\nfunc (f *fakeStore) Save(a Account) error {\n\tf.m[a.ID] = a\n\treturn nil\n}\n\nfunc TestWithdraw(t *testing.T) {\n\tstore := newFakeStore()\n\tstore.m[\"a\"] = Account{ID: \"a\", Balance: 100}\n\tsvc := NewAccountService(store)\n\n\tif err := svc.Withdraw(\"a\", 40); err != nil {\n\t\tt.Fatalf(\"unexpected error: %v\", err)\n\t}\n\tif got := store.m[\"a\"].Balance; got != 60 {\n\t\tt.Fatalf(\"balance = %d, want 60\", got)\n\t}\n\tif err := svc.Withdraw(\"a\", 1000); !errors.Is(err, ErrInsufficientFunds) {\n\t\tt.Fatalf(\"err = %v, want ErrInsufficientFunds\", err)\n\t}\n}",
      hints: [
        "The fake just needs the two methods Get and Save operating on a map — no database.",
        "Assert on the resulting state (the balance) and on the returned error, not on how many times Save was called.",
      ],
    },
    {
      id: "go7mf-refactor-inject",
      type: "refactoring",
      prompt:
        "The service below constructs its own `*sql.DB` inside `Withdraw`, so a test can only run against a real database. Refactor it to depend on a small consumer-defined `Store` interface injected through the constructor, so a fake can be passed in tests. Describe the change in words and show the new struct and constructor.",
      starterCode:
        "type AccountService struct{}\n\nfunc (s *AccountService) Withdraw(id string, amount int) error {\n\tdb, err := sql.Open(\"postgres\", os.Getenv(\"DATABASE_URL\"))\n\tif err != nil {\n\t\treturn err\n\t}\n\t// ... run SQL directly against db ...\n\treturn nil\n}",
      expectedAnswer:
        "Define the interface where it is used (the service package) and inject it:\n\ntype Store interface {\n\tGet(id string) (Account, error)\n\tSave(a Account) error\n}\n\ntype AccountService struct{ store Store }\n\nfunc NewAccountService(s Store) *AccountService { return &AccountService{store: s} }\n\nfunc (s *AccountService) Withdraw(id string, amount int) error {\n\tacc, err := s.store.Get(id)\n\tif err != nil {\n\t\treturn err\n\t}\n\tif acc.Balance < amount {\n\t\treturn ErrInsufficientFunds\n\t}\n\tacc.Balance -= amount\n\treturn s.store.Save(acc)\n}\n\nIn production you pass a Postgres-backed Store; in tests you pass an in-memory fake. The service no longer knows or cares which.",
      hints: [
        "Move the dependency out of the method and into a struct field set by the constructor.",
        "Define the Store interface in the consumer package, not next to the DB code (accept interfaces, return structs).",
      ],
    },
    {
      id: "go7mf-design-fake-vs-mock",
      type: "design",
      prompt:
        "You are testing `Transfer(from, to, amount)`, which debits one account, credits another, and writes one audit-log entry. For (1) verifying the balances end up correct and (2) proving an audit entry was written, decide whether a fake or a mock fits each, and justify.",
      expectedAnswer:
        "(1) Balances: use a fake store. You care about the resulting state, so let the fake round-trip Save/Get and assert the final balances — behaviour, not calls. (2) Audit entry: a mock (or spy) fits, because the observable outcome you care about IS that a specific call happened. Verify the audit writer was called once with the expected entry. Rule of thumb: fake when you can assert on state, mock when the interaction itself is the contract.",
      hints: [
        "Prefer asserting on state (balances) over asserting on calls.",
        "When the only thing you can observe is 'the call happened', that is where a mock/spy earns its place.",
      ],
    },
    {
      id: "go7mf-debug-brittle",
      type: "debugging",
      prompt:
        "This test passes today but breaks the moment anyone reorders or adds a harmless call, even when Transfer still produces correct balances. Explain why it is brittle and how to fix it.",
      starterCode:
        "m := &mockStore{}\nm.On(\"Get\", \"a\").Return(Account{Balance: 100}, nil).Once()\nm.On(\"Get\", \"b\").Return(Account{Balance: 0}, nil).Once()\nm.On(\"Save\", mock.Anything).Return(nil).Times(2)\nsvc := NewTransferService(m)\nsvc.Transfer(\"a\", \"b\", 30)\nm.AssertExpectations(t) // fails if call count/order/args differ at all",
      expectedAnswer:
        "It is over-specified: it pins down exact call counts and arguments for every interaction, so any internal refactor that still yields correct balances (an extra Get, a reordered Save, a cached read) fails the test. The test asserts on interactions, not behaviour. Fix: use an in-memory fake and assert on the resulting balances (a ends at 70, b at 30). Reserve mocks for the one interaction that truly is the contract, and match arguments loosely there.",
      hints: [
        "Over-mocking couples the test to the implementation, not the behaviour.",
        "Swap to a fake and check final state; only verify calls when the call itself is what you're testing.",
      ],
    },
    {
      id: "go7mf-advanced-dont-own",
      type: "advanced",
      prompt:
        "A teammate wants to mock `*sql.DB` (a type from the standard library your code doesn't own) directly in tests. Explain why 'don't mock types you don't own' applies, and describe the idiomatic alternative.",
      expectedAnswer:
        "Mocking a type you don't own means guessing and freezing its behaviour — a huge, evolving surface whose real semantics your mock will drift from, giving green tests against wrong assumptions. Instead, wrap the dependency behind your own small interface (e.g. a Store with just the methods your service uses). Your production Store adapts *sql.DB; your test supplies a fake of your interface. You only ever double an interface you defined, keeping it narrow and truthful.",
      hints: [
        "A mock of a foreign type encodes your assumptions about code you can't control.",
        "Define a small interface you own and fake that; the real implementation adapts the third-party type.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-doubles",
      kind: "explain",
      description:
        "Explain, without notes, the difference between a stub, a fake, a mock, and a spy, and give one situation where each is the right choice.",
      required: true,
    },
    {
      id: "predict-fake-state",
      kind: "predict",
      description:
        "Given a service backed by an in-memory fake, correctly predict the fake's resulting state after a business operation runs.",
      required: true,
    },
    {
      id: "implement-fake",
      kind: "implement",
      description:
        "Write an in-memory fake that satisfies a consumer-defined Store interface and a test that uses it to exercise a service's business rules with no real database.",
      required: true,
    },
    {
      id: "design-double-choice",
      kind: "design",
      description:
        "Given a feature to test, choose between a fake and a mock and defend the choice by whether you can assert on state or must assert on an interaction.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "You want to test the *rules* of your code — an overdraft is rejected, a transfer moves the right amount — but those rules live in code that talks to a database, a payment API, or the clock. Testing them for real is slow (spin up Postgres), flaky (the network hiccups), and awkward (how do you make a card decline on demand?). So your rule-testing gets tangled up with infrastructure that has nothing to do with the rule.\n\nThe fix is a **test double**: a stand-in you pass to your code in place of the real dependency. Your service can't tell the difference — it just calls the same methods — but the double is fast, predictable, and under your control. The skill is knowing which *kind* of double to use, and wiring your code so swapping one in is trivial. In Go, that wiring is a small interface plus dependency injection.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "A test double is a stunt double in a film. The lead actor (your real database) is expensive and can't safely do the dangerous scene on cue. The stunt double looks the same from the camera's angle (same methods) and does exactly the risky thing you need, exactly when you need it. The camera — your service — never knows.",
          },
        },
        {
          type: "points",
          items: [
            "A **test double** stands in for a real dependency during a test.",
            "It makes rule-testing fast, deterministic, and controllable — no real DB or network.",
            "The enabling trick in Go: depend on a small **interface**, then pass a double that satisfies it.",
          ],
        },
      ],
    },
    naive: {
      body: "The first instinct is to reach for a mocking framework and 'mock everything.' You generate a mock for every dependency, script every call it should receive, and assert on all of them. It feels rigorous — look how much the test checks!\n\nThe other naive move is the opposite: don't use doubles at all, and just test against the real database because 'that's what runs in production.' Both instincts cause pain. Heavy mocking produces tests that break on every refactor; real-dependency tests are slow and flaky. The middle path — a simple hand-written fake behind a small interface — is what experienced Go code reaches for first.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Over-mocking: a test that checks the wrong thing",
            language: "go",
            code:
              "// Scripts every interaction and asserts on all of them.\nm := &mockStore{}\nm.On(\"Get\", \"a\").Return(Account{Balance: 100}, nil).Once()\nm.On(\"Save\", mock.Anything).Return(nil).Once()\nsvc := NewAccountService(m)\nsvc.Withdraw(\"a\", 40)\nm.AssertExpectations(t) // passes only if the calls happened EXACTLY as scripted",
            takeaway:
              "This test asserts *how* Withdraw talks to the store, not *what* it achieves. Change the implementation without changing behaviour and it breaks anyway.",
          },
        },
        {
          type: "points",
          items: [
            "\"Mock everything\" makes tests that mirror the implementation, so they break when it changes.",
            "\"Never use doubles\" makes tests slow and flaky by dragging real infrastructure in.",
            "A small hand-written fake behind a narrow interface usually beats both.",
          ],
        },
      ],
    },
    failure: {
      body: "The heavy-mocking failure is insidious because the tests are green today. You refactor `Withdraw` — maybe it now reads the account once and reuses it instead of calling `Get` twice, with identical behaviour — and a dozen tests go red. Not because anything broke, but because they asserted on the *exact* calls. You've built tests that punish improvement.\n\nThe real cause is a category error: the test verified **interactions** (which methods were called, in what order, with what args) when it should have verified **behaviour** (the balance ended up correct). Interaction tests are only right when the interaction itself is the observable outcome. Everywhere else, they turn your test suite into cement around the current implementation.",
      blocks: [
        {
          type: "scenario",
          scenario: {
            title: "The refactor that broke 30 green tests",
            context:
              "A team mocked the store in every service test and asserted exact call counts. A cleanup changed how many times the service read the store internally — same inputs, same outputs, same balances. Thirty tests failed. Nobody's behaviour changed; only the call pattern did.",
            insight:
              "The tests were coupled to the implementation, not the contract. Had they used a fake and asserted on final balances, the refactor would have sailed through — as it should, because behaviour was unchanged.",
          },
        },
      ],
    },
    intuition: {
      body: "Here's the mental image. Your service is a machine with a socket in its side labelled `Store`. Anything shaped to fit that socket plugs in — the real Postgres-backed store in production, a lightweight in-memory one in tests. The machine runs the same way regardless of what's plugged in; it only knows the socket's shape.\n\nThat 'socket' is a small **interface**, and 'plugging in' is **dependency injection** — you hand the dependency to the service from outside rather than the service building it itself. Because Go satisfies interfaces *implicitly* (any type with the right methods fits, no `implements` keyword), your test's fake plugs into the socket for free. No framework, no registration — just a struct with the right methods.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "The socket and the plug",
            text: "The interface is the socket (defined by the machine that uses it). The real store and the fake store are two different plugs that both fit. Dependency injection is the act of choosing which plug to insert — and tests choose the fake.",
          },
        },
        {
          type: "points",
          items: [
            "Depend on an **interface** (the socket), not a concrete type.",
            "**Inject** the dependency from outside (constructor or field) instead of constructing it inside.",
            "Go's **implicit** interface satisfaction means a test fake fits with zero extra wiring.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Keep four words straight, because people use them loosely and it causes real confusion:\n\n- **Stub** — returns a canned answer. `Get` always returns balance 100. No logic, no state. Use it when the code just needs *something* back to proceed.\n- **Fake** — a working, lightweight implementation. An in-memory `map` store where `Save` then `Get` round-trips. It behaves correctly enough to trust, just without the heavy backing. This is your default.\n- **Mock** — records the calls it received and lets the test *verify expectations* about them (\"Save was called once with this arg\"). Use it when the interaction is the thing you're testing.\n- **Spy** — like a mock but lighter: it just records what happened (e.g. a counter) so you can inspect it afterwards, without an expectation-scripting DSL.\n\nThe umbrella term for all of them is **test double**. If you remember one thing: reach for a **fake** by default, and use a **mock/spy** only when the call itself is the outcome you care about.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "The family of test doubles",
            kind: "compare",
            nodes: [
              {
                id: "stub",
                label: "Stub",
                detail: "Canned answer, no state. `Get` → always returns 100. Use to satisfy a dependency you don't care about here.",
                tone: "muted",
              },
              {
                id: "fake",
                label: "Fake",
                detail: "Working lightweight implementation (in-memory map). Save/Get round-trips. Your default — assert on state.",
                tone: "success",
              },
              {
                id: "mock",
                label: "Mock",
                detail: "Records calls and verifies expectations (\"Save called once\"). Use when the interaction IS the contract.",
                tone: "accent",
              },
              {
                id: "spy",
                label: "Spy",
                detail: "Records what happened (a counter) for later inspection — a lightweight mock without the expectation DSL.",
                tone: "default",
              },
            ],
            caption: "All four are 'test doubles.' Default to a fake; escalate to a mock or spy only when you must assert on the call itself.",
          },
        },
        {
          type: "note",
          note: {
            tone: "info",
            title: "State vs interaction",
            text: "A fake lets you test *state*: run the operation, then check what's stored. A mock lets you test *interaction*: check that a particular call happened. Prefer state — it survives refactors. Reach for interaction only when there's no observable state to check (an audit write, a fire-and-forget notification).",
          },
        },
      ],
    },
    mechanics: {
      body: "The mechanism is three moves. First, **define the interface in the package that consumes it** — next to the service, not next to the database code. This is the Go proverb 'accept interfaces, return structs': the consumer states the narrow behaviour it needs, and the concrete store *returns* itself to fit. Keep the interface small — often one or two methods — because a fake has to reimplement every method, and narrow interfaces are cheap to fake.\n\nSecond, **inject** the dependency: the service holds it as a struct field, set by a constructor (`NewAccountService(s Store)`), rather than calling `sql.Open` inside its methods. Third, in tests, **pass a double** that satisfies the interface. Because satisfaction is implicit, your `fakeStore` just needs the right methods and it fits — no declaration linking it to `Store`.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Interface defined by the consumer, dependency injected",
            language: "go",
            code:
              "package bank\n\n// The service declares the NARROW behaviour it needs — here, in its own package.\ntype Store interface {\n    Get(id string) (Account, error)\n    Save(a Account) error\n}\n\ntype AccountService struct {\n    store Store // injected, not constructed inside\n}\n\nfunc NewAccountService(s Store) *AccountService {\n    return &AccountService{store: s}\n}\n\nfunc (s *AccountService) Withdraw(id string, amount int) error {\n    acc, err := s.store.Get(id)\n    if err != nil {\n        return err\n    }\n    if acc.Balance < amount {\n        return ErrInsufficientFunds\n    }\n    acc.Balance -= amount\n    return s.store.Save(acc)\n}",
            takeaway:
              "The service depends only on `Store`. Production wires in a Postgres-backed store; tests wire in a fake. Neither the service nor `Withdraw` changes.",
          },
        },
        {
          type: "points",
          items: [
            "Define the interface in the **consumer** package and keep it **small** (fewer methods to fake).",
            "**Inject** the dependency via a constructor or field — never construct it inside a method.",
            "Implicit satisfaction means any type with the right methods (including a fake) fits with no `implements` keyword.",
          ],
        },
      ],
    },
    diagram: {
      body: "Here's the whole idea in one picture: one service, one interface, two interchangeable implementations. In production the interface points at a real database-backed store; in tests it points at an in-memory fake. The service code is identical in both — it only ever sees the interface. Follow the two branches down from the shared `Store` socket.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "One interface, two implementations",
            kind: "flow",
            nodes: [
              { id: "svc", label: "AccountService", detail: "holds a Store; runs the business rules" },
              { id: "iface", label: "Store interface", detail: "Get(id) / Save(acc) — the socket", tone: "accent" },
              { id: "real", label: "postgresStore (prod)", detail: "talks to the real database", tone: "muted" },
              { id: "fake", label: "fakeStore (tests)", detail: "in-memory map — fast, deterministic", tone: "success" },
            ],
            caption: "The service depends on the interface only. Production plugs in the real store; tests plug in the fake. Same rules run either way.",
          },
        },
      ],
    },
    implementation: {
      body: "Now the payoff: a hand-written fake and a test that uses it. The fake is a struct wrapping a `map`, with the two methods `Store` requires. That's the entire fake — no framework, maybe ten lines. Then the test seeds the map, runs the business operation through the service, and asserts on the *resulting state* (the stored balance) and the returned error.\n\nNotice what the test does *not* do: it doesn't assert how many times `Save` was called or in what order. It checks the outcome. That's what makes it survive refactors — the exact thing over-mocking gets wrong.",
      blocks: [
        {
          type: "example",
          example: {
            title: "A hand-written in-memory fake and a state-based test",
            language: "go",
            code:
              "// fakeStore is a working, lightweight Store backed by a map.\ntype fakeStore struct{ m map[string]Account }\n\nfunc newFakeStore() *fakeStore { return &fakeStore{m: map[string]Account{}} }\n\nfunc (f *fakeStore) Get(id string) (Account, error) {\n    acc, ok := f.m[id]\n    if !ok {\n        return Account{}, errors.New(\"not found\")\n    }\n    return acc, nil\n}\n\nfunc (f *fakeStore) Save(a Account) error {\n    f.m[a.ID] = a\n    return nil\n}\n\nfunc TestWithdraw(t *testing.T) {\n    store := newFakeStore()\n    store.m[\"a\"] = Account{ID: \"a\", Balance: 100}\n\n    svc := NewAccountService(store) // inject the fake\n\n    if err := svc.Withdraw(\"a\", 40); err != nil {\n        t.Fatalf(\"unexpected error: %v\", err)\n    }\n    if got := store.m[\"a\"].Balance; got != 60 { // assert on STATE\n        t.Fatalf(\"balance = %d, want 60\", got)\n    }\n}",
            takeaway:
              "The fake is a map with two methods. The test seeds state, runs the rule, and checks the result — fast, no database, and immune to internal refactors.",
          },
        },
        {
          type: "note",
          note: {
            tone: "tip",
            title: "Function-value doubles for single-method deps",
            text: "If a dependency is just one function — say `notify func(msg string) error` — you don't even need an interface or a struct. Inject a function value, and in tests pass a closure: `notify: func(string) error { called = true; return nil }`. It's the lightest double there is.",
          },
        },
      ],
    },
    experiment: {
      body: "Predict before reading on — a corrected wrong guess sticks better than a skimmed right answer. Suppose the fake's `Save` has a bug: it forgets to actually store, so it's `func (f *fakeStore) Save(a Account) error { return nil }` (a no-op). You run the `TestWithdraw` above.\n\nWhat happens? Commit to an answer.\n\nHere's the trace: `Withdraw` reads `a` (balance 100), passes the check, computes 60, and calls `Save` — which silently discards it. The map still holds 100. The assertion `got != 60` fires, and the test fails with `balance = 100, want 60`. The lesson is sharp: **a fake is only useful if it's correct.** A fake that lies (Save that doesn't save) gives you false confidence or false failures. Fakes must be simple enough to trust *and* actually implement the behaviour they stand for — that's the discipline that separates a fake from a broken stub.",
    },
    "failure-cases": {
      body: "The failures here cluster around two mistakes: over-specifying mocks, and building doubles you can't trust. Here are the ones you'll actually hit.",
      blocks: [
        {
          type: "points",
          items: [
            "**Over-specified mock** → asserting exact call count, order, and args when behaviour is what matters; every refactor breaks it. Assert on state with a fake instead.",
            "**A fake that's subtly wrong** → a `Save` that doesn't persist, or a `Get` that ignores IDs, gives false results. Keep fakes simple and correct enough to trust.",
            "**Mocking a type you don't own** → doubling `*sql.DB` or an HTTP client freezes your guesses about foreign code. Wrap it behind your own small interface and fake that.",
            "**A fat interface** → a 12-method interface forces a 12-method fake for a test that uses two. Split it; depend on the narrow slice you actually call.",
            "**Testing the double, not the code** → assertions that only check the fake behaved like a map tell you nothing about your service. Assert on the service's outcome.",
          ],
        },
        {
          type: "example",
          example: {
            title: "Wrap what you don't own; fake what you do",
            language: "go",
            code:
              "// DON'T: try to mock the third-party *sql.DB directly.\n\n// DO: define your own narrow interface and adapt the real type to it.\ntype Store interface {\n    Get(id string) (Account, error)\n    Save(a Account) error\n}\n\n// Production adapter around the type you don't own:\ntype pgStore struct{ db *sql.DB }\n\nfunc (p *pgStore) Get(id string) (Account, error) { /* real SQL */ return Account{}, nil }\nfunc (p *pgStore) Save(a Account) error          { /* real SQL */ return nil }\n\n// Tests fake *your* Store, never *sql.DB.",
            takeaway:
              "You only ever double an interface you defined. The real implementation adapts the foreign type; your test never has to guess how *sql.DB behaves.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "Doubles are cheap and powerful, and that power is easy to over-apply. None of these should scare you off — they mark where to think twice.",
      blocks: [
        {
          type: "points",
          items: [
            "**Fake vs mock**: a fake tests state and survives refactors, but you must write and maintain a small correct implementation. A mock is quick to script but couples the test to the call pattern.",
            "**Hand-written vs framework (testify/mock)**: hand-written fakes are explicit and dependency-free; a framework saves boilerplate for many similar mocks but adds a DSL and a tendency toward over-specification.",
            "**Narrow interface**: easy to fake and clear about needs, but you may end up with several small interfaces instead of one big one — usually a feature, occasionally noise.",
            "**Faking away the real thing**: fast tests, but a fake can drift from real behaviour (real SQL constraints, ordering, errors). Keep a few integration tests against the real dependency too.",
          ],
        },
      ],
    },
    design: {
      body: "A few durable rules. Default to a hand-written fake and assert on state; reach for a mock only when the interaction itself is the observable outcome (an audit write, a notification). Define interfaces in the consumer and keep them narrow — a fake reimplements every method, so small interfaces are a gift to your future self. Never mock a type you don't own; wrap it behind your own interface first. And keep fakes honest: a fake you can't trust is worse than no test.",
      blocks: [
        {
          type: "points",
          items: [
            "Prefer fakes + state assertions; use mocks/spies only when the call is the contract.",
            "Consumer-defined, narrow interfaces — the fewer methods, the cheaper the fake.",
            "Don't mock types you don't own; wrap them behind an interface you do.",
            "Keep fakes simple and correct enough to trust, and keep a few real-dependency integration tests.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Choosing doubles for a transfer feature",
            context:
              "Transfer debits one account, credits another, and writes an audit-log entry. You need to test the money math and prove the audit entry gets written.",
            insight:
              "Use a fake store for the accounts and assert the final balances (state you can check). Use a spy/mock for the audit writer and assert it was called once — because the audit write has no returnable state to inspect, the call *is* the outcome. Two different doubles, each chosen by whether there's state to assert on.",
          },
        },
      ],
    },
    ledgerflow: {
      body: "This is exactly how LedgerFlow's service layer stays testable. The `TransferService` doesn't open a database connection or import the Postgres store; it depends on a small `Store` interface defined right next to it — `Get`, `Save`, and a couple of balance operations. In production, `main` wires in the real sqlc/Postgres-backed store. In tests, we wire in an `inMemoryStore`: a struct wrapping a `map[string]Account`.\n\nThat lets us test the rules that actually matter — an overdraft is rejected, a transfer moves the exact amount, balances recalculate correctly — in milliseconds, with no `docker compose up`, no migrations, no flakiness. We assert on the resulting balances (state), not on how many times `Save` ran. The one place we use a recording double is the audit trail: there we verify the audit entry was written, because that call is the whole point and there's no balance to check.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "LedgerFlow: service tested against an in-memory fake",
            kind: "sequence",
            nodes: [
              { id: "test", label: "Test seeds fake store", detail: "map with account A = 100, B = 0" },
              { id: "inject", label: "Inject fake into TransferService", detail: "same constructor as production", tone: "accent" },
              { id: "run", label: "svc.Transfer(A, B, 30)", detail: "the real business rules run" },
              { id: "state", label: "Assert balances: A=70, B=30", detail: "check STATE in the fake, no DB", tone: "success" },
              { id: "audit", label: "Verify audit write happened", detail: "the one interaction worth mocking" },
            ],
            caption: "Rules tested against a fake in milliseconds; a mock reserved for the single interaction (audit) that has no state to check.",
          },
        },
      ],
    },
    exercises: {
      body: "Practice is what turns 'I read about doubles' into 'I reach for a fake without thinking.' Work across predicting a fake's resulting state, naming stubs/fakes/mocks from their code, implementing an in-memory fake and a service test, refactoring a hard-wired DB dependency into an injected interface, choosing fake-vs-mock for a feature, and debugging a brittle over-mocked test. Each produces a different kind of evidence — do them, don't just read them.",
    },
    mastery: {
      body: "You've mastered this when you can explain the difference between a stub, fake, mock, and spy and pick the right one, predict the state a fake ends in after a service operation, write an in-memory fake behind a consumer-defined interface plus a test that uses it, and decide between a fake and a mock by whether there's state to assert on. Attest a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "Two ideas carry this lesson. **Doubles let you test rules without infrastructure** — a stub returns canned answers, a fake is a working lightweight implementation (your default), a mock records and verifies calls, a spy just records. You plug them in by depending on a small, consumer-defined **interface** and **injecting** the dependency, which Go's implicit satisfaction makes free. **Prefer behaviour over interactions** — assert on the state a fake ends in, not on which methods were called; reach for a mock only when the call itself is the outcome, and never mock a type you don't own.",
      blocks: [
        {
          type: "points",
          items: [
            "Test doubles: stub (canned answer), fake (working in-memory impl — the default), mock (verifies calls), spy (records calls).",
            "Depend on a small interface defined by the consumer, and inject it — implicit satisfaction makes a fake fit for free.",
            "Assert on state with a fake; use a mock/spy only when the interaction is the observable contract.",
            "Keep fakes simple and correct, keep interfaces narrow, and never mock a type you don't own — wrap it first.",
          ],
        },
      ],
    },
  },
};
