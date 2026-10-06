package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.dto.request.*;
import tn.esprit.backend.dto.response.*;
import tn.esprit.backend.entity.*;
import tn.esprit.backend.exception.AppException;
import tn.esprit.backend.repository.*;
import tn.esprit.backend.security.JwtService;
import tn.esprit.backend.service.impl.EmailService;
import tn.esprit.backend.service.IAuthService;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements IAuthService {

    private final UserRepository    userRepository;
    private final SessionRepository sessionRepository;
    private final PasswordEncoder   passwordEncoder;
    private final JwtService        jwtService;
    private final AuthenticationManager authManager;
    private final ReferralRepository referralRepository;
    private final PromoCodeRepository promoCodeRepository;
    private final EmailService emailService;

    // ── Register ─────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest req, String deviceInfo, String ip) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new AppException("Un compte existe déjà avec cet email.");
        }

        var user = User.builder()
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .provider(User.Provider.EMAIL)
                .isActive(true)
                .role(User.Role.USER)
                .build();

        userRepository.save(user);
        log.info("Nouveau compte créé : {}", user.getEmail());

        // Email de bienvenue
        try { emailService.sendWelcome(user.getEmail(), user.getFirstName()); }
        catch (Exception e) { log.warn("Email bienvenue non envoyé : {}", e.getMessage()); }

        // ── Parrainage ──────────────────────────────────────────────────────
        if (req.getReferralCode() != null && !req.getReferralCode().isBlank()) {
            userRepository.findByReferralCode(req.getReferralCode().toUpperCase()).ifPresent(referrer -> {
                if (!referrer.getId().equals(user.getId())) {
                    // 1. Créer la relation de parrainage
                    Referral referral = Referral.builder()
                            .referrer(referrer)
                            .referred(user)
                            .referralCode(req.getReferralCode().toUpperCase())
                            .status(Referral.Status.REWARDED)
                            .build();
                    referralRepository.save(referral);

                    // 2. Créer/récupérer le promo code WELCOME5 (5%)
                    final String PROMO_CODE = "WELCOME5";
                    final int DISCOUNT = 5;
                    if (!promoCodeRepository.existsByCode(PROMO_CODE)) {
                        PromoCode promo = PromoCode.builder()
                                .code(PROMO_CODE)
                                .discountPct(DISCOUNT)
                                .maxUses(null)   // illimité
                                .usedCount(0)
                                .active(true)
                                .build();
                        promoCodeRepository.save(promo);
                        log.info("[Referral] PromoCode {} créé", PROMO_CODE);
                    }

                    // 3. Envoyer le promo code aux deux utilisateurs
                    try {
                        emailService.sendPromoCode(user.getEmail(), user.getFirstName(), PROMO_CODE, DISCOUNT);
                        emailService.sendPromoCode(referrer.getEmail(), referrer.getFirstName(), PROMO_CODE, DISCOUNT);
                    } catch (Exception e) {
                        log.warn("[Referral] Email promo non envoyé : {}", e.getMessage());
                    }

                    log.info("[Referral] Parrainage + WELCOME5 envoyé : {} → {}", referrer.getEmail(), user.getEmail());
                }
            });
        }

        return buildAuthResponse(user, deviceInfo, ip);
    }

    // ── Login ────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public AuthResponse login(LoginRequest req, String deviceInfo, String ip) {
        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword())
            );
        } catch (BadCredentialsException e) {
            throw new AppException("Email ou mot de passe incorrect.");
        } catch (DisabledException e) {
            throw new AppException("Ce compte est désactivé.");
        }

        var user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new AppException("Utilisateur introuvable."));

        return buildAuthResponse(user, deviceInfo, ip);
    }

    // ── Logout ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void logout(String refreshToken) {
        var hash = hashToken(refreshToken);
        sessionRepository.findByTokenHash(hash)
                .ifPresent(sessionRepository::delete);
    }

    // ── Refresh ──────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public AuthResponse refresh(RefreshTokenRequest req, String deviceInfo, String ip) {
        var token = req.getRefreshToken();

        if (!jwtService.isTokenValid(token) || !"REFRESH".equals(jwtService.extractTokenType(token))) {
            throw new AppException("Refresh token invalide ou expiré.");
        }

        var hash = hashToken(token);
        var session = sessionRepository.findByTokenHash(hash)
                .orElseThrow(() -> new AppException("Session introuvable."));

        if (session.isExpired()) {
            sessionRepository.delete(session);
            throw new AppException("Session expirée. Veuillez vous reconnecter.");
        }

        var user = session.getUser();

        // Révoque l'ancienne session et en crée une nouvelle
        sessionRepository.delete(session);
        return buildAuthResponse(user, deviceInfo, ip);
    }

    // ── Forgot / Reset password ───────────────────────────────────────────────

    @Override
    public void forgotPassword(ForgotPasswordRequest req) {
        userRepository.findByEmail(req.getEmail()).ifPresent(user -> {
            // Générer un token JWT signé valable 15 minutes
            String resetToken = jwtService.generatePasswordResetToken(user.getEmail());
            String resetLink = "http://localhost:4200/auth/change-password?token=" + resetToken;
            try {
                emailService.sendPasswordReset(user.getEmail(), resetLink);
                log.info("Email de réinitialisation envoyé à : {}", user.getEmail());
            } catch (Exception e) {
                log.error("Erreur envoi email reset : {}", e.getMessage());
            }
        });
        // On ne révèle pas si l'email existe (sécurité)
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        String token = req.getToken();

        // Valider le token JWT
        if (!jwtService.isTokenValid(token)) {
            throw new AppException("Lien expiré ou invalide. Veuillez refaire une demande.");
        }

        // Vérifier que c'est bien un token de reset password
        String tokenType = jwtService.extractTokenType(token);
        if (!"PASSWORD_RESET".equals(tokenType)) {
            throw new AppException("Lien invalide.");
        }

        // Extraire l'email depuis le token
        String email = jwtService.extractEmail(token);
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException("Utilisateur introuvable."));

        // Mettre à jour le mot de passe
        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);

        // Révoquer toutes les sessions actives
        sessionRepository.findByUserId(user.getId()).forEach(sessionRepository::delete);

        log.info("Mot de passe réinitialisé pour : {}", email);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private AuthResponse buildAuthResponse(User user, String deviceInfo, String ip) {
        var accessToken  = jwtService.generateAccessToken(user.getEmail(), user.getRole().name());
        var refreshToken = jwtService.generateRefreshToken(user.getEmail());

        // Sauvegarde la session avec le hash du refresh token
        var session = Session.builder()
                .user(user)
                .tokenHash(hashToken(refreshToken))
                .deviceInfo(deviceInfo)
                .ip(ip)
                .expiresAt(LocalDateTime.now().plusSeconds(
                        jwtService.getRefreshExpirationMs() / 1000))
                .build();
        sessionRepository.save(session);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getAccessExpirationMs() / 1000)
                .user(UserResponse.builder()
                        .id(user.getId())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .provider(user.getProvider())
                        .isActive(user.getIsActive())
                        .createdAt(user.getCreatedAt())
                        .avatarUrl(user.getAvatarUrl())
                        .build())
                .build();
    }

    /** SHA-256 du token pour stockage sécurisé en base */
    private String hashToken(String token) {
        try {
            var digest = MessageDigest.getInstance("SHA-256");
            var bytes  = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (Exception e) {
            throw new RuntimeException("Erreur de hachage du token", e);
        }
    }
}