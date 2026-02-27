package com.communityHealth.Health_Info.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "kb_chunks")
public class Article {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Groups all chunks that came from the same uploaded PDF. */
    private String documentId;

    /** 1-based index of this chunk within its document (null for manually created articles). */
    private Integer chunkIndex;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @ElementCollection
    private List<String> tags;

    private String targetAgeGroup;

    private String language;

    private boolean verified;

    @Column(name = "article_references")
    private String references;

    // Embedding stored as comma-separated floats; cosine similarity computed in Java
    @Column(name = "embedding_json", columnDefinition = "TEXT")
    private String embeddingJson;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
