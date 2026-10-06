package tn.esprit.backend.dto;

import java.time.LocalDate;

/**
 * Native SQL projection interface for the UNION query in
 * UserRecommendationProfileRepository.
 *
 * Spring Data JPA will auto-implement this interface when the query
 * returns columns with matching names (case-insensitive).
 *
 * NOTE: If you prefer a @Data class instead of an interface, switch to
 * the @SqlResultSetMapping approach — but interface projection is simpler.
 */
public interface UserRecommendationProfiledto {

    /** "PREGNANCY" or "BABY" */
    String getSourceType();

    // ── Baby fields ──────────────────────────────────────────────────────────
    String    getBabyFirstName();
    String    getBabyGender();
    LocalDate getBabyBirthDate();

    // ── Pregnancy fields ─────────────────────────────────────────────────────
    LocalDate getLmpDate();
    LocalDate getDueDate();
    String    getPregnancyStatus();
    String    getPregnancyType();
}