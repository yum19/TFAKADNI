package tn.esprit.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.dto.SpaceDtos;
import tn.esprit.backend.entity.Space;
import tn.esprit.backend.entity.SpaceParticipant;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.repository.FollowRepository;
import tn.esprit.backend.repository.SpaceParticipantRepository;
import tn.esprit.backend.repository.SpaceRepository;
import tn.esprit.backend.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SpaceService {

    private final SpaceRepository            spaceRepo;
    private final SpaceParticipantRepository participantRepo;
    private final UserRepository             userRepo;
    private final SimpMessagingTemplate      messaging;
    private final FollowRepository           followRepo;

    // ── Create ───────────────────────────────────────────────
    @Transactional
    public SpaceDtos.SpaceResponse createSpace(String hostEmail,
                                               SpaceDtos.CreateSpaceRequest req) {
        User host = getUserByEmail(hostEmail);

        Space space = Space.builder()
                .title(req.getTitle())
                .category(req.getCategory())
                .audience(req.getAudience())
                .anonymousAllowed(req.isAnonymousAllowed())
                .maxSpeakers(req.getMaxSpeakers())
                .scheduledAt(req.getScheduledAt() != null
                        ? req.getScheduledAt()
                        : LocalDateTime.now())
                .hostEmail(hostEmail)
                .hostId(host.getId())
                .hostName(host.getFirstName() + " " + host.getLastName())
                .status(req.getScheduledAt() == null
                        || req.getScheduledAt().isBefore(LocalDateTime.now().plusSeconds(5))
                        ? Space.SpaceStatus.LIVE
                        : Space.SpaceStatus.SCHEDULED)
                .build();

        if (space.getStatus() == Space.SpaceStatus.LIVE) {
            space.setStartedAt(LocalDateTime.now());
        }

        space = spaceRepo.save(space);

        // Host auto-joins as HOST
        SpaceParticipant hostP = SpaceParticipant.builder()
                .space(space)
                .userId(host.getId())
                .userEmail(hostEmail)
                .userName(space.getHostName())
                .role(SpaceParticipant.ParticipantRole.HOST)
                .micActive(true)
                .anonymous(false)
                .build();
        participantRepo.save(hostP);

        notifySpaceUpdate(space, "CREATED");

        // Notify followers if LIVE immediately
        if (space.getStatus() == Space.SpaceStatus.LIVE) {
            notifyFollowers(space);
        }

        return toResponse(space);
    }

    // ── Start scheduled space ─────────────────────────────────
    @Transactional
    public SpaceDtos.SpaceResponse startSpace(Long spaceId, String hostEmail) {
        Space space = getSpaceOrThrow(spaceId);
        assertIsHost(space, hostEmail);
        space.setStatus(Space.SpaceStatus.LIVE);
        space.setStartedAt(LocalDateTime.now());
        space = spaceRepo.save(space);
        notifySpaceUpdate(space, "STARTED");

        // Broadcast to global notifications
        SpaceDtos.SpaceWsMessage msg = new SpaceDtos.SpaceWsMessage();
        msg.setType("STARTED");
        msg.setSpaceId(space.getId());
        msg.setPayload(space.getTitle());
        messaging.convertAndSend("/topic/spaces-notifications", msg);

        // Notify followers of host
        notifyFollowers(space);

        return toResponse(space);
    }

    // ── Join ──────────────────────────────────────────────────
    @Transactional
    public SpaceDtos.SpaceResponse joinSpace(Long spaceId, String userEmail) {
        return joinSpace(spaceId, userEmail, false, null);
    }

    @Transactional
    public SpaceDtos.SpaceResponse joinSpace(Long spaceId, String userEmail,
                                             boolean anonymous, String displayName) {
        Space space = getSpaceOrThrow(spaceId);
        User user = getUserByEmail(userEmail);

        if (participantRepo.existsBySpaceIdAndUserIdAndLeftAtIsNull(spaceId, user.getId())) {
            return toResponse(space);
        }

        String name = anonymous && displayName != null ? displayName
                : user.getFirstName() + " " + user.getLastName();

        SpaceParticipant p = SpaceParticipant.builder()
                .space(space)
                .userId(user.getId())
                .userEmail(userEmail)
                .userName(name)
                .role(SpaceParticipant.ParticipantRole.SPEAKER)
                .micActive(false)
                .anonymous(anonymous)
                .build();
        participantRepo.save(p);

        SpaceDtos.SpaceWsMessage wsMsg = new SpaceDtos.SpaceWsMessage();
        wsMsg.setType("JOIN");
        wsMsg.setSpaceId(spaceId);
        wsMsg.setUserId(user.getId());
        wsMsg.setUserName(name);
        wsMsg.setAnonymous(anonymous);
        messaging.convertAndSend("/topic/space." + spaceId, wsMsg);

        return toResponse(space);
    }

    // ── Leave ─────────────────────────────────────────────────
    @Transactional
    public void leaveSpace(Long spaceId, String userEmail) {
        User user = getUserByEmail(userEmail);
        Space space = getSpaceOrThrow(spaceId);

        participantRepo.findBySpaceIdAndUserIdAndLeftAtIsNull(spaceId, user.getId())
                .ifPresent(p -> {
                    p.setLeftAt(LocalDateTime.now());
                    participantRepo.save(p);
                });

        // If HOST leaves → end the room (status ENDED, not deleted)
        if (space.getHostId().equals(user.getId())) {
            endSpaceInternal(space);
            return;
        }

        SpaceDtos.SpaceWsMessage msg = new SpaceDtos.SpaceWsMessage();
        msg.setType("LEAVE");
        msg.setSpaceId(spaceId);
        msg.setUserId(user.getId());
        messaging.convertAndSend("/topic/space." + spaceId, msg);
    }

    // ── End space ─────────────────────────────────────────────
    @Transactional
    public void endSpace(Long spaceId, String hostEmail) {
        Space space = getSpaceOrThrow(spaceId);
        assertIsHost(space, hostEmail);
        endSpaceInternal(space);
    }

    private void endSpaceInternal(Space space) {
        space.setStatus(Space.SpaceStatus.ENDED);
        space.setEndedAt(LocalDateTime.now());
        spaceRepo.save(space);

        participantRepo.findBySpaceIdAndLeftAtIsNull(space.getId())
                .forEach(p -> {
                    p.setLeftAt(LocalDateTime.now());
                    participantRepo.save(p);
                });

        SpaceDtos.SpaceWsMessage msg = new SpaceDtos.SpaceWsMessage();
        msg.setType("END");
        msg.setSpaceId(space.getId());
        messaging.convertAndSend("/topic/space." + space.getId(), msg);

        // Also update the global list
        notifySpaceUpdate(space, "ENDED");
    }

    // ── Toggle mic (host can mute anyone) ─────────────────────
    @Transactional
    public void toggleMic(Long spaceId, String callerEmail, boolean active) {
        toggleMicForUser(spaceId, callerEmail, null, active);
    }

    @Transactional
    public void toggleMicForUser(Long spaceId, String callerEmail,
                                 Long targetUserId, boolean active) {
        User caller = getUserByEmail(callerEmail);
        Space space  = getSpaceOrThrow(spaceId);

        Long resolvedId = targetUserId != null ? targetUserId : caller.getId();

        // Only host can mute others
        if (!resolvedId.equals(caller.getId())) {
            assertIsHost(space, callerEmail);
        }

        participantRepo.findBySpaceIdAndUserIdAndLeftAtIsNull(spaceId, resolvedId)
                .ifPresent(p -> {
                    p.setMicActive(active);
                    participantRepo.save(p);
                });

        SpaceDtos.SpaceWsMessage msg = new SpaceDtos.SpaceWsMessage();
        msg.setType("MIC_TOGGLE");
        msg.setSpaceId(spaceId);
        msg.setUserId(resolvedId);
        msg.setValue(active);
        messaging.convertAndSend("/topic/space." + spaceId, msg);
    }

    // ── Raise/lower hand ──────────────────────────────────────
    @Transactional
    public void raiseHand(Long spaceId, String userEmail, boolean raised) {
        User user = getUserByEmail(userEmail);
        participantRepo.findBySpaceIdAndUserIdAndLeftAtIsNull(spaceId, user.getId())
                .ifPresent(p -> {
                    p.setHandRaised(raised);
                    participantRepo.save(p);
                });

        SpaceDtos.SpaceWsMessage msg = new SpaceDtos.SpaceWsMessage();
        msg.setType("HAND_RAISE");
        msg.setSpaceId(spaceId);
        msg.setUserId(user.getId());
        msg.setValue(raised);
        messaging.convertAndSend("/topic/space." + spaceId, msg);
    }

    // ── Promote listener → speaker ────────────────────────────
    @Transactional
    public void promoteToSpeaker(Long spaceId, String hostEmail, Long targetUserId) {
        Space space = getSpaceOrThrow(spaceId);
        assertIsHost(space, hostEmail);

        long speakers = participantRepo.countBySpaceIdAndRoleAndLeftAtIsNull(
                spaceId, SpaceParticipant.ParticipantRole.SPEAKER);
        if (speakers >= space.getMaxSpeakers()) {
            throw new RuntimeException("Max speakers reached");
        }

        participantRepo.findBySpaceIdAndUserIdAndLeftAtIsNull(spaceId, targetUserId)
                .ifPresent(p -> {
                    p.setRole(SpaceParticipant.ParticipantRole.SPEAKER);
                    p.setMicActive(true);
                    p.setHandRaised(false);
                    participantRepo.save(p);
                });

        SpaceDtos.SpaceWsMessage msg = new SpaceDtos.SpaceWsMessage();
        msg.setType("PROMOTE");
        msg.setSpaceId(spaceId);
        msg.setUserId(targetUserId);
        messaging.convertAndSend("/topic/space." + spaceId, msg);
    }

    // ── Kick ──────────────────────────────────────────────────
    @Transactional
    public void kickParticipant(Long spaceId, String hostEmail, Long targetUserId) {
        Space space = getSpaceOrThrow(spaceId);
        assertIsHost(space, hostEmail);

        participantRepo.findBySpaceIdAndUserIdAndLeftAtIsNull(spaceId, targetUserId)
                .ifPresent(p -> {
                    p.setLeftAt(LocalDateTime.now());
                    participantRepo.save(p);
                });

        SpaceDtos.SpaceWsMessage msg = new SpaceDtos.SpaceWsMessage();
        msg.setType("KICK");
        msg.setSpaceId(spaceId);
        msg.setUserId(targetUserId);
        messaging.convertAndSend("/topic/space." + spaceId, msg);
    }

    // ── Broadcast subtitle ────────────────────────────────────
    public void broadcastSubtitle(Long spaceId, Long userId,
                                  String userName, String text) {
        SpaceDtos.SpaceWsMessage msg = new SpaceDtos.SpaceWsMessage();
        msg.setType("SUBTITLE");
        msg.setSpaceId(spaceId);
        msg.setUserId(userId);
        msg.setUserName(userName);
        msg.setPayload(text);
        messaging.convertAndSend("/topic/space." + spaceId, msg);
    }

    // ── Queries ───────────────────────────────────────────────
    public List<SpaceDtos.SpaceResponse> getPublicSpaces() {
        return spaceRepo.findPublicSpaces().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public SpaceDtos.SpaceResponse getSpace(Long spaceId) {
        return toResponse(getSpaceOrThrow(spaceId));
    }

    // ── Notify followers ──────────────────────────────────────
    private void notifyFollowers(Space space) {
        try {
            List<User> followers = followRepo.findFollowersByFollowedId(space.getHostId());
            System.out.println("=== Notifying " + followers.size() + " followers");

            for (User follower : followers) {
                SpaceDtos.SpaceWsMessage notif = new SpaceDtos.SpaceWsMessage();
                notif.setType("SPACE_STARTED_FOLLOW");
                notif.setSpaceId(space.getId());
                notif.setPayload(space.getHostName() + " just started: " + space.getTitle());

                // Use convertAndSendToUser so it routes to /user/queue/follow-notifications
                // The follower's email is their STOMP principal name
                messaging.convertAndSendToUser(
                        follower.getEmail(),           // ← principal name (email)
                        "/queue/follow-notifications", // ← matches what FollowNotificationService subscribes to
                        notif
                );
                System.out.println("=== Notified user " + follower.getEmail());
            }
        } catch (Exception e) {
            System.err.println("=== notifyFollowers error: " + e.getMessage());
            e.printStackTrace();
        }
    }    // ── Helpers ───────────────────────────────────────────────
    private Space getSpaceOrThrow(Long id) {
        return spaceRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Space not found: " + id));
    }

    private void assertIsHost(Space space, String email) {
        if (!space.getHostEmail().equals(email)) {
            throw new RuntimeException("Only the host can perform this action");
        }
    }

    private void notifySpaceUpdate(Space space, String type) {
        SpaceDtos.SpaceWsMessage msg = new SpaceDtos.SpaceWsMessage();
        msg.setType(type);
        msg.setSpaceId(space.getId());
        msg.setPayload(space.getTitle());
        messaging.convertAndSend("/topic/spaces-list", msg);
    }

    private User getUserByEmail(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    public SpaceDtos.SpaceResponse toResponse(Space space) {
        SpaceDtos.SpaceResponse r = new SpaceDtos.SpaceResponse();
        r.setId(space.getId());
        r.setTitle(space.getTitle());
        r.setCategory(space.getCategory() != null ? space.getCategory().name() : null);
        r.setAudience(space.getAudience() != null ? space.getAudience().name() : null);
        r.setAnonymousAllowed(space.isAnonymousAllowed());
        r.setMaxSpeakers(space.getMaxSpeakers());
        r.setScheduledAt(space.getScheduledAt());
        r.setStartedAt(space.getStartedAt());
        r.setStatus(space.getStatus() != null ? space.getStatus().name() : null);
        r.setHostEmail(space.getHostEmail());
        r.setHostId(space.getHostId());
        r.setHostName(space.getHostName());
        r.setCreatedAt(space.getCreatedAt());

        List<SpaceParticipant> active =
                participantRepo.findBySpaceIdAndLeftAtIsNull(space.getId());

        r.setListenerCount((int) active.stream()
                .filter(p -> p.getRole() == SpaceParticipant.ParticipantRole.LISTENER).count());
        r.setSpeakerCount((int) active.stream()
                .filter(p -> p.getRole() != SpaceParticipant.ParticipantRole.LISTENER).count());

        r.setParticipants(active.stream().map(p -> {
            SpaceDtos.ParticipantDto pd = new SpaceDtos.ParticipantDto();
            pd.setUserId(p.getUserId());
            pd.setUserName(p.getUserName());
            pd.setUserEmail(p.getUserEmail());
            pd.setRole(p.getRole().name());
            pd.setMicActive(p.isMicActive());
            pd.setHandRaised(p.isHandRaised());
            pd.setAnonymous(p.isAnonymous());
            return pd;
        }).collect(Collectors.toList()));

        return r;
    }
}