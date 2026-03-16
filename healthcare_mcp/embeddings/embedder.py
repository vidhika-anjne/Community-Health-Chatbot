"""
embeddings/embedder.py
----------------------
Singleton wrapper around a sentence-transformers model.

The model is loaded once on first use and reused across all tool calls,
avoiding the expensive model-load penalty on every request.
"""

import logging
from typing import Optional

import numpy as np
from sentence_transformers import SentenceTransformer

from config import EMBEDDING_MODEL

logger = logging.getLogger(__name__)

_model: Optional[SentenceTransformer] = None


def _get_model() -> SentenceTransformer:
    """Load and cache the SentenceTransformer model (lazy singleton)."""
    global _model
    if _model is None:
        logger.info("Loading embedding model: %s", EMBEDDING_MODEL)
        _model = SentenceTransformer(EMBEDDING_MODEL)
        logger.info(
            "Embedding model loaded. Dimension: %d",
            _model.get_sentence_embedding_dimension(),
        )
    return _model


def embed_query(text: str) -> np.ndarray:
    """
    Generate a normalized float32 embedding vector for the given text.

    Normalization ensures cosine similarity equals the dot product, which
    aligns with the `vector_cosine_ops` index in PostgreSQL.

    Args:
        text: The input text to embed.

    Returns:
        A float32 numpy array of shape (embedding_dim,).
    """
    model = _get_model()
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.astype(np.float32)
