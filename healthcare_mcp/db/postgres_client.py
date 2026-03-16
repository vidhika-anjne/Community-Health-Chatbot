"""
db/postgres_client.py
---------------------
Thread-safe PostgreSQL connection pool and query helpers.

Connects to the SAME `health_chatbot` PostgreSQL database used by the
Java Spring Boot backend.  The backend stores embeddings as comma-separated
TEXT in `kb_chunks.embedding_json`, so cosine similarity is computed
in-memory in Python — exactly the same strategy the Java ChatService uses.
"""

import atexit
import logging
from contextlib import contextmanager
from typing import Generator, Optional

import numpy as np
import psycopg2
import psycopg2.extras
import psycopg2.pool

from config import (
    DB_HOST,
    DB_MAX_CONNECTIONS,
    DB_MIN_CONNECTIONS,
    DB_NAME,
    DB_PASSWORD,
    DB_PORT,
    DB_USER,
    SIMILARITY_THRESHOLD,
    SIMILARITY_TOP_K,
)

logger = logging.getLogger(__name__)

_pool: Optional[psycopg2.pool.ThreadedConnectionPool] = None


# ── Pool management ────────────────────────────────────────────────────────────

def _get_pool() -> psycopg2.pool.ThreadedConnectionPool:
    """Return the singleton connection pool, creating it on first call."""
    global _pool
    if _pool is None:
        _pool = psycopg2.pool.ThreadedConnectionPool(
            minconn=DB_MIN_CONNECTIONS,
            maxconn=DB_MAX_CONNECTIONS,
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
        )
        logger.info(
            "PostgreSQL connection pool created. host=%s db=%s pool=[%d-%d]",
            DB_HOST, DB_NAME, DB_MIN_CONNECTIONS, DB_MAX_CONNECTIONS,
        )
    return _pool


def _close_pool() -> None:
    """Close all connections in the pool. Registered with atexit."""
    global _pool
    if _pool is not None:
        _pool.closeall()
        _pool = None
        logger.info("PostgreSQL connection pool closed.")


atexit.register(_close_pool)


@contextmanager
def get_connection() -> Generator:
    """
    Thread-safe context manager that checks out a connection from the pool.
    Commits on success, rolls back on exception.
    """
    pool = _get_pool()
    conn = pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _parse_embedding(embedding_json: str) -> Optional[np.ndarray]:
    """
    Parse the comma-separated float TEXT stored by the Java app into a
    float32 numpy array. Returns None if the string is empty or malformed.
    """
    try:
        values = [float(v) for v in embedding_json.split(",") if v.strip()]
        return np.array(values, dtype=np.float32) if values else None
    except ValueError:
        return None


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """
    Dot-product cosine similarity.  Both vectors are L2-normalised by
    all-MiniLM-L6-v2, so dot product == cosine similarity (range 0–1).
    """
    dot = float(np.dot(a, b))
    denom = float(np.linalg.norm(a) * np.linalg.norm(b))
    return dot / denom if denom > 0 else 0.0


# ── Query helpers ──────────────────────────────────────────────────────────────

def similarity_search(
    query_embedding: np.ndarray,
    limit: int = SIMILARITY_TOP_K,
    threshold: float = SIMILARITY_THRESHOLD,
) -> list[dict]:
    """
    In-memory cosine-similarity search over the `kb_chunks` table.

    Mirrors the logic in ChatService.java: load all rows that have an
    embedding, score each one, filter by threshold, return top-k.

    Args:
        query_embedding: Normalised float32 query vector (384 dims).
        limit:           Maximum rows to return.
        threshold:       Minimum similarity score (default 0.30, same as Java).

    Returns:
        List of dicts with keys: title, content, document_id,
        pdf_file_name, chunk_index, similarity.
    """
    sql = """
        SELECT id, title, content, document_id, pdf_file_name, chunk_index, embedding_json
        FROM kb_chunks
        WHERE embedding_json IS NOT NULL AND embedding_json <> '';
    """
    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql)
            rows = cur.fetchall()

    scored = []
    for row in rows:
        vec = _parse_embedding(row["embedding_json"])
        if vec is None:
            continue
        sim = _cosine_similarity(query_embedding, vec)
        if sim >= threshold:
            scored.append({
                "title":         row["title"],
                "content":       row["content"],
                "document_id":   row["document_id"],
                "pdf_file_name": row["pdf_file_name"],
                "chunk_index":   row["chunk_index"],
                "similarity":    sim,
            })

    scored.sort(key=lambda x: x["similarity"], reverse=True)
    return scored[:limit]


def get_document_chunks(document_name: str) -> list[dict]:
    """
    Retrieve all text chunks for a document, ordered by chunk_index.

    Searches by `pdf_file_name` (ILIKE, partial match) OR by `document_id`
    (exact match) so both PDF uploads and manually-created articles work.

    Args:
        document_name: Full or partial PDF filename, OR a document_id UUID.

    Returns:
        List of dicts with keys: chunk_index, title, content.
    """
    sql = """
        SELECT chunk_index, title, content, pdf_file_name, document_id
        FROM kb_chunks
        WHERE pdf_file_name ILIKE %s
           OR document_id  ILIKE %s
        ORDER BY chunk_index ASC NULLS LAST;
    """
    pattern = f"%{document_name}%"
    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, (pattern, pattern))
            rows = cur.fetchall()

    return [dict(row) for row in rows]


def list_documents() -> list[dict]:
    """
    Return a distinct list of uploaded documents (PDF files) in the database.

    Returns:
        List of dicts with keys: pdf_file_name, document_id, chunk_count.
    """
    sql = """
        SELECT
            pdf_file_name,
            document_id,
            COUNT(*) AS chunk_count
        FROM kb_chunks
        WHERE pdf_file_name IS NOT NULL AND pdf_file_name <> ''
        GROUP BY pdf_file_name, document_id
        ORDER BY pdf_file_name ASC;
    """
    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql)
            rows = cur.fetchall()

    return [dict(row) for row in rows]
