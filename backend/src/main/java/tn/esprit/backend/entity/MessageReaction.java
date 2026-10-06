// src/main/java/tn/esprit/backend/entities/MessageReaction.java
package tn.esprit.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "message_reactions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"message_id", "user_id"})
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MessageReaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 10)
    private String emoji;
}