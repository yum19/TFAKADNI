// src/main/java/tn/esprit/backend/controllers/CallController.java
package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.CallRecordDTO;
import tn.esprit.backend.dto.SaveCallRequest;
import tn.esprit.backend.entity.CallRecord;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.repository.CallRecordRepository;
import tn.esprit.backend.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/calls")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CallController {

    private final CallRecordRepository callRepo;
    private final UserRepository       userRepo;

    /**
     * POST /api/calls/save
     * Called by Angular when a call ends (either side).
     * Uses callId to prevent double-saves.
     */
    @PostMapping("/save")
    public ResponseEntity<CallRecordDTO> saveCall(@RequestBody SaveCallRequest req) {

        // Idempotent: if already saved (callId is unique), return existing
        if (callRepo.findByCallId(req.getCallId()).isPresent()) {
            return ResponseEntity.ok(toDto(callRepo.findByCallId(req.getCallId()).get()));
        }

        User caller = userRepo.findById(req.getCallerId())
                .orElseThrow(() -> new RuntimeException("Caller not found"));
        User callee = userRepo.findById(req.getCalleeId())
                .orElseThrow(() -> new RuntimeException("Callee not found"));

        CallRecord record = CallRecord.builder()
                .callId(req.getCallId())
                .caller(caller)
                .callee(callee)
                .callType(req.getCallType() != null ? req.getCallType().toUpperCase() : "AUDIO")
                .callStatus(req.getCallStatus() != null ? req.getCallStatus().toUpperCase() : "MISSED")
                .durationSeconds(req.getDurationSeconds() != null ? req.getDurationSeconds() : 0)
                .startedAt(LocalDateTime.now())
                .endedAt(LocalDateTime.now())
                .build();

        return ResponseEntity.ok(toDto(callRepo.save(record)));
    }

    /**
     * GET /api/calls/history?a=1&b=2
     * Returns call history between two users, newest first.
     */
    @GetMapping("/history")
    public ResponseEntity<List<CallRecordDTO>> getHistory(
            @RequestParam Long a,
            @RequestParam Long b) {

        List<CallRecordDTO> history = callRepo.findHistory(a, b)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(history);
    }

    // ── Mapper ────────────────────────────────────────────────
    private CallRecordDTO toDto(CallRecord r) {
        return CallRecordDTO.builder()
                .id(r.getId())
                .callId(r.getCallId())
                .callerId(r.getCaller().getId())
                .callerName(displayName(r.getCaller()))
                .calleeId(r.getCallee().getId())
                .calleeName(displayName(r.getCallee()))
                .callType(r.getCallType())
                .callStatus(r.getCallStatus())
                .durationSeconds(r.getDurationSeconds())
                .startedAt(r.getStartedAt())
                .endedAt(r.getEndedAt())
                .build();
    }

    private String displayName(User u) {
        if (u.getEmail() != null && !u.getEmail().isBlank())
            return u.getEmail().split("@")[0];
        return "User " + u.getId();
    }
}