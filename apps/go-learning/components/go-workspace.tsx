"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  Check,
  ChevronRight,
  Clock3,
  Focus,
  Library,
  Lightbulb,
  ListTree,
  Menu,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { GoEditor } from "@platform/code-editor";
import { FlowDiagram, type DiagramNode } from "@platform/diagrams";
import { LearningProvider, useLearning } from "@platform/learning-engine/react";
import { normalizeStage, type Lesson } from "@platform/content-schema";
import {
  Badge,
  Button,
  ProgressRing,
  ReferenceList,
  ResourceList,
  SectionLabel,
  StageArticle,
} from "@platform/ui";
import {
  allTopics,
  goCurriculum,
  goResources,
  type CurriculumModule,
  type TopicRef,
} from "@platform/curriculum";

const stageMeta = [
  ["problem", "01", "Why this matters"],
  ["mental-model", "02", "Key mental model"],
  ["diagram", "03", "Visual model"],
  ["mechanics", "04", "Rules and behavior"],
  ["implementation", "05", "Worked example"],
  ["experiment", "06", "Prediction experiment"],
  ["failure-cases", "07", "Common mistakes"],
  ["summary", "08", "What to remember"],
  ["exercises", "09", "Exercises"],
  ["mastery", "10", "Mastery checklist"],
  ["trade-offs", "11", "Trade-offs and alternatives"],
  ["design", "12", "Recommended practices"],
] as const;
type StageId = (typeof stageMeta)[number][0];
type ChapterId = "big-picture" | "code-experiment" | "best-practices" | "practice" | "deeper";

/**
 * The authored schema stays detailed, but beginners should not have to navigate
 * every authored stage as an equally prominent "session." The workspace keeps
 * the clearest explanation, code, visual, best practices, and practice in a
 * short path while deeper trade-offs remain optional.
 */
const chapterMeta: readonly {
  id: ChapterId;
  number: string;
  label: string;
  description: string;
  stages: readonly StageId[];
  optional?: boolean;
}[] = [
  {
    id: "big-picture",
    number: "01",
    label: "Concept & mental model",
    description: "Build the mental model that makes the rest of the topic predictable.",
    stages: ["problem", "mental-model", "diagram"],
  },
  {
    id: "code-experiment",
    number: "02",
    label: "Rules & examples",
    description: "Learn the exact rules, see them in code, and test a prediction.",
    stages: ["mechanics", "implementation", "experiment"],
  },
  {
    id: "best-practices",
    number: "03",
    label: "Best practices & pitfalls",
    description: "Use the recommended approach and avoid the mistakes beginners commonly meet.",
    stages: ["design", "failure-cases"],
  },
  {
    id: "practice",
    number: "04",
    label: "Exercises & review",
    description: "Recap the idea, solve a few core problems, and check your understanding.",
    stages: ["summary", "exercises", "mastery"],
  },
  {
    id: "deeper",
    number: "05",
    label: "Trade-offs",
    description: "Optional trade-offs for when the core idea feels comfortable.",
    stages: ["trade-offs"],
    optional: true,
  },
];

/** Concise chapter names that say what each lesson actually teaches. */
const lessonChapterLabels: Record<string, Partial<Record<ChapterId, string>>> = {
  "go-source-to-process": {
    "big-picture": "Packages, build & startup",
    "code-experiment": "From package to main",
  },
  "go-basic-types": {
    "big-picture": "Types, constants & zero values",
    "code-experiment": "Declarations & conversions",
  },
  "go-functions-defer": {
    "big-picture": "Functions as values",
    "code-experiment": "Returns, defer & closures",
  },
  "go-control-flow": {
    "big-picture": "Choosing execution paths",
    "code-experiment": "if, for & switch rules",
  },
  "go-structs-pointers": {
    "big-picture": "Structs and shared updates",
    "code-experiment": "Pointers, methods & receivers",
  },
  "go-copy-semantics": {
    "big-picture": "Copies versus shared data",
    "code-experiment": "Assignment, scope & shadowing",
  },
  "go-slices": {
    "big-picture": "Slices and backing arrays",
    "code-experiment": "Length, capacity & append",
  },
  "go-maps": {
    "big-picture": "Key-value lookup",
    "code-experiment": "Reads, writes & iteration",
  },
  "go-strings-runes": {
    "big-picture": "Text is stored as bytes",
    "code-experiment": "Bytes, runes & UTF-8",
  },
  "go-unit-table-tests": {
    "big-picture": "Testing behavior",
    "code-experiment": "Table tests & subtests",
  },
  "go-stack-heap-escape": {
    "big-picture": "Where values live",
    "code-experiment": "Escape analysis in practice",
  },
  "go-interfaces": {
    "big-picture": "Behavior without implements",
    "code-experiment": "Method sets & nil interfaces",
  },
  "go-assertions-switches": {
    "big-picture": "Dynamic interface values",
    "code-experiment": "Assertions & type switches",
  },
  "go-embedding": {
    "big-picture": "Composition through embedding",
    "code-experiment": "Promotion & conflicts",
  },
  "go-generics": {
    "big-picture": "Reusable typed algorithms",
    "code-experiment": "Parameters, constraints & inference",
  },
  "go-error-values": {
    "big-picture": "Failures as values",
    "code-experiment": "Creating & returning errors",
  },
  "go-error-wrapping": {
    "big-picture": "Error chains",
    "code-experiment": "Wrap, inspect & preserve",
  },
  "go-panic-recover": {
    "big-picture": "Exceptional failure",
    "code-experiment": "Panic, defer & recover",
  },
  "go-dependency-direction": {
    "big-picture": "Interfaces at the consumer",
    "code-experiment": "Package dependency direction",
  },
  "go-io-reader-writer": {
    "big-picture": "One interface, many streams",
    "code-experiment": "Read, write, copy & EOF",
  },
  "go-files-os": {
    "big-picture": "Working with the operating system",
    "code-experiment": "Files, environment & paths",
  },
  "go-json": {
    "big-picture": "Go values and JSON",
    "code-experiment": "Tags, encoding & decoding",
  },
  "go-time-context": {
    "big-picture": "Moments and durations",
    "code-experiment": "Elapsed time, RFC3339 & UTC",
  },
  "go-net-http": {
    "big-picture": "Requests, handlers & responses",
    "code-experiment": "Routing, middleware & clients",
  },
  "go-database-sql": {
    "big-picture": "SQL through a connection pool",
    "code-experiment": "Queries, rows & transactions",
  },
  "go-goroutines-scheduler": {
    "big-picture": "Concurrent functions",
    "code-experiment": "Scheduling, blocking & waiting",
  },
  "go-channels-select": {
    "big-picture": "Passing values between goroutines",
    "code-experiment": "Send, receive, close & select",
  },
  "go-sync-atomic": {
    "big-picture": "Protecting shared state",
    "code-experiment": "Mutexes, WaitGroups & atomics",
  },
  "go-context-cancellation": {
    "big-picture": "Cancellation as a signal",
    "code-experiment": "Deadlines, propagation & cleanup",
  },
  "go-concurrency-patterns": {
    "big-picture": "Structuring concurrent work",
    "code-experiment": "Pipelines, workers & fan-in/out",
  },
  "go-benchmarks": {
    "big-picture": "Measuring performance",
    "code-experiment": "Benchmark loops & allocations",
  },
  "go-fuzzing": {
    "big-picture": "Testing generated inputs",
    "code-experiment": "Seeds, properties & failures",
  },
  "go-mocks-fakes": {
    "big-picture": "Replacing dependencies in tests",
    "code-experiment": "Fakes, stubs, mocks & spies",
  },
  "go-vet-coverage": {
    "big-picture": "Finding untested mistakes",
    "code-experiment": "Vet, coverage & linting",
  },
  "go-profiling-pprof": {
    "big-picture": "Finding real bottlenecks",
    "code-experiment": "pprof & race detection",
  },
  "go-toolchain-modules": {
    "big-picture": "How Go manages a project",
    "code-experiment": "Commands, modules & workspaces",
  },
  "go-gc-tuning": {
    "big-picture": "How Go reclaims memory",
    "code-experiment": "Pacing, GOGC & memory limits",
  },
  "go-reflection": {
    "big-picture": "Types and values at runtime",
    "code-experiment": "Inspecting & changing values",
  },
  "go-unsafe-cgo": {
    "big-picture": "Crossing Go's safety boundary",
    "code-experiment": "Pointers, C calls & linking",
  },
  "go-modules-advanced": {
    "big-picture": "Releasing reusable modules",
    "code-experiment": "Versions, MVS & publishing",
  },
};

