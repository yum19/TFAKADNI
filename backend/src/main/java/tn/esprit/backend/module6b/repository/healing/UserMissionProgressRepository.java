package tn.esprit.backend.module6b.repository.healing;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.module6b.entity.healing.MissionStatus;
import tn.esprit.backend.module6b.entity.healing.UserMissionProgress;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface UserMissionProgressRepository extends JpaRepository<UserMissionProgress, Long> {

    List<UserMissionProgress> findByMotherIdOrderByStartedAtDesc(Long motherId);

    List<UserMissionProgress> findByMotherIdAndCompletedDateOrderByCompletedAtDesc(Long motherId, LocalDate completedDate);

    Optional<UserMissionProgress> findTopByMotherIdAndMissionIdOrderByStartedAtDesc(Long motherId, Long missionId);

    long countByMotherIdAndStatus(Long motherId, MissionStatus status);

    long countByMotherIdAndMission_MissionTypeAndStatus(Long motherId, tn.esprit.backend.module6b.entity.healing.MissionType missionType, MissionStatus status);

    boolean existsByMotherIdAndMissionIdAndCompletedDate(Long motherId, Long missionId, LocalDate completedDate);
    boolean existsByMotherIdAndMissionIdAndStatus(Long motherId, Long missionId, MissionStatus status);
    Optional<UserMissionProgress> findTopByMotherIdAndMissionIdOrderByCompletedAtDesc(Long motherId, Long missionId);

}