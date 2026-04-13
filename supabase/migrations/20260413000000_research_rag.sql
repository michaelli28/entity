-- RAG: Research papers + chunk embeddings for grounding the mentor.
-- pgvector is already enabled in init migration; CREATE EXTENSION is a safety no-op.

CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA extensions;

-- Papers: one row per ingested PDF. Uniqueness by (sha256, chunking_version)
-- so a change in chunking strategy forces a re-ingest of unchanged PDFs.
CREATE TABLE research_papers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    authors TEXT,
    source_path TEXT NOT NULL,
    sha256 TEXT NOT NULL,
    chunking_version INT NOT NULL DEFAULT 1,
    chunk_count INT NOT NULL DEFAULT 0,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_research_papers_sha_version
    ON research_papers (sha256, chunking_version);
CREATE UNIQUE INDEX idx_research_papers_source_path
    ON research_papers (source_path);

-- Chunks: content + 1536-d embeddings (OpenAI text-embedding-3-small).
-- No HNSW — at our scale (~500 chunks) sequential scan is sub-5ms and
-- avoids index tuning. Revisit at 50k+ chunks.
CREATE TABLE research_chunks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paper_id UUID NOT NULL REFERENCES research_papers(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    section TEXT,
    content TEXT NOT NULL,
    token_count INT NOT NULL,
    embedding extensions.vector(1536) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_research_chunks_paper_index
    ON research_chunks (paper_id, chunk_index);
CREATE INDEX idx_research_chunks_paper_id
    ON research_chunks (paper_id);

-- RLS: service role only. Chunks reach authenticated users through the API
-- as truncated citation snippets (see backend/src/api/schemas/citations.py),
-- never via direct DB access.
ALTER TABLE research_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_chunks ENABLE ROW LEVEL SECURITY;
