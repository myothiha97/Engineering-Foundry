import { describe, expect, it } from "vitest";
import { masteryScore, scheduleReview, transitionProgress } from "./index";

describe("learning engine", () => {
  it("does not grant mastery for opening a lesson", () =>
    expect(transitionProgress("not_started", { type: "OPEN" })).toBe("in_progress"));
  it("schedules incorrect concepts tomorrow", () =>
    expect(
      scheduleReview({
        lastReviewedAt: new Date("2026-01-01"),
        intervalDays: 8,
        ease: 2.2,
        correct: false,
      }).intervalDays,
    ).toBe(1));
  it("weights applied understanding", () =>
    expect(
      masteryScore({
        explanation: true,
        mentalModel: true,
        exercise: true,
        project: false,
        verification: false,
      }),
    ).toBe(55));
});
