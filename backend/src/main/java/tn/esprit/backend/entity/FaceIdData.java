package tn.esprit.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "face_id_data")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FaceIdData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /** Photo de référence en base64 */
    @Column(name = "face_photo", columnDefinition = "LONGTEXT")
    private String facePhoto;

    /** Credentials encodés (email + password en base64) */
    @Column(name = "face_creds", columnDefinition = "TEXT")
    private String faceCreds;

    /** Face ID activé ou non */
    @Column(name = "enabled", nullable = false)
    private boolean enabled = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}