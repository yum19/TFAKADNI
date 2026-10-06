package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class WebRtcRelayController {

    private final SimpMessagingTemplate messaging;

    @MessageMapping("/rtc.{spaceId}")
    public void relay(@DestinationVariable Long spaceId,
                      @Payload Map<String, Object> msg,
                      Principal principal) {

        if (principal == null) return;

        Object targetObj = msg.get("targetUserId");
        if (targetObj == null) return;

        long targetUserId = ((Number) targetObj).longValue();

        if (targetUserId == 0) {
            // Broadcast announcement to all in the space
            messaging.convertAndSend("/topic/rtc." + spaceId + ".announce", msg);
        } else {
            // Send directly to specific user
            messaging.convertAndSend("/topic/rtc." + spaceId + ".user." + targetUserId, msg);
        }
    }
}