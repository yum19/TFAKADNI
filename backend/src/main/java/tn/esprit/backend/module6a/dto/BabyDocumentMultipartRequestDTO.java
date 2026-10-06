package tn.esprit.backend.module6a.dto;

import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class BabyDocumentMultipartRequestDTO {
    private String title;
    private String documentType;
    private String notes;
    private MultipartFile file;
}