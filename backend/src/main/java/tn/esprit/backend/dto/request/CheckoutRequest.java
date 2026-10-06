package tn.esprit.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import tn.esprit.backend.entity.Subscription;

@Data
public class CheckoutRequest {
    @NotNull
    private Subscription.Plan plan;
    private String promoCode;
}