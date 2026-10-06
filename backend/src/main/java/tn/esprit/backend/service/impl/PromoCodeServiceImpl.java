package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.dto.request.*;
import tn.esprit.backend.dto.response.*;
import tn.esprit.backend.entity.PromoCode;
import tn.esprit.backend.exception.AppException;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.repository.PromoCodeRepository;
import tn.esprit.backend.service.IPromoCodeService;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PromoCodeServiceImpl implements IPromoCodeService {

    private final PromoCodeRepository promoCodeRepository;

    // ── Valider (côté utilisatrice) ───────────────────────────────────────────

    @Override
    public PromoCodeResponse validate(String code) {
        var promo = promoCodeRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new AppException("Code promo invalide."));

        if (!promo.isUsable()) {
            throw new AppException("Ce code promo est expiré ou épuisé.");
        }

        return toResponse(promo);
    }

    // ── CRUD Admin ────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public PromoCodeResponse create(PromoCodeRequest req) {
        if (promoCodeRepository.existsByCode(req.getCode().toUpperCase())) {
            throw new AppException("Ce code promo existe déjà.");
        }

        var promo = PromoCode.builder()
                .code(req.getCode().toUpperCase())
                .discountPct(req.getDiscountPct())
                .maxUses(req.getMaxUses())
                .usedCount(0)
                .expiresAt(req.getExpiresAt())
                .active(true)
                .build();

        promoCodeRepository.save(promo);
        return toResponse(promo);
    }

    @Override
    public List<PromoCodeResponse> findAll() {
        return promoCodeRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }


    @Transactional
    @Override
    public PromoCodeResponse update(Long id, PromoCodeRequest req) {
        var promo = promoCodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Code promo introuvable : " + id));
        promo.setCode(req.getCode().toUpperCase());
        promo.setDiscountPct(req.getDiscountPct());
        promo.setMaxUses(req.getMaxUses());
        promo.setExpiresAt(req.getExpiresAt());
        promoCodeRepository.save(promo);
        return toResponse(promo);
    }

    @Override
    public PromoCodeResponse toggleActive(Long id) {
        var promo = promoCodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Code promo introuvable : " + id));

        promo.setActive(!promo.getActive());
        promoCodeRepository.save(promo);
        return toResponse(promo);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!promoCodeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Code promo introuvable : " + id);
        }
        promoCodeRepository.deleteById(id);
    }

    // ── Mapper ────────────────────────────────────────────────────────────────

    private PromoCodeResponse toResponse(PromoCode p) {
        return PromoCodeResponse.builder()
                .id(p.getId())
                .code(p.getCode())
                .discountPct(p.getDiscountPct())
                .maxUses(p.getMaxUses())
                .usedCount(p.getUsedCount())
                .expiresAt(p.getExpiresAt())
                .active(p.getActive())
                .build();
    }
}