package tn.esprit.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Flat projection of a product row returned by native SQL.
 * The image list is fetched separately and joined in Java.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRowDTO {
    private Long   id;
    private String nom;
    private String description;
    private Double prix;
    private Integer stock;
    private String categorieName;   // joined from categories table
    private Long   categorieId;
}