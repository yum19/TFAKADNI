package tn.esprit.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PartnerPermissionResponse {
    private Long id;
    private String permissionType;
    private Boolean allowed;
}
