package tn.esprit.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import tn.esprit.backend.enumtype.PartnerPermissionType;

@Data
public class PartnerPermissionRequest {

    @NotNull
    private PartnerPermissionType permissionType;

    @NotNull
    private Boolean allowed;
}
