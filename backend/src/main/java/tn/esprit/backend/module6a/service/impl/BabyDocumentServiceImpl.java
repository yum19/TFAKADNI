package tn.esprit.backend.module6a.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.module6a.dto.BabyDocumentMultipartRequestDTO;
import tn.esprit.backend.module6a.dto.BabyDocumentResponseDTO;
import tn.esprit.backend.module6a.entity.Baby;
import tn.esprit.backend.module6a.entity.BabyDocument;
import tn.esprit.backend.module6a.exception.BabyNotFoundException;
import tn.esprit.backend.module6a.exception.InvalidEnumValueException;
import tn.esprit.backend.module6a.exception.Module6aBadRequestException;
import tn.esprit.backend.module6a.exception.Module6aResourceNotFoundException;
import tn.esprit.backend.module6a.repository.BabyDocumentRepository;
import tn.esprit.backend.module6a.repository.BabyRepository;
import tn.esprit.backend.module6a.service.IBabyDocumentService;
import tn.esprit.backend.repository.UserRepository;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class BabyDocumentServiceImpl implements IBabyDocumentService {

    private final BabyDocumentRepository babyDocumentRepository;
    private final BabyRepository babyRepository;
    private final UserRepository userRepository;

    @Value("${app.base-url:http://localhost:8081}")
    private String baseUrl;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;


    @Override
    public BabyDocumentResponseDTO createBabyDocument(String email, Long babyId, BabyDocumentMultipartRequestDTO request) {
        User currentUser = getUserByEmail(email);
        Baby baby = getOwnedBabyOrThrow(currentUser, babyId);

        validateBabyDocumentRequest(request);

        String savedFileUrl = saveFile(request.getFile());

        BabyDocument document = BabyDocument.builder()
                .baby(baby)
                .title(request.getTitle().trim())
                .documentType(request.getDocumentType().trim().toUpperCase())
                .fileUrl(savedFileUrl)
                .fileSize(request.getFile().getSize())
                .notes(request.getNotes() != null ? request.getNotes().trim() : null)
                .build();

        return mapToResponse(babyDocumentRepository.save(document));
    }
    @Override
    @Transactional(readOnly = true)
    public List<BabyDocumentResponseDTO> getAllDocumentsByBaby(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        return babyDocumentRepository.findByBabyIdOrderByUploadedAtDescIdDesc(babyId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BabyDocumentResponseDTO getDocumentById(String email, Long babyId, Long documentId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        BabyDocument document = babyDocumentRepository.findByIdAndBabyId(documentId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Document introuvable : " + documentId));

        return mapToResponse(document);
    }

    @Override
    public BabyDocumentResponseDTO updateDocument(String email, Long babyId, Long documentId, BabyDocumentMultipartRequestDTO request) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        BabyDocument document = babyDocumentRepository.findByIdAndBabyId(documentId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Document introuvable : " + documentId));

        validateBabyDocumentRequestForUpdate(request);

        document.setTitle(normalizeText(request.getTitle()));
        document.setDocumentType(normalizeDocumentType(request.getDocumentType()));
        document.setNotes(normalizeText(request.getNotes()));

        MultipartFile newFile = request.getFile();
        if (newFile != null && !newFile.isEmpty()) {
            String savedFileUrl = saveFile(newFile);
            document.setFileUrl(savedFileUrl);
            document.setFileSize(newFile.getSize());
        }

        return mapToResponse(babyDocumentRepository.save(document));
    }

    @Override
    public void deleteDocument(String email, Long babyId, Long documentId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        BabyDocument document = babyDocumentRepository.findByIdAndBabyId(documentId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Document introuvable : " + documentId));

        babyDocumentRepository.delete(document);
    }

    @Override
    @Transactional(readOnly = true)
    public BabyDocumentResponseDTO getLatestDocument(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        BabyDocument document = babyDocumentRepository.findFirstByBabyIdOrderByUploadedAtDescIdDesc(babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Aucun document trouvé pour le bébé : " + babyId));

        return mapToResponse(document);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BabyDocumentResponseDTO> getDocumentsByType(String email, Long babyId, String documentType) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        return babyDocumentRepository.findByBabyIdAndDocumentTypeOrderByUploadedAtDescIdDesc(
                        babyId,
                        normalizeDocumentType(documentType)
                )
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private String saveFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new Module6aBadRequestException("File is required");
        }

        try {
            Path uploadPath = Paths.get(uploadDir, "documents");
            Files.createDirectories(uploadPath);

            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
            String extension = "";

            int dotIndex = originalName.lastIndexOf('.');
            if (dotIndex >= 0) {
                extension = originalName.substring(dotIndex);
            }

            String fileName = UUID.randomUUID() + extension;
            Path filePath = uploadPath.resolve(fileName);

            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            return baseUrl + "/uploads/documents/" + fileName;
        } catch (IOException e) {
            throw new Module6aBadRequestException("Failed to upload document file");
        }
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }

    private Baby getOwnedBabyOrThrow(User currentUser, Long babyId) {
        return babyRepository.findByIdAndMotherId(babyId, currentUser.getId())
                .orElseThrow(() -> new BabyNotFoundException("Bébé introuvable ou accès refusé"));
    }

    private BabyDocumentResponseDTO mapToResponse(BabyDocument document) {
        return BabyDocumentResponseDTO.builder()
                .id(document.getId())
                .babyId(document.getBaby().getId())
                .title(document.getTitle())
                .documentType(document.getDocumentType())
                .fileUrl(document.getFileUrl())
                .fileSize(document.getFileSize())
                .uploadedAt(document.getUploadedAt())
                .notes(document.getNotes())
                .build();
    }

    private void validateBabyDocumentRequest(BabyDocumentMultipartRequestDTO request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new Module6aBadRequestException("Title is required");
        }

        if (request.getDocumentType() == null || request.getDocumentType().isBlank()) {
            throw new Module6aBadRequestException("Document type is required");
        }

        String type = normalizeDocumentType(request.getDocumentType());
        if (!type.equals("ORDONNANCE")
                && !type.equals("COMPTE_RENDU")
                && !type.equals("ANALYSE")
                && !type.equals("RADIO")
                && !type.equals("AUTRE")) {
            throw new InvalidEnumValueException("Invalid document type");
        }

        if (request.getFile() == null || request.getFile().isEmpty()) {
            throw new Module6aBadRequestException("Document file is required");
        }
    }

    private void validateBabyDocumentRequestForUpdate(BabyDocumentMultipartRequestDTO request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new Module6aBadRequestException("Title is required");
        }

        if (request.getDocumentType() == null || request.getDocumentType().isBlank()) {
            throw new Module6aBadRequestException("Document type is required");
        }

        String type = normalizeDocumentType(request.getDocumentType());
        if (!type.equals("ORDONNANCE")
                && !type.equals("COMPTE_RENDU")
                && !type.equals("ANALYSE")
                && !type.equals("RADIO")
                && !type.equals("AUTRE")) {
            throw new InvalidEnumValueException("Invalid document type");
        }
    }

    private String normalizeDocumentType(String value) {
        return value == null ? null : value.trim().toUpperCase();
    }

    private String normalizeText(String value) {
        return value == null ? null : value.trim();
    }
}