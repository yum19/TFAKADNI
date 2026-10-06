package tn.esprit.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.request.*;
import tn.esprit.backend.dto.response.*;
import tn.esprit.backend.service.IPromoCodeService;

import java.util.List;

@RestController
@RequestMapping("/api/promo-codes")
@RequiredArgsConstructor
public class PromoCodeController {

    private final IPromoCodeService promoCodeService;

    /**
     * POST /api/promo-codes/validate
     * Vérifier et appliquer un code promo (utilisatrice)
     */
    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<PromoCodeResponse>> validate(
            @Valid @RequestBody ValidatePromoRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(promoCodeService.validate(request.getCode())));
    }

    /**
     * POST /api/promo-codes
     * Créer un code promo — ADMIN uniquement
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PromoCodeResponse>> create(
            @Valid @RequestBody PromoCodeRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Code promo créé.", promoCodeService.create(request)));
    }

    /**
     * GET /api/promo-codes
     * Lister tous les codes promo — ADMIN uniquement
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<PromoCodeResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.ok(promoCodeService.findAll()));
    }

    /**
     * PUT /api/promo-codes/:id
     * Activer / Désactiver un code — ADMIN uniquement
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PromoCodeResponse>> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(promoCodeService.toggleActive(id)));
    }

    /**
     * PUT /api/promo-codes/:id/update
     * Modifier un code promo — ADMIN uniquement
     */
    @PutMapping("/{id}/update")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PromoCodeResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody PromoCodeRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(promoCodeService.update(id, request)));
    }

    /**
     * DELETE /api/promo-codes/:id
     * Supprimer un code — ADMIN uniquement
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        promoCodeService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Code promo supprimé.", null));
    }
}