/** One familiar anchor per lesson for learners arriving from React/TypeScript. */
const frontendBridge: Record<string, string> = {
  "go-source-to-process":
    "A Next.js build also transforms source before it runs. Go goes further: it compiles and links your packages into a native executable, then the operating system starts that file.",
  "go-toolchain-modules":
    "Think package.json + npm scripts, but Go keeps module requirements in go.mod and most build, test, format, and dependency commands under one go tool.",
  "go-basic-types":
    "Like TypeScript, Go can infer a variable's type from its initializer. Go's types also affect compilation and memory layout, and a declared value starts at its zero value instead of undefined.",
  "go-copy-semantics":
    "JavaScript objects are normally shared by reference. Go structs are copied as values by default, while slices, maps, and pointers can still share underlying data.",
  "go-functions-defer":
    "Go functions feel familiar, but they can return several values. defer is closest to scheduling cleanup for the end of the current function, somewhat like a small finally block.",
  "go-control-flow":
    "if and switch look familiar, but Go has no truthy/falsy coercion and uses for for every loop shape—there is no separate while keyword.",
  "go-slices":
    "A slice often plays the role of a JavaScript array, but it is a small view over a backing array. Two slices can therefore share and mutate the same elements.",
  "go-maps":
    "A Go map is closest to JavaScript Map or Record, but keys and values have fixed types. Reading a missing key returns the value type's zero value plus an optional presence boolean.",
  "go-strings-runes":
    "JavaScript string indexing exposes UTF-16 code units. Go string indexing exposes UTF-8 bytes; range decodes Unicode code points called runes.",
  "go-structs-pointers":
    "A struct may look like a typed object, but it has a concrete Go layout and is copied by value. A pointer makes shared mutation explicit.",
  "go-stack-heap-escape":
    "Like JavaScript engines, Go manages memory for you. The Go compiler decides stack versus heap placement; write clear code first and inspect escape output only when measuring performance.",
  "go-interfaces":
    "Go interfaces resemble TypeScript structural typing because a type satisfies an interface without an implements declaration. Method sets and interface nil values add runtime rules TypeScript does not have.",
  "go-assertions-switches":
    "A TypeScript as assertion is erased and does no runtime check. A Go type assertion examines the dynamic value and can return an ok boolean instead of panicking.",
  "go-embedding":
    "Embedding is composition with promoted fields or methods—not class inheritance and not object spread. The outer type still contains a distinct inner value.",
  "go-generics":
    "Type parameters and constraints will feel similar to TypeScript generics, but Go constraints describe valid operations and compile into real Go behavior rather than erased annotations.",
  "go-error-values":
    "Instead of throwing for expected failures, Go normally returns an error as another value. It is similar to checking a Result value explicitly at each boundary.",
  "go-error-wrapping":
    "This is like adding context to an Error while preserving its cause. errors.Is and errors.As inspect the wrapped chain without matching message strings.",
  "go-panic-recover":
    "panic is the nearest Go mechanism to a thrown exception, but ordinary failures should still be returned as errors. recover is a narrow boundary tool, not everyday try/catch.",
  "go-dependency-direction":
    "This follows the same dependency-inversion idea used in frontend service layers: the consumer names the small behavior it needs, and concrete infrastructure implements it.",
  "go-io-reader-writer":
    "Reader and Writer are small synchronous stream interfaces. They play a role similar to web streams or Node streams, but composition is based on simple Read and Write methods.",
  "go-files-os":
    "This is server-side territory like Node's fs, process.env, and process exit codes. Browsers cannot directly open arbitrary operating-system files this way.",
  "go-json":
    "JSON.parse returns dynamic JavaScript data. Go usually decodes into a struct, where field types and tags define the expected runtime shape.",
  "go-time-context":
    "time.Time is closest to JavaScript Date, while time.Duration represents a length of time. Go makes units explicit and uses reference layouts for formatting; prefer RFC3339 and UTC when timestamps cross a system boundary.",
  "go-net-http":
    "A net/http handler is the lower-level cousin of a Next.js route handler: read a request and produce a response, but write through http.ResponseWriter.",
  "go-database-sql":
    "This code belongs on the server, never in a React client. sql.DB is a reusable connection pool, closer to a shared backend database client than one open connection.",
  "go-goroutines-scheduler":
    "A goroutine is not a Promise. It starts a function that may run concurrently, and the Go scheduler can pause it when a blocking operation waits.",
  "go-channels-select":
    "A channel is roughly a typed async queue between goroutines, but sends and receives can block. select waits for one of several channel operations.",
  "go-sync-atomic":
    "Frontend JavaScript usually avoids shared-memory threads. Once goroutines share mutable data, mutexes or atomics provide the ordering that the single browser event loop normally hides from you.",
  "go-context-cancellation":
    "AbortController and AbortSignal are the closest browser analogy. Go context also carries deadlines through a call tree so downstream work can stop with the caller.",
  "go-races-detector":
    "Think of bugs with Web Workers and SharedArrayBuffer: two workers touch shared memory without ordering. Go's -race flag detects many of these accesses during real execution.",
  "go-concurrency-patterns":
    "Promise.all and concurrency-limit helpers are useful anchors, but Go composes running functions with goroutines, channels, cancellation, and bounded worker counts.",
  "go-unit-table-tests":
    "The testing package fills the role of Jest or Vitest without a separate assertion DSL. Table tests are arrays of input/expected cases run by one Test function.",
  "go-benchmarks":
    "Instead of wrapping performance.now around a loop, Go's testing harness controls `b.Loop`, timing, repetitions, and allocation reporting for you.",
  "go-fuzzing":
    "Fuzzing is property-based testing built into go test: provide seed examples and an invariant, then let the tool generate inputs you did not think of.",
  "go-mocks-fakes":
    "The goal is familiar from Jest/Vitest tests, but Go often needs only a tiny hand-written fake that satisfies an interface—no large mocking framework.",
  "go-vet-coverage":
    "go vet and static analysis play roles similar to TypeScript and ESLint, while coverage still measures executed code rather than whether assertions were meaningful.",
  "go-profiling-pprof":
    "pprof is the Go-side cousin of the Chrome Performance panel: capture evidence about where CPU time or memory goes before changing code.",
  "go-escape-analysis-deep":
    "JavaScript hides most allocation placement. Go lets you ask why a value escaped to the heap, but the result is a compiler decision—not a rule you should guess from syntax.",
  "go-gc-tuning":
    "Both V8 and Go use garbage collection. Go exposes service-level memory controls, but reducing unnecessary allocation is usually safer than tuning the collector first.",
  "go-reflection":
    "Most TypeScript type information is erased. Go reflection can inspect runtime Go types and values, but it trades away compile-time clarity and should stay at framework boundaries.",
  "go-unsafe-cgo":
    "unsafe is like bypassing TypeScript and directly manipulating memory; cgo is closer to a native Node addon boundary. Both give up portability or safety and are advanced opt-ins.",
  "go-modules-advanced":
    "Go modules solve a problem similar to npm packages, but v2+ enters the import path and Minimal Version Selection follows go.mod requirements instead of always choosing latest.",
};

/**
 * Stages that always render for every lesson because they carry a data-driven
 * widget (built from the lesson's own exercises/criteria), even with no prose.
 */
const baseWidgetStages: StageId[] = ["exercises", "mastery", "summary"];

/**
 * The one lesson with bespoke, hand-built interactive widgets (the compile
 * pipeline diagram, the init-order experiment, and the runtime.Version editor).
 * Every other lesson renders its diagram/experiment/implementation stages from
 * its own authored content blocks instead.
 */
const bespokeWidgetLessonId = "go-source-to-process";
const bespokeWidgetStages: StageId[] = ["diagram", "experiment", "implementation"];

