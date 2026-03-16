# Healthcare Knowledge MCP Server

A production-ready **Model Context Protocol (MCP)** server in Python that exposes tools allowing LLM clients to retrieve and interpret healthcare documents stored in PostgreSQL with pgvector embeddings.

---

## Project Structure

```
healthcare_mcp/
├── server.py                  # FastMCP entrypoint — run this
├── config.py                  # All config loaded from .env
├── requirements.txt
├── .env.example               # Copy to .env and fill in values
│
├── db/
│   ├── __init__.py
│   ├── postgres_client.py     # Thread-safe connection pool + query helpers
│   └── setup.sql              # One-time DB schema + index creation
│
├── embeddings/
│   ├── __init__.py
│   └── embedder.py            # Lazy-loaded SentenceTransformer singleton
│
└── tools/
    ├── __init__.py
    ├── search_docs.py         # Tool: search_medical_docs
    ├── reference_ranges.py    # Tool: get_medical_reference_ranges
    └── document_sections.py  # Tool: get_document_sections
```

---

## Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.10+ |
| PostgreSQL | 14+ |
| pgvector extension | 0.5+ |

---

## Setup

### 1. Clone / navigate to the project

```bash
cd healthcare_mcp
```

### 2. Create and activate a virtual environment

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

The MCP server shares the **same `.env` file** as the Java backend. If you already have one in `demo/`, just copy it here (or symlink it). Otherwise:

```bash
cp .env.example .env
```

Edit `.env` — use the same keys as the Java app:

```env
# Same format as the Java Spring Boot backend
DB_URL=jdbc:postgresql://localhost:5432/health_chatbot
DB_USER=postgres
DB_PASSWORD=your_password_here

# Optional: MCP-specific tuning
SIMILARITY_TOP_K=5
SIMILARITY_THRESHOLD=0.30
```

### 5. No database setup needed

The MCP server connects to the **same `health_chatbot` database** used by the Java Spring Boot backend. Hibernate manages the schema automatically when the Java app starts.

> Just make sure the Java app has been run at least once so the `kb_chunks` table exists and contains seeded data. Then point the MCP server at the same database via `DB_URL`.

---

## Running the Server

```bash
python server.py
```

You should see output like:

```
2026-03-11 10:00:00 | INFO | __main__ | Registered tools: search_medical_docs, get_medical_reference_ranges, get_document_sections, list_documents
2026-03-11 10:00:00 | INFO | __main__ | Starting Healthcare Knowledge MCP server …
```

The server starts an MCP endpoint (stdio transport by default) that LLM clients can connect to.

---

## MCP Tools

### `search_medical_docs`

Semantic similarity search over the `kb_chunks` table. Embeds the query with all-MiniLM-L6-v2 (same model as the Java app) and computes cosine similarity in-memory, mirroring `ChatService.java`.

**Input:**
```json
{ "query": "signs of hypertension" }
```

**Output:**
```json
{
  "results": [
    { "title": "Dengue Awareness", "text": "...", "document": "dengue.pdf", "chunk": 1, "similarity": 0.87 }
  ]
}
```

---

### `get_medical_reference_ranges`

Returns standard clinical reference ranges. No input required.

**Output includes:** blood pressure, LDL/HDL/total cholesterol, triglycerides, fasting/postprandial blood sugar, HbA1c, hemoglobin, BMI, creatinine, TSH, WBC, platelet count.

---

### `get_document_sections`

Fetches all chunks of a document ordered by `chunk_index`. Supports partial, case-insensitive name matching on `pdf_file_name` or `document_id`.

**Input:**
```json
{ "document_name": "dengue_report.pdf" }
```

**Output:**
```json
{
  "document": "dengue_report.pdf",
  "sections": [
    { "chunk": 1, "title": "Dengue Overview", "text": "..." },
    { "chunk": 2, "title": "Prevention",      "text": "..." }
  ]
}
```

---

### `list_documents`

Lists all uploaded PDF documents in the knowledge base. No input required.

**Output:**
```json
{
  "documents": [
    { "name": "dengue_report.pdf", "document_id": "uuid-...", "chunks": 12 }
  ]
}
```

---

## Database Schema (managed by Java backend)

The MCP server queries the `kb_chunks` table created and maintained by the Java Spring Boot app via Hibernate:

```sql
-- kb_chunks (JPA entity: Article)
id              BIGSERIAL PRIMARY KEY
document_id     VARCHAR(255)   -- groups all chunks from one PDF
chunk_index     INT            -- 1-based order within document
title           VARCHAR(255)
content         TEXT
embedding_json  TEXT           -- comma-separated floats (all-MiniLM-L6-v2, 384 dims)
pdf_file_name   VARCHAR(255)
pdf_file_path   VARCHAR(255)
verified        BOOLEAN
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

Embeddings are stored as plain TEXT (comma-separated floats) — **pgvector is NOT required**. Similarity is computed in-memory exactly as the Java `ChatService` does.

---

## Performance Notes

- The embedding model is loaded **once** at server start and reused across all requests (singleton pattern).
- Connections are managed via a **thread-safe pool** (`ThreadedConnectionPool`), released cleanly on shutdown via `atexit`.
- For very large knowledge bases (100k+ chunks), consider adding a pgvector column to enable index-based similarity search instead of in-memory scoring.

---

## Extending the Server

To add a new tool:

1. Create `tools/my_new_tool.py` with a `register_tools(mcp: FastMCP)` function.
2. Decorate your function with `@mcp.tool()` inside it.
3. Import and call `register_tools(mcp)` in `server.py`.

That's it — no other changes needed.
