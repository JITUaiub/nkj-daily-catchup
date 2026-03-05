-- Run this once if you already have a `meetings` table and need to add new columns.
-- New installs can use schema.sql directly.
-- MySQL: run each statement; if a column already exists, skip that statement.

ALTER TABLE `meetings` ADD COLUMN `take_preparation` text;
ALTER TABLE `meetings` ADD COLUMN `meeting_notes` text;
ALTER TABLE `meetings` ADD COLUMN `action_items` text;
ALTER TABLE `meetings` ADD COLUMN `status` enum('active','cancelled','dormant') NOT NULL DEFAULT 'active';
ALTER TABLE `meetings` ADD COLUMN `source` enum('manual','google') NOT NULL DEFAULT 'manual';
ALTER TABLE `meetings` ADD COLUMN `google_event_id` varchar(255) DEFAULT NULL;
ALTER TABLE `meetings` ADD COLUMN `calendar_account_email` varchar(255) DEFAULT NULL;

-- Optional: add indexes for sync/disconnect queries
-- CREATE INDEX meetings_calendar_account_email ON meetings(calendar_account_email);
-- CREATE INDEX meetings_google_event_id ON meetings(google_event_id);
