package tn.esprit.backend.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FollowNotificationPayload {
    private Long followerId;
    private String followerName;
    private String message;
    private String type; // "FOLLOW"
}