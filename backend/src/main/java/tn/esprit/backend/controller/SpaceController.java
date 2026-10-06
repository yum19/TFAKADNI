package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.SpaceDtos;
import tn.esprit.backend.service.SpaceService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/spaces")
@RequiredArgsConstructor
public class SpaceController {

    private final SpaceService spaceService;

    /** Create a new space */
    @PostMapping
    public ResponseEntity<SpaceDtos.SpaceResponse> create(
            @RequestBody SpaceDtos.CreateSpaceRequest req,
            Authentication auth) {
        return ResponseEntity.ok(spaceService.createSpace(auth.getName(), req));
    }

    /** Get all public/live/scheduled spaces */
    @GetMapping
    public ResponseEntity<List<SpaceDtos.SpaceResponse>> getPublicSpaces() {
        List<SpaceDtos.SpaceResponse> spaces = spaceService.getPublicSpaces();
        return ResponseEntity.ok(spaces);   // ← always return the list, even if empty
    }

    /** Get a single space */
    @GetMapping("/{id}")
    public ResponseEntity<SpaceDtos.SpaceResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(spaceService.getSpace(id));
    }

    /** Start a scheduled space */
    @PostMapping("/{id}/start")
    public ResponseEntity<SpaceDtos.SpaceResponse> start(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(spaceService.startSpace(id, auth.getName()));
    }

    /** Join a space */
    @PostMapping("/{id}/join")
    public ResponseEntity<SpaceDtos.SpaceResponse> join(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(spaceService.joinSpace(id, auth.getName()));
    }

    /** Leave a space */
    @PostMapping("/{id}/leave")
    public ResponseEntity<Void> leave(@PathVariable Long id, Authentication auth) {
        spaceService.leaveSpace(id, auth.getName());
        return ResponseEntity.ok().build();
    }

    /** End space (host only) */
    @PostMapping("/{id}/end")
    public ResponseEntity<Void> end(@PathVariable Long id, Authentication auth) {
        spaceService.endSpace(id, auth.getName());
        return ResponseEntity.ok().build();
    }

    /** Toggle mic */
    @PostMapping("/{id}/mic")
    public ResponseEntity<Void> mic(@PathVariable Long id,
                                    @RequestBody Map<String, Boolean> body,
                                    Authentication auth) {
        spaceService.toggleMic(id, auth.getName(), body.getOrDefault("active", false));
        return ResponseEntity.ok().build();
    }

    /** Raise/lower hand */
    @PostMapping("/{id}/hand")
    public ResponseEntity<Void> hand(@PathVariable Long id,
                                     @RequestBody Map<String, Boolean> body,
                                     Authentication auth) {
        spaceService.raiseHand(id, auth.getName(), body.getOrDefault("raised", false));
        return ResponseEntity.ok().build();
    }

    /** Promote listener to speaker (host only) */
    @PostMapping("/{id}/promote/{userId}")
    public ResponseEntity<Void> promote(@PathVariable Long id,
                                        @PathVariable Long userId,
                                        Authentication auth) {
        spaceService.promoteToSpeaker(id, auth.getName(), userId);
        return ResponseEntity.ok().build();
    }

    /** Kick participant (host only) */
    @PostMapping("/{id}/kick/{userId}")
    public ResponseEntity<Void> kick(@PathVariable Long id,
                                     @PathVariable Long userId,
                                     Authentication auth) {
        spaceService.kickParticipant(id, auth.getName(), userId);
        return ResponseEntity.ok().build();
    }

    /** Broadcast subtitle text */
    @PostMapping("/{id}/subtitle")
    public ResponseEntity<Void> subtitle(@PathVariable Long id,
                                         @RequestBody Map<String, String> body,
                                         Authentication auth) {
        // userId comes from token, resolved by service
        spaceService.broadcastSubtitle(id, null, auth.getName(), body.get("text"));
        return ResponseEntity.ok().build();
    }

    // Add these two endpoints to your existing SpaceController:

    /** Join anonymously */
    @PostMapping("/{id}/join-anonymous")
    public ResponseEntity<SpaceDtos.SpaceResponse> joinAnonymous(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        String displayName = body.getOrDefault("displayName", "Anonymous");
        return ResponseEntity.ok(spaceService.joinSpace(id, auth.getName(), true, displayName));
    }

    /** Host mutes a specific user */
    @PostMapping("/{id}/mic/{userId}")
    public ResponseEntity<Void> muteMicForUser(
            @PathVariable Long id,
            @PathVariable Long userId,
            @RequestBody Map<String, Boolean> body,
            Authentication auth) {
        spaceService.toggleMicForUser(id, auth.getName(), userId,
                body.getOrDefault("active", false));
        return ResponseEntity.ok().build();
    }
}