package com.communityHealth.Health_Info.controller;

import com.communityHealth.Health_Info.model.Article;
import com.communityHealth.Health_Info.model.ChatSession;
import com.communityHealth.Health_Info.repository.ArticleRepository;
import com.communityHealth.Health_Info.repository.ChatSessionRepository;
import com.communityHealth.Health_Info.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Arrays;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // For development with React/Next.js frontend
public class AdminDashboardController {
    private final AdminDashboardService dashboardService;
    private final ArticleRepository articleRepository;
    private final ChatSessionRepository chatSessionRepository;

    // 1. Dashboard stats
    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        return dashboardService.getDashboardStats();
    }

    // New: PDF Upload and Vector Storage
    @PostMapping("/articles/upload-pdf")
    public ResponseEntity<String> uploadPdf(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("tags") String tags) {
        try {
            List<String> tagList = Arrays.asList(tags.split(","));
            dashboardService.processPdfUpload(file, title, tagList);
            return ResponseEntity.ok("PDF uploaded and embedded successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    // 2. Knowledge Base CRUD
    @GetMapping("/articles")
    public List<Article> listArticles() {
        return articleRepository.findAll();
    }

    /**
     * Returns one representative row per document (the chunk with chunkIndex=1, or the
     * first row if chunkIndex is null).  The response also includes a "chunkCount" field
     * so the UI can show how many chunks the document has.
     */
    @GetMapping("/documents")
    public List<Map<String, Object>> listDocuments() {
        List<Article> all = articleRepository.findAll();
        // Group by documentId (null documentId = manually created article, treated as its own group)
        Map<String, List<Article>> grouped = all.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getDocumentId() != null ? a.getDocumentId() : "manual-" + a.getId(),
                        java.util.LinkedHashMap::new,
                        Collectors.toList()));

        return grouped.entrySet().stream().map(entry -> {
            List<Article> chunks = entry.getValue();
            // Pick the representative chunk: lowest chunkIndex, or just first
            Article rep = chunks.stream()
                    .min(java.util.Comparator.comparingInt(
                            a -> a.getChunkIndex() != null ? a.getChunkIndex() : 0))
                    .orElse(chunks.get(0));
            Map<String, Object> doc = new LinkedHashMap<>();
            doc.put("documentId", entry.getKey());
            doc.put("id", rep.getId());
            doc.put("title", rep.getTitle());
            doc.put("tags", rep.getTags());
            doc.put("verified", rep.isVerified());
            doc.put("createdAt", rep.getCreatedAt());
            doc.put("chunkCount", chunks.size());
            return doc;
        }).collect(Collectors.toList());
    }

    /** Delete all chunks that belong to a document (or a single manually-created article). */
    @DeleteMapping("/documents/{documentId}")
    @Transactional
    public ResponseEntity<Void> deleteDocument(@PathVariable String documentId) {
        if (documentId.startsWith("manual-")) {
            long id = Long.parseLong(documentId.replace("manual-", ""));
            articleRepository.deleteById(id);
        } else {
            articleRepository.deleteByDocumentId(documentId);
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/articles")
    public Article createArticle(@RequestBody Article article) {
        return articleRepository.save(article);
    }

    @PutMapping("/articles/{id}")
    public Article updateArticle(@PathVariable Long id, @RequestBody Article article) {
        article.setId(id);
        return articleRepository.save(article);
    }

    @DeleteMapping("/articles/{id}")
    public void deleteArticle(@PathVariable Long id) {
        articleRepository.deleteById(id);
    }

    @PatchMapping("/articles/{id}/verify")
    public Article verifyArticle(@PathVariable Long id) {
        Article article = articleRepository.findById(id).orElseThrow();
        article.setVerified(true);
        return articleRepository.save(article);
    }

    // 3. Chat Review
    @GetMapping("/chats")
    public List<ChatSession> listChatsForReview() {
        return chatSessionRepository.findAll();
    }

    @GetMapping("/chats/{id}/transcript")
    public List<?> getChatSummary(@PathVariable Long id) {
        ChatSession session = chatSessionRepository.findById(id).orElseThrow();
        return session.getMessages();
    }

    /**
     * Returns the most recently stored cluster analysis.
     * The background job refreshes this every 30 minutes automatically
     * (or on first startup if no analysis exists yet).
     * Response: { clusters: [...], analyzedAt: "...", queriesAnalyzed: N }
     */
    @GetMapping("/clusters")
    public ResponseEntity<Map<String, Object>> getQueryClusters() {
        try {
            return ResponseEntity.ok(dashboardService.getLatestClusters());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /** Query usage trends over weekly, monthly, and yearly periods with insight text. */
    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        try {
            return ResponseEntity.ok(dashboardService.getAnalytics());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
