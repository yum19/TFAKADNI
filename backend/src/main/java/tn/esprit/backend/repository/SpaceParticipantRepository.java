package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.entity.SpaceParticipant;

import java.util.List;
import java.util.Optional;

public interface SpaceParticipantRepository extends JpaRepository<SpaceParticipant, Long> {

    List<SpaceParticipant> findBySpaceIdAndLeftAtIsNull(Long spaceId);

    Optional<SpaceParticipant> findBySpaceIdAndUserIdAndLeftAtIsNull(Long spaceId, Long userId);

    boolean existsBySpaceIdAndUserIdAndLeftAtIsNull(Long spaceId, Long userId);

    long countBySpaceIdAndRoleAndLeftAtIsNull(Long spaceId, SpaceParticipant.ParticipantRole role);
}