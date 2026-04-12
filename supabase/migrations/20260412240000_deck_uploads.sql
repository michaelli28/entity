CREATE TABLE IF NOT EXISTS deck_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    founder_id UUID NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size_bytes INT NOT NULL,
    pdf_bytes BYTEA NOT NULL,
    extracted_sections JSONB,
    extraction_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (extraction_status IN ('pending', 'processing', 'done', 'failed')),
    extraction_error TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    extracted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_deck_uploads_founder
    ON deck_uploads (founder_id, uploaded_at DESC);
