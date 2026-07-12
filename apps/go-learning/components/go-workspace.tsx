"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  Check,
  ChevronRight,
  CircleDot,
  Clock3,
  Focus,
  Lightbulb,
  ListTree,
  Menu,
  TerminalSquare,
  X,
} from "lucide-react";
import { GoEditor } from "@platform/code-editor";
import { FlowDiagram, type DiagramNode } from "@platform/diagrams";
import { LearningProvider, useLearning } from "@platform/learning-engine/react";
import { normalizeStage, type Lesson } from "@platform/content-schema";
import { Badge, Button, ProgressRing, ReferenceList, SectionLabel, StageArticle } from "@platform/ui";

const stageMeta = [
  ["problem", "01", "The problem"],
  ["naive", "02", "Naive model"],
  ["failure", "03", "Failure"],
  ["intuition", "04", "Intuition"],
  ["mental-model", "05", "Mental model"],
  ["mechanics", "06", "Mechanics"],
  ["diagram", "07", "Runtime trace"],
  ["implementation", "08", "Implementation"],
  ["experiment", "09", "Experiment"],
  ["failure-cases", "10", "Failure cases"],
  ["trade-offs", "11", "Trade-offs"],
  ["design", "12", "Design"],
  ["ledgerflow", "13", "LedgerFlow"],
  ["exercises", "14", "Exercises"],
  ["mastery", "15", "Verify mastery"],
  ["summary", "16", "Summary"],
] as const;
type StageId = (typeof stageMeta)[number][0];

