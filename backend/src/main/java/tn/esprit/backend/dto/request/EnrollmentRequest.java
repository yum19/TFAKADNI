package tn.esprit.backend.dto.request;

import jakarta.validation.constraints.NotNull;

import lombok.Data;

@Data
public class EnrollmentRequest {

    private Long userId;

    @NotNull
    private Long courseId;

}
