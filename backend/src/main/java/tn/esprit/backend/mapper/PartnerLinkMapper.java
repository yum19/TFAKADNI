package tn.esprit.backend.mapper;

import tn.esprit.backend.dto.response.PartnerLinkResponse;
import tn.esprit.backend.dto.response.PartnerPermissionResponse;
import tn.esprit.backend.entity.PartnerLink;
import tn.esprit.backend.entity.PartnerPermission;
import tn.esprit.backend.enumtype.PartnerPermissionType;

import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

public class PartnerLinkMapper {

    private PartnerLinkMapper() {
    }

    public static PartnerLinkResponse toResponse(PartnerLink link) {
        return PartnerLinkResponse.builder()
                .id(link.getId())
                .status(link.getStatus() != null ? link.getStatus().name() : null)
                .linkedAt(link.getLinkedAt())
                .motherId(link.getMother() != null ? link.getMother().getId() : null)
                .partnerId(link.getPartner() != null ? link.getPartner().getId() : null)
                .pregnancyId(link.getPregnancy() != null ? link.getPregnancy().getId() : null)
                .permissions(toPermissionResponses(link))
                .build();
    }

    private static List<PartnerPermissionResponse> toPermissionResponses(PartnerLink link) {
        Map<PartnerPermissionType, PartnerPermission> permissionMap = new EnumMap<>(PartnerPermissionType.class);

        if (link.getPermissions() != null) {
            for (PartnerPermission permission : link.getPermissions()) {
                if (permission != null && permission.getPermissionType() != null) {
                    permissionMap.put(permission.getPermissionType(), permission);
                }
            }
        }

        return Arrays.stream(PartnerPermissionType.values())
                .map(permissionType -> {
                    PartnerPermission existing = permissionMap.get(permissionType);
                    return PartnerPermissionResponse.builder()
                            .id(existing != null ? existing.getId() : null)
                            .permissionType(permissionType.name())
                            .allowed(existing != null && Boolean.TRUE.equals(existing.getAllowed()))
                            .build();
                })
                .toList();
    }
}
