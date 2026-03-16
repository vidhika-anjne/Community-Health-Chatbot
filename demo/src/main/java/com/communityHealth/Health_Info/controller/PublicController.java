package com.communityHealth.Health_Info.controller;

import com.communityHealth.Health_Info.model.Article;
import com.communityHealth.Health_Info.repository.ArticleRepository;
import com.communityHealth.Health_Info.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // For development with frontend
public class PublicController {
    private final ArticleRepository articleRepository;
    private final ChatService chatService;

    // 1. Landing page articles/FAQs
    @GetMapping("/articles")
    public List<Article> getVerifiedArticles() {
        return articleRepository.findByVerifiedTrue();
    }

    @GetMapping("/quick-links")
    public List<Article> getQuickLinks() {
        // Find basic disease info
        return articleRepository.findAll().stream().limit(5).toList();
    }

    // ── Documents (public knowledge base) ──────────────────────────────────

    /**
     * Returns one card per document (grouped by documentId), verified only.
     * Sorted by most-recently uploaded first.
     * Supports optional ?tag= and ?q= filters.
     */
    @GetMapping("/documents")
    public List<Map<String, Object>> getPublicDocuments(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String tag) {

        List<Article> base;
        if (q != null && !q.isBlank()) {
            base = articleRepository.searchVerified(q.trim());
        } else {
            base = articleRepository.findByVerifiedTrue();
        }

        // Filter by tag if provided
        if (tag != null && !tag.isBlank()) {
            String tagLower = tag.trim().toLowerCase();
            base = base.stream()
                    .filter(a -> a.getTags() != null &&
                            a.getTags().stream().anyMatch(t -> t.toLowerCase().contains(tagLower)))
                    .collect(Collectors.toList());
        }

        // Group by documentId
        Map<String, List<Article>> grouped = base.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getDocumentId() != null ? a.getDocumentId() : "manual-" + a.getId(),
                        LinkedHashMap::new,
                        Collectors.toList()));

        return grouped.entrySet().stream()
                .map(entry -> {
                    List<Article> chunks = entry.getValue();
                    Article rep = chunks.stream()
                            .min(Comparator.comparingInt(a -> a.getChunkIndex() != null ? a.getChunkIndex() : 0))
                            .orElse(chunks.get(0));
                    Map<String, Object> doc = new LinkedHashMap<>();
                    doc.put("documentId", entry.getKey());
                    doc.put("title", rep.getTitle());
                    doc.put("tags", rep.getTags());
                    doc.put("createdAt", rep.getCreatedAt());
                    doc.put("chunkCount", chunks.size());
                    doc.put("hasPdf", chunks.stream().anyMatch(a -> a.getPdfFilePath() != null));
                    // First ~200 chars of content as a preview snippet
                    String content = rep.getContent() != null ? rep.getContent() : "";
                    doc.put("snippet", content.length() > 200 ? content.substring(0, 200) + "…" : content);
                    return doc;
                })
                // Sort newest first
                .sorted((a, b) -> {
                    String ca = a.get("createdAt") != null ? a.get("createdAt").toString() : "";
                    String cb = b.get("createdAt") != null ? b.get("createdAt").toString() : "";
                    return cb.compareTo(ca);
                })
                .collect(Collectors.toList());
    }

    /** All distinct tags across verified documents, sorted alphabetically. */
    @GetMapping("/documents/tags")
    public List<String> getPublicTags() {
        return articleRepository.findAllVerifiedTags().stream().sorted().collect(Collectors.toList());
    }

    /** Download / view the original PDF for a public document (no auth required). */
    @GetMapping("/documents/{documentId}/pdf")
    public ResponseEntity<Resource> viewPublicPdf(@PathVariable String documentId) {
        try {
            List<Article> chunks = articleRepository.findByDocumentId(documentId);
            Article rep = chunks.stream()
                    .filter(a -> a.getPdfFilePath() != null)
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("No PDF stored for document: " + documentId));

            Path filePath = Paths.get(rep.getPdfFilePath());
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String filename = rep.getPdfFileName() != null ? rep.getPdfFileName() : "document.pdf";
            String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8).replace("+", "%20");

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + encodedFilename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    // ── Chat ────────────────────────────────────────────────────────────────

    // 2. Chat API (Streaming version excluded for simplicity, but can be added via SseEmitter or Flux)
    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chatWithBot(@RequestBody Map<String, String> request) {
        String sessionId = request.getOrDefault("sessionId", "guest-session");
        String message = request.get("message");
        
        String botResponse = chatService.generateResponse(sessionId, message);
        
        return ResponseEntity.ok(Map.of("response", botResponse));
    }

    @GetMapping("/chat/transcript/{sessionId}")
    public ResponseEntity<List<?>> getTranscript(@PathVariable String sessionId) {
        return ResponseEntity.ok(chatService.getSessionTranscript(sessionId));
    }
}
