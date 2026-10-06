package tn.esprit.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "health_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class HealthProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonIgnore
    private User user;

    private Integer age;

    @Column(name = "weight_kg", precision = 5, scale = 2)
    private java.math.BigDecimal weightKg;

    @Column(name = "height_cm")
    private Integer heightCm;

    @Enumerated(EnumType.STRING)
    @Column(name = "blood_type", length = 5)
    private BloodType bloodType;

    /**
     * Stocké en JSON : liste de maladies, allergies, chirurgies...
     * Exemple : {"diseases"🙁"diabète"],"allergies"🙁"pénicilline"]}
     */
    @Column(name = "medical_history_json", columnDefinition = "JSON")
    private String medicalHistoryJson;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public enum BloodType { A_POS, A_NEG, B_POS, B_NEG, AB_POS, AB_NEG, O_POS, O_NEG }
}