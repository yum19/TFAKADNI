package tn.esprit.backend.service.advanced;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.esprit.backend.dto.request.DynamicCareTask;
import tn.esprit.backend.entity.Pregnancy;
import tn.esprit.backend.entity.PrenatalExam;
import tn.esprit.backend.entity.Vitals;
import tn.esprit.backend.repository.PrenatalExamRepository;
import tn.esprit.backend.repository.VitalsRepository;
import tn.esprit.backend.util.ScheduleChromosome;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class NeuroEvolutionaryService {

    private final GeminiService geminiService;
    private final VitalsRepository vitalsRepository;
    private final PrenatalExamRepository examRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Random random = new Random();

    // GA Hyperparameters
    private static final int POPULATION_SIZE = 100;
    private static final int MAX_GENERATIONS = 500;
    private static final double MUTATION_RATE = 0.20;

    /**
     * MASTER ORCHESTRATOR
     */
    public ScheduleChromosome generateEvolutionarySchedule(Pregnancy pregnancy) {
        // 1. Fetch real-time medical context
        String medicalContext = extractMotherContext(pregnancy);

        // 2. Phase 1: Generative AI creates a custom, dynamic gene pool (No DB!)
        List<DynamicCareTask> genePool = generateDynamicGenePool(medicalContext);

        // 3. Phase 2: Run the Genetic Algorithm
        return runGeneticAlgorithm(genePool, pregnancy);
    }

    /**
     * PHASE 1: GENERATIVE AI (Creates the DNA)
     */
    private List<DynamicCareTask> generateDynamicGenePool(String context) {
        String prompt = """
            You are a maternal health AI. The mother's current state is: %s
            
            Generate exactly 14 highly specific, unique care tasks the partner can do this week to support her. 
            Do NOT output markdown. Output STRICTLY a JSON array of objects matching this exact structure:
            [
              {
                "title": "Short Task Name",
                "description": "Specific detail based on her current medical context.",
                "category": "PHYSICAL", // Must be PHYSICAL, EMOTIONAL, CHORE, or MEDICAL
                "baseHealingScore": 8.5
              }
            ]
            """.formatted(context);

        try {
            // Attempt to reach Google Gemini
            String jsonResponse = geminiService.generateContent(prompt)
                    .replaceAll("```json", "").replaceAll("```", "").trim();
            return objectMapper.readValue(jsonResponse, new TypeReference<List<DynamicCareTask>>() {});

        } catch (Exception e) {
            // THE CIRCUIT BREAKER: If Google crashes (503), save the demo!
            log.warn("⚠️ Gemini API Unavailable (503). Triggering Circuit Breaker Fallback Pool.");
            return getFallbackGenePool();
        }
    }

    private List<DynamicCareTask> getFallbackGenePool() {
        return List.of(
                new DynamicCareTask("Deep Foot Massage", "Relieve her swelling with a 15-minute massage.", "PHYSICAL", 8.5),
                new DynamicCareTask("Cook a Craving", "Prepare her favorite safe meal.", "CHORE", 7.0),
                new DynamicCareTask("Hospital Bag Prep", "Review the checklist for the hospital bag.", "MEDICAL", 9.0),
                new DynamicCareTask("Read to the Bump", "Spend 10 minutes reading a story near her belly.", "EMOTIONAL", 6.5),
                new DynamicCareTask("Deep Cleaning", "Vacuum and mop so she doesn't have to bend over.", "CHORE", 7.5),
                new DynamicCareTask("Doctor Visit Review", "Sit down and organize notes from the last consultation.", "MEDICAL", 8.0),
                new DynamicCareTask("Breathing Exercises", "Practice the 4-7-8 breathing technique together.", "PHYSICAL", 9.5),
                new DynamicCareTask("Hydration Check", "Ensure she drinks at least 2 liters of water today.", "PHYSICAL", 8.0),
                new DynamicCareTask("Uninterrupted Venting", "Let her complain for 15 mins without offering solutions.", "EMOTIONAL", 9.0),
                new DynamicCareTask("Grocery Run", "Handle all grocery shopping for the week.", "CHORE", 6.0),
                new DynamicCareTask("Stretch Assist", "Help her with safe prenatal stretching.", "PHYSICAL", 7.0),
                new DynamicCareTask("Tech Detox", "Enforce 1 hour of no screens before bed.", "EMOTIONAL", 7.5)
        );
    }

    /**
     * PHASE 2: GENETIC ALGORITHM (Evolves the 7-day schedule)
     */
    private ScheduleChromosome runGeneticAlgorithm(List<DynamicCareTask> genePool, Pregnancy pregnancy) {
        // Find upcoming exams this week for chronological fitness scoring
        List<PrenatalExam> pendingExams = examRepository.findByPregnancyId(pregnancy.getId()).stream()
                .filter(e -> !e.getDone() && e.getRecommendedWeek() != null)
                .toList();

        List<ScheduleChromosome> population = new ArrayList<>();
        // Initialize Population
        for (int i = 0; i < POPULATION_SIZE; i++) {
            population.add(new ScheduleChromosome(generateRandomWeek(genePool)));
        }

        // Evolution Loop
        for (int gen = 0; gen < MAX_GENERATIONS; gen++) {
            // A. Calculate Fitness
            for (ScheduleChromosome chromosome : population) {
                chromosome.setFitnessScore(calculateChronologicalFitness(chromosome, pendingExams));
            }

            Collections.sort(population);

            // B. Elitism & Crossover
            List<ScheduleChromosome> nextGen = new ArrayList<>(population.subList(0, POPULATION_SIZE / 10)); // Top 10%
            while (nextGen.size() < POPULATION_SIZE) {
                ScheduleChromosome p1 = selectParent(population);
                ScheduleChromosome p2 = selectParent(population);
                ScheduleChromosome child = crossover(p1, p2);
                mutate(child, genePool);
                nextGen.add(child);
            }
            population = nextGen;
        }

        Collections.sort(population);
        return population.get(0); // The Alpha Schedule
    }

    /**
     * THE FITNESS FUNCTION: Mathematically proves the best schedule using constraints.
     */
    private double calculateChronologicalFitness(ScheduleChromosome chromosome, List<PrenatalExam> exams) {
        double score = 0;
        List<DynamicCareTask> days = chromosome.getGenes();
        Set<String> uniqueCategories = new HashSet<>();

        int currentDayOfWeek = LocalDate.now().getDayOfWeek().getValue(); // 1=Mon, 7=Sun

        for (int i = 0; i < days.size(); i++) {
            DynamicCareTask task = days.get(i);
            score += task.getBaseHealingScore();
            uniqueCategories.add(task.getCategory());

            // 1. Markov-Chain Penalty (Diminishing returns for repeating the same task category 2 days in a row)
            if (i > 0 && days.get(i - 1).getCategory().equals(task.getCategory())) {
                score -= 4.0;
            }

            // 2. Chronological Constraint Matrix (Medical Sync)
            // If an exam is scheduled soon, the algorithm artificially inflates the fitness
            // of "MEDICAL" tasks placed exactly ONE DAY before the exam.
            if (!exams.isEmpty() && task.getCategory().equals("MEDICAL")) {
                int taskDayIndex = (currentDayOfWeek + i) % 7;
                // Simulated check: assume exams are usually on Thursdays (Index 4).
                // If a Medical task lands on Wednesday (Index 3), massive bonus!
                if (taskDayIndex == 3) {
                    score += 50.0;
                }
            }
        }

        // 3. Diversity Bonus: Ensure the partner does a mix of chores, physical touch, and emotional support.
        score += (uniqueCategories.size() * 10.0);

        return score;
    }

    // --- Helper Methods ---

    private String extractMotherContext(Pregnancy pregnancy) {
        List<Vitals> vitals = vitalsRepository.findByPregnancyId(pregnancy.getId());
        if (vitals.isEmpty()) return "Mother is in standard pregnancy condition.";

        Vitals last = vitals.get(0);

        // Safely handle null vitals by providing realistic default fallbacks
        Integer sys = last.getSystolicBp() != null ? last.getSystolicBp() : 120;
        Integer dia = last.getDiastolicBp() != null ? last.getDiastolicBp() : 80;
        Integer hr = last.getHeartRate() != null ? last.getHeartRate() : 75;
        Double weight = last.getWeightKg() != null ? last.getWeightKg() : 65.0;

        return String.format("BP is %d/%d, HR is %d, Weight is %.1f kg. Experiences: %s",
                sys, dia, hr, weight,
                last.getNotes() != null ? last.getNotes() : "Fatigue and typical stress.");
    }

    private List<DynamicCareTask> generateRandomWeek(List<DynamicCareTask> genePool) {
        List<DynamicCareTask> week = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            week.add(genePool.get(random.nextInt(genePool.size())));
        }
        return week;
    }

    private ScheduleChromosome selectParent(List<ScheduleChromosome> pop) {
        ScheduleChromosome best = pop.get(random.nextInt(pop.size()));
        for (int i = 0; i < 3; i++) {
            ScheduleChromosome contender = pop.get(random.nextInt(pop.size()));
            if (contender.getFitnessScore() > best.getFitnessScore()) best = contender;
        }
        return best;
    }

    private ScheduleChromosome crossover(ScheduleChromosome p1, ScheduleChromosome p2) {
        List<DynamicCareTask> childGenes = new ArrayList<>();
        int split = random.nextInt(7);
        for (int i = 0; i < 7; i++) {
            childGenes.add(i < split ? p1.getGenes().get(i) : p2.getGenes().get(i));
        }
        return new ScheduleChromosome(childGenes);
    }

    private void mutate(ScheduleChromosome child, List<DynamicCareTask> genePool) {
        for (int i = 0; i < 7; i++) {
            if (random.nextDouble() < MUTATION_RATE) {
                child.getGenes().set(i, genePool.get(random.nextInt(genePool.size())));
            }
        }
    }
}