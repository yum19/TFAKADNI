package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.backend.entity.Enrollment;
import tn.esprit.backend.enumtype.EnrollmentStatus;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    Optional<Enrollment> findByUserIdAndCourseId(Long userId, Long courseId);

    List<Enrollment> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Enrollment> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, EnrollmentStatus status);

    Long countByUserIdAndStatus(Long userId, EnrollmentStatus status);

    List<Enrollment> findByUserId(Long userId);
}
