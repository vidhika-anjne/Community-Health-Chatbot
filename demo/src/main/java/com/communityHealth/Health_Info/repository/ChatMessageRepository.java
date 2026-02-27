package com.communityHealth.Health_Info.repository;

import com.communityHealth.Health_Info.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /** Returns every message the user sent, newest first. */
    @Query("SELECT m FROM ChatMessage m WHERE m.sender = 'USER' ORDER BY m.timestamp DESC")
    List<ChatMessage> findAllUserMessages();

    /** Total count of USER messages — used to detect new queries since the last analysis. */
    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.sender = 'USER'")
    long countUserMessages();

    /** Daily counts for the past 7 days. Returns [label, count] rows. */
    @Query(value = "SELECT TO_CHAR(timestamp, 'YYYY-MM-DD') AS label, COUNT(*) AS cnt " +
                   "FROM chat_message WHERE sender = 'USER' AND timestamp >= NOW() - INTERVAL '7 days' " +
                   "GROUP BY label ORDER BY label", nativeQuery = true)
    List<Object[]> countByDayLast7Days();

    /** Daily counts for the past 30 days. Returns [label, count] rows. */
    @Query(value = "SELECT TO_CHAR(timestamp, 'YYYY-MM-DD') AS label, COUNT(*) AS cnt " +
                   "FROM chat_message WHERE sender = 'USER' AND timestamp >= NOW() - INTERVAL '30 days' " +
                   "GROUP BY label ORDER BY label", nativeQuery = true)
    List<Object[]> countByDayLast30Days();

    /** Monthly counts for the past 12 months. Returns [label, count] rows. */
    @Query(value = "SELECT TO_CHAR(timestamp, 'YYYY-MM') AS label, COUNT(*) AS cnt " +
                   "FROM chat_message WHERE sender = 'USER' AND timestamp >= NOW() - INTERVAL '12 months' " +
                   "GROUP BY label ORDER BY label", nativeQuery = true)
    List<Object[]> countByMonthLast12Months();
}


