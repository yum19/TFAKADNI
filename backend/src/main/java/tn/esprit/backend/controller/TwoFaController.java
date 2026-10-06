package tn.esprit.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.request.LoginRequest;
import tn.esprit.backend.dto.response.ApiResponse;
import tn.esprit.backend.dto.response.AuthResponse;
import tn.esprit.backend.dto.response.UserResponse;
import tn.esprit.backend.entity.*;
import tn.esprit.backend.repository.*;
import tn.esprit.backend.security.JwtService;
import tn.esprit.backend.service.impl.EmailService;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth/2fa")
@RequiredArgsConstructor
@Slf4j
public class TwoFaController {

    private final AppSettingRepository     settingRepo;
    private final TwoFactorCodeRepository  codeRepo;
    private final UserRepository           userRepository;
    private final SessionRepository        sessionRepository;
    private final JwtService               jwtService;
    private final EmailService emailService;
    private final PasswordEncoder          passwordEncoder;

    private static final String SETTING_KEY = "2fa_enabled";

    // ── Admin : activer/désactiver 2FA globalement ────────────────────────────

    @GetMapping("/status")
    public ResponseEntity<?> getStatus() {
        boolean enabled = is2faEnabled();
        Map<String, Object> res = new HashMap<>();
        res.put("enabled", enabled);
        return ResponseEntity.ok(ApiResponse.ok("Statut 2FA", res));
    }

    @PostMapping("/toggle")
    public ResponseEntity<?> toggle(@RequestBody Map<String, Boolean> body) {
        boolean enabled = Boolean.TRUE.equals(body.get("enabled"));
        AppSetting setting = settingRepo.findById(SETTING_KEY)
                .orElse(AppSetting.builder().key(SETTING_KEY).description("2FA global").build());
        setting.setValue(String.valueOf(enabled));
        settingRepo.save(setting);
        log.info("[2FA] Global 2FA {} par admin", enabled ? "activé" : "désactivé");
        return ResponseEntity.ok(ApiResponse.ok(enabled ? "2FA activé" : "2FA désactivé"));
    }

    // ── Login avec 2FA ────────────────────────────────────────────────────────

    /**
     * POST /api/auth/2fa/send
     * Vérifie email+mdp, puis si 2FA actif envoie le code.
     * Retourne soit un JWT (si 2FA désactivé) soit requires2fa: true
     */
    @PostMapping("/send")
    public ResponseEntity<?> sendCode(@RequestBody LoginRequest body) {
        // Vérifier l'utilisateur
        User user = userRepository.findByEmail(body.getEmail()).orElse(null);
        if (user == null || !passwordEncoder.matches(body.getPassword(), user.getPasswordHash()))
            return ResponseEntity.status(401).body(ApiResponse.error("Email ou mot de passe incorrect"));

        if (!is2faEnabled()) {
            // 2FA désactivé → retourner directement requires2fa: false
            Map<String, Object> res = new HashMap<>();
            res.put("requires2fa", false);
            res.put("email", user.getEmail());
            return ResponseEntity.ok(ApiResponse.ok("2FA non requis", res));
        }

        // Générer code 6 chiffres
        String code = String.format("%06d", new SecureRandom().nextInt(999999));

        // Supprimer anciens codes
        codeRepo.deleteAllByEmail(user.getEmail());

        // Sauvegarder nouveau code
        codeRepo.save(TwoFactorCode.builder()
                .email(user.getEmail())
                .code(code)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build());

        // Envoyer par email
        emailService.send2faCode(user.getEmail(), user.getFirstName(), code);
        log.info("[2FA] Code envoyé à {}", user.getEmail());

        Map<String, Object> res = new HashMap<>();
        res.put("requires2fa", true);
        res.put("email", user.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Code envoyé par email", res));
    }

    /**
     * POST /api/auth/2fa/verify
     * Vérifie le code et retourne le JWT si correct.
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyCode(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        String email = body.get("email");
        String code  = body.get("code");

        if (email == null || code == null)
            return ResponseEntity.badRequest().body(ApiResponse.error("Email et code requis"));

        TwoFactorCode tfc = codeRepo.findTopByEmailAndUsedFalseOrderByIdDesc(email).orElse(null);

        if (tfc == null || tfc.isExpired())
            return ResponseEntity.status(401).body(ApiResponse.error("Code expiré. Renvoyez un nouveau code."));

        if (!tfc.getCode().equals(code))
            return ResponseEntity.status(401).body(ApiResponse.error("Code incorrect."));

        // Marquer comme utilisé
        tfc.setUsed(true);
        codeRepo.save(tfc);

        // Générer JWT
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        String accessToken  = jwtService.generateAccessToken(user.getEmail(), user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());

        // Sauvegarder session
        Session session = Session.builder()
                .user(user)
                .tokenHash(hashToken(refreshToken))
                .deviceInfo(request.getHeader("User-Agent"))
                .ip(request.getRemoteAddr())
                .expiresAt(LocalDateTime.now().plusSeconds(jwtService.getRefreshExpirationMs() / 1000))
                .build();
        sessionRepository.save(session);

        UserResponse userResp = UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole())
                .provider(user.getProvider())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .avatarUrl(user.getAvatarUrl())
                .referralCode(user.getReferralCode())
                .build();

        AuthResponse authResp = AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getAccessExpirationMs() / 1000)
                .user(userResp)
                .build();

        log.info("[2FA] Connexion 2FA réussie pour {}", email);
        return ResponseEntity.ok(ApiResponse.ok("Connexion réussie", authResp));
    }

    /**
     * POST /api/auth/2fa/resend
     * Renvoyer un nouveau code
     */
    @PostMapping("/resend")
    public ResponseEntity<?> resendCode(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return ResponseEntity.status(404).body(ApiResponse.error("Utilisateur introuvable"));

        String code = String.format("%06d", new SecureRandom().nextInt(999999));
        codeRepo.deleteAllByEmail(email);
        codeRepo.save(TwoFactorCode.builder()
                .email(email)
                .code(code)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build());
        emailService.send2faCode(email, user.getFirstName(), code);
        log.info("[2FA] Code renvoyé à {}", email);

        return ResponseEntity.ok(ApiResponse.ok("Nouveau code envoyé"));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private boolean is2faEnabled() {
        return settingRepo.findById(SETTING_KEY)
                .map(s -> "true".equalsIgnoreCase(s.getValue()))
                .orElse(false);
    }

    private String hashToken(String token) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) { return token; }
    }
}