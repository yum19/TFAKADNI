package tn.esprit.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import tn.esprit.backend.entity.User;
import java.time.LocalDateTime;

@Data
@Builder
public class UserResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private User.Role role;
    private User.Provider provider;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private String avatarUrl;
    private String referralCode;
}