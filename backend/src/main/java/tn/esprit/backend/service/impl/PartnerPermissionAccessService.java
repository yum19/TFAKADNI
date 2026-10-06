package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.entity.PartnerLink;
import tn.esprit.backend.entity.PartnerPermission;
import tn.esprit.backend.entity.Pregnancy;
import tn.esprit.backend.enumtype.PartnerLinkStatus;
import tn.esprit.backend.enumtype.PartnerPermissionType;
import tn.esprit.backend.repository.PartnerLinkRepository;
import tn.esprit.backend.repository.PregnancyRepository;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PartnerPermissionAccessService {

    private final PregnancyRepository pregnancyRepository;
    private final PartnerLinkRepository partnerLinkRepository;

    public void assertPregnancyAccess(Long pregnancyId, Long currentUserId) {
        assertPregnancyPermission(pregnancyId, currentUserId, null);
    }

    public void assertPregnancyPermission(Long pregnancyId, Long currentUserId, PartnerPermissionType permissionType) {
        Pregnancy pregnancy = pregnancyRepository.findById(pregnancyId)
                .orElseThrow(() -> new RuntimeException("Pregnancy not found"));

        if (pregnancy.getUser() != null && pregnancy.getUser().getId().equals(currentUserId)) {
            return;
        }

        PartnerLink acceptedLink = partnerLinkRepository
                .findByPregnancyIdAndStatus(pregnancyId, PartnerLinkStatus.ACCEPTED)
                .filter(link -> link.getPartner() != null && link.getPartner().getId().equals(currentUserId))
                .orElseThrow(() -> new AccessDeniedException("You are not linked to this pregnancy."));

        if (permissionType == null) {
            return;
        }

        boolean allowed = acceptedLink.getPermissions() != null && acceptedLink.getPermissions().stream()
                .filter(permission -> permission.getPermissionType() == permissionType)
                .anyMatch(permission -> Boolean.TRUE.equals(permission.getAllowed()));

        if (!allowed) {
            throw new AccessDeniedException("Missing permission: " + permissionType.name());
        }
    }

    public boolean hasPregnancyPermission(Long pregnancyId, Long currentUserId, PartnerPermissionType permissionType) {
        try {
            assertPregnancyPermission(pregnancyId, currentUserId, permissionType);
            return true;
        } catch (RuntimeException ex) {
            return false;
        }
    }

    public Set<Long> getAccessiblePregnancyIdsForPartner(Long partnerId, PartnerPermissionType permissionType) {
        List<PartnerLink> acceptedLinks = partnerLinkRepository.findByPartnerIdAndStatusOrderByCreatedAtDesc(
                partnerId,
                PartnerLinkStatus.ACCEPTED
        );

        return acceptedLinks.stream()
                .filter(link -> hasPermission(link, permissionType))
                .map(link -> link.getPregnancy().getId())
                .collect(Collectors.toSet());
    }

    public boolean hasPermission(PartnerLink link, PartnerPermissionType permissionType) {
        return link.getPermissions() != null && link.getPermissions().stream()
                .filter(permission -> permission.getPermissionType() == permissionType)
                .anyMatch(permission -> Boolean.TRUE.equals(permission.getAllowed()));
    }

    public boolean hasPermission(List<PartnerPermission> permissions, PartnerPermissionType permissionType) {
        return permissions != null && permissions.stream()
                .filter(permission -> permission.getPermissionType() == permissionType)
                .anyMatch(permission -> Boolean.TRUE.equals(permission.getAllowed()));
    }
}
