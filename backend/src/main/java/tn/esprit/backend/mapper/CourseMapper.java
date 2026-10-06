package tn.esprit.backend.mapper;


import tn.esprit.backend.dto.CourseCardResponse;
import tn.esprit.backend.entity.Course;

public class CourseMapper {

    private CourseMapper() {
    }

    public static CourseCardResponse toCardResponse(Course course) {
        return CourseCardResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .titleAr(course.getTitleAr())
                .category(course.getCategory())
                .durationMin(course.getDurationMin())
                .level(course.getLevel() != null ?
                        course.getLevel().name() : null)
                .thumbnail(course.getThumbnail())
                .moduleCount(course.getModules() != null ?
                        course.getModules().size() : 0)
                .build();
    }
}
