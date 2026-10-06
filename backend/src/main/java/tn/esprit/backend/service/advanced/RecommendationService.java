package tn.esprit.backend.service.advanced;

import tn.esprit.backend.dto.response.RecommendedCourseResponse;
import tn.esprit.backend.entity.Course;

import java.util.List;

public interface RecommendationService {
    List<RecommendedCourseResponse> recommendCourses(Long userId, Integer currentWeek);
}

