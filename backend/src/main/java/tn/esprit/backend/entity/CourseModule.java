package tn.esprit.backend.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "course_modules")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CourseModule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 30)
    private String contentType;

    private String contentUrl;

    @Column(columnDefinition = "TEXT")
    private String contentText;

    @Min(1)
    private Integer orderIndex;

    @Min(1)
    private Integer durationMin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    @JsonBackReference
    private Course course;

    @OneToOne(mappedBy = "courseModule", cascade = CascadeType.ALL,
            orphanRemoval = true)
    @JsonManagedReference(value = "module-quiz")
    private Quiz quiz;


}
