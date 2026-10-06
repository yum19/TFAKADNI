package tn.esprit.backend.controller.advanced;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.esprit.backend.service.advanced.AiModuleService;

import java.util.Map;

@RestController
@RequestMapping("/api/learning/ai")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'PARTNER')")
public class AiLearningController {

    private final AiModuleService aiModuleService;

    /* @PostMapping(value = "/video", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> generateVideo(
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        return ResponseEntity.ok(aiModuleService.triggerVideoGeneration(content, file));
    } */

    @PostMapping(value = "/video", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> generateVideo(
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam("course_title") String courseTitle,
            @RequestParam("course_id") String courseId,
            @RequestParam("module_title") String moduleTitle) {
        return ResponseEntity.ok(aiModuleService.triggerVideoGeneration(content, file, courseTitle, courseId, moduleTitle));
    }

    @GetMapping("/video/{taskId}")
    public ResponseEntity<Map<String, String>> getVideoStatus(@PathVariable String taskId) {
        return ResponseEntity.ok(aiModuleService.getVideoStatus(taskId));
    }
}