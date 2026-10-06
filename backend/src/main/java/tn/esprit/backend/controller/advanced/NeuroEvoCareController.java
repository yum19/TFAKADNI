package tn.esprit.backend.controller.advanced;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.esprit.backend.dto.response.EvoCareResponse;
import tn.esprit.backend.entity.Pregnancy;
import tn.esprit.backend.service.advanced.NeuroEvolutionaryService;
import tn.esprit.backend.service.impl.PregnancyService;
import tn.esprit.backend.util.ScheduleChromosome;

@RestController
@RequestMapping("/api/partner/neuro-evo")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PARTNER')")
public class NeuroEvoCareController {

    private final NeuroEvolutionaryService neuroEvolutionaryService;
    private final PregnancyService pregnancyService;

    @GetMapping("/generate-schedule")
    public ResponseEntity<?> generateSchedule() {
        Pregnancy pregnancy = pregnancyService.getActiveForPartner();
        if (pregnancy == null) {
            // return ResponseEntity.badRequest().body("No active pregnancy linked to your account.");
            pregnancy = pregnancyService.getById(20L);
        }

        long startTime = System.currentTimeMillis();

        // Trigger the entire Generative + Evolutionary Pipeline
        ScheduleChromosome optimalWeek = neuroEvolutionaryService.generateEvolutionarySchedule(pregnancy);

        long timeTaken = System.currentTimeMillis() - startTime;

        EvoCareResponse response = EvoCareResponse.builder()
                .algorithmType("LLM-Seeded Genetic Algorithm with Markov Penalties")
                .generationsRun(500)
                .computeTimeMs(timeTaken)
                .finalFitnessScore(Math.round(optimalWeek.getFitnessScore() * 100.0) / 100.0)
                .optimizedSchedule(optimalWeek.getGenes())
                .build();

        return ResponseEntity.ok(response);
    }
}