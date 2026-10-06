package tn.esprit.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PartnerLinkResponse {
    private Long id;
    private String status;
    private LocalDateTime linkedAt;
    private Long motherId;
    private Long partnerId;
    private Long pregnancyId;
    private List<PartnerPermissionResponse> permissions;
}
