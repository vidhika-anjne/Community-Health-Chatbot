package com.communityHealth.Health_Info.repository;

import com.communityHealth.Health_Info.model.Article;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {
    List<Article> findByTagsContains(String tag);
    List<Article> findByVerifiedTrue();
    List<Article> findByDocumentId(String documentId);
    void deleteByDocumentId(String documentId);
    // Semantic similarity is computed in-memory in ChatService using cosine distance
}
