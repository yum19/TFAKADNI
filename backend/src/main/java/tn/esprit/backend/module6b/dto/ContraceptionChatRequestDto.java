package tn.esprit.backend.module6b.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContraceptionChatRequestDto {

    @NotBlank(message = "Message is required")
    private String message;

    private String sessionId;
}