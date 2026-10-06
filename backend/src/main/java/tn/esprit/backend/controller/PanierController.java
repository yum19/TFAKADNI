package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.entity.Panier;
import tn.esprit.backend.service.PanierService;

import java.util.List;

@RestController
@RequestMapping("/api/paniers")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PanierController {

    private final PanierService panierService;

    @PostMapping
    public ResponseEntity<Panier> creer(Authentication authentication,
                                        @RequestBody Panier panier) {
        return ResponseEntity.ok(panierService.creer(authentication.getName(), panier));
    }

    @GetMapping
    public ResponseEntity<List<Panier>> recupererTout(Authentication authentication) {
        return ResponseEntity.ok(panierService.recupererParUser(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Panier> recupererParId(Authentication authentication,
                                                 @PathVariable Long id) {
        return ResponseEntity.ok(panierService.recupererParId(authentication.getName(), id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Panier> mettreAJour(Authentication authentication,
                                              @PathVariable Long id,
                                              @RequestBody Panier panier) {
        return ResponseEntity.ok(panierService.mettreAJour(authentication.getName(), id, panier));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(Authentication authentication,
                                          @PathVariable Long id) {
        panierService.supprimer(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }
}