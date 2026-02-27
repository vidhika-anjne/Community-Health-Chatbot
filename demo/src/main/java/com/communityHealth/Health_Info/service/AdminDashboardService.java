package com.communityHealth.Health_Info.service;

import com.communityHealth.Health_Info.model.Article;
import com.communityHealth.Health_Info.model.ChatMessage;
import com.communityHealth.Health_Info.model.ClusterAnalysisResult;
import com.communityHealth.Health_Info.repository.ArticleRepository;
import com.communityHealth.Health_Info.repository.ChatMessageRepository;
import com.communityHealth.Health_Info.repository.ChatSessionRepository;
import com.communityHealth.Health_Info.repository.ClusterAnalysisResultRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminDashboardService {
    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ArticleRepository articleRepository;
    private final EmbeddingModel embeddingModel;
    private final ChatLanguageModel chatLanguageModel;
    private final ClusterAnalysisResultRepository clusterAnalysisResultRepository;
    private final ObjectMapper objectMapper;

    public void processPdfUpload(MultipartFile file, String title, List<String> tags) throws Exception {
        // 1. Save PDF temporarily
        Path tempDir = Files.createTempDirectory("health_pdfs");
        File tempFile = new File(tempDir.toFile(), "upload.pdf");
        file.transferTo(tempFile);

        // 2. Call Python script with pypdf
        // We use "python" or "py" depending on Windows convention, "python" is standard
        File scriptFile = new File("extract_pdf.py");
        if (!scriptFile.exists()) {
            throw new RuntimeException("Python script 'extract_pdf.py' not found at: " + scriptFile.getAbsolutePath());
        }

        ProcessBuilder pb = new ProcessBuilder("python", scriptFile.getName(), tempFile.getAbsolutePath());
        pb.redirectErrorStream(false); // Keep stderr separate so we only parse clean stdout
        pb.directory(new File("."));
        // Force Python to write UTF-8 regardless of Windows console codepage
        pb.environment().put("PYTHONIOENCODING", "utf-8");
        pb.environment().put("PYTHONUTF8", "1");
        Process process = pb.start();

        String extractedText;
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
            extractedText = reader.lines().collect(Collectors.joining("\n"));
        }
        
        // Also drain stderr so the process doesn't block
        String errorOutput;
        try (BufferedReader errReader = new BufferedReader(new InputStreamReader(process.getErrorStream(), StandardCharsets.UTF_8))) {
            errorOutput = errReader.lines().collect(Collectors.joining("\n"));
        }
        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("PDF extraction failed (code " + exitCode + "): " + errorOutput);
        }

        if (extractedText == null || extractedText.isBlank()) {
            throw new RuntimeException("No text could be extracted from the PDF.");
        }

        // 3. Split into chunks and save each with its own embedding
        String documentId = UUID.randomUUID().toString();
        List<String> chunks = chunkText(extractedText, 800);
        int total = chunks.size();
        for (int i = 0; i < total; i++) {
            String chunk = chunks.get(i);

            float[] vector = embeddingModel.embed(chunk).content().vector();
            Article article = Article.builder()
                    .documentId(documentId)
                    .chunkIndex(i + 1)
                    .title(title)
                    .content(chunk)
                    .tags(tags)
                    .embeddingJson(floatArrayToString(vector))
                    .verified(true)
                    .language("English")
                    .createdAt(LocalDateTime.now())
                    .build();
            articleRepository.save(article);
        }

        // Cleanup
        Files.delete(tempFile.toPath());
        Files.delete(tempDir);
    }

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            // Total users (calculated via sessions for simplicity)
            stats.put("totalChats", chatSessionRepository.count());
            stats.put("recentChats", chatSessionRepository.countRecentChats(LocalDateTime.now().minusDays(1)));
            
            // Top 5 topics
            stats.put("topTopics", chatSessionRepository.findTopTopics());
            
            // Helpful / Not helpful average
            Double avg = chatSessionRepository.averageSatisfaction();
            stats.put("helpfulStats", avg != null ? avg : 5.0);
            
            // Verification coverage
            long totalArticles = articleRepository.count();
            long verifiedArticles = articleRepository.findByVerifiedTrue().size();
            stats.put("totalArticles", totalArticles);
            stats.put("verifiedRate", totalArticles > 0 ? (double) verifiedArticles / totalArticles * 100 : 0);
        } catch (Exception e) {
            System.err.println("Error fetching dashboard stats: " + e.getMessage());
            // Provide dummy values if DB is down
            stats.put("totalChats", 0);
            stats.put("recentChats", 0);
            stats.put("topTopics", List.of());
            stats.put("helpfulStats", 5.0);
            stats.put("totalArticles", 0);
            stats.put("verifiedRate", 0);
        }
        
        return stats;
    }

    /**
     * Splits text into semantically coherent chunks using paragraph boundaries.
     * Paragraphs (separated by blank lines) are accumulated until they exceed
     * {@code maxChars}, at which point the current chunk is saved and a new one starts.
     * Long single paragraphs are split at sentence boundaries.
     *
     * @param text     full extracted text
     * @param maxChars soft maximum characters per chunk (all-MiniLM fits ~800 comfortably)
     */
    private static List<String> chunkText(String text, int maxChars) {
        // Normalize line endings
        text = text.replaceAll("\\r\\n", "\n").replaceAll("\\r", "\n");

        // Remove PDF artifacts: lines that contain ONLY a page number or header noise
        // (1-4 digits alone on a line, e.g. the "7" or "23" you saw)
        text = text.replaceAll("(?m)^[ \t]*\\d{1,4}[ \t]*$", "");

        // Collapse 3+ consecutive blank lines into a single paragraph separator
        text = text.replaceAll("\\n{3,}", "\n\n").trim();

        final int MIN_CHUNK = 60; // discard stray headers / footers shorter than this

        // Split on blank lines to get paragraphs
        String[] paragraphs = text.split("\n\n+");

        List<String> chunks = new ArrayList<>();
        StringBuilder current = new StringBuilder();

        for (String para : paragraphs) {
            para = para.trim();
            if (para.isEmpty()) continue;

            // If the paragraph itself exceeds maxChars, split it at sentence boundaries
            if (para.length() > maxChars) {
                // Flush whatever is already accumulated
                if (current.length() >= MIN_CHUNK) {
                    chunks.add(current.toString().trim());
                    current.setLength(0);
                }
                // Sentence-split the large paragraph
                for (String sentence : splitBySentence(para, maxChars)) {
                    if (sentence.length() >= MIN_CHUNK) {
                        chunks.add(sentence.trim());
                    }
                }
                continue;
            }

            // Would adding this paragraph overflow the current chunk?
            if (current.length() > 0 && current.length() + 2 + para.length() > maxChars) {
                if (current.length() >= MIN_CHUNK) {
                    chunks.add(current.toString().trim());
                }
                current.setLength(0);
            }

            if (current.length() > 0) current.append("\n\n");
            current.append(para);
        }

        // Flush the last accumulated chunk
        if (current.length() >= MIN_CHUNK) {
            chunks.add(current.toString().trim());
        }

        return chunks;
    }

    /** Splits a long paragraph into sentence-boundary chunks no longer than {@code maxChars}. */
    private static List<String> splitBySentence(String para, int maxChars) {
        List<String> result = new ArrayList<>();
        StringBuilder buf = new StringBuilder();
        int len = para.length();
        for (int i = 0; i < len; i++) {
            buf.append(para.charAt(i));
            char c = para.charAt(i);
            // Sentence end: . ! ? followed by space or end of string
            if ((c == '.' || c == '!' || c == '?') &&
                    (i + 1 >= len || para.charAt(i + 1) == ' ' || para.charAt(i + 1) == '\n')) {
                if (buf.length() >= 60 || buf.length() > maxChars) {
                    result.add(buf.toString().trim());
                    buf.setLength(0);
                }
            } else if (buf.length() >= maxChars) {
                // No sentence boundary found — break at last space
                int sp = buf.lastIndexOf(" ");
                if (sp > 0) {
                    result.add(buf.substring(0, sp).trim());
                    buf.delete(0, sp + 1);
                } else {
                    result.add(buf.toString().trim());
                    buf.setLength(0);
                }
            }
        }
        if (!buf.isEmpty()) result.add(buf.toString().trim());
        return result;
    }

    // ── Query Clustering ─────────────────────────────────────────────────────────

    /**
     * Embeds every USER message stored in the DB, groups them by semantic similarity
     * using greedy centroid clustering, then asks the LLM to name each cluster.
     *
     * Algorithm:
     *   1. Embed every distinct user query with all-MiniLM-L6-v2 (same model used for KB chunks).
     *   2. Greedy centroid pass: assign each query to the nearest existing centroid if
     *      cosine similarity > CLUSTER_THRESHOLD (0.42), otherwise start a new cluster.
     *      The centroid is updated as a running average after each assignment.
     *   3. Name each cluster by sending a sample of its queries to the LLM in a
     *      single prompt asking for a 2-4 word topic label.
     *   4. Queries that the LLM marks "Out-of-Domain" are collected into one bucket.
     */
    private List<Map<String, Object>> clusterUserQueries() {
        // 1. Fetch distinct user query texts — cap at 200 to keep embedding fast
        List<String> queries = chatMessageRepository.findAllUserMessages().stream()
                .map(ChatMessage::getContent)
                .filter(q -> q != null && !q.isBlank())
                .map(String::toLowerCase)
                .map(String::trim)
                .distinct()
                .limit(200)
                .collect(Collectors.toList());

        if (queries.size() < 2) {
            return List.of();
        }

        // 2. Batch-embed all queries in ONE call (much faster than N individual calls)
        List<TextSegment> segments = queries.stream()
                .map(TextSegment::from)
                .collect(Collectors.toList());
        List<float[]> vectors = embeddingModel.embedAll(segments).content()
                .stream()
                .map(e -> e.vector())
                .collect(Collectors.toList());

        // 3. Greedy centroid clustering
        final float CLUSTER_THRESHOLD = 0.42f;
        List<List<Integer>> clusterIndices = new ArrayList<>();
        List<float[]> centroids = new ArrayList<>();

        for (int i = 0; i < vectors.size(); i++) {
            float[] vec = vectors.get(i);
            int bestCluster = -1;
            float bestSim = CLUSTER_THRESHOLD;

            for (int c = 0; c < centroids.size(); c++) {
                float sim = cosineSimilarity(vec, centroids.get(c));
                if (sim > bestSim) {
                    bestSim = sim;
                    bestCluster = c;
                }
            }

            if (bestCluster == -1) {
                List<Integer> newCluster = new ArrayList<>();
                newCluster.add(i);
                clusterIndices.add(newCluster);
                centroids.add(Arrays.copyOf(vec, vec.length));
            } else {
                List<Integer> cluster = clusterIndices.get(bestCluster);
                cluster.add(i);
                centroids.set(bestCluster, averageVector(centroids.get(bestCluster), vec, cluster.size()));
            }
        }

        // 4. Name ALL clusters in a SINGLE LLM call
        StringBuilder promptBuilder = new StringBuilder(
            "You are classifying topic clusters from a community health chatbot.\n\n");
        for (int c = 0; c < clusterIndices.size(); c++) {
            List<String> sample = clusterIndices.get(c).stream()
                    .map(queries::get)
                    .limit(4)
                    .collect(Collectors.toList());
            promptBuilder.append("Cluster ").append(c + 1).append(":\n");
            sample.forEach(q -> promptBuilder.append("  - ").append(q).append("\n"));
            promptBuilder.append("\n");
        }
        promptBuilder.append(
            "Give each cluster a short 2-4 word health topic name.\n"
            + "If a cluster is clearly unrelated to health, use \"Out-of-Domain\".\n"
            + "Reply ONLY in this exact format with no extra text:\n");
        for (int c = 0; c < clusterIndices.size(); c++) {
            promptBuilder.append("Cluster ").append(c + 1).append(": <name>\n");
        }

        String llmResponse = chatLanguageModel.generate(
                UserMessage.from(promptBuilder.toString())
        ).content().text()
                .replaceAll("(?s)<think>.*?</think>", "")
                .replaceAll("[*#`\"']", "")
                .trim();

        // Parse lines like "Cluster 1: Fever Management"
        Map<Integer, String> nameByIndex = new HashMap<>();
        for (String line : llmResponse.split("\\r?\\n")) {
            line = line.trim();
            if (line.matches("(?i)cluster\\s+\\d+:.*")) {
                int colon = line.indexOf(':');
                String numStr = line.substring(7, colon).trim();
                try {
                    int idx = Integer.parseInt(numStr) - 1;
                    nameByIndex.put(idx, line.substring(colon + 1).trim());
                } catch (NumberFormatException ignored) {}
            }
        }

        // 5. Build result list
        List<Map<String, Object>> result = new ArrayList<>();
        List<String> outOfDomainQueries = new ArrayList<>();

        for (int c = 0; c < clusterIndices.size(); c++) {
            List<String> clusterQueries = clusterIndices.get(c).stream()
                    .map(queries::get)
                    .collect(Collectors.toList());
            String clusterName = nameByIndex.getOrDefault(c, "Health Topic " + (c + 1));

            if (clusterName.toLowerCase().contains("out-of-domain")
                    || clusterName.toLowerCase().contains("out of domain")) {
                outOfDomainQueries.addAll(clusterQueries);
            } else {
                Map<String, Object> cluster = new LinkedHashMap<>();
                cluster.put("clusterName", clusterName);
                cluster.put("queryCount", clusterQueries.size());
                cluster.put("queries", clusterQueries);
                result.add(cluster);
            }
        }

        if (!outOfDomainQueries.isEmpty()) {
            Map<String, Object> ood = new LinkedHashMap<>();
            ood.put("clusterName", "Out-of-Domain");
            ood.put("queryCount", outOfDomainQueries.size());
            ood.put("queries", outOfDomainQueries);
            result.add(ood);
        }

        result.sort((a, b) -> Integer.compare((int) b.get("queryCount"), (int) a.get("queryCount")));
        return result;
    }

    /** Dot-product cosine similarity (valid for L2-normalised vectors from all-MiniLM). */
    private static float cosineSimilarity(float[] a, float[] b) {
        float dot = 0f;
        int len = Math.min(a.length, b.length);
        for (int i = 0; i < len; i++) dot += a[i] * b[i];
        return dot;
    }

    /**
     * Updates cluster centroid as a running arithmetic mean.
     * newCount is the cluster size AFTER adding the new vector.
     */
    private static float[] averageVector(float[] centroid, float[] newVec, int newCount) {
        float[] updated = new float[centroid.length];
        for (int i = 0; i < centroid.length; i++) {
            updated[i] = (centroid[i] * (newCount - 1) + newVec[i]) / newCount;
        }
        return updated;
    }

    /** Serialises a float[] to a comma-separated string for TEXT storage. */
    private static String floatArrayToString(float[] v) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < v.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(v[i]);
        }
        return sb.toString();
    }

    // -------------------------------------------------------------------------
    // Usage analytics: weekly / monthly / yearly query counts + insight
    // -------------------------------------------------------------------------

    /**
     * Builds time-series query counts for 3 periods and generates a rule-based
     * textual insight so the admin can understand engagement at a glance.
     * Response: { weekly: [...], monthly: [...], yearly: [...], insight: "...",
     *             totalThisWeek, totalLastWeek, totalThisMonth, totalThisYear }
     */
    public Map<String, Object> getAnalytics() {
        // --- Fetch raw rows from DB ---
        List<Object[]> weekRows  = chatMessageRepository.countByDayLast7Days();
        List<Object[]> monthRows = chatMessageRepository.countByDayLast30Days();
        List<Object[]> yearRows  = chatMessageRepository.countByMonthLast12Months();

        // --- Helper: convert rows to label->count map ---
        // rows are [String label, BigInteger count]
        java.util.function.Function<List<Object[]>, Map<String, Long>> toMap = rows -> {
            Map<String, Long> m = new TreeMap<>();
            for (Object[] r : rows) m.put((String) r[0], ((Number) r[1]).longValue());
            return m;
        };

        Map<String, Long> weekMap  = toMap.apply(weekRows);
        Map<String, Long> monthMap = toMap.apply(monthRows);
        Map<String, Long> yearMap  = toMap.apply(yearRows);

        // --- Fill gaps so every day/month slot appears (including zeros) ---
        DateTimeFormatter dayFmt   = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("yyyy-MM");
        DateTimeFormatter labelDay = DateTimeFormatter.ofPattern("MMM d");
        DateTimeFormatter labelMon = DateTimeFormatter.ofPattern("MMM yy");

        LocalDate today = LocalDate.now();

        List<Map<String, Object>> weekly = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            String key = d.format(dayFmt);
            Map<String, Object> pt = new LinkedHashMap<>();
            pt.put("label", d.format(DateTimeFormatter.ofPattern("EEE")));
            pt.put("queries", weekMap.getOrDefault(key, 0L));
            weekly.add(pt);
        }

        List<Map<String, Object>> monthly = new ArrayList<>();
        for (int i = 29; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            String key = d.format(dayFmt);
            Map<String, Object> pt = new LinkedHashMap<>();
            pt.put("label", d.format(labelDay));
            pt.put("queries", monthMap.getOrDefault(key, 0L));
            monthly.add(pt);
        }

        List<Map<String, Object>> yearly = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            LocalDate d = today.minusMonths(i).withDayOfMonth(1);
            String key = d.format(monthFmt);
            Map<String, Object> pt = new LinkedHashMap<>();
            pt.put("label", d.format(labelMon));
            pt.put("queries", yearMap.getOrDefault(key, 0L));
            yearly.add(pt);
        }

        // --- Rule-based insight ---
        long totalThisWeek = weekly.stream().mapToLong(p -> (Long) p.get("queries")).sum();
        long totalLastWeek = chatMessageRepository.countByDayLast7Days()  // re-use; actual 7-day window
                .stream().mapToLong(r -> ((Number) r[1]).longValue()).sum();
        // For last-week comparison, fetch the week before by computing manually from monthMap
        long lastWeekTotal = 0;
        for (int i = 13; i >= 7; i--) {
            String key = today.minusDays(i).format(dayFmt);
            lastWeekTotal += monthMap.getOrDefault(key, 0L);
        }
        long totalThisMonth = monthly.stream().mapToLong(p -> (Long) p.get("queries")).sum();
        long totalThisYear  = yearly.stream().mapToLong(p -> (Long) p.get("queries")).sum();

        // Peak day this week
        String peakDay = weekly.stream()
                .max(java.util.Comparator.comparingLong(p -> (Long) p.get("queries")))
                .map(p -> (String) p.get("label")).orElse("N/A");

        String insight;
        if (totalThisWeek == 0 && totalThisYear == 0) {
            insight = "No user queries recorded yet. Once users start chatting, engagement trends will appear here.";
        } else {
            StringBuilder sb = new StringBuilder();
            if (lastWeekTotal > 0) {
                double pct = ((double)(totalThisWeek - lastWeekTotal) / lastWeekTotal) * 100;
                if (pct >= 10) sb.append(String.format("Queries are up %.0f%% this week compared to last week — strong growth in engagement. ", pct));
                else if (pct <= -10) sb.append(String.format("Queries dropped %.0f%% this week compared to last week — consider checking for any service disruptions. ", Math.abs(pct)));
                else sb.append("Query volume is steady week-over-week. ");
            } else if (totalThisWeek > 0) {
                sb.append(String.format("Received %d queries in the past 7 days. ", totalThisWeek));
            }
            if (!peakDay.equals("N/A") && totalThisWeek > 0) {
                sb.append(String.format("Busiest day this week was %s. ", peakDay));
            }
            // Yearly trend: compare last 6 months avg vs first 6 months avg
            if (yearly.size() == 12) {
                long firstHalf  = yearly.subList(0, 6).stream().mapToLong(p -> (Long) p.get("queries")).sum();
                long secondHalf = yearly.subList(6, 12).stream().mapToLong(p -> (Long) p.get("queries")).sum();
                if (secondHalf > firstHalf * 1.2) sb.append("Usage has been growing over the past year.");
                else if (secondHalf < firstHalf * 0.8) sb.append("Usage has declined over the past year — consider user outreach.");
                else sb.append("Usage has remained consistent over the past 12 months.");
            }
            insight = sb.toString().trim();
            if (insight.isEmpty()) insight = String.format("%d total queries in the past 30 days.", totalThisMonth);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("weekly",  weekly);
        result.put("monthly", monthly);
        result.put("yearly",  yearly);
        result.put("insight", insight);
        result.put("totalThisWeek",  totalThisWeek);
        result.put("totalLastWeek",  lastWeekTotal);
        result.put("totalThisMonth", totalThisMonth);
        result.put("totalThisYear",  totalThisYear);
        return result;
    }

    // -------------------------------------------------------------------------
    // Stored analysis: scheduled refresh + fast read endpoint
    // -------------------------------------------------------------------------

    /**
     * Returns the most recently stored cluster analysis from the DB.
     * This is instant — no embedding or LLM call happens here.
     * Response shape: { clusters: [...], analyzedAt: "...", queriesAnalyzed: N }
     */
    public Map<String, Object> getLatestClusters() {
        return clusterAnalysisResultRepository.findTopByOrderByAnalyzedAtDesc()
                .map(record -> {
                    try {
                        List<Map<String, Object>> clusters = objectMapper.readValue(
                                record.getResultsJson(),
                                new TypeReference<List<Map<String, Object>>>() {});
                        Map<String, Object> response = new LinkedHashMap<>();
                        response.put("clusters", clusters);
                        response.put("analyzedAt", record.getAnalyzedAt().toString());
                        response.put("queriesAnalyzed", record.getQueriesAnalyzed());
                        return response;
                    } catch (Exception e) {
                        throw new RuntimeException("Failed to parse stored analysis", e);
                    }
                })
                .orElseGet(() -> {
                    Map<String, Object> empty = new LinkedHashMap<>();
                    empty.put("clusters", List.of());
                    empty.put("analyzedAt", null);
                    empty.put("queriesAnalyzed", 0);
                    return empty;
                });
    }

    /**
     * Checks whether any new USER messages have arrived since the last analysis.
     * If so, runs the full clustering pipeline and persists the result.
     * Skips silently when there is nothing new or fewer than 2 distinct queries.
     */
    public void refreshClusterAnalysisIfNeeded() {
        long totalUserMessages = chatMessageRepository.countUserMessages();
        if (totalUserMessages < 2) {
            log.debug("Cluster refresh skipped: fewer than 2 user messages.");
            return;
        }

        // Skip if nothing new since last analysis
        boolean hasNewData = clusterAnalysisResultRepository
                .findTopByOrderByAnalyzedAtDesc()
                .map(last -> totalUserMessages > last.getQueriesAnalyzed())
                .orElse(true); // no previous analysis → always run

        if (!hasNewData) {
            log.debug("Cluster refresh skipped: no new queries since last analysis.");
            return;
        }

        log.info("Running cluster analysis ({} user messages total)…", totalUserMessages);
        try {
            List<Map<String, Object>> clusters = clusterUserQueries();
            if (clusters.isEmpty()) {
                log.info("Cluster analysis produced no clusters — not persisting.");
                return;
            }
            String json = objectMapper.writeValueAsString(clusters);
            ClusterAnalysisResult record = ClusterAnalysisResult.builder()
                    .resultsJson(json)
                    .queriesAnalyzed(totalUserMessages)
                    .analyzedAt(LocalDateTime.now())
                    .build();
            clusterAnalysisResultRepository.save(record);
            log.info("Cluster analysis saved: {} clusters.", clusters.size());
        } catch (Exception e) {
            log.error("Cluster analysis failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Cron job: runs 15 seconds after startup then every 30 minutes.
     * Only re-analyses when new user messages have arrived, so it is a no-op
     * most of the time.
     */
    @Scheduled(initialDelay = 15_000, fixedRate = 30 * 60 * 1_000)
    public void scheduledClusterRefresh() {
        refreshClusterAnalysisIfNeeded();
    }
}
