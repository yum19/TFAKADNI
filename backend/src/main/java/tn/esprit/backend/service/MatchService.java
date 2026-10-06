package tn.esprit.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.backend.dto.DecideRequest;
import tn.esprit.backend.dto.MatchDTO;
import tn.esprit.backend.entity.Match;
import tn.esprit.backend.entity.Match.MatchStatus;
import tn.esprit.backend.repository.MarrainageRepository;
import tn.esprit.backend.repository.MatchRepository;
import tn.esprit.backend.repository.UserRepository;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MatchService {

    private final MatchRepository      matchRepo;
    private final MarrainageRepository marrainageRepo;
    private final UserRepository       userRepo;

    // ── Generate ─────────────────────────────────────────────────────────────

    /**
     * Generate AI match suggestions for the given user.
     *
     * Guards:
     *  1. User must have an active pregnancy → else return []
     *  2. Skip suggestions where a match row already exists (either direction)
     *
     * Result: only users with pregnancy data get match suggestions.
     * Yomna (no pregnancy) → [] → frontend shows "complete your profile".
     */
    public List<MatchDTO> generateAndPersistMatches(Long userId) {
        // Guard: no active pregnancy → nothing to match on
        Integer count = marrainageRepo.countActivePregnancies(userId);
        if (count == null || count == 0) {
            return List.of();
        }

        var suggestions = marrainageRepo.findTopMarraines(userId);
        List<MatchDTO> result = new ArrayList<>();

        for (var s : suggestions) {
            // Skip if match already exists in any direction
            var existing = matchRepo.findByPair(userId, s.getUserId());
            Match match = existing.orElseGet(() ->
                    matchRepo.save(Match.builder()
                            .userAId(userId)
                            .userBId(s.getUserId())
                            .aiScore(s.getCompatibilityScore())
                            .build())
            );
            result.add(toDTO(match, userId, s));
        }
        return result;
    }

    // ── Decide ───────────────────────────────────────────────────────────────

    /**
     * Record the authenticated user's decision on a match.
     *
     * Mutual match rule:
     *   statusA = ACCEPTED + statusB = ACCEPTED → mutualMatch = true
     *
     * Only updates the slot that belongs to this user.
     * Throws if user is not part of the match (security).
     */
    public MatchDTO decide(Long currentUserId, DecideRequest req) {
        Match match = matchRepo.findById(req.getMatchId())
                .orElseThrow(() -> new RuntimeException("Match not found: " + req.getMatchId()));

        MatchStatus newStatus = MatchStatus.valueOf(req.getDecision());

        if (match.getUserAId().equals(currentUserId)) {
            match.setStatusA(newStatus);
        } else if (match.getUserBId().equals(currentUserId)) {
            match.setStatusB(newStatus);
        } else {
            throw new RuntimeException(
                    "User " + currentUserId + " is not part of match " + req.getMatchId());
        }

        matchRepo.save(match);
        return toDTO(match, currentUserId, null);
    }

    // ── Load ─────────────────────────────────────────────────────────────────

    /**
     * Returns all matches for the given user, split into two categories:
     *
     * iAmA = true  → I triggered the AI (Section 1: My Decisions)
     * iAmA = false → I was suggested to someone (Section 2: Who Matched With You)
     *
     * CRITICAL: Section 2 is ONLY returned when the user themselves has an
     * active pregnancy. This prevents Bob-without-pregnancy seeing matches.
     *
     * Example with your DB:
     *  Alice (id=1): iAmA=true  → sees Bob in Section 1 (she accepted, Bob pending)
     *  Bob   (id=2): iAmA=false → sees Alice in Section 2 (Alice accepted, Bob pending)
     *                             → can also trigger own AI to get Section 1 matches
     *  Yomna (id=3): no pregnancy → both sections empty
     */
    public List<MatchDTO> getMyMatches(Long userId) {
        List<MatchDTO> result = new ArrayList<>();

        // Section 1: matches I triggered (always included if they exist)
        for (Match m : matchRepo.findByUserAId(userId)) {
            result.add(toDTO(m, userId, null));
        }

        // Section 2: matches where I am userB — ONLY if I have a pregnancy
        Integer myCount = marrainageRepo.countActivePregnancies(userId);
        if (myCount != null && myCount > 0) {
            for (Match m : matchRepo.findByUserBId(userId)) {
                result.add(toDTO(m, userId, null));
            }
        }

        return result;
    }

    // ── DTO builder ──────────────────────────────────────────────────────────

    private MatchDTO toDTO(Match m, Long currentUserId,
                           tn.esprit.backend.repository.MarraineProjection proj) {

        boolean iAmA        = m.getUserAId().equals(currentUserId);
        Long    otherId     = iAmA ? m.getUserBId()  : m.getUserAId();
        MatchStatus myStatus    = iAmA ? m.getStatusA() : m.getStatusB();
        MatchStatus theirStatus = iAmA ? m.getStatusB() : m.getStatusA();
        boolean mutualMatch = m.getStatusA() == MatchStatus.ACCEPTED
                && m.getStatusB() == MatchStatus.ACCEPTED;

        String  name   = proj != null ? proj.getFullName()      : fetchName(otherId);
        String  city   = proj != null ? proj.getCity()          : fetchCity(otherId);
        Integer week   = proj != null ? proj.getCurrentWeek()   : fetchWeek(otherId);
        String  type   = proj != null ? proj.getPregnancyType() : null;
        Boolean baby   = proj != null && proj.getHasBaby() != null && proj.getHasBaby() == 1;
        String  reason = proj != null ? proj.getReason()        : null;

        return MatchDTO.builder()
                .matchId(m.getId())
                .otherUserId(otherId)
                .otherUserName(name)
                .otherUserCity(city)
                .otherUserWeek(week)
                .otherUserPregnancyType(type)
                .otherUserHasBaby(baby)
                .aiScore(m.getAiScore())
                .reason(reason)
                .myStatus(myStatus)
                .theirStatus(theirStatus)
                .iAmA(iAmA)
                .mutualMatch(mutualMatch)
                .build();
    }

    private String  fetchName(Long id) { return userRepo.findById(id).map(u -> u.getFirstName()+" "+u.getLastName()).orElse("Unknown"); }
    private String  fetchCity(Long id) { return marrainageRepo.findCityByUserId(id); }
    private Integer fetchWeek(Long id) { return marrainageRepo.findCurrentWeekByUserId(id); }
}