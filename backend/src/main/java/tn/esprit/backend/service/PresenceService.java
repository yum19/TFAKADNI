package tn.esprit.backend.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class PresenceService {

    /** email → last heartbeat timestamp */
    private final Map<String, Instant> onlineUsers = new ConcurrentHashMap<>();

    private static final long TTL_SECONDS = 90;

    public void markOnline(String email) {
        onlineUsers.put(email.toLowerCase(), Instant.now());
    }

    public void markOffline(String email) {
        onlineUsers.remove(email.toLowerCase());
    }

    public Set<String> getOnlineEmails() {
        Instant cutoff = Instant.now().minusSeconds(TTL_SECONDS);
        return onlineUsers.entrySet().stream()
                .filter(e -> e.getValue().isAfter(cutoff))
                .map(Map.Entry::getKey)
                .collect(Collectors.toSet());
    }

    public boolean isOnline(String email) {
        Instant last = onlineUsers.get(email.toLowerCase());
        if (last == null) return false;
        return last.isAfter(Instant.now().minusSeconds(TTL_SECONDS));
    }

    /** Clean up stale entries every 2 minutes */
    @Scheduled(fixedDelay = 120_000)
    public void evictStale() {
        Instant cutoff = Instant.now().minusSeconds(TTL_SECONDS);
        onlineUsers.entrySet().removeIf(e -> e.getValue().isBefore(cutoff));
    }
}