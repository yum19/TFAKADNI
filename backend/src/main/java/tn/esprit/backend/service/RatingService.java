package tn.esprit.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import tn.esprit.backend.dto.RatingDTO;
import tn.esprit.backend.dto.RatingRequest;
import tn.esprit.backend.entity.Match;
import tn.esprit.backend.entity.Match.MatchStatus;
import tn.esprit.backend.entity.MatchRating;
import tn.esprit.backend.repository.MatchRatingRepository;
import tn.esprit.backend.repository.MatchRepository;

@Service
@RequiredArgsConstructor
public class RatingService {

    private final MatchRatingRepository ratingRepo;
    private final MatchRepository matchRepo;

    // 🔥 Add RestTemplate to call Flask API
    private final RestTemplate restTemplate;

    /**
     * Submit or update a star rating for a mutual match.
     */
    public RatingDTO rate(Long raterId, RatingRequest req) {

        // 1. Validate stars
        if (req.getStars() == null || req.getStars() < 1 || req.getStars() > 5) {
            throw new IllegalArgumentException("Stars must be between 1 and 5");
        }

        // 2. Load match
        Match match = matchRepo.findById(req.getMatchId())
                .orElseThrow(() -> new RuntimeException("Match not found: " + req.getMatchId()));

        // 3. Must be mutual
        if (match.getStatusA() != MatchStatus.ACCEPTED || match.getStatusB() != MatchStatus.ACCEPTED) {
            throw new IllegalStateException("You can only rate a mutual match");
        }

        // 4. Caller must belong to this match
        boolean isA = match.getUserAId().equals(raterId);
        boolean isB = match.getUserBId().equals(raterId);
        if (!isA && !isB) {
            throw new RuntimeException("User " + raterId + " is not part of match " + req.getMatchId());
        }

        // 5. Determine who is being rated
        Long ratedId = isA ? match.getUserBId() : match.getUserAId();

        // 6. Upsert rating
        MatchRating rating = ratingRepo
                .findByMatchIdAndRaterId(req.getMatchId(), raterId)
                .orElseGet(() -> MatchRating.builder()
                        .matchId(req.getMatchId())
                        .raterId(raterId)
                        .ratedId(ratedId)
                        .build());

        rating.setStars(req.getStars());
        rating.setComment(req.getComment());
        ratingRepo.save(rating);

        // 🔥 ML RETRAIN TRIGGER (every 20 ratings)
        triggerRetrainIfNeeded();

        // 7. Compute updated stats
        Double avg = ratingRepo.avgStarsByRatedId(ratedId);
        Long total = ratingRepo.countByRatedId(ratedId);

        return RatingDTO.builder()
                .id(rating.getId())
                .matchId(rating.getMatchId())
                .raterId(raterId)
                .ratedId(ratedId)
                .stars(rating.getStars())
                .comment(rating.getComment())
                .createdAt(rating.getCreatedAt())
                .avgStars(avg != null ? Math.round(avg * 10.0) / 10.0 : null)
                .totalRatings(total)
                .build();
    }

    /**
     * 🔥 Separate method for ML retraining trigger
     */
    private void triggerRetrainIfNeeded() {
        try {
            long total = ratingRepo.count();

            if (total % 20 == 0) {
                System.out.println("Triggering ML retraining...");

                restTemplate.postForObject(
                        "http://localhost:5000/train",
                        null,
                        String.class
                );
            }

        } catch (Exception e) {
            // Don't break main logic if ML fails
            System.err.println("ML retrain failed: " + e.getMessage());
        }
    }

    /**
     * Get current user's rating in a match
     */
    public RatingDTO getMyRating(Long raterId, Long matchId) {
        return ratingRepo.findByMatchIdAndRaterId(matchId, raterId)
                .map(r -> {
                    Double avg = ratingRepo.avgStarsByRatedId(r.getRatedId());
                    Long total = ratingRepo.countByRatedId(r.getRatedId());

                    return RatingDTO.builder()
                            .id(r.getId())
                            .matchId(r.getMatchId())
                            .raterId(r.getRaterId())
                            .ratedId(r.getRatedId())
                            .stars(r.getStars())
                            .comment(r.getComment())
                            .createdAt(r.getCreatedAt())
                            .avgStars(avg != null ? Math.round(avg * 10.0) / 10.0 : null)
                            .totalRatings(total)
                            .build();
                })
                .orElse(null);
    }

    /**
     * Public stats for a user
     */
    public RatingDTO getUserStats(Long userId) {
        Double avg = ratingRepo.avgStarsByRatedId(userId);
        Long total = ratingRepo.countByRatedId(userId);

        return RatingDTO.builder()
                .ratedId(userId)
                .avgStars(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0)
                .totalRatings(total)
                .build();
    }
}