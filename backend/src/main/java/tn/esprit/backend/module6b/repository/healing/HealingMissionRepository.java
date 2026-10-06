package tn.esprit.backend.module6b.repository.healing;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.module6b.entity.healing.HealingMission;
import tn.esprit.backend.module6b.entity.healing.MissionType;

import java.util.List;

public interface HealingMissionRepository extends JpaRepository<HealingMission, Long> {
    List<HealingMission> findByActiveTrueOrderByCreatedAtDesc();
    List<HealingMission> findByActiveTrueAndMissionTypeOrderByCreatedAtDesc(MissionType missionType);
}