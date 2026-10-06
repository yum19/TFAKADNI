package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.entity.Commande;
import tn.esprit.backend.service.CommandeService;

import java.util.List;

@RestController
@RequestMapping("/api/commandes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CommandeController {

    private final CommandeService commandeService;

    @PostMapping
    public ResponseEntity<Commande> creer(Authentication authentication,
                                          @RequestBody Commande commande) {
        return ResponseEntity.ok(commandeService.creer(authentication.getName(), commande));
    }

    @GetMapping
    public ResponseEntity<List<Commande>> recupererTout(Authentication authentication) {
        return ResponseEntity.ok(commandeService.recupererParUser(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Commande> recupererParId(Authentication authentication,
                                                   @PathVariable Long id) {
        return ResponseEntity.ok(commandeService.recupererParId(authentication.getName(), id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Commande> mettreAJour(Authentication authentication,
                                                @PathVariable Long id,
                                                @RequestBody Commande commande) {
        return ResponseEntity.ok(commandeService.mettreAJour(authentication.getName(), id, commande));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(Authentication authentication,
                                          @PathVariable Long id) {
        commandeService.supprimer(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }
}