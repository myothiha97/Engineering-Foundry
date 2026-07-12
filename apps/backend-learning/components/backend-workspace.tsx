"use client";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Bookmark,
  Boxes,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  Compass,
  Focus,
  GitBranch,
  Layers3,
  Network,
  Moon,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Sun,
} from "lucide-react";
import { normalizeStage, type Lesson } from "@platform/content-schema";
import { LearningProvider, useLearning } from "@platform/learning-engine/react";
import { Badge, Button, SectionLabel } from "@platform/ui";

const lifecycle = [
  {
    id: "starting",
    title: "Starting",
    detail: "Parse config and acquire required resources.",
    responsibility: "process",
  },
  {
    id: "ready",
    title: "Ready",
    detail: "Promise that this instance can accept useful work.",
    responsibility: "health",
  },
  {
    id: "serving",
    title: "Serving",
    detail: "Accept connections and bound each request.",
    responsibility: "socket",
  },
  {
    id: "draining",
    title: "Draining",
    detail: "Withdraw readiness, stop accepts, finish in-flight work.",
    responsibility: "signal",
  },
  {
    id: "stopped",
    title: "Stopped",
    detail: "Release descriptors and exit with known status.",
    responsibility: "os",
  },
] as const;
const learnSections = [
  "problem",
  "intuition",
  "mental-model",
  "mechanics",
  "diagram",
  "experiment",
  "failure-cases",
  "trade-offs",
  "ledgerflow",
  "exercises",
  "mastery",
  "summary",
] as const;

