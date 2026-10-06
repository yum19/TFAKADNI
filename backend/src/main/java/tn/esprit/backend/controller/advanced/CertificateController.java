package tn.esprit.backend.controller.advanced;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.advanced.CertificateService;

@RestController
@RequestMapping("/api/learning/certificates")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER','PARTNER')")
public class CertificateController {

    private final CertificateService certificateService;
    private final UserRepository userRepository;

    @GetMapping("/me/course/{courseId}")
    public ResponseEntity<byte[]> generateCertificate(Authentication authentication,
                                                      @PathVariable Long courseId) {

        Long userId = getCurrentUserId(authentication);

        byte[] pdf = certificateService.generateCertificate(userId,
                courseId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=certificate.pdf")
                                .contentType(MediaType.APPLICATION_PDF)
                                .body(pdf);
    }

    private Long getCurrentUserId(Authentication authentication) {
        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"))
                .getId();
    }
}

