package tn.esprit.backend.service;

import tn.esprit.backend.dto.UserSummaryResponse;

import java.util.List;

public interface IFollowService {
    void follow(String currentUserEmail, Long targetUserId);
    void unfollow(String currentUserEmail, Long targetUserId);
    List<UserSummaryResponse> getFollowers(String currentUserEmail, Long userId);
    List<UserSummaryResponse> getFollowing(String currentUserEmail, Long userId);
    List<UserSummaryResponse> getSuggestedUsers(String currentUserEmail);
    List<UserSummaryResponse> getAllUsers(String currentUserEmail);
}