package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.entity.Categorie;

public interface CategorieRepository extends JpaRepository<Categorie, Long> {
}
