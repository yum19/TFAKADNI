package tn.esprit.backend.mapper;

import tn.esprit.backend.dto.response.CourseModuleResponse;
import tn.esprit.backend.entity.CourseModule;

public class CourseModuleMapper {

    private CourseModuleMapper() {
    }

    public static CourseModuleResponse toResponse(CourseModule module) {
        return CourseModuleResponse.builder()
                .id(module.getId())
                .courseId(module.getCourse() != null ? module.getCourse().getId() : null)
                .courseTitle(module.getCourse() != null ? module.getCourse().getTitle() : null)
                .title(module.getTitle())
                .contentType(module.getContentType())
                .contentUrl(module.getContentUrl())
                .contentText(module.getContentText())
                .orderIndex(module.getOrderIndex())
                .durationMin(module.getDurationMin())
                .quizId(module.getQuiz() != null ? module.getQuiz().getId() : null)
                .build();
    }
}

