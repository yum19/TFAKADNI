package tn.esprit.backend.module6b.repository;

import tn.esprit.backend.module6b.entity.ContraceptionChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ContraceptionChatMessageRepository
        extends JpaRepository<ContraceptionChatMessage, Long> {

    List<ContraceptionChatMessage> findByMotherIdAndSessionIdOrderByCreatedAtAsc(
            Long motherId, String sessionId);

    List<ContraceptionChatMessage> findByMotherIdOrderByCreatedAtAsc(Long motherId);
}