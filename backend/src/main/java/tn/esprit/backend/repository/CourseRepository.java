package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.backend.entity.Course;
import tn.esprit.backend.enumtype.CourseLevel;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    List<Course> findByCategoryIgnoreCaseOrderByCreatedAtDesc(String category);

    List<Course> findByLevelOrderByCreatedAtDesc(CourseLevel level);

    List<Course> findByTitleContainingIgnoreCaseOrderByCreatedAtDesc(String keyword);

    List<Course> findByCategoryIgnoreCaseAndLevelOrderByCreatedAtDesc(String category, CourseLevel level);
}

