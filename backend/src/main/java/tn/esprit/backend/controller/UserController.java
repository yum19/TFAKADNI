package tn.esprit.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.UserInfoResponse;
import tn.esprit.backend.dto.request.HealthProfileRequest;
import tn.esprit.backend.dto.response.AdminUserResponse;
import tn.esprit.backend.dto.response.UserResponse;
import tn.esprit.backend.dto.response.ApiResponse;
import tn.esprit.backend.dto.response.HealthProfileResponse;
import tn.esprit.backend.dto.response.SessionResponse;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.IUserService;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final IUserService userService;
    private final UserRepository userRepository;

    /**
     * POST /api/users/me/health-profile
     * Créer le profil santé de l'utilisateur connecté
     */
    @PostMapping("/me/health-profile")
    public ResponseEntity<ApiResponse<HealthProfileResponse>> createMyHealthProfile(
            @Valid @RequestBody HealthProfileRequest request,
            Authentication authentication
    ) {
        String email = authentication.getName();

        HealthProfileResponse response =
                userService.createHealthProfileForCurrentUser(email, request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Profil santé créé avec succès.", response));
    }

    /**
     * GET /api/users/me
     * Profil complet de l utilisateur connecté (avec createdAt et referralCode)
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMe(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        UserResponse response = UserResponse.builder()
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

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * GET /api/users
     * Lister tous les utilisateurs — ADMIN uniquement
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AdminUserResponse>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.ok(userService.getAllUsers()));
    }

    /**
     * GET /api/users/{id}/detail
     * Détail complet d'un utilisateur — ADMIN uniquement
     */
    @GetMapping("/{id}/detail")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdminUserResponse>> getUserDetail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getUserDetail(id)));
    }

    /**
     * GET /api/users/me/health-profile
     * Consulter le profil santé de l'utilisateur connecté
     */
    @GetMapping("/me/health-profile")
    public ResponseEntity<ApiResponse<HealthProfileResponse>> getMyHealthProfile(
            Authentication authentication
    ) {
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        return ResponseEntity.ok(
                ApiResponse.ok(userService.getHealthProfile(user.getId()))
        );
    }

    /**
     * PUT /api/users/me/health-profile
     * Modifier le profil santé de l'utilisateur connecté
     */
    @PutMapping("/me/health-profile")
    public ResponseEntity<ApiResponse<HealthProfileResponse>> updateMyHealthProfile(
            @Valid @RequestBody HealthProfileRequest request,
            Authentication authentication
    ) {
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        HealthProfileResponse response =
                userService.updateHealthProfile(user.getId(), request);

        return ResponseEntity.ok(
                ApiResponse.ok("Profil santé mis à jour avec succès.", response)
        );
    }

    /**
     * GET /api/users/{id}/profile
     * Consulter le profil santé par identifiant
     */
    @GetMapping("/{id}/profile")
    @PreAuthorize("hasRole('ADMIN') or @userRepository.findById(#id).orElse(null)?.email == authentication.name")
    public ResponseEntity<ApiResponse<HealthProfileResponse>> getProfile(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.ok(userService.getHealthProfile(id))
        );
    }

    /**
     * DELETE /api/users/{id}
     * Supprimer un compte — ADMIN uniquement
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUserById(@PathVariable Long id) {
        userService.deleteAccount(id);
        return ResponseEntity.ok(ApiResponse.ok("Compte supprimé avec succès.", null));
    }

    /**
     * DELETE /api/users/me
     * Supprimer définitivement le compte connecté et les données liées
     */
    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> deleteMyAccount(Authentication authentication) {
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        userService.deleteAccount(user.getId());

        return ResponseEntity.ok(
                ApiResponse.ok("Compte supprimé avec succès.", null)
        );
    }



    /**
     * GET /api/users/{id}/sessions
     * Lister les sessions — ADMIN uniquement
     */
    @GetMapping("/{id}/sessions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<SessionResponse>>> getSessions(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.ok(userService.getSessions(id))
        );
    }

    /**
     * DELETE /api/users/{id}/sessions/{sid}
     * Révoquer une session — ADMIN uniquement
     */
    @DeleteMapping("/{id}/sessions/{sid}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> revokeSession(
            @PathVariable Long id,
            @PathVariable Long sid
    ) {
        userService.revokeSession(id, sid);

        return ResponseEntity.ok(
                ApiResponse.ok("Session révoquée.", null)
        );
    }

    /// /////////MODULE 5/////////////
    @GetMapping("/me/info")
    public ResponseEntity<ApiResponse<UserInfoResponse>> getMyInfo(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        UserInfoResponse info = new UserInfoResponse(
                user.getEmail(),
                user.getFirstName(),
                user.getLastName()
        );
        return ResponseEntity.ok(ApiResponse.ok(info));
    }
}