package tn.esprit.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.request.CourseModuleRequest;
import tn.esprit.backend.dto.request.ReorderCourseModulesRequest;
import tn.esprit.backend.dto.request.UpdateCourseModuleRequest;
import tn.esprit.backend.dto.response.CourseModuleResponse;
import tn.esprit.backend.mapper.CourseModuleMapper;
import tn.esprit.backend.service.CourseModuleService;

import java.util.List;

@RestController
@RequestMapping("/api/learning/course-modules")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER','PARTNER','ADMIN')")
public class CourseModuleController {

    private final CourseModuleService courseModuleService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CourseModuleResponse> create(@Valid @RequestBody CourseModuleRequest request) {
        return ResponseEntity.ok(CourseModuleMapper.toResponse(courseModuleService.createModule(request)));
    }

    @PutMapping("/{moduleId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CourseModuleResponse> update(@PathVariable Long moduleId,
                                                       @Valid @RequestBody UpdateCourseModuleRequest request) {
        return ResponseEntity.ok(CourseModuleMapper.toResponse(courseModuleService.updateModule(moduleId, request)));
    }

    @DeleteMapping("/{moduleId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long moduleId) {
        courseModuleService.deleteModule(moduleId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{moduleId}")
    public ResponseEntity<CourseModuleResponse> getById(@PathVariable Long moduleId) {
        return ResponseEntity.ok(CourseModuleMapper.toResponse(courseModuleService.getModuleById(moduleId)));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<CourseModuleResponse>> getByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(
                courseModuleService.getModulesByCourse(courseId).stream()
                        .map(CourseModuleMapper::toResponse)
                        .toList()
        );
    }

    @PutMapping("/course/{courseId}/reorder")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CourseModuleResponse>> reorder(@PathVariable Long courseId,
                                                              @Valid @RequestBody ReorderCourseModulesRequest request) {
        return ResponseEntity.ok(
                courseModuleService.reorderModules(courseId, request).stream()
                        .map(CourseModuleMapper::toResponse)
                        .toList()
        );
    }

}
