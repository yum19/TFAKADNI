package tn.esprit.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PasswordResetTokenResponse {
    private String token;
    private LocalDateTime expiresAt;
}
