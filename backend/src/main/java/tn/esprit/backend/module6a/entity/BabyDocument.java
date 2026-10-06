package tn.esprit.backend.module6a.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "baby_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BabyDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "baby_id", nullable = false)
    private Baby baby;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 30)
    private String documentType; // ORDONNANCE / COMPTE_RENDU / ANALYSE / RADIO / AUTRE

    @Column(nullable = false, length = 500)
    private String fileUrl;

    private Long fileSize; // en bytes

    @Column(nullable = false)
    private LocalDateTime uploadedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @PrePersist
    public void onCreate() {
        if (this.uploadedAt == null) {
            this.uploadedAt = LocalDateTime.now();
        }
    }
}