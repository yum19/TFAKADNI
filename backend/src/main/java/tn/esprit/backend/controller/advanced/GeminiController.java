package tn.esprit.backend.controller.advanced;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.gemini.AiTextResponse;
import tn.esprit.backend.enumtype.PartnerPermissionType;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.impl.PartnerPermissionAccessService;
import tn.esprit.backend.service.advanced.GeminiService;

@RestController
@RequestMapping("/api/module7/ai")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER','PARTNER')")
public class GeminiController {

    private final GeminiService geminiService;
    private final UserRepository userRepository;
    private final PartnerPermissionAccessService partnerPermissionAccessService;

    @Value("${gemini.model}")
    private String model;

    @PostMapping("/partner-guides/{guideId}/summarize")
    public ResponseEntity<AiTextResponse> summarizePartnerGuide(@PathVariable Long guideId) {
        String result = geminiService.summarizePartnerGuideById(guideId);
        return ResponseEntity.ok(
                AiTextResponse.builder()
                        .feature("summarize-partner-guide-by-id")
                        .model(model)
                        .result(result)
                        .build()
        );
    }

    @PostMapping("/course-modules/{moduleId}/simplify")
    public ResponseEntity<AiTextResponse> simplifyCourseModule(@PathVariable Long moduleId) {
        String result = geminiService.simplifyCourseModuleById(moduleId);
        return ResponseEntity.ok(
                AiTextResponse.builder()
                        .feature("simplify-course-module-by-id")
                        .model(model)
                        .result(result)
                        .build()
        );
    }

    @PostMapping("/pregnancies/{pregnancyId}/partner-tips")
    public ResponseEntity<AiTextResponse> generatePartnerTips(@PathVariable Long pregnancyId,
                                                              Authentication authentication) {
        Long currentUserId = getCurrentUserId(authentication);
        partnerPermissionAccessService.assertPregnancyPermission(
                pregnancyId,
                currentUserId,
                PartnerPermissionType.VIEW_PREGNANCY
        );

        String result = geminiService.generateSupportivePartnerTipsByPregnancyId(pregnancyId);
        return ResponseEntity.ok(
                AiTextResponse.builder()
                        .feature("generate-partner-tips-by-pregnancy-id")
                        .model(model)
                        .result(result)
                        .build()
        );
    }

    @PostMapping("/quiz-attempts/{quizAttemptId}/explain-correction")
    public ResponseEntity<AiTextResponse> explainQuizCorrection(@PathVariable Long quizAttemptId) {
        String result = geminiService.explainQuizCorrectionByQuizAttemptId(quizAttemptId);
        return ResponseEntity.ok(
                AiTextResponse.builder()
                        .feature("explain-quiz-correction-by-quiz-attempt-id")
                        .model(model)
                        .result(result)
                        .build()
        );
    }

    private Long getCurrentUserId(Authentication authentication) {
        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"))
                .getId();
    }
}
