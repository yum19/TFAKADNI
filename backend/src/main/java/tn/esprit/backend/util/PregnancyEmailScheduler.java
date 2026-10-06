package tn.esprit.backend.util;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import tn.esprit.backend.entity.Pregnancy;
import tn.esprit.backend.repository.PregnancyRepository;
import tn.esprit.backend.service.impl.EmailService;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class PregnancyEmailScheduler {

    private final PregnancyRepository pregnancyRepository;
    private final EmailService emailService;

    // Garde en mémoire les emails déjà envoyés — évite les doublons
    private final Set<String> sentToday = new HashSet<>();

    // ── Au démarrage Spring Boot ────────────────────────
    // Rattrape les emails manqués si Spring Boot était éteint
    /* @PostConstruct
    public void checkOnStartup() {
        log.info("Spring Boot started — checking for missed due date emails...");
        checkDueDateProximity();
    } */

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void checkOnStartup() {
        log.info("[Scheduler] Checking due dates on app startup...");
        checkDueDateProximity();
    }

    // ── Tous les jours à 8h ─────────────────────────────
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void checkDueDateProximity() {
        log.info("Running due date proximity check...");

        // Reset chaque jour
        sentToday.clear();

        LocalDate today = LocalDate.now();
        log.info("Today is: {}", today);

        List<Pregnancy> activePregnancies = pregnancyRepository
                .findByStatus(Pregnancy.PregnancyStatus.ACTIVE);

        log.info("Found {} active pregnancies", activePregnancies.size());

        for (Pregnancy pregnancy : activePregnancies) {
            if (pregnancy.getDueDate() == null) continue;
            if (pregnancy.getUser() == null || pregnancy.getUser().getEmail() == null) continue;

            long daysLeft = ChronoUnit.DAYS.between(today, pregnancy.getDueDate());
            log.info("Pregnancy ID {} — dueDate={} — daysLeft={}",
                    pregnancy.getId(), pregnancy.getDueDate(), daysLeft);

            // Anti-doublon
            String key = pregnancy.getId() + "-" + daysLeft;
            if (sentToday.contains(key)) {
                log.info("Already sent today for Pregnancy ID {} — skipping", pregnancy.getId());
                continue;
            }

            // Envoie seulement aux jours clés
            boolean eligible = daysLeft == 0  || daysLeft == 1
                    || daysLeft == 3  || daysLeft == 7
                    || daysLeft == 14;

            if (eligible) {
                sendDueDateAlert(pregnancy, daysLeft);
                sentToday.add(key);
            } else {
                log.info("Pregnancy ID {} not eligible — daysLeft={}", pregnancy.getId(), daysLeft);
            }
        }
    }


    private void sendDueDateAlert(Pregnancy pregnancy, long daysLeft) {
        String email      = pregnancy.getUser().getEmail();
        String name       = pregnancy.getUser().getFirstName() != null
                ? pregnancy.getUser().getFirstName() : "Mama";
        String dueDateFmt = pregnancy.getDueDate()
                .format(DateTimeFormatter.ofPattern("MMMM dd, yyyy"));

        String subject = buildSubject(daysLeft);
        String html    = daysLeft == 0
                ? buildBirthDayEmail(name, dueDateFmt, pregnancy)
                : buildEmailHtml(name, dueDateFmt, daysLeft, pregnancy);

        log.info("Sending due date alert to {} — {} days left", email, daysLeft);
        emailService.sendEmail(email, subject, html);
    }

    private String buildSubject(long daysLeft) {
        if (daysLeft == 0) return "🎉🎊 TFAKADNI — TODAY IS YOUR DUE DATE! Welcome to the world, little one!";
        if (daysLeft == 1) return "👶 TFAKADNI — Tomorrow is the big day!";
        if (daysLeft <= 3) return "🌸 TFAKADNI — Only " + daysLeft + " days until your baby arrives!";
        if (daysLeft == 7) return "✨ TFAKADNI — One week until your due date!";
        return "💕 TFAKADNI — " + daysLeft + " days until your due date!";
    }

    // ══════════════════════════════════════════════════════
    // 🎉 SPECIAL DAY 0 EMAIL — Ultra festif
    // ══════════════════════════════════════════════════════
    private String buildBirthDayEmail(String name, String dueDate, Pregnancy pregnancy) {

        String doctorInfo = (pregnancy.getDoctorName() != null && !pregnancy.getDoctorName().isEmpty())
                ? "<p style='margin:4px 0; font-size:14px; color:#7a5c65;'>👨‍⚕️ <strong style='color:#4a3038;'>"
                + pregnancy.getDoctorName() + "</strong></p>" : "";
        String hospitalInfo = (pregnancy.getHospitalName() != null && !pregnancy.getHospitalName().isEmpty())
                ? "<p style='margin:4px 0; font-size:14px; color:#7a5c65;'>🏥 <strong style='color:#4a3038;'>"
                + pregnancy.getHospitalName() + "</strong></p>" : "";

        return """
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <style>
            @keyframes shimmer {
              0%%   { background-position: 0%% 50%%; }
              100%% { background-position: 200%% 50%%; }
            }
            @keyframes bounce {
              0%%,100%% { transform: translateY(0); }
              50%%       { transform: translateY(-8px); }
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to   { transform: rotate(360deg); }
            }
            .shimmer-text {
              background: linear-gradient(135deg, #c94d6a, #f5a8b8, #d97b58, #f5c6d0, #c94d6a);
              background-size: 300%% auto;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              animation: shimmer 3s linear infinite;
            }
            .bounce { animation: bounce 1.5s ease-in-out infinite; }
            .star   { display: inline-block; animation: spin 4s linear infinite; }
          </style>
        </head>
        <body style="margin:0; padding:0; background:#fff0f5; font-family:Arial,sans-serif;">

          <table width="100%%" cellpadding="0" cellspacing="0"
                 style="background:linear-gradient(135deg,#fff0f5,#fce3d6,#f7ede4); padding:24px 16px;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0"
                     style="background:#ffffff; border-radius:32px; overflow:hidden;
                            box-shadow:0 8px 48px rgba(201,77,106,0.25);">

                <!-- ✨ GUIRLANDE TOP -->
                <tr>
                  <td style="background:linear-gradient(135deg,#c94d6a,#d97b58,#a8722e,#4d8c52,#3a8fb5,#c94d6a);
                              background-size:300%% auto; padding:6px 0; text-align:center;
                              font-size:22px; letter-spacing:4px; animation:shimmer 3s linear infinite;">
                    🎀 🌟 🎉 ✨ 👶 ✨ 🎉 🌟 🎀
                  </td>
                </tr>

                <!-- 🎊 HERO FESTIF -->
                <tr>
                  <td style="padding:0;">
                    <!-- Fond dégradé animé simulé avec des blocs -->
                    <table width="100%%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:linear-gradient(135deg,#c94d6a 0%%,#d97b58 35%%,#a8722e 60%%,#c94d6a 100%%);
                                    padding:48px 40px 36px; text-align:center;">

                          <!-- Confettis top -->
                          <div style="font-size:28px; letter-spacing:8px; margin-bottom:16px;">
                            🎊 🎈 🎁 🎊 🎈 🎁 🎊
                          </div>

                          <!-- Titre principal -->
                          <h1 style="margin:0 0 8px; color:#ffffff; font-size:42px; font-weight:900;
                                      font-family:Georgia,serif; text-shadow:0 3px 12px rgba(0,0,0,0.2);
                                      line-height:1.1;">
                            🌸 TODAY IS<br/>THE DAY! 🌸
                          </h1>

                          <!-- Sous-titre -->
                          <p style="margin:12px 0 0; color:rgba(255,255,255,0.9); font-size:16px;
                                     letter-spacing:0.08em; text-transform:uppercase; font-weight:600;">
                            Your baby is coming, %s!
                          </p>

                          <!-- Confettis bas -->
                          <div style="font-size:28px; letter-spacing:8px; margin-top:16px;">
                            💕 ⭐ 💫 👼 💫 ⭐ 💕
                          </div>

                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- ✨ GUIRLANDE MILIEU -->
                <tr>
                  <td style="background:linear-gradient(90deg,#f5c6d0,#fce3d6,#f5e0c0,#c8e6ca,#bde3f5,#f5c6d0);
                              padding:10px 0; text-align:center; font-size:18px; letter-spacing:6px;">
                    ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦
                  </td>
                </tr>

                <!-- 💌 BODY -->
                <tr>
                  <td style="padding:40px 40px 32px; background:#ffffff;">

                    <!-- Message principal -->
                    <div style="text-align:center; margin-bottom:32px;">
                      <div style="font-size:64px; margin-bottom:12px;">👶</div>
                      <h2 style="margin:0 0 12px; font-family:Georgia,serif; font-size:28px;
                                  font-weight:700; color:#c94d6a; line-height:1.3;">
                        Welcome to the world,<br/>little one!
                      </h2>
                      <p style="margin:0; color:#4a3038; font-size:16px; line-height:1.8; max-width:480px; margin:0 auto;">
                        This is the magical day you've been waiting for.
                        <strong style="color:#c94d6a;">You are brave, you are strong, and you are ready.</strong>
                        Your baby has chosen the most incredible mama in the world. 💕
                      </p>
                    </div>

                    <!-- Badge date spéciale -->
                    <table width="100%%" cellpadding="0" cellspacing="0"
                           style="background:linear-gradient(135deg,#fff0f5,#fce3d6);
                                  border-radius:20px; border:2px solid #f5c6d0; margin-bottom:28px;">
                      <tr>
                        <td style="padding:24px; text-align:center;">
                          <p style="margin:0 0 4px; color:#7a5c65; font-size:11px;
                                     text-transform:uppercase; letter-spacing:0.15em;">
                            Your special day
                          </p>
                          <p style="margin:0; color:#c94d6a; font-family:Georgia,serif;
                                     font-size:26px; font-weight:700;">
                            🌸 %s 🌸
                          </p>
                          <p style="margin:8px 0 0; color:#7a5c65; font-size:13px;">
                            A day that will change your life forever
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Medical info -->
                    %s
                    %s

                    <!-- Affirmations -->
                    <table width="100%%" cellpadding="0" cellspacing="0"
                           style="background:linear-gradient(135deg,#f7ede4,#fce3d6);
                                  border-radius:16px; margin-bottom:28px; border-left:4px solid #c94d6a;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <p style="margin:0 0 12px; color:#c94d6a; font-size:11px; font-weight:700;
                                     text-transform:uppercase; letter-spacing:0.1em;">
                            ✨ You've got this, mama
                          </p>
                          <p style="margin:6px 0; color:#4a3038; font-size:14px;">💪 You are stronger than you know</p>
                          <p style="margin:6px 0; color:#4a3038; font-size:14px;">💕 Your body knows exactly what to do</p>
                          <p style="margin:6px 0; color:#4a3038; font-size:14px;">🌸 Every breath brings you closer to your baby</p>
                          <p style="margin:6px 0; color:#4a3038; font-size:14px;">⭐ You are not alone — we are with you</p>
                          <p style="margin:6px 0; color:#4a3038; font-size:14px;">👶 Soon you'll hold the most precious gift in your arms</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Checklist urgence -->
                    <table width="100%%" cellpadding="0" cellspacing="0"
                           style="background:#f7ede4; border-radius:16px; margin-bottom:28px;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <p style="margin:0 0 12px; color:#c94d6a; font-size:11px; font-weight:700;
                                     text-transform:uppercase; letter-spacing:0.1em;">
                            Last minute checklist
                          </p>
                          <p style="margin:5px 0; color:#4a3038; font-size:14px;">✅ Hospital bag packed &amp; ready</p>
                          <p style="margin:5px 0; color:#4a3038; font-size:14px;">✅ Car seat installed</p>
                          <p style="margin:5px 0; color:#4a3038; font-size:14px;">✅ Birth plan with you</p>
                          <p style="margin:5px 0; color:#4a3038; font-size:14px;">✅ Partner / support person notified</p>
                          <p style="margin:5px 0; color:#4a3038; font-size:14px;">✅ Phone charged &amp; camera ready</p>
                          <p style="margin:5px 0; color:#4a3038; font-size:14px;">✅ Take a deep breath — YOU ARE READY!</p>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA spécial -->
                    <div style="text-align:center; margin-bottom:8px;">
                      <a href="http://localhost:4200/mother/pregnancy"
                         style="display:inline-block;
                                background:linear-gradient(135deg,#c94d6a,#d97b58);
                                color:#ffffff; padding:16px 40px; border-radius:50px;
                                text-decoration:none; font-weight:700; font-size:16px;
                                letter-spacing:0.04em;
                                box-shadow:0 6px 24px rgba(201,77,106,0.4);">
                        🌸 Open TFAKADNI Dashboard
                      </a>
                    </div>
                    <p style="text-align:center; margin:12px 0 0; color:#7a5c65; font-size:13px; font-style:italic;">
                      We are sending you all our love and positive energy today 💕
                    </p>

                  </td>
                </tr>

                <!-- ✨ GUIRLANDE BOTTOM -->
                <tr>
                  <td style="background:linear-gradient(135deg,#c94d6a,#d97b58,#a8722e,#4d8c52,#3a8fb5,#c94d6a);
                              padding:6px 0; text-align:center;
                              font-size:22px; letter-spacing:4px;">
                    🎀 🌟 🎉 ✨ 👶 ✨ 🎉 🌟 🎀
                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td style="background:#fff0f5; padding:20px 40px; text-align:center;">
                    <p style="margin:0; color:#7a5c65; font-size:12px; line-height:1.6;">
                      TFAKADNI · Pregnancy Health Companion<br/>
                      Wishing you a safe, beautiful and unforgettable birth experience. 🌸
                    </p>
                  </td>
                </tr>

              </table>
            </td></tr>
          </table>

        </body>
        </html>
        """.formatted(name, dueDate, doctorInfo, hospitalInfo);
    }

    // ══════════════════════════════════════════════════════
    // 📧 EMAIL STANDARD — J-1 à J-15
    // ══════════════════════════════════════════════════════
    private String buildEmailHtml(String name, String dueDate,
                                  long daysLeft, Pregnancy pregnancy) {

        String headerColor = daysLeft <= 3 ? "#c94d6a" :
                daysLeft <= 7 ? "#d97b58" : "#4d8c52";
        String emoji       = daysLeft == 1 ? "👶" :
                daysLeft <= 7 ? "🌸" : "✨";
        String headline    = daysLeft == 1 ? "Tomorrow is the big day!" :
                daysLeft <= 3 ? "Almost there, mama!" :
                        daysLeft == 7 ? "One week to go!" :
                                "Only " + daysLeft + " days until you meet your baby!";
        String message     = daysLeft == 1
                ? "In just one day, you'll be holding your little one in your arms. Make sure your hospital bag is packed and your birth plan is ready!"
                : daysLeft <= 3
                ? "You're so close! In just " + daysLeft + " days, your baby will arrive. Rest, breathe, and trust your body — you've got this, mama!"
                : daysLeft == 7
                ? "One week from today, your little one will be here. This is a great time to finalize your preparations and rest as much as possible."
                : "In " + daysLeft + " days, your baby is expected to arrive! Now is the perfect time to double-check your hospital bag, car seat, and nursery.";

        String doctorInfo = (pregnancy.getDoctorName() != null && !pregnancy.getDoctorName().isEmpty())
                ? "<p style='margin:0; color:#7a5c65; font-size:13px;'>Your physician: <strong style='color:#4a3038;'>"
                + pregnancy.getDoctorName() + "</strong></p>" : "";
        String hospitalInfo = (pregnancy.getHospitalName() != null && !pregnancy.getHospitalName().isEmpty())
                ? "<p style='margin:4px 0 0; color:#7a5c65; font-size:13px;'>Hospital: <strong style='color:#4a3038;'>"
                + pregnancy.getHospitalName() + "</strong></p>" : "";

        return """
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        </head>
        <body style="margin:0; padding:0; background:#f7ede4; font-family:Arial,sans-serif;">

          <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f7ede4; padding:32px 16px;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0"
                     style="background:#ffffff; border-radius:24px; overflow:hidden;
                            box-shadow:0 4px 24px rgba(201,77,106,0.12);">

                <tr>
                  <td style="background:%s; padding:36px 40px; text-align:center;">
                    <p style="margin:0 0 8px; font-size:48px; line-height:1;">%s</p>
                    <h1 style="margin:0; color:#ffffff; font-size:28px; font-weight:700;
                                font-family:Georgia,serif;">TFAKADNI</h1>
                    <p style="margin:8px 0 0; color:rgba(255,255,255,0.85); font-size:13px;
                               letter-spacing:0.1em; text-transform:uppercase;">
                      Pregnancy Health Companion
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:40px 40px 32px;">
                    <p style="margin:0 0 6px; color:#7a5c65; font-size:14px;">
                      Dear <strong style="color:#1e1215;">%s</strong>,
                    </p>
                    <h2 style="margin:16px 0 12px; color:%s; font-family:Georgia,serif;
                                font-size:26px; font-weight:700; line-height:1.2;">
                      %s
                    </h2>
                    <p style="margin:0 0 24px; color:#4a3038; font-size:15px; line-height:1.7;">
                      %s
                    </p>

                    <table width="100%%" cellpadding="0" cellspacing="0"
                           style="background:#fdf6f0; border-radius:16px;
                                  border:1.5px solid %s33; margin-bottom:24px;">
                      <tr>
                        <td style="padding:20px 24px; text-align:center;">
                          <p style="margin:0; color:#7a5c65; font-size:12px;
                                     text-transform:uppercase; letter-spacing:0.1em;">
                            Days until due date
                          </p>
                          <p style="margin:8px 0 4px; color:%s; font-family:Georgia,serif;
                                     font-size:52px; font-weight:700; line-height:1;">
                            %d
                          </p>
                          <p style="margin:0; color:#7a5c65; font-size:13px;">
                            Expected: <strong style="color:#1e1215;">%s</strong>
                          </p>
                        </td>
                      </tr>
                    </table>

                    %s
                    %s
                    %s

                    <div style="text-align:center; margin-top:28px;">
                      <a href="http://localhost:4200/mother/pregnancy"
                         style="display:inline-block; background:%s; color:#ffffff;
                                padding:14px 32px; border-radius:30px; text-decoration:none;
                                font-weight:700; font-size:15px;">
                        Open my TFAKADNI dashboard
                      </a>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="background:#f7ede4; padding:20px 40px; text-align:center;
                              border-top:1px solid #f5c6d0;">
                    <p style="margin:0; color:#7a5c65; font-size:12px; line-height:1.6;">
                      TFAKADNI · Pregnancy Health Companion<br/>
                      This is an automated reminder. Please contact your healthcare provider for medical advice.
                    </p>
                  </td>
                </tr>

              </table>
            </td></tr>
          </table>

        </body>
        </html>
        """.formatted(
                headerColor, emoji,
                name,
                headerColor, headline,
                message,
                headerColor, headerColor,
                daysLeft, dueDate,
                doctorInfo, hospitalInfo,
                buildChecklist(daysLeft),
                headerColor
        );
    }

    private String buildChecklist(long daysLeft) {
        if (daysLeft > 7) return "";
        return """
        <table width="100%%" cellpadding="0" cellspacing="0"
               style="background:#f7ede4; border-radius:14px; margin:16px 0 24px;">
          <tr><td style="padding:16px 20px;">
            <p style="margin:0 0 12px; color:#c94d6a; font-size:12px; font-weight:700;
                       text-transform:uppercase; letter-spacing:0.08em;">
              Get ready checklist
            </p>
            <p style="margin:4px 0; color:#4a3038; font-size:14px;">Pack your hospital bag</p>
            <p style="margin:4px 0; color:#4a3038; font-size:14px;">Install the car seat</p>
            <p style="margin:4px 0; color:#4a3038; font-size:14px;">Prepare your birth plan</p>
            <p style="margin:4px 0; color:#4a3038; font-size:14px;">Pre-register at hospital</p>
            <p style="margin:4px 0; color:#4a3038; font-size:14px;">Set up the nursery</p>
          </td></tr>
        </table>
        """;
    }
}