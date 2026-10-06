package tn.esprit.backend.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tracks last-message time per conversation.
 * After ARCHIVE_AFTER_MS of silence the conversation is "archived".
 *
 * Clients poll GET /api/messages/archived?userId=X
 * or receive a WS push on /queue/archive.{userId}.
 */
@Service
public class ArchiveService {

    /** 2 minutes for testing */
    private static final long ARCHIVE_AFTER_MS = 2 * 60 * 1000L;

    /** key = "smallerId:largerId", value = last activity epoch-ms */
    private final Map<String, Long> lastActivity = new ConcurrentHashMap<>();

    /** Archived conversation keys */
    private final Set<String> archived = ConcurrentHashMap.newKeySet();

    // ── API ──────────────────────────────────────────────────────────────────

    public void touch(Long a, Long b) {
        String key = key(a, b);
        lastActivity.put(key, Instant.now().toEpochMilli());
        archived.remove(key); // un-archive if they start talking again
    }

    public boolean isArchived(Long a, Long b) {
        return archived.contains(key(a, b));
    }

    /** Returns true if the conversation was just archived */
    public boolean checkAndArchive(Long a, Long b) {
        String key = key(a, b);
        Long last = lastActivity.get(key);
        if (last == null) return false;
        boolean shouldArchive = (Instant.now().toEpochMilli() - last) > ARCHIVE_AFTER_MS;
        if (shouldArchive) archived.add(key);
        return shouldArchive;
    }

    /** Sweep scheduled every 30 s */
    @Scheduled(fixedDelay = 30_000)
    public void sweep() {
        long now = Instant.now().toEpochMilli();
        lastActivity.forEach((key, last) -> {
            if ((now - last) > ARCHIVE_AFTER_MS) archived.add(key);
        });
    }

    /** All archived partner IDs for a given user */
    public Set<String> archivedKeys() { return archived; }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String key(Long a, Long b) {
        return Math.min(a, b) + ":" + Math.max(a, b);
    }
}