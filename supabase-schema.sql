-- Run this in Supabase Dashboard → SQL Editor (one-time setup)
-- Enums first (stay in public schema). Use DO blocks so the script is safe to re-run.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
    CREATE TYPE "public"."role" AS ENUM('developer', 'designer', 'qa', 'pm', 'lead', 'admin');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'in_review', 'done');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority') THEN
    CREATE TYPE "public"."priority" AS ENUM('P0', 'P1', 'P2', 'P3');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meeting_source') THEN
    CREATE TYPE "public"."meeting_source" AS ENUM('manual', 'google');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meeting_status') THEN
    CREATE TYPE "public"."meeting_status" AS ENUM('active', 'cancelled', 'dormant');
  END IF;
END;
$$;

-- Dedicated schema for WorkDay app tables
CREATE SCHEMA IF NOT EXISTS "workday";

-- Tables (users first, then tables that reference it)
CREATE TABLE IF NOT EXISTS "workday"."users" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "email" varchar(255) NOT NULL UNIQUE,
  "name" varchar(255) NOT NULL,
  "role" "role" DEFAULT 'developer' NOT NULL,
  "image" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "workday"."projects" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "user_id" varchar(36) REFERENCES "workday"."users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "color" varchar(20) DEFAULT '#007AFF' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

-- Optional extended metadata for projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'workday'
      AND table_name = 'projects'
      AND column_name = 'description'
  ) THEN
    ALTER TABLE "workday"."projects"
    ADD COLUMN "description" text;
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS "workday"."project_members" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "project_id" varchar(36) NOT NULL REFERENCES "workday"."projects"("id") ON DELETE CASCADE,
  "user_id" varchar(36) NOT NULL REFERENCES "workday"."users"("id") ON DELETE CASCADE,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

-- Lightweight project resources for planning (name, designation, allocation hours)
CREATE TABLE IF NOT EXISTS "workday"."project_resources" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "project_id" varchar(36) NOT NULL REFERENCES "workday"."projects"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "designation" varchar(255),
  "allocation_hours" integer NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "workday"."tasks" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "user_id" varchar(36) REFERENCES "workday"."users"("id") ON DELETE CASCADE,
  "title" varchar(500) NOT NULL,
  "description" text,
  "project_id" varchar(36) REFERENCES "workday"."projects"("id") ON DELETE SET NULL,
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

-- Aggregate logged time per task in minutes (manual logging)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'workday'
      AND table_name = 'tasks'
      AND column_name = 'logged_minutes'
  ) THEN
    ALTER TABLE "workday"."tasks"
    ADD COLUMN "logged_minutes" integer DEFAULT 0;
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS "workday"."task_checklists" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "task_id" varchar(36) NOT NULL REFERENCES "workday"."tasks"("id") ON DELETE CASCADE,
  "title" varchar(500) NOT NULL,
  "is_done" boolean DEFAULT false,
  "sort_order" integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "workday"."time_entries" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "user_id" varchar(36) REFERENCES "workday"."users"("id") ON DELETE CASCADE,
  "task_id" varchar(36) REFERENCES "workday"."tasks"("id") ON DELETE SET NULL,
  "started_at" timestamptz NOT NULL,
  "ended_at" timestamptz,
  "category" varchar(50) DEFAULT 'coding' NOT NULL,
  "note" text
);

CREATE TABLE IF NOT EXISTS "workday"."follow_ups" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "user_id" varchar(36) REFERENCES "workday"."users"("id") ON DELETE CASCADE,
  "title" varchar(500) NOT NULL,
  "context_note" text,
  "due_at" timestamptz NOT NULL,
  "completed_at" timestamptz,
  "priority" "priority" DEFAULT 'P2' NOT NULL,
  "linked_task_id" varchar(36) REFERENCES "workday"."tasks"("id"),
  "snoozed_until" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "workday"."daily_notes" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "user_id" varchar(36) REFERENCES "workday"."users"("id") ON DELETE CASCADE,
  "date" timestamptz NOT NULL,
  "yesterday_summary" text,
  "today_plan" text,
  "scratch_pad" text,
  "end_of_day_reflection" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "workday"."meetings" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "user_id" varchar(36) REFERENCES "workday"."users"("id") ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS "workday"."google_accounts" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "user_email" varchar(255) NOT NULL UNIQUE,
  "access_token" text NOT NULL,
  "refresh_token" text,
  "token_expires_at" timestamptz,
  "connected_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

-- Basic permissions so Supabase roles can access the workday schema.
-- service_role is used by the backend, anon/authenticated are for any future direct client usage.
GRANT USAGE ON SCHEMA "workday" TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA "workday" TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA "workday" TO anon, authenticated;

-- Add meeting_id to tasks and follow_ups (after meetings table exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'workday' AND table_name = 'tasks' AND column_name = 'meeting_id'
  ) THEN
    ALTER TABLE "workday"."tasks"
    ADD COLUMN "meeting_id" varchar(36) REFERENCES "workday"."meetings"("id") ON DELETE SET NULL;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'workday' AND table_name = 'follow_ups' AND column_name = 'meeting_id'
  ) THEN
    ALTER TABLE "workday"."follow_ups"
    ADD COLUMN "meeting_id" varchar(36) REFERENCES "workday"."meetings"("id") ON DELETE SET NULL;
  END IF;
END;
$$;

-- Extend meeting_status enum with a completed state for finished meetings
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meeting_status') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'meeting_status'
        AND e.enumlabel = 'completed'
    ) THEN
      ALTER TYPE "public"."meeting_status" ADD VALUE 'completed';
    END IF;
  END IF;
END;
$$;
