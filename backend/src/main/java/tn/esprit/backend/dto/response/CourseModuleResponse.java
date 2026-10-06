package tn.esprit.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CourseModuleResponse {
    private Long id;
    private Long courseId;
    private String courseTitle;
    private String title;
    private String contentType;
    private String contentUrl;
    private String contentText;
    private Integer orderIndex;
    private Integer durationMin;
    private Long quizId;
}

