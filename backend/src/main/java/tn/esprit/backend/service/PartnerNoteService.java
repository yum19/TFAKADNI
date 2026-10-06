package tn.esprit.backend.service;

import tn.esprit.backend.dto.request.PartnerNoteRequest;
import tn.esprit.backend.entity.PartnerNote;

import java.util.List;

public interface PartnerNoteService {
    PartnerNote createNote(PartnerNoteRequest request);
    List<PartnerNote> getNotesByPregnancy(Long pregnancyId, Long currentUserId);
    List<PartnerNote> getInbox(Long recipientId);
    Long countUnread(Long recipientId);
    PartnerNote markAsRead(Long noteId, Long currentUserId);
    void deleteNote(Long noteId, Long currentUserId);
}
