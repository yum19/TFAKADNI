package tn.esprit.backend.module6a.scheduler;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import tn.esprit.backend.module6a.entity.Baby;
import tn.esprit.backend.module6a.repository.BabyRepository;
import tn.esprit.backend.module6a.service.IBabyInsightService;

import java.util.List;

@Component
@RequiredArgsConstructor
public class BabyInsightScheduler {

    private final BabyRepository babyRepository;
    private final IBabyInsightService babyInsightService;

    @Scheduled(fixedRate = 3600000) // every 1 hour
    public void refreshAllInsights() {
        List<Baby> babies = babyRepository.findAll();

        for (Baby baby : babies) {
            try {
                if (baby.getMother() != null && baby.getMother().getEmail() != null) {
                    babyInsightService.generateInsightsForBaby(
                            baby.getMother().getEmail(),
                            baby.getId()
                    );
                }
            } catch (Exception ignored) {
            }
        }
    }
}