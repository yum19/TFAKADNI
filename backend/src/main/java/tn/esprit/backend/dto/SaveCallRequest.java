// src/main/java/tn/esprit/backend/dto/SaveCallRequest.java
package tn.esprit.backend.dto;

import lombok.Data;

@Data
public class SaveCallRequest {
    private String  callId;
    private Long    callerId;
    private Long    calleeId;
    private String  callType;        // AUDIO | VIDEO
    private String  callStatus;      // ANSWERED | MISSED | REJECTED | CANCELLED
    private Integer durationSeconds; // 0 if not answered
}