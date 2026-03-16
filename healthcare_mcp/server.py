"""
Healthcare Knowledge MCP Server
================================
Exposes three tools via the Model Context Protocol (MCP):

  • search_medical_docs        – vector similarity search over uploaded docs
  • get_medical_reference_ranges – standard lab/clinical reference values
  • get_document_sections      – full page-ordered content of a named document

The server provides *context only*; it does NOT generate medical advice.

Run:
    python server.py
"""

import logging
import os
import sys

# ── Ensure intra-package imports resolve when run as a script ─────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from mcp.server.fastmcp import FastMCP

from tools.document_sections import register_tools as register_document_sections
from tools.reference_ranges import register_tools as register_reference_ranges
from tools.search_docs import register_tools as register_search_docs

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)-40s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── MCP Server ────────────────────────────────────────────────────────────────
mcp = FastMCP(
    name="Healthcare Knowledge MCP",
    instructions=(
        "You are a healthcare document assistant backed by a vector database "
        "of medical documents. Use the provided tools to surface relevant "
        "document context and clinical reference ranges. "
        "Do NOT generate final diagnoses or prescriptions — provide structured "
        "context only so the clinician or user can make informed decisions."
    ),
)

# ── Register Tools ────────────────────────────────────────────────────────────
register_search_docs(mcp)
register_reference_ranges(mcp)
register_document_sections(mcp)

logger.info("Registered tools: search_medical_docs, get_medical_reference_ranges, get_document_sections, list_documents")

# ── Entrypoint ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    logger.info("Starting Healthcare Knowledge MCP server …")
    mcp.run()
