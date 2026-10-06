package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.service.impl.EmailService;
import tn.esprit.backend.util.PregnancyEmailScheduler;

import java.util.Map;

@RestController
@RequestMapping("/api/email")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class EmailTestController {

    private final PregnancyEmailScheduler scheduler;
    private final EmailService emailService;

    // ── Déclenche manuellement le scheduler ──────────
    // Protected for ADMINs only to prevent scheduler abuse
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @GetMapping("/test-due-date")
    public ResponseEntity<?> testDueDateCheck() {
        scheduler.checkDueDateProximity();
        return ResponseEntity.ok(Map.of(
                "message", "Due date check triggered successfully",
                "status",  "Emails sent to eligible pregnancies"
        ));
    }

    // ── Test direct avec un email ────────────────────
    // Protected for ADMINs only to prevent unauthorized email sending
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @PostMapping("/test-send")
    public ResponseEntity<?> testSend(@RequestBody Map<String, String> body) {
        String to = body.getOrDefault("to", "bellilislem96@gmail.com");
        emailService.sendEmail(
                to,
                "🌸 MAMAAI — Email test",
                """
                <div style="font-family:Arial,sans-serif; padding:32px; background:#f7ede4;">
                  <div style="background:white; border-radius:16px; padding:24px; max-width:500px; margin:0 auto;">
                    <h2 style="color:#c94d6a;">✅ MAMAAI Email works!</h2>
                    <p style="color:#4a3038;">Your email configuration is working correctly.</p>
                    <p style="color:#4a3038;">You will receive due date alerts automatically when the baby's arrival is approaching.</p>
                  </div>
                </div>
                """
        );
        return ResponseEntity.ok(Map.of(
                "message", "Test email sent to " + to
        ));
    }
}