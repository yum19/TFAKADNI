package tn.esprit.backend.module6a.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.module6a.dto.BabyDashboardResponseDTO;
import tn.esprit.backend.module6a.entity.*;
import tn.esprit.backend.module6a.exception.BabyNotFoundException;
import tn.esprit.backend.module6a.repository.*;
import tn.esprit.backend.module6a.service.IDashboardService;
import tn.esprit.backend.repository.UserRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements IDashboardService {

    private final BabyRepository babyRepository;
    private final FeedingRepository feedingRepository;
    private final SleepLogRepository sleepLogRepository;
    private final DiaperLogRepository diaperLogRepository;
    private final TeethingLogRepository teethingLogRepository;
    private final GrowthRecordRepository growthRecordRepository;
    private final VaccineRepository vaccineRepository;
    private final BabyAppointmentRepository babyAppointmentRepository;
    private final BabyMilestoneRepository babyMilestoneRepository;
    private final BabyDocumentRepository babyDocumentRepository;
    private final ReminderRepository reminderRepository;
    private final BabyInsightRepository babyInsightRepository;
    private final UserRepository userRepository;

    @Override
    public BabyDashboardResponseDTO getDashboard(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        Baby baby = getOwnedBabyOrThrow(currentUser, babyId);

        Optional<Feeding> latestFeeding = feedingRepository.findFirstByBabyIdOrderByFeedingDateDescFeedingTimeDesc(babyId);
        Optional<SleepLog> latestSleep = sleepLogRepository.findFirstByBabyIdOrderBySleepStartDesc(babyId);
        Optional<DiaperLog> latestDiaper = diaperLogRepository.findFirstByBabyIdOrderByChangeTimeDesc(babyId);
        Optional<TeethingLog> latestTeething = teethingLogRepository.findFirstByBabyIdOrderByEruptionDateDescIdDesc(babyId);
        Optional<GrowthRecord> latestGrowth = growthRecordRepository.findFirstByBabyIdOrderByRecordDateDescIdDesc(babyId);
        Optional<BabyMilestone> latestMilestone = babyMilestoneRepository.findFirstByBabyIdOrderByMilestoneDateDescIdDesc(babyId);
        Optional<BabyDocument> latestDocument = babyDocumentRepository.findFirstByBabyIdOrderByUploadedAtDescIdDesc(babyId);

        Optional<Vaccine> upcomingVaccine = vaccineRepository.findByBabyIdOrderByScheduledDateAscIdAsc(babyId)
                .stream()
                .filter(v -> "SCHEDULED".equals(v.getStatus()))
                .filter(v -> !v.getScheduledDate().isBefore(LocalDate.now()))
                .findFirst();

        Optional<BabyAppointment> upcomingAppointment = babyAppointmentRepository
                .findByBabyIdAndAppointmentDateAfterOrderByAppointmentDateAscIdAsc(
                        babyId,
                        LocalDateTime.now()
                )
                .stream()
                .filter(a -> "PLANNED".equals(a.getStatus()))
                .findFirst();

        long pendingRemindersCount = reminderRepository.countByBabyIdAndStatus(babyId, "PENDING");
        long unreadInsightsCount = babyInsightRepository.countByBabyIdAndIsReadFalse(babyId);

        return BabyDashboardResponseDTO.builder()
                .babyId(baby.getId())
                .babyFirstName(baby.getFirstName())
                .babyLastName(baby.getLastName())
                .birthDate(baby.getBirthDate())
                .gender(baby.getGender())

                .latestFeedingDate(latestFeeding.map(Feeding::getFeedingDate).orElse(null))
                .latestFeedingTime(latestFeeding.map(f -> f.getFeedingTime() != null ? f.getFeedingTime().toString() : null).orElse(null))
                .latestFeedingMode(latestFeeding.map(Feeding::getFeedingMode).orElse(null))
                .latestFeedingQuantity(latestFeeding.map(Feeding::getQuantity).orElse(null))
                .latestFeedingDuration(latestFeeding.map(Feeding::getDuration).orElse(null))

                .latestSleepStart(latestSleep.map(SleepLog::getSleepStart).orElse(null))
                .latestSleepEnd(latestSleep.map(SleepLog::getSleepEnd).orElse(null))
                .latestSleepDuration(latestSleep.map(SleepLog::getDuration).orElse(null))
                .latestSleepQuality(latestSleep.map(SleepLog::getQuality).orElse(null))

                .latestDiaperChangeTime(latestDiaper.map(DiaperLog::getChangeTime).orElse(null))
                .latestDiaperType(latestDiaper.map(DiaperLog::getDiaperType).orElse(null))

                .latestToothLabel(latestTeething.map(TeethingLog::getToothLabel).orElse(null))
                .latestToothDate(latestTeething.map(TeethingLog::getEruptionDate).orElse(null))

                .latestGrowthDate(latestGrowth.map(GrowthRecord::getRecordDate).orElse(null))
                .latestWeight(latestGrowth.map(GrowthRecord::getWeight).orElse(null))
                .latestHeight(latestGrowth.map(GrowthRecord::getHeight).orElse(null))
                .latestHeadCircumference(latestGrowth.map(GrowthRecord::getHeadCircumference).orElse(null))
                .latestBmi(latestGrowth.map(GrowthRecord::getBmi).orElse(null))

                .upcomingVaccineName(upcomingVaccine.map(Vaccine::getVaccineName).orElse(null))
                .upcomingVaccineDate(upcomingVaccine.map(Vaccine::getScheduledDate).orElse(null))

                .upcomingAppointmentType(upcomingAppointment.map(BabyAppointment::getType).orElse(null))
                .upcomingAppointmentDate(upcomingAppointment.map(BabyAppointment::getAppointmentDate).orElse(null))
                .upcomingDoctorName(upcomingAppointment.map(BabyAppointment::getDoctorName).orElse(null))

                .latestMilestoneTitle(latestMilestone.map(BabyMilestone::getTitle).orElse(null))
                .latestMilestoneDate(latestMilestone.map(BabyMilestone::getMilestoneDate).orElse(null))
                .latestMilestoneCategory(latestMilestone.map(BabyMilestone::getCategory).orElse(null))

                .latestDocumentTitle(latestDocument.map(BabyDocument::getTitle).orElse(null))
                .latestDocumentType(latestDocument.map(BabyDocument::getDocumentType).orElse(null))
                .latestDocumentUploadedAt(latestDocument.map(BabyDocument::getUploadedAt).orElse(null))

                .pendingRemindersCount(pendingRemindersCount)
                .unreadInsightsCount(unreadInsightsCount)
                .build();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }

    private Baby getOwnedBabyOrThrow(User currentUser, Long babyId) {
        return babyRepository.findByIdAndMotherId(babyId, currentUser.getId())
                .orElseThrow(() -> new BabyNotFoundException("Bébé introuvable ou accès refusé"));
    }
}