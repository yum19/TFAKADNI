package tn.esprit.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "comment_reactions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"commentaire_id", "user_id"})
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CommentReaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReactionType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "sessions", "subscriptions", "invoices", "payments", "healthProfile"})
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commentaire_id", nullable = false)
    @JsonIgnoreProperties({"reactions", "post", "hibernateLazyInitializer"})
    private Commentaire commentaire;
}