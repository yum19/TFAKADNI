package tn.esprit.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pregnancies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pregnancy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lmp_date", nullable = false)
    private LocalDate lmpDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    private PregnancyStatus status = PregnancyStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "pregnancy_type")
    private PregnancyType pregnancyType = PregnancyType.SINGLETON;

    @Column(name = "hospital_name")
    private String hospitalName;

    @Column(name = "doctor_name")
    private String doctorName;

    private String notes;

    @Column(name = "is_shared_partner")
    private Boolean isSharedPartner = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum PregnancyStatus {
        ACTIVE, COMPLETED, MISCARRIAGE, TERMINATED
    }

    public enum PregnancyType {
        SINGLETON, TWINS, TRIPLETS
    }

    @OneToMany(mappedBy = "pregnancy", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({"pregnancy"})
    private List<Vitals> vitals;

    @OneToMany(mappedBy = "pregnancy", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("recommendedWeek ASC")
    @Builder.Default
    @JsonIgnoreProperties({"pregnancy"})
    private List<PrenatalExam> prenatalExams = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    // @JsonIgnore
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "healthProfile", "sessions", "subscriptions", "invoices", "payments"})
    private User user;

    @OneToMany(mappedBy = "pregnancy")
    @Builder.Default
    @JsonIgnore
    private List<PartnerLink> partnerLinks = new ArrayList<>();

    @OneToMany(mappedBy = "pregnancy")
    @Builder.Default
    @JsonIgnore
    private List<PartnerNote> partnerNotes = new ArrayList<>();
}