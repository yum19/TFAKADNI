package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.dto.request.PartnerInviteRequest;
import tn.esprit.backend.dto.request.PartnerPermissionRequest;
import tn.esprit.backend.dto.request.UpdatePartnerPermissionsRequest;
import tn.esprit.backend.entity.*;
import tn.esprit.backend.enumtype.NotificationType;
import tn.esprit.backend.enumtype.PartnerLinkStatus;
import tn.esprit.backend.repository.*;
import tn.esprit.backend.service.PartnerLinkService;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PartnerLinkServiceImpl implements PartnerLinkService {

    private final PartnerLinkRepository partnerLinkRepository;
    private final PartnerPermissionRepository partnerPermissionRepository;
    private final UserRepository userRepository;
    private final PregnancyRepository pregnancyRepository;
    private final PartnerNotificationRepository notificationRepository;

    /* @Override
    public PartnerLink createInvite(PartnerInviteRequest request) {
        User mother = userRepository.findById(request.getMotherId())
                .orElseThrow(() -> new RuntimeException("Mother not found"));

        User partner = userRepository.findById(request.getPartnerId())
                .orElseThrow(() -> new RuntimeException("Partner not found"));

        Pregnancy pregnancy = pregnancyRepository.findById(request.getPregnancyId())
                .orElseThrow(() -> new RuntimeException("Pregnancy not found"));

        if (!pregnancy.getUser().getId().equals(mother.getId())) {
            throw new RuntimeException("This pregnancy does not belong to the selected mother");
        }

        if (partnerLinkRepository.existsByPregnancyIdAndStatus(pregnancy.getId(), PartnerLinkStatus.ACCEPTED)) {
            throw new RuntimeException("An active partner link already exists for this pregnancy");
        }

        partnerLinkRepository.findByMotherIdAndPartnerIdAndPregnancyId(
                mother.getId(), partner.getId(), pregnancy.getId()
        ).ifPresent(existing -> {
            throw new RuntimeException("An invitation already exists for this partner and pregnancy");
        });

        PartnerLink partnerLink = PartnerLink.builder()
                .mother(mother)
                .partner(partner)
                .pregnancy(pregnancy)
                .status(PartnerLinkStatus.PENDING)
                .linkedAt(null)
                .build();

        savePermissions(partnerLink, request.getPermissions());

        PartnerLink savedPartnerLink = partnerLinkRepository.save(partnerLink);

        notificationRepository.save(
                PartnerNotification.builder()
                        .type(NotificationType.PARTNER_REQUEST)
                        .title("Partner invitation")
                        .body(mother.getFirstName() + " sent you a partner invitation.")
                        .relatedTo(partner)
                        .isRead(false)
                        .build()
        );

        return savedPartnerLink;
    } */

    @Override
    public PartnerLink createInvite(PartnerInviteRequest request) {
        User mother = userRepository.findById(request.getMotherId())
                .orElseThrow(() -> new RuntimeException("Mother not found"));

        if (!mother.getId().equals(request.getMotherId())) {
            throw new AccessDeniedException("You cannot create an invitation as another mother.");
        }

        User partner = userRepository.findById(request.getPartnerId())
                .orElseThrow(() -> new RuntimeException("Partner not found"));

        Pregnancy pregnancy = pregnancyRepository.findById(request.getPregnancyId())
                .orElseThrow(() -> new RuntimeException("Pregnancy not found"));

        if (!pregnancy.getUser().getId().equals(request.getMotherId())) {
            throw new AccessDeniedException("This pregnancy does not belong to the authenticated user.");
        }

        if (partner.getId().equals(request.getMotherId())) {
            throw new AccessDeniedException("You cannot invite yourself.");
        }

        if (partnerLinkRepository.existsByPregnancyIdAndStatus(pregnancy.getId(), PartnerLinkStatus.ACCEPTED)) {
            throw new RuntimeException("An active partner link already exists for this pregnancy");
        }

        partnerLinkRepository.findByMotherIdAndPartnerIdAndPregnancyId(
                mother.getId(), partner.getId(), pregnancy.getId()
        ).ifPresent(existing -> {
            throw new RuntimeException("An invitation already exists for this partner and pregnancy");
        });

        PartnerLink partnerLink = PartnerLink.builder()
                .mother(mother)
                .partner(partner)
                .pregnancy(pregnancy)
                .status(PartnerLinkStatus.PENDING)
                .linkedAt(null)
                .build();

        savePermissions(partnerLink, request.getPermissions());

        PartnerLink savedPartnerLink = partnerLinkRepository.save(partnerLink);

        notificationRepository.save(
                PartnerNotification.builder()
                        .type(NotificationType.PARTNER_REQUEST)
                        .title("Partner invitation")
                        .body(mother.getFirstName() + " sent you a partner invitation.")
                        .relatedTo(partner)
                        .isRead(false)
                        .build()
        );

        return savedPartnerLink;
    }

    /* @Override
    public PartnerLink acceptInvite(Long linkId) {
        PartnerLink link = partnerLinkRepository.findById(linkId)
                .orElseThrow(() -> new RuntimeException("Partner link not found"));

        if (link.getStatus() == PartnerLinkStatus.ACCEPTED) {
            return link;
        }

        if (partnerLinkRepository.existsByPregnancyIdAndStatus(link.getPregnancy().getId(), PartnerLinkStatus.ACCEPTED)) {
            throw new RuntimeException("Another accepted partner already exists for this pregnancy");
        }

        link.setStatus(PartnerLinkStatus.ACCEPTED);
        link.setLinkedAt(LocalDateTime.now());
        link.getPregnancy().setIsSharedPartner(true);

        notificationRepository.save(
                PartnerNotification.builder()
                        .type(NotificationType.GENERAL)
                        .title("Partner request accepted")
                        .body(link.getPartner().getFirstName() + " accepted the invitation.")
                        .relatedTo(link.getMother())
                        .isRead(false)
                        .build()
        );

        return partnerLinkRepository.save(link);
    }

    @Override
    public PartnerLink rejectInvite(Long linkId) {
        PartnerLink link = partnerLinkRepository.findById(linkId)
                .orElseThrow(() -> new RuntimeException("Partner link not found"));

        link.setStatus(PartnerLinkStatus.REJECTED);
        return partnerLinkRepository.save(link);
    }

    @Override
    public PartnerLink updatePermissions(Long linkId, UpdatePartnerPermissionsRequest request) {
        PartnerLink link = partnerLinkRepository.findById(linkId)
                .orElseThrow(() -> new RuntimeException("Partner link not found"));

        // partnerPermissionRepository.deleteAll(link.getPermissions());

        // On vide la liste : orphanRemoval s'occupera du DELETE SQL
        link.getPermissions().clear();

        partnerLinkRepository.saveAndFlush(link);

        savePermissions(link, request.getPermissions());

        return partnerLinkRepository.save(link);
    } */

    @Override
    public PartnerLink acceptInvite(Long linkId, Long currentUserId) {
        PartnerLink link = partnerLinkRepository.findById(linkId)
                .orElseThrow(() -> new RuntimeException("Partner link not found"));

        if (!link.getPartner().getId().equals(currentUserId)) {
            throw new AccessDeniedException("Only the invited partner can accept this invitation.");
        }

        if (link.getStatus() == PartnerLinkStatus.ACCEPTED) {
            return link;
        }

        if (partnerLinkRepository.existsByPregnancyIdAndStatus(link.getPregnancy().getId(), PartnerLinkStatus.ACCEPTED)) {
            throw new RuntimeException("Another accepted partner already exists for this pregnancy");
        }

        link.setStatus(PartnerLinkStatus.ACCEPTED);
        link.setLinkedAt(LocalDateTime.now());
        link.getPregnancy().setIsSharedPartner(true);

        notificationRepository.save(
                PartnerNotification.builder()
                        .type(NotificationType.GENERAL)
                        .title("Partner request accepted")
                        .body(link.getPartner().getFirstName() + " accepted the invitation.")
                        .relatedTo(link.getMother())
                        .isRead(false)
                        .build()
        );

        return partnerLinkRepository.save(link);
    }

    @Override
    public PartnerLink rejectInvite(Long linkId, Long currentUserId) {
        PartnerLink link = partnerLinkRepository.findById(linkId)
                .orElseThrow(() -> new RuntimeException("Partner link not found"));

        if (!link.getPartner().getId().equals(currentUserId)) {
            throw new AccessDeniedException("Only the invited partner can reject this invitation.");
        }

        link.setStatus(PartnerLinkStatus.REJECTED);
        return partnerLinkRepository.save(link);
    }

    @Override
    public PartnerLink updatePermissions(Long linkId, UpdatePartnerPermissionsRequest request, Long currentUserId) {
        PartnerLink link = partnerLinkRepository.findById(linkId)
                .orElseThrow(() -> new RuntimeException("Partner link not found"));

        if (!link.getMother().getId().equals(currentUserId)) {
            throw new AccessDeniedException("Only the mother can update partner permissions.");
        }

        link.getPermissions().clear();
        partnerLinkRepository.saveAndFlush(link);

        savePermissions(link, request.getPermissions());

        return partnerLinkRepository.save(link);
    }

    /* @Override
    @Transactional(readOnly = true)
    public PartnerLink getActiveByPregnancy(Long pregnancyId) {
        return partnerLinkRepository.findByPregnancyIdAndStatus(pregnancyId, PartnerLinkStatus.ACCEPTED)
                .orElseThrow(() -> new RuntimeException("No active partner link found"));
    } */

    @Override
    @Transactional(readOnly = true)
    public PartnerLink getActiveByPregnancy(Long pregnancyId, Long currentUserId) {
        PartnerLink link = partnerLinkRepository.findByPregnancyIdAndStatus(pregnancyId, PartnerLinkStatus.ACCEPTED)
                .orElseThrow(() -> new RuntimeException("No active partner link found"));

        boolean isMother = link.getMother().getId().equals(currentUserId);
        boolean isPartner = link.getPartner().getId().equals(currentUserId);

        if (!isMother && !isPartner) {
            throw new AccessDeniedException("You do not have access to this partner link.");
        }

        return link;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PartnerLink> getPartnerInvites(Long partnerId) {
        return partnerLinkRepository.findByPartnerIdOrderByCreatedAtDesc(partnerId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PartnerLink> getMotherLinks(Long motherId) {
        return partnerLinkRepository.findByMotherIdOrderByCreatedAtDesc(motherId);
    }

    private void savePermissions(PartnerLink partnerLink, List<PartnerPermissionRequest> permissions) {
        for (PartnerPermissionRequest permissionRequest : permissions) {
            PartnerPermission permission = PartnerPermission.builder()
                    .partnerLink(partnerLink)
                    .permissionType(permissionRequest.getPermissionType())
                    .allowed(permissionRequest.getAllowed())
                    .build();

            partnerLink.getPermissions().add(permission);
        }
    }
}