package com.communityHealth.Health_Info.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "session_id", nullable = false)
    private ChatSession session;

    private String sender; // "USER" or "BOT"

    @Column(columnDefinition = "TEXT")
    private String content;

    private LocalDateTime timestamp;

    private boolean harmfulFlagged;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
