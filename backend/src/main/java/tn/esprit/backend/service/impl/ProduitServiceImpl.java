package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.backend.entity.Produit;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.repository.ProduitRepository;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.ProduitService;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProduitServiceImpl implements ProduitService {

    private final ProduitRepository produitRepository;
    private final UserRepository userRepository;

    @Override
    public Produit creer(String email, Produit produit) {
        User user = getUserByEmail(email);
        produit.setUser(user);
        if (produit.getStock() == null) produit.setStock(0);
        if (produit.getImages() == null) produit.setImages(new ArrayList<>());
        return produitRepository.save(produit);
    }

    @Override
    public List<Produit> recupererTout() {
        return produitRepository.findAll();
    }

    @Override
    public Produit recupererParId(Long id) {
        return produitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé avec l'id : " + id));
    }

    @Override
    public Produit mettreAJour(String email, Long id, Produit produit) {
        Produit existant = produitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Produit non trouvé : " + id));

        existant.setNom(produit.getNom());
        existant.setDescription(produit.getDescription());
        existant.setPrix(produit.getPrix());
        existant.setStock(produit.getStock());
        existant.setImages(produit.getImages());
        existant.setCategorie(produit.getCategorie()); // ← you were missing this too
        return produitRepository.save(existant);
    }

    @Override
    public void supprimer(String email, Long id) {
        Produit existant = produitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Produit non trouvé : " + id));
        produitRepository.delete(existant);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }
}