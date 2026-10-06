package tn.esprit.backend.service;

import tn.esprit.backend.dto.request.CourseModuleRequest;
import tn.esprit.backend.dto.request.ReorderCourseModulesRequest;
import tn.esprit.backend.dto.request.UpdateCourseModuleRequest;
import tn.esprit.backend.entity.CourseModule;

import java.util.List;

public interface CourseModuleService {

    CourseModule createModule(CourseModuleRequest request);

    CourseModule updateModule(Long moduleId, UpdateCourseModuleRequest request);

    void deleteModule(Long moduleId);

    CourseModule getModuleById(Long moduleId);

    List<CourseModule> getModulesByCourse(Long courseId);

    List<CourseModule> reorderModules(Long courseId, ReorderCourseModulesRequest request);

}

