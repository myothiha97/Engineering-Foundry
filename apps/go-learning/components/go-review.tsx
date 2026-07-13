"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarClock, ChevronRight, RotateCw } from "lucide-react";
import { LearningProvider, useLearning, type ReviewEntry } from "@platform/learning-engine/react";
import { normalizeStage, type Lesson } from "@platform/content-schema";
import { Badge, SectionLabel } from "@platform/ui";
import { allTopics, goCurriculum, type TopicRef } from "@platform/curriculum";

const topics = allTopics(goCurriculum);
const topicByLessonId = new Map(topics.filter((t) => t.lessonId).map((t) => [t.lessonId!, t]));

type QueueItem = {
  lessonId: string;
  topic: TopicRef;
  lesson: Lesson;
  reason: string;
  entry?: ReviewEntry;
};

export function GoReview({ lessons }: { lessons: Lesson[] }) {
  return (
    <LearningProvider storageKey="go-runtime-lab">
      <Review lessons={lessons} />
    </LearningProvider>
  );
}

function Review({ lessons }: { lessons: Lesson[] }) {
  const { progress, reviews, hydrated, applyEvent, recordReviewOutcome } = useLearning();
  const lessonsById = useMemo(() => new Map(lessons.map((l) => [l.id, l])), [lessons]);

  const { due, upcoming } = useMemo(() => {
    const now = Date.now();
    const dueItems: QueueItem[] = [];
    const upcomingItems: QueueItem[] = [];
    const seen = new Set<string>();

    for (const [lessonId, entry] of Object.entries(reviews)) {
      const topic = topicByLessonId.get(lessonId);
      const lesson = lessonsById.get(lessonId);
      if (!topic || !lesson) continue;
      seen.add(lessonId);
      const item = { lessonId, topic, lesson, reason: entry.reason, entry };
      // A recovered lesson (correct review outcome) stays scheduled; only surface
      // it again once its interval elapses.
      if (new Date(entry.dueAt).getTime() <= now) dueItems.push(item);
      else upcomingItems.push(item);
    }
    // Lessons flagged needs_review before review entries existed (older payloads).
    for (const [lessonId, state] of Object.entries(progress)) {
      if (state !== "needs_review" || seen.has(lessonId)) continue;
      const topic = topicByLessonId.get(lessonId);
      const lesson = lessonsById.get(lessonId);
      if (!topic || !lesson) continue;
      dueItems.push({ lessonId, topic, lesson, reason: "flagged needs review" });
    }
    upcomingItems.sort(
      (a, b) => new Date(a.entry!.dueAt).getTime() - new Date(b.entry!.dueAt).getTime(),
    );
    return { due: dueItems, upcoming: upcomingItems };
  }, [reviews, progress, lessonsById]);

  const finishReview = (item: QueueItem, correct: boolean) => {
    recordReviewOutcome(item.lessonId, correct);
    applyEvent(item.lessonId, { type: "ATTEMPT_EXERCISE", correct });
  };

  return (
    <div className="dash-app">
      <header className="dash-top">
        <Link href="/" className="go-brand dash-brand">
          <span className="brand-mark">G</span>
          <div>
            <strong>GO RUNTIME LAB</strong>
            <small>review queue</small>
          </div>
        </Link>
        <nav className="dash-nav" aria-label="Lab destinations">
          <Link href="/">Workspace</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/concepts">Concepts</Link>
        </nav>
      </header>

      <main className="review-main">
        <div className="lesson-head">
          <div>
            <div className="breadcrumbs">
              <span>GO RUNTIME LAB</span>
              <ChevronRight size={12} />
              <span>REVIEW</span>
            </div>
            <h1>Review queue</h1>
            <p>
              Concepts you got wrong come back here on a spaced schedule. Re-explain the model
              before revealing it — the recall attempt is what strengthens the memory.
            </p>
            <div className="lesson-meta">
              <Badge>{due.length} due now</Badge>
              <Badge>{upcoming.length} scheduled</Badge>
            </div>
          </div>
        </div>

        {!hydrated ? (
          <p className="dash-muted">Loading your local progress…</p>
        ) : due.length === 0 ? (
          <div className="review-empty">
            <SectionLabel>Nothing due</SectionLabel>
            <p>
              Items land here when a prediction misses, an exercise check fails, or mastery
              verification doesn&apos;t pass — and again whenever a scheduled interval elapses.
              {upcoming.length > 0
                ? " Your next scheduled review is below."
                : " Keep working lessons in the workspace and the queue fills itself."}
            </p>
            <Link className="dash-cta" href="/">
              Back to the workspace <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="review-stack">
            {due.map((item) => (
              <ReviewCard key={item.lessonId} item={item} onOutcome={finishReview} />
            ))}
          </div>
        )}

        {upcoming.length > 0 && (
          <section className="review-upcoming">
            <SectionLabel>Scheduled</SectionLabel>
            <ul>
              {upcoming.map((item) => (
                <li key={item.lessonId}>
                  <CalendarClock size={14} />
                  <Link href={`/?topic=${item.topic.id}`}>{item.lesson.title}</Link>
                  <small>
                    due {new Date(item.entry!.dueAt).toLocaleDateString()} · interval{" "}
                    {item.entry!.intervalDays}d
                  </small>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

/**
 * One due review: reopen the lesson's compact context, demand a committed
 * re-explanation, then reveal the model and grade the recall honestly.
 */
function ReviewCard({
  item,
  onOutcome,
}: {
  item: QueueItem;
  onOutcome: (item: QueueItem, correct: boolean) => void;
}) {
  const [attempt, setAttempt] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [outcome, setOutcome] = useState<"right" | "wrong" | null>(null);

  const mentalModel = normalizeStage(item.lesson.sections["mental-model"]);
  const summary = normalizeStage(item.lesson.sections.summary);
  const committed = attempt.trim().length > 0;

  const grade = (correct: boolean) => {
    setOutcome(correct ? "right" : "wrong");
    onOutcome(item, correct);
  };

  return (
    <article className="review-card">
      <div className="review-card-head">
        <RotateCw size={15} />
        <div>
          <strong>{item.lesson.title}</strong>
          <small>
            {item.topic.moduleTitle} · {item.reason}
          </small>
        </div>
        <Link className="dash-link" href={`/?topic=${item.topic.id}`}>
          Reopen lesson
        </Link>
      </div>

      <p className="review-prompt">
        Without looking anything up: explain this lesson&apos;s core model in your own words.
      </p>
      {!revealed && (
        <textarea
          className="exercise-attempt"
          value={attempt}
          onChange={(e) => setAttempt(e.target.value)}
          placeholder="Write your explanation first — then reveal the model…"
          aria-label="Your explanation"
        />
      )}
      {revealed && attempt && (
        <blockquote className="review-attempt-echo">
          <SectionLabel>Your explanation</SectionLabel>
          <p>{attempt}</p>
        </blockquote>
      )}

      {revealed && (
        <div className="exercise-answer">
          <SectionLabel>The model</SectionLabel>
          <p>{mentalModel.body || summary.body}</p>
        </div>
      )}

      {outcome && (
        <div className={outcome === "right" ? "reveal correct" : "reveal"} role="status">
          <strong>{outcome === "right" ? "Recalled." : "Not yet back."}</strong>{" "}
          {outcome === "right"
            ? "The interval grows — it returns later to keep the memory fresh."
            : "It comes back tomorrow. Consider reopening the lesson now."}
        </div>
      )}

      {!outcome && (
        <div className="exercise-actions">
          {!revealed ? (
            <button
              className="solid-btn"
              disabled={!committed}
              title={committed ? undefined : "Write your explanation first"}
              onClick={() => setRevealed(true)}
            >
              Reveal the model
            </button>
          ) : (
            <>
              <button className="solid-btn" onClick={() => grade(true)}>
                I had it
              </button>
              <button className="ghost-btn" onClick={() => grade(false)}>
                I&apos;d lost it
              </button>
            </>
          )}
        </div>
      )}
    </article>
  );
}
