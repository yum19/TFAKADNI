package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.dto.request.*;
import tn.esprit.backend.dto.response.*;
import tn.esprit.backend.entity.*;
import tn.esprit.backend.exception.AppException;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.repository.*;
import tn.esprit.backend.service.ISubscriptionService;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionServiceImpl implements ISubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final InvoiceRepository      invoiceRepository;
    private final UserRepository         userRepository;
    private final PromoCodeRepository    promoCodeRepository;

    // ── Souscrire ─────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public SubscriptionResponse subscribe(Long userId, SubscriptionRequest req) {
        // Un seul abonnement ACTIVE autorisé par utilisatrice
        if (subscriptionRepository.existsByUserIdAndStatus(userId, Subscription.Status.ACTIVE)) {
            throw new AppException("Vous avez déjà un abonnement actif. Veuillez d'abord le modifier ou l'annuler.");
        }

        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : " + userId));

        PromoCode promo = null;
        if (req.getPromoCode() != null && !req.getPromoCode().isBlank()) {
            promo = promoCodeRepository.findByCode(req.getPromoCode().toUpperCase())
                    .filter(PromoCode::isUsable)
                    .orElseThrow(() -> new AppException("Code promo invalide ou expiré."));
            promo.setUsedCount(promo.getUsedCount() + 1);
            promoCodeRepository.save(promo);
        }

        var sub = Subscription.builder()
                .user(user)
                .plan(req.getPlan())
                .status(Subscription.Status.ACTIVE)
                .startDate(LocalDate.now())
                .endDate(req.getPlan() == Subscription.Plan.FREE ? null : LocalDate.now().plusMonths(1))
                .promoCode(promo)
                .build();

        subscriptionRepository.save(sub);
        log.info("Nouvel abonnement {} créé pour userId={}", req.getPlan(), userId);

        return toResponse(sub);
    }

    // ── Abonnement actif ──────────────────────────────────────────────────────

    @Override
    public SubscriptionResponse getActiveSubscription(Long userId) {
        var sub = subscriptionRepository.findByUserIdAndStatus(userId, Subscription.Status.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Aucun abonnement actif pour cet utilisateur."));
        return toResponse(sub);
    }

    // ── Changer de plan ───────────────────────────────────────────────────────
    @Override
    @Transactional
    public SubscriptionResponse changePlan(Long subscriptionId, SubscriptionRequest req) {
        var sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Abonnement introuvable : " + subscriptionId));

        if (sub.getStatus() != Subscription.Status.ACTIVE) {
            throw new AppException("Seul un abonnement actif peut être modifié.");
        }

        sub.setPlan(req.getPlan());
        sub.setEndDate(req.getPlan() == Subscription.Plan.FREE ? null : LocalDate.now().plusMonths(1));

        if (req.getPromoCode() != null && !req.getPromoCode().isBlank()) {
            var promo = promoCodeRepository.findByCode(req.getPromoCode())
                    .orElseThrow(() -> new ResourceNotFoundException("Code promo introuvable : " + req.getPromoCode()));



            sub.setPromoCode(promo);
        }

        subscriptionRepository.save(sub);

        log.info("Plan modifié → {} pour subscriptionId={}", req.getPlan(), subscriptionId);
        return toResponse(sub);
    }
    /*@Override
    @Transactional
    public SubscriptionResponse changePlan(Long subscriptionId, SubscriptionRequest req) {
        var sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Abonnement introuvable : " + subscriptionId));

        if (sub.getStatus() != Subscription.Status.ACTIVE) {
            throw new AppException("Seul un abonnement actif peut être modifié.");
        }

        sub.setPlan(req.getPlan());
        sub.setEndDate(req.getPlan() == Subscription.Plan.FREE ? null : LocalDate.now().plusMonths(1));
        subscriptionRepository.save(sub);

        log.info("Plan modifié → {} pour subscriptionId={}", req.getPlan(), subscriptionId);
        return toResponse(sub);
    }

    // ── Annuler ───────────────────────────────────────────────────────────────

    /*@Override
    @Transactional
    public void cancel(Long subscriptionId) {
        var sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Abonnement introuvable : " + subscriptionId));

        sub.setStatus(Subscription.Status.CANCELLED);
        subscriptionRepository.save(sub);
        log.info("Abonnement annulé : subscriptionId={}", subscriptionId);
    }*/
    @Override
    @Transactional
    public void cancel(Long subscriptionId) {
        if (!subscriptionRepository.existsById(subscriptionId)) {
            throw new ResourceNotFoundException("Abonnement introuvable : " + subscriptionId);
        }

        subscriptionRepository.deleteById(subscriptionId);
        log.info("Abonnement supprimé : subscriptionId={}", subscriptionId);
    }

    // ── Factures ──────────────────────────────────────────────────────────────

    @Override
    public List<InvoiceResponse> getInvoices(Long userId) {
        return invoiceRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toInvoiceResponse)
                .collect(Collectors.toList());
    }

    @Override
    public byte[] getInvoicePdf(Long invoiceId) {
        invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Facture introuvable : " + invoiceId));
        // TODO : générer ou récupérer le PDF via un service de stockage
        throw new AppException("Génération PDF à connecter au service de stockage.");
    }

    // ── Mapper ────────────────────────────────────────────────────────────────

    private SubscriptionResponse toResponse(Subscription s) {
        return SubscriptionResponse.builder()
                .id(s.getId())
                .plan(s.getPlan())
                .status(s.getStatus())
                .startDate(s.getStartDate())
                .endDate(s.getEndDate())
                .createdAt(s.getCreatedAt())
                .build();
    }

    private InvoiceResponse toInvoiceResponse(Invoice i) {
        return InvoiceResponse.builder()
                .id(i.getId())
                .amount(i.getAmount())
                .currency(i.getCurrency())
                .status(i.getStatus())
                .paymentProvider(i.getPaymentProvider())
                .paidAt(i.getPaidAt())
                .pdfUrl(i.getPdfUrl())
                .createdAt(i.getCreatedAt())
                .build();
    }
}