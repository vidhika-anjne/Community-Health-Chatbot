"""
tools/document_sections.py
---------------------------
MCP tools: get_document_sections, list_documents

Fetches chunks from the `kb_chunks` table in the existing `health_chatbot`
database, ordered by chunk_index. Supports both PDF uploads (matched by
`pdf_file_name`) and manually created articles (matched by `document_id`).
"""

import logging
from typing import Any

from mcp.server.fastmcp import FastMCP

from db.postgres_client import get_document_chunks, list_documents

logger = logging.getLogger(__name__)


def register_tools(mcp: FastMCP) -> None:
    """Register document section tools with the MCP server instance."""

    @mcp.tool()
    def get_document_sections(document_name: str) -> dict[str, Any]:
        """
        Fetch all sections (chunks) of an uploaded medical document in order.

        Searches the `kb_chunks` table by `pdf_file_name` or `document_id`
        using a case-insensitive partial match, so "dengue" will match
        "dengue_report_2024.pdf".

        Use this when the user requests a summary, overview, or full review
        of a specific uploaded document.

        Args:
            document_name: Full or partial PDF filename, or document_id UUID
                           (e.g., "dengue_report.pdf" or "discharge_summary").

        Returns:
            {
              "document": "dengue_report.pdf",
              "sections": [
                {"chunk": 1, "title": "Dengue Overview", "text": "..."},
                {"chunk": 2, "title": "Prevention",      "text": "..."},
                ...
              ]
            }
        """
        logger.info(
            "Tool called: get_document_sections | document_name=%r", document_name
        )

        chunks = get_document_chunks(document_name)
        sections = [
            {
                "chunk": row["chunk_index"],
                "title": row["title"] or "",
                "text":  row["content"],
            }
            for row in chunks
        ]

        logger.info(
            "get_document_sections → %d section(s) for document=%r",
            len(sections),
            document_name,
        )

        return {
            "document": document_name,
            "sections": sections,
        }

    @mcp.tool()
    def list_documents() -> dict[str, Any]:
        """
        Return the list of all uploaded documents stored in the knowledge base.

        Use this when the user asks what documents are available, or before
        calling get_document_sections to find the exact document name.

        Returns:
            {
              "documents": [
                {"name": "dengue_report.pdf", "document_id": "uuid-...", "chunks": 12},
                ...
              ]
            }
        """
        logger.info("Tool called: list_documents")

        from db.postgres_client import list_documents as _list
        rows = _list()
        docs = [
            {
                "name":        row["pdf_file_name"],
                "document_id": row["document_id"],
                "chunks":      row["chunk_count"],
            }
            for row in rows
        ]

        logger.info("list_documents → %d document(s)", len(docs))
        return {"documents": docs}
