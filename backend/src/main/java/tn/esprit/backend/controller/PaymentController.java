package tn.esprit.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.request.CheckoutRequest;
import tn.esprit.backend.dto.response.ApiResponse;
import tn.esprit.backend.dto.response.CheckoutResponse;
import tn.esprit.backend.entity.PromoCode;
import tn.esprit.backend.entity.Subscription;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.AppException;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.repository.PromoCodeRepository;
import tn.esprit.backend.repository.SubscriptionRepository;
import tn.esprit.backend.repository.UserRepository;

import tn.esprit.backend.repository.PlanConfigRepository;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@PreAuthorize("hasRole('USER')")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final UserRepository userRepository;
    private final PromoCodeRepository promoCodeRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PlanConfigRepository planConfigRepository;

    /** Charge les prix depuis plan_config en BD — toujours à jour */
    private Map<String, Double> getPlanPrices() {
        Map<String, Double> prices = new HashMap<>();
        planConfigRepository.findAll().forEach(p -> {
            if (p.getPrice() != null) {
                java.util.regex.Matcher m = java.util.regex.Pattern.compile("([\\d.]+)").matcher(p.getPrice());
                if (m.find()) prices.put(p.getPlanKey(), Double.parseDouble(m.group(1)));
            }
        });
        prices.putIfAbsent("FREE", 0.0);
        prices.putIfAbsent("PREMIUM", 30.0);
        prices.putIfAbsent("PRO", 59.0);
        return prices;
    }

    /**
     * POST /api/payments/checkout
     * Calcule le prix final avec promo et retourne une URL de simulation
     */
    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<CheckoutResponse>> checkout(
            @Valid @RequestBody CheckoutRequest request,
            Authentication authentication
    ) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        // Plan FREE → activation directe
        if (request.getPlan() == Subscription.Plan.FREE) {
            activateSubscription(user, Subscription.Plan.FREE, null, 0.0);
            return ResponseEntity.ok(ApiResponse.ok("Abonnement FREE activé.", CheckoutResponse.builder()
                    .plan("FREE").finalAmount(0).originalAmount(0).paymentUrl(null).build()));
        }

        double originalPrice = getPlanPrices().getOrDefault(request.getPlan().name(), 0.0);
        double finalPrice = originalPrice;
        int discountPercent = 0;
        PromoCode promoCode = null;

        // Si upgrade depuis un plan actif → calculer la différence à payer
        var existingActive = subscriptionRepository.findByUserIdAndStatus(user.getId(), Subscription.Status.ACTIVE);
        double upgradeFrom = 0;
        if (existingActive.isPresent()) {
            Subscription current = existingActive.get();
            double currentPrice = current.getAmountPaid() != null ? current.getAmountPaid()
                    : getPlanPrices().getOrDefault(current.getPlan().name(), 0.0);
            if (originalPrice > currentPrice) {
                upgradeFrom = currentPrice;
                finalPrice = originalPrice - currentPrice; // payer seulement la différence
            }
        }

        // Appliquer code promo sur le montant à payer
        if (request.getPromoCode() != null && !request.getPromoCode().isBlank()) {
            promoCode = promoCodeRepository.findByCode(request.getPromoCode().toUpperCase())
                    .filter(PromoCode::isUsable)
                    .orElseThrow(() -> new AppException("Code promo invalide ou expiré."));
            discountPercent = promoCode.getDiscountPct();
            finalPrice = finalPrice * (1 - discountPercent / 100.0);
            finalPrice = Math.round(finalPrice * 100.0) / 100.0;
        }

        // Référence unique de simulation
        String simulationRef = UUID.randomUUID().toString().substring(0, 12).toUpperCase();

        // URL vers la page de simulation Angular
        String simulationUrl = "http://localhost:4200/api/mother/payment/simulate" +
                "?ref=" + simulationRef +
                "&plan=" + request.getPlan().name() +
                "&amount=" + finalPrice +
                "&original=" + originalPrice +
                "&upgradeFrom=" + upgradeFrom +
                "&discount=" + discountPercent +
                (request.getPromoCode() != null && !request.getPromoCode().isBlank()
                        ? "&promo=" + request.getPromoCode() : "");

        log.info("Checkout simulé: plan={} montant={}TND upgradeFrom={}TND ref={}",
                request.getPlan(), finalPrice, upgradeFrom, simulationRef);

        return ResponseEntity.ok(ApiResponse.ok(CheckoutResponse.builder()
                .paymentUrl(simulationUrl)
                .paymentRef(simulationRef)
                .originalAmount((int) originalPrice)
                .discountAmount((int) (originalPrice - finalPrice))
                .finalAmount((int) finalPrice)
                .discountPercent(discountPercent)
                .plan(request.getPlan().name())
                .promoCode(request.getPromoCode())
                .build()));
    }

    /**
     * POST /api/payments/confirm
     * Confirmer le paiement simulé et activer l'abonnement
     */
    @PostMapping("/confirm")
    public ResponseEntity<ApiResponse<CheckoutResponse>> confirm(
            @RequestParam String ref,
            @RequestParam String plan,
            @RequestParam(required = false) String promoCode,
            Authentication authentication
    ) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        Subscription.Plan subPlan = Subscription.Plan.valueOf(plan);

        // Vérifier si l'utilisateur a déjà ce plan actif
        var existingActive = subscriptionRepository.findByUserIdAndStatus(user.getId(), Subscription.Status.ACTIVE);
        if (existingActive.isPresent() && existingActive.get().getPlan() == subPlan) {
            throw new AppException("Vous avez déjà un abonnement " + subPlan.name() + " actif.");
        }

        PromoCode promo = null;
        double basePrice = getPlanPrices().getOrDefault(subPlan.name(), 0.0);
        double finalAmount = basePrice;

        // Si upgrade → payer seulement la différence
        // Si downgrade → payer le prix complet du nouveau plan
        if (existingActive.isPresent()) {
            Subscription current = existingActive.get();
            double currentPrice = current.getAmountPaid() != null ? current.getAmountPaid()
                    : getPlanPrices().getOrDefault(current.getPlan().name(), 0.0);
            if (basePrice > currentPrice) {
                finalAmount = basePrice - currentPrice; // upgrade : différence uniquement
            }
            // downgrade : finalAmount reste basePrice (prix complet)
        }

        if (promoCode != null && !promoCode.isBlank()) {
            promo = promoCodeRepository.findByCode(promoCode.toUpperCase()).orElse(null);
            if (promo != null) {
                promo.setUsedCount(promo.getUsedCount() + 1);
                promoCodeRepository.save(promo);
                finalAmount = Math.round(finalAmount * (1 - promo.getDiscountPct() / 100.0) * 100.0) / 100.0;
            }
        }

        activateSubscription(user, subPlan, promo, finalAmount);
        log.info("Abonnement {} confirmé pour userId={} ref={} montant={}TND", subPlan, user.getId(), ref, finalAmount);

        return ResponseEntity.ok(ApiResponse.ok("Paiement confirmé. Abonnement activé ✓",
                CheckoutResponse.builder().plan(plan).finalAmount((int) finalAmount).build()));
    }

    /**
     * POST /api/payments/webhook
     */
    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(@RequestBody String payload) {
        log.info("Webhook reçu");
        return ResponseEntity.ok().build();
    }

    private void activateSubscription(User user, Subscription.Plan plan, PromoCode promo, double amountPaid) {
        // Garder l'ancien abonnement comme historique (status EXPIRED) sans le supprimer
        subscriptionRepository.findByUserIdAndStatus(user.getId(), Subscription.Status.ACTIVE)
                .ifPresent(s -> {
                    s.setStatus(Subscription.Status.EXPIRED);
                    subscriptionRepository.save(s);
                });

        var sub = Subscription.builder()
                .user(user)
                .plan(plan)
                .status(Subscription.Status.ACTIVE)
                .startDate(LocalDate.now())
                .endDate(plan == Subscription.Plan.FREE ? null : LocalDate.now().plusMonths(1))
                .promoCode(promo)
                .amountPaid(amountPaid)
                .build();
        subscriptionRepository.save(sub);
        log.info("Abonnement {} activé pour userId={} montant={}TND", plan, user.getId(), amountPaid);
    }
}