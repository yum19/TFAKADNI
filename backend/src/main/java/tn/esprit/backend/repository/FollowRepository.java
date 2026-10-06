package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.esprit.backend.entity.Follow;
import tn.esprit.backend.entity.User;

import java.util.List;
import java.util.Optional;

public interface FollowRepository extends JpaRepository<Follow, Long> {

    Optional<Follow> findByFollowerAndFollowing(User follower, User following);

    boolean existsByFollowerAndFollowing(User follower, User following);

    List<Follow> findByFollower(User follower);

    List<Follow> findByFollowing(User following);

    @Query("SELECT f.following FROM Follow f WHERE f.follower = :user ORDER BY f.createdAt DESC")
    List<User> findFollowingUsers(@Param("user") User user);

    @Query("SELECT f.follower FROM Follow f WHERE f.following = :user ORDER BY f.createdAt DESC")
    List<User> findFollowerUsers(@Param("user") User user);

    long countByFollower(User follower);

    long countByFollowing(User following);

    // Get follower IDs (used for notifications)
    @Query("SELECT f.follower.id FROM Follow f WHERE f.following.id = :followedId")
    List<Long> findFollowerIdsByFollowedId(@Param("followedId") Long followedId);

    // Get full follower User entities (if needed)
    @Query("SELECT f.follower FROM Follow f WHERE f.following.id = :followedId")
    List<User> findFollowersByFollowedId(@Param("followedId") Long followedId);
}