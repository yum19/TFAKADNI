package tn.esprit.backend.module6b.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import tn.esprit.backend.module6b.entity.healing.*;
import tn.esprit.backend.module6b.repository.healing.HealingBadgeRepository;
import tn.esprit.backend.module6b.repository.healing.HealingMissionRepository;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class HealingMissionDataInitializer implements CommandLineRunner {

    private final HealingMissionRepository healingMissionRepository;
    private final HealingBadgeRepository healingBadgeRepository;

    @Override
    public void run(String... args) {
        if (healingMissionRepository.count() == 0) {
            healingMissionRepository.saveAll(List.of(
                    HealingMission.builder()
                            .title("Breathing reset")
                            .description("Take one gentle minute to breathe slowly and calm your body.")
                            .missionType(MissionType.BREATHING)
                            .difficulty(MissionDifficulty.SOFT)
                            .pointsReward(15)
                            .durationSeconds(60)
                            .mediaUrl(null)
                            .thumbnailUrl(null)
                            .active(true)
                            .recommendedForRiskLevel("HIGH")
                            .recommendedForEmotion("ANXIOUS")
                            .createdAt(LocalDateTime.now())
                            .build(),

                    HealingMission.builder()
                            .title("Voice comfort")
                            .description("Read one kind sentence to yourself or hum softly for a few seconds.")
                            .missionType(MissionType.VOICE_COMFORT)
                            .difficulty(MissionDifficulty.EASY)
                            .pointsReward(20)
                            .durationSeconds(45)
                            .mediaUrl(null)
                            .thumbnailUrl(null)
                            .active(true)
                            .recommendedForRiskLevel("MODERATE")
                            .recommendedForEmotion("SAD")
                            .createdAt(LocalDateTime.now())
                            .build(),

                    HealingMission.builder()
                            .title("Gratitude flash")
                            .description("Write one small thing that helped you today.")
                            .missionType(MissionType.GRATITUDE)
                            .difficulty(MissionDifficulty.SOFT)
                            .pointsReward(10)
                            .durationSeconds(40)
                            .mediaUrl(null)
                            .thumbnailUrl(null)
                            .active(true)
                            .recommendedForRiskLevel("LOW")
                            .recommendedForEmotion("TIRED")
                            .createdAt(LocalDateTime.now())
                            .build(),

                    HealingMission.builder()
                            .title("Calm audio moment")
                            .description("Listen to a short calming reflection and let yourself pause.")
                            .missionType(MissionType.CALM_AUDIO)
                            .difficulty(MissionDifficulty.SOFT)
                            .pointsReward(12)
                            .durationSeconds(90)
                            .mediaUrl(null)
                            .thumbnailUrl(null)
                            .active(true)
                            .recommendedForRiskLevel("HIGH")
                            .recommendedForEmotion("ANXIOUS")
                            .createdAt(LocalDateTime.now())
                            .build(),

                    HealingMission.builder()
                            .title("Gentle movement")
                            .description("Relax your shoulders and stretch gently for one minute.")
                            .missionType(MissionType.GENTLE_MOVEMENT)
                            .difficulty(MissionDifficulty.EASY)
                            .pointsReward(18)
                            .durationSeconds(60)
                            .mediaUrl(null)
                            .thumbnailUrl(null)
                            .active(true)
                            .recommendedForRiskLevel("MODERATE")
                            .recommendedForEmotion("FATIGUED")
                            .createdAt(LocalDateTime.now())
                            .build()
            ));
        }

        if (healingBadgeRepository.count() == 0) {
            healingBadgeRepository.saveAll(List.of(
                    HealingBadge.builder().name("First Step").description("Complete your first healing mission").icon("🌱").badgeType(BadgeType.FIRST_STEP).conditionValue(1).active(true).build(),
                    HealingBadge.builder().name("Calm Breath").description("Complete 3 breathing missions").icon("🌬️").badgeType(BadgeType.BREATHING_MASTER).conditionValue(3).active(true).build(),
                    HealingBadge.builder().name("Gratitude Spark").description("Complete 5 gratitude missions").icon("💖").badgeType(BadgeType.GRATITUDE_SPARK).conditionValue(5).active(true).build(),
                    HealingBadge.builder().name("Gentle Voice").description("Complete 3 voice comfort missions").icon("🎤").badgeType(BadgeType.VOICE_GENTLE).conditionValue(3).active(true).build(),
                    HealingBadge.builder().name("Healing Streak").description("Maintain a 3-day streak").icon("🔥").badgeType(BadgeType.HEALING_STREAK).conditionValue(3).active(true).build(),
                    HealingBadge.builder().name("Self Care Bloom").description("Complete 10 healing missions").icon("🌸").badgeType(BadgeType.SELF_CARE_BLOOM).conditionValue(10).active(true).build()
            ));
        }
    }
}