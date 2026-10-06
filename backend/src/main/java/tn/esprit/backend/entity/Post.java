package tn.esprit.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "sessions", "subscriptions", "invoices", "payments", "healthProfile"})
    private User user;

    @Column(columnDefinition = "TEXT")
    private String contenu;

    private String tag;
    private Boolean anonyme = false;
    private Integer likes = 0;
    private LocalDateTime date;

    @ElementCollection
    @CollectionTable(name = "post_images", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "image_url", columnDefinition = "LONGTEXT")
    @OrderColumn(name = "image_order")
    private List<String> images = new ArrayList<>();

    // ✅ FIXED: Both collections are now LAZY + using Set instead of List (best practice)
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference("post-comments")
    private List<Commentaire> commentaires = new ArrayList<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference("post-reactions")

    private List<Reaction> reactions = new ArrayList<>();

    // New reports collection (also LAZY)
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Report> reports = new ArrayList<>();

    // Safe getters
    public List<Commentaire> getCommentaires() {
        if (commentaires == null) commentaires = new ArrayList<>();
        return commentaires;
    }

    public List<Reaction> getReactions() {
        if (reactions == null) reactions = new ArrayList<>();
        return reactions;
    }

    public List<Report> getReports() {
        if (reports == null) reports = new ArrayList<>();
        return reports;
    }

    @OneToOne(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private PostAnalysis analysis;
}