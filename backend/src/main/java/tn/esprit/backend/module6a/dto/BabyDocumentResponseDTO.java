package tn.esprit.backend.module6a.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BabyDocumentResponseDTO {

    private Long id;
    private Long babyId;
    private String title;
    private String documentType;
    private String fileUrl;
    private Long fileSize;
    private LocalDateTime uploadedAt;
    private String notes;
}