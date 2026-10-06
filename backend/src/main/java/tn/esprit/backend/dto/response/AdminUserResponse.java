package tn.esprit.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import tn.esprit.backend.entity.User;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminUserResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private User.Role role;
    private User.Provider provider;
    private Boolean isActive;
    private LocalDateTime createdAt;

    // Profil santé
    private Integer age;
    private Double weightKg;
    private Integer heightCm;
    private String bloodType;

    // Abonnement
    private String subscriptionPlan;
    private String subscriptionStatus;
}