package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.entity.PartnerPermission;
import tn.esprit.backend.enumtype.PartnerPermissionType;

import java.util.List;
import java.util.Optional;

public interface PartnerPermissionRepository extends JpaRepository<PartnerPermission, Long> {

    List<PartnerPermission> findByPartnerLinkId(Long partnerLinkId);

    Optional<PartnerPermission> findByPartnerLinkIdAndPermissionType(Long partnerLinkId, PartnerPermissionType permissionType);

    boolean existsByPartnerLinkIdAndPermissionTypeAndAllowedTrue(Long partnerLinkId, PartnerPermissionType permissionType);
}
