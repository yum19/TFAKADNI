package tn.esprit.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import tn.esprit.backend.entity.Subscription;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class SubscriptionResponse {
    private Long id;
    private Subscription.Plan plan;
    private Subscription.Status status;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime createdAt;
}