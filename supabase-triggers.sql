-- Run after supabase-schema.sql
-- Generic updated_at trigger for tables that have an updated_at column.

CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to key WorkDay tables

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_users'
  ) THEN
    CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON workday.users
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_projects'
  ) THEN
    CREATE TRIGGER set_updated_at_projects
    BEFORE UPDATE ON workday.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_tasks'
  ) THEN
    CREATE TRIGGER set_updated_at_tasks
    BEFORE UPDATE ON workday.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_follow_ups'
  ) THEN
    CREATE TRIGGER set_updated_at_follow_ups
    BEFORE UPDATE ON workday.follow_ups
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_daily_notes'
  ) THEN
    CREATE TRIGGER set_updated_at_daily_notes
    BEFORE UPDATE ON workday.daily_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_meetings'
  ) THEN
    CREATE TRIGGER set_updated_at_meetings
    BEFORE UPDATE ON workday.meetings
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_google_accounts'
  ) THEN
    CREATE TRIGGER set_updated_at_google_accounts
    BEFORE UPDATE ON workday.google_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();
  END IF;
END;
$$;

