package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.entity.SavedPost;

import java.util.List;
import java.util.Optional;

public interface SavedPostRepository extends JpaRepository<SavedPost, Long> {

    Optional<SavedPost> findByUserIdAndPostId(Long userId, Long postId);

    boolean existsByUserIdAndPostId(Long userId, Long postId);

    // ✅ BEST SOLUTION: Use EntityGraph (cleanest and safest)
    @EntityGraph(attributePaths = {"post", "post.user"})
    List<SavedPost> findByUserIdOrderBySavedAtDesc(Long userId);

    // Alternative if you prefer @Query (still safe):
    // @Query("SELECT sp FROM SavedPost sp JOIN FETCH sp.post p JOIN FETCH p.user WHERE sp.user.id = :userId ORDER BY sp.savedAt DESC")
    // List<SavedPost> findByUserIdOrderBySavedAtDesc(@Param("userId") Long userId);

    long countByUserId(Long userId);

    void deleteByUserIdAndPostId(Long userId, Long postId);
}