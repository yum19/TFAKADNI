package tn.esprit.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResponse {
    private Long productId;
    private String nom;
    private String description;
    private Double prix;
    private Integer stock;
    private List<String> images;
    private String categorie;
    private String aiReason;       // Why AI recommended this product
    private Double relevanceScore; // 0-100 relevance score
}