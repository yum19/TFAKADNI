package tn.esprit.backend.controller.advanced;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.CourseCardResponse;
import tn.esprit.backend.dto.response.RecommendedCourseResponse;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.mapper.CourseMapper;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.advanced.RecommendationService;

import java.util.List;

@RestController
@RequestMapping("/api/learning/recommendations")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER','PARTNER')")
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<List<RecommendedCourseResponse>> recommendMyCourses(
            @RequestParam(required = false) Integer currentWeek,
            Authentication authentication
    ) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(recommendationService.recommendCourses(userId, currentWeek));
    }

    private Long getCurrentUserId(Authentication authentication) {
        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"))
                .getId();
    }

}

