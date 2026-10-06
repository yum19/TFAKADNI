package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.esprit.backend.entity.Match;

import java.util.List;
import java.util.Optional;

public interface MatchRepository extends JpaRepository<Match, Long> {

    /** All matches where this user is A (their own decisions) */
    List<Match> findByUserAId(Long userAId);

    /** All matches where this user is B (they were matched TO by someone) */
    List<Match> findByUserBId(Long userBId);

    /** Find existing match pair regardless of direction */
    @Query("SELECT m FROM Match m WHERE (m.userAId = :a AND m.userBId = :b) OR (m.userAId = :b AND m.userBId = :a)")
    Optional<Match> findByPair(@Param("a") Long a, @Param("b") Long b);
}