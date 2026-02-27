package com.communityHealth.Health_Info.repository;

import com.communityHealth.Health_Info.model.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    
    @Query("SELECT COUNT(s) FROM ChatSession s WHERE s.startTime >= :sinceDate")
    long countRecentChats(LocalDateTime sinceDate);

    @Query("SELECT s.topic, COUNT(s) FROM ChatSession s GROUP BY s.topic ORDER BY COUNT(s) DESC LIMIT 5")
    List<Object[]> findTopTopics();

    @Query("SELECT AVG(s.satisfactionRating) FROM ChatSession s WHERE s.satisfactionRating IS NOT NULL")
    Double averageSatisfaction();
}
