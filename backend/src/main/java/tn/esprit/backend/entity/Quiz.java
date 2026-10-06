package tn.esprit.backend.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quizzes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /* @Column(nullable = false, columnDefinition = "TEXT")
    private String questionsJson; */

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("questionOrder ASC")
    @JsonManagedReference(value = "quiz-question")
    @Builder.Default
    private List<Question> questions = new ArrayList<>();

    @Min(0)
    @Max(100)
    @Column(nullable = false)
    private Integer passScore;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_module_id", unique = true, nullable = false)
    @JsonBackReference(value = "module-quiz")
    private CourseModule courseModule;

}