export function BackendWorkspace(props: { lesson: Lesson; moduleTitle: string }) {
  return (
    <LearningProvider storageKey="backend-systems-atlas">
      <Workspace {...props} />
    </LearningProvider>
  );
}
function Workspace({ lesson, moduleTitle }: { lesson: Lesson; moduleTitle: string }) {
  const [mode, setMode] = useState<"learn" | "architecture" | "failure" | "tradeoffs">("learn");
  const [selected, setSelected] = useState<(typeof lifecycle)[number]>(lifecycle[0]);
  const [failureStep, setFailureStep] = useState(0);
  const [tradeoff, setTradeoff] = useState<"short" | "long" | null>(null);
  const [focus, setFocus] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const stored = window.localStorage.getItem("atlas-theme");
    const next = stored === "light" || stored === "dark" ? stored : "dark";
    setTheme(next);
    document.documentElement.dataset.atlasTheme = next;
  }, []);
  const { progress, bookmarks, notes, setProgress, toggleBookmark, setNote } = useLearning();
  const mastered = progress[lesson.id] === "mastered";
  return (
    <div className={focus ? `atlas focus theme-${theme}` : `atlas theme-${theme}`}>
      <a className="skip-link" href="#atlas-main">
        Skip to workspace
      </a>
      <header className="atlas-top">
        <div className="atlas-brand">
          <div className="atlas-symbol">
            <span />
            <span />
            <span />
          </div>
          <strong>
            BACKEND
            <br />
            SYSTEMS ATLAS
          </strong>
        </div>
        <nav aria-label="Learning modes">
          <button className={mode === "learn" ? "active" : ""} onClick={() => setMode("learn")}>
            <BookOpen size={14} />
            Learn
          </button>
          <button
            className={mode === "architecture" ? "active" : ""}
            onClick={() => setMode("architecture")}
          >
            <GitBranch size={14} />
            Architecture
          </button>
          <button className={mode === "failure" ? "active" : ""} onClick={() => setMode("failure")}>
            <ShieldAlert size={14} />
            Failure lab
          </button>
          <button
            className={mode === "tradeoffs" ? "active" : ""}
            onClick={() => setMode("tradeoffs")}
          >
            <Layers3 size={14} />
            Trade-offs
          </button>
        </nav>
        <div className="atlas-actions">
          <button aria-label="Search">
            <Search size={16} />
          </button>
          <button
            className="theme-toggle"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            onClick={() => {
              const next = theme === "dark" ? "light" : "dark";
              setTheme(next);
              window.localStorage.setItem("atlas-theme", next);
              document.documentElement.dataset.atlasTheme = next;
            }}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button aria-label="Focus mode" onClick={() => setFocus((v) => !v)}>
            <Focus size={16} />
          </button>
          <a href="http://localhost:3000">
            Go Lab <ArrowRight size={13} />
          </a>
          <div className="atlas-avatar">MK</div>
        </div>
      </header>
      <aside className="atlas-side">
        <div className="course-state">
          <SectionLabel>Current expedition</SectionLabel>
          <h2>Backend foundations</h2>
          <div className="course-progress">
            <i>
              <span style={{ height: "8%" }} />
            </i>
            <div>
              <strong>8%</strong>
              <small>1 of 13 modules</small>
            </div>
          </div>
        </div>
        <div className="side-module">
          <button>
            <span>00</span>
            <div>
              <strong>{moduleTitle}</strong>
              <small>Active · 70 min</small>
            </div>
            <ChevronDown size={14} />
          </button>
          <a className="active">
            <CheckCircle2 size={13} />
            <span>{lesson.title}</span>
          </a>
          <a>
            <CircleAlert size={13} />
            <span>Lifecycle failure drill</span>
          </a>
          <a>
            <Boxes size={13} />
            <span>LedgerFlow Stage 1</span>
          </a>
        </div>
        <div className="future-modules">
          {[
            "Networking & HTTP",
            "API design",
            "Relational databases",
            "Authentication & security",
            "Application architecture",
          ].map((item, i) => (
            <p key={item}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {item}
              <em>locked</em>
            </p>
          ))}
        </div>
        <div className="review-due">
          <Sparkles size={16} />
          <div>
            <strong>Review queue</strong>
            <small>2 concepts due tomorrow</small>
          </div>
        </div>
      </aside>
      <main id="atlas-main" className="atlas-main">
        <div className="context-bar">
          <div>
            <span>BACKEND / MODULE 00</span>
            <h1>
              {mode === "learn"
                ? lesson.title
                : mode === "architecture"
                  ? "LedgerFlow architecture evolution"
                  : mode === "failure"
                    ? "Failure propagation simulator"
                    : "Shutdown trade-off laboratory"}
            </h1>
          </div>
          <div>
            <Badge>
              <Clock3 size={11} /> {lesson.estimatedMinutes} min
            </Badge>
            <button
              aria-label="Bookmark"
              className={bookmarks.includes(lesson.id) ? "marked" : ""}
              onClick={() => toggleBookmark(lesson.id)}
            >
              <Bookmark size={16} />
            </button>
          </div>
        </div>
        {mode === "learn" && (
          <LearnView
            lesson={lesson}
            selected={selected}
            setSelected={setSelected}
            mastered={mastered}
            onMastery={() => setProgress(lesson.id, "mastered")}
          />
        )}
        {mode === "architecture" && <ArchitectureView />}
        {mode === "failure" && <FailureView step={failureStep} setStep={setFailureStep} />}
        {mode === "tradeoffs" && <TradeoffView selected={tradeoff} setSelected={setTradeoff} />}
      </main>
      <aside className="atlas-inspector">
        <div className="inspector-head">
          <SectionLabel>Operational lens</SectionLabel>
          <Activity size={15} />
        </div>
        <section>
          <span className="state-dot" />
          <small>SELECTED STATE</small>
          <h3>{selected.title}</h3>
          <p>{selected.detail}</p>
        </section>
        <section>
          <SectionLabel>System responsibility</SectionLabel>
          <strong>{selected.responsibility}</strong>
          <p>Own the transition, emit a reason, and keep it observable.</p>
        </section>
        <section>
          <SectionLabel>LedgerFlow implication</SectionLabel>
          <p>
            {selected.id === "draining"
              ? "Mark readiness false before calling Server.Shutdown. Retry-safe writes remain necessary."
              : "This state must be visible in structured logs and health behavior."}
          </p>
        </section>
        <section>
          <SectionLabel>My field note</SectionLabel>
          <textarea
            aria-label="Field note"
            value={notes[lesson.id] ?? ""}
            onChange={(e) => setNote(lesson.id, e.target.value)}
            placeholder="What changed in your model?"
          />
        </section>
      </aside>
    </div>
  );
}

