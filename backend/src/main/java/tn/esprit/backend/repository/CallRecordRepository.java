// src/main/java/tn/esprit/backend/repositories/CallRecordRepository.java
package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tn.esprit.backend.entity.CallRecord;

import java.util.List;
import java.util.Optional;

@Repository
public interface CallRecordRepository extends JpaRepository<CallRecord, Long> {

    Optional<CallRecord> findByCallId(String callId);

    /** All calls between two users, newest first */
    @Query("""
        SELECT c FROM CallRecord c
        WHERE (c.caller.id = :a AND c.callee.id = :b)
           OR (c.caller.id = :b AND c.callee.id = :a)
        ORDER BY c.startedAt DESC
    """)
    List<CallRecord> findHistory(@Param("a") Long a, @Param("b") Long b);
}