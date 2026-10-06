package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.entity.FaceIdData;
import java.util.Optional;

public interface FaceIdRepository extends JpaRepository<FaceIdData, Long> {
    Optional<FaceIdData> findByUserId(Long userId);
}