package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.RatingDTO;
import tn.esprit.backend.dto.RatingRequest;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.RatingService;

@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RatingController {

    private final RatingService  ratingService;
    private final UserRepository userRepository;

    private Long getCurrentUserId() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email))
                .getId();
    }

    /**
     * POST /api/ratings
     * Body: { "matchId": 1, "stars": 4, "comment": "Great support!" }
     * Submits or updates a rating. Only allowed on mutual matches.
     */
    @PostMapping
    public ResponseEntity<RatingDTO> rate(@RequestBody RatingRequest req) {
        return ResponseEntity.ok(ratingService.rate(getCurrentUserId(), req));
    }

    /**
     * GET /api/ratings/mine?matchId=1
     * Returns the caller's existing rating for a match, or 204 if none.
     */
    @GetMapping("/mine")
    public ResponseEntity<RatingDTO> mine(@RequestParam Long matchId) {
        RatingDTO dto = ratingService.getMyRating(getCurrentUserId(), matchId);
        return dto != null
                ? ResponseEntity.ok(dto)
                : ResponseEntity.noContent().build();
    }

    /**
     * GET /api/ratings/user/{userId}
     * Returns average stars + total count for any user.
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<RatingDTO> userStats(@PathVariable Long userId) {
        return ResponseEntity.ok(ratingService.getUserStats(userId));
    }
}