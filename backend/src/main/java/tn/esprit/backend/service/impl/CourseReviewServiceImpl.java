package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.dto.request.ReviewRequest;
import tn.esprit.backend.entity.Course;
import tn.esprit.backend.entity.CourseReview;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.repository.CourseRepository;
import tn.esprit.backend.repository.CourseReviewRepository;
import tn.esprit.backend.repository.EnrollmentRepository;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.CourseReviewService;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class CourseReviewServiceImpl implements CourseReviewService {

    private final CourseReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;

    @Override
    public CourseReview saveReview(ReviewRequest request) {

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(
                        () -> new RuntimeException("User not found!")
                );

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(
                        () -> new RuntimeException("Course not found!")
                );

        if (enrollmentRepository.findByUserIdAndCourseId(request.getUserId(), request.getCourseId()).isEmpty()) {
            throw new AccessDeniedException("You must be enrolled in the course before leaving a review.");
        }

        CourseReview review = reviewRepository.findByUserIdAndCourseId(request.getUserId(), request.getCourseId())
                .orElse(
                        CourseReview.builder()
                                .user(user)
                                .course(course)
                                .build()
                );

        review.setRating(request.getRating());
        review.setComment(request.getComment());

        return reviewRepository.save(review);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseReview> getCourseReviews(Long courseId) {
        return reviewRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
    }

}