const pipeline: DiagramNode[] = [
  {
    id: "package",
    label: "go command",
    detail: "Load the named main package and its dependencies, then coordinate the build.",
    owner: "`go` command (`cmd/go`)",
    source: { label: "Official cmd/go documentation", url: "https://pkg.go.dev/cmd/go" },
    phase: "build",
  },
  {
    id: "compile",
    label: "compile",
    detail:
      "Compile each needed package as one unit. The build cache may reuse an unchanged result.",
    owner: "`go tool compile` (`cmd/compile`); `asm` or `cgo` joins only when the package needs it",
    source: {
      label: "Official cmd/compile documentation",
      url: "https://pkg.go.dev/cmd/compile",
    },
    phase: "build",
  },
  {
    id: "link",
    label: "link",
    detail: "Combine package objects and dependencies into one executable binary.",
    owner: "`go tool link` (`cmd/link`), normally invoked by the `go` command",
    source: { label: "Official cmd/link documentation", url: "https://pkg.go.dev/cmd/link" },
    phase: "build",
  },
  {
    id: "initialize",
    label: "initialize",
    detail:
      "Initialize the complete program: dependencies before importers, then package main's variables and init functions.",
    owner: "initialization code already inside the executable; no external `go tool` runs here",
    source: {
      label: "Go specification: program initialization",
      url: "https://go.dev/ref/spec#Program_initialization_and_execution",
    },
    phase: "run",
  },
  {
    id: "main",
    label: "main()",
    detail:
      "Go invokes func main after initialization. When it returns, the program exits without waiting for other goroutines.",
    owner: "your compiled `main.main` function inside the executable",
    source: {
      label: "Go specification: program execution",
      url: "https://go.dev/ref/spec#Program_execution",
    },
    phase: "run",
  },
];

const progressLabels: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  explanation_reviewed: "Reviewing",
  mental_model_understood: "Building model",
  exercise_attempted: "Practicing",
  exercise_completed: "Exercise done",
  project_applied: "Applied",
  needs_review: "Needs review",
  mastered: "Mastered",
};

const statusTag: Record<string, string> = {
  authored: "ready",
  in_authoring: "drafting",
  planned: "planned",
};
const statusLabel: Record<string, string> = {
  authored: "Ready to learn",
  in_authoring: "In authoring",
  planned: "Planned",
};

// Flat topic index (topic + module context) for lookups — pure over static catalog data.
const topicIndex = new Map<string, TopicRef>(allTopics(goCurriculum).map((t) => [t.id, t]));

type Exercise = Lesson["exercises"][number];

const exerciseTypeLabel: Record<string, string> = {
  prediction: "Predict",
  "code-reading": "Read the code",
  implementation: "Implement",
  debugging: "Debug",
  refactoring: "Refactor",
  design: "Design",
  advanced: "Challenge",
};

/** Exercise types that demand a committed written answer before the reveal. */
const gradedTypes = new Set(["prediction", "code-reading"]);
/** Exercise types that open the code editor when a starter + reference exist. */
const editorTypes = new Set(["implementation", "debugging", "refactoring"]);

/**
 * Honest local check for editor exercises: the learner's code must contain the
 * reference solution's significant tokens. Purely deterministic text analysis —
 * nothing is compiled or executed.
 */
function referenceTokenCheck(expected: string) {
  const stop = new Set([
    "func",
    "return",
    "package",
    "import",
    "var",
    "const",
    "type",
    "string",
    "int",
    "int64",
    "bool",
    "error",
    "nil",
    "true",
    "false",
  ]);
  const tokens = Array.from(new Set(expected.match(/[A-Za-z_][A-Za-z0-9_.]*/g) ?? [])).filter(
    (t) => t.length > 2 && !stop.has(t),
  );
  return (code: string) => {
    const missing = tokens.filter((t) => !code.includes(t));
    return missing.length === 0
      ? {
          passed: true,
          output: "deterministic check — every key element of the reference is present",
        }
      : {
          passed: false,
          output: `deterministic check — still missing: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? "…" : ""}`,
        };
  };
}

/**
 * One problem the learner works, interactive per type. Prediction/code-reading
 * require a committed answer before the reveal, then an honest self-assessment
 * that grades the attempt (a miss routes the lesson to needs_review upstream).
 * Implementation/debugging/refactoring open the editor with a deterministic
 * reference check. Design/challenge types collect a sketch and self-attest.
 */
