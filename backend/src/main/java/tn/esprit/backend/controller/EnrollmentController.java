package tn.esprit.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.request.EnrollmentRequest;
import tn.esprit.backend.dto.request.UpdateProgressRequest;
import tn.esprit.backend.dto.response.EnrollmentResponse;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.mapper.PartnerAndLearningResponseMapper;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.EnrollmentService;

import java.util.List;

@RestController
@RequestMapping("/api/learning/enrollments")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER','PARTNER')")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<EnrollmentResponse> enroll(@Valid @RequestBody EnrollmentRequest request,
                                                     Authentication authentication) {

        request.setUserId(getCurrentUserId(authentication));
        return ResponseEntity.ok(PartnerAndLearningResponseMapper
                .toEnrollmentResponse(enrollmentService.enroll(request)));

    }

    @PutMapping("/progress")
    public ResponseEntity<EnrollmentResponse> updateProgress(@Valid @RequestBody UpdateProgressRequest request,
                                                             Authentication authentication) {

        request.setUserId(getCurrentUserId(authentication));
        return ResponseEntity.ok(PartnerAndLearningResponseMapper
                .toEnrollmentResponse(enrollmentService.updateProgress(request)));

    }

    @GetMapping("/me")
    public ResponseEntity<List<EnrollmentResponse>> getMyEnrollments(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(
                enrollmentService.getUserEnrollments(userId).stream()
                        .map(PartnerAndLearningResponseMapper::toEnrollmentResponse)
                        .toList()
        );
    }

    @GetMapping("/me/course/{courseId}")
    public ResponseEntity<EnrollmentResponse> getMyEnrollmentForCourse(@PathVariable Long courseId,
                                                                       Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(
                PartnerAndLearningResponseMapper.toEnrollmentResponse(
                        enrollmentService.getByUserAndCourse(userId, courseId)
                )
        );
    }

    private Long getCurrentUserId(Authentication authentication) {
        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"))
                .getId();
    }

}
