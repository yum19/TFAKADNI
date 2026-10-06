// src/main/java/tn/esprit/backend/dto/ReportRequestDTO.java
package tn.esprit.backend.entity;

import lombok.Data;

@Data
public class ReportRequestDTO {
    private Long postId;
    private Report.ReportReason reason;
    private String details;
}