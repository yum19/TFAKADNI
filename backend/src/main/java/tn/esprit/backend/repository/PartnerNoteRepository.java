package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.backend.entity.PartnerNote;

import java.util.List;

@Repository
public interface PartnerNoteRepository extends JpaRepository<PartnerNote, Long> {

    List<PartnerNote> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    List<PartnerNote> findByPregnancyIdOrderByCreatedAtDesc(Long pregnancyId);

    Long countByRecipientIdAndIsReadFalse(Long recipientId);

}
