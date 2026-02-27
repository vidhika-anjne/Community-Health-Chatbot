package com.communityHealth.Health_Info.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cluster_analysis_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClusterAnalysisResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Serialised JSON array of cluster maps. */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String resultsJson;

    /** How many distinct USER messages existed when this analysis was run. */
    private long queriesAnalyzed;

    private LocalDateTime analyzedAt;
}
