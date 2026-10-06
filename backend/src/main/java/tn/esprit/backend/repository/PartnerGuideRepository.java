package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.backend.entity.PartnerGuide;

import java.util.List;

@Repository
public interface PartnerGuideRepository extends JpaRepository<PartnerGuide, Long> {

    List<PartnerGuide> findByTargetWeekLessThanEqualOrderByTargetWeekDesc(Integer week);

    List<PartnerGuide> findByCategoryIgnoreCaseOrderByTargetWeekAsc(String category);

    List<PartnerGuide> findByTitleContainingIgnoreCaseOrderByPublishedAtDesc(String keyword);

}
