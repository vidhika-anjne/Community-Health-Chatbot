"""
config.py
---------
Central configuration loaded from environment variables.

Uses the SAME env keys as the Java Spring Boot backend so both services
can share a single .env file:
  DB_URL      – JDBC URL, e.g. jdbc:postgresql://localhost:5432/health_chatbot
  DB_USER     – PostgreSQL username
  DB_PASSWORD – PostgreSQL password
"""

import os
import re
from dotenv import load_dotenv

# Load .env from the healthcare_mcp directory (or its parent demo/ dir)
load_dotenv()  # searches upward automatically

# ── Parse JDBC URL ────────────────────────────────────────────────────────────
# Java uses jdbc:postgresql://host:port/dbname[?params]
# We extract host / port / dbname so psycopg2 can connect directly.
_jdbc_url: str = os.getenv("DB_URL", "jdbc:postgresql://localhost:5432/health_chatbot")
_match = re.match(r"jdbc:postgresql://([^:/]+)(?::(\d+))?/([^?]+)", _jdbc_url)

DB_HOST: str = _match.group(1) if _match else "localhost"
DB_PORT: int = int(_match.group(2)) if (_match and _match.group(2)) else 5432
DB_NAME: str = _match.group(3).strip("/") if _match else "health_chatbot"
DB_USER: str = os.getenv("DB_USER", "postgres")
DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")

# ── Connection Pool ────────────────────────────────────────────────────────────
DB_MIN_CONNECTIONS: int = int(os.getenv("DB_MIN_CONNECTIONS", "1"))
DB_MAX_CONNECTIONS: int = int(os.getenv("DB_MAX_CONNECTIONS", "10"))

# ── Embeddings ─────────────────────────────────────────────────────────────────
# Must match the model the Java app uses: all-MiniLM-L6-v2 (384 dimensions).
# Changing this would make the stored embeddings incompatible.
EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

# ── Search ─────────────────────────────────────────────────────────────────────
SIMILARITY_TOP_K: int = int(os.getenv("SIMILARITY_TOP_K", "5"))
# Mirror the Java app threshold: discard chunks below this cosine similarity.
SIMILARITY_THRESHOLD: float = float(os.getenv("SIMILARITY_THRESHOLD", "0.30"))
