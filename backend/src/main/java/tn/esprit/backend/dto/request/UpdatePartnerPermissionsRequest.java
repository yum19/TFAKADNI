package tn.esprit.backend.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class UpdatePartnerPermissionsRequest {

    @NotEmpty
    private List<PartnerPermissionRequest> permissions;

}