const pipeline: DiagramNode[] = [
  { id: "resolve", label: "resolve", detail: "Build the package dependency graph and select module versions.", x: 20, y: 90 },
  { id: "compile", label: "compile", detail: "Type-check packages and emit object data.", x: 175, y: 90 },
  { id: "link", label: "link", detail: "Resolve reachable symbols into an executable image.", x: 330, y: 90 },
  { id: "load", label: "OS load", detail: "Map executable segments and transfer control to its entry point.", x: 485, y: 90 },
  { id: "runtime", label: "runtime", detail: "Prepare scheduler, allocator, GC, package init, then main.", x: 640, y: 90 },
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

export function GoWorkspace(props: { lesson: Lesson; moduleTitle: string }) {
  return (
    <LearningProvider storageKey="go-runtime-lab">
      <Workspace {...props} />
    </LearningProvider>
  );
}

function Workspace({ lesson, moduleTitle }: { lesson: Lesson; moduleTitle: string }) {
  const {
    progress,
    stages,
    bookmarks,
    notes,
    hydrated,
    setStage,
    setNote,
    toggleBookmark,
    applyEvent,
    recordEvidence,
    getEvidence,
    masteryScoreFor,
  } = useLearning();

  const [stage, setStageLocal] = useState<StageId>("problem");
  const [inspectorNode, setInspectorNode] = useState(pipeline[0]!);
  const [focus, setFocus] = useState(false);
  const [prediction, setPrediction] = useState<string>();
  const [revealed, setRevealed] = useState(false);
  const [panel, setPanel] = useState<"nav" | "toc" | null>(null);

  const restored = useRef(false);
  useEffect(() => {
    if (!hydrated || restored.current) return;
    restored.current = true;
    const saved = stages[lesson.id];
    if (saved && stageMeta.some(([id]) => id === saved)) setStageLocal(saved as StageId);
  }, [hydrated, stages, lesson.id]);

  const state = progress[lesson.id] ?? "not_started";
  const evidence = getEvidence(lesson.id);
  const score = masteryScoreFor(lesson.id);
  const currentIndex = stageMeta.findIndex(([id]) => id === stage);
  const current = stageMeta[currentIndex]!;
  const content = useMemo(() => normalizeStage(lesson.sections[stage]), [lesson, stage]);

  const requiredCriteria = lesson.masteryCriteria.filter((c) => c.required);
  const requiredMet = requiredCriteria.every((c) => evidence.criteria[c.id]);
  const mastered = state === "mastered";

  const goToStage = (id: StageId) => {
    setStageLocal(id);
    setStage(lesson.id, id);
    applyEvent(lesson.id, { type: "OPEN" });
    setPanel(null);
  };

  const next = () => {
    const leaving = stage;
    const target = stageMeta[Math.min(currentIndex + 1, stageMeta.length - 1)]![0];
    if (leaving === "mental-model") {
      recordEvidence(lesson.id, { mentalModel: true });
      applyEvent(lesson.id, { type: "CONFIRM_MENTAL_MODEL" });
    }
    if (target === "summary") {
      recordEvidence(lesson.id, { explanationReviewed: true });
      applyEvent(lesson.id, { type: "REVIEW_EXPLANATION" });
    }
    goToStage(target);
  };

  const submitMastery = () => {
    recordEvidence(lesson.id, { explanationReviewed: true });
    applyEvent(lesson.id, { type: "VERIFY_MASTERY", passed: true });
  };

  return (
    <div className={focus ? "go-app focus-mode" : "go-app"} data-panel={panel ?? undefined}>
      <a className="skip-link" href="#lesson-content">
        Skip to lesson
      </a>
      <header className="go-topbar">
        <button className="panel-trigger nav-trigger" aria-label="Open curriculum" onClick={() => setPanel("nav")}>
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
          <button aria-label="Toggle focus mode" aria-pressed={focus} onClick={() => setFocus((v) => !v)}>
            <Focus size={17} />
          </button>
          <button className="panel-trigger toc-trigger" aria-label="Open contents" onClick={() => setPanel("toc")}>
            <ListTree size={17} />
          </button>
          <a href="http://localhost:3001" className="switch-app">
            Backend Atlas <ChevronRight size={14} />
          </a>
          <div className="avatar" aria-hidden>
            MK
          </div>
        </div>
      </header>

      {/* LEFT — course/module curriculum */}
      <aside className="curriculum" aria-label="Curriculum" id="curriculum-panel">
        <div className="panel-close-row">
          <SectionLabel>Guided curriculum</SectionLabel>
          <button className="panel-close" aria-label="Close curriculum" onClick={() => setPanel(null)}>
            <X size={16} />
          </button>
        </div>
        <div className="curriculum-head">
          <ProgressRing value={score} label="Evidence score" />
          <p className="ring-caption">Mastery evidence collected</p>
        </div>
        <p className="module-kicker">Module 00</p>
        <h2>{moduleTitle}</h2>
        <div className="lesson-row active">
          <span className="lesson-status">
            <CircleDot size={15} />
          </span>
          <div>
            <strong>{lesson.title}</strong>
            <small>
              16 stages · {lesson.estimatedMinutes} min · {progressLabels[state]}
            </small>
          </div>
        </div>
        <div className="module-list">
          <p>
            <span>01</span> Values &amp; execution <em>planned</em>
          </p>
          <p>
            <span>02</span> Memory &amp; data <em>planned</em>
          </p>
          <p>
            <span>03</span> Types &amp; abstraction <em>planned</em>
          </p>
        </div>
        <div className="project-link">
          <TerminalSquare size={18} />
          <div>
            <small>Module project</small>
            <strong>Execution inspector</strong>
          </div>
          <span>0/4</span>
        </div>
      </aside>

      {/* CENTER — the current page */}
      <main id="lesson-content" className="concept-workspace">
        <div className="lesson-head">
          <div>
            <div className="breadcrumbs">
              <span>GO.00</span>
              <ChevronRight size={12} />
              <span>FOUNDATION</span>
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
            <Button onClick={() => setFocus(true)}>
              <Focus size={15} /> Focus
            </Button>
          </div>
        </div>

        <article className="stage-content">
          <div className="stage-number" aria-hidden>
            {current[1]}
          </div>
          <SectionLabel>{current[2]}</SectionLabel>
          <h2>{stage === "mental-model" ? "Three clocks, one executable" : current[2]}</h2>

          <StageArticle content={content} />

          {stage === "diagram" && (
            <div className="diagram-shell">
              <FlowDiagram nodes={pipeline} onSelect={setInspectorNode} />
              <div className="diagram-legend">
                <span>
                  <i className="source" />
                  build-time artifact
                </span>
                <span>
                  <i className="runtime" />
                  runtime state
                </span>
              </div>
              <div className="diagram-inspector">
                <div className="inspect-value">
                  <span>{inspectorNode.id}</span>
                  <strong>{inspectorNode.label}</strong>
                </div>
                <p>{inspectorNode.detail}</p>
                <p className="invariant">
                  Invariant: every imported package is initialized exactly once before the package that imports it.
                </p>
              </div>
            </div>
          )}

          {stage === "experiment" && (
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
                {["main package variable", "dependency init", "main.init", "main.main"].map((value) => (
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
                  const correct = prediction === "dependency init";
                  recordEvidence(lesson.id, { predictionCorrect: correct });
                  applyEvent(lesson.id, { type: "ATTEMPT_EXERCISE", correct });
                }}
              >
                Reveal execution trace
              </Button>
              {revealed && (
                <div className={prediction === "dependency init" ? "reveal correct" : "reveal"} role="status">
                  <strong>{prediction === "dependency init" ? "Correct." : "Revise the model."}</strong>{" "}
                  Dependencies initialize before the importing package’s variables and init functions.
                </div>
              )}
            </div>
          )}

          {stage === "implementation" && (
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
          )}

          {stage === "exercises" && (
            <div className="exercise-list">
              {lesson.exercises.map((exercise, index) => (
                <div className="exercise-row" key={exercise.id}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <small>{exercise.type}</small>
                    <strong>{exercise.prompt}</strong>
                    {exercise.hints.length > 0 && <p className="exercise-hint">Hint: {exercise.hints[0]}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {stage === "mastery" && (
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
                      onChange={(e) => recordEvidence(lesson.id, { criteria: { [criterion.id]: e.target.checked } })}
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
            </>
          )}

          {stage === "summary" && (
            <div className={mastered ? "readiness mastered" : "readiness"}>
              <Check size={22} />
              <div>
                <strong>
                  {mastered
                    ? "Lesson mastered."
                    : requiredMet
                      ? "Evidence complete—submit to master."
                      : "Explanation reviewed—not yet mastered."}
                </strong>
                <p>
                  {mastered
                    ? "Recorded locally. It will sync when you create an account."
                    : "Complete the required mastery criteria before mastery unlocks."}
                </p>
              </div>
              <Button disabled={!requiredMet || mastered} onClick={submitMastery}>
                {mastered ? "Mastered" : "Submit mastery evidence"}
              </Button>
            </div>
          )}

          <footer className="stage-footer">
            <span>
              {currentIndex + 1} of {stageMeta.length}
            </span>
            <div className="stage-progress" aria-hidden>
              <i style={{ width: `${((currentIndex + 1) / stageMeta.length) * 100}%` }} />
            </div>
            <Button onClick={next} disabled={currentIndex === stageMeta.length - 1}>
              Continue <ChevronRight size={15} />
            </Button>
          </footer>
        </article>

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
      </main>

      {/* RIGHT — table of contents (outline) for the current page */}
      <aside className="page-toc-panel" id="toc-panel" aria-label="Table of contents">
        <div className="panel-close-row">
          <SectionLabel>On this page</SectionLabel>
          <button className="panel-close" aria-label="Close contents" onClick={() => setPanel(null)}>
            <X size={16} />
          </button>
        </div>
        <nav className="page-toc" aria-label="Lesson stages">
          {stageMeta.map(([id, number, label]) => (
            <button
              key={id}
              aria-current={stage === id ? "step" : undefined}
              className={stage === id ? "active" : ""}
              onClick={() => goToStage(id)}
            >
              <span className="toc-number">{number}</span>
              <span className="toc-title">{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {panel && <div className="panel-backdrop" onClick={() => setPanel(null)} aria-hidden />}
    </div>
  );
}
