package tn.esprit.backend.dto;

import lombok.*;
import tn.esprit.backend.entity.Match.MatchStatus;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MatchDTO {
    private Long        matchId;
    private Long        otherUserId;
    private String      otherUserName;
    private String      otherUserCity;
    private Integer     otherUserWeek;
    private String      otherUserPregnancyType;
    private Boolean     otherUserHasBaby;
    private Double      aiScore;
    private String      reason;
    private MatchStatus myStatus;      // MY decision
    private MatchStatus theirStatus;   // their decision
    private boolean     iAmA;          // true = I triggered this match
    private boolean     mutualMatch;   // true = both ACCEPTED
}