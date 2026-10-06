package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.dto.request.CourseModuleRequest;
import tn.esprit.backend.dto.request.ReorderCourseModulesRequest;
import tn.esprit.backend.dto.request.UpdateCourseModuleRequest;
import tn.esprit.backend.entity.Course;
import tn.esprit.backend.entity.CourseModule;
import tn.esprit.backend.repository.CourseModuleRepository;
import tn.esprit.backend.repository.CourseRepository;
import tn.esprit.backend.service.CourseModuleService;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class CourseModuleServiceImpl implements CourseModuleService {

    private final CourseModuleRepository courseModuleRepository;
    private final CourseRepository courseRepository;


    @Override
    public CourseModule createModule(CourseModuleRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found"));
        boolean duplicatedOrder = courseModuleRepository
                .findByCourseIdOrderByOrderIndexAsc(course.getId())
                        .stream()
                        .anyMatch(module -> module.getOrderIndex().equals(request.getOrderIndex()));

        if (duplicatedOrder) {
            throw new RuntimeException("A module already exists with this order index in the same course");
        }

        CourseModule module = CourseModule.builder()
                .course(course)
                .title(request.getTitle())
                .contentType(request.getContentType())
                .contentUrl(request.getContentUrl())
                .contentText(request.getContentText())
                .orderIndex(request.getOrderIndex())
                .durationMin(request.getDurationMin())
                .build();

        return courseModuleRepository.save(module);
    }


    @Override
    public CourseModule updateModule(Long moduleId, UpdateCourseModuleRequest
            request) {

        CourseModule module = courseModuleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Course module not found"));

        boolean duplicatedOrder = courseModuleRepository
                .findByCourseIdOrderByOrderIndexAsc(module.getCourse().getId())
                        .stream()
                        .anyMatch(existing -> !existing.getId().equals(moduleId) &&
                                existing.getOrderIndex().equals(request.getOrderIndex()));

        if (duplicatedOrder) {
            throw new RuntimeException("Another module already uses this order index in the same course");
        }

        module.setTitle(request.getTitle());
        module.setContentType(request.getContentType());
        module.setContentUrl(request.getContentUrl());
        module.setContentText(request.getContentText());
        module.setOrderIndex(request.getOrderIndex());
        module.setDurationMin(request.getDurationMin());

        return courseModuleRepository.save(module);
    }


    @Override
    public void deleteModule(Long moduleId) {

        CourseModule module = courseModuleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Course module not found"));

        courseModuleRepository.delete(module);
    }


    @Override
    @Transactional(readOnly = true)
    public CourseModule getModuleById(Long moduleId) {
        return courseModuleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Course module not found"));
    }


    @Override
    @Transactional(readOnly = true)
    public List<CourseModule> getModulesByCourse(Long courseId) {
        return courseModuleRepository.findByCourseIdOrderByOrderIndexAsc(courseId);
    }


    @Override
    public List<CourseModule> reorderModules(Long courseId, ReorderCourseModulesRequest request) {
        List<CourseModule> modules = courseModuleRepository.findByCourseIdOrderByOrderIndexAsc(courseId);

        if (modules.size() != request.getModuleIdsInOrder().size()) {
            throw new RuntimeException("The provided module list size does not match the course modules count");
        }

        Set<Long> existingIds = modules.stream().map(CourseModule::getId).collect(Collectors.toSet());
        Set<Long> providedIds = new HashSet<>(request.getModuleIdsInOrder());

        if (!existingIds.equals(providedIds)) {
            throw new RuntimeException("The provided module ids do not match the modules of this course");
        }

        List<CourseModule> updated = new ArrayList<>();
        for (int i = 0; i < request.getModuleIdsInOrder().size(); i++) {
            Long moduleId = request.getModuleIdsInOrder().get(i);
            CourseModule module = modules.stream()
                    .filter(m -> m.getId().equals(moduleId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Course module not found during reorder"));
            module.setOrderIndex(i + 1);
            updated.add(module);
        }

        return courseModuleRepository.saveAll(updated);
    }

}
