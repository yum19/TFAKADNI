package tn.esprit.backend.dto.shared;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserSummaryDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
}

