package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.esprit.backend.dto.ChatMessage;
import tn.esprit.backend.entity.Message;
import tn.esprit.backend.repository.MessageReactionRepository;
import tn.esprit.backend.repository.MessageRepository;
import tn.esprit.backend.service.ArchiveService;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MessageController {

    private final MessageRepository         messageRepository;
    private final MessageReactionRepository reactionRepository;
    private final SimpMessagingTemplate     messagingTemplate;
    private final ArchiveService            archiveService;

    private static final String UPLOAD_DIR = "uploads/chat/";

    // ── Conversation history ───────────────────────────────────────────────────
    @GetMapping("/conversation")
    public ResponseEntity<List<ChatMessage>> getConversation(
            @RequestParam Long a, @RequestParam Long b) {

        List<ChatMessage> history = messageRepository.findConversation(a, b)
                .stream().map(this::toDto).collect(Collectors.toList());

        // Touch so it won't auto-archive after loading
        archiveService.touch(a, b);
        return ResponseEntity.ok(history);
    }

    // ── Mark as read ──────────────────────────────────────────────────────────
    @PostMapping("/read")
    public ResponseEntity<Void> markAsRead(
            @RequestParam Long fromId, @RequestParam Long toId) {

        List<Message> updated = messageRepository.findUnreadMessages(fromId, toId);
        updated.forEach(m -> {
            m.setIsRead(true);
            m.setStatus(Message.MessageStatus.SEEN);
        });
        messageRepository.saveAll(updated);

        updated.forEach(m -> {
            Map<String, Object> statusUpdate = Map.of("messageId", m.getId(), "status", "SEEN");
            messagingTemplate.convertAndSend("/queue/status." + fromId, (Object) statusUpdate);
        });
        return ResponseEntity.ok().build();
    }

    // ── Unread count ──────────────────────────────────────────────────────────
    @GetMapping("/unread")
    public ResponseEntity<Long> countUnread(
            @RequestParam Long fromId, @RequestParam Long toId) {
        return ResponseEntity.ok(messageRepository.countUnread(fromId, toId));
    }

    // ── Get last message per partner (for sidebar ordering) ───────────────────
    @GetMapping("/last-messages")
    public ResponseEntity<List<Map<String, Object>>> getLastMessages(@RequestParam Long userId) {
        List<Object[]> rows = messageRepository.findLastMessagesForUser(userId);
        List<Map<String, Object>> result = rows.stream().map(row -> {
            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("partnerId",   row[0]);
            m.put("lastMessage", row[1]);
            m.put("timestamp",   row[2]);
            m.put("unread",      row[3]);
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ── Archive status ────────────────────────────────────────────────────────
    @GetMapping("/archived")
    public ResponseEntity<Map<String, Object>> isArchived(
            @RequestParam Long a, @RequestParam Long b) {
        return ResponseEntity.ok(Map.of("archived", archiveService.isArchived(a, b)));
    }

    // ── File upload ────────────────────────────────────────────────────────────
    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadFile(
            @RequestParam("file") MultipartFile file) throws IOException {

        String original = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        String ext    = original.contains(".") ? original.substring(original.lastIndexOf('.')) : "";
        String unique = UUID.randomUUID() + ext;

        Path uploadPath = Paths.get(UPLOAD_DIR);
        Files.createDirectories(uploadPath);
        Files.copy(file.getInputStream(), uploadPath.resolve(unique), StandardCopyOption.REPLACE_EXISTING);

        String url = "http://localhost:8081/uploads/chat/" + unique;
        return ResponseEntity.ok(Map.of(
                "url",      url,
                "fileName", original,
                "fileSize", file.getSize()
        ));
    }

    // ── Mapper ────────────────────────────────────────────────────────────────
    private ChatMessage toDto(Message m) {
        ChatMessage.ReplyPreviewDto replyPreview = null;
        if (m.getReplyTo() != null) {
            Message r = m.getReplyTo();
            replyPreview = ChatMessage.ReplyPreviewDto.builder()
                    .messageId(r.getId())
                    .senderName(displayName(r.getSender()))
                    .content(r.getContent())
                    .messageType(r.getMessageType())
                    .build();
        }

        List<ChatMessage.ReactionDto> reactions = m.getReactions().stream()
                .map(r -> ChatMessage.ReactionDto.builder()
                        .emoji(r.getEmoji())
                        .userId(r.getUser().getId())
                        .name(displayName(r.getUser()))
                        .build())
                .collect(Collectors.toList());

        return ChatMessage.builder()
                .messageId(m.getId())
                .senderId(m.getSender().getId())
                .receiverId(m.getReceiver().getId())
                .content(m.getContent())
                .messageType(m.getMessageType())
                .status(m.getStatus())
                .fileUrl(m.getFileUrl())
                .fileName(m.getFileName())
                .fileSize(m.getFileSize())
                .duration(m.getDuration())
                .timestamp(m.getTimestamp())
                .isRead(m.getIsRead())
                .senderName(displayName(m.getSender()))
                .replyTo(replyPreview)
                .reactions(reactions)
                .build();
    }

    private String displayName(tn.esprit.backend.entity.User u) {
        return (u.getEmail() != null && !u.getEmail().isBlank())
                ? u.getEmail().split("@")[0] : "User " + u.getId();
    }
}