package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.esprit.backend.dto.response.ApiResponse;
import tn.esprit.backend.service.PresenceService;

import java.util.Set;

@RestController
@RequestMapping("/api/presence")
@RequiredArgsConstructor
public class PresenceController {

    private final PresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;

    /** Called by frontend every 30s to mark user as online */
    @PostMapping("/heartbeat")
    public ResponseEntity<ApiResponse<Void>> heartbeat(Authentication authentication) {
        presenceService.markOnline(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok("ok", null));
    }

    /** Returns set of emails that are currently online */
    @GetMapping("/online")
    public ResponseEntity<ApiResponse<Set<String>>> getOnlineUsers(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.ok(presenceService.getOnlineEmails()));
    }

    /** Called when user explicitly logs out */
    @PostMapping("/offline")
    public ResponseEntity<ApiResponse<Void>> goOffline(Authentication authentication) {
        presenceService.markOffline(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok("ok", null));
    }
}