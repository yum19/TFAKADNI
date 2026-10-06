package tn.esprit.backend.module6b.repository.analytics;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import tn.esprit.backend.module6b.entity.ContraceptionChatMessage;
import tn.esprit.backend.module6b.entity.ContraceptionLog;
import tn.esprit.backend.module6b.entity.ContraceptionProfile;

import java.util.List;

@Repository
public class ContraceptionAnalyticsRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public List<ContraceptionProfile> findAllProfiles() {
        return entityManager.createQuery("""
                SELECT p
                FROM ContraceptionProfile p
                JOIN FETCH p.mother m
                ORDER BY p.createdAt ASC
                """, ContraceptionProfile.class)
                .getResultList();
    }

    public List<ContraceptionLog> findAllLogs() {
        return entityManager.createQuery("""
                SELECT l
                FROM ContraceptionLog l
                JOIN FETCH l.mother m
                ORDER BY l.createdAt ASC
                """, ContraceptionLog.class)
                .getResultList();
    }

    public List<ContraceptionChatMessage> findAllChatMessages() {
        return entityManager.createQuery("""
                SELECT c
                FROM ContraceptionChatMessage c
                JOIN FETCH c.mother m
                ORDER BY c.createdAt ASC
                """, ContraceptionChatMessage.class)
                .getResultList();
    }
}