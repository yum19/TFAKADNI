package tn.esprit.backend.repository;

import tn.esprit.backend.entity.Pregnancy;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PregnancyRepository
        extends JpaRepository<Pregnancy, Long> {

    List<Pregnancy> findByUserId(Long userId);

    Pregnancy findByUserIdAndStatus(
            Long userId,
            Pregnancy.PregnancyStatus status
    );
    List<Pregnancy> findByStatus(Pregnancy.PregnancyStatus status);

}