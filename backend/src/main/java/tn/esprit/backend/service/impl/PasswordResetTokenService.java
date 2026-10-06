package tn.esprit.backend.service.impl;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PasswordResetTokenService {

    private final Map<String, TokenRecord> tokens = new ConcurrentHashMap<>();

    public TokenRecord create(String email) {
        cleanupExpired();
        String token = UUID.randomUUID().toString();
        TokenRecord record = new TokenRecord(email, token, LocalDateTime.now().plusMinutes(30));
        tokens.put(token, record);
        return record;
    }

    public Optional<String> consumeValidEmail(String token) {
        cleanupExpired();
        TokenRecord record = tokens.get(token);
        if (record == null || record.expiresAt().isBefore(LocalDateTime.now())) {
            tokens.remove(token);
            return Optional.empty();
        }
        tokens.remove(token);
        return Optional.of(record.email());
    }

    private void cleanupExpired() {
        LocalDateTime now = LocalDateTime.now();
        tokens.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(now));
    }

    public record TokenRecord(String email, String token, LocalDateTime expiresAt) {}
}
