package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.esprit.backend.entity.Space;

import java.util.List;

public interface SpaceRepository extends JpaRepository<Space, Long> {

    List<Space> findByStatusOrderByScheduledAtAsc(Space.SpaceStatus status);

    List<Space> findByHostEmailOrderByCreatedAtDesc(String hostEmail);

    @Query("SELECT s FROM Space s WHERE s.status IN ('SCHEDULED','LIVE') " +
            "AND (s.audience = 'EVERYONE' OR s.hostId IN :followingIds) " +
            "ORDER BY s.scheduledAt ASC")
    List<Space> findAccessibleSpaces(@Param("followingIds") List<Long> followingIds);

    @Query("SELECT s FROM Space s WHERE s.status IN ('SCHEDULED','LIVE') " +
            "AND s.audience = 'EVERYONE' ORDER BY s.scheduledAt ASC")
    List<Space> findPublicSpaces();
}