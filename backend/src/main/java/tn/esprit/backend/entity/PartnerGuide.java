package tn.esprit.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import tn.esprit.backend.entity.base.AuditableEntity;

import java.time.LocalDateTime;

@Entity
@Table(name = "partner_guides")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PartnerGuide extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 150)
    private String titleAr;

    @NotBlank
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Min(1)
    @Max(45)
    private Integer targetWeek;

    @Column(length = 60)
    private String category;

    private LocalDateTime publishedAt;

}
