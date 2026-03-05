import {
  mysqlTable,
  varchar,
  text,
  int,
  timestamp,
  boolean,
  mysqlEnum,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  role: mysqlEnum("role", [
    "developer",
    "designer",
    "qa",
    "pm",
    "lead",
    "admin",
  ])
    .notNull()
    .default("developer"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projects = mysqlTable("projects", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade",
  }),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 20 }).notNull().default("#007AFF"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectMembers = mysqlTable("project_members", {
  id: varchar("id", { length: 36 }).primaryKey(),
  projectId: varchar("project_id", { length: 36 })
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = mysqlTable("tasks", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade",
  }),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  projectId: varchar("project_id", { length: 36 }).references(() => projects.id, {
    onDelete: "set null",
  }),
  status: mysqlEnum("status", [
    "todo",
    "in_progress",
    "in_review",
    "done",
  ])
    .notNull()
    .default("todo"),
  priority: mysqlEnum("priority", ["P0", "P1", "P2", "P3"])
    .notNull()
    .default("P2"),
  estimatedMinutes: int("estimated_minutes"),
  dueDate: timestamp("due_date"),
  sortOrder: int("sort_order").default(0),
  isBlocked: boolean("is_blocked").default(false),
  blockedReason: text("blocked_reason"),
  isRecurring: boolean("is_recurring").default(false),
  recurringRule: text("recurring_rule"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  carriedOverFrom: timestamp("carried_over_from"),
});

export const taskChecklists = mysqlTable("task_checklists", {
  id: varchar("id", { length: 36 }).primaryKey(),
  taskId: varchar("task_id", { length: 36 })
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  isDone: boolean("is_done").default(false),
  sortOrder: int("sort_order").default(0),
});

export const timeEntries = mysqlTable("time_entries", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade",
  }),
  taskId: varchar("task_id", { length: 36 }).references(() => tasks.id, {
    onDelete: "set null",
  }),
  startedAt: timestamp("started_at").notNull(),
  endedAt: timestamp("ended_at"),
  category: varchar("category", { length: 50 }).notNull().default("coding"),
  note: text("note"),
});

export const followUps = mysqlTable("follow_ups", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade",
  }),
  title: varchar("title", { length: 500 }).notNull(),
  contextNote: text("context_note"),
  dueAt: timestamp("due_at").notNull(),
  completedAt: timestamp("completed_at"),
  priority: mysqlEnum("priority", ["P0", "P1", "P2", "P3"])
    .notNull()
    .default("P2"),
  linkedTaskId: varchar("linked_task_id", { length: 36 }).references(
    () => tasks.id
  ),
  snoozedUntil: timestamp("snoozed_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dailyNotes = mysqlTable("daily_notes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade",
  }),
  date: timestamp("date").notNull(),
  yesterdaySummary: text("yesterday_summary"),
  todayPlan: text("today_plan"),
  scratchPad: text("scratch_pad"),
  endOfDayReflection: text("end_of_day_reflection"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const meetingStatusEnum = mysqlEnum("meeting_status", [
  "active",
  "cancelled",
  "dormant",
]);
export const meetingSourceEnum = mysqlEnum("meeting_source", [
  "manual",
  "google",
]);

export const meetings = mysqlTable(
  "meetings",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).references(() => users.id, {
      onDelete: "cascade",
    }),
    title: varchar("title", { length: 500 }).notNull(),
    startAt: timestamp("start_at").notNull(),
    endAt: timestamp("end_at").notNull(),
    location: varchar("location", { length: 500 }),
    link: text("link"),
    prepNotes: text("prep_notes"),
    takePreparation: text("take_preparation"),
    meetingNotes: text("meeting_notes"),
    actionItems: text("action_items"),
    liveNotes: text("live_notes"),
    summary: text("summary"),
    status: meetingStatusEnum.notNull().default("active"),
    source: meetingSourceEnum.notNull().default("manual"),
    googleEventId: varchar("google_event_id", { length: 255 }),
    calendarAccountEmail: varchar("calendar_account_email", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("meetings_google_event_calendar_unique").on(
      table.googleEventId,
      table.calendarAccountEmail
    ),
  ]
);

export const googleAccounts = mysqlTable("google_accounts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userEmail: varchar("user_email", { length: 255 }).notNull().unique(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  connectedAt: timestamp("connected_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects),
  checklists: many(taskChecklists),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  tasks: many(tasks),
  members: many(projectMembers),
}));
