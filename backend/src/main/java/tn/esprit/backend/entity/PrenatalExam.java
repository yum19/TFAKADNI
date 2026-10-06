package tn.esprit.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "prenatal_exams")
@Data
public class PrenatalExam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "pregnancy_id", nullable = false)
    private Pregnancy pregnancy;

    @Column(name = "exam_name", nullable = false)
    private String examName;

    @Enumerated(EnumType.STRING)
    @Column(name = "exam_type")
    private ExamType examType = ExamType.MANDATORY;

    @Column(name = "recommended_week")
    private Integer recommendedWeek;

    private Boolean done = false;

    @Column(name = "done_date")
    private LocalDate doneDate;

    @Column(name = "result_notes")
    private String resultNotes;

    @Column(name = "document_url")
    private String documentUrl;

    @Column(name = "reminder_sent")
    private Boolean reminderSent = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // ── LIEN VITAL → EXAM (alert-triggered) ── ← AJOUTÉ
    @ManyToOne
    @JoinColumn(name = "vital_id")
    @JsonIgnore
    private Vitals vital;

    // ── SÉVÉRITÉ DE L'ALERTE QUI A DÉCLENCHÉ CET EXAM ── ← AJOUTÉ
    @Column(name = "alert_severity")
    private String alertSeverity;

    public enum ExamType {
        MANDATORY, OPTIONAL, CUSTOM
    }
}