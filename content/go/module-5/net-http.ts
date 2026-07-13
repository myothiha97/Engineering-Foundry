import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 5, net/http: servers, handlers & middleware — build a real HTTP service
 * out of one small interface (http.Handler), route with the standard ServeMux
 * using Go 1.22+ method+path patterns, decode requests and encode responses by
 * reusing the io.Reader/io.Writer you already know, and wrap handlers with
 * middleware (func(http.Handler) http.Handler). Same beginner-friendly voice as
 * Modules 0–4: plain language, one analogy per hard idea, a concrete example
 * before the abstract rule, correct idiomatic Go (1.22+ routing).
 */
export const goNetHttp: Lesson = {
  id: "go-net-http",
  slug: "net-http",
  title: "net/http: servers, handlers & middleware",
  description:
    "Serve HTTP with one small interface: write handlers, route requests with the standard ServeMux and Go 1.22+ patterns, and wrap behavior with composable middleware — no framework required.",
  moduleId: "go-5",
  estimatedMinutes: 65,
  difficulty: "intermediate",
  prerequisites: ["go-io-reader-writer", "go-json"],
  learningObjectives: [
    "Explain the http.Handler interface and how http.HandlerFunc turns an ordinary function into one",
    "Route requests with http.ServeMux using Go 1.22+ method+path patterns and read wildcards with r.PathValue",
    "Wrap handlers with middleware of type func(http.Handler) http.Handler and chain several together",
  ],
  concepts: ["net/http", "handlers", "middleware", "http-client"],
  ledgerFlowApplications: [
    "Serve the LedgerFlow account and transfer API on net/http with no third-party web framework",
    "Add logging, authentication, and panic-recovery as reusable middleware around every route",
    "Call an external exchange-rate service with an http.Client that has an explicit timeout",
  ],
  references: [
    {
      title: "net/http package documentation",
      url: "https://pkg.go.dev/net/http",
      teaches: "The Handler and HandlerFunc types, ServeMux, ResponseWriter, Request, Server, and Client.",
      relevance: "The authoritative API reference for every type this lesson builds a service from.",
      required: true,
      section: "type Handler; type HandlerFunc; type ServeMux; type Client",
    },
    {
      title: "Routing enhancements for Go 1.22",
      url: "https://go.dev/blog/routing-enhancements",
      teaches: "Method-specific patterns, path wildcards like {id}, and r.PathValue in the standard ServeMux.",
      relevance: "Explains the modern routing this lesson uses instead of hand-parsing r.URL.Path or a framework.",
      required: true,
      section: "Method matching; Wildcards; Precedence",
    },
    {
      title: "Writing Web Applications",
      url: "https://go.dev/doc/articles/wiki/",
      teaches: "Building a small server end to end with handlers, the ServeMux, and http.ListenAndServe.",
      relevance: "The official worked example of the exact handler-and-mux shape you assemble here.",
      required: false,
      section: "Introducing the net/http package; Handling multiple pages",
    },
  ],
  exercises: [
    {
      id: "go5ht-predict-handlerfunc",
      type: "prediction",
      prompt:
        "`http.HandlerFunc` is defined as `type HandlerFunc func(ResponseWriter, *Request)` with a method `ServeHTTP(w, r) { f(w, r) }`. Predict whether `var h http.Handler = http.HandlerFunc(myFunc)` compiles, and explain in terms of the method set what makes a plain function usable where a Handler is required.",
      expectedAnswer:
        "It compiles. HandlerFunc is a named function type that has a ServeHTTP method, so it satisfies the http.Handler interface (which requires exactly ServeHTTP). Converting myFunc to HandlerFunc gives the function a ServeHTTP method whose body just calls the function itself, so the function value can be used anywhere a Handler is expected.",
      hints: [
        "http.Handler requires one method: ServeHTTP(w, r).",
        "HandlerFunc is a type with that method; converting a function to it borrows the method.",
      ],
    },
    {
      id: "go5ht-read-pathvalue",
      type: "code-reading",
      prompt:
        'A route is registered as `mux.HandleFunc("GET /accounts/{id}", h)` and the handler calls `id := r.PathValue("id")`. For a request to `GET /accounts/a17`, state what `id` holds and what would happen to a `POST /accounts/a17` request against this mux.',
      hints: [
        "The {id} wildcard captures the matching path segment by name.",
        "The pattern names the GET method explicitly — other methods do not match it.",
      ],
    },
    {
      id: "go5ht-implement-getaccount",
      type: "implementation",
      prompt:
        "Complete getAccount so it reads the {id} wildcard, sets the JSON content type, and encodes the account to the response body using json.NewEncoder. Return the account {ID: id, BalanceC: 1500}.",
      starterCode:
        'package main\n\nimport (\n  "encoding/json"\n  "net/http"\n)\n\ntype Account struct {\n  ID       string `json:"id"`\n  BalanceC int64  `json:"balanceC"`\n}\n\nfunc getAccount(w http.ResponseWriter, r *http.Request) {\n  // 1. read the {id} path wildcard\n  // 2. set the Content-Type header to application/json\n  // 3. encode Account{ID: id, BalanceC: 1500} to w\n}\n\nfunc main() {\n  mux := http.NewServeMux()\n  mux.HandleFunc("GET /accounts/{id}", getAccount)\n  http.ListenAndServe(":8080", mux)\n}',
      expectedAnswer:
        'func getAccount(w http.ResponseWriter, r *http.Request) {\n  id := r.PathValue("id")\n  w.Header().Set("Content-Type", "application/json")\n  acct := Account{ID: id, BalanceC: 1500}\n  json.NewEncoder(w).Encode(acct)\n}',
      hints: [
        "r.PathValue(\"id\") returns the captured segment as a string.",
        "w is an io.Writer, so json.NewEncoder(w).Encode(v) writes JSON straight to the response.",
      ],
    },
    {
      id: "go5ht-debug-writeheader-order",
      type: "debugging",
      prompt:
        "A handler calls `w.Write([]byte(\"not found\"))` and then `w.WriteHeader(http.StatusNotFound)`, but the client still receives 200. Explain why the status is wrong and fix the ordering.",
      hints: [
        "The first write to the body implicitly sends a 200 status before your WriteHeader runs.",
        "Call w.WriteHeader(code) before writing any body bytes — or use http.Error for error responses.",
      ],
    },
    {
      id: "go5ht-refactor-middleware",
      type: "refactoring",
      prompt:
        "Three handlers each start with the same `log.Printf(\"%s %s\", r.Method, r.URL.Path)` line. Refactor that duplicated logging into a single middleware of type func(http.Handler) http.Handler and wrap the mux with it, so no handler logs by itself.",
      hints: [
        "A middleware takes an http.Handler and returns a new http.Handler that does work, then calls next.ServeHTTP(w, r).",
        "Wrap once at the top: http.ListenAndServe(addr, logging(mux)).",
      ],
    },
    {
      id: "go5ht-design-api",
      type: "design",
      prompt:
        "Design the routes and middleware chain for a minimal LedgerFlow API that lists accounts, fetches one account by id, and creates a transfer. Say which patterns you register on the ServeMux and the order you place recovery, logging, and auth middleware — and justify that order.",
      hints: [
        "Use method+path patterns like GET /accounts, GET /accounts/{id}, POST /transfers.",
        "Outer middleware runs first on the way in; recovery usually goes outermost so it can catch panics from everything inside.",
      ],
    },
    {
      id: "go5ht-advanced-client-timeout",
      type: "advanced",
      prompt:
        "Write a function fetchRate that calls an external rate service with an http.Client that has a 3-second Timeout (not http.DefaultClient), decodes the JSON body into a Rate struct, and guarantees resp.Body is closed on every path. Then explain what specifically goes wrong in production if you use http.DefaultClient with no timeout instead.",
      hints: [
        "Construct &http.Client{Timeout: 3 * time.Second} and call its Get/Do method.",
        "defer resp.Body.Close() right after checking the error, so it closes on both success and later failures.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-handler",
      kind: "explain",
      description:
        "Explain the http.Handler interface (one ServeHTTP method) and how http.HandlerFunc adapts an ordinary function into a Handler.",
      required: true,
    },
    {
      id: "implement-routed-service",
      kind: "implement",
      description:
        "Build a small service that registers Go 1.22+ method+path routes on a ServeMux, reads a {wildcard} with r.PathValue, and encodes a JSON response.",
      required: true,
    },
    {
      id: "explain-middleware",
      kind: "explain",
      description:
        "Explain middleware as func(http.Handler) http.Handler, why the outermost wrapper runs first, and how a chain composes.",
      required: true,
    },
    {
      id: "design-client-timeout",
      kind: "design",
      description:
        "Justify using an http.Client with an explicit Timeout over http.DefaultClient, and always closing resp.Body.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "Almost every Go service you'll write talks to the outside world over HTTP: a browser, a mobile app, or another service sends a request, and your program sends back a response. The question this lesson answers is deceptively simple — when a request arrives, *which of your functions runs, and how does its answer get back to the caller?*\n\nComing from other languages you might reach for a big web framework to manage this. Go doesn't need one. Its standard library ships `net/http`, and the whole model rests on a single tiny interface plus a router that comes in the box. Learn those two pieces and you can serve real traffic without importing anything third-party.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "Think of a restaurant. A request is a customer walking in; the router (the ServeMux) is the host who reads what they want and walks them to the right table; the handler is the waiter assigned to that table who actually takes the order and brings food back. You don't need a franchise operations manual (a framework) to run one small restaurant — a host and some waiters are enough.",
          },
        },
        {
          type: "points",
          items: [
            "An HTTP **request** comes in; your job is to produce an HTTP **response**.",
            "A **handler** is the code that runs for a given request and writes the response.",
            "A **router** (Go's `http.ServeMux`) decides *which* handler runs for a given method and path.",
          ],
        },
      ],
    },
    naive: {
      body: "The first instinct is to write one giant function that inspects the request itself: read `r.URL.Path`, `switch` on the string, and hand-parse `/accounts/a17` to pull out the id. It works for two routes and becomes a swamp at ten — every new endpoint adds another string comparison, and you re-implement method checking and path splitting by hand each time.\n\nThe second naive instinct is to assume you must install a framework to escape that swamp. You don't. Since Go 1.22 the standard `ServeMux` understands the method and path *for* you, including named wildcards — so the hand-parsing disappears without a single dependency.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Hand-routing: correct, but it won't scale",
            language: "go",
            code:
              'func handler(w http.ResponseWriter, r *http.Request) {\n    // fragile: you re-check the method and slice the path yourself\n    if r.Method == "GET" && strings.HasPrefix(r.URL.Path, "/accounts/") {\n        id := strings.TrimPrefix(r.URL.Path, "/accounts/")\n        fmt.Fprintf(w, "account %s", id)\n        return\n    }\n    http.NotFound(w, r)\n}',
            takeaway:
              "This grows a new fragile branch per route. The standard ServeMux was built to replace exactly this pattern.",
          },
        },
        {
          type: "points",
          items: [
            "Hand-parsing `r.URL.Path` and switching on it doesn't scale and repeats method/path logic.",
            "You don't need a framework — Go 1.22+ `ServeMux` matches method + path + wildcards natively.",
          ],
        },
      ],
    },
    failure: {
      body: "Even once routing works, two mistakes bite almost everyone new to `net/http`, and neither produces a compile error — the code runs and quietly misbehaves.\n\nThe first is calling `w.WriteHeader` *after* you've already written body bytes. The very first write to a `ResponseWriter` sends the status line, so if you write the body first, Go has already sent `200 OK` and your later `WriteHeader(404)` is ignored (it logs a warning at most). The second is calling an external service with `http.DefaultClient`, which has **no timeout**: if that service hangs, your handler's goroutine hangs with it — forever — and under load your whole service can pile up blocked goroutines until it falls over.",
      blocks: [
        {
          type: "scenario",
          scenario: {
            title: "The 200 that should have been a 404",
            context:
              "A handler writes an error message to the body and then calls w.WriteHeader(http.StatusNotFound). Clients and monitoring see 200 OK with error text in the body, so a broken lookup looks 'healthy' on the dashboard.",
            insight:
              "The first body write already flushed a 200 status. Status must be set before any body byte — order is the whole bug.",
          },
        },
        {
          type: "points",
          items: [
            "`w.WriteHeader(code)` must be called **before** the first `w.Write` — the first write locks in the status.",
            "`http.DefaultClient` has no `Timeout`; a slow upstream can hang your handler goroutine indefinitely.",
          ],
        },
      ],
    },
    intuition: {
      body: "Replace the swamp with two clean ideas. First, a **handler** is anything that can answer a request — Go captures that as a one-method interface, `http.Handler`, whose only method is `ServeHTTP(w, r)`. Anything with that method can serve HTTP. Second, `w` and `r` are old friends in disguise: `w http.ResponseWriter` **is an `io.Writer`** (you write the response by writing bytes to it), and `r.Body` **is an `io.Reader`** (you read the request the same way you read any stream). Everything you learned about readers and writers, and about JSON encoding, applies here unchanged.\n\nSo the mental shift is: you're not learning a new I/O model, you're pointing the one you already know at the network. Decode a request with `json.NewDecoder(r.Body)`; encode a response with `json.NewEncoder(w)`.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Request in, response out — through familiar interfaces",
            kind: "flow",
            nodes: [
              { id: "req", label: "request", detail: "method + path + body" },
              { id: "mux", label: "ServeMux", detail: "matches route → handler" },
              { id: "handler", label: "handler", detail: "ServeHTTP(w, r)", tone: "accent" },
              { id: "read", label: "r.Body", detail: "an io.Reader — json.NewDecoder(r.Body)" },
              { id: "write", label: "w", detail: "an io.Writer — json.NewEncoder(w)", tone: "success" },
            ],
            caption: "The router picks a handler; the handler reads r.Body (Reader) and writes to w (Writer).",
          },
        },
        {
          type: "points",
          items: [
            "`http.Handler` is a one-method interface: `ServeHTTP(w http.ResponseWriter, r *http.Request)`.",
            "`w` satisfies `io.Writer`; `r.Body` satisfies `io.Reader` — reuse everything you know.",
            "JSON in: `json.NewDecoder(r.Body)`. JSON out: `json.NewEncoder(w)`.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Hold three rules. **One:** a handler is just something with a `ServeHTTP` method — and because writing a struct with a method for every endpoint is tedious, `http.HandlerFunc` lets an ordinary function *become* a handler. It's a named type, `type HandlerFunc func(ResponseWriter, *Request)`, that has a `ServeHTTP` method whose body just calls the function itself. Wrapping your function in it (or letting `mux.HandleFunc` do it) borrows a method for a plain function.\n\n**Two:** the `ServeMux` maps a *pattern* (like `GET /accounts/{id}`) to a handler, and calls the best match. **Three:** middleware is a handler that wraps another handler — same interface in, same interface out — so you can stack cross-cutting behavior (logging, auth, recovery) around your real logic without touching it.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "tip",
            title: "HandlerFunc in one line",
            text: "`http.HandlerFunc(myFunc)` = 'give my function a ServeHTTP method so it counts as a Handler'. `mux.HandleFunc(pattern, myFunc)` does that conversion for you — that's the only difference between HandleFunc and Handle.",
          },
        },
        {
          type: "example",
          example: {
            title: "A function becomes a Handler",
            language: "go",
            code:
              'func ping(w http.ResponseWriter, r *http.Request) {\n    fmt.Fprintln(w, "pong")\n}\n\nfunc main() {\n    // HandlerFunc gives ping a ServeHTTP method, so it satisfies http.Handler.\n    var h http.Handler = http.HandlerFunc(ping)\n    _ = h\n}',
            takeaway: "You rarely write a struct with ServeHTTP by hand — HandlerFunc adapts a plain function for you.",
          },
        },
      ],
    },
    mechanics: {
      body: "Now the precise pieces. `http.NewServeMux()` builds a router. You register routes with `mux.Handle(pattern, handler)` or the convenience `mux.HandleFunc(pattern, func)`. Since Go 1.22 a *pattern* can name a method and use `{name}` wildcards: `\"GET /accounts/{id}\"` matches only GET requests whose path is `/accounts/<something>`, and inside the handler `r.PathValue(\"id\")` returns that segment. When two patterns match, the **more specific** one wins (a fixed path beats a wildcard), so you don't have to worry about registration order.\n\nWriting a response has an order: optionally set headers with `w.Header().Set(...)`, then optionally set the status with `w.WriteHeader(code)`, then write the body with `w.Write` (or `json.NewEncoder(w).Encode`, or `fmt.Fprintf(w, ...)`). If you skip `WriteHeader`, the first body write sends `200`. Finally, `http.ListenAndServe(addr, mux)` starts the server; passing `nil` instead of `mux` uses the global default mux, which you should avoid for clarity.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Response order (do it in this sequence)",
            kind: "sequence",
            nodes: [
              { id: "hdr", label: "w.Header().Set(...)", detail: "set headers first — e.g. Content-Type" },
              { id: "status", label: "w.WriteHeader(code)", detail: "set status; optional (defaults to 200)" },
              { id: "body", label: "w.Write / Encode / Fprintf", detail: "first write locks the status in", tone: "accent" },
            ],
            caption: "Headers, then status, then body. The first body write finalizes the status code.",
          },
        },
        {
          type: "example",
          example: {
            title: "Method + path patterns and a wildcard",
            language: "go",
            code:
              'mux := http.NewServeMux()\n\nmux.HandleFunc("GET /accounts", listAccounts)        // collection\nmux.HandleFunc("GET /accounts/{id}", getAccount)     // one item\nmux.HandleFunc("POST /transfers", createTransfer)    // create\n\nfunc getAccount(w http.ResponseWriter, r *http.Request) {\n    id := r.PathValue("id") // the {id} segment, e.g. "a17"\n    fmt.Fprintf(w, "account %s", id)\n}',
            takeaway: "The method is part of the pattern; {id} captures a segment you read with r.PathValue.",
          },
        },
        {
          type: "points",
          items: [
            "`mux.HandleFunc(\"GET /accounts/{id}\", h)` matches method + path; `r.PathValue(\"id\")` reads the wildcard.",
            "A non-matching method (e.g. POST to a GET-only pattern) gets an automatic `405 Method Not Allowed`.",
            "More specific patterns win over wildcards, so registration order doesn't matter.",
          ],
        },
      ],
    },
    diagram: {
      body: "Middleware is the piece worth seeing as a picture, because 'a function that returns a handler wrapping a handler' is a mouthful in prose. A middleware has type `func(http.Handler) http.Handler`: it takes the next handler, and returns a new handler that does some work (log, check auth, recover from a panic) and then — usually — calls `next.ServeHTTP(w, r)`. Chaining several means each wraps the next, like nesting boxes. Trace how a request travels inward through each wrapper to your real handler, and how the response travels back out.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "A request through a middleware chain",
            kind: "flow",
            nodes: [
              { id: "recover", label: "recovery", detail: "outermost: catches panics from everything inside", tone: "accent" },
              { id: "log", label: "logging", detail: "records method, path, and duration" },
              { id: "auth", label: "auth", detail: "rejects or lets the request continue" },
              { id: "handler", label: "your handler", detail: "the real work: ServeHTTP", tone: "success" },
            ],
            caption: "recovery(logging(auth(handler))): the outermost wrapper runs first on the way in, last on the way out.",
          },
        },
        {
          type: "note",
          note: {
            tone: "info",
            title: "Why recovery goes outermost",
            text: "The outermost middleware surrounds all the others, so its deferred recover() can catch a panic from any inner layer or the handler — turning a crash into a clean 500 instead of a dropped connection.",
          },
        },
      ],
    },
    implementation: {
      body: "Put it together end to end: a JSON handler that reads the request body and writes a response, then a logging middleware that wraps the whole mux. Notice the handler never mentions logging, and the middleware never mentions accounts — each does one job, and they compose through the shared `http.Handler` interface.",
      blocks: [
        {
          type: "example",
          example: {
            title: "A JSON handler: decode r.Body, encode to w",
            language: "go",
            code:
              'type Account struct {\n    ID       string `json:"id"`\n    BalanceC int64  `json:"balanceC"`\n}\n\nfunc createAccount(w http.ResponseWriter, r *http.Request) {\n    var in Account\n    // r.Body is an io.Reader — decode straight from it.\n    if err := json.NewDecoder(r.Body).Decode(&in); err != nil {\n        http.Error(w, "invalid JSON", http.StatusBadRequest)\n        return\n    }\n    w.Header().Set("Content-Type", "application/json")\n    w.WriteHeader(http.StatusCreated) // set status BEFORE writing the body\n    // w is an io.Writer — encode straight to it.\n    json.NewEncoder(w).Encode(in)\n}',
            takeaway: "Decode from r.Body, set headers and status, then encode to w — all through the io interfaces you know.",
          },
        },
        {
          type: "example",
          example: {
            title: "Logging middleware: func(http.Handler) http.Handler",
            language: "go",
            code:
              'func logging(next http.Handler) http.Handler {\n    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {\n        start := time.Now()\n        next.ServeHTTP(w, r) // call the wrapped handler\n        log.Printf("%s %s (%s)", r.Method, r.URL.Path, time.Since(start))\n    })\n}\n\nfunc main() {\n    mux := http.NewServeMux()\n    mux.HandleFunc("POST /accounts", createAccount)\n    // Wrap the whole mux once; every route is now logged.\n    log.Fatal(http.ListenAndServe(":8080", logging(mux)))\n}',
            takeaway: "Middleware takes the next Handler and returns a new one — wrap the mux once and every route is covered.",
          },
        },
        {
          type: "points",
          items: [
            "Decode requests with `json.NewDecoder(r.Body)`, encode responses with `json.NewEncoder(w)`.",
            "Set status before the body; use `http.Error(w, msg, code)` for the common error case.",
            "Wrap the mux with middleware once in `main`; each middleware returns an `http.Handler`.",
          ],
        },
      ],
    },
    experiment: {
      body: "Predict before you read on — a corrected guess sticks better than a skimmed answer. Two middlewares are chained as `logging(auth(mux))`, where `logging` prints \"log\" before calling next, and `auth` prints \"auth\" before calling next. A request comes in. In what order do the two words print — \"log\" then \"auth\", or \"auth\" then \"log\"? Commit to an answer.\n\nIt prints **\"log\" then \"auth\"**. `logging(auth(mux))` means `logging` is the *outer* wrapper: when the request arrives, `logging`'s code runs first, prints \"log\", then calls `next.ServeHTTP` — and its `next` is the handler returned by `auth`. So `auth` runs next, prints \"auth\", then calls the mux, which runs your handler. The rule: the **outermost** middleware runs first on the way in. Reading the chain from left to right is reading it from outside to inside. That's exactly why panic-recovery goes outermost — it must wrap everything so its deferred `recover()` can catch a panic from any layer beneath it.",
    },
    "failure-cases": {
      body: "Server bugs at this level cluster around a short list. Learn the signal each gives so you spot it fast.",
      blocks: [
        {
          type: "points",
          items: [
            "**Body written before `WriteHeader`** → your status code is ignored; the client sees 200. Set status first.",
            "**`http.DefaultClient` with no timeout** → a hung upstream hangs your handler goroutine forever. Use `&http.Client{Timeout: ...}`.",
            "**Forgetting `resp.Body.Close()`** → leaked connections that eventually exhaust the pool. `defer resp.Body.Close()` right after the error check.",
            "**Passing `nil` to `ListenAndServe`** → you silently use the global default mux; pass your own mux explicitly.",
            "**Not returning after `http.Error`** → the handler keeps running and writes a second response. `return` after writing an error.",
          ],
        },
        {
          type: "example",
          example: {
            title: "A client that can hang forever vs one that can't",
            language: "go",
            code:
              '// WRONG: no timeout — if the server never responds, this never returns.\nresp, err := http.DefaultClient.Get(url)\n\n// RIGHT: bound the whole request/response with an explicit timeout.\nclient := &http.Client{Timeout: 3 * time.Second}\nresp, err := client.Get(url)\nif err != nil {\n    return err\n}\ndefer resp.Body.Close() // close on every path once err is nil',
            takeaway: "Always give a production http.Client a Timeout, and always defer resp.Body.Close() after the error check.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "The standard library gives you real choices, each with a cost. Pick the one you can defend for the service in front of you.",
      blocks: [
        {
          type: "points",
          items: [
            "**Standard `ServeMux` vs a framework**: the mux is dependency-free and enough for most APIs, but a framework adds niceties (grouping, binding) at the cost of a dependency and a learning curve. Start with the mux.",
            "**Middleware chain vs logic inside handlers**: middleware keeps cross-cutting concerns in one place and composable, but adds indirection you must trace to follow a request.",
            "**One shared `http.Client` vs one per call**: reusing a client reuses connections (faster); creating one per call is simpler but wasteful. Either way, set a `Timeout`.",
            "**`json.NewEncoder(w)` (streaming) vs `json.Marshal` then `w.Write`**: encoding straight to `w` avoids buffering the whole payload, but you can't easily set `Content-Length` or catch an encode error before sending 200.",
          ],
        },
      ],
    },
    design: {
      body: "Turn the rules into habits. Register explicit method+path patterns on your own `ServeMux` rather than parsing paths by hand. Keep handlers thin — decode, do one thing, encode — and push cross-cutting concerns (logging, auth, recovery) into middleware wrapped around the mux. Set the status before the body, and treat every outbound HTTP call as untrusted: give the client a timeout and always close the response body.",
      blocks: [
        {
          type: "points",
          items: [
            "Use explicit `METHOD /path/{wildcard}` patterns; read wildcards with `r.PathValue`.",
            "Keep handlers thin; put logging, auth, and recovery in `func(http.Handler) http.Handler` middleware.",
            "Set status before body; `return` after `http.Error`.",
            "Every outbound call: explicit client `Timeout` + `defer resp.Body.Close()`.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Designing the middleware order",
            context:
              "A service needs request logging, token auth, and panic recovery. A junior engineer wraps them as auth(logging(recovery(mux))).",
            insight:
              "That puts recovery innermost, so a panic in auth or logging escapes it. Reorder to recovery(logging(auth(mux))): recovery outermost catches everything, logging records every request including rejected ones, auth guards the handler.",
          },
        },
      ],
    },
    ledgerflow: {
      body: "This is exactly how LedgerFlow serves its API. A single `http.ServeMux` registers the money routes — `GET /accounts`, `GET /accounts/{id}`, `POST /transfers` — and each handler is thin: decode the request body into a typed struct, call the service layer that holds the real transfer logic, and encode the result. The handlers never touch logging, auth, or panic handling directly; those live in a middleware chain wrapped around the mux, so every route gets them for free and in the same order.\n\nThe outbound side matters just as much. When LedgerFlow needs a currency rate from an external service, it uses an `http.Client` with an explicit `Timeout` — never `http.DefaultClient` — so a slow rate provider can't hang a transfer request forever, and it always closes the response body so connections don't leak under load.",
      blocks: [
        {
          type: "example",
          example: {
            title: "LedgerFlow routes, middleware chain, and a timed-out client",
            language: "go",
            code:
              'func routes(svc *AccountService) http.Handler {\n    mux := http.NewServeMux()\n    mux.HandleFunc("GET /accounts", svc.listAccounts)\n    mux.HandleFunc("GET /accounts/{id}", svc.getAccount)\n    mux.HandleFunc("POST /transfers", svc.createTransfer)\n    // recovery outermost, then logging, then auth around every route.\n    return recovery(logging(auth(mux)))\n}\n\n// A bounded client for the external rate service.\nvar rateClient = &http.Client{Timeout: 3 * time.Second}\n\nfunc fetchRate(ctx context.Context, url string) (Rate, error) {\n    resp, err := rateClient.Get(url)\n    if err != nil {\n        return Rate{}, err\n    }\n    defer resp.Body.Close()\n    var rate Rate\n    return rate, json.NewDecoder(resp.Body).Decode(&rate)\n}',
            takeaway: "One mux, one middleware chain, and a timed-out client — no web framework, and no way for an upstream to hang a transfer.",
          },
        },
        {
          type: "diagram",
          diagram: {
            title: "LedgerFlow HTTP request path",
            kind: "flow",
            nodes: [
              { id: "req", label: "POST /transfers", detail: "JSON body" },
              { id: "mw", label: "middleware", detail: "recovery → logging → auth", tone: "accent" },
              { id: "handler", label: "handler", detail: "decode → service → encode" },
              { id: "svc", label: "service layer", detail: "the real transfer logic", tone: "success" },
            ],
            caption: "The handler stays thin: it decodes, delegates to the service, and encodes the response.",
          },
        },
      ],
    },
    exercises: {
      body: "Practice turns 'I recognize this' into 'I can build it'. Work across prediction, code-reading, implementation, debugging, refactoring, design, and one advanced client-timeout task. Each kind produces different evidence, so clearing one doesn't cover the rest — the implementation and the client-timeout exercises in particular are the ones that most resemble real service code.",
    },
    mastery: {
      body: "You've mastered this lesson when four signals hold without notes: you can explain the `http.Handler` interface and how `http.HandlerFunc` adapts a plain function into one; build a small service that registers Go 1.22+ method+path routes on a `ServeMux` and reads a `{wildcard}` with `r.PathValue`; explain middleware as `func(http.Handler) http.Handler`, why the outermost wrapper runs first, and how a chain composes; and justify an `http.Client` with an explicit `Timeout` over `http.DefaultClient` plus always closing `resp.Body`. Check a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "Three ideas carry this lesson: a **handler** is a one-method interface (`ServeHTTP`) that `http.HandlerFunc` lets any function satisfy; the standard **`ServeMux`** routes by method + path with `{wildcard}` patterns you read via `r.PathValue`; and **middleware** is `func(http.Handler) http.Handler` that wraps handlers so cross-cutting concerns compose. Because `w` is an `io.Writer` and `r.Body` is an `io.Reader`, your JSON and I/O knowledge transfers directly — and no framework is required.",
      blocks: [
        {
          type: "points",
          items: [
            "`http.Handler` = one method, `ServeHTTP(w, r)`; `http.HandlerFunc` adapts a plain function into it.",
            "Route with `mux.HandleFunc(\"GET /accounts/{id}\", h)`; read the wildcard with `r.PathValue(\"id\")`.",
            "`w` is an `io.Writer`, `r.Body` is an `io.Reader`: decode with `json.NewDecoder(r.Body)`, encode with `json.NewEncoder(w)`.",
            "Set status before body; middleware `func(http.Handler) http.Handler` wraps the mux, outermost first.",
            "Give every `http.Client` a `Timeout` and always `defer resp.Body.Close()`. Next up: context and cancellation.",
          ],
        },
      ],
    },
  },
};
