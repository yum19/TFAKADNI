package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.dto.request.PartnerNoteRequest;
import tn.esprit.backend.entity.PartnerLink;
import tn.esprit.backend.entity.PartnerNote;
import tn.esprit.backend.entity.Pregnancy;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.enumtype.PartnerLinkStatus;
import tn.esprit.backend.enumtype.PartnerPermissionType;
import tn.esprit.backend.repository.PartnerLinkRepository;
import tn.esprit.backend.repository.PartnerNoteRepository;
import tn.esprit.backend.repository.PregnancyRepository;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.PartnerNoteService;

import java.util.List;
import java.util.Set;

@Service
@Transactional
@RequiredArgsConstructor
public class PartnerNoteServiceImpl implements PartnerNoteService {

    private final PartnerNoteRepository partnerNoteRepository;
    private final PartnerLinkRepository partnerLinkRepository;
    private final UserRepository userRepository;
    private final PregnancyRepository pregnancyRepository;
    private final PartnerPermissionAccessService permissionAccessService;

    @Override
    public PartnerNote createNote(PartnerNoteRequest request) {
        User author = userRepository.findById(request.getAuthorId())
                .orElseThrow(() -> new RuntimeException("Author not found"));

        User recipient = userRepository.findById(request.getRecipientId())
                .orElseThrow(() -> new RuntimeException("Recipient not found"));

        Pregnancy pregnancy = pregnancyRepository.findById(request.getPregnancyId())
                .orElseThrow(() -> new RuntimeException("Pregnancy not found"));

        if (author.getRole() == User.Role.PARTNER) {
            permissionAccessService.assertPregnancyPermission(
                    pregnancy.getId(),
                    author.getId(),
                    PartnerPermissionType.ADD_PARTNER_NOTE
            );
        } else {
            permissionAccessService.assertPregnancyAccess(pregnancy.getId(), author.getId());
        }

        PartnerLink acceptedLink = getAcceptedLinkForPregnancy(pregnancy.getId());

        boolean validRecipient =
                pregnancy.getUser().getId().equals(recipient.getId()) ||
                        (acceptedLink != null && acceptedLink.getPartner().getId().equals(recipient.getId()));

        if (!validRecipient) {
            throw new AccessDeniedException("Recipient is not linked to this pregnancy.");
        }

        if (author.getId().equals(recipient.getId())) {
            throw new AccessDeniedException("You cannot send a note to yourself.");
        }

        return partnerNoteRepository.save(
                PartnerNote.builder()
                        .author(author)
                        .recipient(recipient)
                        .pregnancy(pregnancy)
                        .content(request.getContent())
                        .isRead(false)
                        .build()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<PartnerNote> getNotesByPregnancy(Long pregnancyId, Long currentUserId) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (currentUser.getRole() == User.Role.PARTNER) {
            permissionAccessService.assertPregnancyPermission(
                    pregnancyId,
                    currentUserId,
                    PartnerPermissionType.ADD_PARTNER_NOTE
            );
        } else {
            permissionAccessService.assertPregnancyAccess(pregnancyId, currentUserId);
        }

        return partnerNoteRepository.findByPregnancyIdOrderByCreatedAtDesc(pregnancyId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PartnerNote> getInbox(Long recipientId) {
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new RuntimeException("Recipient not found"));

        List<PartnerNote> inbox = partnerNoteRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId);

        if (recipient.getRole() != User.Role.PARTNER) {
            return inbox;
        }

        Set<Long> allowedPregnancyIds = permissionAccessService.getAccessiblePregnancyIdsForPartner(
                recipientId,
                PartnerPermissionType.ADD_PARTNER_NOTE
        );

        return inbox.stream()
                .filter(note -> note.getPregnancy() != null && allowedPregnancyIds.contains(note.getPregnancy().getId()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Long countUnread(Long recipientId) {
        return (long) getInbox(recipientId).stream()
                .filter(note -> !Boolean.TRUE.equals(note.getIsRead()))
                .count();
    }

    @Override
    public PartnerNote markAsRead(Long noteId, Long currentUserId) {
        PartnerNote note = partnerNoteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Partner note not found"));

        if (!note.getRecipient().getId().equals(currentUserId)) {
            throw new AccessDeniedException("You can only mark your own received notes as read.");
        }

        if (note.getRecipient().getRole() == User.Role.PARTNER) {
            permissionAccessService.assertPregnancyPermission(
                    note.getPregnancy().getId(),
                    currentUserId,
                    PartnerPermissionType.ADD_PARTNER_NOTE
            );
        }

        note.setIsRead(true);
        return partnerNoteRepository.save(note);
    }

    @Override
    public void deleteNote(Long noteId, Long currentUserId) {
        PartnerNote note = partnerNoteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Partner note not found"));

        boolean isAuthor = note.getAuthor().getId().equals(currentUserId);
        boolean isRecipient = note.getRecipient().getId().equals(currentUserId);

        if (!isAuthor && !isRecipient) {
            throw new AccessDeniedException("You cannot delete another user's note.");
        }

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (currentUser.getRole() == User.Role.PARTNER) {
            permissionAccessService.assertPregnancyPermission(
                    note.getPregnancy().getId(),
                    currentUserId,
                    PartnerPermissionType.ADD_PARTNER_NOTE
            );
        }

        partnerNoteRepository.delete(note);
    }

    private PartnerLink getAcceptedLinkForPregnancy(Long pregnancyId) {
        return partnerLinkRepository.findByPregnancyIdAndStatus(pregnancyId, PartnerLinkStatus.ACCEPTED)
                .orElse(null);
    }
}
