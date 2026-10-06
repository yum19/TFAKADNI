// src/main/java/tn/esprit/backend/repositories/MessageReactionRepository.java
package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.backend.entity.Message;
import tn.esprit.backend.entity.MessageReaction;
import tn.esprit.backend.entity.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageReactionRepository extends JpaRepository<MessageReaction, Long> {

    Optional<MessageReaction> findByMessageAndUser(Message message, User user);

    List<MessageReaction> findByMessage(Message message);
}