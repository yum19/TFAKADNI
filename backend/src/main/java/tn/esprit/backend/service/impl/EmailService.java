package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendPasswordReset(String to, String resetLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("tfakedni.contact@gmail.com", "TFAKADNI Votre santé, notre priorité");
            helper.setTo(to);
            helper.setSubject("Réinitialisation de votre mot de passe — TFAKADNI");

            String html = """
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px">
                    <div style="text-align:center;margin-bottom:24px">
                        <h1 style="color:#e8436c;margin:0">TFAKADNI</h1>
                        <p style="color:#888;margin:4px 0">Votre santé, notre priorité</p>
                    </div>
                    <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #f0f0f0">
                        <h2 style="color:#333;margin-top:0">Réinitialisation du mot de passe</h2>
                        <p style="color:#555">Vous avez demandé la réinitialisation de votre mot de passe.</p>
                        <p style="color:#555">Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
                        <div style="text-align:center;margin:32px 0">
                            <a href="%s"
                               style="background:#e8436c;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">
                                Réinitialiser mon mot de passe
                            </a>
                        </div>
                        <p style="color:#888;font-size:13px">Ce lien expire dans <strong>15 minutes</strong>.</p>
                        <p style="color:#888;font-size:13px">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
                    </div>
                    <p style="color:#aaa;font-size:12px;text-align:center;margin-top:24px">
                        © 2026 TFAKADNI — Votre santé, notre priorité
                    </p>
                </div>
                """.formatted(resetLink);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Email de réinitialisation envoyé à : {}", to);

        } catch (Exception e) {
            log.error("Erreur envoi email à {} : {}", to, e.getMessage());
            throw new RuntimeException("Erreur lors de l'envoi de l'email.");
        }
    }

    public void sendWelcome(String to, String firstName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("tfakedni.contact@gmail.com", "TFAKADNI Votre santé, notre priorité");
            helper.setTo(to);
            helper.setSubject("Bienvenue sur TFAKADNI ! 🎉");

            String html = """
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px">
                    <div style="text-align:center;margin-bottom:24px">
                        <h1 style="color:#e8436c;margin:0">TFAKADNI</h1>
                        <p style="color:#888;margin:4px 0">Votre santé, notre priorité</p>
                    </div>
                    <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #f0f0f0">
                        <h2 style="color:#333;margin-top:0">Bienvenue %s ! 👋</h2>
                        <p style="color:#555">Votre compte TFAKADNI a été créé avec succès.</p>
                        <p style="color:#555">Commencez par compléter votre profil santé pour accéder à toutes les fonctionnalités.</p>
                        <div style="text-align:center;margin:32px 0">
                            <a href="http://localhost:4200/mother/health-profile"
                               style="background:#e8436c;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold">
                                Compléter mon profil
                            </a>
                        </div>
                    </div>
                    <p style="color:#aaa;font-size:12px;text-align:center;margin-top:24px">
                        © 2026 TFAKADNI — Votre santé, notre priorité
                    </p>
                </div>
                """.formatted(firstName);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Email de bienvenue envoyé à : {}", to);

        } catch (Exception e) {
            log.error("Erreur envoi email bienvenue à {} : {}", to, e.getMessage());
        }
    }

    public void sendPromoCode(String to, String firstName, String promoCode, int discountPct) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("tfakedni.contact@gmail.com", "TFAKADNI");
            helper.setTo(to);
            helper.setSubject("🎁 Votre code promo parrainage — " + discountPct + "%% de réduction !");

            String html = """
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px">
                    <div style="text-align:center;margin-bottom:24px">
                        <h1 style="color:#e8436c;margin:0">TFAKADNI</h1>
                    </div>
                    <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #f0f0f0">
                        <h2 style="color:#333;margin-top:0">Félicitations %s ! 🎉</h2>
                        <p style="color:#555">Grâce au parrainage, vous recevez un code promo exclusif :</p>
                        <div style="text-align:center;margin:32px 0">
                            <div style="background:#fff0f5;border:2px dashed #e8436c;border-radius:12px;padding:24px;display:inline-block">
                                <p style="color:#888;margin:0 0 8px;font-size:13px">VOTRE CODE PROMO</p>
                                <h1 style="color:#e8436c;margin:0;letter-spacing:4px;font-size:32px">%s</h1>
                                <p style="color:#e8436c;margin:8px 0 0;font-weight:bold">-%d%%%% sur votre abonnement</p>
                            </div>
                        </div>
                        <p style="color:#555;text-align:center">Utilisez ce code lors de votre prochain abonnement.</p>
                    </div>
                    <p style="color:#aaa;font-size:12px;text-align:center;margin-top:24px">
                        © 2026 TFAKADNI
                    </p>
                </div>
                """.formatted(firstName, promoCode, discountPct);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("[Email] PromoCode {} envoyé à {}", promoCode, to);
        } catch (Exception e) {
            log.warn("[Email] PromoCode non envoyé à {} : {}", to, e.getMessage());
        }
    }
    public void send2faCode(String to, String firstName, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("tfakedni.contact@gmail.com", "MAMAAI Securite");
            helper.setTo(to);
            helper.setSubject("Votre code de verification MAMAAI");

            String html = """
                <div style='font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px'>
                    <div style='text-align:center;margin-bottom:24px'>
                        <h1 style='color:#e8436c;margin:0'>MAMAAI</h1>
                        <p style='color:#888;margin:4px 0'>Verification en 2 etapes</p>
                    </div>
                    <div style='background:#fff;border-radius:16px;padding:32px;border:1px solid #f0f0f0;text-align:center'>
                        <p style='color:#555;margin-bottom:24px'>Bonjour %s, voici votre code de verification :</p>
                        <div style='background:#fff0f5;border:2px dashed #e8436c;border-radius:12px;padding:24px;display:inline-block;margin:0 auto'>
                            <h1 style='color:#e8436c;margin:0;font-size:42px;letter-spacing:8px;font-family:monospace'>%s</h1>
                        </div>
                        <p style='color:#888;font-size:13px;margin-top:20px'>Ce code expire dans <strong>5 minutes</strong>.</p>
                        <p style='color:#888;font-size:12px'>Si vous n avez pas demande ce code, ignorez cet email.</p>
                    </div>
                    <p style='color:#aaa;font-size:12px;text-align:center;margin-top:24px'>© 2026 MAMAAI</p>
                </div>
                """.formatted(firstName, code);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("[2FA] Code envoye a {}", to);
        } catch (Exception e) {
            log.warn("[2FA] Email non envoye a {} : {}", to, e.getMessage());
        }
    }

    public void sendEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            System.out.println(to);

            helper.setFrom("tfakedni.contact@gmail.com");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // true = HTML

            mailSender.send(message);
            log.info("Email sent successfully to {}", to);

        } catch (Exception e) {
            System.out.println(e.getMessage());
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}