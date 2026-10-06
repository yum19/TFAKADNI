package tn.esprit.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.request.ReviewRequest;
import tn.esprit.backend.dto.response.ReviewResponse;
import tn.esprit.backend.entity.CourseReview;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.mapper.ReviewMapper;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.CourseReviewService;

import java.util.List;

@RestController
@RequestMapping("/api/learning/reviews")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER','PARTNER','ADMIN')")
public class CourseReviewController {

    private final CourseReviewService courseReviewService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('USER','PARTNER')")
    public ResponseEntity<ReviewResponse> saveReview(@Valid @RequestBody ReviewRequest request,
                                                     Authentication authentication) {

        request.setUserId(getCurrentUserId(authentication));

        return ResponseEntity.ok(ReviewMapper.toReviewResponse(courseReviewService.saveReview(request)));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<ReviewResponse>> getCourseReviews(@PathVariable
                                                               Long courseId) {
        return ResponseEntity.ok(
                courseReviewService.getCourseReviews(courseId).stream()
                        .map(ReviewMapper::toReviewResponse)
                        .toList()
        );
    }

    private Long getCurrentUserId(Authentication authentication) {
        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"))
                .getId();
    }

}
