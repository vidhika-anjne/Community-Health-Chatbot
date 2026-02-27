package com.communityHealth.Health_Info.service;

import com.communityHealth.Health_Info.model.Article;
import com.communityHealth.Health_Info.model.ChatMessage;
import com.communityHealth.Health_Info.model.ChatSession;
import com.communityHealth.Health_Info.repository.ArticleRepository;
import com.communityHealth.Health_Info.repository.ChatSessionRepository;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatSessionRepository sessionRepository;
    private final ArticleRepository articleRepository;
    private final EmbeddingModel embeddingModel;        // all-MiniLM-L6-v2 (384d)
    private final ChatLanguageModel chatLanguageModel;  // Ollama (e.g. llama3)

    // Chunks with cosine similarity below this threshold are ignored.
    // all-MiniLM produces normalised vectors, so 1.0 = identical, 0.0 = unrelated.
    private static final float SIMILARITY_THRESHOLD = 0.30f;
    // How many top-matching chunks to feed as context to the LLM.
    private static final int TOP_K = 3;

    @Transactional
    public String generateResponse(String sessionId, String userQuestion) {

        // ── STEP 1: Persist / retrieve the chat session ──────────────────────────
        ChatSession session = sessionRepository.findAll().stream()
                .filter(s -> s.getSessionId() != null && s.getSessionId().equals(sessionId))
                .findFirst()
                .orElse(ChatSession.builder().sessionId(sessionId).build());

        // ── STEP 2: Embed the user's question ────────────────────────────────────
        // The SAME model (all-MiniLM-L6-v2) that was used to embed the PDF chunks
        // is used here, so the vectors live in the same 384-dimensional space and
        // are directly comparable.
        float[] queryVector = embeddingModel.embed(userQuestion).content().vector();

        // ── STEP 3: Retrieve top-K chunks by cosine similarity ───────────────────
        // For every stored chunk we parse its embedding back from the comma-separated
        // TEXT column, compute the dot-product with the query vector
        // (valid as cosine similarity because MiniLM L2-normalises all vectors),
        // and keep only chunks that exceed the relevance threshold.
        List<Article> topChunks = articleRepository.findAll().stream()
                .filter(a -> a.getEmbeddingJson() != null && !a.getEmbeddingJson().isBlank())
                .map(a -> new ScoredArticle(a, cosineSimilarity(parseEmbedding(a.getEmbeddingJson()), queryVector)))
                .filter(sa -> sa.score >= SIMILARITY_THRESHOLD)
                .sorted(Comparator.comparingDouble(ScoredArticle::score).reversed())
                .limit(TOP_K)
                .map(ScoredArticle::article)
                .collect(Collectors.toList());

        // ── STEP 4: Build the RAG prompt ─────────────────────────────────────────
        // If no chunks crossed the threshold we still answer, but without context
        // so the LLM gives a general safe response rather than hallucinating.
        String aiResponse;

        if (topChunks.isEmpty()) {
            aiResponse = chatLanguageModel.generate(
                    SystemMessage.from(
                        "You are a friendly Public Health Assistant for community disease awareness. "
                        + "You are NOT a doctor and must always recommend consulting a health professional for personal medical advice. "
                        + "Answer in simple, clear, conversational language suitable for a general audience. "
                        + "Do NOT use markdown, bullet points, bold text, numbered lists, asterisks, or any special formatting. "
                        + "Write in plain prose only."
                        + "If the question is unrelated to health or the provided documents,\n" 
                        + "respond with: \"This question is outside my domain.\""),
                    UserMessage.from(userQuestion)
            ).content().text();
        } else {
            String context = topChunks.stream()
                    .map(a -> "[" + a.getTitle() + "]\n" + a.getContent())
                    .collect(Collectors.joining("\n\n---\n\n"));

            aiResponse = chatLanguageModel.generate(
                    SystemMessage.from(
                        "You are a Public Health Assistant for community disease awareness. "
                        + "You are NOT a doctor. Always recommend consulting a health professional for personal medical advice. "
                        + "Answer ONLY using the information in the CONTEXT below. "
                        + "If the context does not contain enough information to answer, say so clearly instead of guessing. "
                        + "Write in plain, conversational prose. "
                        + "Do NOT use markdown, bullet points, bold text, numbered lists, asterisks, hyphens as list markers, or any special formatting symbols. "
                        + "Just write normal sentences and paragraphs.\n\n"
                        + "CONTEXT:\n" + context),
                    UserMessage.from(userQuestion)
            ).content().text();
        }

        // Strip DeepSeek-R1 chain-of-thought tags (e.g. <think>...</think>)
        aiResponse = aiResponse.replaceAll("(?s)<think>.*?</think>", "").trim();

        // Strip any residual markdown the model still produces
        aiResponse = aiResponse
                .replaceAll("\\*{1,3}([^*]+)\\*{1,3}", "$1")  // **bold** / *italic*
                .replaceAll("(?m)^\\s*[-*+]\\s+", "")          // bullet list markers
                .replaceAll("(?m)^\\s*\\d+\\.\\s+", "")        // numbered list markers
                .replaceAll("#{1,6}\\s+", "")                   // headings
                .replaceAll("\\n{3,}", "\n\n")                  // extra blank lines
                .trim();

        // ── STEP 5: Persist the exchange ─────────────────────────────────────────
        ChatMessage userMsg = ChatMessage.builder()
                .session(session).sender("USER").content(userQuestion).build();
        ChatMessage botMsg = ChatMessage.builder()
                .session(session).sender("BOT").content(aiResponse).build();
        session.getMessages().add(userMsg);
        session.getMessages().add(botMsg);
        sessionRepository.save(session);

        return aiResponse;
    }

    public List<ChatMessage> getSessionTranscript(String sessionId) {
        return sessionRepository.findAll().stream()
                .filter(s -> s.getSessionId().equals(sessionId))
                .findFirst()
                .map(ChatSession::getMessages)
                .orElse(List.of());
    }

    // ── Embedding helpers ─────────────────────────────────────────────────────

    /** Parses a comma-separated float string back to a float[]. */
    private static float[] parseEmbedding(String csv) {
        String[] parts = csv.split(",");
        float[] v = new float[parts.length];
        for (int i = 0; i < parts.length; i++) v[i] = Float.parseFloat(parts[i].trim());
        return v;
    }

    /**
     * Dot-product == cosine similarity when both vectors are L2-normalised.
     * all-MiniLM-L6-v2 always returns unit-length vectors, so this is exact.
     */
    private static float cosineSimilarity(float[] a, float[] b) {
        float dot = 0f;
        int len = Math.min(a.length, b.length);
        for (int i = 0; i < len; i++) dot += a[i] * b[i];
        return dot;
    }

    /** Tiny value-object so we can sort articles by their similarity score. */
    private record ScoredArticle(Article article, float score) {}
}
