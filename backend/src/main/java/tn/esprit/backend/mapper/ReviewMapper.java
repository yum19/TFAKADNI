package tn.esprit.backend.mapper;

import tn.esprit.backend.dto.response.ReviewResponse;
import tn.esprit.backend.entity.CourseReview;

public class ReviewMapper {

    private ReviewMapper() {

    }

    public static ReviewResponse toReviewResponse(CourseReview courseReview) {
        return ReviewResponse.builder()
                .id(courseReview.getId())
                .rating(courseReview.getRating())
                .comment(courseReview.getComment())
                .userId(courseReview.getUser().getId())
                .courseId(courseReview.getCourse().getId())
                .build();
    }
}
