package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.DecideRequest;
import tn.esprit.backend.dto.MatchDTO;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.MatchService;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class MatchController {

    private final MatchService  matchService;
    private final UserRepository userRepository;

    /**
     * Extracts the authenticated user's ID from the SecurityContext.
     *
     * Your JwtAuthFilter stores the email (or username) as the principal name.
     * We use that to look up the user's real DB id.
     *
     * This works regardless of whether @AuthenticationPrincipal resolves to
     * your User entity or a plain UserDetails object.
     */
    private Long getCurrentUserId() {
        // The principal name is whatever your JwtAuthFilter set —
        // typically the user's email address.
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found: " + email))
                .getId();
    }

    /**
     * POST /api/matches/generate
     * Identifies the caller via JWT → returns [] if no active pregnancy.
     */
    @PostMapping("/generate")
    public ResponseEntity<List<MatchDTO>> generate() {
        try {
            Long userId = getCurrentUserId();
            log.info("Generating matches for userId={}", userId);

            List<MatchDTO> results = matchService.generateAndPersistMatches(userId);
            log.info("Generated {} matches", results.size());

            return ResponseEntity.ok(results);

        } catch (Exception e) {
            log.error("MATCH GENERATE ERROR: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * POST /api/matches/decide
     * Body: { "matchId": 1, "decision": "ACCEPTED" }
     */
    @PostMapping("/decide")
    public ResponseEntity<MatchDTO> decide(@RequestBody DecideRequest req) {
        return ResponseEntity.ok(
                matchService.decide(getCurrentUserId(), req));
    }

    /**
     * GET /api/matches/mine
     * Returns matches for the logged-in user only.
     */
    @GetMapping("/mine")
    public ResponseEntity<List<MatchDTO>> mine() {
        return ResponseEntity.ok(
                matchService.getMyMatches(getCurrentUserId()));
    }
}