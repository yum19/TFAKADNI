package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import tn.esprit.backend.dto.RecommendationResponse;
import tn.esprit.backend.dto.UserRecommendationProfiledto;
import tn.esprit.backend.entity.Produit;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.repository.ProduitRepository;
import tn.esprit.backend.repository.UserRecommendationProfileRepository;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.RecommendationProductService;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AI-powered product recommendation service.
 *
 * Flow:
 *  1. Load user's pregnancy + baby profile from DB
 *  2. Load all available products from DB
 *  3. Send both to the Python/Flask ML service via HTTP POST /recommend
 *  4. Flask returns { productId, relevanceScore, aiReason } list (sorted desc)
 *  5. We enrich those with full product details and return to controller
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationProductServiceImpl implements RecommendationProductService {

    // ── Repos ─────────────────────────────────────────────────────────────────
    private final UserRepository              userRepository;
    private final ProduitRepository           produitRepository;
    private final UserRecommendationProfileRepository profileRepository;  // see below

    // ── HTTP client (already a @Bean in SecurityConfig) ───────────────────────
    private final RestTemplate restTemplate;

    @Value("${ml.service.url:http://localhost:5001}")
    private String mlServiceUrl;

    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public List<RecommendationResponse> getProductRecommendations(String email) {

        // 1. Resolve user
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Long userId = user.getId();

        // 2. Build user profile from pregnancies + babies
        List<UserRecommendationProfiledto> rows = profileRepository.findProfileByUserId(userId);
        Map<String, Object> userPayload = buildUserPayload(rows);

        // 3. Build product list payload
        List<Produit> allProducts = produitRepository.findAll();
        List<Map<String, Object>> productPayload = allProducts.stream()
                .map(this::toProductMap)
                .collect(Collectors.toList());

        if (productPayload.isEmpty()) {
            return Collections.emptyList();
        }

        // 4. Call Flask ML service
        Map<String, Object> requestBody = Map.of(
                "user",     userPayload,
                "products", productPayload
        );

        List<Map<String, Object>> mlResults = callMlService(requestBody);

        if (mlResults == null || mlResults.isEmpty()) {
            log.warn("ML service returned no results — falling back to domain scoring");
            return fallbackRecommendations(allProducts, userPayload);
        }

        // 5. Enrich with full product details
        Map<Long, Produit> productById = allProducts.stream()
                .collect(Collectors.toMap(Produit::getId, p -> p));

        return mlResults.stream()
                .map(r -> {
                    Long pid = ((Number) r.get("productId")).longValue();
                    Produit p = productById.get(pid);
                    if (p == null) return null;

                    double score = ((Number) r.get("relevanceScore")).doubleValue();
                    String reason = (String) r.getOrDefault("aiReason",
                            "Recommended based on your profile");

                    return RecommendationResponse.builder()
                            .productId(p.getId())
                            .nom(p.getNom())
                            .description(p.getDescription())
                            .prix(p.getPrix())
                            .stock(p.getStock())
                            .images(p.getImages())
                            .categorie(p.getCategorie() != null ? p.getCategorie().getNom() : null)
                            .aiReason(reason)
                            .relevanceScore(score)
                            .build();
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    // ── Build user JSON payload for Flask ─────────────────────────────────────

    private Map<String, Object> buildUserPayload(List<UserRecommendationProfiledto> rows) {
        Map<String, Object> payload = new HashMap<>();

        // Defaults
        payload.put("preg_week",    -1);
        payload.put("preg_status",  "NONE");
        payload.put("pregnancy_type","NONE");
        payload.put("is_twin",      0);
        payload.put("baby_count",   0);
        payload.put("min_baby_age", -1);
        payload.put("has_girl",     0);
        payload.put("has_boy",      0);

        int babyCount = 0;
        int minBabyAge = Integer.MAX_VALUE;
        boolean hasGirl = false;
        boolean hasBoy  = false;

        for (UserRecommendationProfiledto row : rows) {
            if ("PREGNANCY".equalsIgnoreCase(row.getSourceType())) {
                if (row.getLmpDate() != null) {
                    long weeks = ChronoUnit.WEEKS.between(row.getLmpDate(), LocalDate.now());
                    payload.put("preg_week", (int) weeks);
                }
                payload.put("preg_status",   row.getPregnancyStatus() != null ? row.getPregnancyStatus() : "NONE");
                payload.put("pregnancy_type",row.getPregnancyType()   != null ? row.getPregnancyType()   : "NONE");

                String type = (row.getPregnancyType() != null) ? row.getPregnancyType().toUpperCase() : "";
                payload.put("is_twin", (type.contains("TWIN") || type.contains("GEMELL")) ? 1 : 0);
            }

            if ("BABY".equalsIgnoreCase(row.getSourceType()) && row.getBabyBirthDate() != null) {
                babyCount++;
                int ageMonths = (int) ChronoUnit.MONTHS.between(row.getBabyBirthDate(), LocalDate.now());
                if (ageMonths < minBabyAge) minBabyAge = ageMonths;

                String gender = row.getBabyGender() != null ? row.getBabyGender().toUpperCase() : "";
                if (gender.contains("F")) hasGirl = true;
                if (gender.contains("M")) hasBoy  = true;
            }
        }

        payload.put("baby_count", babyCount);
        payload.put("min_baby_age", babyCount > 0 ? minBabyAge : -1);
        payload.put("has_girl", hasGirl ? 1 : 0);
        payload.put("has_boy",  hasBoy  ? 1 : 0);

        return payload;
    }

    // ── Build product JSON payload ────────────────────────────────────────────

    private Map<String, Object> toProductMap(Produit p) {
        Map<String, Object> m = new HashMap<>();
        m.put("product_id", p.getId());
        m.put("nom",        p.getNom());
        m.put("prix",       p.getPrix() != null ? p.getPrix() : 0.0);
        m.put("stock",      p.getStock() != null ? p.getStock() : 0);
        m.put("category",   p.getCategorie() != null ? p.getCategorie().getNom() : "unknown");
        return m;
    }

    // ── HTTP call to Flask ────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> callMlService(Map<String, Object> body) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    mlServiceUrl + "/recommend",
                    HttpMethod.POST,
                    request,
                    new ParameterizedTypeReference<>() {}
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("ML service call failed: {}", e.getMessage());
            return null;
        }
    }

    // ── Fallback: pure Java domain scoring when Flask is down ─────────────────

    private List<RecommendationResponse> fallbackRecommendations(
            List<Produit> products, Map<String, Object> userPayload) {

        int pregWeek  = (int) userPayload.getOrDefault("preg_week", -1);
        int babyAge   = (int) userPayload.getOrDefault("min_baby_age", -1);
        int isTwin    = (int) userPayload.getOrDefault("is_twin", 0);

        return products.stream()
                .map(p -> {
                    String cat = p.getCategorie() != null
                            ? p.getCategorie().getNom().toLowerCase() : "";
                    double score = 30.0;

                    if (cat.contains("maternit") || cat.contains("grossesse")) score += 20;
                    if (babyAge >= 0 && babyAge <= 12 && cat.contains("beb"))  score += 20;
                    if (isTwin == 1)                                            score += 10;
                    if (pregWeek >= 28 && cat.contains("layette"))             score += 15;

                    return RecommendationResponse.builder()
                            .productId(p.getId())
                            .nom(p.getNom())
                            .description(p.getDescription())
                            .prix(p.getPrix())
                            .stock(p.getStock())
                            .images(p.getImages())
                            .categorie(p.getCategorie() != null ? p.getCategorie().getNom() : null)
                            .aiReason("Recommended based on your pregnancy profile")
                            .relevanceScore(Math.min(score, 95.0))
                            .build();
                })
                .sorted(Comparator.comparingDouble(RecommendationResponse::getRelevanceScore).reversed())
                .limit(10)
                .collect(Collectors.toList());
    }
}