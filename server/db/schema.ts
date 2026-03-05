import {
  pgTable,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

const roleEnum = pgEnum("role", [
  "developer",
  "designer",
  "qa",
  "pm",
  "lead",
  "admin",
]);

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  role: roleEnum("role").notNull().default("developer"),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade",
  }),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 20 }).notNull().default("#007AFF"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const projectMembers = pgTable("project_members", {
  id: varchar("id", { length: 36 }).primaryKey(),
  projectId: varchar("project_id", { length: 36 })
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in_progress",
  "in_review",
  "done",
]);
const priorityEnum = pgEnum("priority", ["P0", "P1", "P2", "P3"]);

export const tasks = pgTable("tasks", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade",
  }),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  projectId: varchar("project_id", { length: 36 }).references(() => projects.id, {
    onDelete: "set null",
  }),
  status: taskStatusEnum("status").notNull().default("todo"),
  priority: priorityEnum("priority").notNull().default("P2"),
  estimatedMinutes: integer("estimated_minutes"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  sortOrder: integer("sort_order").default(0),
  isBlocked: boolean("is_blocked").default(false),
  blockedReason: text("blocked_reason"),
  isRecurring: boolean("is_recurring").default(false),
  recurringRule: text("recurring_rule"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  carriedOverFrom: timestamp("carried_over_from", { withTimezone: true }),
});

export const taskChecklists = pgTable("task_checklists", {
  id: varchar("id", { length: 36 }).primaryKey(),
  taskId: varchar("task_id", { length: 36 })
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  isDone: boolean("is_done").default(false),
  sortOrder: integer("sort_order").default(0),
});

export const timeEntries = pgTable("time_entries", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade",
  }),
  taskId: varchar("task_id", { length: 36 }).references(() => tasks.id, {
    onDelete: "set null",
  }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  category: varchar("category", { length: 50 }).notNull().default("coding"),
  note: text("note"),
});

export const followUps = pgTable("follow_ups", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade",
  }),
  title: varchar("title", { length: 500 }).notNull(),
  contextNote: text("context_note"),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  priority: priorityEnum("priority").notNull().default("P2"),
  linkedTaskId: varchar("linked_task_id", { length: 36 }).references(
    () => tasks.id
  ),
  snoozedUntil: timestamp("snoozed_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const dailyNotes = pgTable("daily_notes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade",
  }),
  date: timestamp("date", { withTimezone: true }).notNull(),
  yesterdaySummary: text("yesterday_summary"),
  todayPlan: text("today_plan"),
  scratchPad: text("scratch_pad"),
  endOfDayReflection: text("end_of_day_reflection"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const meetingStatusEnum = pgEnum("meeting_status", [
  "active",
  "cancelled",
  "dormant",
]);
export const meetingSourceEnum = pgEnum("meeting_source", [
  "manual",
  "google",
]);

export const meetings = pgTable("meetings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade",
  }),
  title: varchar("title", { length: 500 }).notNull(),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  location: varchar("location", { length: 500 }),
  link: text("link"),
  prepNotes: text("prep_notes"),
  takePreparation: text("take_preparation"),
  meetingNotes: text("meeting_notes"),
  actionItems: text("action_items"),
  liveNotes: text("live_notes"),
  summary: text("summary"),
  status: meetingStatusEnum("status").notNull().default("active"),
  source: meetingSourceEnum("source").notNull().default("manual"),
  googleEventId: varchar("google_event_id", { length: 255 }),
  calendarAccountEmail: varchar("calendar_account_email", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const googleAccounts = pgTable("google_accounts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userEmail: varchar("user_email", { length: 255 }).notNull().unique(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
  connectedAt: timestamp("connected_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects),
  checklists: many(taskChecklists),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  tasks: many(tasks),
  members: many(projectMembers),
}));
