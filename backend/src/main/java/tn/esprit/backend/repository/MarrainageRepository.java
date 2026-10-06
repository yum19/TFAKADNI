package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.esprit.backend.entity.Marrainage;

import java.util.List;

public interface MarrainageRepository extends JpaRepository<Marrainage, Long> {

    /**
     * Returns COUNT as Integer — never boolean.
     * MySQL COUNT() → JDBC Integer. JPA proxy cannot cast Integer to Boolean.
     * Always compare result > 0 in Java.
     */
    @Query(value = """
        SELECT COUNT(*)
        FROM   pregnancies p
        WHERE  p.user_id = :userId
          AND  p.status  = 'ACTIVE'
    """, nativeQuery = true)
    Integer countActivePregnancies(@Param("userId") Long userId);

    @Query(value = """
        SELECT p.hospital_name
        FROM   pregnancies p
        WHERE  p.user_id = :userId
          AND  p.status  = 'ACTIVE'
        ORDER  BY p.created_at DESC
        LIMIT  1
    """, nativeQuery = true)
    String findCityByUserId(@Param("userId") Long userId);

    @Query(value = """
        SELECT TIMESTAMPDIFF(WEEK, p.lmp_date, CURDATE())
        FROM   pregnancies p
        WHERE  p.user_id = :userId
          AND  p.status  = 'ACTIVE'
        ORDER  BY p.created_at DESC
        LIMIT  1
    """, nativeQuery = true)
    Integer findCurrentWeekByUserId(@Param("userId") Long userId);

    @Query(value = """
        SELECT
            u.id                                                         AS userId,
            CONCAT(u.first_name, ' ', u.last_name)                       AS fullName,
            p.hospital_name                                              AS city,
            TIMESTAMPDIFF(WEEK, p.lmp_date, CURDATE())                   AS currentWeek,
            p.pregnancy_type                                             AS pregnancyType,
            CASE WHEN (SELECT COUNT(*) FROM babies b WHERE b.mother_id = u.id) > 0
                 THEN 1 ELSE 0 END                                       AS hasBaby,
            ROUND(
                (CASE WHEN p.hospital_name = mother.m_city    THEN 30 ELSE 0 END) +
                (CASE WHEN ABS(TIMESTAMPDIFF(WEEK, p.lmp_date, CURDATE())
                              - mother.m_week) <= 2             THEN 25 ELSE 0 END) +
                (CASE WHEN p.pregnancy_type = mother.m_type   THEN 20 ELSE 0 END) +
                (CASE WHEN (SELECT COUNT(*) FROM babies b WHERE b.mother_id = u.id) > 0
                                                               THEN 15 ELSE 0 END) +
                (CASE WHEN (SELECT COUNT(*) FROM babies b
                            WHERE b.mother_id    = u.id
                              AND b.delivery_type = mother.m_delivery_type) > 0
                                                               THEN 10 ELSE 0 END)
            , 1)                                                         AS compatibilityScore,
            CONCAT(
                IF(p.hospital_name = mother.m_city,            'Même ville · ', ''),
                IF(ABS(TIMESTAMPDIFF(WEEK, p.lmp_date, CURDATE()) - mother.m_week) <= 2,
                                                               'Même semaine · ', ''),
                IF(p.pregnancy_type = mother.m_type,           'Même grossesse · ', ''),
                IF((SELECT COUNT(*) FROM babies b WHERE b.mother_id = u.id) > 0,
                                                               'Expérience bébé · ', ''),
                IF((SELECT COUNT(*) FROM babies b
                    WHERE b.mother_id    = u.id
                      AND b.delivery_type = mother.m_delivery_type) > 0,
                                                               'Même accouchement', '')
            )                                                            AS reason
        FROM users u
        JOIN pregnancies p ON u.id = p.user_id
        CROSS JOIN (
            SELECT
                pr.hospital_name                                         AS m_city,
                TIMESTAMPDIFF(WEEK, pr.lmp_date, CURDATE())              AS m_week,
                pr.pregnancy_type                                        AS m_type,
                COALESCE(
                    (SELECT b.delivery_type FROM babies b
                     WHERE  b.mother_id = :motherUserId
                     ORDER  BY b.birth_date DESC LIMIT 1),
                    'Normal'
                )                                                        AS m_delivery_type
            FROM pregnancies pr
            WHERE pr.user_id = :motherUserId
              AND pr.status  = 'ACTIVE'
            ORDER BY pr.created_at DESC
            LIMIT 1
        ) mother
        WHERE u.role      = 'USER'
          AND u.is_active = true
          AND p.status    = 'ACTIVE'
          AND p.user_id  != :motherUserId
        ORDER BY compatibilityScore DESC
        LIMIT 5
    """, nativeQuery = true)
    List<MarraineProjection> findTopMarraines(@Param("motherUserId") Long motherUserId);
    @Query(value = """
    SELECT p.pregnancy_type FROM pregnancies p
    WHERE p.user_id = :userId AND p.status = 'ACTIVE'
    ORDER BY p.created_at DESC LIMIT 1
""", nativeQuery = true)
    String findActivePregnancyTypeByUserId(@Param("userId") Long userId);
}