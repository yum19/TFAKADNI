package tn.esprit.backend.module6a.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BabyDashboardResponseDTO {

    // Baby basic info
    private Long babyId;
    private String babyFirstName;
    private String babyLastName;
    private LocalDate birthDate;
    private String gender;

    // Latest feeding
    private LocalDate latestFeedingDate;
    private String latestFeedingTime;
    private String latestFeedingMode;
    private Double latestFeedingQuantity;
    private Integer latestFeedingDuration;

    // Latest sleep
    private LocalDateTime latestSleepStart;
    private LocalDateTime latestSleepEnd;
    private Integer latestSleepDuration;
    private String latestSleepQuality;

    // Latest diaper
    private LocalDateTime latestDiaperChangeTime;
    private String latestDiaperType;

    // Latest teething
    private String latestToothLabel;
    private LocalDate latestToothDate;

    // Latest growth
    private LocalDate latestGrowthDate;
    private Double latestWeight;
    private Double latestHeight;
    private Double latestHeadCircumference;
    private Double latestBmi;

    // Upcoming vaccine
    private String upcomingVaccineName;
    private LocalDate upcomingVaccineDate;

    // Upcoming appointment
    private String upcomingAppointmentType;
    private LocalDateTime upcomingAppointmentDate;
    private String upcomingDoctorName;

    // Latest milestone
    private String latestMilestoneTitle;
    private LocalDate latestMilestoneDate;
    private String latestMilestoneCategory;

    // Latest document
    private String latestDocumentTitle;
    private String latestDocumentType;
    private LocalDateTime latestDocumentUploadedAt;

    // Reminders / insights
    private Long pendingRemindersCount;
    private Long unreadInsightsCount;
}