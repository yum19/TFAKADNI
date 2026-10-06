// src/main/java/tn/esprit/backend/dto/CallRecordDTO.java
package tn.esprit.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CallRecordDTO {
    private Long          id;
    private String        callId;
    private Long          callerId;
    private String        callerName;
    private Long          calleeId;
    private String        calleeName;
    private String        callType;       // AUDIO | VIDEO
    private String        callStatus;     // ANSWERED | MISSED | REJECTED | CANCELLED
    private Integer       durationSeconds;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
}