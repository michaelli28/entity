-- Day 2 retention layer: Cold Reads, summaries, commitments, invites, intros, email log.

-- Cold Read artifacts
CREATE TABLE IF NOT EXISTS cold_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_id UUID NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES mentor_sessions(id) ON DELETE CASCADE,
    what_i_heard TEXT NOT NULL,
    investor_pushback TEXT[] NOT NULL,
    three_unanswered_questions TEXT[] NOT NULL,
    public_slug TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cold_reads_founder ON cold_reads(founder_id);

-- Session summaries (pinned on return)
CREATE TABLE IF NOT EXISTS mentor_session_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_id UUID NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES mentor_sessions(id) ON DELETE CASCADE,
    key_facts JSONB NOT NULL,
    founder_tone TEXT,
    topics_covered TEXT[],
    open_threads TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(session_id)
);
CREATE INDEX IF NOT EXISTS idx_summaries_founder ON mentor_session_summaries(founder_id);

-- Commitments (open loop)
CREATE TABLE IF NOT EXISTS founder_commitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_id UUID NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
    session_id UUID REFERENCES mentor_sessions(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_commitments_founder ON founder_commitments(founder_id) WHERE completed_at IS NULL;

-- Co-founder invites (viral)
CREATE TABLE IF NOT EXISTS cofounder_invites (
    token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_founder_id UUID NOT NULL REFERENCES founders(id),
    company_id UUID NOT NULL,
    used_by_founder_id UUID REFERENCES founders(id),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
    used_at TIMESTAMPTZ
);

-- Intro requests (fake-door wedge validation)
CREATE TABLE IF NOT EXISTS intro_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_id UUID NOT NULL REFERENCES founders(id),
    investor_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Email send log (avoid dupes)
CREATE TABLE IF NOT EXISTS email_sends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_id UUID NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
    email_type TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(founder_id, email_type)
);

-- session_signals already exists from the init migration; just ensure an index on session_id
CREATE INDEX IF NOT EXISTS idx_session_signals_session ON session_signals(session_id);
