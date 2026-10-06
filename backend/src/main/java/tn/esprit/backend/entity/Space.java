package tn.esprit.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "spaces")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Space {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SpaceCategory category;

    /** EVERYONE or FOLLOWERS */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SpaceAudience audience;

    /** Whether anonymous (non-logged-in) users may listen */
    @Column(nullable = false)
    private boolean anonymousAllowed = true;

    /** Max speakers allowed (not counting host) */
    @Column(nullable = false)
    private int maxSpeakers = 10;

    /** Optional scheduled start time */
    private LocalDateTime scheduledAt;

    /** Actual start time */
    private LocalDateTime startedAt;

    /** End time */
    private LocalDateTime endedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SpaceStatus status = SpaceStatus.SCHEDULED;

    /** Host user email */
    @Column(nullable = false)
    private String hostEmail;

    /** Host user id */
    @Column(nullable = false)
    private Long hostId;

    /** Host display name */
    private String hostName;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public enum SpaceCategory {
        GROSSESSE, POSTPARTUM, FERTILITE, NUTRITION
    }

    public enum SpaceAudience {
        EVERYONE, FOLLOWERS
    }

    public enum SpaceStatus {
        SCHEDULED, LIVE, ENDED
    }
}