package tn.esprit.backend.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "commentaires")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Commentaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "sessions", "subscriptions", "invoices", "payments", "healthProfile"})
    private User user;

    @Column(columnDefinition = "TEXT")
    private String contenu;

    private Boolean anonyme = false;
    private LocalDateTime date;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties("commentaires")
    @JsonBackReference("post-comments")
    @JoinColumn(name = "post_id")
    private Post post;

    @OneToMany(mappedBy = "commentaire", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<CommentReaction> reactions = new ArrayList<>();

    public List<CommentReaction> getReactions() {
        if (reactions == null) reactions = new ArrayList<>();
        return reactions;
    }
}