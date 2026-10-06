package tn.esprit.backend.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

public class SpaceDtos {

    @Data
    public static class CreateSpaceRequest {
        private String title;
        private tn.esprit.backend.entity.Space.SpaceCategory category;
        private tn.esprit.backend.entity.Space.SpaceAudience audience;
        private boolean anonymousAllowed;
        private int maxSpeakers;
        private LocalDateTime scheduledAt;
    }

    @Data
    public static class SpaceResponse {
        private Long id;
        private String title;
        private String category;
        private String audience;
        private boolean anonymousAllowed;
        private int maxSpeakers;
        private LocalDateTime scheduledAt;
        private LocalDateTime startedAt;
        private String status;
        private String hostEmail;
        private Long hostId;
        private String hostName;
        private LocalDateTime createdAt;
        private int listenerCount;
        private int speakerCount;
        private List<ParticipantDto> participants;
    }

    @Data
    public static class ParticipantDto {
        private Long userId;
        private String userName;
        private String userEmail;
        private String role;
        private boolean micActive;
        private boolean handRaised;
        private boolean anonymous;
    }

    @Data
    public static class SpaceWsMessage {
        private String type;
        private Long spaceId;
        private Long userId;
        private String userName;
        private String payload;
        private boolean value;
        private boolean anonymous;
    }
}