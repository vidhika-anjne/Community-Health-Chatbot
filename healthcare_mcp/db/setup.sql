-- =============================================================================
-- Healthcare MCP Server — Existing Database Reference
-- =============================================================================
-- This file documents the schema of the `health_chatbot` PostgreSQL database
-- that is managed by the Java Spring Boot backend.
--
-- DO NOT run this script to create the tables — the Java app (Hibernate
-- ddl-auto=update) creates and maintains them automatically on startup.
--
-- This file is provided for reference only, so you understand the structure
-- the MCP server queries.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: kb_chunks  (JPA entity: Article)
-- Stores all knowledge-base text chunks, including those extracted from
-- uploaded PDFs and manually created articles.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kb_chunks (
    id                BIGSERIAL    PRIMARY KEY,
    document_id       VARCHAR(255),          -- groups all chunks from one PDF
    chunk_index       INT,                   -- 1-based position within document
    title             VARCHAR(255),
    content           TEXT,
    target_age_group  VARCHAR(255),
    language          VARCHAR(255),
    verified          BOOLEAN      NOT NULL DEFAULT FALSE,
    article_references VARCHAR(255),
    -- Embedding stored as comma-separated floats (all-MiniLM-L6-v2, 384 dims)
    -- Cosine similarity is computed in-memory; no pgvector extension required.
    embedding_json    TEXT,
    pdf_file_path     VARCHAR(255),          -- absolute path of original PDF
    pdf_file_name     VARCHAR(255),          -- original upload filename
    created_at        TIMESTAMP,
    updated_at        TIMESTAMP
);

-- Tags stored in a separate @ElementCollection join table
CREATE TABLE IF NOT EXISTS kb_chunks_tags (
    article_id  BIGINT REFERENCES kb_chunks(id) ON DELETE CASCADE,
    tags        VARCHAR(255)
);

-- Optional index to speed up document-level lookups
CREATE INDEX IF NOT EXISTS kb_chunks_document_id_idx
    ON kb_chunks (document_id);

CREATE INDEX IF NOT EXISTS kb_chunks_pdf_file_name_idx
    ON kb_chunks (pdf_file_name);

-- -----------------------------------------------------------------------------
-- Table: chat_session  (JPA entity: ChatSession)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_session (
    id                   BIGSERIAL PRIMARY KEY,
    session_id           VARCHAR(255),
    topic                VARCHAR(255),
    region               VARCHAR(255),
    satisfaction_rating  INT,
    start_time           TIMESTAMP,
    end_time             TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- Table: chat_message  (JPA entity: ChatMessage)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_message (
    id               BIGSERIAL PRIMARY KEY,
    session_id       BIGINT REFERENCES chat_session(id),
    sender           VARCHAR(255),   -- 'USER' or 'BOT'
    content          TEXT,
    timestamp        TIMESTAMP,
    harmful_flagged  BOOLEAN DEFAULT FALSE
);

-- -----------------------------------------------------------------------------
-- Table: cluster_analysis_results  (JPA entity: ClusterAnalysisResult)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cluster_analysis_results (
    id               BIGSERIAL PRIMARY KEY,
    results_json     TEXT         NOT NULL,
    queries_analyzed BIGINT,
    analyzed_at      TIMESTAMP
);
