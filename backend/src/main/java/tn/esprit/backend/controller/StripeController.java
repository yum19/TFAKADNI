// tn/esprit/backend/controller/StripeController.java
package tn.esprit.backend.controller;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.CheckoutRequest;
import tn.esprit.backend.dto.CheckoutResponse;
import tn.esprit.backend.entity.Commande;
import tn.esprit.backend.entity.CommandeItem;
import tn.esprit.backend.entity.Produit;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.repository.CommandeRepository;
import tn.esprit.backend.repository.ProduitRepository;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.SmsService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/checkout")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StripeController {

    @Value("${stripe.secret-key}")
    private String stripeSecretKey;

    private final UserRepository     userRepository;
    private final ProduitRepository produitRepository;
    private final CommandeRepository commandeRepository;
    private final SmsService         smsService;

    /**
     * POST /api/checkout/create-payment-intent
     */
    @PostMapping("/create-payment-intent")
    public ResponseEntity<CheckoutResponse> createPaymentIntent(
            Authentication authentication,
            @RequestBody CheckoutRequest request
    ) throws StripeException {

        Stripe.apiKey = stripeSecretKey;

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        double total = 0;
        List<CommandeItem> commandeItems = new ArrayList<>();

        for (CheckoutRequest.ItemDto dto : request.getItems()) {
            Produit produit = produitRepository.findById(dto.getProduitId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Produit introuvable: " + dto.getProduitId()));

            CommandeItem ci = new CommandeItem();
            ci.setProduit(produit);
            ci.setQuantite(dto.getQuantite());
            ci.setPrixUnitaire(produit.getPrix());
            total += produit.getPrix() * dto.getQuantite();
            commandeItems.add(ci);
        }

        Commande commande = new Commande();
        commande.setUser(user);
        commande.setNom(request.getNom() != null ? request.getNom() : user.getLastName());
        commande.setPrenom(request.getPrenom() != null ? request.getPrenom() : user.getFirstName());
        commande.setMail(request.getMail() != null ? request.getMail() : user.getEmail());
        commande.setAdresse(buildAdresse(request));
        commande.setTelephone(request.getTelephone());
        commande.setTotal(total);
        commande.setDate(LocalDateTime.now());
        commande.setStatut("PENDING");

        for (CommandeItem ci : commandeItems) {
            ci.setCommande(commande);
        }
        commande.setItems(commandeItems);

        Commande saved = commandeRepository.save(commande);

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(Math.round(total * 100))
                .setCurrency("eur")
                .putMetadata("commandeId", String.valueOf(saved.getId()))
                .putMetadata("userEmail",  user.getEmail())
                .build();

        PaymentIntent intent = PaymentIntent.create(params);

        return ResponseEntity.ok(new CheckoutResponse(
                intent.getClientSecret(),
                saved.getId(),
                total
        ));
    }

    /**
     * POST /api/checkout/confirm/{commandeId}
     * Marks the order PAID, sends SMS, and decrements stock for each item.
     */
    @PostMapping("/confirm/{commandeId}")
    public ResponseEntity<Void> confirmPayment(
            Authentication authentication,
            @PathVariable Long commandeId,
            @RequestParam String paymentIntentId
    ) throws StripeException {

        Stripe.apiKey = stripeSecretKey;

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        Commande commande = commandeRepository.findByIdAndUserId(commandeId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable"));

        PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);

        if ("succeeded".equals(intent.getStatus())) {
            commande.setStatut("PAID");
            commande.setStripePaymentIntentId(paymentIntentId);

            // ── Decrement stock for each purchased item ──────────────────
            for (CommandeItem item : commande.getItems()) {
                Produit produit = item.getProduit();
                int newStock = (produit.getStock() != null ? produit.getStock() : 0)
                        - item.getQuantite();
                // Clamp to 0 to avoid negative stock
                produit.setStock(Math.max(0, newStock));
                produitRepository.save(produit);
            }
            // ─────────────────────────────────────────────────────────────

            commandeRepository.save(commande);

            String phone = commande.getTelephone();
            if (phone != null && !phone.isBlank()) {
                smsService.sendSms(phone, buildSmsMessage(commande, user));
            }
        } else {
            commande.setStatut("FAILED");
            commandeRepository.save(commande);
        }

        return ResponseEntity.ok().build();
    }

    /**
     * POST /api/checkout/cancel/{commandeId}
     */
    @PostMapping("/cancel/{commandeId}")
    public ResponseEntity<Void> cancelPayment(
            Authentication authentication,
            @PathVariable Long commandeId
    ) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        Commande commande = commandeRepository.findByIdAndUserId(commandeId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable"));

        commande.setStatut("FAILED");
        commandeRepository.save(commande);

        return ResponseEntity.ok().build();
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private String buildAdresse(CheckoutRequest r) {
        if (r.getVille() == null && r.getAdresse() == null) return "";
        if (r.getAdresse() == null) return r.getVille();
        if (r.getVille()  == null) return r.getAdresse();
        return r.getVille() + ", " + r.getAdresse();
    }

    private String buildSmsMessage(Commande commande, User user) {
        StringBuilder sb = new StringBuilder();
        sb.append("✅ Order Confirmed!\n");
        sb.append("Hi ").append(user.getFirstName()).append(",\n\n");
        sb.append("Order #").append(commande.getId()).append("\n");
        sb.append("Date: ").append(commande.getDate().toLocalDate()).append("\n\n");
        sb.append("Items:\n");
        for (CommandeItem item : commande.getItems()) {
            sb.append("• ").append(item.getProduit().getNom())
                    .append(" x").append(item.getQuantite())
                    .append(" = ").append(String.format("%.2f", item.getPrixUnitaire() * item.getQuantite()))
                    .append(" EUR\n");
        }
        sb.append("\nTotal: ").append(String.format("%.2f", commande.getTotal())).append(" EUR");
        sb.append("\nShipping to: ").append(commande.getAdresse());
        sb.append("\n\nThank you for your order! 🛍️");
        return sb.toString();
    }
}