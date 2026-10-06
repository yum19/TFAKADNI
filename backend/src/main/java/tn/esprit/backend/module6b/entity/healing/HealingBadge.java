package tn.esprit.backend.module6b.entity.healing;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "healing_badges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealingBadge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(length = 1000)
    private String description;

    private String icon;

    @Enumerated(EnumType.STRING)
    private BadgeType badgeType;

    private Integer conditionValue;

    private Boolean active;
}