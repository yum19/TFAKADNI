package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.esprit.backend.dto.RecommendationResponse;
import tn.esprit.backend.dto.response.ApiResponse;
import tn.esprit.backend.service.RecommendationProductService;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class RecommendationProductController {

    private final RecommendationProductService recommendationService;

    /**
     * GET /api/recommendations/products
     * Returns AI-recommended products based on user's pregnancy/baby profile
     */
    @GetMapping("/products")
    public ResponseEntity<ApiResponse<List<RecommendationResponse>>> getRecommendations(
            Authentication authentication
    ) {
        // Step 1: log auth state
        log.info("=== /recommendations/products called ===");
        log.info("Authentication: {}", authentication);
        log.info("Principal: {}", authentication != null ? authentication.getName() : "NULL");

        if (authentication == null || !authentication.isAuthenticated()) {
            log.error("No authentication found!");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Not authenticated"));
        }

        try {
            String email = authentication.getName();
            log.info("Fetching recommendations for: {}", email);

            List<RecommendationResponse> recommendations =
                    recommendationService.getProductRecommendations(email);

            log.info("Returning {} recommendations", recommendations.size());
            return ResponseEntity.ok(
                    ApiResponse.ok("Recommandations générées avec succès.", recommendations)
            );
        } catch (Exception e) {
            log.error("RECOMMENDATION ERROR: ", e);  // this prints the full stack trace
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }
}