package tn.esprit.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.backend.entity.Report;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponseDTO {
    private Long id;
    private Long postId;
    private String reporterEmail;
    private String reason;
    private String details;
    private LocalDateTime createdAt;

    public static ReportResponseDTO from(Report report) {
        return ReportResponseDTO.builder()
                .id(report.getId())
                .postId(report.getPost() != null ? report.getPost().getId() : null)
                .reporterEmail(report.getReporter() != null ? report.getReporter().getEmail() : null)
                .reason(report.getReason() != null ? report.getReason().name() : null)
                .details(report.getDetails())
                .createdAt(report.getReportedAt())
                .build();
    }
}