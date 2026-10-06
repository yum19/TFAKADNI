package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.dto.request.EnrollmentRequest;
import tn.esprit.backend.dto.request.UpdateProgressRequest;
import tn.esprit.backend.entity.Badge;
import tn.esprit.backend.entity.Course;
import tn.esprit.backend.entity.Enrollment;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.enumtype.EnrollmentStatus;
import tn.esprit.backend.repository.BadgeRepository;
import tn.esprit.backend.repository.CourseRepository;
import tn.esprit.backend.repository.EnrollmentRepository;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.EnrollmentService;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class EnrollmentServiceImpl implements EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final BadgeRepository badgeRepository;


    @Override
    public Enrollment enroll(EnrollmentRequest request) {

        enrollmentRepository.findByUserIdAndCourseId(request.getUserId(), request.getCourseId()).ifPresent(
                e -> {
                    throw new RuntimeException("User already enrolled in this course and " +
                            "this is the existing enrollment : "
                            + e);
                }
        );

        User user = userRepository.findById(request.getUserId()).orElseThrow(
                () -> new RuntimeException("User doesn't exist")
        );

        Course course = courseRepository.findById(request.getCourseId()).orElseThrow(
                () -> new RuntimeException("Course doesn't exist")
        );

        Enrollment enrollment = Enrollment.builder()
                .user(user)
                .course(course)
                .progressPct(0)
                .startedAt(LocalDateTime.now())
                .status(EnrollmentStatus.NOT_STARTED)
                .build();


        return enrollmentRepository.save(enrollment);
    }

    @Override
    public Enrollment updateProgress(UpdateProgressRequest request) {

        Enrollment enrollment = enrollmentRepository.
                findByUserIdAndCourseId(request.getUserId(), request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Enrollment doesn't exist"));

        enrollment.setProgressPct(request.getProgressPct());
        
        if (enrollment.getProgressPct() >= 100) {
            enrollment.setProgressPct(100);
            enrollment.setStatus(EnrollmentStatus.COMPLETED);

            if (enrollment.getCompletedAt() == null) {
                enrollment.setCompletedAt(LocalDateTime.now());
            }

            badgeRepository.findByUserIdAndCourseId(request.getUserId(), request.getCourseId())
                    .orElseGet(
                            () -> badgeRepository.save(Badge.builder()
                                    .user(enrollment.getUser())
                                    .course(enrollment.getCourse())
                                    .awardedAt(LocalDateTime.now())
                                    .badgeName("Course Completed")
                                    .badgeIcon("award.png")
                                    .build()
                            )
                    );

        } else if (enrollment.getProgressPct() > 0) {
            enrollment.setStatus(EnrollmentStatus.IN_PROGRESS);
        }

        return  enrollmentRepository.save(enrollment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Enrollment> getUserEnrollments(Long userId) {
        return enrollmentRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Enrollment getByUserAndCourse(Long userId, Long courseId) {
        return enrollmentRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));
    }
}
