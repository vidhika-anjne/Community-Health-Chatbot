package com.communityHealth.Health_Info.controller;

import com.communityHealth.Health_Info.model.Article;
import com.communityHealth.Health_Info.repository.ArticleRepository;
import com.communityHealth.Health_Info.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

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
