-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA extensions;

-- Founders
CREATE TABLE founders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    linkedin_data JSONB,
    github_data JSONB,
    timezone TEXT,
    onboarding_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_founders_clerk_user_id ON founders (clerk_user_id);
CREATE UNIQUE INDEX idx_founders_email ON founders (email);

-- Startup Profiles
CREATE TABLE startup_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    founder_id UUID NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
    company_name TEXT,
    one_liner TEXT,
    market_category TEXT,
    stage TEXT CHECK (stage IN ('pre_seed', 'seed', 'series_a')),
    raise_amount BIGINT,
    pitch_sections JSONB,
    published_sections TEXT[],
    embedding extensions.vector(1536),
    embedding_model TEXT,
    embedded_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_startup_profiles_founder ON startup_profiles (founder_id);
CREATE INDEX idx_startup_profiles_active ON startup_profiles (founder_id) WHERE deleted_at IS NULL;

-- Signal Scores
CREATE TABLE signal_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    startup_profile_id UUID NOT NULL REFERENCES startup_profiles(id) ON DELETE CASCADE,
    overall_score SMALLINT NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
    category_scores JSONB NOT NULL,
    signal_details JSONB NOT NULL,
    engagement_quality_score SMALLINT CHECK (engagement_quality_score BETWEEN 0 AND 100),
    scoring_version TEXT NOT NULL,
    scoring_config JSONB,
    triggered_by TEXT,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ
);
CREATE INDEX idx_signal_scores_profile ON signal_scores (startup_profile_id);
CREATE INDEX idx_signal_scores_overall ON signal_scores (overall_score DESC);
CREATE INDEX idx_signal_scores_computed ON signal_scores (computed_at DESC);
CREATE INDEX idx_signal_scores_categories ON signal_scores USING gin (category_scores);

-- Mentor Sessions
CREATE TABLE mentor_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    founder_id UUID NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
    startup_profile_id UUID NOT NULL REFERENCES startup_profiles(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL CHECK (session_type IN (
        'big_picture', 'problem_market', 'business', 'ask', 'deep_dive'
    )),
    session_summary TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);
CREATE INDEX idx_mentor_sessions_founder ON mentor_sessions (founder_id);
CREATE INDEX idx_mentor_sessions_profile ON mentor_sessions (startup_profile_id);

-- Mentor Messages (normalized conversation history)
CREATE TABLE mentor_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES mentor_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mentor_messages_session ON mentor_messages (session_id, created_at);

-- Session Signals (normalized extracted signals)
CREATE TABLE session_signals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES mentor_sessions(id) ON DELETE CASCADE,
    message_id UUID REFERENCES mentor_messages(id) ON DELETE SET NULL,
    signal_key TEXT NOT NULL,
    signal_value JSONB NOT NULL,
    confidence REAL NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_session_signals_session ON session_signals (session_id);
CREATE INDEX idx_session_signals_key ON session_signals (signal_key);

-- Row-Level Security
ALTER TABLE founders ENABLE ROW LEVEL SECURITY;
ALTER TABLE startup_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policies: founders see only their own data
CREATE POLICY "founders_self" ON founders
    FOR ALL USING (clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "startup_profiles_owner" ON startup_profiles
    FOR ALL USING (
        founder_id IN (
            SELECT id FROM founders
            WHERE clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    );

CREATE POLICY "signal_scores_owner" ON signal_scores
    FOR ALL USING (
        startup_profile_id IN (
            SELECT sp.id FROM startup_profiles sp
            JOIN founders f ON sp.founder_id = f.id
            WHERE f.clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    );

CREATE POLICY "mentor_sessions_owner" ON mentor_sessions
    FOR ALL USING (
        founder_id IN (
            SELECT id FROM founders
            WHERE clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    );

CREATE POLICY "mentor_messages_owner" ON mentor_messages
    FOR ALL USING (
        session_id IN (
            SELECT ms.id FROM mentor_sessions ms
            JOIN founders f ON ms.founder_id = f.id
            WHERE f.clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    );

CREATE POLICY "session_signals_owner" ON session_signals
    FOR ALL USING (
        session_id IN (
            SELECT ms.id FROM mentor_sessions ms
            JOIN founders f ON ms.founder_id = f.id
            WHERE f.clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    );
