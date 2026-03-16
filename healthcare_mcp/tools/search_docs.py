"""
tools/search_docs.py
--------------------
MCP tool: search_medical_docs

Performs in-memory cosine-similarity search over the `kb_chunks` table in
the existing `health_chatbot` PostgreSQL database.

Mirrors the RAG logic in ChatService.java: embeddings are stored as
comma-separated TEXT, scored in Python, filtered by a threshold, and the
top-k results are returned.
"""

import logging
from typing import Any

from mcp.server.fastmcp import FastMCP

from db.postgres_client import similarity_search
from embeddings.embedder import embed_query

logger = logging.getLogger(__name__)


def register_tools(mcp: FastMCP) -> None:
    """Register the search_medical_docs tool with the MCP server instance."""

    @mcp.tool()
    def search_medical_docs(query: str) -> dict[str, Any]:
        """
        Perform semantic similarity search on the healthcare knowledge base.

        Embeds the query with all-MiniLM-L6-v2 (same model used by the Java
        backend) and computes cosine similarity against all stored chunks in
        `kb_chunks`. Returns the top-k most relevant chunks above the
        similarity threshold (default 0.30).

        Use this when the user asks about medical topics, symptoms, treatments,
        medications, diseases, or any healthcare question that may be answered
        by documents uploaded by the admin.

        Args:
            query: Natural language search query
                   (e.g. "signs of hypertension", "dengue prevention tips").

        Returns:
            {
              "results": [
                {
                  "title":      "Dengue Awareness & Prevention",
                  "text":       "...",
                  "document":   "dengue_report.pdf",
                  "chunk":      1,
                  "similarity": 0.87
                },
                ...
              ]
            }
        """
        logger.info("Tool called: search_medical_docs | query=%r", query)

        query_embedding = embed_query(query)
        rows = similarity_search(query_embedding)

        results = [
            {
                "title":      row["title"] or "",
                "text":       row["content"],
                "document":   row["pdf_file_name"] or row["document_id"] or "",
                "chunk":      row["chunk_index"],
                "similarity": round(float(row["similarity"]), 4),
            }
            for row in rows
        ]

        logger.info(
            "search_medical_docs → %d result(s) for query=%r", len(results), query
        )
        return {"results": results}
