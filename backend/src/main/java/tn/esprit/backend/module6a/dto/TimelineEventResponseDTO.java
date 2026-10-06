package tn.esprit.backend.module6a.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimelineEventResponseDTO {

    private String eventType;
    private Long sourceId;
    private LocalDateTime eventDateTime;

    private String title;
    private String description;

    private String priority; // NORMAL / IMPORTANT / UNUSUAL / TREND_LINKED
    private String status;
    private String actionUrl;
}