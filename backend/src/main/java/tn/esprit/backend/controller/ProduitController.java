package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.entity.Produit;
import tn.esprit.backend.service.ProduitService;

import java.util.List;

@RestController
@RequestMapping("/api/produits")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProduitController {

    private final ProduitService produitService;

    @PostMapping
    public ResponseEntity<Produit> creer(Authentication authentication,
                                         @RequestBody Produit produit) {
        return ResponseEntity.ok(produitService.creer(authentication.getName(), produit));
    }

    @GetMapping
    public ResponseEntity<List<Produit>> recupererTout() {
        return ResponseEntity.ok(produitService.recupererTout());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Produit> recupererParId(@PathVariable Long id) {
        return ResponseEntity.ok(produitService.recupererParId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Produit> mettreAJour(Authentication authentication,
                                               @PathVariable Long id,
                                               @RequestBody Produit produit) {
        return ResponseEntity.ok(
                produitService.mettreAJour(authentication.getName(), id, produit));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(Authentication authentication,
                                          @PathVariable Long id) {
        produitService.supprimer(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }
}