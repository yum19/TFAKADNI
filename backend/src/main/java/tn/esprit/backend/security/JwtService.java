package tn.esprit.backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

/**
 * Génération et validation des tokens JWT (access + refresh).
 */
@Service
@Slf4j
public class JwtService {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.access-expiration-ms:900000}")     // 15 min par défaut
    private long accessExpirationMs;

    @Value("${app.jwt.refresh-expiration-ms:604800000}") // 7 jours par défaut
    private long refreshExpirationMs;

    // ── Génération ────────────────────────────────────────────────────────────

    public String generateAccessToken(String email, String role) {
        return buildToken(email, Map.of("role", role, "type", "ACCESS"), accessExpirationMs);
    }

    public String generateRefreshToken(String email) {
        return buildToken(email, Map.of("type", "REFRESH"), refreshExpirationMs);
    }

    public String generatePasswordResetToken(String email) {
        return buildToken(email, Map.of("type", "PASSWORD_RESET"), 15 * 60 * 1000L); // 15 minutes
    }

    private String buildToken(String subject, Map<String, Object> claims, long expirationMs) {
        return Jwts.builder()
                .subject(subject)
                .claims(claims)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    // ── Validation ────────────────────────────────────────────────────────────

    public boolean isTokenValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("JWT invalide : {}", e.getMessage());
            return false;
        }
    }

    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractTokenType(String token) {
        return (String) parseClaims(token).get("type");
    }

    public long getRefreshExpirationMs() { return refreshExpirationMs; }
    public long getAccessExpirationMs()  { return accessExpirationMs; }

    // ── Interne ───────────────────────────────────────────────────────────────

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }
}