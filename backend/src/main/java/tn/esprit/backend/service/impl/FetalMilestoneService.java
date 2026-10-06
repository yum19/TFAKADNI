package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.backend.entity.FetalMilestone;
import tn.esprit.backend.repository.FetalMilestoneRepository;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FetalMilestoneService {

    private final FetalMilestoneRepository fetalMilestoneRepository;

    public FetalMilestone getByWeek(Integer weekNumber) {
        return fetalMilestoneRepository.findByWeekNumber(weekNumber);
    }

    public List<FetalMilestone> getByTrimester(FetalMilestone.Trimester trimester) {
        return fetalMilestoneRepository.findByTrimester(trimester);
    }

    public List<FetalMilestone> getAll() {
        return fetalMilestoneRepository.findAll();
    }

    public FetalMilestone create(FetalMilestone milestone) {
        return fetalMilestoneRepository.save(milestone);
    }

    public FetalMilestone update(Long id, FetalMilestone updated) {
        FetalMilestone existing = fetalMilestoneRepository
                .findById(id)
                .orElseThrow(() -> new RuntimeException("Semaine non trouvée"));

        existing.setTitle(updated.getTitle());
        existing.setTitleAr(updated.getTitleAr());
        existing.setDescription(updated.getDescription());
        existing.setDescriptionAr(updated.getDescriptionAr());
        existing.setTrimester(updated.getTrimester());   // ← CORRIGÉ : manquait !
        existing.setSizeCm(updated.getSizeCm());
        existing.setWeightG(updated.getWeightG());
        existing.setSizeComparison(updated.getSizeComparison());
        existing.setImageUrl(updated.getImageUrl());
        existing.setMotherSymptoms(updated.getMotherSymptoms());
        existing.setMedicalAdvice(updated.getMedicalAdvice());

        return fetalMilestoneRepository.save(existing);
    }

    public void delete(Long id) {
        fetalMilestoneRepository.deleteById(id);
    }

    public FetalMilestone getById(Long id) {
        return fetalMilestoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Semaine non trouvée"));
    }
}