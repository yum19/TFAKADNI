package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.esprit.backend.entity.MatchRating;

import java.util.Optional;

public interface MatchRatingRepository extends JpaRepository<MatchRating, Long> {

    /** Check if rater already rated in this match */
    Optional<MatchRating> findByMatchIdAndRaterId(Long matchId, Long raterId);

    /** Average stars received by a user */
    @Query("SELECT AVG(r.stars) FROM MatchRating r WHERE r.ratedId = :userId")
    Double avgStarsByRatedId(@Param("userId") Long userId);

    /** Total number of ratings a user has received */
    long countByRatedId(Long ratedId);
}