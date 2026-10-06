package tn.esprit.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import tn.esprit.backend.enumtype.PartnerPermissionType;

@Entity
@Table(
        name = "partner_permissions",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"partner_link_id", "permission_type"})
        }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PartnerPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "permission_type", nullable = false, length = 50)
    private PartnerPermissionType permissionType;

    @Column(nullable = false)
    private Boolean allowed;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_link_id", nullable = false)
    private PartnerLink partnerLink;

}
