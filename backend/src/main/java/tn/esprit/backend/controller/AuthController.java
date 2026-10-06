package tn.esprit.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import tn.esprit.backend.dto.request.RegisterRequest;
import tn.esprit.backend.dto.response.ApiResponse;
import tn.esprit.backend.dto.response.AuthResponse;
import tn.esprit.backend.dto.request.*;
import tn.esprit.backend.dto.response.*;
import tn.esprit.backend.service.IAuthService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final IAuthService authService;

    /**
     * POST /api/auth/register
     * Créer un nouveau compte (email + password)
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest
    ) {
        var result = authService.register(
                request,
                httpRequest.getHeader("User-Agent"),
                httpRequest.getRemoteAddr()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Compte créé avec succès.", result));
    }

    /**
     * POST /api/auth/login
     * Connexion — retourne access token + refresh token
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        var result = authService.login(
                request,
                httpRequest.getHeader("User-Agent"),
                httpRequest.getRemoteAddr()
        );
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * POST /api/auth/logout
     * Invalider le refresh token actif
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @Valid @RequestBody RefreshTokenRequest request
    ) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.ok("Déconnexion réussie.", null));
    }

    /**
     * POST /api/auth/refresh
     * Renouveler l'access token via le refresh token
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request,
            HttpServletRequest httpRequest
    ) {
        var result = authService.refresh(
                request,
                httpRequest.getHeader("User-Agent"),
                httpRequest.getRemoteAddr()
        );
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * POST /api/auth/forgot-password
     * Envoyer un email de réinitialisation
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.ok(
                "Si cet email existe, un lien de réinitialisation a été envoyé.", null));
    }

    /**
     * PUT /api/auth/reset-password
     * Définir un nouveau mot de passe via le token email
     */
    @PutMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.ok("Mot de passe réinitialisé avec succès.", null));
    }
}