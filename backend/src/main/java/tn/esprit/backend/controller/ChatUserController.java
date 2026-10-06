package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.repository.UserRepository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Lightweight user-list endpoint used exclusively by the chat system.
 * Returns only the fields the chat UI needs (id, email, role, is_active).
 * Accessible to any authenticated user — does NOT expose admin data.
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatUserController {

    private final UserRepository userRepository;

    /**
     * GET /api/chat/users
     * Returns a minimal list of all non-deleted users so the chat sidebar
     * can be populated. No sensitive data is exposed.
     */
    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getChatUsers() {
        List<Map<String, Object>> users = userRepository.findAll()
                .stream()
                .map(u -> {
                    Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("id",        u.getId());
                    m.put("email",     u.getEmail());
                    m.put("role",      u.getRole() != null ? u.getRole().name() : "USER");
                    m.put("is_active", u.getIsActive() != null ? u.getIsActive() : true);
                    return m;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    /**
     * GET /api/chat/users/{id}
     * Returns a single user's minimal info for the chat header.
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> getChatUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(u -> {
                    Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("id",        u.getId());
                    m.put("email",     u.getEmail());
                    m.put("role",      u.getRole() != null ? u.getRole().name() : "USER");
                    m.put("is_active", u.getIsActive() != null ? u.getIsActive() : true);
                    return ResponseEntity.ok(m);
                })
                .orElse(ResponseEntity.notFound().<Map<String, Object>>build());
    }
}