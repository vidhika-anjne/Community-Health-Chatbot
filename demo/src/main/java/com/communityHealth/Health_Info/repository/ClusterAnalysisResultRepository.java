package com.communityHealth.Health_Info.repository;

import com.communityHealth.Health_Info.model.ClusterAnalysisResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ClusterAnalysisResultRepository extends JpaRepository<ClusterAnalysisResult, Long> {

    /** Returns the most recent analysis record, if any. */
    Optional<ClusterAnalysisResult> findTopByOrderByAnalyzedAtDesc();
}
