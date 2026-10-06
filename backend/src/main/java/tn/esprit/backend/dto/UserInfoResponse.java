package tn.esprit.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Returned by GET /api/users/me/info
 * The Angular checkout modal reads this to pre-fill email, firstName, lastName.
 */
@Data
@AllArgsConstructor
public class UserInfoResponse {
    private String email;
    private String firstName;
    private String lastName;
}