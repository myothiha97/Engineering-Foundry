import type { CurriculumModule, Lesson } from "../../../packages/content-schema/src/index";

export { goToolchainModules } from "./toolchain-modules";

export const goModule0: CurriculumModule = {
  id: "go-0",
  courseId: "go",
  title: "How Go Becomes a Process",
  order: 0,
  description:
    "Trace source through compilation, linking, initialization, runtime startup, and a running executable.",
  lessonIds: ["go-source-to-process", "go-toolchain-modules"],
  projectId: "go-execution-inspector",
};

export const goSourceToProcess: Lesson = {
  id: "go-source-to-process",
  slug: "source-to-process",
  title: "From source file to running process",
  description: "Build a causal model of what the Go toolchain and runtime do before main runs.",
  moduleId: "go-0",
  estimatedMinutes: 70,
  difficulty: "beginner",
  prerequisites: [],
  learningObjectives: [
    "Trace compile, link, load, initialization, and startup",
    "Predict package initialization order",
    "Distinguish language, toolchain, OS, and runtime responsibilities",
  ],
  concepts: [
    "compilation",
    "linking",
    "packages",
    "initialization",
    "runtime",
    "build-cache",
    "cross-compilation",
    "garbage-collection",
  ],
  ledgerFlowApplications: [
    "Produce a reproducible LedgerFlow API binary",
    "Keep startup configuration deterministic",
    "Reason about deployment artifacts and health checks",
  ],
  references: [
    {
      title: "The Go Programming Language Specification",
      url: "https://go.dev/ref/spec",
      teaches: "The normative rules for programs, packages, and initialization.",
      relevance: "Separates guaranteed language behavior from toolchain implementation.",
      required: true,
      section: "Program initialization and execution",
    },
    {
      title: "Go command documentation",
      url: "https://pkg.go.dev/cmd/go",
      teaches: "Build modes, module resolution, environment, and cache behavior.",
      relevance: "Explains the build tool that turns packages into artifacts.",
      required: true,
      section: "Compile packages and dependencies; Build and test caching",
    },
    {
      title: "A Guide to the Go Garbage Collector",
      url: "https://go.dev/doc/gc-guide",
      teaches: "Why the runtime manages heap memory and the costs involved.",
      relevance: "Introduces runtime responsibility without premature tuning.",
      required: false,
      section: "Where Go values live",
    },
  ],
  exercises: [
    {
      id: "go0-predict-init",
      type: "prediction",
      prompt: "Predict the exact output order when package config initializes before package main.",
      expectedAnswer: "dependency init → main package variables → main init → main",
      hints: ["Dependencies must be initialized first."],
    },
    {
      id: "go0-read-build",
      type: "code-reading",
      prompt: "Identify which symbols can be discarded by the linker and why.",
      hints: [],
    },
    {
      id: "go0-implement-buildinfo",
      type: "implementation",
      prompt: "Implement buildInfo so the binary reports a non-empty runtime version.",
      starterCode:
        'package main\n\nimport (\n  "fmt"\n  "runtime"\n)\n\nfunc buildInfo() string {\n  // return the Go runtime version\n  return ""\n}\n\nfunc main() { fmt.Println(buildInfo()) }',
      expectedAnswer: "func buildInfo() string { return runtime.Version() }",
      hints: ["The imported runtime package exposes Version()."],
    },
    {
      id: "go0-debug-init",
      type: "debugging",
      prompt:
        "A service reads configuration in a package-level variable before environment validation. Explain the failure and move the work to an explicit startup phase.",
      hints: [],
    },
    {
      id: "go0-refactor",
      type: "refactoring",
      prompt: "Replace hidden init side effects with an explicit NewServer dependency graph.",
      hints: [],
    },
    {
      id: "go0-design",
      type: "design",
      prompt:
        "Choose static or dynamically linked deployment for LedgerFlow and state what evidence could reverse the choice.",
      hints: [],
    },
    {
      id: "go0-advanced",
      type: "advanced",
      prompt:
        "Use go build -x and go tool nm locally; annotate which stage produced each observation.",
      hints: [],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-pipeline",
      kind: "explain",
      description: "Explain source → packages → object code → executable → process without notes.",
      required: true,
    },
    {
      id: "predict-init",
      kind: "predict",
      description: "Correctly predict initialization order across three packages.",
      required: true,
    },
    {
      id: "build-artifact",
      kind: "implement",
      description: "Build and inspect a cross-compiled binary.",
      required: true,
    },
    {
      id: "ledger-startup",
      kind: "design",
      description: "Defend LedgerFlow startup ordering and failure behavior.",
      required: true,
    },
  ],
  sections: {
    problem: {
      body: "When you run a Go program on your laptop, you usually type `go run main.go` and it just works. That convenience hides something important: in production you don't ship your `.go` files at all — you ship a single compiled **binary** (an executable file the operating system can run directly).\n\nBecause `go run` blurs this, it's natural to assume the computer reads your file top to bottom and runs each line in order. It doesn't. Between the file you save and the process the operating system runs, four separate systems each do one specific job.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "Think of a recipe (your source) versus a cooked meal (the running process). You don't hand a diner the recipe — a kitchen turns it into a meal first. The 'kitchen' here is the Go toolchain and runtime, and it has several stations.",
          },
        },
        {
          type: "points",
          items: [
            "What you deploy is a compiled **executable**, not your `.go` files.",
            "Four owners touch your code before it runs: the **go tool**, the **compiler**, the **linker**, and the **runtime**.",
            "Most 'mysterious' startup bugs are just confusion about *which owner is running when*.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "The container that exits before it logs",
            context:
              "A service reads its database URL in a package-level variable. In CI that variable isn't set, so the program crashes while starting up — before `main` runs and before the logger is configured. You see a crash but no log line.",
            insight:
              "The failure happened during the *initialization* phase, not in your request code. Once you can name the phase, you know exactly where to look.",
          },
        },
      ],
    },
    naive: {
      body: "Here's the model most beginners start with: `go run` reads every file top to bottom, and the operating system executes those lines in order. Two things are wrong with it.\n\nFirst, **file order is not execution order** — Go decides the order from how your code depends on other code, not from line numbers. Second, `go run` isn't a live interpreter: it quietly *compiles* your code into a temporary binary and runs that, doing build work you'll later want to control.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Line number ≠ when it runs",
            language: "go",
            code: 'var region = mustLoad("REGION") // this runs during startup, before main\n\nfunc main() {\n    fmt.Println("starting in", region)\n}',
            takeaway:
              "`region` is set *before* `main` is ever entered. Its timing comes from the dependency graph, not from appearing higher in the file.",
          },
        },
        {
          type: "points",
          items: [
            "`go run` = compile to a temporary binary + run it. It is not an interpreter.",
            "Package-level variables are initialized before `main`, in dependency order.",
          ],
        },
      ],
    },
    failure: {
      body: "When you put real work into initialization, you give up control over what happens when it fails. A common example: a package-level variable opens a database connection while the program is starting.\n\nOn your machine, where everything is configured, it looks fine. In CI or a misconfigured deploy, the dependency is missing, initialization panics, and the process dies *before* `main` can log a helpful message or expose a health check. The deeper lesson is about **ownership**: hidden startup work takes decisions away from `main`, the one place you can actually observe and handle them.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Fallible work hidden in package init",
            language: "go",
            code:
              '// db.go\nvar conn = mustConnect(os.Getenv("DATABASE_URL")) // panics here when unset\n\n// main.go\nfunc main() {\n    // never reached: no log line, no /health endpoint\n}',
            takeaway:
              "A panic during init aborts the program before `main`. Move fallible work into `main`, where you can handle it and report it.",
          },
        },
        {
          type: "scenario",
          scenario: {
            title: "Green locally, dead in CI",
            context: "The exact same binary passes on a laptop and crashes in the pipeline with no application logs.",
            insight: "Same binary, different environment → the failing value is *environment*, and it was read too early.",
          },
        },
      ],
    },
    intuition: {
      body: "Let's replace the wrong model with a picture. Getting from source to a running process is a relay: each stage does one job, hands a result (an 'artifact') to the next, and only then does the next stage start.\n\nThe first three stages happen at **build time** on your machine or CI. The last stages happen at **start time**, when the operating system actually launches the binary.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Source → running process",
            kind: "flow",
            nodes: [
              { id: "src", label: "source", detail: ".go files" },
              { id: "resolve", label: "go tool", detail: "resolve packages" },
              { id: "compile", label: "compiler", detail: "type-check + emit" },
              { id: "link", label: "linker", detail: "one executable", tone: "accent" },
              { id: "load", label: "OS loader", detail: "map into memory" },
              { id: "runtime", label: "runtime", detail: "scheduler, GC" },
              { id: "main", label: "main", detail: "your code runs", tone: "success" },
            ],
            caption: "Build time ends at 'linker'. Everything after happens when the binary starts.",
          },
        },
        {
          type: "points",
          items: [
            "Build time: **go tool → compiler → linker** produce the executable.",
            "Start time: **OS loader → runtime → package init → main** bring it to life.",
            "Each stage consumes one artifact and produces the next.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Here is the single idea to keep: there are **three clocks**, and they answer different questions. Confusing them is the source of most startup bugs.\n\nBuild time asks 'what executable *can* exist?'. Startup asks 'what process *now* exists?'. Runtime asks 'how does that process *keep* running?'. A value or a bug almost always belongs to exactly one clock.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Three clocks",
            kind: "compare",
            nodes: [
              { id: "build", label: "Build time", detail: "Types checked, code compiled and linked. No environment yet." },
              { id: "startup", label: "Startup", detail: "OS maps the binary; runtime + package init run once." },
              { id: "runtime", label: "Runtime", detail: "Goroutines, GC, and your request handling.", tone: "accent" },
            ],
          },
        },
        {
          type: "example",
          example: {
            title: "Which clock is each line?",
            language: "go",
            code:
              "const MaxConns = 32         // build time (a constant baked into the binary)\nvar started = time.Now()    // startup (runs during init)\nfunc handle() { /* ... */ } // runtime (runs per request)",
            takeaway: "One file can touch all three clocks. Naming the clock for a line predicts when it runs.",
          },
        },
        {
          type: "note",
          note: {
            tone: "warning",
            title: "Common trap",
            text: "`init` is **not** a constructor you call. Go runs it automatically, exactly once, before `main` — so don't hide work there that you'd want to trigger or handle on demand.",
          },
        },
      ],
    },
    mechanics: {
      body: "Now the precise version. The **compiler** type-checks each package and emits object data. The **linker** resolves symbols, lays out the sections of the binary, and can drop code nothing reaches (dead-code elimination). At start time the **OS** maps the binary into memory and jumps to its entry point, the **runtime** sets up the scheduler, allocator, and garbage collector, and then initialization runs.\n\nInitialization has a strict, guaranteed order — this is the part worth memorizing.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Initialization order (guaranteed)",
            kind: "sequence",
            nodes: [
              { id: "deps", label: "Imported packages first", detail: "each initialized once, dependencies before dependents" },
              { id: "vars", label: "Package-level variables", detail: "in dependency order, not line order" },
              { id: "init", label: "init() functions", detail: "in the order they appear" },
              { id: "main", label: "main.main", detail: "your program truly begins", tone: "success" },
            ],
          },
        },
        {
          type: "example",
          example: {
            title: "Variables initialize by dependency, not by line",
            language: "go",
            code:
              'package main\n\nimport "fmt"\n\nvar a = b + 1 // appears first, but waits for b\nvar b = 2\n\nfunc init() { fmt.Println("init", a, b) } // prints: init 3 2\nfunc main() { fmt.Println("main") }',
            takeaway: "`a` already sees `b` set. Go orders variable initialization by the dependency graph.",
          },
        },
        {
          type: "points",
          items: [
            "The **build cache** reuses results keyed by their inputs, so unchanged packages aren't recompiled.",
            "`GOOS`/`GOARCH` pick a *target* (e.g. linux/arm64). They cross-compile — they do not emulate.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Why the rebuild was instant",
            context: "You change one small package and rebuild; the other 40 packages aren't recompiled.",
            insight: "The build cache matched the unchanged packages' input keys and reused their compiled objects.",
          },
        },
      ],
    },
    diagram: {
      body: "Time to make it interactive. Below is the same pipeline as a diagram you can click. For each stage, ask three questions: what artifact enters, what must be true (the invariant), and what leaves? Select a stage to see its details in the panel.",
    },
    implementation: {
      body: "The practical payoff of everything above is a simple rule: keep initialization *empty of surprises*, and do the real, failure-prone work inside `main`, where you can see it. Parse configuration, construct your dependencies explicitly, start the server, and own shutdown.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Explicit startup instead of hidden init",
            language: "go",
            code:
              'var version string // injected at link time: -ldflags "-X main.version=$(git rev-parse HEAD)"\n\nfunc main() {\n    cfg := mustConfig(os.Environ())  // fallible, but now observable\n    db := mustOpen(cfg.DatabaseURL)  // an explicit dependency\n    srv := NewServer(cfg, db)\n    log.Printf("starting %s", version)\n    srv.Run()\n}',
            takeaway: "Every dependency is built where a failure can be logged and turned into a clean exit.",
          },
        },
        {
          type: "points",
          items: [
            "Do fallible work in `main`, not in package `init`.",
            "Inject build metadata (version, commit) at link time with `-ldflags`.",
            "Construct dependencies explicitly so tests can swap them out.",
          ],
        },
      ],
    },
    experiment: {
      body: "Before you read the answer, commit to a guess — a wrong guess you correct is worth far more than a right answer you read. The question: which runs first — a dependency's `init`, `main`'s package-variable initializer, `main.init`, or `main.main`? Pick below, then reveal the trace.",
    },
    "failure-cases": {
      body: "Almost every failure in this area traces back to one of two roots: using the *wrong clock*, or hiding *fallible work in init*. Here are the ones you'll actually meet.",
      blocks: [
        {
          type: "points",
          items: [
            "**Import cycle** → a compile error (Go forbids packages importing each other in a loop).",
            "**`exec format error`** → the binary was built for a different `GOOS`/`GOARCH` than the machine.",
            "**Init-time I/O** → the process crashes before logging or health is ready.",
            "**Relying on source-file order** → bugs that look random but aren't.",
            "**Accidental reachability** → a bigger binary than expected.",
            "**Assuming static linking with cgo** → surprise dynamic library dependencies.",
          ],
        },
        {
          type: "example",
          example: {
            title: "Architecture mismatch, live",
            language: "bash",
            code: "$ GOOS=linux GOARCH=arm64 go build -o app .\n$ ./app          # then run it on an amd64 host\nexec format error",
            takeaway: "The target chooses the machine code. Running it on the wrong CPU fails at the loader, not the compiler.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "The pipeline gives you choices, and each has a cost. There's no universally right answer — only the one you can defend for your situation, plus the evidence that would change your mind.",
      blocks: [
        {
          type: "points",
          items: [
            "**Single static binary**: trivial to ship, but harder when you need native C libraries.",
            "**Package `init`**: guaranteed once-only ordering, but it hides dependencies from the reader.",
            "**Cross-compilation**: cheap for pure Go, but you still must test on the real target.",
            "**Build cache**: fast, but only correct when your inputs are reproducible.",
          ],
        },
      ],
    },
    design: {
      body: "Pull the lessons into a few durable design rules. Prefer explicit dependency construction and fail-fast validation inside `main`. Treat the executable as a versioned artifact. Keep initialization deterministic, bounded, observable, and free of network calls, and put graceful shutdown under explicit signal ownership.",
      blocks: [
        {
          type: "points",
          items: [
            "Fail fast in `main`; never report ready before dependencies are up.",
            "No network or disk I/O during package `init`.",
            "Version the binary and keep startup reproducible.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Designing for a health check",
            context: "A load balancer only routes traffic once `/ready` returns 200.",
            insight: "Readiness must be set *after* dependencies are constructed — which means that work belongs in `main`, not `init`.",
          },
        },
      ],
    },
    ledgerflow: {
      body: "Here's the whole idea applied to the project you'll build. LedgerFlow's API binary embeds its commit and build time, validates configuration, opens PostgreSQL with a bounded timeout, runs compatibility checks, constructs its repositories and services, and only then starts serving HTTP. If any required dependency fails, it exits *before* readiness turns true — so the platform never sends traffic to a broken instance.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "LedgerFlow startup order",
            kind: "sequence",
            nodes: [
              { id: "cfg", label: "Load config", detail: "typed, validated" },
              { id: "db", label: "Open database", detail: "bounded timeout" },
              { id: "mig", label: "Check migrations", detail: "compatible schema" },
              { id: "svc", label: "Build services", detail: "explicit dependencies" },
              { id: "ready", label: "Mark ready → serve", detail: "/ready turns 200 last", tone: "success" },
            ],
          },
        },
        {
          type: "points",
          items: ["Order: config → database → migrations → services → serve.", "Readiness is asserted last, never first."],
        },
      ],
    },
    exercises: {
      body: "Practice produces the evidence that you actually understand this — not just recognize it. Work across prediction, code-reading, implementation, debugging, refactoring, and design. Each exercise below produces a different kind of evidence, so completing one doesn't imply mastery of the others.",
    },
    mastery: {
      body: "Mastery of this lesson needs four real signals: explain the pipeline aloud, inspect a real binary, debug a deliberately broken initialization order, and defend the LedgerFlow startup sequence. Check a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "One model carries this entire lesson: **three clocks** — build, startup, runtime. Keep them separate and the mysteries dissolve.",
      blocks: [
        {
          type: "points",
          items: [
            "Invariants: acyclic imports; dependencies init first; `main` runs once after init; target architecture must match.",
            "Rule: make startup dependencies explicit in `main`.",
            "Trap: treating `init` as a constructor.",
            "Next up: values and copy semantics.",
          ],
        },
      ],
    },
  },
};

export const goProject = {
  id: "go-execution-inspector",
  title: "Go execution & value inspector",
  problem:
    "Build a CLI that reports its build target, runtime version, initialization trace, and selected memory statistics.",
  milestones: [
    "Deterministic startup trace",
    "Build metadata injection",
    "Cross-compile matrix",
    "Failure-mode tests",
  ],
  constraints: [
    "No network access",
    "No init-time I/O",
    "Exit codes must distinguish usage from runtime failure",
  ],
  acceptance: [
    "go test ./... passes",
    "linux/amd64 and darwin/arm64 artifacts build",
    "output is stable and documented",
  ],
};
