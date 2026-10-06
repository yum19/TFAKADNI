package tn.esprit.backend.service;

import tn.esprit.backend.dto.request.EnrollmentRequest;
import tn.esprit.backend.dto.request.UpdateProgressRequest;
import tn.esprit.backend.entity.Enrollment;

import java.util.List;

public interface EnrollmentService {

    Enrollment enroll(EnrollmentRequest request);
    Enrollment updateProgress(UpdateProgressRequest request);
    List<Enrollment> getUserEnrollments(Long userId);
    Enrollment getByUserAndCourse(Long userId, Long courseId);

}
