package tn.esprit.backend.module6a.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.module6a.dto.TimelineEventResponseDTO;
import tn.esprit.backend.module6a.entity.*;
import tn.esprit.backend.module6a.exception.BabyNotFoundException;
import tn.esprit.backend.module6a.repository.*;
import tn.esprit.backend.module6a.service.IBabyTimelineService;
import tn.esprit.backend.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BabyTimelineServiceImpl implements IBabyTimelineService {

    private final BabyRepository babyRepository;
    private final FeedingRepository feedingRepository;
    private final SleepLogRepository sleepLogRepository;
    private final DiaperLogRepository diaperLogRepository;
    private final TeethingLogRepository teethingLogRepository;
    private final GrowthRecordRepository growthRecordRepository;
    private final VaccineRepository vaccineRepository;
    private final BabyAppointmentRepository babyAppointmentRepository;
    private final BabyMilestoneRepository babyMilestoneRepository;
    private final ReminderRepository reminderRepository;
    private final BabyInsightRepository babyInsightRepository;
    private final UserRepository userRepository;

    @Override
    public List<TimelineEventResponseDTO> getTimeline(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        List<TimelineEventResponseDTO> timeline = new ArrayList<>();

        timeline.addAll(mapFeedings(
                feedingRepository.findByBabyIdOrderByFeedingDateDescFeedingTimeDesc(babyId)
        ));
        timeline.addAll(mapSleepLogs(
                sleepLogRepository.findByBabyIdOrderBySleepStartDesc(babyId)
        ));
        timeline.addAll(mapDiaperLogs(
                diaperLogRepository.findByBabyIdOrderByChangeTimeDesc(babyId)
        ));
        timeline.addAll(mapTeethingLogs(
                teethingLogRepository.findByBabyIdOrderByEruptionDateDescIdDesc(babyId)
        ));
        timeline.addAll(mapGrowthRecords(
                growthRecordRepository.findByBabyIdOrderByRecordDateDescIdDesc(babyId)
        ));
        timeline.addAll(mapVaccines(
                vaccineRepository.findByBabyIdOrderByScheduledDateAscIdAsc(babyId)
        ));
        timeline.addAll(mapAppointments(
                babyAppointmentRepository.findByBabyIdOrderByAppointmentDateDescIdDesc(babyId)
        ));
        timeline.addAll(mapMilestones(
                babyMilestoneRepository.findByBabyIdOrderByMilestoneDateDescIdDesc(babyId)
        ));
        timeline.addAll(mapReminders(
                reminderRepository.findByBabyIdOrderByReminderDateDescIdDesc(babyId)
        ));
        timeline.addAll(mapInsights(
                babyInsightRepository.findByBabyIdOrderByGeneratedAtDescIdDesc(babyId)
        ));

        return timeline.stream()
                .sorted(Comparator.comparing(TimelineEventResponseDTO::getEventDateTime).reversed())
                .toList();
    }

    @Override
    public List<TimelineEventResponseDTO> getTimeline(String email, Long babyId, Integer days) {
        List<TimelineEventResponseDTO> fullTimeline = getTimeline(email, babyId);

        if (days == null || days <= 0) {
            return fullTimeline;
        }

        LocalDateTime threshold = LocalDateTime.now().minusDays(days);

        return fullTimeline.stream()
                .filter(event -> event.getEventDateTime() != null)
                .filter(event -> !event.getEventDateTime().isBefore(threshold))
                .toList();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }

    private List<TimelineEventResponseDTO> mapFeedings(List<Feeding> feedings) {
        return feedings.stream()
                .map(feeding -> TimelineEventResponseDTO.builder()
                        .eventType("FEEDING")
                        .sourceId(feeding.getId())
                        .eventDateTime(LocalDateTime.of(feeding.getFeedingDate(), feeding.getFeedingTime()))
                        .title("Repas - " + safe(feeding.getFeedingMode()))
                        .description(buildFeedingDescription(feeding))
                        .priority("NORMAL")
                        .status("RECORDED")
                        .actionUrl("/babies/" + feeding.getBaby().getId() + "/feedings/" + feeding.getId())
                        .build())
                .toList();
    }

    private List<TimelineEventResponseDTO> mapSleepLogs(List<SleepLog> sleepLogs) {
        return sleepLogs.stream()
                .map(log -> TimelineEventResponseDTO.builder()
                        .eventType("SLEEP")
                        .sourceId(log.getId())
                        .eventDateTime(log.getSleepStart())
                        .title("Sommeil")
                        .description(buildSleepDescription(log))
                        .priority(log.getDuration() != null && log.getDuration() < 60 ? "UNUSUAL" : "NORMAL")
                        .status("RECORDED")
                        .actionUrl("/babies/" + log.getBaby().getId() + "/sleep-logs/" + log.getId())
                        .build())
                .toList();
    }

    private List<TimelineEventResponseDTO> mapDiaperLogs(List<DiaperLog> diaperLogs) {
        return diaperLogs.stream()
                .map(log -> TimelineEventResponseDTO.builder()
                        .eventType("DIAPER")
                        .sourceId(log.getId())
                        .eventDateTime(log.getChangeTime())
                        .title("Change - " + safe(log.getDiaperType()))
                        .description(buildDiaperDescription(log))
                        .priority("NORMAL")
                        .status("RECORDED")
                        .actionUrl("/babies/" + log.getBaby().getId() + "/diapers/" + log.getId())
                        .build())
                .toList();
    }

    private List<TimelineEventResponseDTO> mapTeethingLogs(List<TeethingLog> teethingLogs) {
        return teethingLogs.stream()
                .map(log -> TimelineEventResponseDTO.builder()
                        .eventType("TEETHING")
                        .sourceId(log.getId())
                        .eventDateTime(log.getEruptionDate().atStartOfDay())
                        .title("Poussée dentaire - " + safe(log.getToothLabel()))
                        .description(buildTeethingDescription(log))
                        .priority("IMPORTANT")
                        .status("RECORDED")
                        .actionUrl("/babies/" + log.getBaby().getId() + "/teething/" + log.getId())
                        .build())
                .toList();
    }

    private List<TimelineEventResponseDTO> mapGrowthRecords(List<GrowthRecord> growthRecords) {
        return growthRecords.stream()
                .map(record -> TimelineEventResponseDTO.builder()
                        .eventType("GROWTH")
                        .sourceId(record.getId())
                        .eventDateTime(record.getRecordDate().atStartOfDay())
                        .title("Mesure de croissance")
                        .description(buildGrowthDescription(record))
                        .priority("TREND_LINKED")
                        .status("RECORDED")
                        .actionUrl("/babies/" + record.getBaby().getId() + "/growth-records/" + record.getId())
                        .build())
                .toList();
    }

    private List<TimelineEventResponseDTO> mapVaccines(List<Vaccine> vaccines) {
        return vaccines.stream()
                .map(vaccine -> {
                    LocalDateTime eventDateTime = vaccine.getTakenDate() != null
                            ? vaccine.getTakenDate().atStartOfDay()
                            : vaccine.getScheduledDate().atStartOfDay();

                    String status = vaccine.getStatus() != null ? vaccine.getStatus() : "UNKNOWN";
                    String priority = ("MISSED".equals(status) || "CANCELLED".equals(status)) ? "IMPORTANT" : "NORMAL";

                    return TimelineEventResponseDTO.builder()
                            .eventType("VACCINE")
                            .sourceId(vaccine.getId())
                            .eventDateTime(eventDateTime)
                            .title("Vaccin - " + safe(vaccine.getVaccineName()))
                            .description(buildVaccineDescription(vaccine))
                            .priority(priority)
                            .status(status)
                            .actionUrl("/babies/" + vaccine.getBaby().getId() + "/vaccines/" + vaccine.getId())
                            .build();
                })
                .toList();
    }

    private List<TimelineEventResponseDTO> mapAppointments(List<BabyAppointment> appointments) {
        return appointments.stream()
                .map(appointment -> TimelineEventResponseDTO.builder()
                        .eventType("APPOINTMENT")
                        .sourceId(appointment.getId())
                        .eventDateTime(appointment.getAppointmentDate())
                        .title("Rendez-vous - " + safe(appointment.getType()))
                        .description(buildAppointmentDescription(appointment))
                        .priority("PLANNED".equals(appointment.getStatus()) ? "IMPORTANT" : "NORMAL")
                        .status(appointment.getStatus())
                        .actionUrl("/babies/" + appointment.getBaby().getId() + "/appointments/" + appointment.getId())
                        .build())
                .toList();
    }

    private List<TimelineEventResponseDTO> mapMilestones(List<BabyMilestone> milestones) {
        return milestones.stream()
                .map(milestone -> TimelineEventResponseDTO.builder()
                        .eventType("MILESTONE")
                        .sourceId(milestone.getId())
                        .eventDateTime(milestone.getMilestoneDate().atStartOfDay())
                        .title("Milestone - " + safe(milestone.getTitle()))
                        .description(buildMilestoneDescription(milestone))
                        .priority("IMPORTANT")
                        .status("RECORDED")
                        .actionUrl("/babies/" + milestone.getBaby().getId() + "/milestones/" + milestone.getId())
                        .build())
                .toList();
    }

    private List<TimelineEventResponseDTO> mapReminders(List<Reminder> reminders) {
        return reminders.stream()
                .map(reminder -> TimelineEventResponseDTO.builder()
                        .eventType("REMINDER")
                        .sourceId(reminder.getId())
                        .eventDateTime(reminder.getReminderDate())
                        .title("Rappel - " + safe(reminder.getType()))
                        .description(buildReminderDescription(reminder))
                        .priority("PENDING".equals(reminder.getStatus()) ? "IMPORTANT" : "NORMAL")
                        .status(reminder.getStatus())
                        .actionUrl("/babies/" + reminder.getBaby().getId() + "/reminders/" + reminder.getId())
                        .build())
                .toList();
    }

    private List<TimelineEventResponseDTO> mapInsights(List<BabyInsight> insights) {
        return insights.stream()
                .map(insight -> TimelineEventResponseDTO.builder()
                        .eventType("INSIGHT")
                        .sourceId(insight.getId())
                        .eventDateTime(insight.getGeneratedAt())
                        .title(safe(insight.getTitle()))
                        .description(safe(insight.getMessage()))
                        .priority(insight.getPriority() != null ? insight.getPriority() : "NORMAL")
                        .status(insight.getStatus())
                        .actionUrl(insight.getActionUrl())
                        .build())
                .toList();
    }

    private String buildFeedingDescription(Feeding feeding) {
        return "Mode: " + safe(feeding.getFeedingMode())
                + ", quantité: " + safe(feeding.getQuantity())
                + ", durée: " + safe(feeding.getDuration());
    }

    private String buildSleepDescription(SleepLog log) {
        return "Début: " + safe(log.getSleepStart())
                + ", fin: " + safe(log.getSleepEnd())
                + ", durée: " + safe(log.getDuration())
                + ", qualité: " + safe(log.getQuality());
    }

    private String buildDiaperDescription(DiaperLog log) {
        return "Type: " + safe(log.getDiaperType())
                + ", couleur: " + safe(log.getColor())
                + ", consistance: " + safe(log.getConsistency());
    }

    private String buildTeethingDescription(TeethingLog log) {
        return "Dent: " + safe(log.getToothLabel())
                + ", symptômes: " + safe(log.getSymptoms());
    }

    private String buildGrowthDescription(GrowthRecord record) {
        return "Poids: " + safe(record.getWeight())
                + ", taille: " + safe(record.getHeight())
                + ", PC: " + safe(record.getHeadCircumference())
                + ", BMI: " + safe(record.getBmi());
    }

    private String buildVaccineDescription(Vaccine vaccine) {
        return "Vaccin: " + safe(vaccine.getVaccineName())
                + ", date prévue: " + safe(vaccine.getScheduledDate())
                + ", date prise: " + safe(vaccine.getTakenDate());
    }

    private String buildAppointmentDescription(BabyAppointment appointment) {
        return "Docteur: " + safe(appointment.getDoctorName())
                + ", lieu: " + safe(appointment.getLocation());
    }

    private String buildMilestoneDescription(BabyMilestone milestone) {
        return "Catégorie: " + safe(milestone.getCategory())
                + ", description: " + safe(milestone.getDescription());
    }

    private String buildReminderDescription(Reminder reminder) {
        return "Message: " + safe(reminder.getMessage())
                + ", source: " + safe(reminder.getSourceType());
    }

    private String safe(Object value) {
        return value == null ? "N/A" : value.toString();
    }

    private Baby getOwnedBabyOrThrow(User currentUser, Long babyId) {
        return babyRepository.findByIdAndMotherId(babyId, currentUser.getId())
                .orElseThrow(() -> new BabyNotFoundException("Bébé introuvable ou accès refusé"));    }
}