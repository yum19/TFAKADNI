// src/main/java/tn/esprit/backend/controllers/SignalController.java
package tn.esprit.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

/**
 * Pure relay — receives any WebRTC/call signal from one user
 * and forwards it to the other user's personal queue.
 *
 * Angular sends to: /app/call.signal
 * Angular listens:  /queue/signal.{myId}
 *
 * JSON must contain at minimum: { "toId": <number>, ... }
 */
@Controller
@RequiredArgsConstructor
public class SignalController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/call.signal")
    public void relay(@Payload JsonNode signal) {
        try {
            long toId = signal.get("toId").asLong();
            messagingTemplate.convertAndSend("/queue/signal." + toId, signal.toString());
        } catch (Exception e) {
            System.err.println("Signal relay error: " + e.getMessage());
        }
    }
}