package com.communityHealth.Health_Info.repository;

import com.communityHealth.Health_Info.model.Article;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {
    List<Article> findByTagsContains(String tag);
    List<Article> findByVerifiedTrue();
    List<Article> findByDocumentId(String documentId);
    void deleteByDocumentId(String documentId);

    /** Search verified articles by title or content (case-insensitive). */
    @Query("SELECT a FROM Article a WHERE a.verified = true AND (" +
           "LOWER(a.title) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(a.content) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<Article> searchVerified(@Param("q") String q);

    /** All distinct tags across verified articles. */
    @Query("SELECT DISTINCT t FROM Article a JOIN a.tags t WHERE a.verified = true")
    List<String> findAllVerifiedTags();

    // Semantic similarity is computed in-memory in ChatService using cosine distance
}
