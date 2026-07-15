import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 0, lesson 2 — the go tool, modules, and workspaces. Written in the same
 * beginner-friendly voice as the source-to-process lesson: plain language, one
 * analogy per hard idea, concrete examples before abstractions.
 */
export const goToolchainModules: Lesson = {
  id: "go-toolchain-modules",
  slug: "toolchain-and-modules",
  title: "The go tool, modules & workspaces",
  description:
    "Understand the one command that builds, tests, and versions your code — and the module system that decides what compiles.",
  moduleId: "go-8",
  estimatedMinutes: 65,
  difficulty: "intermediate",
  prerequisites: ["go-source-to-process", "go-unit-table-tests"],
  learningObjectives: [
    "Explain what `go build`, `go run`, and `go test` actually do",
    "Read a go.mod file and describe how a module resolves its dependencies",
    "Predict when the build cache reuses work and when it rebuilds",
    "Use a workspace (go.work) to develop across several modules at once",
  ],
  concepts: [
    "go-command",
    "modules",
    "go.mod",
    "go.sum",
    "semantic-import-versioning",
    "workspaces",
    "build-cache",
  ],
  references: [
    {
      title: "How to Write Go Code",
      url: "https://go.dev/doc/code",
      teaches: "The canonical layout of packages and modules and how the go tool finds them.",
      relevance: "Establishes the mental model of module → package → file this lesson builds on.",
      required: false,
      section: "Code organization; Your first program",
    },
    {
      title: "Go Modules Reference",
      url: "https://go.dev/ref/mod",
      teaches: "The normative rules for go.mod, versioning, and dependency resolution.",
      relevance: "The authoritative source for everything in the Mechanics stage.",
      required: false,
      section: "Module paths; Minimal version selection",
    },
    {
      title: "Tutorial: Multi-module workspaces",
      url: "https://go.dev/doc/tutorial/workspaces",
      teaches: "Working across multiple modules at once with go.work.",
      relevance: "Backs the workspace stage with an official step-by-step walkthrough.",
      required: false,
      section: "Create the workspace",
    },
  ],
  exercises: [
    {
      id: "gotc-predict-cache",
      type: "prediction",
      prompt:
        "You run `go build ./...`, change one comment in one file, and run it again. Predict which packages get recompiled.",
      expectedAnswer:
        "Only the package whose file changed (and anything that imports it) — the rest are served from the build cache because their inputs are unchanged.",
      hints: ["The cache is keyed by the inputs to each package, not by a timestamp."],
    },
    {
      id: "gotc-read-gomod",
      type: "code-reading",
      prompt:
        "Given a go.mod with a `require` block and a `// indirect` comment, identify which dependencies you import directly and which are pulled in by those.",
      hints: ["`// indirect` marks a dependency you don't import yourself."],
    },
    {
      id: "gotc-implement-init",
      type: "implementation",
      prompt:
        "Write the two commands that turn an empty folder into a module named example.com/ledger and add the shopspring/decimal dependency.",
      starterCode: "# 1. create the module\n\n# 2. add the dependency\n",
      expectedAnswer: "go mod init example.com/ledger\ngo get github.com/shopspring/decimal",
      hints: ["`go mod init <path>` creates go.mod.", "`go get` records a dependency."],
    },
    {
      id: "gotc-debug-import-path",
      type: "debugging",
      prompt:
        "A teammate cloned the repo into ~/src/ledger but imports fail with 'package example.com/ledger/store is not in std'. Explain why the folder name is irrelevant and what actually determines the import path.",
      hints: ["The import path comes from the module path in go.mod, not the directory on disk."],
    },
    {
      id: "gotc-refactor-replace",
      type: "refactoring",
      prompt:
        "You are editing a bug in a dependency locally. Replace the published version with your local checkout so you can test the fix before it is released.",
      hints: ["`replace` in go.mod (or a workspace) points an import at a local path."],
    },
    {
      id: "gotc-design-versioning",
      type: "design",
      prompt:
        "Decide how you will version a shared Go library so a breaking change never silently breaks callers, and state the rule that forces the decision.",
      hints: ["A new major version (v2+) must appear in the import path itself."],
    },
    {
      id: "gotc-advanced-graph",
      type: "advanced",
      prompt:
        "Run `go mod graph` and `go mod why <module>` on a real project locally; explain what each answer tells you about your dependency tree.",
      hints: [],
    },
  ],
  masteryCriteria: [
    {
      id: "explain-go-command",
      kind: "explain",
      description: "Explain what build, run, test, and get do without notes.",
      required: true,
    },
    {
      id: "predict-cache",
      kind: "predict",
      description: "Correctly predict which packages a change forces to rebuild.",
      required: true,
    },
    {
      id: "read-gomod",
      kind: "explain",
      description: "Read a go.mod and explain direct vs indirect dependencies and versions.",
      required: true,
    },
    {
      id: "design-versioning",
      kind: "design",
      description: "Defend a module path and versioning scheme for a real library.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "You already know that Go builds a package rather than running one file first. Larger programs contain several packages and may use code downloaded from other modules. Something has to answer three questions: *which files belong together, where does outside code come from, and which version should be used?*\n\nThe **go command** — the `go` in `go build`, `go run`, and `go test` — coordinates that work. This is optional toolchain depth; you do not need it for the earlier language lessons.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "Think of the go tool as a general contractor. You don't hand each subcontractor (compiler, linker) instructions yourself — you tell the contractor \"build this,\" and it figures out the order, reuses what's already done, and sources materials (dependencies) from the right suppliers at the right versions.",
          },
        },
        {
          type: "points",
          items: [
            "A **module** is a unit of code you version and share — it has one identity (its module path).",
            "A **package** is a folder of `.go` files inside a module that compile together.",
            "The **go command** ties it together: it finds packages, fetches dependencies, and drives the build.",
          ],
        },
      ],
    },
    "mental-model": {
      body: 'The single idea: **go.mod is the source of truth, not your filesystem.** The directory a file sits in doesn\'t define its import path — the module path plus the folder does. "Latest" isn\'t a version — the exact version in go.mod is.\n\nOnce you believe that, dependency problems become readable: you stop asking "what\'s installed?" and start asking "what does go.mod say, and does go.sum verify it?"',
      blocks: [
        {
          type: "example",
          example: {
            title: "A minimal go.mod, annotated",
            language: "go.mod",
            code: "module example.com/learn-go // the import prefix for your packages\n\ngo 1.26                     // the language/toolchain version you target\n\nrequire (\n    github.com/shopspring/decimal v1.4.0        // you import this directly\n    github.com/jackc/pgx/v5 v5.6.0 // indirect  // pulled in by something else\n)",
            takeaway:
              "Module path, Go version, and pinned requirements. `// indirect` means you don't import it yourself — a dependency does.",
          },
        },
        {
          type: "note",
          note: {
            tone: "info",
            title: "go.sum vs go.mod",
            text: "go.mod records *which versions* you want. go.sum records a *cryptographic checksum* of each one, so a tampered or changed download is detected. Commit both.",
          },
        },
      ],
    },
    mechanics: {
      body: "Now the precise rules. When you build, the go tool reads `go.mod`, collects every module your imports need, and picks versions using **Minimal Version Selection (MVS)**: for each dependency it chooses the *lowest* version that still satisfies every requirement in the graph. That sounds backwards, but it's what makes builds reproducible — versions only move when *you* change go.mod, never on their own.\n\nVersions follow semantic versioning (`vMAJOR.MINOR.PATCH`). The twist unique to Go is **semantic import versioning**: major version 2 and above is part of the import path itself (`.../pgx/v5`). That's why upgrading across a major version is a deliberate code change, not a silent bump.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "One command, several steps",
            kind: "sequence",
            nodes: [
              { id: "read", label: "Read go.mod", detail: "module path + required versions" },
              { id: "resolve", label: "Resolve imports", detail: "MVS picks exact versions" },
              { id: "cache", label: "Check build cache", detail: "reuse unchanged packages" },
              {
                id: "compile",
                label: "Compile + link",
                detail: "only what changed",
                tone: "accent",
              },
              { id: "out", label: "Artifact", detail: "binary or test result", tone: "success" },
            ],
          },
        },
        {
          type: "points",
          items: [
            "**MVS** selects the lowest version that satisfies all requirements — deterministic by design.",
            "**Semantic import versioning**: v2+ lives in the import path, so majors never upgrade silently.",
            "The **build cache** is keyed by each package's inputs; unchanged packages are never recompiled.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Why the second test run was instant",
            context:
              "`go test ./...` takes 20 seconds the first time and under a second the second time, with no code changes.",
            insight:
              "Test *results* are cached too, keyed by inputs. Change a file and only affected tests re-run.",
          },
        },
      ],
    },
    diagram: {
      body: "The map below shows the everyday commands and which artifact each one produces. Notice they're all the same tool doing the resolve-and-cache dance from the Mechanics stage — they differ only in what they emit at the end.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Same engine, different output",
            kind: "compare",
            nodes: [
              {
                id: "run",
                label: "go run",
                detail: "compile to a temp binary and execute it once",
              },
              { id: "build", label: "go build", detail: "produce a reusable executable on disk" },
              {
                id: "test",
                label: "go test",
                detail: "compile test binaries, run them, cache results",
              },
              {
                id: "get",
                label: "go get",
                detail: "add/update a dependency version in go.mod",
                tone: "accent",
              },
              {
                id: "modtidy",
                label: "go mod tidy",
                detail: "add missing and remove unused requirements",
                tone: "success",
              },
            ],
          },
        },
      ],
    },
    implementation: {
      body: "The practical loop is short. Create a module once, then let the tool keep dependencies honest. `go mod tidy` is the command you'll run most: it reads your actual imports and rewrites go.mod/go.sum to match — adding what you use, removing what you don't. Make it a habit before every commit.",
      blocks: [
        {
          type: "example",
          example: {
            title: "From empty folder to buildable module",
            language: "bash",
            code: "go mod init example.com/ledger   # creates go.mod with your module path\n# ...write code that imports github.com/shopspring/decimal...\ngo mod tidy                       # discovers the import, records the version\ngo build ./...                    # builds every package\ngo test ./...                     # runs every test",
            takeaway:
              "You declare the module path once. After that, `go mod tidy` keeps dependencies exactly matched to what your code imports.",
          },
        },
        {
          type: "points",
          items: [
            "`go mod init <path>` — do this once, at the module root.",
            "`go mod tidy` — run before committing; it makes go.mod match your real imports.",
            "Commit go.mod **and** go.sum so teammates and CI resolve identical versions.",
          ],
        },
      ],
    },
    experiment: {
      body: "Before reading on, predict this: you have a project with 40 packages. You edit one comment in one leaf package and run `go build ./...` again. How many packages get recompiled — all 40, just 1, or somewhere in between?\n\nCommit to an answer, then check it: only the package you changed, plus any package that imports it (transitively). Everything else is served from the build cache, because its inputs are byte-for-byte identical to last time. This is why Go builds feel fast on large repos — the tool does the minimum work the dependency graph allows.",
    },
    "failure-cases": {
      body: "Most module trouble is one of a handful of shapes. Learn to name them and the fix is usually one command.",
      blocks: [
        {
          type: "points",
          items: [
            '**"missing go.sum entry"** → run `go mod tidy` (or `go mod download`) to record checksums.',
            '**"cannot find module providing package"** → the import path is wrong, or you forgot `go get`.',
            "**Silent major-version confusion** → remember v2+ needs `/v2` in the import path.",
            "**Unused/indirect clutter in go.mod** → `go mod tidy` prunes it.",
            "**Committing go.mod but not go.sum** → CI can't verify downloads; commit both.",
            "**Editing files outside any module** → no go.mod means the tool falls back to GOPATH-era behavior and imports break.",
          ],
        },
        {
          type: "example",
          example: {
            title: "The major-version gotcha, live",
            language: "go",
            code: '// This imports v4 and v5 as genuinely different packages — on purpose:\nimport (\n    pgx4 "github.com/jackc/pgx/v4"\n    pgx5 "github.com/jackc/pgx/v5"\n)',
            takeaway:
              "The `/v5` in the path is the version. Two majors can coexist because they are different import paths.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "The module system makes choices for you that favor reproducibility over convenience. That's usually right, but know the costs.",
      blocks: [
        {
          type: "points",
          items: [
            "**MVS (lowest satisfying version)**: predictable and stable, but you must opt in to upgrades explicitly.",
            "**Pinned versions in go.mod**: reproducible builds, but dependencies won't get security fixes until you bump them.",
            "**A single module for the whole repo**: simplest to reason about, but every package shares one version line.",
            "**Multi-module repo**: independent versioning, but more go.mod files and more coordination.",
          ],
        },
      ],
    },
    design: {
      body: "A few durable rules. Choose a module path you control and won't need to rename (a domain or your VCS host) — renaming it later changes every import. Prefer one module per repository until you have a concrete reason to split. Treat go.mod/go.sum as reviewed source: a version bump is a real change with real risk, so it belongs in a commit you can read and revert.",
      blocks: [
        {
          type: "points",
          items: [
            "Pick a stable, owned module path from day one.",
            "One module per repo unless independent release cadence demands otherwise.",
            "Review dependency changes like code — they run in your process.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Developing a fix across two modules",
            context:
              "You need to change an app and a shared library it depends on at the same time, before either is released.",
            insight:
              "A workspace (`go.work`) points the app at your local library checkout — no publishing and no temporary `replace` directive to forget.",
          },
        },
      ],
    },
    mastery: {
      body: "You've mastered this when you can explain what the go command does without notes, correctly predict which packages a change rebuilds, read a go.mod and separate direct from indirect dependencies, and defend a module path and versioning choice. Attest each criterion only when you genuinely have that evidence.",
    },
    summary: {
      body: "One idea carries the lesson: **go.mod is the source of truth.** The go tool resolves imports against it, pins versions for reproducibility, and caches everything it can so builds stay fast.",
      blocks: [
        {
          type: "points",
          items: [
            "Module = versioned unit; package = folder of files; the go command ties them together.",
            "MVS + pinned versions + go.sum = the same build on every machine.",
            "v2+ lives in the import path (semantic import versioning).",
            "Run `go mod tidy` after changing imports so go.mod and go.sum stay accurate.",
          ],
        },
      ],
    },
  },
};
