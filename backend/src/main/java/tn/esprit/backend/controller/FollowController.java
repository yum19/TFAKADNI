// src/main/java/tn/esprit/backend/controller/FollowController.java
package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.FollowNotificationPayload;
import tn.esprit.backend.dto.UserSummaryResponse;
import tn.esprit.backend.dto.response.ApiResponse;
import tn.esprit.backend.service.IFollowService;

import java.util.List;

@RestController
@RequestMapping("/api/follows")
@RequiredArgsConstructor
public class FollowController {

    private final IFollowService        followService;
    private final SimpMessagingTemplate messagingTemplate;

    /** Follow a user */
    @PostMapping("/{targetId}")
    public ResponseEntity<ApiResponse<Void>> follow(
            @PathVariable Long targetId,
            Authentication authentication) {
        followService.follow(authentication.getName(), targetId);
        return ResponseEntity.ok(ApiResponse.ok("Followed successfully.", null));
    }

    /** Unfollow a user */
    @DeleteMapping("/{targetId}")
    public ResponseEntity<ApiResponse<Void>> unfollow(
            @PathVariable Long targetId,
            Authentication authentication) {
        followService.unfollow(authentication.getName(), targetId);
        return ResponseEntity.ok(ApiResponse.ok("Unfollowed successfully.", null));
    }

    /** Get followers of a user */
    @GetMapping("/{userId}/followers")
    public ResponseEntity<ApiResponse<List<UserSummaryResponse>>> getFollowers(
            @PathVariable Long userId,
            Authentication authentication) {
        return ResponseEntity.ok(
                ApiResponse.ok(followService.getFollowers(authentication.getName(), userId)));
    }

    /** Get who a user is following */
    @GetMapping("/{userId}/following")
    public ResponseEntity<ApiResponse<List<UserSummaryResponse>>> getFollowing(
            @PathVariable Long userId,
            Authentication authentication) {
        return ResponseEntity.ok(
                ApiResponse.ok(followService.getFollowing(authentication.getName(), userId)));
    }

    /** Suggested users to follow */
    @GetMapping("/suggestions")
    public ResponseEntity<ApiResponse<List<UserSummaryResponse>>> getSuggestions(
            Authentication authentication) {
        return ResponseEntity.ok(
                ApiResponse.ok(followService.getSuggestedUsers(authentication.getName())));
    }

    /** All users */
    @GetMapping("/all-users")
    public ResponseEntity<ApiResponse<List<UserSummaryResponse>>> getAllUsers(
            Authentication authentication) {
        return ResponseEntity.ok(
                ApiResponse.ok(followService.getAllUsers(authentication.getName())));
    }

    /**
     * DEBUG ONLY — test notification delivery to a specific email
     * Call: POST /api/follows/test-notif?email=user2@example.com
     * Remove this in production
     */
    @PostMapping("/test-notif")
    public ResponseEntity<String> testNotif(@RequestParam String email) {
        FollowNotificationPayload payload = FollowNotificationPayload.builder()
                .followerId(0L)
                .followerName("Test User")
                .message("Test notification sent to " + email)
                .type("FOLLOW")
                .build();
        messagingTemplate.convertAndSendToUser(email, "/queue/follow-notifications", payload);
        return ResponseEntity.ok("Notification sent to: " + email);
    }
}