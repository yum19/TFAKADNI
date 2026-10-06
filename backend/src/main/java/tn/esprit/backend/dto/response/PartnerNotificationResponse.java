package tn.esprit.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PartnerNotificationResponse {

    private Long id;

    private String type;

    private String title;

    private String body;

    private Boolean isRead;

    private LocalDateTime createdAt;

}

