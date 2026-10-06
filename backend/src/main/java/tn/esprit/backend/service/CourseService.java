package tn.esprit.backend.service;

import tn.esprit.backend.entity.Course;
import tn.esprit.backend.enumtype.CourseLevel;

import java.util.List;

public interface CourseService {

    Course createCourse(Course course);

    Course updateCourse(Long id, Course course);

    void deleteCourse(Long id);

    Course getCourseById(Long id);

    List<Course> getAllCourses();

    List<Course> searchCourses(String keyword);

    List<Course> filterCourses(String category, CourseLevel level);

}
