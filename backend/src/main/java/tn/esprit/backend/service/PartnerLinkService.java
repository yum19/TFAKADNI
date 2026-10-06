package tn.esprit.backend.service;

import tn.esprit.backend.dto.request.PartnerInviteRequest;
import tn.esprit.backend.dto.request.UpdatePartnerPermissionsRequest;
import tn.esprit.backend.entity.PartnerLink;

import java.util.List;

public interface PartnerLinkService {

    PartnerLink createInvite(PartnerInviteRequest request);
    PartnerLink acceptInvite(Long linkId, Long currentUserId);
    PartnerLink rejectInvite(Long linkId, Long currentUserId);
    PartnerLink updatePermissions(Long linkId, UpdatePartnerPermissionsRequest request, Long currentUserId);
    PartnerLink getActiveByPregnancy(Long pregnancyId, Long currentUserId);
    List<PartnerLink> getPartnerInvites(Long partnerId);
    List<PartnerLink> getMotherLinks(Long motherId);

}