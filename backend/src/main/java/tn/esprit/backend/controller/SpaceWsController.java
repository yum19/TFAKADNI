package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import tn.esprit.backend.dto.SpaceDtos;
import tn.esprit.backend.service.SpaceService;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class SpaceWsController {

    private final SpaceService spaceService;
    private final SimpMessagingTemplate messaging;

    @MessageMapping("/space.{spaceId}")
    public void handleSpaceAction(@DestinationVariable Long spaceId,
                                  @Payload SpaceDtos.SpaceWsMessage msg,
                                  Principal principal) {

        if (principal == null) return;

        String email = principal.getName();

        try {
            switch (msg.getType()) {
                case "JOIN" -> spaceService.joinSpace(spaceId, email);
                case "LEAVE" -> spaceService.leaveSpace(spaceId, email);
                case "MIC_TOGGLE" -> spaceService.toggleMic(spaceId, email, msg.isValue());
                case "HAND_RAISE" -> spaceService.raiseHand(spaceId, email, msg.isValue());
                case "PROMOTE" -> spaceService.promoteToSpeaker(spaceId, email, msg.getUserId());
                case "KICK" -> spaceService.kickParticipant(spaceId, email, msg.getUserId());
                case "SUBTITLE" -> spaceService.broadcastSubtitle(spaceId, msg.getUserId(), msg.getUserName(), msg.getPayload());
                case "END" -> spaceService.endSpace(spaceId, email);
                case "START" -> spaceService.startSpace(spaceId, email);
                default -> {}
            }
        } catch (Exception e) {
            SpaceDtos.SpaceWsMessage err = new SpaceDtos.SpaceWsMessage();
            err.setType("ERROR");
            err.setSpaceId(spaceId);
            err.setPayload(e.getMessage());
            messaging.convertAndSendToUser(email, "/queue/space-error", err);
        }
    }
}