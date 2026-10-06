package tn.esprit.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "space_participants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpaceParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "space_id", nullable = false)
    private Space space;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String userEmail;

    private String userName;
    // Add this field to the existing SpaceParticipant entity:
    @Column(nullable = false)
    private boolean anonymous = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ParticipantRole role;

    /** Is microphone active */
    private boolean micActive = false;

    /** Is hand raised */
    private boolean handRaised = false;

    private LocalDateTime joinedAt;
    private LocalDateTime leftAt;

    @PrePersist
    public void prePersist() {
        this.joinedAt = LocalDateTime.now();
    }

    public enum ParticipantRole {
        HOST, SPEAKER, LISTENER
    }
}