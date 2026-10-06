package tn.esprit.backend.repository;

public interface MarraineProjection {
    Long getUserId();
    String getFullName();
    String getCity();
    Integer getCurrentWeek();
    String getPregnancyType();
    Double getCompatibilityScore();
    String getReason();
    Integer getHasBaby();   // ← was Boolean, now Integer (MySQL returns 0 or 1)
}