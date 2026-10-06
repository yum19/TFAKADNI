package tn.esprit.backend.repository;

import org.springframework.stereotype.Repository;
import tn.esprit.backend.entity.CourseReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseReviewRepository extends JpaRepository<CourseReview, Long> {

    List<CourseReview> findByCourseIdOrderByCreatedAtDesc(Long courseId);

    Optional<CourseReview> findByUserIdAndCourseId(Long userId, Long courseId);

}

