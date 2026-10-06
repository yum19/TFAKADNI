package tn.esprit.backend.service.advanced;

import lombok.RequiredArgsConstructor;
// import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.esprit.backend.dto.response.RecommendedCourseResponse;
import tn.esprit.backend.entity.Course;
import tn.esprit.backend.entity.Enrollment;
import tn.esprit.backend.repository.CourseRepository;
import tn.esprit.backend.repository.EnrollmentRepository;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationServiceImpl implements RecommendationService {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final GeminiService geminiService;

    // Poids de l'algorithme (Ajustables selon l'importance métier)
    private static final double WEIGHT_USER_AFFINITY = 0.50;
    private static final double WEIGHT_TIMELINE_RELEVANCE = 0.40;
    private static final double WEIGHT_COURSE_QUALITY = 0.10; // Pour une future intégration des notes (Reviews)

    // Structure interne pour stocker les scores sans polluer l'entité Course
    private record ScoredCourse(Course course, double finalScore) {}

    // @SneakyThrows
    @Override
    public List<RecommendedCourseResponse> recommendCourses(Long userId, Integer currentWeek) {

        // 1. Récupérer l'historique utilisateur
        List<Enrollment> userHistory = enrollmentRepository.findByUserId(userId);

        // Extraire les IDs des cours déjà suivis pour ne pas les recommander à nouveau
        Set<Long> enrolledCourseIds = userHistory.stream()
                .map(e -> e.getCourse().getId())
                .collect(Collectors.toSet());

        // Garder la liste des catégories uniques préférées par l'utilisateur (pour le prompt Gemini)
        List<String> userCategories = userHistory.stream()
                .map(e -> e.getCourse().getCategory())
                .distinct()
                .toList();

        // 2. Modéliser le profil utilisateur (Calcul des fréquences de catégories)
        Map<String, Double> categoryAffinities = calculateUserCategoryAffinities(userHistory);

        // 3. Récupérer tous les cours disponibles et filtrer ceux déjà pris
        List<Course> availableCourses = courseRepository.findAll().stream()
                .filter(course -> !enrolledCourseIds.contains(course.getId()))
                .toList();

        // 4. Scorer, Trier et Limiter pour obtenir les 5 meilleurs cours
        List<Course> top5Courses = availableCourses.stream()
                .map(course -> {
                    double score = calculateHybridScore(course, currentWeek, categoryAffinities);
                    return new ScoredCourse(course, score);
                })
                .sorted((a, b) -> Double.compare(b.finalScore(), a.finalScore()))
                .limit(5)
                .map(ScoredCourse::course)
                .toList();

        Map<Long, Integer> courseModuleCounts = top5Courses.stream()
                .collect(Collectors.toMap(Course::getId, c -> c.getModules() != null ? c.getModules().size() : 0));

        Map<Long, String> courseLevels = top5Courses.stream()
                .collect(Collectors.toMap(Course::getId, c -> c.getLevel() != null ? c.getLevel().name() : "UNKNOWN"));

        // 5. La Magie Asynchrone : Appels Gemini
        List<CompletableFuture<RecommendedCourseResponse>> futures = top5Courses.stream()
                .map(course -> CompletableFuture.supplyAsync(() -> {

                    // Cet appel réseau se fait en parallèle
                    String reason = geminiService.generateRecommendationReason(
                            course.getTitle(),
                            course.getCategory(),
                            userCategories,
                            currentWeek
                    );

                    // Construction de l'objet : on utilise nos Maps pré-calculées
                    return RecommendedCourseResponse.builder()
                            .id(course.getId())
                            .title(course.getTitle())
                            .titleAr(course.getTitleAr())
                            .category(course.getCategory())
                            .durationMin(course.getDurationMin())
                            .level(courseLevels.get(course.getId())) // Sécurisé
                            .thumbnail(course.getThumbnail())
                            .moduleCount(courseModuleCounts.get(course.getId())) // Sécurisé
                            .recommendationReason(reason)
                            .build();
                }))
                .toList();

        // 6. Attendre les résultats
        return futures.stream()
                .map(CompletableFuture::join)
                // .map(CompletableFuture::get)
                .toList();
    }

    /**
     * Calcule l'affinité de l'utilisateur pour chaque catégorie (de 0.0 à 1.0)
     */
    private Map<String, Double> calculateUserCategoryAffinities(List<Enrollment> history) {
        if (history.isEmpty()) return Collections.emptyMap();

        // Compte le nombre d'occurrences de chaque catégorie
        Map<String, Long> frequencyMap = history.stream()
                .map(e -> e.getCourse().getCategory())
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

        // Normalisation : transforme le compte en pourcentage (0.0 à 1.0)
        double totalEnrollments = history.size();
        return frequencyMap.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> entry.getValue() / totalEnrollments
                ));
    }

    /**
     * Le cœur de l'algorithme : Combine les différents scores pondérés.
     */
    private double calculateHybridScore(Course course, Integer currentWeek, Map<String, Double> affinities) {
        String category = course.getCategory() != null ? course.getCategory().toLowerCase() : "";

        // __ Score 1 : Affinité Utilisateur (0.0 à 1.0) __
        // Donne un léger bonus (0.1) aux catégories inconnues pour favoriser la découverte (Serendipity)
        double affinityScore = affinities.getOrDefault(course.getCategory(), 0.1);

        // __ Score 2 : Pertinence Temporelle (0.0 à 1.0) __
        double timelineScore = calculateTimelineScore(category, currentWeek);

        // __ Score 3 : Qualité intrinsèque du cours (0.0 à 1.0) __
        // Ici, on valorise la présence d'un niveau défini ou d'une description riche
        double qualityScore = (course.getLevel() != null ? 0.5 : 0.0) +
                (course.getDescription() != null && course.getDescription().length() > 50 ? 0.5 : 0.0);

        // -- FORMULE FINALE --
        return (affinityScore * WEIGHT_USER_AFFINITY) +
                (timelineScore * WEIGHT_TIMELINE_RELEVANCE) +
                (qualityScore * WEIGHT_COURSE_QUALITY);
    }

    /**
     * Évalue si le cours est adapté au stade actuel de la grossesse.
     */
    private double calculateTimelineScore(String category, Integer currentWeek) {
        if (currentWeek == null) return 0.5; // Score neutre si la semaine n'est pas connue

        // 1er Trimestre (Semaines 1-13)
        if (currentWeek <= 13) {
            if (category.contains("nutrition") || category.contains("early") || category.contains("symptoms")) return 1.0;
        }
        // 2ème Trimestre (Semaines 14-27)
        else if (currentWeek <= 27) {
            if (category.contains("exercise") || category.contains("yoga") || category.contains("development")) return 1.0;
            if (category.contains("nutrition")) return 0.7; // Toujours pertinent, mais moins prioritaire
        }
        // 3ème Trimestre (Semaines 28+)
        else {
            if (category.contains("birth") || category.contains("labor") || category.contains("postpartum") || category.contains("breastfeeding")) return 1.0;
            if (category.contains("hospital") || category.contains("preparation")) return 0.9;
        }

        // Si la catégorie est générale ("pregnancy"), pertinence moyenne constante
        if (category.contains("pregnancy")) return 0.6;

        return 0.2; // Faible pertinence si aucune règle ne correspond
    }
}