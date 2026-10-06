package tn.esprit.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Request body for POST /api/ratings */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class RatingRequest {
    private Long    matchId;   // which mutual match
    private Integer stars;     // 1–5
    private String  comment;   // optional
}