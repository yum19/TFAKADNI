package tn.esprit.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.request.QuizRequest;
import tn.esprit.backend.dto.request.SubmitQuizRequest;
import tn.esprit.backend.dto.response.QuizAttemptResponse;
import tn.esprit.backend.dto.response.QuizResponse;
import tn.esprit.backend.entity.Quiz;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.mapper.QuizMapper;
import tn.esprit.backend.mapper.UserMapper;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.QuizService;

import java.util.List;

@RestController
@RequestMapping("/api/learning/quizzes")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER','PARTNER','ADMIN')")
public class QuizController {

    private final QuizService quizService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<QuizResponse> createQuiz(@Valid @RequestBody QuizRequest request) {
        return ResponseEntity.ok(QuizMapper.toResponse(quizService.createQuiz(request)));
    }

    @GetMapping("/{quizId}")
    public ResponseEntity<QuizResponse> getById(@PathVariable Long quizId) {
        return ResponseEntity.ok(QuizMapper.toResponse(quizService.getQuizById(quizId)));
    }

    @PostMapping("/submit")
    @PreAuthorize("hasAnyRole('USER','PARTNER')")
    public ResponseEntity<QuizAttemptResponse> submit(@Valid @RequestBody SubmitQuizRequest request,
                                                      Authentication authentication) {
        request.setUserId(getCurrentUserId(authentication));
        return ResponseEntity.ok(QuizMapper.toAttemptResponse(quizService.submitQuiz(request)));
    }

    @GetMapping("/{quizId}/attempts/me")
    @PreAuthorize("hasAnyRole('USER','PARTNER')")
    public ResponseEntity<List<QuizAttemptResponse>> getAttempts(@PathVariable Long quizId,
                                                                 Authentication authentication) {

        Long userId = getCurrentUserId(authentication);

        return ResponseEntity.ok(
                quizService.getAttempts(userId, quizId).stream()
                        .map(QuizMapper::toAttemptResponse)
                        .toList()
        );
    }

    private Long getCurrentUserId(Authentication authentication) {
        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"))
                .getId();
    }

    @PutMapping("/{quizId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<QuizResponse> updateQuiz(@PathVariable Long quizId, @Valid @RequestBody QuizRequest request) {
        return ResponseEntity.ok(QuizMapper.toResponse(quizService.updateQuiz(quizId, request)));
    }

    @DeleteMapping("/{quizId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteQuiz(@PathVariable Long quizId) {
        quizService.deleteQuiz(quizId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/generate-ai")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<QuizResponse> generateAiQuiz(
            @RequestParam Long courseModuleId,
            @RequestParam String topic,
            @RequestParam(defaultValue = "5") int numberOfQuestions,
            @RequestParam(defaultValue = "70") Integer passScore) {

        Quiz generatedQuiz = quizService.generateQuizViaAI(courseModuleId, topic, numberOfQuestions, passScore);
        return ResponseEntity.ok(QuizMapper.toResponse(generatedQuiz));
    }
}