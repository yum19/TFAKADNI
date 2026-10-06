package tn.esprit.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PartnerGuideResponse {
    private Long id;
    private String title;
    private String titleAr;
    private String content;
    private Integer targetWeek;
    private String category;
    private LocalDateTime publishedAt;
}
