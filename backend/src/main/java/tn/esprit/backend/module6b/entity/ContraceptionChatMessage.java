package tn.esprit.backend.module6b.entity;

import tn.esprit.backend.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "contraception_chat_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContraceptionChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "mother_id", nullable = false)
    private User mother;

    @Column(nullable = false, length = 20)
    private String role; // USER / ASSISTANT

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private String sessionId;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}