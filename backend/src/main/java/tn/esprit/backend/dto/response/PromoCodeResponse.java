package tn.esprit.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PromoCodeResponse {
    private Long id;
    private String code;
    private Integer discountPct;
    private Integer maxUses;
    private Integer usedCount;
    private LocalDateTime expiresAt;
    private Boolean active;
}