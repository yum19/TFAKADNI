package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.backend.entity.PartnerLink;
import tn.esprit.backend.enumtype.PartnerLinkStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface PartnerLinkRepository extends JpaRepository<PartnerLink, Long> {

    Optional<PartnerLink> findByMotherIdAndPartnerIdAndPregnancyId(Long motherId, Long partnerId, Long pregnancyId);

    Optional<PartnerLink> findByPregnancyIdAndStatus(Long pregnancyId, PartnerLinkStatus status);

    List<PartnerLink> findByPartnerIdOrderByCreatedAtDesc(Long partnerId);

    List<PartnerLink> findByPartnerIdAndStatusOrderByCreatedAtDesc(Long partnerId, PartnerLinkStatus status);

    List<PartnerLink> findByMotherIdOrderByCreatedAtDesc(Long motherId);

    boolean existsByPregnancyIdAndStatus(Long pregnancyId, PartnerLinkStatus status);

}

