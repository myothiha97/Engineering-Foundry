"use client";
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
import { allTopics, goCurriculum, goResources, type CurriculumModule, type TopicRef } from "@platform/curriculum";

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

/** One problem the learner works: progressive hints, an optional answer reveal, self-attest. */
function ExerciseCard({
  index,
  exercise,
  done,
  onComplete,
  variant,
}: {
  index: number;
  exercise: Exercise;
  done: boolean;
  onComplete: () => void;
  variant?: "challenge";
}) {
  const [hintsShown, setHintsShown] = useState(0);
  const [answerShown, setAnswerShown] = useState(false);
  const hasMoreHints = hintsShown < exercise.hints.length;

  return (
    <div className={done ? "exercise-card done" : "exercise-card"} data-variant={variant}>
      <div className="exercise-card-head">
        <span className="exercise-num">{String(index + 1).padStart(2, "0")}</span>
        <span className="exercise-type">{exerciseTypeLabel[exercise.type] ?? exercise.type}</span>
        {done && <Check size={15} className="exercise-check" />}
      </div>
      <p className="exercise-prompt">{exercise.prompt}</p>
      {exercise.starterCode && (
        <pre className="exercise-code">
          <code>{exercise.starterCode}</code>
        </pre>
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
      <div className="exercise-actions">
        {hasMoreHints && (
          <button className="ghost-btn" onClick={() => setHintsShown((n) => n + 1)}>
            {hintsShown === 0 ? "Show hint" : "Next hint"}
          </button>
        )}
        {exercise.expectedAnswer && !answerShown && (
          <button className="ghost-btn" onClick={() => setAnswerShown(true)}>
            Reveal answer
          </button>
        )}
        {!done && (
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
              <input type="checkbox" checked={completed.includes(String(i))} onChange={() => onToggle(String(i))} />
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

const resourceKindOrder = ["playground", "doc", "article", "repo", "video", "course", "book", "tool"];
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
            Curated documentation, repositories, and videos for learning Go end to end — plus the references attached
            to each module.
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

export function GoWorkspace(props: { lesson: Lesson; moduleTitle: string }) {
  return (
    <LearningProvider storageKey="go-runtime-lab">
      <Workspace {...props} />
    </LearningProvider>
  );
}

function Workspace({ lesson }: { lesson: Lesson; moduleTitle: string }) {
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
    getMilestones,
    toggleMilestone,
    masteryScoreFor,
  } = useLearning();

  // The catalog topic that maps to the one authored lesson — the default selection.
  const lessonTopicId = useMemo(() => {
    for (const m of goCurriculum.modules) for (const t of m.topics) if (t.lessonId === lesson.id) return t.id;
    return goCurriculum.modules[0]?.topics[0]?.id ?? "";
  }, [lesson.id]);

  const [selectedTopicId, setSelectedTopicId] = useState(lessonTopicId);
  const [activeStage, setActiveStage] = useState<StageId>("problem");
  const [inspectorNode, setInspectorNode] = useState(pipeline[0]!);
  const [focus, setFocus] = useState(false);
  const [prediction, setPrediction] = useState<string>();
  const [revealed, setRevealed] = useState(false);
  const [panel, setPanel] = useState<"nav" | "toc" | null>(null);
  const [doneExercises, setDoneExercises] = useState(new Set<string>());
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  const sectionRefs = useRef(new Map<StageId, HTMLElement>());
  const restored = useRef(false);
  const firedRef = useRef(new Set<string>());
  const pendingStage = useRef<StageId | null>(null);

  const selectedTopic = topicIndex.get(selectedTopicId);
  const selectedModule = goCurriculum.modules.find((m) => m.id === selectedTopic?.moduleId);
  const isLessonView = Boolean(selectedTopic?.lessonId && selectedTopic.lessonId === lesson.id);

  // Only render stages that have authored content or an interactive widget — empty prose
  // stages are skipped so the continuous page never shows a bare heading (data-driven).
  const renderedStages = useMemo(
    () =>
      stageMeta.filter(([id]) => {
        if (widgetStages.has(id)) return true;
        const c = normalizeStage(lesson.sections[id]);
        return Boolean(c.body?.trim() || c.blocks?.length || c.example || c.scenario || c.keyPoints?.length);
      }),
    [lesson],
  );

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
    if (!hydrated || restored.current || !isLessonView) return;
    restored.current = true;
    const saved = stages[lesson.id];
    if (saved && renderedStages.some(([id]) => id === saved)) {
      setActiveStage(saved as StageId);
      requestAnimationFrame(() => sectionRefs.current.get(saved as StageId)?.scrollIntoView({ block: "start" }));
    }
  }, [hydrated, stages, lesson.id, renderedStages, isLessonView]);

  // Persist the active section as the learner scrolls (the engine debounces the write).
  useEffect(() => {
    if (hydrated && isLessonView) setStage(lesson.id, activeStage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStage, hydrated, lesson.id, isLessonView]);

  // Evidence re-homed from the old "Continue" button onto scroll depth: reaching the
  // mental-model section attests the model; reaching the summary attests review.
  useEffect(() => {
    if (!isLessonView) return;
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
  }, [activeIndex, renderedStages, lesson.id, isLessonView]);

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

  // ⌘K / Ctrl-K toggles the command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
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
    recordEvidence(lesson.id, { explanationReviewed: true });
    applyEvent(lesson.id, { type: "VERIFY_MASTERY", passed: true });
  };

  const completeExercise = (id: string) => {
    setDoneExercises((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    recordEvidence(lesson.id, { exercisePassed: true });
    applyEvent(lesson.id, { type: "ATTEMPT_EXERCISE", correct: true });
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
      const regular = lesson.exercises.filter((e) => e.type !== "advanced");
      const challenges = lesson.exercises.filter((e) => e.type === "advanced");
      return (
        <div className="exercise-stack">
          {regular.map((exercise, i) => (
            <ExerciseCard
              key={exercise.id}
              index={i}
              exercise={exercise}
              done={doneExercises.has(exercise.id)}
              onComplete={() => completeExercise(exercise.id)}
            />
          ))}

          {challenges.length > 0 && (
            <div className="challenge-block">
              <SectionLabel>Challenge checkpoint</SectionLabel>
              <p className="challenge-intro">Between sessions — push past the guided path on your own machine.</p>
              {challenges.map((exercise, i) => (
                <ExerciseCard
                  key={exercise.id}
                  index={regular.length + i}
                  exercise={exercise}
                  done={doneExercises.has(exercise.id)}
                  onComplete={() => completeExercise(exercise.id)}
                  variant="challenge"
                />
              ))}
            </div>
          )}

          {selectedModule?.project && (
            <ProjectPanel
              project={selectedModule.project}
              completed={getMilestones(selectedModule.id)}
              onToggle={(key) => toggleMilestone(selectedModule.id, key)}
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

  /** Inspectable catalog preview for a topic that has no authored lesson yet. */
  const renderPreview = (topic: TopicRef, module?: CurriculumModule) => {
    const resources = topic.resources ?? module?.resources ?? [];
    const prereqs = topic.prerequisites.map((id) => topicIndex.get(id)).filter((t): t is TopicRef => Boolean(t));
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
              <Badge className={`state-badge state-${topic.status}`}>{statusLabel[topic.status]}</Badge>
              <Badge>{topic.concepts.length} concepts</Badge>
              {topic.prerequisites.length > 0 && <Badge>{topic.prerequisites.length} prerequisites</Badge>}
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
          <section className="preview-block" id="preview-ledgerflow">
            <SectionLabel>Applied to LedgerFlow</SectionLabel>
            <p>{topic.ledgerFlowApplication}</p>
          </section>
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
            This topic is planned — freely inspectable, but not yet masterable. Content is on the way.
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
          <button className="search-trigger" aria-label="Search catalog" onClick={() => setPaletteOpen(true)}>
            <Search size={15} />
            <span>Search</span>
            <kbd>⌘K</kbd>
          </button>
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

      {/* LEFT — full course catalog: every module and topic, freely explorable */}
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
                  return (
                    <button
                      key={topic.id}
                      className={active ? "topic-row active" : "topic-row"}
                      data-status={topic.status}
                      aria-current={active ? "page" : undefined}
                      onClick={() => selectTopic(topic.id)}
                    >
                      <span className="topic-dot" aria-hidden />
                      <span className="topic-title">{topic.title}</span>
                      {topic.status !== "authored" && <em className="topic-tag">{statusTag[topic.status]}</em>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* CENTER — resources hub, the authored lesson (scroll-spied), or a topic preview */}
      <main id="lesson-content" className="concept-workspace">
        {resourcesOpen ? (
          <ResourcesHub />
        ) : isLessonView ? (
          <>
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
          </>
        ) : selectedTopic ? (
          renderPreview(selectedTopic, selectedModule)
        ) : null}
      </main>

      {/* RIGHT — stage outline (lesson) or topic context (preview) */}
      <aside className="page-toc-panel" id="toc-panel" aria-label="Table of contents">
        <div className="panel-close-row">
          <SectionLabel>
            {resourcesOpen ? "Categories" : isLessonView ? "On this page" : "About this topic"}
          </SectionLabel>
          <button className="panel-close" aria-label="Close contents" onClick={() => setPanel(null)}>
            <X size={16} />
          </button>
        </div>
        {resourcesOpen ? (
          <nav className="page-toc" aria-label="Resource categories">
            {presentResourceKinds.map((k) => (
              <button
                key={k}
                onClick={() =>
                  document.getElementById(`hub-${k}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                <span className="toc-title">{resourceKindLabel[k] ?? k}</span>
              </button>
            ))}
            <button
              onClick={() =>
                document.getElementById("hub-modules")?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            >
              <span className="toc-title">By module</span>
            </button>
          </nav>
        ) : isLessonView ? (
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
        ) : selectedTopic ? (
          <div className="topic-aside">
            <p className={`topic-aside-status state-${selectedTopic.status}`}>{statusLabel[selectedTopic.status]}</p>
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
