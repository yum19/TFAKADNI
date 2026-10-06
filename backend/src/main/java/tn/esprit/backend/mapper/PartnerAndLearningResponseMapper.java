package tn.esprit.backend.mapper;

import tn.esprit.backend.dto.response.EnrollmentResponse;
import tn.esprit.backend.dto.response.PartnerNoteResponse;
import tn.esprit.backend.dto.response.PartnerNotificationResponse;
import tn.esprit.backend.dto.response.QuizAttemptResponse;
import tn.esprit.backend.entity.Enrollment;
import tn.esprit.backend.entity.PartnerNote;
import tn.esprit.backend.entity.PartnerNotification;
import tn.esprit.backend.entity.QuizAttempt;

public class PartnerAndLearningResponseMapper {

    private PartnerAndLearningResponseMapper()
    {

    }

    public static PartnerNotificationResponse toNotificationResponse(PartnerNotification notification) {
        return PartnerNotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType() != null ? notification.getType().name() : null)
                .title(notification.getTitle())
                .body(notification.getBody())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }

    public static PartnerNoteResponse toPartnerNoteResponse(PartnerNote note) {
        return PartnerNoteResponse.builder()
                .id(note.getId())
                .content(note.getContent())
                .isRead(note.getIsRead())
                .authorId(note.getAuthor() != null ? note.getAuthor().getId() : null)
                .authorName(note.getAuthor() != null ? note.getAuthor().getFirstName() + " " + note.getAuthor().getLastName() : null)
                .recipientId(note.getRecipient() != null ? note.getRecipient().getId() : null)
                .pregnancyId(note.getPregnancy() != null ? note.getPregnancy().getId() : null)
                .createdAt(note.getCreatedAt())
                .build();
    }

    public static EnrollmentResponse toEnrollmentResponse(Enrollment enrollment) {
        return EnrollmentResponse.builder()
                .id(enrollment.getId())
                .userId(enrollment.getUser() != null ? enrollment.getUser().getId() : null)
                .courseId(enrollment.getCourse() != null ? enrollment.getCourse().getId() : null)
                .courseTitle(enrollment.getCourse() != null ? enrollment.getCourse().getTitle() : null)
                .progressPct(enrollment.getProgressPct())
                .status(enrollment.getStatus() != null ? enrollment.getStatus().name() : null)
                .startedAt(enrollment.getStartedAt())
                .completedAt(enrollment.getCompletedAt())
                .build();
    }

    public static QuizAttemptResponse toQuizResultResponse(QuizAttempt result)
    {
        return QuizAttemptResponse.builder()
                .id(result.getId())
                .quizId(result.getQuiz() != null ? result.getQuiz().getId() : null)
                .score(result.getScore())
                .passed(result.getPassed())
                .takenAt(result.getTakenAt())
                .build();
    }

}
