package tn.esprit.backend.module6a.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BabyResponseDTO {

    private Long id;
    private Long motherId;
    private String firstName;
    private String lastName;
    private LocalDate birthDate;
    private String gender;
    private Double birthWeight;
    private Double birthHeight;
    private String bloodType;
    private String birthPlace;
    private Integer gestationalAgeAtBirth;
    private String deliveryType;
    private String photoUrl;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}