package tn.esprit.backend.module6b.entity;

import tn.esprit.backend.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "contraception_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContraceptionProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "mother_id", nullable = false)
    private User mother;

    @Column(nullable = false, length = 10)
    private String age;

    @Column(nullable = false)
    private Boolean isBreastfeeding;

    @Column(columnDefinition = "TEXT")
    private String medicalHistory;

    @Column(nullable = false, length = 50)
    private String preference;

    @Column(columnDefinition = "TEXT")
    private String aiRecommendation;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}