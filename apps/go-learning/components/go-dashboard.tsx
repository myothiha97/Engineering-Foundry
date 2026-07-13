"use client";
import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Bookmark, ChevronRight, GitBranch, RotateCw } from "lucide-react";
import { LearningProvider, useLearning } from "@platform/learning-engine/react";
import type { Lesson } from "@platform/content-schema";
import { Badge, ProgressRing, SectionLabel } from "@platform/ui";
import { allTopics, goCurriculum, type TopicRef } from "@platform/curriculum";

const topics = allTopics(goCurriculum);
const topicByLessonId = new Map(topics.filter((t) => t.lessonId).map((t) => [t.lessonId!, t]));
const topicById = new Map(topics.map((t) => [t.id, t]));

/** Human labels for the engine's monotonic ladder, in ladder order. */
const stateOrder = [
  ["mastered", "Mastered"],
  ["needs_review", "Needs review"],
  ["project_applied", "Applied to project"],
  ["exercise_completed", "Exercise done"],
  ["exercise_attempted", "Practicing"],
  ["mental_model_understood", "Building model"],
  ["explanation_reviewed", "Reviewing"],
  ["in_progress", "In progress"],
] as const;

function stageLabel(stage?: string) {
  if (!stage) return "the beginning";
  return `the ${stage.replace(/-/g, " ")} stage`;
}

export function GoDashboard({ lessons }: { lessons: Lesson[] }) {
  return (
    <LearningProvider storageKey="go-runtime-lab">
      <Dashboard lessons={lessons} />
    </LearningProvider>
  );
}

