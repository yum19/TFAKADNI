package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import tn.esprit.backend.entity.Course;
import tn.esprit.backend.enumtype.CourseLevel;
import tn.esprit.backend.repository.CourseRepository;
import tn.esprit.backend.service.CourseService;

import java.util.List;

@Service
@Transactional // Tout ou Rien
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;

    @Override
    public Course createCourse(Course course) {
        return courseRepository.save(course);
    }

    @Override
    public Course updateCourse(Long id, Course course) {

        Course existingCourse = this.getCourseById(id);

        existingCourse.setTitle(course.getTitle());
        existingCourse.setTitleAr(course.getTitleAr());
        existingCourse.setDescription(course.getDescription());
        existingCourse.setCategory(course.getCategory());
        existingCourse.setDurationMin(course.getDurationMin());
        existingCourse.setLevel(course.getLevel());
        existingCourse.setThumbnail(course.getThumbnail());

        return courseRepository.save(existingCourse);
    }

    @Override
    public void deleteCourse(Long id) {
        if (!courseRepository.existsById(id)) {
            throw new RuntimeException("Course not found");
        }

        courseRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Course getCourseById(Long id) {
        return courseRepository.findById(id).orElseThrow(() -> new RuntimeException("Course not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Course> searchCourses(String keyword) {
        return courseRepository.findByTitleContainingIgnoreCaseOrderByCreatedAtDesc(keyword);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Course> filterCourses(String category, CourseLevel level) {

        if (category != null && !category.isBlank() && level != null) {
            return courseRepository.findByCategoryIgnoreCaseAndLevelOrderByCreatedAtDesc(category, level);
        } else if (category != null && !category.isBlank()) {
            return courseRepository.findByCategoryIgnoreCaseOrderByCreatedAtDesc(category);
        } else if (level != null) {
            return courseRepository.findByLevelOrderByCreatedAtDesc(level);
        }

        return courseRepository.findAll();
    }
}
