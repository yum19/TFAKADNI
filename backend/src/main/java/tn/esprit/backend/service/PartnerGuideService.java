package tn.esprit.backend.service;

import tn.esprit.backend.dto.request.PartnerGuideRequest;
import tn.esprit.backend.entity.PartnerGuide;

import java.util.List;

public interface PartnerGuideService {
    PartnerGuide createPartnerGuide(PartnerGuideRequest request);
    PartnerGuide updatePartnerGuide(Long guideId, PartnerGuideRequest request);
    void deletePartnerGuide(Long guideId);
    PartnerGuide getPartnerGuideById(Long guideId);
    List<PartnerGuide> getAllGuides();
    List<PartnerGuide> getGuidesByWeek(Integer week);
    List<PartnerGuide> getGuidesByCategory(String category);
    List<PartnerGuide> searchPartnerGuides(String keyword);
}

