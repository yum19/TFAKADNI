package tn.esprit.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SessionResponse {
    private Long id;
    private String deviceInfo;
    private String ip;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private boolean current;
}