package tn.esprit.backend.service.advanced;

import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import tn.esprit.backend.entity.Enrollment;
import tn.esprit.backend.enumtype.EnrollmentStatus;
import tn.esprit.backend.repository.CourseRepository;
import tn.esprit.backend.repository.EnrollmentRepository;
import tn.esprit.backend.repository.UserRepository;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CertificateServiceImpl implements CertificateService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;

    // Nouvelle Palette de couleurs MamaAI
    private static final Color MAMA_PINK = Color.decode("#ff4f75"); // Couleur d'accentuation principale
    private static final Color DARK_TEXT = Color.decode("#333333"); // Gris très foncé pour la lisibilité
    private static final Color GRAY = Color.decode("#666666");      // Gris clair pour le texte secondaire

    @Override
    public byte[] generateCertificate(Long userId, Long courseId) {
        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new AccessDeniedException("You are not enrolled in this course."));

        if (enrollment.getStatus() != EnrollmentStatus.COMPLETED) {
            throw new AccessDeniedException("Certificate is available only after completing the course.");
        }

        var user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        var course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        try (var document = new PDDocument();
             var outputStream = new ByteArrayOutputStream()) {

            PDRectangle landscapeA4 = new PDRectangle(PDRectangle.A4.getHeight(), PDRectangle.A4.getWidth());
            var page = new PDPage(landscapeA4);
            document.addPage(page);

            PDType1Font titleFont = new PDType1Font(Standard14Fonts.FontName.TIMES_BOLD);
            PDType1Font textFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDType1Font nameFont = new PDType1Font(Standard14Fonts.FontName.TIMES_ITALIC);

            try (var content = new PDPageContentStream(document, page)) {

                // 2. Dessiner le cadre (Bordure principale en Rose)
                drawBorders(content, landscapeA4);

                // 3. En-tête (Nom du projet / Plateforme)
                content.setNonStrokingColor(MAMA_PINK);
                drawCenteredText(content, "M A M A   A I   A C A D E M Y", titleFont, 18, 480, landscapeA4);

                // 4. Titre Principal
                content.setNonStrokingColor(DARK_TEXT);
                drawCenteredText(content, "CERTIFICATE OF COMPLETION", titleFont, 36, 400, landscapeA4);

                // 5. Texte d'introduction
                content.setNonStrokingColor(GRAY);
                drawCenteredText(content, "This is proudly presented to", textFont, 16, 340, landscapeA4);

                // 6. Nom de l'étudiant (Grand, centré, en Rose MamaAI)
                String fullName = user.getFirstName() + " " + user.getLastName();
                content.setNonStrokingColor(MAMA_PINK);
                drawCenteredText(content, fullName.toUpperCase(), nameFont, 42, 270, landscapeA4);

                // 7. Ligne de séparation sous le nom en Rose
                drawSeparatorLine(content, landscapeA4, 250);

                // 8. Motif de l'attestation et Nom du cours
                content.setNonStrokingColor(GRAY);
                drawCenteredText(content, "For successfully completing the course:", textFont, 14, 210, landscapeA4);

                content.setNonStrokingColor(DARK_TEXT);
                drawCenteredText(content, course.getTitle(), titleFont, 22, 175, landscapeA4);

                // 9. Date et Signature (En bas)
                String date = LocalDate.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy"));
                drawFooter(content, textFont, date, landscapeA4, userId, courseId);
            }

            document.save(outputStream);
            return outputStream.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Unable to generate certificate", e);
        }
    }

    private void drawCenteredText(PDPageContentStream content, String text, PDType1Font font, int fontSize, float y, PDRectangle page) throws IOException {
        float textWidth = font.getStringWidth(text) / 1000 * fontSize;
        float x = (page.getWidth() - textWidth) / 2;

        content.beginText();
        content.setFont(font, fontSize);
        content.newLineAtOffset(x, y);
        content.showText(text);
        content.endText();
    }

    private void drawBorders(PDPageContentStream content, PDRectangle page) throws IOException {
        // Bordure Extérieure (Rose MamaAI)
        content.setStrokingColor(MAMA_PINK);
        content.setLineWidth(4);
        content.addRect(20, 20, page.getWidth() - 40, page.getHeight() - 40);
        content.stroke();

        // Bordure Intérieure (Gris Foncé pour le contraste)
        content.setStrokingColor(DARK_TEXT);
        content.setLineWidth(1);
        content.addRect(30, 30, page.getWidth() - 60, page.getHeight() - 60);
        content.stroke();
    }

    private void drawSeparatorLine(PDPageContentStream content, PDRectangle page, float y) throws IOException {
        // Ligne sous le nom en Rose MamaAI
        content.setStrokingColor(MAMA_PINK);
        content.setLineWidth(1.5f);
        content.moveTo(page.getWidth() / 4, y);
        content.lineTo((page.getWidth() / 4) * 3, y);
        content.stroke();
    }

    private void drawFooter(PDPageContentStream content, PDType1Font font, String date, PDRectangle page, Long userId, Long courseId) throws IOException {
        content.setNonStrokingColor(DARK_TEXT);

        // 1. Date
        content.setFont(font, 12);
        content.beginText();
        content.newLineAtOffset(100, 120);
        content.showText("Date: " + date);
        content.endText();

        // 2. La Signature Visuelle
        PDType1Font signatureFont = new PDType1Font(Standard14Fonts.FontName.TIMES_ITALIC);
        content.setFont(signatureFont, 18);
        content.setNonStrokingColor(MAMA_PINK); // Signature manuscrite en Rose
        content.beginText();
        content.newLineAtOffset(page.getWidth() - 250, 125);
        content.showText("MAMA AI ADMIN");
        content.endText();

        // Ligne sous la signature
        content.setStrokingColor(GRAY);
        content.setLineWidth(1f);
        content.moveTo(page.getWidth() - 260, 115);
        content.lineTo(page.getWidth() - 100, 115);
        content.stroke();

        // Titre sous la signature
        content.setNonStrokingColor(DARK_TEXT);
        content.setFont(font, 10);
        content.beginText();
        content.newLineAtOffset(page.getWidth() - 230, 100);
        content.showText("Lead Instructor / CEO");
        content.endText();

        // 3. L'Empreinte Numérique
        String verificationId = generateVerificationId(userId, courseId);

        content.setFont(font, 9);
        content.setNonStrokingColor(GRAY);
        content.beginText();
        content.newLineAtOffset(100, 50);
        content.showText("Certificate Verification ID: " + verificationId);
        content.endText();

        content.beginText();
        content.newLineAtOffset(100, 38);
        content.showText("Authenticity can be verified at: academy.mamaai.tn/verify");
        content.endText();
    }

    private String generateVerificationId(Long userId, Long courseId) {
        try {
            String rawData = "MAMA-" + userId + "-" + courseId + "-" + LocalDate.now() + "-SECRET_SALT_2026";
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawData.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexString = new StringBuilder(2 * hash.length);
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return "MAMA-" + hexString.toString().substring(0, 12).toUpperCase();
        } catch (Exception e) {
            return "MAMA-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
        }
    }
}