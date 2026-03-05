-- Run this in Supabase Dashboard → SQL Editor (one-time setup)
-- Enums first
CREATE TYPE "public"."role" AS ENUM('developer', 'designer', 'qa', 'pm', 'lead', 'admin');
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'in_review', 'done');
CREATE TYPE "public"."priority" AS ENUM('P0', 'P1', 'P2', 'P3');
CREATE TYPE "public"."meeting_source" AS ENUM('manual', 'google');
CREATE TYPE "public"."meeting_status" AS ENUM('active', 'cancelled', 'dormant');

-- Tables (users first, then tables that reference it)
CREATE TABLE IF NOT EXISTS "users" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "email" varchar(255) NOT NULL UNIQUE,
  "name" varchar(255) NOT NULL,
  "role" "role" DEFAULT 'developer' NOT NULL,
  "image" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "projects" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "user_id" varchar(36) REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "color" varchar(20) DEFAULT '#007AFF' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "project_members" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "project_id" varchar(36) NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "user_id" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "tasks" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "user_id" varchar(36) REFERENCES "users"("id") ON DELETE CASCADE,
  "title" varchar(500) NOT NULL,
  "description" text,
  "project_id" varchar(36) REFERENCES "projects"("id") ON DELETE SET NULL,
  "status" "task_status" DEFAULT 'todo' NOT NULL,
  "priority" "priority" DEFAULT 'P2' NOT NULL,
  "estimated_minutes" integer,
  "due_date" timestamptz,
  "sort_order" integer DEFAULT 0,
  "is_blocked" boolean DEFAULT false,
  "blocked_reason" text,
  "is_recurring" boolean DEFAULT false,
  "recurring_rule" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "completed_at" timestamptz,
  "carried_over_from" timestamptz
);

CREATE TABLE IF NOT EXISTS "task_checklists" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "task_id" varchar(36) NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
  "title" varchar(500) NOT NULL,
  "is_done" boolean DEFAULT false,
  "sort_order" integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "time_entries" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "user_id" varchar(36) REFERENCES "users"("id") ON DELETE CASCADE,
  "task_id" varchar(36) REFERENCES "tasks"("id") ON DELETE SET NULL,
  "started_at" timestamptz NOT NULL,
  "ended_at" timestamptz,
  "category" varchar(50) DEFAULT 'coding' NOT NULL,
  "note" text
);

CREATE TABLE IF NOT EXISTS "follow_ups" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "user_id" varchar(36) REFERENCES "users"("id") ON DELETE CASCADE,
  "title" varchar(500) NOT NULL,
  "context_note" text,
  "due_at" timestamptz NOT NULL,
  "completed_at" timestamptz,
  "priority" "priority" DEFAULT 'P2' NOT NULL,
  "linked_task_id" varchar(36) REFERENCES "tasks"("id"),
  "snoozed_until" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "daily_notes" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "user_id" varchar(36) REFERENCES "users"("id") ON DELETE CASCADE,
  "date" timestamptz NOT NULL,
  "yesterday_summary" text,
  "today_plan" text,
  "scratch_pad" text,
  "end_of_day_reflection" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "meetings" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "user_id" varchar(36) REFERENCES "users"("id") ON DELETE CASCADE,
  "title" varchar(500) NOT NULL,
  "start_at" timestamptz NOT NULL,
  "end_at" timestamptz NOT NULL,
  "location" varchar(500),
  "link" text,
  "prep_notes" text,
  "take_preparation" text,
  "meeting_notes" text,
  "action_items" text,
  "live_notes" text,
  "summary" text,
  "status" "meeting_status" DEFAULT 'active' NOT NULL,
  "source" "meeting_source" DEFAULT 'manual' NOT NULL,
  "google_event_id" varchar(255),
  "calendar_account_email" varchar(255),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "google_accounts" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "user_email" varchar(255) NOT NULL UNIQUE,
  "access_token" text NOT NULL,
  "refresh_token" text,
  "token_expires_at" timestamptz,
  "connected_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
