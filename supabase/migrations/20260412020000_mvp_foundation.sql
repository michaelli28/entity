-- Fix stage CHECK constraint (add 'idea' and 'series_b_plus')
ALTER TABLE startup_profiles DROP CONSTRAINT IF EXISTS startup_profiles_stage_check;
ALTER TABLE startup_profiles ADD CONSTRAINT startup_profiles_stage_check
    CHECK (stage IN ('idea', 'pre_seed', 'seed', 'series_a', 'series_b_plus'));

-- Missing founder columns
ALTER TABLE founders ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE founders ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE founders ADD COLUMN IF NOT EXISTS github_username TEXT;
ALTER TABLE founders ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
ALTER TABLE founders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE founders ADD COLUMN IF NOT EXISTS what_would_make_10x TEXT;
ALTER TABLE founders ADD COLUMN IF NOT EXISTS company_id UUID;

CREATE INDEX IF NOT EXISTS idx_founders_company ON founders(company_id) WHERE deleted_at IS NULL;

-- UNIQUE partial index on startup_profiles.founder_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_startup_profiles_one_per_founder
    ON startup_profiles (founder_id) WHERE deleted_at IS NULL;

-- updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS founders_set_updated_at ON founders;
CREATE TRIGGER founders_set_updated_at BEFORE UPDATE ON founders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS startup_profiles_set_updated_at ON startup_profiles;
CREATE TRIGGER startup_profiles_set_updated_at BEFORE UPDATE ON startup_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Partial message metadata (error recovery)
ALTER TABLE mentor_messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Webhook idempotency
CREATE TABLE IF NOT EXISTS processed_webhooks (
    event_id TEXT PRIMARY KEY,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Disable RLS (app-layer isolation; see ADR)
ALTER TABLE founders DISABLE ROW LEVEL SECURITY;
ALTER TABLE startup_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_signals DISABLE ROW LEVEL SECURITY;
ALTER TABLE signal_scores DISABLE ROW LEVEL SECURITY;

-- Empirical data tables (populated Day 2)
CREATE TABLE IF NOT EXISTS founder_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_key TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    source TEXT,
    confidence_tier TEXT CHECK (confidence_tier IN ('speculative','widely_accepted','evidence_backed')),
    when_it_fails TEXT,
    applies_to_stages TEXT[] DEFAULT ARRAY['pre_seed','seed']::TEXT[],
    applies_to_categories TEXT[],
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stage_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage TEXT NOT NULL,
    metric_key TEXT NOT NULL,
    metric_value JSONB NOT NULL,
    category TEXT,
    evidence_notes TEXT,
    UNIQUE(stage, metric_key, category)
);

CREATE TABLE IF NOT EXISTS mentor_evals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eval_name TEXT UNIQUE NOT NULL,
    context JSONB NOT NULL,
    founder_input TEXT NOT NULL,
    ideal_response_traits JSONB NOT NULL,
    eval_category TEXT
);

CREATE INDEX IF NOT EXISTS idx_founder_patterns_stages
    ON founder_patterns USING GIN(applies_to_stages);
