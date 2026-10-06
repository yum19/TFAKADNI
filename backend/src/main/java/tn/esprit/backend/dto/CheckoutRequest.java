// tn/esprit/backend/dto/request/CheckoutRequest.java
package tn.esprit.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class CheckoutRequest {
    private String nom;
    private String prenom;
    private String mail;
    private String telephone;
    private String ville;
    private String adresse;
    private List<ItemDto> items;

    @Data
    public static class ItemDto {
        private Long   produitId;
        private Integer quantite;
    }
}