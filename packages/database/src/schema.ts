import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const progressState = pgEnum("progress_state", [
  "not_started",
  "in_progress",
  "explanation_reviewed",
  "mental_model_understood",
  "exercise_attempted",
  "exercise_completed",
  "project_applied",
  "needs_review",
  "mastered",
]);
export const courseKind = pgEnum("course_kind", ["go", "backend"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);
export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  password: text("password"),
});
export const verifications = pgTable("verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const progressRecords = pgTable(
  "progress_records",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    course: courseKind("course").notNull(),
    lessonId: text("lesson_id").notNull(),
    state: progressState("state").notNull().default("not_started"),
    timeSpentSeconds: integer("time_spent_seconds").notNull().default(0),
    lastVisitedAt: timestamp("last_visited_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.course, t.lessonId] })],
);
export const masteryRecords = pgTable("mastery_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  conceptId: text("concept_id").notNull(),
  score: integer("score").notNull(),
  evidence: jsonb("evidence").notNull(),
  achievedAt: timestamp("achieved_at", { withTimezone: true }).defaultNow().notNull(),
});
export const exerciseAttempts = pgTable("exercise_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  exerciseId: text("exercise_id").notNull(),
  answer: jsonb("answer").notNull(),
  correct: boolean("correct").notNull(),
  feedback: text("feedback"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export const reviewItems = pgTable(
  "review_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    conceptId: text("concept_id").notNull(),
    reason: text("reason").notNull(),
    intervalDays: integer("interval_days").notNull().default(1),
    easePermille: integer("ease_permille").notNull().default(2200),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
  },
  (t) => [index("review_due_idx").on(t.userId, t.dueAt)],
);
export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export const bookmarks = pgTable(
  "bookmarks",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.targetType, t.targetId] })],
);
export const learningSessions = pgTable("learning_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  anonymousId: text("anonymous_id"),
  course: courseKind("course").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  activeSeconds: integer("active_seconds").notNull().default(0),
});
export const projectMilestones = pgTable(
  "project_milestones",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    projectId: text("project_id").notNull(),
    milestoneId: text("milestone_id").notNull(),
    completed: boolean("completed").notNull().default(false),
    evidence: text("evidence"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.projectId, t.milestoneId] })],
);
