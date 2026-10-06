package tn.esprit.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.response.ApiResponse;
import tn.esprit.backend.dto.response.AuthResponse;
import tn.esprit.backend.dto.response.UserResponse;
import tn.esprit.backend.entity.FaceIdData;
import tn.esprit.backend.entity.Session;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.repository.FaceIdRepository;
import tn.esprit.backend.repository.SessionRepository;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.security.JwtService;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/faceid")
@RequiredArgsConstructor
@Slf4j
public class FaceIdController {

    private final FaceIdRepository  faceIdRepository;
    private final UserRepository    userRepository;
    private final JwtService        jwtService;
    private final SessionRepository sessionRepository;

    // ── Endpoints authentifiés ────────────────────────────────────────────────

    @GetMapping("/me")
    public ResponseEntity<?> getFaceId(Authentication auth) {
        User user = getUser(auth);
        if (user == null) return unauth();

        Map<String, Object> result = new HashMap<>();
        faceIdRepository.findByUserId(user.getId()).ifPresentOrElse(data -> {
            result.put("enabled",   data.isEnabled());
            result.put("hasPhoto",  data.getFacePhoto() != null);
            result.put("facePhoto", data.getFacePhoto() != null ? data.getFacePhoto() : "");
            result.put("faceCreds", data.getFaceCreds() != null ? data.getFaceCreds() : "");
        }, () -> {
            result.put("enabled",  false);
            result.put("hasPhoto", false);
            result.put("facePhoto", "");
            result.put("faceCreds", "");
        });
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/save")
    public ResponseEntity<?> saveFaceId(@RequestBody Map<String, Object> body, Authentication auth) {
        User user = getUser(auth);
        if (user == null) return unauth();

        String  facePhoto = (String)  body.get("facePhoto");
        String  faceCreds = (String)  body.get("faceCreds");
        boolean enabled   = Boolean.TRUE.equals(body.get("enabled"));

        FaceIdData data = faceIdRepository.findByUserId(user.getId())
                .orElse(FaceIdData.builder().user(user).build());

        if (facePhoto != null && !facePhoto.isEmpty()) data.setFacePhoto(facePhoto);
        if (faceCreds != null && !faceCreds.isEmpty()) data.setFaceCreds(faceCreds);
        data.setEnabled(enabled);
        faceIdRepository.save(data);
        log.info("[FaceID] Sauvegardé pour {}", user.getEmail());

        return ResponseEntity.ok(ApiResponse.ok("Face ID sauvegardé"));
    }

    @PostMapping("/toggle")
    public ResponseEntity<?> toggleFaceId(@RequestBody Map<String, Boolean> body, Authentication auth) {
        User user = getUser(auth);
        if (user == null) return unauth();

        boolean enabled = Boolean.TRUE.equals(body.get("enabled"));
        FaceIdData data = faceIdRepository.findByUserId(user.getId())
                .orElse(FaceIdData.builder().user(user).build());
        data.setEnabled(enabled);
        faceIdRepository.save(data);
        return ResponseEntity.ok(ApiResponse.ok(enabled ? "Activé" : "Désactivé"));
    }

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteFaceId(Authentication auth) {
        User user = getUser(auth);
        if (user == null) return unauth();

        faceIdRepository.findByUserId(user.getId()).ifPresent(faceIdRepository::delete);
        return ResponseEntity.ok(ApiResponse.ok("Face ID supprimé"));
    }

    // ── Endpoints publics (page login) ────────────────────────────────────────

    /** Récupère la photo Face ID pour comparaison côté frontend */
    @GetMapping("/for-login")
    public ResponseEntity<?> getFaceIdForLogin(@RequestParam String email) {
        Map<String, Object> empty = emptyResult();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return ResponseEntity.ok(ApiResponse.ok(empty));

        return faceIdRepository.findByUserId(user.getId()).map(data -> {
            if (!data.isEnabled() || data.getFacePhoto() == null)
                return ResponseEntity.ok(ApiResponse.ok(empty));

            Map<String, Object> result = new HashMap<>();
            result.put("enabled",   true);
            result.put("hasPhoto",  true);
            result.put("facePhoto", data.getFacePhoto());
            result.put("faceCreds", data.getFaceCreds() != null ? data.getFaceCreds() : "");
            // Inclure le provider pour savoir si c'est un compte Google
            result.put("provider",  user.getProvider().name());
            return ResponseEntity.ok(ApiResponse.ok(result));
        }).orElse(ResponseEntity.ok(ApiResponse.ok(empty)));
    }

    /**
     * ✅ POST /api/faceid/face-login
     * Après vérification du visage côté frontend, génère un JWT directement.
     * Utilisé pour les comptes Google (pas de mot de passe).
     * Body: { "email": "..." }
     */
    @PostMapping("/face-login")
    public ResponseEntity<?> faceLogin(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        String email = body.get("email");
        if (email == null || email.isEmpty())
            return ResponseEntity.badRequest().body(ApiResponse.error("Email requis"));

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null)
            return ResponseEntity.status(404).body(ApiResponse.error("Utilisateur non trouvé"));

        // Vérifier que Face ID est activé pour ce compte
        FaceIdData faceData = faceIdRepository.findByUserId(user.getId()).orElse(null);
        if (faceData == null || !faceData.isEnabled())
            return ResponseEntity.status(403).body(ApiResponse.error("Face ID non activé"));

        // Générer les tokens JWT
        String accessToken  = jwtService.generateAccessToken(user.getEmail(), user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());

        // Sauvegarder la session
        String ip         = request.getRemoteAddr();
        String deviceInfo = request.getHeader("User-Agent");
        Session session   = Session.builder()
                .user(user)
                .tokenHash(hashToken(refreshToken))
                .deviceInfo(deviceInfo != null ? deviceInfo : "Face ID")
                .ip(ip)
                .expiresAt(LocalDateTime.now().plusSeconds(
                        jwtService.getRefreshExpirationMs() / 1000))
                .build();
        sessionRepository.save(session);

        UserResponse userResp = UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole())
                .provider(user.getProvider())
                .avatarUrl(user.getAvatarUrl())
                .isActive(user.getIsActive())
                .build();

        AuthResponse authResp = AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getAccessExpirationMs() / 1000)
                .user(userResp)
                .build();

        log.info("[FaceID] Connexion Face ID réussie pour {}", email);
        return ResponseEntity.ok(ApiResponse.ok("Connexion Face ID réussie", authResp));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User getUser(Authentication auth) {
        if (auth == null) return null;
        return userRepository.findByEmail(auth.getName()).orElse(null);
    }

    private ResponseEntity<?> unauth() {
        return ResponseEntity.status(401).body(ApiResponse.error("Non authentifié"));
    }

    private Map<String, Object> emptyResult() {
        Map<String, Object> m = new HashMap<>();
        m.put("enabled",  false);
        m.put("hasPhoto", false);
        m.put("facePhoto", "");
        m.put("faceCreds", "");
        m.put("provider", "");
        return m;
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            return token;
        }
    }
}