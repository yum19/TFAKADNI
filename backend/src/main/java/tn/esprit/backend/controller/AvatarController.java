package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.esprit.backend.dto.response.ApiResponse;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.repository.UserRepository;

import java.nio.file.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/users/me/avatar")
@RequiredArgsConstructor
@Slf4j
public class AvatarController {

    private final UserRepository userRepository;

    @Value("${app.upload.dir:uploads/avatars}")
    private String uploadDir;

    /** Préfixe des avatars stockés localement */
    private static final String LOCAL_AVATAR_PREFIX = "http://localhost:8081/api/users/me/avatar/";

    /**
     * POST /api/users/me/avatar
     * Upload une photo de profil (fichier ou webcam).
     * Supprime l'ancien avatar LOCAL avant de sauvegarder le nouveau.
     * Si l'ancien avatarUrl est une URL Google, on ne touche pas au disque.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<String>> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) throws Exception {
        String email = authentication.getName();
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        // Valider le type de fichier
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.ok("Seules les images sont acceptées.", null));
        }

        // Créer le dossier si nécessaire
        Path uploadPath = Paths.get(uploadDir);
        Files.createDirectories(uploadPath);

        // ✅ FIX : supprimer l'ancien avatar SEULEMENT s'il est local (pas une URL Google)
        deleteLocalAvatarIfExists(user.getAvatarUrl(), uploadPath);

        // Générer un nom unique
        String extension = file.getOriginalFilename() != null
                ? file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf("."))
                : ".jpg";
        String filename = "avatar_" + user.getId() + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;

        // Sauvegarder le fichier
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Mettre à jour l'URL en BD
        String avatarUrl = LOCAL_AVATAR_PREFIX + filename;
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);

        log.info("Avatar uploadé pour userId={} : {}", user.getId(), filename);
        return ResponseEntity.ok(ApiResponse.ok("Photo de profil mise à jour.", avatarUrl));
    }

    /**
     * GET /api/users/me/avatar/{filename}
     * Servir l'image locale
     */
    @GetMapping("/{filename}")
    public ResponseEntity<Resource> getAvatar(@PathVariable String filename) throws Exception {
        Path filePath = Paths.get(uploadDir).resolve(filename).normalize();
        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        String contentType = Files.probeContentType(filePath);
        if (contentType == null) contentType = "image/jpeg";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }

    /**
     * ✅ Supprime le fichier local uniquement si avatarUrl pointe vers un fichier local.
     * Les URLs Google (https://lh3.googleusercontent.com/...) sont ignorées.
     */
    public void deleteLocalAvatarIfExists(String avatarUrl, Path uploadPath) {
        if (avatarUrl == null || !avatarUrl.startsWith(LOCAL_AVATAR_PREFIX)) {
            // URL Google ou null → rien à supprimer sur le disque
            return;
        }
        try {
            String oldFilename = avatarUrl.substring(LOCAL_AVATAR_PREFIX.length());
            // Sécurité : pas de path traversal
            if (!oldFilename.contains("/") && !oldFilename.contains("..")) {
                boolean deleted = Files.deleteIfExists(uploadPath.resolve(oldFilename));
                if (deleted) {
                    log.info("Ancien avatar local supprimé : {}", oldFilename);
                }
            }
        } catch (Exception e) {
            log.warn("Impossible de supprimer l'ancien avatar : {}", e.getMessage());
        }
    }
}