package tn.esprit.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CheckoutResponse {
    private String clientSecret;
    private Long commandeId;
    private Double total;
}