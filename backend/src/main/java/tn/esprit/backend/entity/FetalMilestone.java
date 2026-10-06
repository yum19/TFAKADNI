package tn.esprit.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "fetal_milestones")
@Data
public class FetalMilestone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "week_number", nullable = false, unique = true)
    private Integer weekNumber;

    @Column(nullable = false)
    private String title;

    @Column(name = "title_ar")
    private String titleAr;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "description_ar", columnDefinition = "TEXT")
    private String descriptionAr;

    @Column(name = "size_cm")
    private Double sizeCm;

    @Column(name = "weight_g")
    private Double weightG;

    @Column(name = "size_comparison")
    private String sizeComparison;

    @Column(name = "image_url")
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    private Trimester trimester;

    @Column(name = "mother_symptoms", columnDefinition = "TEXT")
    private String motherSymptoms;

    @Column(name = "medical_advice", columnDefinition = "TEXT")
    private String medicalAdvice;

    public enum Trimester {
        T1, T2, T3
    }
}