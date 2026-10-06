package tn.esprit.backend.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserSummaryResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private boolean isFollowedByMe;
    private long followersCount;
    private long followingCount;
}