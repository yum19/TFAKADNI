package tn.esprit.backend.dto;

import lombok.*;

import java.time.LocalDateTime;

/** Response returned after saving / fetching a rating */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RatingDTO {
    private Long          id;
    private Long          matchId;
    private Long          raterId;
    private Long          ratedId;
    private Integer       stars;
    private String        comment;
    private LocalDateTime createdAt;

    /** Convenience: average stars for the rated user */
    private Double  avgStars;
    private Long    totalRatings;
}