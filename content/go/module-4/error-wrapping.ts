import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 4, lesson — wrapping and inspecting errors. Written in the same
 * beginner-friendly voice as Modules 0–3: plain language, one analogy per hard
 * idea, a concrete example before every abstract rule. Reformats the go.dev
 * material on %w, errors.Is, errors.As, Unwrap, and errors.Join into
 * learner-facing prose. Correct and idiomatic for Go 1.20+.
 */
export const goErrorWrapping: Lesson = {
  id: "go-error-wrapping",
  slug: "error-wrapping",
  title: "Wrapping & inspecting errors",
  description:
    "Add context to an error as it travels up the call stack without losing the original, then inspect the whole chain safely with errors.Is and errors.As.",
  moduleId: "go-4",
  estimatedMinutes: 55,
  difficulty: "intermediate",
  prerequisites: ["go-error-values"],
  learningObjectives: [
    "Add context to an error with fmt.Errorf and %w, and explain exactly how %w differs from %v",
    "Test a deep error chain for a sentinel with errors.Is, and pull a typed error out of it with errors.As",
    "Design a layered flow that wraps once per boundary and inspects only at the top — never string-matching error text",
  ],
  concepts: ["wrapping", "errors.Is", "errors.As", "unwrap"],
  ledgerFlowApplications: [
    "Trace a failed request from the HTTP handler down through the service layer to the storage query that actually broke",
    "Wrap a low-level 'no rows' error into a domain ErrAccountNotFound the handler can turn into a 404",
    "Extract a typed *StorageError at the boundary to decide whether to retry, log, or surface the failure",
  ],
  references: [
    {
      title: "Working with Errors in Go 1.13 — The Go Blog",
      url: "https://go.dev/blog/go1.13-errors",
      teaches:
        "How %w wraps an error, and how errors.Is and errors.As walk the resulting chain instead of comparing strings.",
      relevance:
        "The authoritative introduction to every mechanism in this lesson, written by the team that added them.",
      required: true,
      section: "Wrapping errors with %w; Checking errors with Is and As",
    },
    {
      title: "errors package — pkg.go.dev",
      url: "https://pkg.go.dev/errors",
      teaches:
        "The exact contracts of errors.Is, errors.As, errors.Unwrap, and errors.Join, including the Unwrap interfaces.",
      relevance:
        "The reference to keep open while writing the code — the precise signatures and behavior behind the prose.",
      required: true,
      section: "Is; As; Unwrap; Join",
    },
    {
      title: "Error handling and Go — The Go Blog",
      url: "https://go.dev/blog/error-handling-and-go",
      teaches:
        "Why errors are ordinary values in Go and how adding context to them is a normal part of the control flow.",
      relevance:
        "Grounds wrapping in Go's wider error philosophy so the %w verb feels like a natural extension, not a special case.",
      required: false,
      section: "Errors are values; Adding information",
    },
  ],
  exercises: [
    {
      id: "go4ew-predict-chain",
      type: "prediction",
      prompt:
        "Given `ErrNotFound := errors.New(\"not found\")`, then `wrapped := fmt.Errorf(\"loading user 7: %w\", ErrNotFound)`, predict what `errors.Is(wrapped, ErrNotFound)` returns and what `wrapped.Error()` prints.",
      expectedAnswer:
        "errors.Is returns true (the %w chain still contains ErrNotFound); wrapped.Error() prints \"loading user 7: not found\".",
      hints: [
        "%w keeps the original error reachable, so errors.Is can walk to it.",
        "The message is the format string with the wrapped error's text substituted where %w sits.",
      ],
    },
    {
      id: "go4ew-read-verb",
      type: "code-reading",
      prompt:
        "Two lines differ by one letter: `a := fmt.Errorf(\"open: %w\", err)` and `b := fmt.Errorf(\"open: %v\", err)`. Explain the difference in what each returned error can do afterwards.",
      hints: [
        "Which one leaves the original error reachable by errors.Is / errors.As?",
        "%v only formats err's text; the link to err is gone.",
      ],
    },
    {
      id: "go4ew-read-as",
      type: "code-reading",
      prompt:
        "Read `var perr *fs.PathError` then `if errors.As(err, &perr) { fmt.Println(perr.Path) }`. Explain why the argument is `&perr` (a pointer to the pointer) and what errors.As does on success.",
      hints: [
        "errors.As needs somewhere to store the matched error, so it takes the address of your variable.",
        "On success it sets perr to the first error in the chain whose type matches, then returns true.",
      ],
    },
    {
      id: "go4ew-implement-store",
      type: "implementation",
      prompt:
        "Implement loadAccount so that when the store returns the sentinel ErrNoRows, it returns a NEW error that (a) adds the context \"loading account <id>\" and (b) still lets a caller detect ErrNoRows with errors.Is.",
      starterCode:
        'package main\n\nimport (\n\t"errors"\n\t"fmt"\n)\n\nvar ErrNoRows = errors.New("no rows")\n\nfunc queryAccount(id string) error {\n\treturn ErrNoRows // pretend the DB found nothing\n}\n\nfunc loadAccount(id string) error {\n\terr := queryAccount(id)\n\tif err != nil {\n\t\t// TODO: add context but keep ErrNoRows detectable\n\t\treturn err\n\t}\n\treturn nil\n}\n\nfunc main() {\n\terr := loadAccount("acc_7")\n\tfmt.Println(err)                          // want: loading account acc_7: no rows\n\tfmt.Println(errors.Is(err, ErrNoRows))    // want: true\n}',
      expectedAnswer:
        'func loadAccount(id string) error {\n\terr := queryAccount(id)\n\tif err != nil {\n\t\treturn fmt.Errorf("loading account %s: %w", id, err)\n\t}\n\treturn nil\n}',
      hints: [
        "Use fmt.Errorf with the %w verb, not %v, so the sentinel stays in the chain.",
        "The context goes in the format string; the wrapped error goes at %w.",
      ],
    },
    {
      id: "go4ew-debug-stringmatch",
      type: "debugging",
      prompt:
        "A handler decides on a 404 with `if strings.Contains(err.Error(), \"not found\") { ... }`. It breaks the day someone rewords the message to \"could not find record\". Explain why this is fragile and rewrite it correctly.",
      hints: [
        "Error text is for humans and can change at any time; it is not an API.",
        "Compare against a sentinel with errors.Is(err, ErrNotFound) instead of matching text.",
      ],
    },
    {
      id: "go4ew-refactor-layers",
      type: "refactoring",
      prompt:
        "A three-layer call chain (handler → service → store) currently returns the raw store error all the way up, so logs only say \"no rows\" with no idea where it came from. Refactor so each layer wraps with its own context using %w, and the handler still detects the sentinel.",
      hints: [
        "Wrap once at each boundary: fmt.Errorf(\"<what this layer was doing>: %w\", err).",
        "Because every layer uses %w, errors.Is at the top still reaches the original sentinel.",
      ],
    },
    {
      id: "go4ew-advanced-join",
      type: "advanced",
      prompt:
        "Validating a form, you want to collect ALL failures (missing email AND weak password) into one error, and still let the caller test for each with errors.Is. Show how errors.Join (Go 1.20+) does this, and explain how errors.Is behaves against a joined error.",
      hints: [
        "errors.Join(err1, err2) returns one error wrapping both; nil arguments are skipped.",
        "errors.Is walks every branch of a joined error, so it returns true if ANY branch matches the target.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-wrap-verb",
      kind: "explain",
      description:
        "Explain what fmt.Errorf with %w does and how it differs from %v, in terms of what the resulting error can still do.",
      required: true,
    },
    {
      id: "predict-is",
      kind: "predict",
      description:
        "Correctly predict the result of errors.Is against a multi-layer wrapped chain that contains a sentinel.",
      required: true,
    },
    {
      id: "implement-inspect",
      kind: "implement",
      description:
        "Write code that wraps an error with context and later extracts a typed error from the chain with errors.As.",
      required: true,
    },
    {
      id: "design-layered-errors",
      kind: "design",
      description:
        "Design where a layered service wraps versus inspects, and defend never string-matching error text.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "You already know an error in Go is just a value you return and check. But a bare error is often useless by the time it reaches the top of your program. Deep inside storage, a query fails and returns `no rows`. That error bubbles up through a service, then a handler, and lands in your log as two words: `no rows`. No rows *where*? For *which* account? During *what* operation?\n\nSo you have two needs that pull in opposite directions. You want to **add context** as the error travels up — 'loading account acc_7', 'handling GET /accounts' — so the final message tells the whole story. But you also want the top of your program to still **inspect** the original cause: was this specifically a 'not found', so I can return a 404? The wrong tools give you one or the other. Wrapping gives you both.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "Think of an error as a parcel moving up through a shipping company. Each depot it passes through slaps on a new label — 'sorted at Leeds', 'out for delivery' — without opening the box or throwing away what's inside. At the end you can read the full journey on the outside AND still open the box to see the original contents. Wrapping is those stick-on labels.",
          },
        },
        {
          type: "points",
          items: [
            "A bare error loses the story of where and why it happened.",
            "You want to **add context** on the way up and still **inspect the original** at the top.",
            "Wrapping is the mechanism that keeps both — the outer message and the inner cause.",
          ],
        },
      ],
    },
    naive: {
      body: "The obvious first attempt is to build a richer message yourself with `fmt.Errorf` and the `%v` verb, which formats the old error's text into a new string:\n\n`return fmt.Errorf(\"loading account %s: %v\", id, err)`\n\nThis looks great — the message now reads `loading account acc_7: no rows`. Problem solved? Only half of it. `%v` copied the *words* of the original error into a brand-new error value. The original error itself is gone: there is no link back to it. So when the handler at the top wants to ask 'is this the ErrNotFound sentinel?', it can't — all it has is a fresh error whose text happens to end in 'no rows'.",
      blocks: [
        {
          type: "example",
          example: {
            title: "%v adds context but severs the original",
            language: "go",
            code: 'var ErrNotFound = errors.New("not found")\n\nfunc load(id string) error {\n    err := query(id) // returns ErrNotFound\n    return fmt.Errorf("loading account %s: %v", id, err) // %v, note\n}\n\nerr := load("acc_7")\nfmt.Println(err)                        // loading account acc_7: not found\nfmt.Println(errors.Is(err, ErrNotFound)) // false — the link is gone!',
            takeaway:
              "%v flattens the original into text. The message is right, but errors.Is can no longer find ErrNotFound.",
          },
        },
      ],
    },
    failure: {
      body: "Faced with that dead link, the tempting hack is to give up on the original error and just search the text: `if strings.Contains(err.Error(), \"not found\")`. It works in the demo, so it ships.\n\nThen the failure arrives, quietly. Six months later someone improves the storage layer's message to `record could not be located`. Every test still passes — the compiler has no idea your handler depends on the exact words 'not found'. But in production the `strings.Contains` check now returns `false`, the handler stops returning 404s, and 'not found' responses start coming back as 500s. Error text is written for humans and changes freely; the moment your logic depends on it, a harmless reword becomes a production bug.",
      blocks: [
        {
          type: "scenario",
          scenario: {
            title: "The 404 that silently became a 500",
            context:
              "A handler decides on a 404 by checking strings.Contains(err.Error(), \"not found\"). A later cleanup rewords the storage error to \"record could not be located\". Nothing fails to compile; no test breaks.",
            insight:
              "Logic tied to error TEXT has no compiler protecting it. The message is a human string, not an API — the fix is to test against a stable sentinel, not words.",
          },
        },
        {
          type: "note",
          note: {
            tone: "warning",
            title: "The rule this lesson exists to teach",
            text: "Never branch on the result of err.Error(). Error strings are for people to read, not for code to match. Test identity with errors.Is and type with errors.As instead.",
          },
        },
      ],
    },
    intuition: {
      body: "Here is the whole idea in one picture. An error can *contain* another error, like a set of nesting dolls. When you wrap, you put the original error inside a new outer one that adds your context. The outer error's message reads outside-in ('loading account acc_7: not found'), but the inner errors are all still there, reachable one layer at a time.\n\nGo's tools split cleanly along that picture. To **build** the chain, you wrap with `fmt.Errorf` and the special `%w` verb. To **read** the chain, you have `errors.Is` (does any layer equal this specific sentinel?) and `errors.As` (does any layer have this specific type — and if so, hand it to me). Wrap on the way up; inspect at the top.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "An error chain is nested dolls",
            kind: "stack",
            nodes: [
              {
                id: "handler",
                label: "\"handling GET /accounts: ...\"",
                detail: "outermost — added by the handler",
                tone: "accent",
              },
              {
                id: "service",
                label: "\"loading account acc_7: ...\"",
                detail: "added by the service layer",
              },
              {
                id: "sentinel",
                label: "ErrNotFound (\"not found\")",
                detail: "the innermost, original cause",
                tone: "danger",
              },
            ],
            caption:
              "Each %w wrap adds an outer layer without discarding the inner ones. errors.Is / errors.As walk inward.",
          },
        },
        {
          type: "points",
          items: [
            "Wrapping *nests* the original error inside a new one that adds context.",
            "Build the chain with `fmt.Errorf(..., %w, err)`.",
            "Read the chain with `errors.Is` (same value?) and `errors.As` (same type?).",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Hold three sentences in your head and the rest follows.\n\nFirst: **`%w` wraps, `%v` formats.** Both put the old error's text into the new message, but only `%w` keeps a live link to the original error so it can be found later. `%v` just copies the words and throws the original away. Second: **`errors.Is(err, target)` walks the chain looking for a value equal to `target`** — you use it for *sentinels*, the package-level error variables like `ErrNotFound`. Third: **`errors.As(err, &target)` walks the chain looking for an error of `target`'s type, and copies it into `target`** — you use it when the error is a *struct* and you need a field out of it, like a status code or a file path.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "The one-line rule",
            text: "Wrap with %w to add context while keeping the original reachable; use errors.Is for 'is it this specific error?' and errors.As for 'is it this type — give it to me'.",
          },
        },
        {
          type: "note",
          note: {
            tone: "info",
            title: "Is vs As, in one breath",
            text: "Is answers a yes/no question about identity (== a sentinel). As answers a yes/no question about type AND hands you the typed value so you can read its fields. Reach for As only when you need something out of the error, not just to know it happened.",
          },
        },
      ],
    },
    mechanics: {
      body: "The precise rules. `fmt.Errorf` builds an error from a format string. When that format string contains the verb `%w`, the error it returns is special: it stores the wrapped error and exposes it through an `Unwrap() error` method. That single method is the whole contract — anything with an `Unwrap` method is a link in a chain.\n\n`errors.Is(err, target)` starts at `err` and repeatedly calls `Unwrap`, comparing each error to `target` with `==`, until it finds a match or runs out of layers. `errors.As(err, &target)` walks the same way, but instead of comparing values it checks whether each error's *type* is assignable to `target`; on the first match it assigns that error into `target` and returns `true`. `errors.Unwrap(err)` peels exactly one layer by hand — rarely needed directly, but it's what the other two are built on. Since Go 1.20 you can also wrap *several* errors at once, either with multiple `%w` verbs in one `fmt.Errorf` or with `errors.Join`; `Is` and `As` then search every branch.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "How errors.Is walks the chain",
            kind: "flow",
            nodes: [
              { id: "start", label: "err", detail: "outer wrapped error" },
              { id: "cmp", label: "== target?", detail: "compare this layer", tone: "accent" },
              { id: "unwrap", label: "Unwrap()", detail: "peel one layer inward" },
              { id: "found", label: "match / end", detail: "true if equal, else stop at nil", tone: "success" },
            ],
            caption:
              "Is loops: compare, Unwrap, repeat. As is identical but matches by TYPE and copies the value out.",
          },
        },
        {
          type: "points",
          items: [
            "`%w` makes fmt.Errorf attach an `Unwrap() error` method — that method IS the chain.",
            "`errors.Is` compares each layer to a target with `==` (for sentinels).",
            "`errors.As` matches each layer by type and copies it into your variable (for typed errors).",
            "Multiple `%w` in one Errorf, or `errors.Join`, wrap several errors; Is/As search all branches (Go 1.20+).",
          ],
        },
      ],
    },
    diagram: {
      body: "Let's watch context accumulate as one error rises through three layers. The store produces the sentinel. The service wraps it with what it was doing. The handler wraps that with what *it* was doing. The final message reads the whole journey from the outside, yet `errors.Is` can still reach the sentinel at the bottom.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Context added at each boundary",
            kind: "sequence",
            nodes: [
              { id: "s1", label: "store: return ErrNotFound", detail: "\"not found\"", tone: "danger" },
              {
                id: "s2",
                label: "service: fmt.Errorf(\"loading account %s: %w\", id, err)",
                detail: "\"loading account acc_7: not found\"",
              },
              {
                id: "s3",
                label: "handler: fmt.Errorf(\"GET /accounts/%s: %w\", id, err)",
                detail: "\"GET /accounts/acc_7: loading account acc_7: not found\"",
                tone: "accent",
              },
              {
                id: "s4",
                label: "handler: errors.Is(err, ErrNotFound) → true → 404",
                detail: "inspects the chain, still reaches the sentinel",
                tone: "success",
              },
            ],
            caption:
              "Three layers of context on the outside; one intact sentinel on the inside. That is what %w buys you.",
          },
        },
      ],
    },
    implementation: {
      body: "In practice you spend your time on two moves: wrapping with `%w` as an error leaves a layer, and inspecting with `Is`/`As` at the layer that has to make a decision. Here is the full loop — a sentinel, a typed error, wrapping at each boundary, and both kinds of inspection at the top.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Wrap on the way up, inspect at the top",
            language: "go",
            code: 'package main\n\nimport (\n\t"errors"\n\t"fmt"\n)\n\n// A sentinel: a known, comparable error value.\nvar ErrNotFound = errors.New("not found")\n\n// A typed error: carries data you may want to read.\ntype StorageError struct {\n\tQuery string\n\tErr   error\n}\n\nfunc (e *StorageError) Error() string {\n\treturn fmt.Sprintf("query %q failed: %v", e.Query, e.Err)\n}\nfunc (e *StorageError) Unwrap() error { return e.Err } // makes it a chain link\n\nfunc queryAccount(id string) error {\n\t// The store found nothing; report the sentinel, wrapped in a typed error.\n\treturn &StorageError{Query: "SELECT ... accounts", Err: ErrNotFound}\n}\n\nfunc loadAccount(id string) error {\n\tif err := queryAccount(id); err != nil {\n\t\treturn fmt.Errorf("loading account %s: %w", id, err) // add context, keep chain\n\t}\n\treturn nil\n}\n\nfunc main() {\n\terr := loadAccount("acc_7")\n\n\t// Is: identity check against a sentinel.\n\tif errors.Is(err, ErrNotFound) {\n\t\tfmt.Println("=> respond 404")\n\t}\n\n\t// As: type check that also hands you the value.\n\tvar se *StorageError\n\tif errors.As(err, &se) {\n\t\tfmt.Println("failing query:", se.Query)\n\t}\n}',
            takeaway:
              "One chain carries both: errors.Is finds the sentinel for the 404 decision, errors.As pulls the *StorageError so you can log the failing query.",
          },
        },
        {
          type: "points",
          items: [
            "Wrap with `fmt.Errorf(\"...: %w\", err)` at each boundary that adds meaning.",
            "Give a struct error an `Unwrap() error` method so it joins the chain.",
            "Use `errors.Is` for the sentinel decision; `errors.As` when you need fields out of a typed error.",
          ],
        },
      ],
    },
    experiment: {
      body: "Before reading on, commit to a prediction — a corrected wrong guess sticks better than a right answer you skimmed. Here is a two-layer chain:\n\n`inner := fmt.Errorf(\"reading row: %w\", ErrNotFound)`\n`outer := fmt.Errorf(\"loading account: %v\", inner)`  // note: %v, not %w\n\nWill `errors.Is(outer, ErrNotFound)` return `true` or `false`? Decide now, then reveal.\n\nThe answer is **false**. The break is at the *outer* layer. `inner` was built with `%w`, so on its own `errors.Is(inner, ErrNotFound)` would be `true`. But `outer` used `%v`, which flattened `inner` into plain text and attached no `Unwrap` method. So when `errors.Is` starts at `outer` and tries to walk inward, there is no link to follow — it stops immediately, never reaching the sentinel. One `%v` anywhere in the chain snaps it at that point. The lesson: to keep a sentinel reachable, **every** layer between it and the inspection must use `%w`.",
    },
    "failure-cases": {
      body: "Almost every wrapping bug is one of a handful of recurring slips. Here are the ones you'll actually hit and the signal each gives.",
      blocks: [
        {
          type: "points",
          items: [
            "**Used `%v` where you meant `%w`** → message looks right, but errors.Is/As return false. The chain was severed at that layer.",
            "**Matched error text with strings.Contains** → works until someone rewords the message, then silently breaks. Use errors.Is.",
            "**Passed `target` not `&target` to errors.As** → compile error or a panic; As needs the *address* of your variable to fill it.",
            "**Gave a struct error no `Unwrap()` method** → errors.Is/As can't see through it; it's an opaque leaf, not a chain link.",
            "**Double-wrapped the same context at every layer** → the message becomes repetitive noise. Wrap with what *this* layer adds, once.",
          ],
        },
        {
          type: "example",
          example: {
            title: "errors.As needs a pointer to your variable",
            language: "go",
            code: 'var se *StorageError\n\n// errors.As(err, se)   // wrong: passes the (nil) pointer by value\nif errors.As(err, &se) { // right: pass its address so As can set it\n    fmt.Println(se.Query)\n}',
            takeaway:
              "As stores the matched error into the variable you point it at, so it must receive &se, not se.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "Wrapping is cheap, but it still involves judgement calls. The goal is a policy you can defend and the signal that would change it.",
      blocks: [
        {
          type: "points",
          items: [
            "**Wrap at every layer vs only some**: wrapping at each boundary gives the richest trace, but too many trivial layers make noisy messages. Wrap where a layer adds real meaning.",
            "**`%w` vs `%v` on purpose**: keep `%w` when a caller might inspect the cause; drop to `%v` deliberately to *hide* an internal error you don't want leaking as part of your API.",
            "**Sentinel (`errors.Is`) vs typed error (`errors.As`)**: sentinels are simplest for pure yes/no cases; typed errors cost a struct but carry data (codes, fields) callers can act on.",
            "**`errors.Join` vs fail-fast**: Join reports every failure at once (great for validation) but the caller must handle a multi-branch error; failing on the first is simpler when later checks depend on earlier ones.",
          ],
        },
      ],
    },
    design: {
      body: "Turn the rules into a habit that scales across a codebase. Wrap with `%w` and a short bit of context at each boundary an error crosses — 'what was this layer trying to do'. Inspect only where a decision is made, usually the top (a handler). Define your sentinels and typed errors in the package that owns them, and let callers depend on *those*, never on message text. That single discipline — wrap below, inspect above, never string-match — keeps errors both readable and reliable as the code grows.",
      blocks: [
        {
          type: "points",
          items: [
            "Wrap once per boundary with `%w` and this-layer context; don't repeat context.",
            "Inspect with `errors.Is` / `errors.As` at the decision point, not everywhere.",
            "Expose sentinels and typed errors as your API; never let logic depend on `err.Error()` text.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "One log line that tells the whole story",
            context:
              "A request fails and the handler logs a single wrapped error: \"GET /accounts/acc_7: loading account acc_7: query \\\"SELECT ...\\\" failed: not found\". The handler also called errors.Is and returned a clean 404.",
            insight:
              "The human-readable trace and the machine decision came from the SAME chain — no duplicate error types, no text matching, no lost context.",
          },
        },
      ],
    },
    ledgerflow: {
      body: "Here's the lesson applied to LedgerFlow. A request to fetch an account travels handler → service → store. The store runs a query; when it finds nothing it returns a domain sentinel `ErrAccountNotFound`. The service wraps that with `%w` and the account id it was loading. The handler wraps once more with the route, then calls `errors.Is(err, ErrAccountNotFound)` to decide on a 404 — and `errors.As` to pull out a typed `*StorageError` for the logs. One trace from top to bottom, one clean status decision, and no code anywhere reading error text.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Tracing a failure across LedgerFlow's layers",
            language: "go",
            code: 'var ErrAccountNotFound = errors.New("account not found")\n\n// store\nfunc (s *Store) GetAccount(id string) (*Account, error) {\n    row := s.db.QueryRow("SELECT ... WHERE id = $1", id)\n    if errors.Is(row.Err(), sql.ErrNoRows) {\n        return nil, fmt.Errorf("account %s: %w", id, ErrAccountNotFound)\n    }\n    // ...\n}\n\n// service\nfunc (svc *Service) LoadAccount(id string) (*Account, error) {\n    acc, err := svc.store.GetAccount(id)\n    if err != nil {\n        return nil, fmt.Errorf("loading account: %w", err)\n    }\n    return acc, nil\n}\n\n// handler\nfunc (h *Handler) GetAccount(w http.ResponseWriter, id string) {\n    acc, err := h.svc.LoadAccount(id)\n    if errors.Is(err, ErrAccountNotFound) {\n        http.Error(w, "account not found", http.StatusNotFound) // 404, not 500\n        return\n    }\n    // ... write acc\n    _ = acc\n}',
            takeaway:
              "Each layer wraps with %w and its own context; the handler inspects with errors.Is to map the domain sentinel to a 404.",
          },
        },
        {
          type: "points",
          items: [
            "Store maps the raw DB miss to the domain sentinel ErrAccountNotFound, wrapped with the id.",
            "Service and handler each add one layer of context with %w — the log shows the full path.",
            "Handler decides the HTTP status with errors.Is, never by reading the message text.",
          ],
        },
      ],
    },
    exercises: {
      body: "Practice is what turns 'I recognize %w' into 'I can wrap and inspect without looking it up'. Work across prediction, code-reading, implementation, debugging, refactoring, and an advanced task — each produces a different kind of evidence, so clearing one doesn't cover the rest.",
    },
    mastery: {
      body: "You've mastered this lesson when you can do four things without notes: explain how `%w` differs from `%v` in terms of what the resulting error can still do; predict what `errors.Is` returns against a multi-layer chain; write code that wraps with context and later extracts a typed error with `errors.As`; and defend a layered design that wraps below and inspects above without ever string-matching. Check a criterion only when you truly have that evidence — reading the lesson doesn't count.",
    },
    summary: {
      body: "Two ideas carry the whole lesson: **`%w` wraps (keeps the original reachable) while `%v` only formats (discards it)**, and **you inspect the resulting chain with `errors.Is` for a specific value and `errors.As` for a specific type**. Wrap with context at each layer, inspect at the top, and never let your logic depend on error text.",
      blocks: [
        {
          type: "points",
          items: [
            "`fmt.Errorf(\"...: %w\", err)` adds context AND keeps the original in the chain; `%v` keeps only the text.",
            "`errors.Is(err, target)` walks the chain for a value equal to a sentinel.",
            "`errors.As(err, &target)` walks the chain for a matching TYPE and copies it into your variable.",
            "One `%v` anywhere between the sentinel and the check breaks Is/As at that point.",
            "`errors.Join` (Go 1.20+) wraps several errors at once; Is/As search every branch.",
            "Never branch on `err.Error()` text — it's for humans, not code.",
          ],
        },
      ],
    },
  },
};
