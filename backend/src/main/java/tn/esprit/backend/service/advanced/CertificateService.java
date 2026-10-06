package tn.esprit.backend.service.advanced;

public interface CertificateService {
    byte[] generateCertificate(Long userId, Long courseId);
}
