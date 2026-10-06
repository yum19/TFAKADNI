package tn.esprit.backend.controller;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import tn.esprit.backend.dto.ChatMessage;
import tn.esprit.backend.entity.Message;
import tn.esprit.backend.entity.MessageReaction;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.repository.MessageReactionRepository;
import tn.esprit.backend.repository.MessageRepository;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.ArchiveService;
import tn.esprit.backend.service.ModerationService;
import tn.esprit.backend.service.ModerationService.ModerationResult;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate      messagingTemplate;
    private final MessageRepository          messageRepository;
    private final MessageReactionRepository  reactionRepository;
    private final UserRepository             userRepository;
    private final ModerationService          moderationService;
    private final ArchiveService             archiveService;

    // ── Send message ──────────────────────────────────────────────────────────
    @Transactional
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessage incoming) {

        Optional<User> senderOpt   = userRepository.findById(incoming.getSenderId());
        Optional<User> receiverOpt = userRepository.findById(incoming.getReceiverId());
        if (senderOpt.isEmpty() || receiverOpt.isEmpty()) return;

        User sender   = senderOpt.get();
        User receiver = receiverOpt.get();

        // ── Moderation check ──────────────────────────────────────────────────
        String textContent = incoming.getContent() != null ? incoming.getContent() : "";
        ModerationResult mod = moderationService.evaluate(
                incoming.getSenderId(), incoming.getReceiverId(), textContent);

        if (mod.isBan()) {
            // Already banned or just got banned — block message, notify sender only
            Map<String, Object> banPayload = Map.of(
                    "type",       "BAN",
                    "banSeconds", mod.banSeconds,
                    "reason",     "You have been temporarily banned from this conversation for using inappropriate language."
            );
            messagingTemplate.convertAndSend("/queue/moderation." + sender.getId(), (Object) banPayload);

            // Notify receiver that the other user was banned
            Map<String, Object> receiverAlert = Map.of(
                    "type",       "PEER_BANNED",
                    "peerId",     sender.getId(),
                    "peerName",   displayName(sender),
                    "banSeconds", mod.banSeconds,
                    "reason",     displayName(sender) + " was temporarily banned for inappropriate language."
            );
            messagingTemplate.convertAndSend("/queue/moderation." + receiver.getId(), (Object) receiverAlert);
            return; // DO NOT save or broadcast the message
        }

        if (mod.isWarning()) {
            // Send warning ONLY to sender – message still blocked (your choice: allow or block)
            // We BLOCK it (don't save/broadcast) and warn:
            Map<String, Object> warnPayload = Map.of(
                    "type",    "WARNING",
                    "reason",  "⚠️ Your message contains inappropriate language. Repeating this will result in a temporary ban."
            );
            messagingTemplate.convertAndSend("/queue/moderation." + sender.getId(), (Object) warnPayload);
            return; // DO NOT deliver to receiver
        }

        // ── Resolve reply-to ──────────────────────────────────────────────────
        Message replyTo = null;
        if (incoming.getReplyToId() != null) {
            replyTo = messageRepository.findById(incoming.getReplyToId()).orElse(null);
        }

        // ── Resolve message type ──────────────────────────────────────────────
        Message.MessageType type = incoming.getMessageType() != null
                ? incoming.getMessageType() : Message.MessageType.TEXT;

        // ── Save ──────────────────────────────────────────────────────────────
        Message saved = messageRepository.save(
                Message.builder()
                        .sender(sender)
                        .receiver(receiver)
                        .content(textContent)
                        .messageType(type)
                        .fileUrl(incoming.getFileUrl())
                        .fileName(incoming.getFileName())
                        .fileSize(incoming.getFileSize())
                        .duration(incoming.getDuration())
                        .status(Message.MessageStatus.SENT)
                        .replyTo(replyTo)
                        .build()
        );

        // ── Update archive tracker ────────────────────────────────────────────
        archiveService.touch(sender.getId(), receiver.getId());

        // ── Broadcast ─────────────────────────────────────────────────────────
        ChatMessage response = toDto(saved);
        messagingTemplate.convertAndSend("/queue/chat." + receiver.getId(), response);
        messagingTemplate.convertAndSend("/queue/chat." + sender.getId(),   response);

        // ── Conversation order update (broadcast to both) ─────────────────────
        Map<String, Object> orderUpdate = Map.of(
                "type",       "CONVERSATION_ORDER",
                "partnerId",  receiver.getId(),
                "partnerName", displayName(receiver),
                "lastMessage", saved.getContent(),
                "timestamp",   saved.getTimestamp().toString()
        );
        messagingTemplate.convertAndSend("/queue/conversations." + sender.getId(),   (Object) orderUpdate);

        Map<String, Object> orderUpdateReceiver = Map.of(
                "type",       "CONVERSATION_ORDER",
                "partnerId",  sender.getId(),
                "partnerName", displayName(sender),
                "lastMessage", saved.getContent(),
                "timestamp",   saved.getTimestamp().toString()
        );
        messagingTemplate.convertAndSend("/queue/conversations." + receiver.getId(), (Object) orderUpdateReceiver);

        // ── Mark delivered ────────────────────────────────────────────────────
        saved.setStatus(Message.MessageStatus.DELIVERED);
        messageRepository.save(saved);

        Map<String, Object> statusUpdate = Map.of("messageId", saved.getId(), "status", "DELIVERED");
        messagingTemplate.convertAndSend("/queue/status." + sender.getId(), (Object) statusUpdate);
    }

    // ── React to message ──────────────────────────────────────────────────────
    @Transactional
    @MessageMapping("/chat.react")
    public void reactToMessage(@Payload Map<String, Object> payload) {
        Long   messageId = Long.valueOf(payload.get("messageId").toString());
        Long   userId    = Long.valueOf(payload.get("userId").toString());
        String emoji     = payload.get("emoji").toString();

        Message msg  = messageRepository.findById(messageId).orElse(null);
        User    user = userRepository.findById(userId).orElse(null);
        if (msg == null || user == null) return;

        Optional<MessageReaction> existing = reactionRepository.findByMessageAndUser(msg, user);
        if (existing.isPresent()) {
            if (existing.get().getEmoji().equals(emoji)) {
                reactionRepository.delete(existing.get());
            } else {
                existing.get().setEmoji(emoji);
                reactionRepository.save(existing.get());
            }
        } else {
            reactionRepository.save(
                    MessageReaction.builder().message(msg).user(user).emoji(emoji).build());
        }

        List<ChatMessage.ReactionDto> reactions = reactionRepository.findByMessage(msg)
                .stream()
                .map(r -> ChatMessage.ReactionDto.builder()
                        .emoji(r.getEmoji())
                        .userId(r.getUser().getId())
                        .name(displayName(r.getUser()))
                        .build())
                .collect(Collectors.toList());

        Map<String, Object> update = Map.of("messageId", messageId, "reactions", reactions);
        messagingTemplate.convertAndSend("/queue/reaction." + msg.getSender().getId(),   (Object) update);
        messagingTemplate.convertAndSend("/queue/reaction." + msg.getReceiver().getId(), (Object) update);
    }

    // ── Typing indicator ──────────────────────────────────────────────────────
    @MessageMapping("/chat.typing")
    public void typing(@Payload Map<String, Object> payload) {
        Long senderId   = Long.valueOf(payload.get("senderId").toString());
        Long receiverId = Long.valueOf(payload.get("receiverId").toString());
        boolean isTyping = Boolean.parseBoolean(payload.getOrDefault("typing", "false").toString());

        Map<String, Object> typingEvent = Map.of(
                "senderId", senderId,
                "typing",   isTyping
        );
        messagingTemplate.convertAndSend("/queue/typing." + receiverId, (Object) typingEvent);
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

    private String displayName(User u) {
        return (u.getEmail() != null && !u.getEmail().isBlank())
                ? u.getEmail().split("@")[0] : "User " + u.getId();
    }
}