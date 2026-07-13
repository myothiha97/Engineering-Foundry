"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ChevronRight, GitBranch } from "lucide-react";
import { LearningProvider, useLearning } from "@platform/learning-engine/react";
import { Badge, SectionLabel } from "@platform/ui";
import { allTopics, goCurriculum, type TopicRef } from "@platform/curriculum";

const topics = allTopics(goCurriculum);
const topicById = new Map(topics.map((t) => [t.id, t]));

/** Reverse prerequisite edges: topic id -> topics that require it. */
const dependents = (() => {
  const map = new Map<string, TopicRef[]>();
  for (const t of topics)
    for (const p of t.prerequisites) {
      const list = map.get(p);
      if (list) list.push(t);
      else map.set(p, [t]);
    }
  return map;
})();

/* Layout: one column per module, topics stacked inside their column. */
const COL_W = 200;
const NODE_W = 176;
const NODE_H = 36;
const ROW_H = 48;
const HEAD_H = 46;

const positions = (() => {
  const map = new Map<string, { x: number; y: number }>();
  goCurriculum.modules.forEach((m, mi) => {
    m.topics.forEach((t, ti) => {
      map.set(t.id, { x: mi * COL_W + 12, y: HEAD_H + ti * ROW_H });
    });
  });
  return map;
})();
const GRAPH_W = goCurriculum.modules.length * COL_W + 12;
const GRAPH_H =
  HEAD_H + Math.max(...goCurriculum.modules.map((m) => m.topics.length)) * ROW_H + 16;

type NodeState = "done" | "review" | "started" | "todo";
type Filter = "all" | NodeState;

const filterLabel: Record<Filter, string> = {
  all: "All",
  done: "Done",
  review: "Needs review",
  started: "In progress",
  todo: "Not started",
};

export function GoConcepts() {
  return (
    <LearningProvider storageKey="go-runtime-lab">
      <Concepts />
    </LearningProvider>
  );
}

