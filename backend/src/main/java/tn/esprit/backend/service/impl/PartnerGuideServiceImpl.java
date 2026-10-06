package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.dto.request.PartnerGuideRequest;
import tn.esprit.backend.entity.PartnerGuide;
import tn.esprit.backend.repository.PartnerGuideRepository;
import tn.esprit.backend.service.PartnerGuideService;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class PartnerGuideServiceImpl implements PartnerGuideService {

    private final PartnerGuideRepository partnerGuideRepository;

    @Override
    public PartnerGuide createPartnerGuide(PartnerGuideRequest request) {
        PartnerGuide guide = PartnerGuide.builder()
                .title(request.getTitle())
                .titleAr(request.getTitleAr())
                .content(request.getContent())
                .targetWeek(request.getTargetWeek())
                .category(request.getCategory())
                .publishedAt(LocalDateTime.now())
                .build();
        return partnerGuideRepository.save(guide);

    }

    @Override
    public PartnerGuide updatePartnerGuide(Long guideId, PartnerGuideRequest request) {
        PartnerGuide guide = partnerGuideRepository.findById(guideId)
                .orElseThrow(() -> new RuntimeException("Partner guide not found"));

        guide.setTitle(request.getTitle());
        guide.setTitleAr(request.getTitleAr());
        guide.setContent(request.getContent());
        guide.setTargetWeek(request.getTargetWeek());
        guide.setCategory(request.getCategory());
        return partnerGuideRepository.save(guide);
    }

    @Override
    public void deletePartnerGuide(Long guideId) {
        if (!partnerGuideRepository.existsById(guideId)) {
            throw new RuntimeException("Partner guide not found");
        }
        partnerGuideRepository.deleteById(guideId);
    }

    @Override
    @Transactional(readOnly = true)
    public PartnerGuide getPartnerGuideById(Long guideId) {
        return partnerGuideRepository.findById(guideId)
                .orElseThrow(() -> new RuntimeException("Partner guide not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PartnerGuide> getAllGuides() {
        return partnerGuideRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PartnerGuide> getGuidesByWeek(Integer week) {
        return partnerGuideRepository.findByTargetWeekLessThanEqualOrderByTargetWeekDesc(week);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PartnerGuide> getGuidesByCategory(String category) {
        return partnerGuideRepository.findByCategoryIgnoreCaseOrderByTargetWeekAsc(category);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PartnerGuide> searchPartnerGuides(String keyword) {
        return partnerGuideRepository.findByTitleContainingIgnoreCaseOrderByPublishedAtDesc(keyword);
    }

}
