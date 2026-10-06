package tn.esprit.backend.module6b.dto.analytics;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContraceptionMethodStatusItemDto {
    private String method;
    private long activeCount;
    private long stoppedCount;
    private long changedCount;
}