function Concepts() {
  const { progress, completedLessons } = useLearning();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const stateOf = useMemo(() => {
    return (t: TopicRef): NodeState => {
      if (!t.lessonId) return "todo";
      const s = progress[t.lessonId];
      if (completedLessons.includes(t.lessonId) || s === "mastered") return "done";
      if (s === "needs_review") return "review";
      if (s && s !== "not_started") return "started";
      return "todo";
    };
  }, [progress, completedLessons]);

  const selected = selectedId ? topicById.get(selectedId) : undefined;
  const selectedPrereqs = selected
    ? selected.prerequisites.map((id) => topicById.get(id)).filter((t): t is TopicRef => Boolean(t))
    : [];
  const selectedDependents = selected ? (dependents.get(selected.id) ?? []) : [];

  // Edges touching the selected node are highlighted; the rest stay faint so the
  // 60-odd prerequisite arrows read as texture instead of noise.
  const edges = useMemo(() => {
    const list: { from: string; to: string; active: boolean }[] = [];
    for (const t of topics)
      for (const p of t.prerequisites)
        list.push({
          from: p,
          to: t.id,
          active: selectedId === t.id || selectedId === p,
        });
    return list;
  }, [selectedId]);

  const matchesFilter = (t: TopicRef) => filter === "all" || stateOf(t) === filter;

  return (
    <div className="dash-app">
      <header className="dash-top">
        <Link href="/" className="go-brand dash-brand">
          <span className="brand-mark">G</span>
          <div>
            <strong>GO RUNTIME LAB</strong>
            <small>concept graph</small>
          </div>
        </Link>
        <nav className="dash-nav" aria-label="Lab destinations">
          <Link href="/">Workspace</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/review">Review</Link>
        </nav>
      </header>

      <div className="concepts-body">
        <main className="concepts-main">
          <div className="lesson-head">
            <div>
              <div className="breadcrumbs">
                <span>GO RUNTIME LAB</span>
                <ChevronRight size={12} />
                <span>CONCEPTS</span>
              </div>
              <h1>Knowledge graph</h1>
              <p>
                Every topic and the prerequisites it stands on. Select a node to see what it
                unlocks; the graph is a recommendation, never a lock.
              </p>
              <div className="lesson-meta" role="group" aria-label="Filter by progress">
                {(Object.keys(filterLabel) as Filter[]).map((f) => (
                  <button
                    key={f}
                    className={filter === f ? "graph-filter active" : "graph-filter"}
                    aria-pressed={filter === f}
                    onClick={() => setFilter(f)}
                  >
                    {filterLabel[f]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="graph-scroll" role="region" aria-label="Prerequisite graph" tabIndex={0}>
            <div className="graph-canvas" style={{ width: GRAPH_W, height: GRAPH_H }}>
              <svg
                className="graph-edges"
                width={GRAPH_W}
                height={GRAPH_H}
                aria-hidden
                focusable="false"
              >
                {edges.map(({ from, to, active }) => {
                  const a = positions.get(from);
                  const b = positions.get(to);
                  if (!a || !b) return null;
                  const x1 = a.x + NODE_W;
                  const y1 = a.y + NODE_H / 2;
                  const x2 = b.x;
                  const y2 = b.y + NODE_H / 2;
                  const mx = (x1 + x2) / 2;
                  return (
                    <path
                      key={`${from}->${to}`}
                      d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                      className={active ? "graph-edge active" : "graph-edge"}
                    />
                  );
                })}
              </svg>
              {goCurriculum.modules.map((m, mi) => (
                <span className="graph-col-label" style={{ left: mi * COL_W + 12 }} key={m.id}>
                  {String(m.order).padStart(2, "0")} · {m.title}
                </span>
              ))}
              {topics.map((t) => {
                const pos = positions.get(t.id)!;
                const st = stateOf(t);
                return (
                  <button
                    key={t.id}
                    className={selectedId === t.id ? "graph-node selected" : "graph-node"}
                    data-state={st}
                    data-dim={!matchesFilter(t)}
                    style={{ left: pos.x, top: pos.y, width: NODE_W, height: NODE_H }}
                    onClick={() => setSelectedId(selectedId === t.id ? null : t.id)}
                    aria-pressed={selectedId === t.id}
                  >
                    <span className="topic-dot" aria-hidden />
                    <span className="graph-node-title">{t.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text alternative: the same graph as a nested, keyboard-friendly tree. */}
          <details className="graph-tree">
            <summary>Text view of the graph</summary>
            {goCurriculum.modules.map((m) => (
              <div key={m.id} className="graph-tree-module">
                <strong>
                  {String(m.order).padStart(2, "0")} · {m.title}
                </strong>
                <ul>
                  {m.topics.map((t) => (
                    <li key={t.id}>
                      <button onClick={() => setSelectedId(t.id)}>{t.title}</button>
                      {t.prerequisites.length > 0 && (
                        <small>
                          {" "}
                          — needs{" "}
                          {t.prerequisites
                            .map((p) => topicById.get(p)?.title ?? p)
                            .join(", ")}
                        </small>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </details>
        </main>

        <aside className="concepts-panel" aria-label="Selected topic" aria-live="polite">
          {selected ? (
            <>
              <SectionLabel>{selected.moduleTitle}</SectionLabel>
              <h2>{selected.title}</h2>
              <p className="concepts-summary">{selected.summary}</p>
              <div className="lesson-meta">
                <Badge>{selected.concepts.length} concepts</Badge>
                <Badge>{selectedDependents.length} unlocked by this</Badge>
              </div>

              <SectionLabel>Concepts</SectionLabel>
              <ul className="concept-chips">
                {selected.concepts.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>

              {selectedPrereqs.length > 0 && (
                <>
                  <SectionLabel>Stands on</SectionLabel>
                  <ul className="panel-links">
                    {selectedPrereqs.map((p) => (
                      <li key={p.id}>
                        <button onClick={() => setSelectedId(p.id)}>
                          <GitBranch size={13} /> {p.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {selectedDependents.length > 0 && (
                <>
                  <SectionLabel>Unlocks</SectionLabel>
                  <ul className="panel-links">
                    {selectedDependents.map((d) => (
                      <li key={d.id}>
                        <button onClick={() => setSelectedId(d.id)}>
                          <GitBranch size={13} className="flip" /> {d.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <SectionLabel>Why it matters</SectionLabel>
              <p className="concepts-why">{selected.whyNow}</p>

              <Link className="dash-cta" href={`/?topic=${selected.id}`}>
                Open lesson <ArrowRight size={15} />
              </Link>
            </>
          ) : (
            <>
              <SectionLabel>Nothing selected</SectionLabel>
              <p className="dash-muted">
                Select any node to see its concepts, what it stands on, and what it unlocks.
              </p>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
