package tn.esprit.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class EnrollmentResponse {

    private Long id;

    private Long userId;

    private Long courseId;

    private String courseTitle;

    private Integer progressPct;

    private String status;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

}
