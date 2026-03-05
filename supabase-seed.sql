-- Optional seed data for a fresh WorkDay project.
-- Run after supabase-schema.sql (and triggers if you want).

-- Create a demo user
INSERT INTO workday.users (id, email, name, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'demo@workday.local', 'Demo User', 'developer')
ON CONFLICT (id) DO NOTHING;

-- Create a couple of projects
INSERT INTO workday.projects (id, user_id, name, color)
VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Core Product', '#007AFF'),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Experiments', '#FF9500')
ON CONFLICT (id) DO NOTHING;

-- A few starter tasks for today
INSERT INTO workday.tasks (id, user_id, title, description, project_id, status, priority, estimated_minutes, due_date)
VALUES
  (
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'Plan today''s focus',
    'Pick 3 tasks to move from todo to done.',
    '22222222-2222-2222-2222-222222222222',
    'todo',
    'P1',
    15,
    NOW()
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '11111111-1111-1111-1111-111111111111',
    'Review open PRs',
    'Clear out anything blocking teammates.',
    '22222222-2222-2222-2222-222222222222',
    'in_progress',
    'P2',
    45,
    NOW()
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    '11111111-1111-1111-1111-111111111111',
    'Write daily summary',
    'Capture what moved today and any blockers.',
    '33333333-3333-3333-3333-333333333333',
    'todo',
    'P2',
    20,
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

