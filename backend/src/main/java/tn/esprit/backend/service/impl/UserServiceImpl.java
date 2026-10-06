package tn.esprit.backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.dto.request.*;
import tn.esprit.backend.dto.response.*;
import tn.esprit.backend.entity.HealthProfile;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.AppException;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.repository.*;
import tn.esprit.backend.service.IUserService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements IUserService {

    private final UserRepository        userRepository;
    private final HealthProfileRepository profileRepository;
    private final SessionRepository     sessionRepository;
    private final ObjectMapper          objectMapper;

    private final SubscriptionRepository subscriptionRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final HealthProfileRepository healthProfileRepository;

    @Override
    public HealthProfileResponse createHealthProfileForCurrentUser(String email, HealthProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        if (user.getHealthProfile() != null) {
            throw new IllegalStateException("Cet utilisateur possède déjà un profil santé.");
        }

        HealthProfile profile = new HealthProfile();
        profile.setAge(request.getAge());
        profile.setWeightKg(request.getWeightKg());
        profile.setHeightCm(request.getHeightCm());
        profile.setBloodType(request.getBloodType());
        profile.setMedicalHistoryJson(request.getMedicalHistoryJson());
        profile.setUser(user);

        HealthProfile saved = profileRepository.save(profile);

        return HealthProfileResponse.builder()
                .id(profile.getId())
                .age(profile.getAge())
                .weightKg(profile.getWeightKg())
                .heightCm(profile.getHeightCm())
                .bloodType(profile.getBloodType())
                .medicalHistoryJson(profile.getMedicalHistoryJson())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
    // ── Profil santé ─────────────────────────────────────────────────────────

    @Override
    public HealthProfileResponse getHealthProfile(Long userId) {
        var profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profil santé introuvable pour l'utilisateur " + userId));
        return toProfileResponse(profile);
    }

    @Override
    @Transactional
    public HealthProfileResponse updateHealthProfile(Long userId, HealthProfileRequest req) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : " + userId));

        var profile = profileRepository.findByUserId(userId)
                .orElse(HealthProfile.builder().user(user).build());

        if (req.getAge()               != null) profile.setAge(req.getAge());
        if (req.getWeightKg()          != null) profile.setWeightKg(req.getWeightKg());
        if (req.getHeightCm()          != null) profile.setHeightCm(req.getHeightCm());
        if (req.getBloodType()         != null) profile.setBloodType(req.getBloodType());
        if (req.getMedicalHistoryJson() != null) profile.setMedicalHistoryJson(req.getMedicalHistoryJson());

        profileRepository.save(profile);
        return toProfileResponse(profile);
    }

    // ── Compte ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void deleteAccount(Long userId) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : " + userId));

        // Soft-delete RGPD — anonymiser l'email pour libérer la contrainte UNIQUE
        user.setDeletedAt(LocalDateTime.now());
        user.setIsActive(false);
        user.setEmail("deleted_" + userId + "_" + user.getEmail()); // libère l'email original
        userRepository.save(user);

        // Révoquer toutes les sessions actives
        sessionRepository.findByUserId(userId).forEach(sessionRepository::delete);

        log.info("Compte supprimé (soft-delete RGPD) : userId={}", userId);
    }

    @Override
    public byte[] exportData(Long userId) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : " + userId));

        var profile = profileRepository.findByUserId(userId).orElse(null);

        try {
            var export = Map.of(
                    "account", Map.of(
                            "id", user.getId(),
                            "email", user.getEmail(),
                            "provider", user.getProvider(),
                            "role", user.getRole(),
                            "createdAt", user.getCreatedAt().toString()
                    ),
                    "healthProfile", profile != null ? Map.of(
                            "age", String.valueOf(profile.getAge()),
                            "weightKg", String.valueOf(profile.getWeightKg()),
                            "heightCm", String.valueOf(profile.getHeightCm()),
                            "bloodType", String.valueOf(profile.getBloodType())
                    ) : Map.of()
            );
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(export);
        } catch (Exception e) {
            throw new AppException("Erreur lors de l'export des données.");
        }
    }

    // ── Sessions ─────────────────────────────────────────────────────────────

    @Override
    public List<SessionResponse> getSessions(Long userId) {
        return sessionRepository.findByUserId(userId).stream()
                .map(s -> SessionResponse.builder()
                        .id(s.getId())
                        .deviceInfo(s.getDeviceInfo())
                        .ip(s.getIp())
                        .createdAt(s.getCreatedAt())
                        .expiresAt(s.getExpiresAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void revokeSession(Long userId, Long sessionId) {
        var session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session introuvable : " + sessionId));

        if (!session.getUser().getId().equals(userId)) {
            throw new AppException("Cette session n'appartient pas à cet utilisateur.");
        }

        sessionRepository.delete(session);
    }

    // ── Mapper ───────────────────────────────────────────────────────────────

    private HealthProfileResponse toProfileResponse(HealthProfile p) {
        return HealthProfileResponse.builder()
                .id(p.getId())
                .age(p.getAge())
                .weightKg(p.getWeightKg())
                .heightCm(p.getHeightCm())
                .bloodType(p.getBloodType())
                .medicalHistoryJson(p.getMedicalHistoryJson())
                .updatedAt(p.getUpdatedAt())
                .firstName(p.getUser().getFirstName())
                .lastName(p.getUser().getLastName())
                .build();
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    @Override
    public List<AdminUserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toAdminUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    public AdminUserResponse getUserDetail(Long userId) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : " + userId));
        return toAdminUserResponse(user);
    }

    private AdminUserResponse toAdminUserResponse(User user) {
        var profile = profileRepository.findByUserId(user.getId()).orElse(null);
        var sub = subscriptionRepository.findByUserIdAndStatus(user.getId(), tn.esprit.backend.entity.Subscription.Status.ACTIVE).orElse(null);

        return AdminUserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole())
                .provider(user.getProvider())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .age(profile != null ? profile.getAge() : null)
                .weightKg(profile != null && profile.getWeightKg() != null ? profile.getWeightKg().doubleValue() : null)
                .heightCm(profile != null ? profile.getHeightCm() : null)
                .bloodType(profile != null && profile.getBloodType() != null ? profile.getBloodType().toString() : null)
                .subscriptionPlan(sub != null ? sub.getPlan().toString() : "FREE")
                .subscriptionStatus(sub != null ? sub.getStatus().toString() : "—")
                .build();
    }
}