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

/** Stages that always render because they carry an interactive widget, even with no prose. */
const widgetStages = new Set<StageId>([
  "diagram",
  "experiment",
  "implementation",
  "exercises",
  "mastery",
  "summary",
]);

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

  // Only render stages that have authored content or an interactive widget — empty
  // prose stages (e.g. an unauthored mental-model / failure-cases) are skipped so the
  // continuous page never shows a bare heading. Data-driven: authored content appears
  // automatically.
  const renderedStages = useMemo(
    () =>
      stageMeta.filter(([id]) => {
        if (widgetStages.has(id)) return true;
        const c = normalizeStage(lesson.sections[id]);
        return Boolean(c.body?.trim() || c.blocks?.length || c.example || c.scenario || c.keyPoints?.length);
      }),
    [lesson],
  );

  const [activeStage, setActiveStage] = useState<StageId>(renderedStages[0]?.[0] ?? "problem");
  const [inspectorNode, setInspectorNode] = useState(pipeline[0]!);
  const [focus, setFocus] = useState(false);
  const [prediction, setPrediction] = useState<string>();
  const [revealed, setRevealed] = useState(false);
  const [panel, setPanel] = useState<"nav" | "toc" | null>(null);

  const sectionRefs = useRef(new Map<StageId, HTMLElement>());
  const restored = useRef(false);
  const firedRef = useRef(new Set<string>());

  const state = progress[lesson.id] ?? "not_started";
  const evidence = getEvidence(lesson.id);
  const score = masteryScoreFor(lesson.id);
  const activeIndex = renderedStages.findIndex(([id]) => id === activeStage);

  const requiredCriteria = lesson.masteryCriteria.filter((c) => c.required);
  const requiredMet = requiredCriteria.every((c) => evidence.criteria[c.id]);
  const mastered = state === "mastered";

  // Opening the lesson counts as engagement (not_started -> in_progress).
  useEffect(() => {
    if (hydrated) applyEvent(lesson.id, { type: "OPEN" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, lesson.id]);

  // Restore the last-viewed section on reload by scrolling to it.
  useEffect(() => {
    if (!hydrated || restored.current) return;
    restored.current = true;
    const saved = stages[lesson.id];
    if (saved && renderedStages.some(([id]) => id === saved)) {
      setActiveStage(saved as StageId);
      requestAnimationFrame(() => sectionRefs.current.get(saved as StageId)?.scrollIntoView({ block: "start" }));
    }
  }, [hydrated, stages, lesson.id, renderedStages]);

  // Persist the active section as the learner scrolls (the engine debounces the write).
  useEffect(() => {
    if (hydrated) setStage(lesson.id, activeStage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStage, hydrated, lesson.id]);

  // Evidence re-homed from the old "Continue" button onto scroll depth: reaching the
  // runtime-trace section attests the mental model; reaching the summary attests review.
  useEffect(() => {
    const mentalIdx = renderedStages.findIndex(([id]) => id === "mental-model");
    const anchorMental = mentalIdx >= 0 ? mentalIdx : renderedStages.findIndex(([id]) => id === "diagram");
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
  }, [activeIndex, renderedStages, lesson.id]);

  // Scroll-spy: highlight the section closest to the top of the viewport.
  useEffect(() => {
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
  }, [renderedStages]);

  const scrollToStage = (id: StageId) => {
    setActiveStage(id);
    sectionRefs.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setPanel(null);
  };

  const submitMastery = () => {
    recordEvidence(lesson.id, { explanationReviewed: true });
    applyEvent(lesson.id, { type: "VERIFY_MASTERY", passed: true });
  };

  const registerSection = (id: StageId) => (el: HTMLElement | null) => {
    if (el) sectionRefs.current.set(id, el);
    else sectionRefs.current.delete(id);
  };

  /** Interactive widget rendered inside a stage's section (below its prose). */
  const renderWidget = (id: StageId) => {
    if (id === "diagram") {
      return (
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
      );
    }

    if (id === "experiment") {
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
      );
    }

    if (id === "implementation") {
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
      return (
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
      );
    }

    if (id === "summary") {
      return (
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
      );
    }

    return null;
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

      {/* CENTER — one continuous, scroll-spied page of all stages */}
      <main id="lesson-content" className="concept-workspace">
        <div className="reading-progress" aria-hidden>
          <i style={{ width: `${((Math.max(activeIndex, 0) + 1) / renderedStages.length) * 100}%` }} />
        </div>
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

        {renderedStages.map(([id, number, label]) => (
          <section
            key={id}
            id={`stage-${id}`}
            data-stage={id}
            ref={registerSection(id)}
            className="stage-content"
            aria-labelledby={`stage-${id}-heading`}
          >
            <div className="stage-number" aria-hidden>
              {number}
            </div>
            <SectionLabel>{label}</SectionLabel>
            <h2 id={`stage-${id}-heading`}>{label}</h2>

            <StageArticle content={normalizeStage(lesson.sections[id])} />

            {renderWidget(id)}
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
      </main>

      {/* RIGHT — table of contents (outline) driven by scroll position */}
      <aside className="page-toc-panel" id="toc-panel" aria-label="Table of contents">
        <div className="panel-close-row">
          <SectionLabel>On this page</SectionLabel>
          <button className="panel-close" aria-label="Close contents" onClick={() => setPanel(null)}>
            <X size={16} />
          </button>
        </div>
        <nav className="page-toc" aria-label="Lesson stages">
          {renderedStages.map(([id, number, label]) => (
            <button
              key={id}
              aria-current={activeStage === id ? "step" : undefined}
              className={activeStage === id ? "active" : ""}
              onClick={() => scrollToStage(id)}
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
