// src/main/java/tn/esprit/backend/dto/PostNotificationDTO.java
package tn.esprit.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PostNotificationDTO {
    private String type;      // "POST_REPORTED" | "POST_DELETED"
    private Long postId;
    private String message;
}