function ExerciseCard({
  index,
  exercise,
  done,
  onComplete,
  onOutcome,
  variant,
}: {
  index: number;
  exercise: Exercise;
  done: boolean;
  onComplete: () => void;
  /** Graded outcome: reveal self-assessment or an editor check pass. */
  onOutcome: (correct: boolean) => void;
  variant?: "challenge";
}) {
  const [hintsShown, setHintsShown] = useState(0);
  const [answerShown, setAnswerShown] = useState(false);
  const [attempt, setAttempt] = useState("");
  const [assessed, setAssessed] = useState<"right" | "wrong" | null>(null);
  const hasMoreHints = hintsShown < exercise.hints.length;

  const graded = gradedTypes.has(exercise.type) && Boolean(exercise.expectedAnswer);
  const usesEditor =
    editorTypes.has(exercise.type) &&
    Boolean(exercise.starterCode) &&
    Boolean(exercise.expectedAnswer);
  const committed = attempt.trim().length > 0;

  const assess = (correct: boolean) => {
    setAssessed(correct ? "right" : "wrong");
    onOutcome(correct);
  };

  return (
    <div className={done ? "exercise-card done" : "exercise-card"} data-variant={variant}>
      <div className="exercise-card-head">
        <span className="exercise-num">{String(index + 1).padStart(2, "0")}</span>
        <span className="exercise-type">{exerciseTypeLabel[exercise.type] ?? exercise.type}</span>
        {done && <Check size={15} className="exercise-check" />}
      </div>
      <p className="exercise-prompt">{exercise.prompt}</p>

      {usesEditor ? (
        <div className="exercise-editor">
          <GoEditor
            starter={exercise.starterCode ?? ""}
            expected={exercise.expectedAnswer ?? ""}
            test={referenceTokenCheck(exercise.expectedAnswer ?? "")}
            onResult={(r) => {
              if (r.passed && !done) onOutcome(true);
            }}
          />
        </div>
      ) : (
        exercise.starterCode && (
          <pre className="exercise-code">
            <code>{exercise.starterCode}</code>
          </pre>
        )
      )}

      {!usesEditor && !done && (
        <textarea
          className="exercise-attempt"
          value={attempt}
          onChange={(e) => setAttempt(e.target.value)}
          placeholder={
            graded
              ? "Commit your answer before revealing — your first answer is the useful evidence…"
              : "Sketch your approach before attesting…"
          }
          aria-label="Your answer"
        />
      )}

      {hintsShown > 0 && (
        <ul className="exercise-hints">
          {exercise.hints.slice(0, hintsShown).map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      )}
      {answerShown && exercise.expectedAnswer && (
        <div className="exercise-answer">
          <SectionLabel>Answer</SectionLabel>
          <p>{exercise.expectedAnswer}</p>
        </div>
      )}
      {assessed && (
        <div className={assessed === "right" ? "reveal correct" : "reveal"} role="status">
          <strong>
            {assessed === "right" ? "Correct — evidence recorded." : "Marked for review."}
          </strong>{" "}
          {assessed === "right"
            ? "This exercise now counts toward mastery."
            : "A wrong first answer is useful: this lesson is now flagged needs-review."}
        </div>
      )}

      <div className="exercise-actions">
        {hasMoreHints && !answerShown && (
          <button className="ghost-btn" onClick={() => setHintsShown((n) => n + 1)}>
            {hintsShown === 0 ? "Show hint" : "Next hint"}
          </button>
        )}
        {graded && !answerShown && (
          <button
            className="solid-btn"
            disabled={!committed && !done}
            title={committed || done ? undefined : "Type your answer first"}
            onClick={() => setAnswerShown(true)}
          >
            Reveal answer
          </button>
        )}
        {graded && answerShown && !assessed && !done && (
          <>
            <button className="solid-btn" onClick={() => assess(true)}>
              I had it right
            </button>
            <button className="ghost-btn" onClick={() => assess(false)}>
              I missed it
            </button>
          </>
        )}
        {!graded && !usesEditor && exercise.expectedAnswer && !answerShown && (
          <button className="ghost-btn" onClick={() => setAnswerShown(true)}>
            Reveal answer
          </button>
        )}
        {!graded && !done && (
          <button className="solid-btn" onClick={onComplete}>
            Mark worked through
          </button>
        )}
      </div>
    </div>
  );
}

/** The module's hands-on project with a persisted milestone checklist. */
function ProjectPanel({
  project,
  completed,
  onToggle,
}: {
  project: { title: string; outcome: string; milestones: string[] };
  completed: string[];
  onToggle: (key: string) => void;
}) {
  const doneCount = project.milestones.filter((_, i) => completed.includes(String(i))).length;
  return (
    <div className="module-project">
      <div className="module-project-head">
        <SectionLabel>Module project</SectionLabel>
        <span className="module-project-count">
          {doneCount}/{project.milestones.length}
        </span>
      </div>
      <strong className="module-project-title">{project.title}</strong>
      <p className="module-project-outcome">{project.outcome}</p>
      <ul className="milestone-list">
        {project.milestones.map((m, i) => (
          <li key={i}>
            <label>
              <input
                type="checkbox"
                checked={completed.includes(String(i))}
                onChange={() => onToggle(String(i))}
              />
              <span>{m}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

type PaletteItem =
  | { kind: "topic"; id: string; title: string; sub: string }
  | { kind: "stage"; id: string; title: string; sub: string }
  | { kind: "resource"; url: string; title: string; sub: string };

/** ⌘K search over the whole catalog: topics, the current lesson's stages, and resources. */
function CommandPalette({
  open,
  onClose,
  stages,
  onTopic,
  onStage,
}: {
  open: boolean;
  onClose: () => void;
  stages: readonly (readonly [StageId, string, string])[];
  onTopic: (id: string) => void;
  onStage: (id: StageId) => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<PaletteItem[]>(() => {
    const topics: PaletteItem[] = allTopics(goCurriculum).map((t) => ({
      kind: "topic",
      id: t.id,
      title: t.title,
      sub: `${t.moduleTitle} · ${t.status}`,
    }));
    const stageItems: PaletteItem[] = stages.map(([id, number, label]) => ({
      kind: "stage",
      id,
      title: label,
      sub: `Stage ${number}`,
    }));
    const resourceItems: PaletteItem[] = goResources.map((r) => ({
      kind: "resource",
      url: r.url,
      title: r.label,
      sub: `${r.kind}${r.stars ? ` · ${r.stars}★` : ""}`,
    }));
    return [...topics, ...stageItems, ...resourceItems];
  }, [stages]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 40);
    return items.filter((i) => `${i.title} ${i.sub}`.toLowerCase().includes(q)).slice(0, 40);
  }, [items, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);
  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  const choose = (item: PaletteItem) => {
    if (item.kind === "topic") onTopic(item.id);
    else if (item.kind === "stage") onStage(item.id as StageId);
    else window.open(item.url, "_blank", "noreferrer");
    onClose();
  };

  return (
    <div className="palette-overlay" onClick={onClose} role="presentation">
      <div
        className="palette"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search the catalog"
      >
        <div className="palette-input">
          <Search size={16} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const it = filtered[active];
                if (it) choose(it);
              } else if (e.key === "Escape") {
                e.preventDefault();
                onClose();
              }
            }}
            placeholder="Search topics, stages, resources…"
            aria-label="Search catalog"
          />
          <kbd>esc</kbd>
          <button className="palette-close" aria-label="Close search" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <ul className="palette-results">
          {filtered.length === 0 && <li className="palette-empty">No matches</li>}
          {filtered.map((item, i) => (
            <li key={`${item.kind}-${item.kind === "resource" ? item.url : item.id}`}>
              <button
                className={i === active ? "palette-item active" : "palette-item"}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(item)}
              >
                <span className="palette-kind">{item.kind}</span>
                <span className="palette-title">{item.title}</span>
                <span className="palette-sub">{item.sub}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const resourceKindOrder = [
  "playground",
  "doc",
  "article",
  "repo",
  "video",
  "course",
  "book",
  "tool",
];
const resourceKindLabel: Record<string, string> = {
  playground: "Interactive & playgrounds",
  doc: "Documentation",
  article: "Articles & blogs",
  repo: "Repositories",
  video: "Videos & talks",
  course: "Courses",
  book: "Books",
  tool: "Tools",
};
const presentResourceKinds = resourceKindOrder.filter((k) => goResources.some((r) => r.kind === k));

/** Dedicated resources destination: curated links grouped by kind, plus per-module references. */
function ResourcesHub() {
  const byKind = new Map<string, (typeof goResources)[number][]>();
  for (const r of goResources) {
    const list = byKind.get(r.kind);
    if (list) list.push(r);
    else byKind.set(r.kind, [r]);
  }
  const modulesWithResources = goCurriculum.modules.filter((m) => m.resources.length > 0);
  return (
    <div className="resources-hub">
      <div className="lesson-head">
        <div>
          <div className="breadcrumbs">
            <span>GO RUNTIME LAB</span>
            <ChevronRight size={12} />
            <span>RESOURCES</span>
          </div>
          <h1>Resource library</h1>
          <p>
            Curated documentation, repositories, and videos for learning Go end to end — plus the
            references attached to each module.
          </p>
          <div className="lesson-meta">
            <Badge>{goResources.length} curated</Badge>
            <Badge>{presentResourceKinds.length} categories</Badge>
          </div>
        </div>
      </div>
      <div className="hub-body">
        {presentResourceKinds.map((k) => (
          <section className="hub-group" id={`hub-${k}`} key={k}>
            <ResourceList items={byKind.get(k) ?? []} title={resourceKindLabel[k] ?? k} />
          </section>
        ))}
        <section className="hub-group" id="hub-modules">
          <SectionLabel>By module</SectionLabel>
          <div className="hub-modules">
            {modulesWithResources.map((m) => (
              <div className="hub-module" key={m.id}>
                <h3>
                  <span>{String(m.order).padStart(2, "0")}</span> {m.title}
                </h3>
                <ResourceList items={m.resources} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function GoWorkspace(props: { lessons: Lesson[]; initialTopicId?: string | undefined }) {
  return (
    <LearningProvider storageKey="go-runtime-lab">
      <Workspace {...props} />
    </LearningProvider>
  );
}

function Workspace({
  lessons,
  initialTopicId,
}: {
  lessons: Lesson[];
  initialTopicId?: string | undefined;
}) {
  const {
    progress,
    completedLessons,
    stages,
    bookmarks,
    notes,
    hydrated,
    setStage,
    toggleLessonComplete,
    resetLesson,
    setNote,
    toggleBookmark,
    applyEvent,
    recordEvidence,
    getEvidence,
    getExerciseCompletions,
    markExerciseComplete,
    getMilestones,
    toggleMilestone,
    masteryScoreFor,
  } = useLearning();

  // Registry of every authored lesson, keyed by id, for opening any topic.
  const lessonsById = useMemo(() => new Map(lessons.map((l) => [l.id, l])), [lessons]);

  // The default selection: the first authored topic in curriculum order.
  const lessonTopicId = useMemo(() => {
    for (const m of goCurriculum.modules)
      for (const t of m.topics)
        if (t.status === "authored" && t.lessonId && lessonsById.has(t.lessonId)) return t.id;
    return goCurriculum.modules[0]?.topics[0]?.id ?? "";
  }, [lessonsById]);

  const [selectedTopicId, setSelectedTopicId] = useState(
    initialTopicId && topicIndex.has(initialTopicId) ? initialTopicId : lessonTopicId,
  );
  const [activeStage, setActiveStage] = useState<StageId>("problem");
  const [inspectorNode, setInspectorNode] = useState(pipeline[0]!);
  const [focus, setFocus] = useState(false);
  const [prediction, setPrediction] = useState<string>();
  const [revealed, setRevealed] = useState(false);
  const [panel, setPanel] = useState<"nav" | "toc" | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  const sectionRefs = useRef(new Map<StageId, HTMLElement>());
  const restored = useRef(false);
  const firedRef = useRef(new Set<string>());
  const pendingStage = useRef<StageId | null>(null);

  const selectedTopic = topicIndex.get(selectedTopicId);
  const selectedModule = goCurriculum.modules.find((m) => m.id === selectedTopic?.moduleId);

  // The lesson currently open, derived from the selected topic. Undefined while a
  // planned/preview topic is selected — the whole lesson UI is gated on it.
  const lesson = selectedTopic?.lessonId ? lessonsById.get(selectedTopic.lessonId) : undefined;
  const isLessonView = Boolean(lesson);
  const hasBespokeWidgets = lesson?.id === bespokeWidgetLessonId;

  // Widget stages are per-lesson: every lesson gets the data-driven exercises/
  // mastery/summary widgets; only the source-to-process lesson gets the bespoke
  // interactive diagram/experiment/editor widgets.
  const widgetStages = useMemo(() => {
    const set = new Set<StageId>(baseWidgetStages);
    if (hasBespokeWidgets) for (const id of bespokeWidgetStages) set.add(id);
    return set;
  }, [hasBespokeWidgets]);

  // Only render stages that have authored content or an interactive widget — empty prose
  // stages are skipped so the continuous page never shows a bare heading (data-driven).
  const renderedStages = useMemo(
    () =>
      lesson
        ? stageMeta.filter(([id]) => {
            if (widgetStages.has(id)) return true;
            const c = normalizeStage(lesson.sections[id]);
            return Boolean(
              c.body?.trim() || c.blocks?.length || c.example || c.scenario || c.keyPoints?.length,
            );
          })
        : [],
    [lesson, widgetStages],
  );

  const renderedChapters = useMemo(
    () =>
      chapterMeta
        .map((chapter) => ({
          ...chapter,
          label: lessonChapterLabels[lesson?.id ?? ""]?.[chapter.id] ?? chapter.label,
          stages: renderedStages.filter(([id]) =>
            chapter.stages.some((chapterStage) => chapterStage === id),
          ),
        }))
        .filter((chapter) => chapter.stages.length > 0),
    [lesson?.id, renderedStages],
  );

  const state = lesson ? (progress[lesson.id] ?? "not_started") : "not_started";
  const evidence = getEvidence(lesson?.id ?? "");
  const requiredCriteria = lesson
    ? lesson.masteryCriteria.filter((criterion) => criterion.required)
    : [];
  const score = masteryScoreFor(
    lesson?.id ?? "",
    requiredCriteria.map((criterion) => criterion.id),
  );
  const completed = lesson ? completedLessons.includes(lesson.id) : false;
  const completedExercises = new Set(lesson ? getExerciseCompletions(lesson.id) : []);
  const authoredLessonIds = allTopics(goCurriculum)
    .filter(
      (topic) => topic.status === "authored" && topic.lessonId && lessonsById.has(topic.lessonId),
    )
    .map((topic) => topic.lessonId!);
  const completedAuthoredLessons = authoredLessonIds.filter((id) =>
    completedLessons.includes(id),
  ).length;
  const courseCompletion = authoredLessonIds.length
    ? Math.round((completedAuthoredLessons / authoredLessonIds.length) * 100)
    : 0;
  const activeIndex = renderedStages.findIndex(([id]) => id === activeStage);
  const activeChapterIndex = renderedChapters.findIndex((chapter) =>
    chapter.stages.some(([id]) => id === activeStage),
  );
  const activeChapterId = renderedChapters[activeChapterIndex]?.id;
  const coreChapterCount = renderedChapters.filter((chapter) => !chapter.optional).length;
  const hasOptionalChapter = renderedChapters.some((chapter) => chapter.optional);

  const requiredMet = requiredCriteria.every((c) => evidence.criteria[c.id]);
  const mastered = state === "mastered";

  // Opening the lesson counts as engagement (not_started -> in_progress).
  useEffect(() => {
    if (hydrated && lesson) applyEvent(lesson.id, { type: "OPEN" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, lesson?.id]);

  // Switching to another lesson resets per-lesson view state so scroll-depth
  // evidence re-arms and the reader starts at the top of the new lesson.
  useEffect(() => {
    firedRef.current.clear();
    setActiveStage("problem");
    setPrediction(undefined);
    setRevealed(false);
  }, [lesson?.id]);

  // Restore the last-viewed section on reload by scrolling to it.
  useEffect(() => {
    if (!hydrated || restored.current || !isLessonView || !lesson) return;
    restored.current = true;
    const saved = stages[lesson.id];
    if (saved && renderedStages.some(([id]) => id === saved)) {
      setActiveStage(saved as StageId);
      requestAnimationFrame(() =>
        sectionRefs.current.get(saved as StageId)?.scrollIntoView({ block: "start" }),
      );
    }
  }, [hydrated, stages, lesson?.id, renderedStages, isLessonView]);

  // Persist the active section as the learner scrolls (the engine debounces the write).
  useEffect(() => {
    if (hydrated && isLessonView && lesson) setStage(lesson.id, activeStage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStage, hydrated, lesson?.id, isLessonView]);

  // Evidence re-homed from the old "Continue" button onto scroll depth: reaching the
  // mental-model section attests the model; reaching the summary attests review.
  useEffect(() => {
    if (!isLessonView || !lesson) return;
    const mentalIdx = renderedStages.findIndex(([id]) => id === "mental-model");
    const anchorMental =
      mentalIdx >= 0 ? mentalIdx : renderedStages.findIndex(([id]) => id === "diagram");
    const anchorSummary = renderedStages.findIndex(([id]) => id === "summary");
    if (anchorMental >= 0 && activeIndex >= anchorMental && !firedRef.current.has("mental-model")) {
      firedRef.current.add("mental-model");
      recordEvidence(lesson.id, { mentalModel: true });
      applyEvent(lesson.id, { type: "CONFIRM_MENTAL_MODEL" });
    }
    if (anchorSummary >= 0 && activeIndex >= anchorSummary && !firedRef.current.has("summary")) {
      firedRef.current.add("summary");
      recordEvidence(lesson.id, { explanationReviewed: true });
      applyEvent(lesson.id, { type: "REVIEW_EXPLANATION" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, renderedStages, lesson?.id, isLessonView]);

  // Scroll-spy: highlight the section closest to the top of the viewport. Re-runs when the
  // view flips so it re-observes freshly mounted section nodes.
  useEffect(() => {
    if (!isLessonView) return;
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.stage;
          if (!id) continue;
          if (entry.isIntersecting) visible.set(id, entry.boundingClientRect.top);
          else visible.delete(id);
        }
        let bestId: string | undefined;
        let bestTop = Infinity;
        visible.forEach((top, id) => {
          if (top < bestTop) {
            bestTop = top;
            bestId = id;
          }
        });
        if (bestId) {
          const next = bestId as StageId;
          setActiveStage((prev) => (prev === next ? prev : next));
        }
      },
      { root: null, rootMargin: "-64px 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    sectionRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [renderedStages, isLessonView]);

  // On topic change: reset to the top of the column — unless a stage scroll is queued.
  useEffect(() => {
    if (pendingStage.current) return;
    document.getElementById("lesson-content")?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [selectedTopicId]);

  // Fulfil a queued stage scroll (search into a stage) once the lesson view is active and
  // its sections have mounted. Polls for the ref so it also works after leaving a preview
  // or the resources hub (the editor section mounts late).
  useEffect(() => {
    const target = pendingStage.current;
    if (!target) return;
    pendingStage.current = null;
    let tries = 0;
    const tryScroll = () => {
      const el = sectionRefs.current.get(target);
      if (el) {
        setActiveStage(target);
        el.scrollIntoView({ block: "start" });
      } else if (tries++ < 30) {
        requestAnimationFrame(tryScroll);
      }
    };
    requestAnimationFrame(tryScroll);
  }, [selectedTopicId, resourcesOpen]);

  // Honor deep links (?topic=…) from the dashboard, review queue, and graph —
  // also on client-side navigations back into the workspace.
  useEffect(() => {
    if (initialTopicId && topicIndex.has(initialTopicId)) {
      setSelectedTopicId(initialTopicId);
      setResourcesOpen(false);
    }
  }, [initialTopicId]);

  // ⌘K / Ctrl-K toggles the command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (e.key === "Escape") {
        setFocus(false);
        setPanel(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const selectTopic = (id: string) => {
    setSelectedTopicId(id);
    setResourcesOpen(false);
    setPanel(null);
  };

  const openResources = () => {
    setResourcesOpen(true);
    setPanel(null);
  };

  const scrollToStage = (id: StageId) => {
    setActiveStage(id);
    sectionRefs.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setPanel(null);
  };

  const scrollToChapter = (chapterId: string) => {
    const chapter = renderedChapters.find((item) => item.id === chapterId);
    const firstStage = chapter?.stages[0]?.[0];
    if (!firstStage) return;
    if (chapter?.optional) {
      const container = document.getElementById(`chapter-${chapterId}`);
      const details = container?.querySelector<HTMLDetailsElement>("details.optional-depth");
      if (details) details.open = true;
      requestAnimationFrame(() => scrollToStage(firstStage));
      return;
    }
    scrollToStage(firstStage);
  };

  // From search: a stage belongs to the authored lesson, so switch into the lesson view
  // first if we're in a preview or the resources hub, queuing the target scroll.
  const goToStageFromSearch = (id: StageId) => {
    if (isLessonView && !resourcesOpen) {
      scrollToStage(id);
      return;
    }
    pendingStage.current = id;
    setResourcesOpen(false);
    if (!isLessonView) setSelectedTopicId(lessonTopicId);
  };

  const submitMastery = () => {
    if (!lesson) return;
    recordEvidence(lesson.id, { explanationReviewed: true });
    applyEvent(lesson.id, { type: "VERIFY_MASTERY", passed: true });
  };

  const completeExercise = (id: string) => {
    if (!lesson) return;
    markExerciseComplete(lesson.id, id);
    recordEvidence(lesson.id, { exercisePassed: true });
    applyEvent(lesson.id, { type: "ATTEMPT_EXERCISE", correct: true });
  };

  // Graded outcome from a prediction reveal or an editor check. A miss still marks
  // the exercise worked-through, but records no passing evidence and routes the
  // lesson's progress to needs_review via the engine ladder.
  const gradeExercise = (id: string, correct: boolean, isPrediction: boolean) => {
    if (!lesson) return;
    markExerciseComplete(lesson.id, id);
    if (correct) {
      recordEvidence(
        lesson.id,
        isPrediction ? { predictionCorrect: true, exercisePassed: true } : { exercisePassed: true },
      );
    }
    applyEvent(lesson.id, { type: "ATTEMPT_EXERCISE", correct });
  };

  const toggleProjectMilestone = (key: string) => {
    if (!lesson || !selectedModule?.project) return;
    const current = getMilestones(selectedModule.id);
    const next = current.includes(key) ? current.filter((item) => item !== key) : [...current, key];
    const projectApplied = next.length === selectedModule.project.milestones.length;
    toggleMilestone(selectedModule.id, key);
    recordEvidence(lesson.id, { projectApplied });
    if (projectApplied) applyEvent(lesson.id, { type: "APPLY_PROJECT" });
  };

  const resetCurrentLesson = () => {
    if (!lesson) return;
    const confirmed = window.confirm(
      "Reset this lesson's progress, evidence, exercises, and project milestones? Your note and bookmark will be kept.",
    );
    if (!confirmed) return;
    resetLesson(lesson.id, selectedModule?.id);
    setPrediction(undefined);
    setRevealed(false);
    firedRef.current.clear();
    setActiveStage("problem");
    sectionRefs.current.get("problem")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const registerSection = (id: StageId) => (el: HTMLElement | null) => {
    if (el) sectionRefs.current.set(id, el);
    else sectionRefs.current.delete(id);
  };

  /** Interactive widget rendered inside a stage's section (below its prose). */
  const renderWidget = (id: StageId) => {
    if (!lesson) return null;
    if (hasBespokeWidgets && id === "diagram") {
      return (
        <div className="diagram-shell">
          <FlowDiagram nodes={pipeline} onSelect={setInspectorNode} />
          <div className="diagram-inspector">
            <div className="inspect-value">
              <span>{inspectorNode.id}</span>
              <strong>{inspectorNode.label}</strong>
            </div>
            <p>{inspectorNode.detail}</p>
            <dl className="diagram-inspector-meta">
              {inspectorNode.owner && (
                <div>
                  <dt>Who runs it</dt>
                  <dd>{inspectorNode.owner}</dd>
                </div>
              )}
              {inspectorNode.source && (
                <div>
                  <dt>Official source</dt>
                  <dd>
                    <a href={inspectorNode.source.url} target="_blank" rel="noreferrer">
                      {inspectorNode.source.label}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
            <p className="invariant">
              Official-source boundary: the toolchain builds the executable; the language
              specification guarantees that the program initializes before Go invokes main.
            </p>
          </div>
        </div>
      );
    }

    if (hasBespokeWidgets && id === "experiment") {
      return (
        <div className="experiment">
          <div className="experiment-head">
            <Lightbulb size={18} />
            <div>
              <strong>Commit before reveal</strong>
              <small>Your first answer is the useful evidence.</small>
            </div>
          </div>
          <p>Which runs first?</p>
          <div className="prediction-grid" role="group" aria-label="Prediction options">
            {["imported package", "main package setup", "func main()"].map((value) => (
              <button
                className={prediction === value ? "selected" : ""}
                aria-pressed={prediction === value}
                key={value}
                onClick={() => setPrediction(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <Button
            disabled={!prediction}
            onClick={() => {
              setRevealed(true);
              const correct = prediction === "imported package";
              recordEvidence(lesson.id, { predictionCorrect: correct });
              applyEvent(lesson.id, { type: "ATTEMPT_EXERCISE", correct });
            }}
          >
            Reveal execution trace
          </Button>
          {revealed && (
            <div
              className={prediction === "imported package" ? "reveal correct" : "reveal"}
              role="status"
            >
              <strong>
                {prediction === "imported package" ? "Correct." : "Revise the model."}
              </strong>{" "}
              Imported packages are prepared first, then the main package, and finally func main().
            </div>
          )}
        </div>
      );
    }

    if (hasBespokeWidgets && id === "implementation") {
      return (
        <GoEditor
          starter={lesson.exercises.find((e) => e.type === "implementation")?.starterCode ?? ""}
          expected={lesson.exercises.find((e) => e.type === "implementation")?.expectedAnswer ?? ""}
          test={(code) => ({
            passed: code.includes("runtime.Version()"),
            output: code.includes("runtime.Version()")
              ? "buildInfo reports the runtime version"
              : "buildInfo must call runtime.Version()",
          })}
          onResult={(r) => {
            if (r.passed) {
              recordEvidence(lesson.id, { exercisePassed: true });
              applyEvent(lesson.id, { type: "ATTEMPT_EXERCISE", correct: true });
            }
          }}
        />
      );
    }

    if (id === "exercises") {
      const regular = lesson.exercises.filter((e) => e.type !== "advanced");
      const challenges = lesson.exercises.filter((e) => e.type === "advanced");
      const coreTypes = new Set(["prediction", "code-reading", "implementation"]);
      const core = regular.filter((exercise) => coreTypes.has(exercise.type));
      const extra = regular.filter((exercise) => !coreTypes.has(exercise.type));
      const lastTopic = selectedModule?.topics[selectedModule.topics.length - 1];
      const showModuleProject = lastTopic?.lessonId === lesson.id;
      return (
        <div className="exercise-stack">
          <p className="exercise-path-note">
            Start with these three. The extra exercises are useful, but they are not required on
            your first pass.
          </p>
          {core.map((exercise, i) => (
            <ExerciseCard
              key={exercise.id}
              index={i}
              exercise={exercise}
              done={completedExercises.has(exercise.id)}
              onComplete={() => completeExercise(exercise.id)}
              onOutcome={(correct) =>
                gradeExercise(exercise.id, correct, exercise.type === "prediction")
              }
            />
          ))}

          {extra.length > 0 && (
            <details className="exercise-more">
              <summary>
                More practice <span>{extra.length} optional exercises</span>
              </summary>
              <div className="exercise-more-body">
                {extra.map((exercise, i) => (
                  <ExerciseCard
                    key={exercise.id}
                    index={core.length + i}
                    exercise={exercise}
                    done={completedExercises.has(exercise.id)}
                    onComplete={() => completeExercise(exercise.id)}
                    onOutcome={(correct) =>
                      gradeExercise(exercise.id, correct, exercise.type === "prediction")
                    }
                  />
                ))}
              </div>
            </details>
          )}

          {challenges.length > 0 && (
            <details className="exercise-more challenge-block">
              <summary>
                Challenge checkpoint <span>optional deep practice</span>
              </summary>
              <div className="exercise-more-body">
                <p className="challenge-intro">
                  Push past the guided path on your own machine when you feel ready.
                </p>
                {challenges.map((exercise, i) => (
                  <ExerciseCard
                    key={exercise.id}
                    index={regular.length + i}
                    exercise={exercise}
                    done={completedExercises.has(exercise.id)}
                    onComplete={() => completeExercise(exercise.id)}
                    onOutcome={(correct) =>
                      gradeExercise(exercise.id, correct, exercise.type === "prediction")
                    }
                    variant="challenge"
                  />
                ))}
              </div>
            </details>
          )}

          {showModuleProject && selectedModule?.project && (
            <ProjectPanel
              project={selectedModule.project}
              completed={getMilestones(selectedModule.id)}
              onToggle={toggleProjectMilestone}
            />
          )}
        </div>
      );
    }

    if (id === "mastery") {
      return (
        <>
          <p className="mastery-progress">
            Evidence score <strong>{score}%</strong> ·{" "}
            {requiredMet ? "ready to submit" : "attest each required criterion below"}
          </p>
          <div className="mastery-list">
            {lesson.masteryCriteria.map((criterion) => (
              <label key={criterion.id}>
                <input
                  type="checkbox"
                  checked={Boolean(evidence.criteria[criterion.id])}
                  onChange={(e) =>
                    recordEvidence(lesson.id, { criteria: { [criterion.id]: e.target.checked } })
                  }
                />
                <span>
                  <small>
                    {criterion.kind}
                    {criterion.required ? " · required" : " · optional"}
                  </small>
                  {criterion.description}
                </span>
              </label>
            ))}
          </div>
          <div className={mastered ? "readiness mastered" : "readiness"}>
            <Check size={22} />
            <div>
              <strong>
                {mastered
                  ? "Lesson mastered."
                  : requiredMet
                    ? "Evidence complete—submit to master."
                    : "Complete the required checks to finish."}
              </strong>
              <p>
                {mastered
                  ? "Recorded locally. It will sync when you create an account."
                  : "Optional criteria can be revisited later."}
              </p>
            </div>
            <Button disabled={!requiredMet || mastered} onClick={submitMastery}>
              {mastered ? "Mastered" : "Submit mastery evidence"}
            </Button>
          </div>
        </>
      );
    }

    return null;
  };

  const renderChapterStages = (chapter: (typeof renderedChapters)[number]) => (
    <div className="chapter-stages">
      {chapter.stages.map(([id, , fallbackLabel]) => {
        const content = normalizeStage(lesson?.sections[id]);
        const chapterSubject =
          (lesson ? lessonChapterLabels[lesson.id]?.[chapter.id] : undefined) ??
          lesson?.title ??
          "this topic";
        return (
          <div
            key={id}
            id={`stage-${id}`}
            data-stage={id}
            ref={registerSection(id)}
            className="lesson-subsection"
            aria-labelledby={`stage-${id}-heading`}
          >
            <h3 id={`stage-${id}-heading`}>
              {content.title ?? `${fallbackLabel}: ${chapterSubject}`}
            </h3>
            <StageArticle content={content} />
            {renderWidget(id)}
          </div>
        );
      })}
    </div>
  );

  /** Inspectable catalog preview for a topic that has no authored lesson yet. */
  const renderPreview = (topic: TopicRef, module?: CurriculumModule) => {
    const resources = topic.resources ?? module?.resources ?? [];
    const prereqs = topic.prerequisites
      .map((id) => topicIndex.get(id))
      .filter((t): t is TopicRef => Boolean(t));
    return (
      <>
        <div className="lesson-head">
          <div>
            <div className="breadcrumbs">
              <span>{module ? `MODULE ${String(module.order).padStart(2, "0")}` : "GO"}</span>
              <ChevronRight size={12} />
              <span>PREVIEW</span>
            </div>
            <h1>{topic.title}</h1>
            <p>{topic.summary}</p>
            <div className="lesson-meta">
              <Badge className={`state-badge state-${topic.status}`}>
                {statusLabel[topic.status]}
              </Badge>
              <Badge>{topic.concepts.length} concepts</Badge>
              {topic.prerequisites.length > 0 && (
                <Badge>{topic.prerequisites.length} prerequisites</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="topic-preview">
          <section className="preview-block" id="preview-why">
            <SectionLabel>Why learn this now</SectionLabel>
            <p>{topic.whyNow}</p>
          </section>
          <section className="preview-block" id="preview-outcome">
            <SectionLabel>What you’ll be able to do</SectionLabel>
            <p>{topic.learnerOutcome}</p>
          </section>
          <section className="preview-block" id="preview-concepts">
            <SectionLabel>Concepts you’ll build</SectionLabel>
            <ul className="concept-chips">
              {topic.concepts.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </section>
          {prereqs.length > 0 && (
            <section className="preview-block" id="preview-prereqs">
              <SectionLabel>Grounded in</SectionLabel>
              <ul className="prereq-list">
                {prereqs.map((p) => (
                  <li key={p.id}>
                    <button className="prereq-link" onClick={() => selectTopic(p.id)}>
                      {p.title}
                    </button>
                    <small>{p.moduleTitle}</small>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {resources.length > 0 && (
            <section className="preview-block" id="preview-resources">
              <ResourceList items={resources} title="Resources" />
            </section>
          )}
          {module?.project && (
            <section className="preview-block" id="preview-project">
              <SectionLabel>Module project</SectionLabel>
              <strong className="module-project-title">{module.project.title}</strong>
              <p>{module.project.outcome}</p>
              <ol className="milestone-steps">
                {module.project.milestones.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ol>
            </section>
          )}
          <p className="preview-foot">
            This topic is planned — freely inspectable, but not yet masterable. Content is on the
            way.
          </p>
        </div>
      </>
    );
  };

  return (
    <div className={focus ? "go-app focus-mode" : "go-app"} data-panel={panel ?? undefined}>
      <a className="skip-link" href="#lesson-content">
        Skip to lesson
      </a>
      <header className="go-topbar">
        <button
          className="panel-trigger nav-trigger"
          aria-label="Open curriculum"
          onClick={() => setPanel("nav")}
        >
          <Menu size={18} />
        </button>
        <div className="go-brand">
          <span className="brand-mark">G</span>
          <div>
            <strong>GO RUNTIME LAB</strong>
            <small>language foundations</small>
          </div>
        </div>
        <div className="top-actions">
          <button
            className="search-trigger"
            aria-label="Search catalog"
            onClick={() => setPaletteOpen(true)}
          >
            <Search size={15} />
            <span>Search</span>
            <kbd>⌘K</kbd>
          </button>
          <button
            className="focus-toggle"
            aria-label={focus ? "Exit focus mode" : "Enter focus mode"}
            aria-pressed={focus}
            onClick={() => {
              setFocus((v) => !v);
              setPanel(null);
            }}
          >
            <Focus size={17} />
            <span className="focus-toggle-label">Exit focus</span>
          </button>
          <button
            className="panel-trigger toc-trigger"
            aria-label="Open contents"
            onClick={() => setPanel("toc")}
          >
            <ListTree size={17} />
          </button>
          <nav className="top-links" aria-label="Lab destinations">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/concepts">Concepts</Link>
            <Link href="/review">Review</Link>
          </nav>
          <a href="http://localhost:3001" className="switch-app">
            Backend Atlas <ChevronRight size={14} />
          </a>
          <div className="avatar" aria-hidden>
            MK
          </div>
        </div>
      </header>

      {/* LEFT — full course catalog: every module and topic, freely explorable */}
      <aside className="curriculum" aria-label="Curriculum" id="curriculum-panel">
        <div className="panel-close-row">
          <SectionLabel>Guided curriculum</SectionLabel>
          <button
            className="panel-close"
            aria-label="Close curriculum"
            onClick={() => setPanel(null)}
          >
            <X size={16} />
          </button>
        </div>
        <div className="curriculum-head">
          <ProgressRing value={courseCompletion} label="Course completion" />
          <p className="ring-caption">
            {completedAuthoredLessons}/{authoredLessonIds.length} authored lessons complete
          </p>
        </div>
        <button
          className={resourcesOpen ? "hub-trigger active" : "hub-trigger"}
          aria-current={resourcesOpen ? "page" : undefined}
          onClick={openResources}
        >
          <Library size={15} /> Resource library
        </button>
        <nav className="module-tree" aria-label="Course modules">
          {goCurriculum.modules.map((module) => (
            <div className="module-group" key={module.id}>
              <div className="module-group-head">
                <span className="module-index">{String(module.order).padStart(2, "0")}</span>
                <div>
                  <strong>{module.title}</strong>
                  <small>
                    {module.level} · {module.topics.length} topics
                  </small>
                </div>
              </div>
              <div className="module-topics">
                {module.topics.map((topic) => {
                  const active = topic.id === selectedTopicId;
                  const topicCompleted = Boolean(
                    topic.lessonId && completedLessons.includes(topic.lessonId),
                  );
                  return (
                    <button
                      key={topic.id}
                      className={`${active ? "topic-row active" : "topic-row"}${topicCompleted ? " completed" : ""}`}
                      data-status={topic.status}
                      aria-current={active ? "page" : undefined}
                      onClick={() => selectTopic(topic.id)}
                    >
                      <span className="topic-dot" aria-hidden />
                      <span className="topic-title">{topic.title}</span>
                      {topicCompleted && (
                        <Check size={14} className="topic-complete" aria-label="Completed" />
                      )}
                      {topic.status !== "authored" && (
                        <em className="topic-tag">{statusTag[topic.status]}</em>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* SECOND RAIL — stage outline (lesson) or topic context (preview) */}
      <aside className="page-toc-panel" id="toc-panel" aria-label="Table of contents">
        <div className="panel-close-row">
          <SectionLabel>
            {resourcesOpen ? "Categories" : isLessonView ? "On this page" : "About this topic"}
          </SectionLabel>
          <button
            className="panel-close"
            aria-label="Close contents"
            onClick={() => setPanel(null)}
          >
            <X size={16} />
          </button>
        </div>
        {resourcesOpen ? (
          <nav className="page-toc" aria-label="Resource categories">
            {presentResourceKinds.map((k) => (
              <button
                key={k}
                onClick={() =>
                  document
                    .getElementById(`hub-${k}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                <span className="toc-title">{resourceKindLabel[k] ?? k}</span>
              </button>
            ))}
            <button
              onClick={() =>
                document
                  .getElementById("hub-modules")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            >
              <span className="toc-title">By module</span>
            </button>
          </nav>
        ) : isLessonView ? (
          <nav className="page-toc" aria-label="Lesson chapters">
            {renderedChapters.map((chapter) => (
              <button
                key={chapter.id}
                aria-current={activeChapterId === chapter.id ? "step" : undefined}
                className={activeChapterId === chapter.id ? "active" : ""}
                onClick={() => scrollToChapter(chapter.id)}
              >
                <span className="toc-number">{chapter.number}</span>
                <span className="toc-title">
                  {chapter.label}
                  {chapter.optional && <small>optional</small>}
                </span>
              </button>
            ))}
          </nav>
        ) : selectedTopic ? (
          <div className="topic-aside">
            <p className={`topic-aside-status state-${selectedTopic.status}`}>
              {statusLabel[selectedTopic.status]}
            </p>
            {selectedTopic.prerequisites.length > 0 && (
              <>
                <SectionLabel>Prerequisites</SectionLabel>
                <ul className="aside-prereqs">
                  {selectedTopic.prerequisites
                    .map((id) => topicIndex.get(id))
                    .filter((t): t is TopicRef => Boolean(t))
                    .map((p) => (
                      <li key={p.id}>
                        <button onClick={() => selectTopic(p.id)}>{p.title}</button>
                      </li>
                    ))}
                </ul>
              </>
            )}
          </div>
        ) : null}
      </aside>

      {/* CENTER — resources hub, the authored lesson (scroll-spied), or a topic preview */}
      <main id="lesson-content" className="concept-workspace">
        {resourcesOpen ? (
          <ResourcesHub />
        ) : lesson ? (
          <>
            <div className="reading-progress" aria-hidden>
              <i
                style={{
                  width: `${((Math.max(activeChapterIndex, 0) + 1) / renderedChapters.length) * 100}%`,
                }}
              />
            </div>
            <div className="lesson-head">
              <div>
                <div className="breadcrumbs">
                  <span>GO.{String(selectedModule?.order ?? 0).padStart(2, "0")}</span>
                  <ChevronRight size={12} />
                  <span>{(selectedModule?.level ?? "foundation").toUpperCase()}</span>
                </div>
                <h1>{lesson.title}</h1>
                <p>{lesson.description}</p>
                <div className="lesson-meta">
                  <Badge>
                    <Clock3 size={11} /> {lesson.estimatedMinutes} min
                  </Badge>
                  <Badge>{lesson.difficulty}</Badge>
                  <Badge>{lesson.concepts.length} concepts</Badge>
                  <Badge className={`state-badge state-${state}`}>{progressLabels[state]}</Badge>
                  <Badge>Mastery evidence {score}%</Badge>
                  <Badge>
                    {coreChapterCount} core chapters{hasOptionalChapter ? " + optional depth" : ""}
                  </Badge>
                </div>
              </div>
              <div className="lesson-actions">
                <button
                  aria-label="Bookmark lesson"
                  aria-pressed={bookmarks.includes(lesson.id)}
                  className={bookmarks.includes(lesson.id) ? "active" : ""}
                  onClick={() => toggleBookmark(lesson.id)}
                >
                  <Bookmark size={16} />
                </button>
                <Button onClick={() => setFocus((v) => !v)}>
                  <Focus size={15} /> {focus ? "Exit focus" : "Focus"}
                </Button>
                <Button
                  className={completed ? "completion-toggle completed" : "completion-toggle"}
                  aria-pressed={completed}
                  onClick={() => toggleLessonComplete(lesson.id)}
                >
                  <Check size={15} /> {completed ? "Completed" : "Mark complete"}
                </Button>
                <button className="reset-progress" onClick={resetCurrentLesson}>
                  <RotateCcw size={14} /> Reset progress
                </button>
              </div>
            </div>

            {renderedChapters.map((chapter) => (
              <section
                key={chapter.id}
                id={`chapter-${chapter.id}`}
                className={chapter.optional ? "stage-content optional-chapter" : "stage-content"}
                aria-labelledby={`chapter-${chapter.id}-heading`}
              >
                <div className="stage-number" aria-hidden>
                  {chapter.number}
                </div>
                <SectionLabel>
                  {chapter.optional ? "Optional depth" : `Chapter ${chapter.number}`}
                </SectionLabel>
                <h2 id={`chapter-${chapter.id}-heading`}>{chapter.label}</h2>
                <p className="chapter-description">{chapter.description}</p>
                {chapter.id === "big-picture" && frontendBridge[lesson.id] && (
                  <aside className="frontend-bridge">
                    <strong>From TypeScript</strong>
                    <p>{frontendBridge[lesson.id]}</p>
                  </aside>
                )}

                {chapter.optional ? (
                  <details className="optional-depth">
                    <summary>
                      <span>Open optional depth</span>
                      <small>Trade-offs for a later pass</small>
                    </summary>
                    {renderChapterStages(chapter)}
                  </details>
                ) : (
                  renderChapterStages(chapter)
                )}
              </section>
            ))}

            {/* page-level extras pinned to the very bottom of the page */}
            <section className="page-extras">
              <div className="page-note">
                <SectionLabel>Your note</SectionLabel>
                <textarea
                  aria-label="Lesson note"
                  value={notes[lesson.id] ?? ""}
                  onChange={(e) => setNote(lesson.id, e.target.value)}
                  placeholder="Capture a question or invariant…"
                />
              </div>
              <ReferenceList items={lesson.references} />
            </section>
          </>
        ) : selectedTopic ? (
          renderPreview(selectedTopic, selectedModule)
        ) : null}
      </main>

      {panel && <div className="panel-backdrop" onClick={() => setPanel(null)} aria-hidden />}

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        stages={renderedStages}
        onTopic={selectTopic}
        onStage={goToStageFromSearch}
      />
    </div>
  );
}
