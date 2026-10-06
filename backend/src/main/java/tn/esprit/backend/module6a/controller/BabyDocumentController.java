package tn.esprit.backend.module6a.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.module6a.dto.BabyDocumentMultipartRequestDTO;
import tn.esprit.backend.module6a.dto.BabyDocumentResponseDTO;
import tn.esprit.backend.module6a.service.IBabyDocumentService;

import java.util.List;

@RestController
@RequestMapping("/api/babies/{babyId}/documents")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class BabyDocumentController {

    private final IBabyDocumentService babyDocumentService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BabyDocumentResponseDTO> createBabyDocument(
            Authentication authentication,
            @PathVariable Long babyId,
            @ModelAttribute BabyDocumentMultipartRequestDTO request
    ) {
        String email = authentication.getName();
        BabyDocumentResponseDTO response = babyDocumentService.createBabyDocument(email, babyId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<BabyDocumentResponseDTO>> getAllDocumentsByBaby(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(babyDocumentService.getAllDocumentsByBaby(email, babyId));
    }

    @GetMapping("/{documentId}")
    public ResponseEntity<BabyDocumentResponseDTO> getDocumentById(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long documentId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(babyDocumentService.getDocumentById(email, babyId, documentId));
    }

    @PutMapping(value = "/{documentId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BabyDocumentResponseDTO> updateDocument(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long documentId,
            @ModelAttribute BabyDocumentMultipartRequestDTO request
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(babyDocumentService.updateDocument(email, babyId, documentId, request));
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<String> deleteDocument(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long documentId
    ) {
        String email = authentication.getName();
        babyDocumentService.deleteDocument(email, babyId, documentId);
        return ResponseEntity.ok("Document deleted successfully");
    }

    @GetMapping("/latest")
    public ResponseEntity<BabyDocumentResponseDTO> getLatestDocument(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(babyDocumentService.getLatestDocument(email, babyId));
    }

    @GetMapping("/type/{documentType}")
    public ResponseEntity<List<BabyDocumentResponseDTO>> getDocumentsByType(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable String documentType
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(babyDocumentService.getDocumentsByType(email, babyId, documentType));
    }
}