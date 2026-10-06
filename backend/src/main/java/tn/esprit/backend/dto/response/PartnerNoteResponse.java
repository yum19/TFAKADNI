package tn.esprit.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PartnerNoteResponse {
    private Long id;
    private String content;
    private Boolean isRead;
    private Long authorId;
    private String authorName;
    private Long recipientId;
    private Long pregnancyId;
    private LocalDateTime createdAt;
}

