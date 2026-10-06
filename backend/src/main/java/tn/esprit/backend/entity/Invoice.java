package tn.esprit.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoices")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, precision = 10, scale = 3)
    private BigDecimal amount;

    /** ISO 4217 : TND, EUR, USD */
    @Column(nullable = false, length = 3)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "pdf_url", length = 500)
    private String pdfUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_provider", nullable = false, length = 20)
    private PaymentProvider paymentProvider;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public enum Status          { PAID, PENDING, FAILED, REFUNDED }
    public enum PaymentProvider { STRIPE, KONNECT }
}