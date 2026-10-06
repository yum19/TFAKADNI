package tn.esprit.backend.dto;

import lombok.*;
import tn.esprit.backend.entity.Post;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SavedPostResponseDTO {

    private Long savedPostId;
    private LocalDateTime savedAt;

    // ── embedded post fields ──────────────────────────────────────────
    private Long postId;
    private String contenu;
    private String tag;
    private Boolean anonyme;
    private Integer likes;
    private LocalDateTime postDate;
    private List<String> images;
    private int commentCount;

    // ── author info (respects anonyme flag) ──────────────────────────
    private String authorName;
    private String authorEmail;
    private Long authorId;

    public static SavedPostResponseDTO from(tn.esprit.backend.entity.SavedPost sp) {
        Post p = sp.getPost();
        boolean anon = Boolean.TRUE.equals(p.getAnonyme());

        return SavedPostResponseDTO.builder()
                .savedPostId(sp.getId())
                .savedAt(sp.getSavedAt())
                .postId(p.getId())
                .contenu(p.getContenu())
                .tag(p.getTag())
                .anonyme(p.getAnonyme())
                .likes(p.getLikes())
                .postDate(p.getDate())
                .images(p.getImages())
                .commentCount(p.getCommentaires() != null ? p.getCommentaires().size() : 0)
                .authorName(anon ? "Anonymous Member" : (p.getUser().getFirstName() + " " + p.getUser().getLastName()))
                .authorEmail(anon ? null : p.getUser().getEmail())
                .authorId(anon ? null : p.getUser().getId())
                .build();
    }
}