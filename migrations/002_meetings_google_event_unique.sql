-- One meeting per Google event per calendar account.
-- Run once; skip if the index already exists.
-- If you have duplicate (google_event_id, calendar_account_email) rows, remove duplicates first.
-- MySQL: UNIQUE allows multiple NULLs, so manual meetings (NULL, NULL) are unaffected.

CREATE UNIQUE INDEX meetings_google_event_calendar_unique
ON meetings (google_event_id, calendar_account_email);