function LearnView({
  lesson,
  selected,
  setSelected,
  mastered,
  onMastery,
}: {
  lesson: Lesson;
  selected: (typeof lifecycle)[number];
  setSelected: (v: (typeof lifecycle)[number]) => void;
  mastered: boolean;
  onMastery: () => void;
}) {
  const [section, setSection] = useState<(typeof learnSections)[number]>("problem");
  return (
    <div className="learn-view">
      <nav className="learning-path" aria-label="Lesson progression">
        {learnSections.map((id, i) => (
          <button
            key={id}
            className={section === id ? "active" : ""}
            onClick={() => setSection(id)}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            {id.replace("-", " ")}
          </button>
        ))}
      </nav>
      <article>
        <div className="article-index">
          {String(Math.max(1, learnSections.indexOf(section) + 1)).padStart(2, "0")}
        </div>
        <SectionLabel>{section.replace("-", " ")}</SectionLabel>
        <h2>
          {section === "mental-model"
            ? "A service is a lifecycle contract"
            : section.replace("-", " ")}
        </h2>
        <p className="atlas-lead">{normalizeStage(lesson.sections[section]).body}</p>
        {(section === "diagram" || section === "mental-model") && (
          <LifecycleCanvas selected={selected} setSelected={setSelected} />
        )}
        {section === "experiment" && <RequestTimeline />}
        {section === "exercises" && (
          <div className="atlas-exercises">
            {lesson.exercises.map((e, i) => (
              <button key={e.id}>
                <span>{i + 1}</span>
                <div>
                  <small>{e.type}</small>
                  <strong>{e.prompt}</strong>
                </div>
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
        )}
        {section === "mastery" && (
          <div className="evidence-grid">
            {lesson.masteryCriteria.map((c) => (
              <label key={c.id}>
                <input type="checkbox" />
                <span>
                  <small>{c.kind}</small>
                  {c.description}
                </span>
              </label>
            ))}
          </div>
        )}
        {section === "summary" && (
          <div className="mastery-submit">
            <Compass size={24} />
            <div>
              <strong>{mastered ? "Mastery recorded" : "Ready to submit evidence?"}</strong>
              <p>Opening and reading are not mastery. This records your claim for review.</p>
            </div>
            <Button onClick={onMastery}>{mastered ? "Mastered" : "Submit evidence"}</Button>
          </div>
        )}
        <footer>
          <span>Evidence before confidence.</span>
          <Button
            onClick={() =>
              setSection(
                learnSections[
                  Math.min(learnSections.indexOf(section) + 1, learnSections.length - 1)
                ]!,
              )
            }
          >
            Continue <ArrowRight size={14} />
          </Button>
        </footer>
      </article>
    </div>
  );
}
function LifecycleCanvas({
  selected,
  setSelected,
}: {
  selected: (typeof lifecycle)[number];
  setSelected: (v: (typeof lifecycle)[number]) => void;
}) {
  return (
    <div className="lifecycle-canvas">
      <div className="canvas-label">
        <Network size={14} />
        PROCESS LIFECYCLE · CLICK A STATE
      </div>
      <div className="lifecycle-flow">
        {lifecycle.map((state, i) => (
          <div key={state.id} className="state-wrap">
            <button
              className={selected.id === state.id ? "selected" : ""}
              onClick={() => setSelected(state)}
            >
              <small>0{i + 1}</small>
              <strong>{state.title}</strong>
              <span>{state.responsibility}</span>
            </button>
            {i < lifecycle.length - 1 && <ArrowRight size={18} />}
          </div>
        ))}
      </div>
      <div className="canvas-detail">
        <span>INVARIANT</span>
        <p>
          {selected.id === "ready"
            ? "Readiness is a promise to the router, not proof that the process exists."
            : selected.detail}
        </p>
      </div>
    </div>
  );
}
function RequestTimeline() {
  const [choice, setChoice] = useState<string>();
  const [show, setShow] = useState(false);
  return (
    <div className="request-timeline">
      <div className="timeline-title">
        <strong>Predict the overlap</strong>
        <span>DB latency 8s · request timeout 5s · SIGTERM at 3s</span>
      </div>
      <div className="timeline">
        <i />
        <span className="t0">request 0s</span>
        <span className="t3">SIGTERM 3s</span>
        <span className="t5">timeout 5s</span>
        <span className="t10">drain 10s</span>
      </div>
      <p>What does the client know at 5 seconds?</p>
      <div className="timeline-choices">
        {["The write failed", "The write committed", "The outcome is ambiguous"].map((v) => (
          <button key={v} className={choice === v ? "chosen" : ""} onClick={() => setChoice(v)}>
            {v}
          </button>
        ))}
      </div>
      <Button disabled={!choice} onClick={() => setShow(true)}>
        Reveal propagation
      </Button>
      {show && (
        <div
          className={
            choice === "The outcome is ambiguous" ? "timeline-answer correct" : "timeline-answer"
          }
        >
          <strong>
            {choice === "The outcome is ambiguous"
              ? "Correct causal model."
              : "The client cannot infer this."}
          </strong>{" "}
          A timeout limits waiting, not necessarily database execution. Idempotency resolves the
          retry risk.
        </div>
      )}
    </div>
  );
}
function ArchitectureView() {
  const [stage, setStage] = useState(1);
  return (
    <div className="lab-view">
      <div className="lab-intro">
        <SectionLabel>Architecture canvas</SectionLabel>
        <h2>Components are earned by requirements.</h2>
        <p>Advance only when the current architecture fails a concrete need.</p>
      </div>
      <div className="architecture-canvas">
        <div className="architecture-stage">
          <span>STAGE {stage}</span>
          <strong>{stage === 1 ? "Single-process truth" : "Durable state boundary"}</strong>
        </div>
        <div className="architecture-flow">
          <div>
            CLIENT<small>request owner</small>
          </div>
          <ArrowRight />
          <div className="primary">
            GO PROCESS<small>API + domain</small>
          </div>
          {stage > 1 && (
            <>
              <ArrowRight />
              <div>
                POSTGRESQL<small>durable state</small>
              </div>
            </>
          )}
        </div>
        <div className="architecture-reason">
          <div>
            <SectionLabel>Current requirement</SectionLabel>
            <p>
              {stage === 1
                ? "Learn the service lifecycle before adding persistence."
                : "Balances must survive process replacement and concurrent access."}
            </p>
          </div>
          <div>
            <SectionLabel>New failure mode</SectionLabel>
            <p>
              {stage === 1
                ? "A restart loses all data."
                : "Connections, transactions, migrations, and backup recovery now belong to us."}
            </p>
          </div>
        </div>
      </div>
      <Button onClick={() => setStage(stage === 1 ? 2 : 1)}>
        {stage === 1 ? "Introduce durable state" : "Return to prior stage"} <ArrowRight size={14} />
      </Button>
    </div>
  );
}
function FailureView({ step, setStep }: { step: number; setStep: (v: number) => void }) {
  const data = [
    { k: "Before", v: "Instance is ready; one write is in flight." },
    { k: "Trigger", v: "SIGTERM arrives during a slow database call." },
    { k: "Propagation", v: "Readiness stays true → another write arrives → drain expires." },
    { k: "User effect", v: "Client sees a timeout and cannot know whether the write committed." },
    { k: "Recovery", v: "Reconcile by idempotency key; inspect trace and transaction record." },
    { k: "Prevention", v: "Withdraw readiness first, bound work, design retry-safe writes." },
  ];
  return (
    <div className="lab-view">
      <div className="lab-intro">
        <SectionLabel>Scenario 01 · forced termination</SectionLabel>
        <h2>When graceful shutdown lies</h2>
        <p>Step through causality. The red path is consequence, not decoration.</p>
      </div>
      <div className="failure-map">
        <div className="failure-nodes">
          {data.map((x, i) => (
            <button key={x.k} className={i <= step ? "revealed" : ""} onClick={() => setStep(i)}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <strong>{x.k}</strong>
              {i < data.length - 1 && <ArrowRight />}
            </button>
          ))}
        </div>
        <div className="failure-detail">
          <ShieldAlert />
          <div>
            <small>{data[step]?.k}</small>
            <p>{data[step]?.v}</p>
          </div>
        </div>
      </div>
      <div className="failure-controls">
        <Button onClick={() => setStep(0)}>
          <RotateCcw size={14} /> Reset
        </Button>
        <Button onClick={() => setStep(Math.min(step + 1, data.length - 1))}>
          Next consequence <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  );
}
function TradeoffView({
  selected,
  setSelected,
}: {
  selected: "short" | "long" | null;
  setSelected: (v: "short" | "long") => void;
}) {
  return (
    <div className="lab-view">
      <div className="lab-intro">
        <SectionLabel>Decision record · shutdown budget</SectionLabel>
        <h2>No timeout is “safe” without context.</h2>
        <p>Choose for LedgerFlow, then inspect the cost you accepted.</p>
      </div>
      <div className="tradeoff-scale">
        <div className="scale-line">
          <span>FAST REPLACEMENT</span>
          <i />
          <span>WORK PRESERVATION</span>
        </div>
        <div className="tradeoff-options">
          <button
            className={selected === "short" ? "selected" : ""}
            onClick={() => setSelected("short")}
          >
            <span>05s</span>
            <strong>Short drain</strong>
            <p>Faster deploys; higher chance of aborting slow writes.</p>
          </button>
          <button
            className={selected === "long" ? "selected" : ""}
            onClick={() => setSelected("long")}
          >
            <span>30s</span>
            <strong>Long drain</strong>
            <p>More completion time; slower replacement and capacity release.</p>
          </button>
        </div>
      </div>
      {selected && (
        <div className="decision-output">
          <CheckCircle2 />
          <div>
            <small>YOUR DECISION</small>
            <strong>
              {selected === "short"
                ? "5 seconds, with retry-safe writes"
                : "30 seconds, bounded by platform termination"}
            </strong>
            <p>
              This is defensible only if proxy, request, database, and platform timeouts form a
              consistent budget.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
