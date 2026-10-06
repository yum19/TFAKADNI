// src/main/java/tn/esprit/backend/dto/ChatMessage.java
package tn.esprit.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.backend.entity.Message;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    // Core
    private Long          messageId;
    private Long          senderId;
    private Long          receiverId;
    private String        content;
    private LocalDateTime timestamp;
    private Boolean       isRead;
    private String        senderName;

    // Type
    private Message.MessageType   messageType;
    private Message.MessageStatus status;

    // File / Voice
    private String  fileUrl;
    private String  fileName;
    private Long    fileSize;
    private Integer duration;   // seconds (voice)

    // Reply
    private Long   replyToId;          // used when sending
    private ReplyPreviewDto replyTo;   // populated in responses

    // Reactions
    private List<ReactionDto> reactions;

    // ── Inner DTOs ────────────────────────────────────────────

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ReplyPreviewDto {
        private Long   messageId;
        private String senderName;
        private String content;
        private Message.MessageType messageType;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ReactionDto {
        private String emoji;
        private Long   userId;
        private String name;
    }
}