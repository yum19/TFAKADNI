package tn.esprit.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.request.SubscriptionRequest;
import tn.esprit.backend.dto.response.ApiResponse;
import tn.esprit.backend.dto.response.InvoiceResponse;
import tn.esprit.backend.dto.response.SubscriptionResponse;
import tn.esprit.backend.service.ISubscriptionService;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SubscriptionController {

    private final ISubscriptionService subscriptionService;

    /**
     * POST /api/subscriptions
     * Souscrire à un plan
     */
    @PostMapping("/subscriptions")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> subscribe(
            @Valid @RequestBody SubscriptionRequest request,
            @RequestParam Long userId
    ) {
        var result = subscriptionService.subscribe(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Abonnement créé.", result));
    }

    /**
     * GET /api/subscriptions/:userId
     * Abonnement actif de l'utilisatrice
     */
    @GetMapping("/subscriptions/{userId}")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> getActive(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(subscriptionService.getActiveSubscription(userId)));
    }

    /**
     * PUT /api/subscriptions/:id
     * Changer de plan (upgrade / downgrade)
     */
    @PutMapping("/subscriptions/{id}")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> changePlan(
            @PathVariable Long id,
            @Valid @RequestBody SubscriptionRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                "Plan modifié.", subscriptionService.changePlan(id, request)));
    }

    /**
     * DELETE /api/subscriptions/:id
     * Annuler l'abonnement
     */
    @DeleteMapping("/subscriptions/{id}")
    public ResponseEntity<ApiResponse<Void>> cancel(@PathVariable Long id) {
        subscriptionService.cancel(id);
        return ResponseEntity.ok(ApiResponse.ok("Abonnement annulé.", null));
    }

    /**
     * GET /api/invoices/:userId
     * Historique des factures
     */
    @GetMapping("/invoices/{userId}")
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> getInvoices(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(subscriptionService.getInvoices(userId)));
    }

    /**
     * GET /api/invoices/:id/pdf
     * Télécharger la facture en PDF
     */
    @GetMapping("/invoices/{id}/pdf")
    public ResponseEntity<byte[]> getInvoicePdf(@PathVariable Long id) {
        byte[] pdf = subscriptionService.getInvoicePdf(id);
        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=\"facture-" + id + ".pdf\"")
                .body(pdf);
    }


}