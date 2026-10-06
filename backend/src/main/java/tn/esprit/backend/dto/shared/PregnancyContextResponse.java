package tn.esprit.backend.dto.shared;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class PregnancyContextResponse {
    private Long id;
    private Long userId;
    private Integer weekNumber;
    private LocalDate dueDate;
    private String babyName;
    private Boolean isSharedPartner;
}
