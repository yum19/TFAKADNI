package tn.esprit.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CheckoutResponse {
    private String paymentUrl;
    private String paymentRef;
    private Integer originalAmount;   // en millimes (TND * 1000)
    private Integer discountAmount;
    private Integer finalAmount;
    private Integer discountPercent;
    private String plan;
    private String promoCode;
}