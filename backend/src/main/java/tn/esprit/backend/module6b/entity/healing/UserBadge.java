package tn.esprit.backend.module6b.entity.healing;

import jakarta.persistence.*;
import lombok.*;
import tn.esprit.backend.entity.User;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_badges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserBadge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private User mother;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private HealingBadge badge;

    private LocalDateTime earnedAt;
}