package tn.esprit.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CourseCardResponse {
    private Long id;
    private String title;
    private String titleAr;
    private String category;
    private Integer durationMin;
    private String level;
    private String thumbnail;
    private Integer moduleCount;
}

