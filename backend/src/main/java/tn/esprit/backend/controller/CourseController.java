package tn.esprit.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.CourseCardResponse;
import tn.esprit.backend.entity.Course;
import tn.esprit.backend.enumtype.CourseLevel;
import tn.esprit.backend.mapper.CourseMapper;
import tn.esprit.backend.service.CourseService;

import java.util.List;

@RestController
@RequestMapping("/api/learning/courses")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER','PARTNER','ADMIN')")
public class CourseController {

    private final CourseService courseService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Course> create(@Valid @RequestBody Course course) {
        return ResponseEntity.ok(courseService.createCourse(course));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Course> update(@PathVariable Long id, @Valid
    @RequestBody Course course) {
        return ResponseEntity.ok(courseService.updateCourse(id, course));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        courseService.deleteCourse(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Course> getById(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getCourseById(id));
    }

    @GetMapping
    public ResponseEntity<List<CourseCardResponse>> getAll() {
        return ResponseEntity.ok(
                courseService.getAllCourses().stream()
                        .map(CourseMapper::toCardResponse)
                        .toList()
        );
    }

    @GetMapping("/search")
    public ResponseEntity<List<CourseCardResponse>> search(@RequestParam String keyword) {
        return ResponseEntity.ok(
                courseService.searchCourses(keyword).stream()
                        .map(CourseMapper::toCardResponse)
                        .toList()
        );
    }

    @GetMapping("/filter")
    public ResponseEntity<List<CourseCardResponse>> filter(@RequestParam(required = false) String category,
           @RequestParam(required = false) CourseLevel level) {
        return ResponseEntity.ok(
                courseService.filterCourses(category, level).stream()
                        .map(CourseMapper::toCardResponse)
                        .toList()
        );
    }


}
