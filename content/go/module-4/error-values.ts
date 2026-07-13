import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 4, errors are values — Go has no exceptions; `error` is just a built-in
 * interface with one method, and errors are ordinary values you return, inspect,
 * and act on. Same beginner-friendly voice as Modules 0–3: plain language, one
 * analogy per hard idea, a concrete example before the abstract rule. Covers
 * errors.New, fmt.Errorf, sentinel errors and their coupling downside, typed
 * errors carrying detail, and the `if err != nil { return err }` rhythm.
 */
export const goErrorValues: Lesson = {
  id: "go-error-values",
  slug: "error-values",
  title: "Errors are values",
  description:
    "Treat failure as an ordinary value you return and inspect, not an exception you throw: build errors with errors.New and fmt.Errorf, and choose between sentinel and typed errors so callers can actually act on what went wrong.",
  moduleId: "go-4",
  estimatedMinutes: 55,
  difficulty: "intermediate",
  prerequisites: ["go-interfaces"],
  learningObjectives: [
    "Explain that `error` is a one-method interface and that Go returns errors as values instead of throwing exceptions",
    "Create errors with errors.New and fmt.Errorf, and follow the `if err != nil { return err }` rhythm",
    "Choose between a sentinel error and a typed error so a caller can act on the failure, not just log it",
  ],
  concepts: ["error-interface", "sentinel-errors", "typed-errors"],
  ledgerFlowApplications: [
    "Return an actionable validation error from the domain when a transfer amount is not positive",
    "Expose a sentinel ErrAccountNotFound the service layer can compare against with ==",
    "Return a typed ValidationError carrying the offending field and value so the handler can build a precise HTTP response",
  ],
  references: [
    {
      title: "Error handling and Go — The Go Blog",
      url: "https://go.dev/blog/error-handling-and-go",
      teaches:
        "That `error` is a built-in interface, how to create errors with errors.New and fmt.Errorf, and the idiomatic patterns for returning and inspecting them.",
      relevance:
        "The foundational article behind this whole lesson: errors as values you return, not exceptions you throw.",
      required: true,
      section: "The error type; Simplifying repetitive error handling",
    },
    {
      title: "Effective Go — Errors",
      url: "https://go.dev/doc/effective_go#errors",
      teaches:
        "Idiomatic error strings, and why callers often need more than a string — a typed error they can inspect for detail.",
      relevance:
        "Backs the move from a bare string error to a typed error carrying fields the caller can act on.",
      required: true,
      section: "Errors",
    },
    {
      title: "Errors are values — The Go Blog",
      url: "https://go.dev/blog/errors-are-values",
      teaches:
        "That errors are plain values you can program with — store, compare, and pass around — rather than a special control-flow mechanism.",
      relevance:
        "Names and defends the central idea of the lesson and the mindset shift away from exceptions.",
      required: false,
      section: "Errors are values",
    },
  ],
  exercises: [
    {
      id: "go4ev-predict-errnil",
      type: "prediction",
      prompt:
        "A function returns `(int, error)`. On the happy path it does `return 42, nil`. The caller writes `v, err := f(); if err != nil { ... }`. Predict whether the `if` branch runs, and explain what `nil` means for an `error` value here.",
      expectedAnswer:
        "The branch does not run. `error` is an interface, and returning the untyped `nil` gives an interface with no concrete type and no value — so `err != nil` is false. `nil` is the idiomatic 'no error, everything succeeded' value.",
      hints: [
        "`error` is an interface type, so its zero value is nil.",
        "Returning bare `nil` on success is the whole convention.",
      ],
    },
    {
      id: "go4ev-read-errorstring",
      type: "code-reading",
      prompt:
        "Given `type myErr struct{ msg string }` with `func (e *myErr) Error() string { return e.msg }`, explain why `var err error = &myErr{msg: \"boom\"}` compiles even though the code never says the word `error` in the type definition.",
      hints: [
        "`error` is just `interface { Error() string }`.",
        "Interface satisfaction in Go is implicit — having the method is enough.",
      ],
    },
    {
      id: "go4ev-implement-validate",
      type: "implementation",
      prompt:
        "Implement `validateAmount` so it returns an error when the amount (in cents) is not positive, and nil otherwise. Use fmt.Errorf so the message includes the bad value.",
      starterCode:
        'package main\n\nimport (\n  "errors"\n  "fmt"\n)\n\n// TODO: return a non-nil error when amountC <= 0 (message should include amountC),\n// and nil when the amount is valid.\nfunc validateAmount(amountC int64) error {\n  return nil\n}\n\nfunc main() {\n  fmt.Println(validateAmount(500))  // want: <nil>\n  fmt.Println(validateAmount(-1))   // want: an error mentioning -1\n  _ = errors.New\n}',
      expectedAnswer:
        'func validateAmount(amountC int64) error {\n  if amountC <= 0 {\n    return fmt.Errorf("amount must be positive, got %d", amountC)\n  }\n  return nil\n}',
      hints: [
        "Guard the invalid case first, then return nil at the end for the valid case.",
        "fmt.Errorf works like fmt.Sprintf but produces an error value.",
      ],
    },
    {
      id: "go4ev-debug-sentinel",
      type: "debugging",
      prompt:
        "A store defines `var ErrNotFound = errors.New(\"not found\")` and returns it, but a caller checks `if err.Error() == \"not found\"` and it feels fragile. Explain what breaks with the string comparison and fix it to compare against the sentinel value instead.",
      hints: [
        "Comparing error strings breaks the moment someone edits the message text.",
        "Sentinel errors are meant to be compared by identity with ==.",
      ],
    },
    {
      id: "go4ev-refactor-typed",
      type: "refactoring",
      prompt:
        "A validation function returns `errors.New(\"invalid field\")`, and the HTTP handler can't tell which field was wrong. Refactor to a typed error carrying the field name and offending value, and show how the handler inspects it.",
      hints: [
        "Define a struct with the fields, and give it an Error() string method.",
        "The caller can use a type assertion or errors.As to read the fields back out.",
      ],
    },
    {
      id: "go4ev-design-sentinel-vs-typed",
      type: "design",
      prompt:
        "For LedgerFlow's account store, decide which failures should be sentinel errors and which should be typed errors, and justify each choice in terms of what the caller needs to do about the failure.",
      hints: [
        "A sentinel is enough when the caller only needs to know 'which kind of failure'.",
        "A typed error earns its keep when the caller needs extra detail (a field, a code, the bad input).",
      ],
    },
    {
      id: "go4ev-advanced-actionable",
      type: "advanced",
      prompt:
        "Design an error strategy for a transfer service where the caller must distinguish 'account not found' (retry with a different id), 'insufficient funds' (report the shortfall to the user), and 'database unavailable' (retry later). Explain which errors are sentinels, which are typed, and what detail each carries so the caller can act rather than merely log.",
      hints: [
        "Ask, for each failure: what does the caller need to DO, and what information does that decision require?",
        "'Insufficient funds' needs a number (the shortfall); 'not found' may only need identity — that difference drives sentinel vs typed.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-error-interface",
      kind: "explain",
      description:
        "Explain that `error` is a one-method interface (`Error() string`) and that Go returns errors as values rather than throwing exceptions.",
      required: true,
    },
    {
      id: "implement-error-return",
      kind: "implement",
      description:
        "Create errors with errors.New and fmt.Errorf and return them following the `if err != nil { return err }` rhythm, returning nil on success.",
      required: true,
    },
    {
      id: "predict-sentinel-compare",
      kind: "predict",
      description:
        "Predict the result of comparing a returned error against a sentinel with == and explain why comparing error strings is fragile.",
      required: true,
    },
    {
      id: "design-actionable-error",
      kind: "design",
      description:
        "Choose between a sentinel and a typed error for a given failure and defend the choice by what the caller needs to do about it.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "Every real program hits things that can go wrong: a file isn't there, a number is out of range, the database is down. The question every language has to answer is *how do you signal that a call failed, and how does the caller find out?* Many languages use **exceptions** — you `throw` an error and it flies up the call stack until some `catch` block grabs it, jumping over whatever code was in between.\n\nGo takes a deliberately different path. There is no `throw`, no `catch`. A function that can fail simply **returns an error as one of its results**, and the caller **inspects that value** right there. Failure isn't a special control-flow event; it's just another value coming back from the call, sitting next to the normal result.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "An exception is a fire alarm — it interrupts everyone until someone responds. A Go error is a note handed back with your order: 'here's your coffee' or 'we're out of oat milk — here's why'. You read the note and decide what to do, right at the counter, before moving on.",
          },
        },
        {
          type: "points",
          items: [
            "Most languages signal failure by *throwing* an exception that unwinds the stack.",
            "Go signals failure by *returning* an error value the caller checks in place.",
            "An error in Go is an ordinary value — nothing magic, nothing that jumps around your code.",
          ],
        },
      ],
    },
    naive: {
      body: "Coming from an exception language, the first instinct is to look for `try`/`catch` or to reach for `panic`/`recover` (Go's crash mechanism) as a stand-in. That's the wrong tool: `panic` is for truly unrecoverable bugs, not for a missing file or a bad input.\n\nThe second naive move is to signal failure with a sentinel *result* — return `-1`, or an empty string, or a `nil` pointer — and hope the caller notices. This is exactly the trap Go's designers wanted to avoid: an out-of-band magic value is easy to forget to check, and it can't carry any explanation of *what* went wrong.",
      blocks: [
        {
          type: "example",
          example: {
            title: "The naive 'magic return value' — don't do this",
            language: "go",
            code:
              '// Naive: -1 secretly means "failed". The caller may forget to check.\nfunc parseAmount(s string) int64 {\n    n, ok := tryParse(s)\n    if !ok {\n        return -1 // what went wrong? no way to say\n    }\n    return n\n}\n\n// The caller has to *remember* that -1 is special.\namount := parseAmount(input)\nif amount == -1 {\n    // ...and we still have no idea why it failed\n}',
            takeaway: "A magic sentinel value is easy to ignore and carries no explanation — Go returns a real error instead.",
          },
        },
        {
          type: "points",
          items: [
            "Don't reach for panic/recover to model ordinary, expected failures.",
            "Don't overload a normal return value (-1, \"\", nil) to secretly mean 'failed'.",
          ],
        },
      ],
    },
    failure: {
      body: "The magic-value approach fails because nothing forces the caller to look, and the value can't explain itself. Return `-1` for a bad amount and a caller who forgets the check will happily treat `-1` cents as a real balance. There's no compiler nudge, no message, no way to ask 'why did this fail?'.\n\nExceptions fail differently but just as painfully: because a thrown error jumps over intervening code, it's invisible at the call site. You read `x := f()` and nothing tells you `f` might blow up and skip the next ten lines. The failure path is hidden. Go's fix is to make the error path **visible and local** — it's right there in the return signature, and you handle it on the very next line.",
      blocks: [
        {
          type: "scenario",
          scenario: {
            title: "The check that never happened",
            context:
              "A transfer function returns a plain int64 balance, using -1 to mean 'account not found'. One caller forgets to test for -1 and stores it as the account's new balance. The account now shows a balance of minus one cent, and nothing crashed to warn anyone.",
            insight:
              "Because failure was smuggled inside a normal value, the compiler couldn't help and the mistake sailed through. An explicit `error` return makes 'did this fail?' a question you can't quietly skip.",
          },
        },
        {
          type: "points",
          items: [
            "Magic return values: nothing forces a check, and the value can't say why it failed.",
            "Exceptions: the failure path is invisible at the call site because control jumps away.",
            "Go wants the failure path explicit and handled locally, right where the call happens.",
          ],
        },
      ],
    },
    intuition: {
      body: "Here's the mental picture. A Go function that can fail hands back **two things**: the result you wanted, and an error slot. On success the error slot is empty (`nil`); on failure it holds a value describing what happened. You always get both, so you always get the chance to look.\n\nBecause the error is just a value, you can do ordinary things with it: store it in a variable, compare it, pass it to another function, or return it upward. It isn't a special beast that only a `catch` block can touch. 'Errors are values' means exactly that — you *program* with them, using the same tools you use for any other value.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "The two-return shape",
            text: "The idiomatic Go signature for a fallible call is `func do() (Result, error)`. Read it as 'give me the result, and tell me if it went wrong'. Check the error first; trust the result only when the error is nil.",
          },
        },
        {
          type: "points",
          items: [
            "A fallible function returns (result, error) — you always receive both.",
            "error is nil on success and a describing value on failure.",
            "An error is an ordinary value: store it, compare it, pass it, return it.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Three ideas make the whole topic click. **One:** `error` is not a keyword — it's a built-in **interface** with a single method, `Error() string`. Anything with that method *is* an error. **Two:** the convention is (result, error), and the caller checks the error before trusting the result. **Three:** there's a rhythm to it — `if err != nil { return err }` — where a function that can't handle a failure passes it up to whoever can.\n\nThat rhythm is the beating heart of Go code. You'll write it constantly. It looks repetitive, and it is — but it means every failure is acknowledged at every level, and the failure path is as readable as the success path.",
      blocks: [
        {
          type: "example",
          example: {
            title: "`error` is just a one-method interface",
            language: "go",
            code:
              '// This is the actual built-in definition — nothing more.\ntype error interface {\n    Error() string\n}\n\n// Any type with an Error() string method satisfies it, implicitly.\ntype notFound struct{ id string }\n\nfunc (e notFound) Error() string {\n    return "account " + e.id + " not found"\n}\n\n// So a notFound value can be used anywhere an error is expected.\nvar err error = notFound{id: "a1"}',
            takeaway: "Because error is a one-method interface, defining your own error type is just implementing Error() string.",
          },
        },
        {
          type: "points",
          items: [
            "`error` is a built-in interface: `interface { Error() string }`.",
            "Convention is (result, error); check the error before using the result.",
            "The rhythm `if err != nil { return err }` passes a failure up to a caller who can handle it.",
          ],
        },
      ],
    },
    mechanics: {
      body: "Now the concrete tools. The standard library gives you two ways to make an error value. `errors.New(\"message\")` builds an error from a fixed string. `fmt.Errorf(\"...%d...\", x)` works like `fmt.Sprintf` but returns an error, so you can fold in details like the offending value. Both hand back something satisfying the `error` interface.\n\nYou return an error as the *last* result by convention. The caller receives it and runs the check: `if err != nil`. If this function can't do anything useful about the failure, it returns the error to its own caller — that's the `return err` half of the rhythm. On success, you return the untyped `nil`, which is the empty error slot.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Creating and returning errors",
            language: "go",
            code:
              'import (\n    "errors"\n    "fmt"\n)\n\n// Fixed message: errors.New.\nfunc withdraw(balanceC, amountC int64) (int64, error) {\n    if amountC <= 0 {\n        return balanceC, errors.New("amount must be positive")\n    }\n    // Message with detail folded in: fmt.Errorf.\n    if amountC > balanceC {\n        return balanceC, fmt.Errorf("insufficient funds: have %d, need %d", balanceC, amountC)\n    }\n    return balanceC - amountC, nil // success: the error slot is nil\n}',
            takeaway: "errors.New for a fixed message, fmt.Errorf when you want to include values; return nil on success.",
          },
        },
        {
          type: "points",
          items: [
            "`errors.New(\"msg\")` → an error with a fixed message.",
            "`fmt.Errorf(\"...%v...\", x)` → an error whose message includes runtime values.",
            "Error is the last return value; return the untyped `nil` on the success path.",
          ],
        },
      ],
    },
    diagram: {
      body: "Trace how a failure travels in Go versus how it travels as an exception. In Go the error rides back down the return values, and each layer decides: handle it, or pass it up with `return err`. There's no jumping — every hop is an explicit, readable step.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "An error flows back through returns, one explicit hop at a time",
            kind: "sequence",
            nodes: [
              { id: "s1", label: "store.Get(id)", detail: "can't find the row → returns (nil, ErrNotFound)", tone: "danger" },
              { id: "s2", label: "service.Load(id)", detail: "gets err != nil, can't fix it → `return err`", tone: "accent" },
              { id: "s3", label: "handler.Show(id)", detail: "gets err != nil → turns it into a 404 response", tone: "accent" },
              { id: "s4", label: "HTTP client", detail: "receives a clear 404, not a crash", tone: "success" },
            ],
            caption: "Each layer either handles the error or returns it upward — the failure path is visible at every step.",
          },
        },
        {
          type: "diagram",
          diagram: {
            title: "Go errors vs exceptions",
            kind: "compare",
            nodes: [
              { id: "go", label: "Go: return an error value", detail: "checked on the next line; failure path is local and visible", tone: "success" },
              { id: "exc", label: "Exceptions: throw and unwind", detail: "control jumps over code to a distant catch; failure path is hidden", tone: "muted" },
            ],
            caption: "Go trades the convenience of throwing for the clarity of handling failure where it happens.",
          },
        },
      ],
    },
    implementation: {
      body: "Put the whole pattern together: a fallible function returns (result, error), the caller checks the error first, and unhandleable failures are returned upward. Below, a small pipeline parses and validates a transfer amount. Notice how each step's error is checked immediately, and how a caller that can't recover simply passes the error on.",
      blocks: [
        {
          type: "example",
          example: {
            title: "The (result, error) pattern end to end",
            language: "go",
            code:
              'import (\n    "fmt"\n    "strconv"\n)\n\n// Returns the amount in cents, or an error explaining the failure.\nfunc parseAmount(s string) (int64, error) {\n    n, err := strconv.ParseInt(s, 10, 64)\n    if err != nil {\n        return 0, fmt.Errorf("amount %q is not a number", s)\n    }\n    if n <= 0 {\n        return 0, fmt.Errorf("amount must be positive, got %d", n)\n    }\n    return n, nil\n}\n\nfunc main() {\n    amountC, err := parseAmount("1500")\n    if err != nil {\n        fmt.Println("rejected:", err) // the caller decides what to do\n        return\n    }\n    fmt.Println("ok, cents:", amountC)\n}',
            takeaway: "Check the error immediately; only trust the result once you know the error is nil.",
          },
        },
        {
          type: "note",
          note: {
            tone: "info",
            title: "Foreshadow",
            text: "When you pass an error up, you often want to add context ('while loading account a1: ...') without losing the original. That's error *wrapping* with `fmt.Errorf(\"...: %w\", err)` — the subject of the next lesson.",
          },
        },
      ],
    },
    experiment: {
      body: "Predict before you read on — a corrected guess sticks better than a skimmed answer. A package defines a sentinel error and returns it:\n\n`var ErrNotFound = errors.New(\"not found\")`\n`func find(id string) error { return ErrNotFound }`\n\nElsewhere, a *second* package also writes `var ErrNotFound = errors.New(\"not found\")` — same exact message. A caller does `if err == find(\"x\") { ... }` comparing the returned error against the *second* package's `ErrNotFound`. Does the comparison hold — `true` or `false`?\n\nIt is **false**. `errors.New` returns a pointer to a new struct each time it's called, and `==` on error interface values compares identity, not message text. The two `ErrNotFound` variables are *different* values that merely share a string. Comparing against a sentinel only works when you compare against the *same* variable the function actually returns — which is why sentinels are exported (`ErrNotFound`) so callers reference the one true value. This is also the seed of the sentinel's downside: it ties every caller to that specific exported variable.",
    },
    "failure-cases": {
      body: "Error handling in Go goes wrong in a handful of recognizable ways. Learn the signal each one gives.",
      blocks: [
        {
          type: "points",
          items: [
            "**Ignoring the error** (`v, _ := f()`) → you proceed on data that may be garbage. Only discard an error when you truly don't care.",
            "**Comparing error strings** (`err.Error() == \"not found\"`) → breaks the instant someone edits the message. Compare against a sentinel value instead.",
            "**Comparing against the wrong sentinel** → two `errors.New(\"x\")` values are not equal; compare against the exact exported variable the function returns.",
            "**A bare string error where the caller needs detail** → the caller can't act, only log. Use a typed error carrying the field/code/value.",
            "**Using panic for ordinary failures** → crashes the program for something a returned error should have handled.",
          ],
        },
        {
          type: "example",
          example: {
            title: "Fragile string comparison vs. a stable sentinel",
            language: "go",
            code:
              'var ErrNotFound = errors.New("account not found")\n\n// FRAGILE: breaks if the message text ever changes.\nif err.Error() == "account not found" { /* ... */ }\n\n// STABLE: compares against the sentinel value itself.\nif err == ErrNotFound { /* ... */ }',
            takeaway: "Compare against the sentinel value, never against the human-readable message string.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "The two ways to make a distinguishable error — sentinel and typed — are a genuine trade-off, not a ranking. Pick by what the caller needs to *do* with the failure.",
      blocks: [
        {
          type: "points",
          items: [
            "**Sentinel error** (exported `var Err... = errors.New(...)`): cheap to define and compare with `==`, but it carries no detail and *couples callers to that specific value* — they must import and reference your exact variable.",
            "**Typed error** (a struct implementing `error`): carries fields the caller can inspect (a code, the offending input), but it's more code and callers need a type assertion or errors.As to read it.",
            "**Bare `errors.New` / `fmt.Errorf`** (neither exported nor typed): perfect when the caller only needs to log or bubble the failure up, wasteful ceremony to distinguish otherwise.",
            "**Guideline**: no distinction needed → bare error; caller branches on 'which failure' → sentinel; caller needs data about the failure → typed error.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Why the sentinel's coupling matters",
            context:
              "A store exports `ErrNotFound`. Ten services compare against it. Later you want 'not found' to also carry the missing id, so callers can log it. Every one of those `== ErrNotFound` checks now needs to change.",
            insight:
              "A sentinel is a value contract: callers depend on the value itself. When you need the failure to carry data, a typed error would have absorbed the change without touching every caller.",
          },
        },
      ],
    },
    design: {
      body: "Turn the rules into habits. Return errors for expected, recoverable failures and reserve panic for genuine bugs. Prefer a bare `fmt.Errorf` until a caller needs to *branch* on the failure — then reach for a sentinel; when the caller needs *data* about the failure, reach for a typed error. Always ask the design question first: **what will the caller do with this error?** That answer, not habit, picks the shape.",
      blocks: [
        {
          type: "points",
          items: [
            "Return errors for expected failures; panic only for unrecoverable bugs.",
            "Start with a plain error; upgrade to a sentinel when callers must branch on the kind of failure.",
            "Upgrade to a typed error when callers need detail (field, code, offending value) to act.",
            "Design errors around the caller's decision: 'what do you need to do about this?'",
          ],
        },
        {
          type: "example",
          example: {
            title: "A typed error carrying actionable detail",
            language: "go",
            code:
              '// Typed error: implements error AND carries fields the caller can use.\ntype ValidationError struct {\n    Field string\n    Value any\n    Msg   string\n}\n\nfunc (e *ValidationError) Error() string {\n    return fmt.Sprintf("%s: %v (%s)", e.Field, e.Value, e.Msg)\n}\n\nfunc validateTransfer(amountC int64) error {\n    if amountC <= 0 {\n        return &ValidationError{Field: "amount", Value: amountC, Msg: "must be positive"}\n    }\n    return nil\n}\n\n// The caller can inspect the detail, not just print it.\nfunc handle(err error) {\n    var ve *ValidationError\n    if errors.As(err, &ve) {\n        fmt.Printf("reject field %s with value %v\\n", ve.Field, ve.Value)\n    }\n}',
            takeaway: "A typed error lets the caller read the field and value and build a precise response — a sentinel couldn't.",
          },
        },
      ],
    },
    ledgerflow: {
      body: "LedgerFlow's whole reliability story rests on actionable errors. The domain layer validates a transfer and returns an error the caller can act on — not a logged message, but a value carrying *what* was wrong. When an amount isn't positive, `validateTransfer` returns a typed `ValidationError` with the field and the offending value, so the HTTP handler can turn it into a precise 400 response naming the exact field.\n\nThe store layer uses a sentinel for a plain 'which kind' failure: `var ErrAccountNotFound = errors.New(\"account not found\")`. The service compares against it with `==` and maps it to a 404. The split is deliberate: 'not found' only needs identity, so a sentinel suffices; 'invalid amount' needs the value, so it's typed. In both cases the service follows the rhythm — `if err != nil { return err }` — passing failures up to the handler, the one layer that knows how to speak HTTP.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Sentinel + typed errors in the LedgerFlow store and domain",
            language: "go",
            code:
              '// Sentinel: the caller only needs to know "not found".\nvar ErrAccountNotFound = errors.New("account not found")\n\nfunc (s *Store) Get(id string) (*Account, error) {\n    a, ok := s.accounts[id]\n    if !ok {\n        return nil, ErrAccountNotFound\n    }\n    return a, nil\n}\n\n// Typed: the caller needs the field and value to build a response.\ntype ValidationError struct {\n    Field string\n    Value any\n}\n\nfunc (e *ValidationError) Error() string {\n    return fmt.Sprintf("invalid %s: %v", e.Field, e.Value)\n}\n\nfunc validateTransfer(amountC int64) error {\n    if amountC <= 0 {\n        return &ValidationError{Field: "amount", Value: amountC}\n    }\n    return nil\n}',
            takeaway: "Sentinel for 'which failure' (not found → 404), typed error for 'what was wrong' (bad amount → 400 with the field).",
          },
        },
        {
          type: "diagram",
          diagram: {
            title: "How an error becomes an HTTP response",
            kind: "flow",
            nodes: [
              { id: "store", label: "store.Get", detail: "returns ErrAccountNotFound (sentinel)", tone: "danger" },
              { id: "svc", label: "service", detail: "if err != nil { return err }", tone: "accent" },
              { id: "handler", label: "handler", detail: "== ErrAccountNotFound → 404", tone: "success" },
              { id: "client", label: "client", detail: "gets an actionable 404" },
            ],
            caption: "The error value travels up the layers; only the handler translates it into HTTP.",
          },
        },
      ],
    },
    exercises: {
      body: "Practice turns 'I follow this' into 'I can build and choose it'. Work across prediction, code-reading, implementation, debugging, refactoring, design, and one advanced strategy problem. The sentinel-vs-typed choice is the one worth slowing down on: it's a design judgment you'll make in almost every package you write, and the right answer always comes from asking what the caller must *do*.",
    },
    mastery: {
      body: "You've mastered this lesson when four signals hold without notes: you can explain that `error` is a one-method interface and that Go returns errors as values instead of throwing them; create errors with errors.New and fmt.Errorf and return them with the `if err != nil { return err }` rhythm; predict what comparing an error against a sentinel yields and why string comparison is fragile; and choose between a sentinel and a typed error by what the caller needs to do. Check a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "Two ideas carry this lesson: `error` is just a **built-in interface** with one method, `Error() string`, and errors are **ordinary values** you return, inspect, and act on — never exceptions you throw. Build them with `errors.New` and `fmt.Errorf`, follow the `if err != nil { return err }` rhythm, and choose the error's *shape* by the caller's needs: a sentinel when they branch on the kind of failure, a typed error when they need detail to act. Next up: wrapping errors so you can add context as they travel up without losing the original.",
      blocks: [
        {
          type: "points",
          items: [
            "`error` is a one-method interface (`Error() string`); errors are returned values, not thrown exceptions.",
            "errors.New for a fixed message, fmt.Errorf to fold in detail; return untyped `nil` on success.",
            "The rhythm `if err != nil { return err }` handles or forwards every failure, keeping the failure path visible.",
            "Sentinel error: cheap `==` comparison but couples callers to the value and carries no detail.",
            "Typed error: implements `error` and carries fields the caller can act on. Next: wrapping errors with %w.",
          ],
        },
      ],
    },
  },
};
