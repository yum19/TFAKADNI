package tn.esprit.backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PromoCodeRequest {
    @NotBlank
    @Size(min = 3, max = 50)
    private String code;

    @NotNull
    @Min(1)
    @Max(100)
    private Integer discountPct;

    private Integer maxUses;

    private java.time.LocalDateTime expiresAt;
}