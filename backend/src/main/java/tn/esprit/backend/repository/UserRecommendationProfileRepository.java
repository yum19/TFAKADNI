package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.esprit.backend.dto.UserRecommendationProfiledto;
import tn.esprit.backend.entity.User;

import java.util.List;

/**
 * Fetches a user's full recommendation profile:
 *  – active pregnancy rows
 *  – baby rows
 * in a single UNION query so the service can compute all ML features.
 */
public interface UserRecommendationProfileRepository extends JpaRepository<User, Long> {

    /**
     * UNION of pregnancies + babies for a given user.
     * Returns one row per pregnancy/baby record.
     */
    @Query(value = """
        SELECT
            'PREGNANCY'         AS sourceType,
            NULL                AS babyFirstName,
            NULL                AS babyGender,
            NULL                AS babyBirthDate,
            p.lmp_date          AS lmpDate,
            p.due_date          AS dueDate,
            p.status            AS pregnancyStatus,
            p.pregnancy_type    AS pregnancyType
        FROM pregnancies p
        WHERE p.user_id = :userId
          AND p.status IN ('ACTIVE', 'COMPLETED')

        UNION ALL

        SELECT
            'BABY'              AS sourceType,
            b.first_name         AS babyFirstName,
            b.gender            AS babyGender,
            b.birth_date\s         AS babyBirthDate,
            NULL                AS lmpDate,
            NULL                AS dueDate,
            NULL                AS pregnancyStatus,
            NULL                AS pregnancyType
        FROM babies b
        WHERE b.mother_id = :userId
        """,
            nativeQuery = true)
    List<UserRecommendationProfiledto> findProfileByUserId(@Param("userId") Long userId);
}