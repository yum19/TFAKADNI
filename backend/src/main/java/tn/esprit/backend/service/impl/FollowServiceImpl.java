// src/main/java/tn/esprit/backend/service/impl/FollowServiceImpl.java
package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.dto.FollowNotificationPayload;
import tn.esprit.backend.dto.UserSummaryResponse;
import tn.esprit.backend.entity.Follow;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.repository.FollowRepository;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.IFollowService;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FollowServiceImpl implements IFollowService {

    private final FollowRepository      followRepository;
    private final UserRepository        userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private User resolveByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private User resolveById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    @Override
    @Transactional
    public void follow(String currentUserEmail, Long targetUserId) {
        User follower  = resolveByEmail(currentUserEmail);
        User following = resolveById(targetUserId);

        if (follower.getId().equals(targetUserId)) {
            throw new IllegalArgumentException("You cannot follow yourself.");
        }

        // ✅ Strict idempotency — if already following, do nothing (no duplicate)
        if (followRepository.existsByFollowerAndFollowing(follower, following)) {
            return;
        }

        followRepository.save(Follow.builder()
                .follower(follower)
                .following(following)
                .build());

        // ✅ Send real-time notification to the followed user
        // convertAndSendToUser(principal, destination, payload)
        // principal = following.getEmail() which matches the STOMP authenticated user
        FollowNotificationPayload payload = FollowNotificationPayload.builder()
                .followerId(follower.getId())
                .followerName(follower.getFirstName() + " " + follower.getLastName())
                .message(follower.getFirstName() + " " + follower.getLastName() + " started following you!")
                .type("FOLLOW")
                .build();

        try {
            messagingTemplate.convertAndSendToUser(
                    following.getEmail(),           // principal = email (matches UserDetails.getUsername())
                    "/queue/follow-notifications",  // destination suffix
                    payload
            );
            System.out.println("✅ Notification sent to: " + following.getEmail());
        } catch (Exception e) {
            // Don't fail the follow operation if notification fails
            System.err.println("Failed to send follow notification: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void unfollow(String currentUserEmail, Long targetUserId) {
        User follower  = resolveByEmail(currentUserEmail);
        User following = resolveById(targetUserId);

        followRepository.findByFollowerAndFollowing(follower, following)
                .ifPresent(followRepository::delete);
    }

    @Override
    public List<UserSummaryResponse> getFollowers(String currentUserEmail, Long userId) {
        User me     = resolveByEmail(currentUserEmail);
        User target = resolveById(userId);
        return followRepository.findFollowerUsers(target).stream()
                .map(u -> toSummary(u, me))
                .collect(Collectors.toList());
    }

    @Override
    public List<UserSummaryResponse> getFollowing(String currentUserEmail, Long userId) {
        User me     = resolveByEmail(currentUserEmail);
        User target = resolveById(userId);
        return followRepository.findFollowingUsers(target).stream()
                .map(u -> toSummary(u, me))
                .collect(Collectors.toList());
    }

    @Override
    public List<UserSummaryResponse> getSuggestedUsers(String currentUserEmail) {
        User me = resolveByEmail(currentUserEmail);
        List<User> alreadyFollowing = followRepository.findFollowingUsers(me);

        return userRepository.findAll().stream()
                .filter(u -> !u.getId().equals(me.getId()))
                .filter(u -> !alreadyFollowing.contains(u))
                .limit(10)
                .map(u -> toSummary(u, me))
                .collect(Collectors.toList());
    }

    @Override
    public List<UserSummaryResponse> getAllUsers(String currentUserEmail) {
        User me = resolveByEmail(currentUserEmail);
        return userRepository.findAll().stream()
                .filter(u -> !u.getId().equals(me.getId()))
                .map(u -> toSummary(u, me))
                .collect(Collectors.toList());
    }

    private UserSummaryResponse toSummary(User u, User viewer) {
        return UserSummaryResponse.builder()
                .id(u.getId())
                .firstName(u.getFirstName())
                .lastName(u.getLastName())
                .fullName(u.getFirstName() + " " + u.getLastName())
                .email(u.getEmail())
                .isFollowedByMe(followRepository.existsByFollowerAndFollowing(viewer, u))
                .followersCount(followRepository.countByFollowing(u))
                .followingCount(followRepository.countByFollower(u))
                .build();
    }
}