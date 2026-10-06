package tn.esprit.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import tn.esprit.backend.entity.Invoice;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class InvoiceResponse {
    private Long id;
    private BigDecimal amount;
    private String currency;
    private Invoice.Status status;
    private Invoice.PaymentProvider paymentProvider;
    private LocalDateTime paidAt;
    private String pdfUrl;
    private LocalDateTime createdAt;
}