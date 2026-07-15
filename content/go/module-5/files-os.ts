import type { Lesson } from "../../../packages/content-schema/src/index";

/**
 * Module 5 — the `os` package: files, environment, arguments, and exit codes,
 * plus cross-platform paths with path/filepath. Same beginner-friendly voice as
 * Modules 0–4: plain language, one analogy per hard idea, a concrete example
 * before the abstract rule. Builds directly on the previous io.Reader/io.Writer
 * lesson — an *os.File IS a Reader and a Writer — and is careful about the
 * always-defer-Close pattern and the os.Exit-skips-defers gotcha.
 */
export const goFilesOs: Lesson = {
  id: "go-files-os",
  slug: "files-os",
  title: "Files, os & environment",
  description:
    "Use the os package to open, read, and write files safely, read configuration from the environment, and build cross-platform paths — with correct error handling on every path.",
  moduleId: "go-5",
  estimatedMinutes: 50,
  difficulty: "intermediate",
  prerequisites: ["go-io-reader-writer"],
  learningObjectives: [
    "Open, create, and write files with the right os function and always release them with defer f.Close()",
    "Read configuration from the environment and distinguish an empty value from an unset one with os.LookupEnv",
    "Build cross-platform paths with path/filepath and detect a missing file with errors.Is(err, os.ErrNotExist)",
  ],
  concepts: ["os", "files", "environment"],
  references: [
    {
      title: "Package os",
      url: "https://pkg.go.dev/os",
      teaches:
        "The functions for files (Open, Create, OpenFile), environment (Getenv, LookupEnv), Args, Exit, and the ErrNotExist sentinel.",
      relevance: "The authoritative reference for every os call this lesson uses.",
      required: false,
      section: "Overview",
    },
    {
      title: "Package path/filepath",
      url: "https://pkg.go.dev/path/filepath",
      teaches:
        "Join, Base, Dir, and Ext — path manipulation that respects the operating system's separator.",
      relevance: "Backs the cross-platform path rules in the mechanics and design stages.",
      required: false,
      section: "Overview",
    },
    {
      title: "Effective Go",
      url: "https://go.dev/doc/effective_go",
      teaches: "Idiomatic error handling and the acquire-check-defer pattern that files depend on.",
      relevance:
        "Grounds the design guidance on checking errors and pairing Open with a deferred Close.",
      required: false,
      section: "Errors",
    },
  ],
  exercises: [
    {
      id: "go5fs-predict-lookupenv",
      type: "prediction",
      prompt:
        'The variable PORT is exported as an empty string (`export PORT=`). Predict what `os.Getenv("PORT")` returns, and what the two return values of `os.LookupEnv("PORT")` are.',
      expectedAnswer:
        'os.Getenv("PORT") returns "" (empty string). os.LookupEnv("PORT") returns ("", true) — the value is empty but the ok flag is true because the variable IS set. Getenv alone cannot tell "set to empty" apart from "not set at all".',
      hints: [
        "Getenv returns only a string; it collapses unset and empty into the same empty string.",
        "LookupEnv returns (value, ok); ok reports whether the variable exists.",
      ],
    },
    {
      id: "go5fs-read-defer-order",
      type: "code-reading",
      prompt:
        "Read this function and state whether the file is guaranteed to close on the error path:\n```\nf, err := os.Open(path)\nif err != nil {\n    return err\n}\ndefer f.Close()\ndata, err := io.ReadAll(f)\nif err != nil {\n    return err\n}\n```\nExplain why, in one sentence.",
      hints: [
        "Where is the defer relative to the error return inside ReadAll's check?",
        "A defer registered before a return still runs when that return fires.",
      ],
    },
    {
      id: "go5fs-implement-readconfig",
      type: "implementation",
      prompt:
        "Complete loadConfig so it reads the file at path, returns its bytes, and always closes the file even on error. Use os.Open and defer.",
      starterCode:
        'package main\n\nimport (\n\t"io"\n\t"os"\n)\n\nfunc loadConfig(path string) ([]byte, error) {\n\tf, err := os.Open(path)\n\tif err != nil {\n\t\treturn nil, err\n\t}\n\t// TODO: guarantee the file is closed on every path out\n\n\treturn io.ReadAll(f)\n}',
      expectedAnswer:
        "func loadConfig(path string) ([]byte, error) {\n\tf, err := os.Open(path)\n\tif err != nil {\n\t\treturn nil, err\n\t}\n\tdefer f.Close()\n\treturn io.ReadAll(f)\n}",
      hints: [
        "Order is always: open → check the error → defer the close.",
        "Because f is an io.Reader, io.ReadAll(f) works directly.",
      ],
    },
    {
      id: "go5fs-debug-exit-defer",
      type: "debugging",
      prompt:
        "A developer opens a log file, writes `defer f.Close()`, does some work, and calls `os.Exit(1)` when a check fails. They complain the log file is truncated / missing its last writes. Explain the cause and the fix.",
      hints: [
        "os.Exit stops the program immediately — deferred calls do NOT run.",
        "Return an error up to main and exit there, or flush/close explicitly before calling os.Exit.",
      ],
    },
    {
      id: "go5fs-refactor-path",
      type: "refactoring",
      prompt:
        'A program builds a path with `dir + "/" + name`. Refactor it to be cross-platform and explain what breaks the original on Windows.',
      hints: [
        "filepath.Join(dir, name) inserts the correct separator for the OS.",
        'Hard-coding "/" produces the wrong separator on Windows and mishandles trailing slashes.',
      ],
    },
    {
      id: "go5fs-design-missing-file",
      type: "design",
      prompt:
        "Design the error handling for a function that reads an optional config file: if the file is missing, fall back to defaults; if it exists but can't be read, return the error. Describe how you distinguish the two cases.",
      hints: [
        "Use errors.Is(err, os.ErrNotExist) (or os.IsNotExist(err)) to detect a missing file specifically.",
        "Only a not-exist error triggers the fallback; any other error propagates.",
      ],
    },
    {
      id: "go5fs-advanced-openfile",
      type: "advanced",
      prompt:
        "Using os.OpenFile with the right flag combination, write a function appendLine(path, line string) error that appends a line to a file, creating it if it does not exist, with 0644 permissions. Explain each flag you chose and why os.Create would be wrong here.",
      hints: [
        "You need O_APPEND | O_CREATE | O_WRONLY.",
        "os.Create truncates the file to empty first, destroying the existing log.",
      ],
    },
  ],
  masteryCriteria: [
    {
      id: "implement-file-cleanup",
      kind: "implement",
      description:
        "Write a function that opens a file, checks the open error, and guarantees f.Close() runs on every exit path with defer.",
      required: true,
    },
    {
      id: "explain-lookupenv",
      kind: "explain",
      description:
        "Explain why os.LookupEnv is needed to tell an empty environment value apart from an unset one, without notes.",
      required: true,
    },
    {
      id: "debug-exit-skips-defer",
      kind: "debug",
      description:
        "Diagnose why deferred cleanup did not run when a program called os.Exit, and state the correct alternative.",
      required: false,
    },
    {
      id: "design-missing-file",
      kind: "design",
      description:
        "Design not-exist handling with errors.Is(err, os.ErrNotExist) that falls back on a missing file but propagates other errors.",
      required: false,
    },
  ],
  sections: {
    problem: {
      body: "Every real program eventually has to talk to the world outside itself: read a config file, import a spreadsheet a user uploaded, write out a report, or find out which port it should listen on. All of that lives in the **operating system** — the software that manages your files, memory, and processes — and Go's door to it is the **`os` package**.\n\nThe trouble is that the outside world is unreliable in ways your own variables never are. A file might not exist, or you might lack permission to read it. An environment variable might be missing, or set to an empty string. If you assume everything works, your program crashes on the first surprise. This lesson is about doing these everyday tasks *correctly* — checking every error and cleaning up every file.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "analogy",
            title: "Analogy",
            text: "Think of the `os` package as the reception desk of a building. You can't wander into any room you like — you ask the desk to open a door (a file), and it either hands you a key or tells you the room doesn't exist or is locked. Every request can be refused, so you always check the answer before walking in.",
          },
        },
        {
          type: "points",
          items: [
            "The **`os` package** is Go's interface to files, the environment, command-line arguments, and process exit.",
            "Anything from outside your program can fail — missing files, permission errors, unset variables — so every call returns an error to check.",
            "An open file must always be handed back (closed), or the program slowly leaks a scarce OS resource.",
          ],
        },
      ],
    },
    "mental-model": {
      body: "Hold three rules and files stop surprising you. **Rule 1: every open returns `(file, error)` — check the error before touching the file.** A non-nil error means the file value is unusable. **Rule 2: the instant an open succeeds, `defer f.Close()`.** Setup and cleanup then sit one line apart and can't drift as the function grows. **Rule 3: pick the open function by intent** — `os.Open` for read-only, `os.Create` to make/truncate for writing, `os.OpenFile` when you need precise control with flags.\n\nThe same 'check then trust' rule governs the environment. `os.Getenv` gives you a plain string and can't distinguish unset from empty; `os.LookupEnv` returns `(value, ok)` where `ok` tells you whether the variable actually exists. Reach for `LookupEnv` whenever 'not set' and 'set to empty' should mean different things.",
      blocks: [
        {
          type: "note",
          note: {
            tone: "warning",
            title: "Check the open error BEFORE deferring",
            text: "Never write `f, err := os.Open(p); defer f.Close()` before checking err. If the open failed, f is nil and the deferred Close will panic. The order is always: open, check the error and bail, THEN defer.",
          },
        },
        {
          type: "points",
          items: [
            "`os.Open` — open an existing file **read-only**; errors if it's missing.",
            "`os.Create` — create a new file (or **truncate** an existing one) for writing.",
            "`os.OpenFile(name, flag, perm)` — full control via flags like `O_APPEND`, `O_CREATE`, `O_WRONLY`.",
            "`os.Getenv` returns a string; `os.LookupEnv` returns `(value, ok)` to separate empty from unset.",
          ],
        },
      ],
    },
    mechanics: {
      body: "Now the precise version. `os.Open(name)` returns `(*os.File, error)` and opens read-only. `os.Create(name)` returns the same pair but opens for writing, creating the file if needed and **truncating it to empty** if it already exists — so never use `Create` when you mean to append. `os.OpenFile(name, flag, perm)` is the general form: `flag` is a bitwise-OR of constants (`os.O_RDONLY`, `os.O_WRONLY`, `os.O_CREATE`, `os.O_APPEND`, `os.O_TRUNC`), and `perm` is a Unix permission like `0644`. `os.Open` and `os.Create` are just convenient presets over `OpenFile`.\n\nFor small files there are two one-liners that open, read/write, and close for you: `os.ReadFile(name) ([]byte, error)` and `os.WriteFile(name, data, perm) error`. Use them when the whole file fits comfortably in memory; use `os.Open` + streaming for large files.\n\nPaths get their own package. `filepath.Join(parts...)` builds a path with the **operating system's** separator (`/` on Unix, `\\` on Windows) and cleans up redundant slashes, so never concatenate paths by hand. And for failures, the OS reports a missing file with a sentinel you match using `errors.Is(err, os.ErrNotExist)` (or the older helper `os.IsNotExist(err)`).",
      blocks: [
        {
          type: "example",
          example: {
            title: "Choosing the right open function",
            language: "go",
            code: 'import (\n    "os"\n    "path/filepath"\n)\n\nfunc openFiles() {\n    // read-only: errors if the file is missing\n    f, err := os.Open("config.yaml")\n\n    // create/truncate for writing\n    out, err := os.Create("report.csv")\n\n    // append, creating if needed — Create would erase the log!\n    logFile, err := os.OpenFile("app.log",\n        os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)\n\n    // cross-platform path: "data/2026/report.csv" on Unix\n    path := filepath.Join("data", "2026", "report.csv")\n    _, _, _, _, _ = f, out, logFile, path, err\n}',
            takeaway:
              "Match the function to the intent: Open to read, Create to make-or-replace, OpenFile with flags to append. Build paths with filepath.Join, never string concatenation.",
          },
        },
        {
          type: "points",
          items: [
            "`os.Open` = read-only; `os.Create` = write + truncate; `os.OpenFile` = flags + permissions.",
            "`os.ReadFile` / `os.WriteFile` open-read/write-close for you — for small files only.",
            '`filepath.Join` uses the OS separator and cleans the path; hand-built `"/"` paths break on Windows.',
            "Detect a missing file with `errors.Is(err, os.ErrNotExist)`.",
          ],
        },
      ],
    },
    diagram: {
      body: "The single most important shape in this whole lesson is the lifecycle of an opened file: open, check the error, defer the close, use it, and let the defer return it. Trace the flow below — notice the error check happens *before* the defer, and the close is guaranteed no matter which way the function exits.",
      blocks: [
        {
          type: "diagram",
          diagram: {
            title: "The safe file lifecycle",
            kind: "flow",
            nodes: [
              {
                id: "open",
                label: "f, err := os.Open(path)",
                detail: "borrow the file from the OS",
              },
              {
                id: "check",
                label: "if err != nil { return err }",
                detail: "bail out before touching f",
                tone: "danger",
              },
              {
                id: "defer",
                label: "defer f.Close()",
                detail: "schedule the return for every exit",
                tone: "accent",
              },
              {
                id: "use",
                label: "read/write via f (an io.Reader/Writer)",
                detail: "stream the data",
              },
              {
                id: "ret",
                label: "return → f.Close() runs",
                detail: "the file is handed back",
                tone: "success",
              },
            ],
            caption:
              "Check the open error first, then defer Close. Every path out of the function — success or error — returns the file.",
          },
        },
      ],
    },
    implementation: {
      body: "Here is the whole pattern end to end: read a file safely by streaming it, and read configuration from the environment with sensible fallbacks. This is the shape you'll write over and over.",
      blocks: [
        {
          type: "example",
          example: {
            title: "Reading a file safely and reading config from the environment",
            language: "go",
            code: 'import (\n    "fmt"\n    "io"\n    "os"\n)\n\n// stream a file through io.ReadAll, guaranteeing cleanup\nfunc readFile(path string) ([]byte, error) {\n    f, err := os.Open(path)\n    if err != nil {\n        return nil, err            // missing/permission error surfaces here\n    }\n    defer f.Close()                // returned on success AND error paths\n    return io.ReadAll(f)           // f is an io.Reader\n}\n\n// read config: PORT is optional (default 8080), DATABASE_URL is required\nfunc loadConfig() (port, dbURL string, err error) {\n    port = os.Getenv("PORT")\n    if port == "" {\n        port = "8080"              // sensible default\n    }\n    dbURL, ok := os.LookupEnv("DATABASE_URL")\n    if !ok {\n        return "", "", fmt.Errorf("DATABASE_URL is required but not set")\n    }\n    return port, dbURL, nil\n}',
            takeaway:
              "readFile follows open → check → defer → use. loadConfig uses Getenv with a default for optional values, and LookupEnv to fail loudly when a required variable is missing.",
          },
        },
        {
          type: "points",
          items: [
            "For a required variable, `LookupEnv` + an error is how you fail fast at startup instead of crashing later.",
            'For an optional variable, `Getenv` plus an `== ""` default is fine.',
            "`io.ReadAll(f)` works because an open file is an `io.Reader`.",
          ],
        },
      ],
    },
    experiment: {
      body: 'Predict before you read on — a wrong guess you correct sticks better than a right answer you skimmed. Consider this program that logs to a file and then exits on an error:\n\n```\nfunc main() {\n    f, _ := os.Create("run.log")\n    defer f.Close()\n    fmt.Fprintln(f, "starting up")\n    if badConfig() {\n        fmt.Fprintln(f, "bad config, aborting")\n        os.Exit(1)\n    }\n}\n```\n\nWhen `badConfig()` is true, does the line "bad config, aborting" reliably end up saved in run.log? Commit to yes or no before continuing.\n\nHere\'s what actually happens. `os.Exit` terminates the process **immediately** — it does *not* run deferred calls. So `defer f.Close()` never fires. Whether your last `Fprintln` survives depends on OS buffering, so the abort message is often lost or the file is left in a half-written state. This is the single most surprising thing about `os.Exit`: it bypasses every `defer` in the entire call stack.\n\nThe fix is to keep `os.Exit` out of the middle of your logic — return an `error` up to `main`, do cleanup via `defer` there, and call `os.Exit` (or just `log.Fatal`, which also skips defers) only at the very top after cleanup, or flush and close explicitly before exiting.',
    },
    "failure-cases": {
      body: "The failures here cluster around three misunderstandings: not checking errors, forgetting cleanup, and misreading how the environment and exit behave. These are the ones you'll actually hit.",
      blocks: [
        {
          type: "points",
          items: [
            "**Deferring Close before checking the open error** → if the open failed, `f` is nil and `f.Close()` panics. Check first, defer second.",
            "**Using `os.Create` to append** → Create truncates the file to empty; your existing data is gone. Use `os.OpenFile` with `O_APPEND|O_CREATE`.",
            "**`os.Exit` (or `log.Fatal`) in the middle of logic** → skips every deferred Close/flush. Return errors to main and exit at the top.",
            '**`os.Getenv` for a required value** → an unset variable and an empty one both look like `""`; use `os.LookupEnv` to tell them apart.',
            '**Concatenating paths with `"/"`** → wrong separator on Windows and messy double-slashes. Use `filepath.Join`.',
            "**Comparing error strings to detect a missing file** → brittle. Use `errors.Is(err, os.ErrNotExist)`.",
          ],
        },
        {
          type: "example",
          example: {
            title: "Missing-file handling done right",
            language: "go",
            code: 'import (\n    "errors"\n    "os"\n)\n\nfunc loadOrDefault(path string) ([]byte, error) {\n    data, err := os.ReadFile(path)\n    if errors.Is(err, os.ErrNotExist) {\n        return defaultConfig(), nil   // missing file → fall back\n    }\n    if err != nil {\n        return nil, err               // some OTHER error → propagate\n    }\n    return data, nil\n}',
            takeaway:
              "Only a not-exist error triggers the fallback. A permission error or disk error is a different problem and must propagate, not be silently defaulted away.",
          },
        },
      ],
    },
    "trade-offs": {
      body: "The file and environment tools each have a right and wrong scale. Knowing the boundary keeps your code both simple and correct.",
      blocks: [
        {
          type: "points",
          items: [
            "**`os.ReadFile`/`os.WriteFile` vs streaming**: one-liners are perfect for small files but load the *whole* file into memory — stream large files with `os.Open` + a reader instead.",
            "**`os.Create` vs `os.OpenFile`**: Create is concise but always truncates; OpenFile is verbose but lets you append or open exclusively. Choose by whether existing data must survive.",
            "**Environment config vs config files**: env vars are great for a handful of deployment settings but awkward for large or structured config — reach for a file then.",
            "**Failing fast vs defaulting**: fail loudly (LookupEnv + error) for values the program truly needs; default silently only for genuinely optional ones.",
          ],
        },
      ],
    },
    design: {
      body: "A few durable rules. Always open, check the error, and arrange `Close()` on the next line — treat those three as one inseparable move. For reads, `defer f.Close()` is normally enough. For important writes, return or check the `Close` error because a delayed write failure can surface only while closing the file.\n\nPick the open function by intent (`Open` read, `Create` replace, `OpenFile` append/control) rather than reaching for the one you remember. Read required configuration with `LookupEnv` so a missing value fails at startup, not deep in a request. Build every path with `filepath.Join`, detect missing files with `errors.Is(err, os.ErrNotExist)` rather than string matching, and keep `os.Exit` at the very top of `main` so it cannot skip cleanup.",
      blocks: [
        {
          type: "scenario",
          scenario: {
            title: "Reading config once, at startup, and failing loudly",
            context:
              "A service needs DATABASE_URL to run and takes an optional PORT (default 8080). Where and how should it read them?",
            insight:
              'Read both in a `loadConfig()` called once at startup: `LookupEnv("DATABASE_URL")` and return an error if `!ok`; `Getenv("PORT")` with a `"8080"` default. main checks the error and exits before serving. A misconfigured deploy then fails immediately with a clear message instead of crashing on the first request.',
          },
        },
        {
          type: "points",
          items: [
            "Open → check → `defer Close()` is one move, always in that order.",
            "For important writes, propagate the `Close` error instead of discarding it.",
            "Required config via `LookupEnv`; optional config via `Getenv` + default.",
            "`filepath.Join` for paths; `errors.Is(err, os.ErrNotExist)` for missing files; `os.Exit` only at the top.",
          ],
        },
      ],
    },
    mastery: {
      body: "You've mastered this when you can write a file-reading function that guarantees `f.Close()` on every path, explain why `os.LookupEnv` is needed to separate an empty value from an unset one, diagnose why deferred cleanup didn't run after an `os.Exit`, and design not-exist handling with `errors.Is(err, os.ErrNotExist)`. Attest a criterion only when you genuinely have that evidence — opening the lesson doesn't count.",
    },
    summary: {
      body: "The `os` package is your program's door to files, the environment, and the process. Three ideas carry it. **Files are borrowed OS resources**: open with the right function (`Open`/`Create`/`OpenFile`), check the error, and `defer f.Close()` — and remember an `*os.File` is an `io.Reader`/`io.Writer`, so the previous lesson applies directly.\n\n**The environment can be unset or empty**: use `os.LookupEnv`'s `(value, ok)` to tell them apart and fail fast on required config. **The details bite if ignored**: build paths with `filepath.Join`, detect missing files with `errors.Is(err, os.ErrNotExist)`, and never let `os.Exit` skip your cleanup. Next up: encoding and decoding data.",
      blocks: [
        {
          type: "points",
          items: [
            "Open → check the error → `defer f.Close()`, always in that order.",
            "`*os.File` is an `io.Reader`/`io.Writer`; use `os.ReadFile`/`os.WriteFile` for small files, streaming for large ones.",
            "`os.LookupEnv` separates unset from empty; use it for required config.",
            "`filepath.Join` for paths, `errors.Is(err, os.ErrNotExist)` for missing files, and keep `os.Exit` out of the middle of your logic.",
          ],
        },
      ],
    },
  },
};