function Dashboard({ lessons }: { lessons: Lesson[] }) {
  const { progress, completedLessons, bookmarks, notes, stages, lastVisited, hydrated } =
    useLearning();

  const lessonsById = useMemo(() => new Map(lessons.map((l) => [l.id, l])), [lessons]);

  // A topic is "done" when its lesson is learner-completed or evidence-mastered.
  const doneTopicIds = useMemo(
    () =>
      new Set(
        topics
          .filter(
            (t) =>
              t.lessonId &&
              (completedLessons.includes(t.lessonId) || progress[t.lessonId] === "mastered"),
          )
          .map((t) => t.id),
      ),
    [progress, completedLessons],
  );

  // Continue: the last lesson the learner touched, restored at its saved stage.
  const continueTopic = lastVisited ? topicByLessonId.get(lastVisited) : undefined;
  const continueLesson = lastVisited ? lessonsById.get(lastVisited) : undefined;

  // Next up: the first topic in curriculum order that isn't done, isn't the one
  // already in progress, and whose prerequisites are all done. Falls back to the
  // first not-done topic so there is always a next step.
  const nextTopic = useMemo(() => {
    const candidates = topics.filter((t) => !doneTopicIds.has(t.id) && t.id !== continueTopic?.id);
    return (
      candidates.find((t) => t.prerequisites.every((p) => doneTopicIds.has(p))) ?? candidates[0]
    );
  }, [doneTopicIds, continueTopic?.id]);

  const nextReason = nextTopic
    ? nextTopic.prerequisites.length === 0
      ? `Opens ${nextTopic.moduleTitle} with no prerequisites.`
      : nextTopic.prerequisites.every((p) => doneTopicIds.has(p))
        ? `All ${nextTopic.prerequisites.length} prerequisite${nextTopic.prerequisites.length > 1 ? "s are" : " is"} done — this is the next step on the path.`
        : `Earliest open topic — ${nextTopic.prerequisites.filter((p) => !doneTopicIds.has(p)).length} prerequisite(s) still open behind it.`
    : undefined;

  // Mastery distribution across authored lessons.
  const distribution = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of topics) {
      if (!t.lessonId) continue;
      const s = progress[t.lessonId];
      if (s && s !== "not_started") counts.set(s, (counts.get(s) ?? 0) + 1);
    }
    return counts;
  }, [progress]);
  const touched = Array.from(distribution.values()).reduce((a, b) => a + b, 0);

  const reviewDue = topics.filter((t) => t.lessonId && progress[t.lessonId] === "needs_review");
  const bookmarked = bookmarks
    .map((id) => topicByLessonId.get(id))
    .filter((t): t is TopicRef => Boolean(t));
  const recentNotes = Object.entries(notes)
    .filter(([, text]) => text.trim())
    .slice(-3)
    .reverse();

  const doneCount = doneTopicIds.size;
  const completion = topics.length ? Math.round((doneCount / topics.length) * 100) : 0;

  return (
    <div className="dash-app">
      <header className="dash-top">
        <Link href="/" className="go-brand dash-brand">
          <span className="brand-mark">G</span>
          <div>
            <strong>GO RUNTIME LAB</strong>
            <small>dashboard</small>
          </div>
        </Link>
        <nav className="dash-nav" aria-label="Lab destinations">
          <Link href="/">Workspace</Link>
          <Link href="/concepts">Concepts</Link>
          <Link href="/review">Review</Link>
        </nav>
      </header>

      <div className="dash-body">
        {/* LEFT — module dependency rail */}
        <aside className="dash-rail" aria-label="Module progression">
          <SectionLabel>Module path</SectionLabel>
          {goCurriculum.modules.map((m) => {
            const done = m.topics.filter((t) => doneTopicIds.has(t.id)).length;
            return (
              <div className="dash-module" key={m.id} data-complete={done === m.topics.length}>
                <div className="dash-module-head">
                  <span className="module-index">{String(m.order).padStart(2, "0")}</span>
                  <strong>{m.title}</strong>
                  <span className="dash-module-count">
                    {done}/{m.topics.length}
                  </span>
                </div>
                <div className="dash-module-bar" aria-hidden>
                  <i style={{ width: `${m.topics.length ? (done / m.topics.length) * 100 : 0}%` }} />
                </div>
                <div className="dash-module-topics">
                  {m.topics.map((t) => (
                    <Link
                      key={t.id}
                      href={`/?topic=${t.id}`}
                      className="dash-topic"
                      data-done={doneTopicIds.has(t.id)}
                    >
                      <span className="topic-dot" aria-hidden />
                      {t.title}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </aside>

        {/* CENTER — one strong path: continue, then the justified next step */}
        <main className="dash-main" aria-label="Current learning path">
          <div className="dash-hero">
            <div className="dash-hero-meta">
              <ProgressRing value={completion} label="Course completion" />
              <p className="ring-caption">
                {doneCount}/{topics.length} topics done
              </p>
            </div>
            <div className="dash-hero-copy">
              {!hydrated ? (
                <p className="dash-muted">Loading your local progress…</p>
              ) : continueTopic && continueLesson ? (
                <>
                  <SectionLabel>Continue where you left off</SectionLabel>
                  <h1>{continueLesson.title}</h1>
                  <p>
                    {continueTopic.moduleTitle} · you were at{" "}
                    {stageLabel(stages[continueLesson.id])}.
                  </p>
                  <Link className="dash-cta" href={`/?topic=${continueTopic.id}`}>
                    Continue lesson <ArrowRight size={16} />
                  </Link>
                </>
              ) : (
                <>
                  <SectionLabel>Start the course</SectionLabel>
                  <h1>How Go becomes a process</h1>
                  <p>Begin at Module 00 — no prerequisites, roughly 70 minutes.</p>
                  <Link className="dash-cta" href="/">
                    Open the workspace <ArrowRight size={16} />
                  </Link>
                </>
              )}
            </div>
          </div>

          {nextTopic && (
            <div className="dash-next">
              <div>
                <SectionLabel>Next on the path</SectionLabel>
                <strong>{nextTopic.title}</strong>
                <p>{nextTopic.summary}</p>
                <p className="dash-reason">
                  <GitBranch size={13} /> {nextReason}
                </p>
              </div>
              <Link className="dash-cta ghost" href={`/?topic=${nextTopic.id}`}>
                Open <ChevronRight size={15} />
              </Link>
            </div>
          )}

          {reviewDue.length > 0 && (
            <div className="dash-review">
              <SectionLabel>Needs review</SectionLabel>
              <p className="dash-muted">
                A wrong prediction or failed check flagged these — reopen them before they fade.
              </p>
              <ul>
                {reviewDue.map((t) => (
                  <li key={t.id}>
                    <Link href={`/?topic=${t.id}`}>
                      <RotateCw size={13} /> {t.title}
                      <small>{t.moduleTitle}</small>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link className="dash-link" href="/review">
                Open the review queue <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </main>

        {/* RIGHT — evidence, bookmarks, notes */}
        <aside className="dash-side" aria-label="Progress detail">
          <section>
            <SectionLabel>Mastery distribution</SectionLabel>
            {touched === 0 ? (
              <p className="dash-muted">No lessons touched yet.</p>
            ) : (
              <ul className="dash-dist">
                {stateOrder
                  .filter(([state]) => distribution.has(state))
                  .map(([state, label]) => {
                    const count = distribution.get(state)!;
                    return (
                      <li key={state}>
                        <span className="dash-dist-label">{label}</span>
                        <span className="dash-dist-bar" aria-hidden>
                          <i
                            data-state={state}
                            style={{ width: `${(count / touched) * 100}%` }}
                          />
                        </span>
                        <span className="dash-dist-count">{count}</span>
                      </li>
                    );
                  })}
              </ul>
            )}
          </section>

          {bookmarked.length > 0 && (
            <section>
              <SectionLabel>Bookmarks</SectionLabel>
              <ul className="dash-list">
                {bookmarked.map((t) => (
                  <li key={t.id}>
                    <Link href={`/?topic=${t.id}`}>
                      <Bookmark size={13} /> {t.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {recentNotes.length > 0 && (
            <section>
              <SectionLabel>Recent notes</SectionLabel>
              <ul className="dash-notes">
                {recentNotes.map(([lessonId, text]) => {
                  const t = topicByLessonId.get(lessonId);
                  return (
                    <li key={lessonId}>
                      {t ? (
                        <Link href={`/?topic=${t.id}`}>
                          <strong>{t.title}</strong>
                        </Link>
                      ) : (
                        <strong>{lessonId}</strong>
                      )}
                      <p>{text.length > 140 ? `${text.slice(0, 140)}…` : text}</p>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section>
            <SectionLabel>Course</SectionLabel>
            <div className="dash-course-meta">
              <Badge>{goCurriculum.modules.length} modules</Badge>
              <Badge>{topics.length} topics</Badge>
              <Badge>{topicById.size - doneCount} remaining</Badge>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
