package tn.esprit.backend.controller.advanced;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.ollama.OllamaTextRequest;
import tn.esprit.backend.dto.ollama.OllamaTextResponse;
import tn.esprit.backend.dto.ollama.PartnerTipsRequest;
import tn.esprit.backend.dto.ollama.QuizCorrectionExplanationRequest;
import tn.esprit.backend.service.advanced.OllamaService;

@RestController
@RequestMapping("/api/module7/ollama")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER','PARTNER')")
public class OllamaController {

    private final OllamaService ollamaService;

    @Value("${ollama.model}")
    private String model;

    @PostMapping("/summarize-partner-guide")
    public ResponseEntity<OllamaTextResponse> summarizePartnerGuide(@Valid @RequestBody OllamaTextRequest request) {
        String result = ollamaService.summarizePartnerGuide(request.getText());
        return ResponseEntity.ok(
                OllamaTextResponse.builder()
                        .feature("summarize-partner-guide")
                        .model(model)
                        .result(result)
                        .build()
        );
    }

    @PostMapping("/simplify-course-content")
    public ResponseEntity<OllamaTextResponse> simplifyCourseContent(@Valid @RequestBody OllamaTextRequest request) {
        String result = ollamaService.simplifyCourseContent(request.getText());
        return ResponseEntity.ok(
                OllamaTextResponse.builder()
                        .feature("simplify-course-content")
                        .model(model)
                        .result(result)
                        .build()
        );
    }

    @PostMapping("/generate-partner-tips")
    public ResponseEntity<OllamaTextResponse> generatePartnerTips(@Valid @RequestBody PartnerTipsRequest request) {
        String result = ollamaService.generateSupportivePartnerTips(request.getPregnancyWeek(), request.getSituation());
        return ResponseEntity.ok(
                OllamaTextResponse.builder()
                        .feature("generate-partner-tips")
                        .model(model)
                        .result(result)
                        .build()
        );
    }

    @PostMapping("/explain-quiz-correction")
    public ResponseEntity<OllamaTextResponse> explainQuizCorrection(@Valid @RequestBody QuizCorrectionExplanationRequest request) {
        String result = ollamaService.explainQuizCorrectionSimply(
                request.getQuestion(),
                request.getCorrectAnswer(),
                request.getUserAnswer(),
                request.getCourseContext()
        );

        return ResponseEntity.ok(
                OllamaTextResponse.builder()
                        .feature("explain-quiz-correction")
                        .model(model)
                        .result(result)
                        .build()
        );
    }
}
