package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.entity.Commande;
import tn.esprit.backend.entity.CommandeItem;
import tn.esprit.backend.entity.Produit;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.repository.CommandeRepository;
import tn.esprit.backend.repository.ProduitRepository;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.CommandeService;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CommandeServiceImpl implements CommandeService {

    private final CommandeRepository commandeRepository;
    private final ProduitRepository produitRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public Commande creer(String email, Commande commande) {
        User user = getUserByEmail(email);
        commande.setUser(user);
        if (commande.getDate() == null) commande.setDate(LocalDateTime.now());

        if (commande.getItems() != null) {
            for (CommandeItem item : commande.getItems()) {
                item.setCommande(commande);
                if (item.getProduit() != null && item.getProduit().getId() != null) {
                    Produit produit = produitRepository.findById(item.getProduit().getId())
                            .orElseThrow(() -> new RuntimeException(
                                    "Produit non trouvé : " + item.getProduit().getId()));
                    item.setProduit(produit);
                }
            }
        }
        return commandeRepository.save(commande);
    }

    @Override
    public List<Commande> recupererParUser(String email) {
        User user = getUserByEmail(email);
        return commandeRepository.findByUserId(user.getId());
    }

    @Override
    public Commande recupererParId(String email, Long id) {
        User user = getUserByEmail(email);
        return commandeRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Commande non trouvée : " + id));
    }

    @Override
    @Transactional
    public Commande mettreAJour(String email, Long id, Commande commandeMaj) {
        Commande existante = recupererParId(email, id);
        existante.setNom(commandeMaj.getNom());
        existante.setPrenom(commandeMaj.getPrenom());
        existante.setMail(commandeMaj.getMail());
        existante.setTotal(commandeMaj.getTotal());
        existante.setAdresse(commandeMaj.getAdresse());
        existante.setDate(commandeMaj.getDate());

        existante.getItems().clear();
        if (commandeMaj.getItems() != null) {
            for (CommandeItem item : commandeMaj.getItems()) {
                item.setCommande(existante);
                if (item.getProduit() != null && item.getProduit().getId() != null) {
                    Produit produit = produitRepository.findById(item.getProduit().getId())
                            .orElseThrow(() -> new RuntimeException(
                                    "Produit non trouvé : " + item.getProduit().getId()));
                    item.setProduit(produit);
                }
                existante.getItems().add(item);
            }
        }
        return commandeRepository.save(existante);
    }

    @Override
    public void supprimer(String email, Long id) {
        Commande commande = recupererParId(email, id);
        commandeRepository.delete(commande);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }
}