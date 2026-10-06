package tn.esprit.backend.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class PartnerInviteRequest {

    private Long motherId;

    @NotNull
    private Long partnerId;

    @NotNull
    private Long pregnancyId;

    // private String permissionsJson;

    @NotEmpty
    private List<PartnerPermissionRequest> permissions;

}

