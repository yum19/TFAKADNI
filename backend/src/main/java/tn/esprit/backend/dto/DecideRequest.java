package tn.esprit.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class DecideRequest {
    private Long   matchId;
    private String decision; // "ACCEPTED" or "REJECTED"
    // NOTE: currentUserId is intentionally removed — always use JWT identity
}