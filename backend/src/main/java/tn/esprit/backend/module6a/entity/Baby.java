package tn.esprit.backend.module6a.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import tn.esprit.backend.entity.User;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "babies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Baby {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mother_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "healthProfile", "sessions", "subscriptions", "invoices", "payments"})
    private User mother;

    @Column(nullable = false, length = 50)
    private String firstName;

    @Column(nullable = false, length = 50)
    private String lastName;

    @Column(nullable = false)
    private LocalDate birthDate;

    @Column(nullable = false, length = 10)
    private String gender;

    private Double birthWeight;

    private Double birthHeight;

    @Column(length = 5)
    private String bloodType;

    @Column(length = 200)
    private String birthPlace;

    private Integer gestationalAgeAtBirth;

    @Column(length = 20)
    private String deliveryType;
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String photoUrl;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}