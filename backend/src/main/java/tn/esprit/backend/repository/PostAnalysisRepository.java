package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.entity.PostAnalysis;

import java.util.List;
import java.util.Optional;

public interface PostAnalysisRepository extends JpaRepository<PostAnalysis, Long> {

    Optional<PostAnalysis> findByPostId(Long postId);

    /** All analyses for a list of post IDs (useful for batch loading) */
    List<PostAnalysis> findAllByPostIdIn(List<Long> postIds);

    /** Posts flagged as harmful that the author hasn't acknowledged yet */
    List<PostAnalysis> findByIsHarmfulTrueAndAuthorAcknowledgedFalse();
}