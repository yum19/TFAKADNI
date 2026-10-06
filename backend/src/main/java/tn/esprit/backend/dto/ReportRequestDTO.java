// src/main/java/tn/esprit/backend/dto/ReportRequestDTO.java
package tn.esprit.backend.dto;

import lombok.Data;
import tn.esprit.backend.entity.Report;

@Data
public class ReportRequestDTO {
    private Long postId;
    private Report.ReportReason reason;
    private String details;
}