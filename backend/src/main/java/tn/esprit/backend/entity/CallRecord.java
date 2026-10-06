// src/main/java/tn/esprit/backend/entities/CallRecord.java
package tn.esprit.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "call_records")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CallRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "call_id", nullable = false)
    private String callId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "caller_id", nullable = false)
    private User caller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "callee_id", nullable = false)
    private User callee;

    /** AUDIO | VIDEO */
    @Column(name = "call_type", nullable = false)
    private String callType;

    /** ANSWERED | MISSED | REJECTED | CANCELLED */
    @Column(name = "call_status", nullable = false)
    private String callStatus;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @PrePersist
    protected void onCreate() {
        if (startedAt == null) startedAt = LocalDateTime.now();
    }
}