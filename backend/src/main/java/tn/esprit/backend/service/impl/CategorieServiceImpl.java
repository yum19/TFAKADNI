package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.backend.entity.Categorie;
import tn.esprit.backend.repository.CategorieRepository;
import tn.esprit.backend.service.CategorieService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategorieServiceImpl implements CategorieService {

    private final CategorieRepository categorieRepository;

    @Override
    public Categorie creer(Categorie categorie) {
        if (categorie.getParent() != null && categorie.getParent().getId() != null) {
            Categorie parent = categorieRepository.findById(categorie.getParent().getId())
                    .orElseThrow(() -> new RuntimeException("Parent catégorie non trouvée"));
            categorie.setParent(parent);
        }
        return categorieRepository.save(categorie);
    }

    @Override
    public List<Categorie> recupererTout() {
        return categorieRepository.findAll();
    }

    @Override
    public Categorie recupererParId(Long id) {
        return categorieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Catégorie non trouvée avec l'id : " + id));
    }

    @Override
    public Categorie mettreAJour(Long id, Categorie categorie) {
        Categorie existant = recupererParId(id);
        existant.setNom(categorie.getNom());
        existant.setParent(categorie.getParent());
        return categorieRepository.save(existant);
    }

    @Override
    public void supprimer(Long id) {
        categorieRepository.deleteById(id);
    }
}