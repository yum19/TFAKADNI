package tn.esprit.backend.module6a.service;

import tn.esprit.backend.module6a.dto.BabyDocumentMultipartRequestDTO;
import tn.esprit.backend.module6a.dto.BabyDocumentResponseDTO;

import java.util.List;

public interface IBabyDocumentService {

    BabyDocumentResponseDTO createBabyDocument(String email, Long babyId, BabyDocumentMultipartRequestDTO request);

    List<BabyDocumentResponseDTO> getAllDocumentsByBaby(String email, Long babyId);

    BabyDocumentResponseDTO getDocumentById(String email, Long babyId, Long documentId);

    BabyDocumentResponseDTO updateDocument(String email, Long babyId, Long documentId, BabyDocumentMultipartRequestDTO request);

    void deleteDocument(String email, Long babyId, Long documentId);

    BabyDocumentResponseDTO getLatestDocument(String email, Long babyId);

    List<BabyDocumentResponseDTO> getDocumentsByType(String email, Long babyId, String documentType);
}