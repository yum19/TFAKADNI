package tn.esprit.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import tn.esprit.backend.entity.base.AuditableEntity;
import tn.esprit.backend.enumtype.CourseLevel;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "courses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Course extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 150)
    private String titleAr;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(length = 60)
    private String category;

    @Min(1)
    private Integer durationMin;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private CourseLevel level;

    private String thumbnail;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval
            = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    @JsonManagedReference
    private List<CourseModule> modules = new ArrayList<>();
}
