package tn.esprit.backend.service;

import tn.esprit.backend.dto.request.ReviewRequest;
import tn.esprit.backend.entity.CourseReview;

import java.util.List;

public interface CourseReviewService {

    CourseReview saveReview(ReviewRequest request);
    List<CourseReview> getCourseReviews(Long courseId);

}
