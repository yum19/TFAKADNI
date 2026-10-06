package tn.esprit.backend.module6a.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.module6a.entity.BabyDocument;

import java.util.List;
import java.util.Optional;

public interface BabyDocumentRepository extends JpaRepository<BabyDocument, Long> {

    List<BabyDocument> findByBabyIdOrderByUploadedAtDescIdDesc(Long babyId);

    Optional<BabyDocument> findByIdAndBabyId(Long id, Long babyId);

    Optional<BabyDocument> findFirstByBabyIdOrderByUploadedAtDescIdDesc(Long babyId);

    List<BabyDocument> findByBabyIdAndDocumentTypeOrderByUploadedAtDescIdDesc(Long babyId, String documentType);
}