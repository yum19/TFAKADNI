package tn.esprit.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Immutable;
import org.hibernate.annotations.Subselect;

@Entity
@Immutable
@Subselect("SELECT id FROM users WHERE deleted_at IS NULL")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Marrainage {
    @Id
    private Long id;
}