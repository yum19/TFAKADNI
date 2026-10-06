package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.entity.Categorie;
import tn.esprit.backend.service.CategorieService;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CategorieController {

    private final CategorieService categorieService;

    @PostMapping
    public ResponseEntity<Categorie> creer(@RequestBody Categorie categorie) {
        return ResponseEntity.ok(categorieService.creer(categorie));
    }

    @GetMapping
    public ResponseEntity<List<Categorie>> recupererTout() {
        return ResponseEntity.ok(categorieService.recupererTout());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Categorie> recupererParId(@PathVariable Long id) {
        return ResponseEntity.ok(categorieService.recupererParId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Categorie> mettreAJour(@PathVariable Long id, @RequestBody Categorie categorie) {
        return ResponseEntity.ok(categorieService.mettreAJour(id, categorie));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        categorieService.supprimer(id);
        return ResponseEntity.noContent().build();
    }


}