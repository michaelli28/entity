-- apps/supabase/migrations/20260412220000_structured_sessions.sql

ALTER TABLE mentor_sessions
    ADD COLUMN coverage_score INT NOT NULL DEFAULT 0,
    ADD COLUMN suggest_complete BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN target_category TEXT,
    ADD COLUMN target_signal TEXT,
    ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE mentor_sessions
    ADD CONSTRAINT mentor_sessions_deep_dive_target_chk CHECK (
        (session_type = 'deep_dive' AND target_category IS NOT NULL AND target_signal IS NOT NULL)
        OR (session_type <> 'deep_dive' AND target_category IS NULL AND target_signal IS NULL)
    );

CREATE UNIQUE INDEX mentor_sessions_active_per_type
    ON mentor_sessions (founder_id, session_type)
    WHERE completed_at IS NULL AND session_type <> 'deep_dive';

CREATE INDEX IF NOT EXISTS idx_mentor_sessions_founder_type
    ON mentor_sessions (founder_id, session_type, started_at DESC);
