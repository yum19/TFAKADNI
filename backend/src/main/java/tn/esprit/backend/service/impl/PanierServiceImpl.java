package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.entity.Panier;
import tn.esprit.backend.entity.PanierItem;
import tn.esprit.backend.entity.Produit;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.repository.PanierRepository;
import tn.esprit.backend.repository.ProduitRepository;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.PanierService;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PanierServiceImpl implements PanierService {

    private final PanierRepository panierRepository;
    private final ProduitRepository produitRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public Panier creer(String email, Panier incoming) {
        User user = getUserByEmail(email);

        Panier panier = new Panier();
        panier.setUser(user);
        panier.setItems(new ArrayList<>());

        if (incoming.getItems() != null) {
            for (PanierItem req : incoming.getItems()) {
                panier.getItems().add(buildItem(panier, req));
            }
        }
        return panierRepository.save(panier);
    }

    @Override
    public List<Panier> recupererParUser(String email) {
        User user = getUserByEmail(email);
        return panierRepository.findByUserId(user.getId());
    }

    @Override
    public Panier recupererParId(String email, Long id) {
        User user = getUserByEmail(email);
        return panierRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Panier non trouvé : " + id));
    }

    @Override
    @Transactional
    public Panier mettreAJour(String email, Long id, Panier incoming) {
        Panier panier = recupererParId(email, id);

        panier.getItems().clear();
        panierRepository.saveAndFlush(panier);

        if (incoming.getItems() != null) {
            for (PanierItem req : incoming.getItems()) {
                panier.getItems().add(buildItem(panier, req));
            }
        }
        return panierRepository.save(panier);
    }

    @Override
    @Transactional
    public void supprimer(String email, Long id) {
        Panier panier = recupererParId(email, id);
        panierRepository.delete(panier);
    }

    private PanierItem buildItem(Panier panier, PanierItem req) {
        if (req.getProduit() == null || req.getProduit().getId() == null)
            throw new RuntimeException("produit.id manquant dans l'item du panier");

        Produit produit = produitRepository.findById(req.getProduit().getId())
                .orElseThrow(() -> new RuntimeException("Produit non trouvé : " + req.getProduit().getId()));

        PanierItem item = new PanierItem();
        item.setPanier(panier);
        item.setProduit(produit);
        item.setQuantite(req.getQuantite() != null ? req.getQuantite() : 1);
        return item;
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }
}