package tn.esprit.backend.module6b.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContraceptionChatMessageResponseDto {
    private Long id;
    private Long motherId;
    private String role;
    private String content;
    private String sessionId;
    private LocalDateTime createdAt;
}