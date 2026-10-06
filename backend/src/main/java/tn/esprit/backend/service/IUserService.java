package tn.esprit.backend.service;

import tn.esprit.backend.dto.request.*;
import tn.esprit.backend.dto.response.*;

import java.util.List;

public interface IUserService {
    HealthProfileResponse createHealthProfileForCurrentUser(String email, HealthProfileRequest request);
    HealthProfileResponse getHealthProfile(Long userId);
    HealthProfileResponse updateHealthProfile(Long userId, HealthProfileRequest request);
    void                  deleteAccount(Long userId);
    byte[]                exportData(Long userId);
    List<SessionResponse> getSessions(Long userId);
    void                  revokeSession(Long userId, Long sessionId);

    // Admin
    List<AdminUserResponse> getAllUsers();
    AdminUserResponse       getUserDetail(Long userId);
}