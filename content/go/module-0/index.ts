import type { CurriculumModule, Lesson } from "../../../packages/content-schema/src/index";

export { goToolchainModules } from "./toolchain-modules";

export const goModule0: CurriculumModule = {
  id: "go-0",
  courseId: "go",
  title: "How a Go Program Starts",
  order: 0,
  description: "See how Go builds a package, starts the program, and reaches main.",
  lessonIds: ["go-source-to-process"],
  projectId: "go-execution-inspector",
};

export const goSourceToProcess: Lesson = {
  id: "go-source-to-process",
  slug: "source-to-process",
  title: "How a Go program starts",
  description: "See how Go builds your package, starts the program, and reaches main.",
  moduleId: "go-0",
  estimatedMinutes: 30,
  difficulty: "beginner",
  prerequisites: [],
  learningObjectives: [
    "Explain why Go builds packages instead of running one source file first",
    "Separate the build phase from the run phase",
    "Put the toolchain, package initialization, and main in the correct order",
    "Distinguish the language-guaranteed startup order from toolchain implementation details",
  ],
  concepts: [
    "packages",
    "go-command",
    "compiler",
    "linker",
    "executable",
    "runtime",
    "initialization",
    "main",
  ],
  references: [
    {
      title: "The Go Programming Language Specification",
      url: "https://go.dev/ref/spec",
      teaches: "The normative rules for programs, packages, and initialization.",
      relevance: "Separates guaranteed language behavior from toolchain implementation.",
      required: false,
      section: "Program initialization and execution",
    },
    {
      title: "Go command documentation",
      url: "https://pkg.go.dev/cmd/go",
      teaches: "Build modes, module resolution, environment, and cache behavior.",
      relevance: "Explains the build tool that turns packages into artifacts.",
      required: false,
      section: "Compile packages and dependencies; Compile and run Go program",
    },
    {
      title: "Go linker documentation",
      url: "https://pkg.go.dev/cmd/link",
      teaches: "How the linker combines package objects and dependencies into an executable.",
      relevance: "Confirms the link step shown in the build phase.",
      required: false,
      section: "Overview",
    },
    {
      title: "Go compiler documentation",
      url: "https://pkg.go.dev/cmd/compile",
      teaches: "How the standard Go compiler compiles the source files that form one package.",
      relevance:
        "Confirms that compilation works package by package rather than running one file first.",
      required: false,
      section: "Overview",
    },
  ],
  exercises: [
    {
      id: "go0-predict-init",
      type: "prediction",
      prompt: "Predict which starts first: an imported package, the main package, or func main().",
      expectedAnswer: "imported package → main package → func main()",
      hints: ["An imported package must be ready before code that imports it."],
    },
    {
      id: "go0-read-build",
      type: "code-reading",
      prompt:
        "For `go build -o app .` followed by `./app`, identify which command builds and which command runs the program.",
      expectedAnswer:
        "`go build -o app .` creates the executable; `./app` asks the operating system to start it.",
      hints: ["One command creates a file. The other starts that file."],
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
  ],
  masteryCriteria: [
    {
      id: "explain-pipeline",
      kind: "explain",
      description: "Explain the build phase and run phase without notes.",
      required: true,
    },
    {
      id: "predict-init",
      kind: "predict",
      description: "Put imported packages, the main package, and func main() in order.",
      required: true,
    },
    {
      id: "build-artifact",
      kind: "implement",
      description: "Run a program with `go run`, then build and run its executable.",
      required: true,
    },
  ],
  sections: {
    problem: {
      title: "Go starts a package, not a file",
      body: "Go does **not** choose one source file and execute it from top to bottom. It builds a **package**: the group of buildable `.go` files in the same folder that use the same package name.\n\nIf the folder contains only `main.go`, the package has one file. If it also contains `config.go` and `helpers.go`, those files are compiled as part of the same package. The name `main.go` is only a common convention. What matters is `package main` and the function `func main()`.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "The files in one package are like pages of one recipe. Go prepares them together. The executable is the prepared meal; running serves it.",
          },
        },
        {
          type: "points",
          items: [
            "`go run .` means: build the package in this folder, then run the temporary executable.",
            "`go run main.go` means: build from the file or files named in the command. In a multi-file package, prefer `go run .` so sibling files are included.",
            "At runtime, imported packages initialize first, then the `main` package initializes, and only then does `func main()` run.",
          ],
        },
        {
          type: "scenario",
          scenario: {
            title: "Why did `main` never print?",
            context:
              "Automatic package setup stops with an error. The first `fmt.Println` inside `main` never appears.",
            insight:
              "Package initialization happens before `main`, so the program failed during startup.",
          },
        },
      ],
    },
    "mental-model": {
      title: "Build first, run second",
      body: "Keep two ideas in your head. First, **Go builds packages, not a file-by-file script**. Second, **build happens before run**. Building creates an executable file. Running starts that executable as a live program.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Two phases",
            kind: "compare",
            nodes: [
              {
                id: "build",
                label: "1. Build",
                detail:
                  "Collect the package files, compile the packages, and create an executable.",
              },
              {
                id: "run",
                label: "2. Run",
                detail: "Start the executable, initialize packages, and then call func main().",
                tone: "accent",
              },
            ],
          },
        },
        {
          type: "example",
          example: {
            title: "The boundary is visible with two commands",
            language: "bash",
            code: "go build -o hello .  # phase 1: create the executable\n./hello              # phase 2: start the executable",
            takeaway:
              "`go run .` performs both jobs for the whole package and removes its temporary executable afterward.",
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
      title: "The complete path to main",
      body: "The official model has two phases. During **build**, the `go` command loads the named main package and its dependencies, compiles the packages that cannot be reused from the build cache, and invokes the linker to create an executable.\n\nDuring **program execution**, Go initializes the complete program and then invokes `func main()`. Initialization handles dependencies before the packages that import them; package `main` is initialized after its dependencies. No external `go tool` steps through your source at this point, and there is no source file that runs first.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "Official model: build, initialize, main",
            kind: "sequence",
            nodes: [
              {
                id: "go-command",
                label: "Build 1 · Go command",
                detail: "select the main package and its dependencies",
              },
              {
                id: "compiler",
                label: "Build 2 · Compile packages",
                detail: "go tool compile; the cache may reuse unchanged package results",
              },
              {
                id: "linker",
                label: "Build 3 · Link executable",
                detail: "combine package objects and dependencies",
              },
              {
                id: "initialize",
                label: "Run 1 · Initialize program",
                detail: "dependencies before importers; package main after its dependencies",
              },
              {
                id: "main",
                label: "Run 2 · Call func main()",
                detail: "Go invokes main after program initialization finishes",
                tone: "success",
              },
            ],
          },
        },
        {
          type: "note",
          note: {
            tone: "info",
            title: "What is actually guaranteed?",
            text: "The Go command, compiler, and linker documentation describe the build phase. The language specification guarantees the run-phase order: initialize the complete program, then invoke `main`. If you run a binary that was built earlier, only the last two steps happen now.",
          },
        },
        {
          type: "points",
          items: [
            "Step 1 owner: the `go` command (`cmd/go`) loads packages, modules, build constraints, and dependencies.",
            "Step 2 owner: `go tool compile` compiles one Go package. Assembly or cgo are conditional details, not extra steps every learner must memorize.",
            "Step 3 owner: `go tool link` reads the main package object/archive plus dependencies and creates the executable.",
            "Steps 4–5 run inside the executable. Program initialization and `main` are not separate command-line tools.",
            "Use `go build -x` if you want the `go` command to print the concrete tool invocations for a particular build.",
          ],
        },
        {
          type: "note",
          note: {
            tone: "info",
            title: "You can ignore file order",
            text: "Do not design a package around one file running before another. Put the order you want inside functions, then call those functions from main.",
          },
        },
        {
          type: "example",
          example: {
            title: "Package access uses capitalization",
            language: "go",
            code: 'package main\n\nimport "fmt"\n\nfunc message() string { return "hello" } // lowercase: only this package\n\nfunc main() {\n    fmt.Println(message()) // Println is exported by package fmt\n}',
            takeaway:
              "Every file starts with a package clause. Imported names beginning with a capital letter are exported; lowercase names are available only inside their package, even across sibling files.",
          },
        },
      ],
    },
    diagram: {
      title: "Build-time and run-time steps",
      body: "Click each step below. Follow how Go turns a package into an executable, then starts it and reaches `func main()`. Go does not execute `main.go` before the other files in the package.",
    },
    implementation: {
      title: "Read runtime information",
      body: "Try one small use of the runtime package: print the Go version used by the running executable. This is runtime information, so your code reads it after the program has started.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Read information from the running program",
            language: "go",
            code: 'package main\n\nimport (\n    "fmt"\n    "runtime"\n)\n\nfunc main() {\n    fmt.Println("running with", runtime.Version())\n}',
            takeaway:
              "The executable is already built and running when `runtime.Version()` is called.",
          },
        },
        {
          type: "points",
          items: [
            "Use `go run .` for a quick build-and-run loop.",
            "Use `go build` when you want to keep the executable and run it separately.",
            "Put normal program startup in `main`; reserve `init` for rare automatic setup.",
          ],
        },
      ],
    },
    experiment: {
      title: "Predict the startup order",
      body: "Make one prediction: which starts first — an imported package, the `main` package setup, or `func main()`? Pick an answer, then reveal the order.",
    },
    "failure-cases": {
      title: "Common startup misunderstandings",
      body: "Most beginner mistakes come from forgetting the boundary between build and run, or from expecting `main` to run before package initialization.",
      blocks: [
        {
          type: "points",
          items: [
            "**Treating `go run` like an interpreter** → it still compiles a temporary executable first.",
            "**A panic during package initialization** → `main` is never reached.",
            "**Import cycle** → the build fails because Go forbids packages importing each other in a loop.",
          ],
        },
      ],
    },
    "trade-offs": {
      title: "go run, go build, and init",
      body: "For everyday learning, use `go run .` for a quick try and `go build` when you want to keep the executable. The other build choices below are optional and can wait.",
      blocks: [
        {
          type: "points",
          items: [
            "**`go run .`**: convenient while learning, but it does not leave an executable for you to keep.",
            "**`go build`**: creates an executable that you can run again without rebuilding.",
            "**`init` functions**: run automatically, but can hide work from the reader. Prefer an explicit call from `main` for normal setup.",
          ],
        },
      ],
    },
    design: {
      title: "Keep startup explicit",
      body: "Keep startup easy to follow. Let `main` call setup functions in a visible order and check each error. Use `init` only when a package truly needs automatic setup.",
      blocks: [
        {
          type: "points",
          items: [
            "Keep ordinary setup inside functions called by `main`.",
            "Return errors so `main` can explain why startup failed.",
            "Avoid file or network work inside `init`; it is harder to control and test.",
          ],
        },
      ],
    },
    mastery: {
      title: "Check your startup model",
      body: "You understand this lesson when you can explain that Go builds package files together, separate build from run, and place package initialization before `main`.",
    },
    summary: {
      title: "How a Go program starts: recap",
      body: "Keep one model: **build creates an executable; run starts that executable as a live program**. `go run` performs both phases for you.",
      blocks: [
        {
          type: "points",
          items: [
            "Go builds packages. It does not execute one source file before the others.",
            "Build path: the Go command selects packages → the compiler handles packages not reused from cache → the linker creates an executable.",
            "Run path: initialize the complete program (dependencies before importers) → call `func main()`.",
            "Imported packages initialize before the package that imports them.",
            "Use `go build` to keep an executable; use `go run` for a convenient build-and-run loop.",
            "Next: learn the basic values that your Go programs work with.",
          ],
        },
      ],
    },
  },
};

export const goProject = {
  id: "go-execution-inspector",
  title: "Hello Go program",
  problem:
    "Build a tiny command-line program, run it with `go run`, then build and run the executable directly.",
  milestones: [
    "Print a short message and runtime version",
    "Build one local executable",
    "Run that executable directly",
  ],
  constraints: ["No external packages", "Keep the program in one file"],
  acceptance: ["go test ./... passes", "`go run .` works", "`go build` creates a runnable file"],
};
