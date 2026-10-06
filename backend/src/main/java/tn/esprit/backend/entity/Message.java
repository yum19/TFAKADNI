// src/main/java/tn/esprit/backend/entities/Message.java
package tn.esprit.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private MessageType messageType = MessageType.TEXT;

    // For IMAGE / FILE / VOICE
    private String fileUrl;
    private String fileName;
    private Long   fileSize;   // bytes
    private Integer duration;  // seconds (voice)

    // Delivery status
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private MessageStatus status = MessageStatus.SENT;

    // Reply-to (self-referential FK)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_to_id")
    private Message replyTo;

    // Emoji reactions
    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MessageReaction> reactions = new ArrayList<>();

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Builder.Default
    private Boolean isRead = false;

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) this.timestamp = LocalDateTime.now();
        if (this.status    == null) this.status    = MessageStatus.SENT;
        if (this.isRead    == null) this.isRead    = false;
        if (this.messageType == null) this.messageType = MessageType.TEXT;
    }

    public enum MessageType  { TEXT, IMAGE, FILE, VOICE, LINK }
    public enum MessageStatus { SENT, DELIVERED, SEEN }
}