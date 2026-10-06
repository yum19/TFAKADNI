package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.response.ApiResponse;
import tn.esprit.backend.entity.Referral;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.repository.ReferralRepository;
import tn.esprit.backend.repository.UserRepository;

import java.util.*;

@RestController
@RequestMapping("/api/referrals")
@RequiredArgsConstructor
public class ReferralController {

    private final UserRepository     userRepository;
    private final ReferralRepository referralRepository;

    /** GET /api/referrals/my-code — stats complètes du parrainage */
    @GetMapping("/my-code")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyCode(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (user.getReferralCode() == null || user.getReferralCode().isEmpty()) {
            user.setReferralCode(UUID.randomUUID().toString().replace("-","").substring(0,8).toUpperCase());
            userRepository.save(user);
        }

        String code = user.getReferralCode();
        String link = "http://localhost:4200/auth/signup?ref=" + code;

        // Stats
        int totalPending  = referralRepository.countByReferrerIdAndStatus(user.getId(), Referral.Status.PENDING);
        int totalRewarded = referralRepository.countByReferrerIdAndStatus(user.getId(), Referral.Status.REWARDED);
        int total         = totalPending + totalRewarded;

        // Historique filleuls
        List<Map<String, Object>> referrals = referralRepository.findByReferrerId(user.getId())
                .stream()
                .map(r -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id",            r.getId());
                    m.put("referredName",  r.getReferred().getFirstName() + " " + r.getReferred().getLastName());
                    m.put("referredEmail", r.getReferred().getEmail());
                    m.put("status",        r.getStatus().name());
                    m.put("createdAt",     r.getCreatedAt() != null ? r.getCreatedAt().toString() : "");
                    m.put("avatarUrl",     r.getReferred().getAvatarUrl());
                    return m;
                })
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("code",           code);
        result.put("link",           link);
        result.put("total",          total);
        result.put("totalPending",   totalPending);
        result.put("totalRewarded",  totalRewarded);
        result.put("referrals",      referrals);

        return ResponseEntity.ok(ApiResponse.ok("Données parrainage", result));
    }

    /** GET /api/referrals/validate?code=ABC — vérifier un code (public) */
    @GetMapping("/validate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateCode(@RequestParam String code) {
        Map<String, Object> result = new HashMap<>();
        userRepository.findAll().stream()
                .filter(u -> code.equalsIgnoreCase(u.getReferralCode()))
                .findFirst()
                .ifPresentOrElse(
                        u -> { result.put("valid", true); result.put("owner", u.getFirstName()); },
                        () ->   result.put("valid", false)
                );
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}