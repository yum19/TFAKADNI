package tn.esprit.backend.mapper;

import tn.esprit.backend.dto.response.PartnerGuideResponse;
import tn.esprit.backend.entity.PartnerGuide;

public class PartnerGuideMapper {

    private PartnerGuideMapper() {
    }

    public static PartnerGuideResponse toResponse(PartnerGuide guide) {
        return PartnerGuideResponse.builder()
                .id(guide.getId())
                .title(guide.getTitle())
                .titleAr(guide.getTitleAr())
                .content(guide.getContent())
                .targetWeek(guide.getTargetWeek())
                .category(guide.getCategory())
                .publishedAt(guide.getPublishedAt())
                .build();
    }
}

