package tn.esprit.backend.mapper;

import tn.esprit.backend.dto.shared.UserSummaryDto;
import tn.esprit.backend.entity.User;

public class UserMapper {

    private UserMapper() {
    }

    public static UserSummaryDto toSummary(User user) {
        return UserSummaryDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .build();
    }

}
