package tn.esprit.backend.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory moderation service.
 * – Detects bad words in messages
 * – Issues warnings (first offence) or bans (second offence within a conversation)
 * – Ban lasts BAN_DURATION_MS (60 s for testing)
 */
@Service
public class ModerationService {

    private static final long BAN_DURATION_MS = 60_000L; // 1 min for testing

    // Simple list – extend as needed
    private static final Set<String> BAD_WORDS = Set.of(
            "fuck", "shit", "asshole", "bitch", "bastard", "cunt", "damn", "crap"
    );

    /**
     * key = "senderId:receiverId"  (always smaller id first to make it symmetric per convo)
     * value = Instant when the ban expires
     */
    private final Map<String, Instant> banExpiry     = new ConcurrentHashMap<>();

    /** key = "senderId:receiverId", value = number of violations */
    private final Map<String, Integer> violationCount = new ConcurrentHashMap<>();

    // ── Public API ──────────────────────────────────────────────────────────

    public boolean containsBadWord(String text) {
        if (text == null || text.isBlank()) return false;
        String lower = text.toLowerCase();
        return BAD_WORDS.stream().anyMatch(lower::contains);
    }

    /**
     * @return ModerationResult describing what to do with this message
     */
    public ModerationResult evaluate(Long senderId, Long receiverId, String text) {
        if (!containsBadWord(text)) return ModerationResult.ok();

        String key = convoKey(senderId, receiverId);

        // Already banned?
        if (isBanned(key)) {
            return ModerationResult.banned(remainingBanSeconds(key));
        }

        // Increment violations
        int count = violationCount.merge(key, 1, Integer::sum);

        if (count >= 2) {
            // Apply ban
            banExpiry.put(key, Instant.now().plusMillis(BAN_DURATION_MS));
            violationCount.remove(key); // reset for next cycle
            return ModerationResult.newBan((int)(BAN_DURATION_MS / 1000));
        } else {
            // First offence: warn but still allow if you want (we'll block + warn)
            return ModerationResult.warning();
        }
    }

    public boolean isBannedUser(Long senderId, Long receiverId) {
        return isBanned(convoKey(senderId, receiverId));
    }

    public long remainingBanSeconds(Long senderId, Long receiverId) {
        return remainingBanSeconds(convoKey(senderId, receiverId));
    }

    // ── Private helpers ─────────────────────────────────────────────────────

    private String convoKey(Long a, Long b) {
        return Math.min(a, b) + ":" + Math.max(a, b);
    }

    private boolean isBanned(String key) {
        Instant exp = banExpiry.get(key);
        if (exp == null) return false;
        if (Instant.now().isAfter(exp)) { banExpiry.remove(key); return false; }
        return true;
    }

    private long remainingBanSeconds(String key) {
        Instant exp = banExpiry.get(key);
        if (exp == null) return 0;
        long ms = exp.toEpochMilli() - Instant.now().toEpochMilli();
        return Math.max(0, ms / 1000);
    }

    // ── Result type ─────────────────────────────────────────────────────────

    public static class ModerationResult {
        public enum Action { OK, WARNING, NEW_BAN, BLOCKED_BANNED }

        public final Action action;
        public final int    banSeconds; // relevant for NEW_BAN / BLOCKED_BANNED

        private ModerationResult(Action action, int banSeconds) {
            this.action     = action;
            this.banSeconds = banSeconds;
        }

        public static ModerationResult ok()                    { return new ModerationResult(Action.OK, 0); }
        public static ModerationResult warning()               { return new ModerationResult(Action.WARNING, 0); }
        public static ModerationResult newBan(int secs)        { return new ModerationResult(Action.NEW_BAN, secs); }
        public static ModerationResult banned(long secs)       { return new ModerationResult(Action.BLOCKED_BANNED, (int) secs); }

        public boolean isOk()        { return action == Action.OK; }
        public boolean isWarning()   { return action == Action.WARNING; }
        public boolean isBan()       { return action == Action.NEW_BAN || action == Action.BLOCKED_BANNED; }
    }
}