package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import tn.esprit.backend.entity.Alert;
import tn.esprit.backend.entity.Pregnancy;
import tn.esprit.backend.entity.PrenatalExam;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.entity.Vitals;
import tn.esprit.backend.repository.AlertRepository;
import tn.esprit.backend.repository.PrenatalExamRepository;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.repository.VitalsRepository;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class VitalsService {

    private final VitalsRepository       vitalsRepository;
    private final AlertRepository        alertRepository;
    private final PrenatalExamRepository prenatalExamRepository;
    private final UserRepository         userRepository;   // ← NOUVEAU
    private final EmailService           emailService;     // ← NOUVEAU

    /* private static final Long USER_ID    = 1L;
    private static final Long ADMIN_ID   = 2L;
    private static final Long PARTNER_ID = 3L; */

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public Vitals save(Vitals vitals, Long pregnancyId) {
        User currentUser = getAuthenticatedUser();
        User user = new User();
        user.setId(currentUser.getId());
        vitals.setUser(user);

        if (pregnancyId != null) {
            Pregnancy pregnancy = new Pregnancy();
            pregnancy.setId(pregnancyId);
            vitals.setPregnancy(pregnancy);
        }

        Vitals saved = vitalsRepository.save(vitals);
        checkAndGenerateAlerts(saved);
        return saved;
    }

    public List<Vitals> getMyVitals() {
        User currentUser = getAuthenticatedUser();
        return vitalsRepository.findByUserIdOrderByMeasuredAtDesc(currentUser.getId());
    }

    public Vitals getById(Long id) {
        return vitalsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mesure non trouvée"));
    }

    public Vitals update(Long id, Vitals updated) {
        Vitals existing = getById(id);
        existing.setSystolicBp(updated.getSystolicBp());
        existing.setDiastolicBp(updated.getDiastolicBp());
        existing.setWeightKg(updated.getWeightKg());
        existing.setHeartRate(updated.getHeartRate());
        existing.setGlucoseMmol(updated.getGlucoseMmol());
        existing.setTemperatureC(updated.getTemperatureC());
        existing.setOxygenPct(updated.getOxygenPct());
        existing.setNotes(updated.getNotes());

        Vitals saved = vitalsRepository.save(existing);
        alertRepository.deleteByVitalId(id);
        prenatalExamRepository.deleteByVitalId(id);
        checkAndGenerateAlerts(saved);
        return saved;
    }

    public void delete(Long id) {
        alertRepository.deleteByVitalId(id);
        prenatalExamRepository.deleteByVitalId(id);
        vitalsRepository.deleteById(id);
    }

    public List<Vitals> getAllVitals() {
        return vitalsRepository.findAll();
    }

    public List<Vitals> getByUserId(Long userId) {
        return vitalsRepository.findByUserId(userId);
    }

    // ═══════════════════════════════════════════════════════════════
    //   GÉNÉRATION ALERTES + EXAMENS + EMAIL
    // ═══════════════════════════════════════════════════════════════
    private void checkAndGenerateAlerts(Vitals vitals) {
        User currentUser = getAuthenticatedUser();

        // Récupère email + nom de la femme pour les emails
        String userEmail = userRepository.findById(currentUser.getId())
                .map(User::getEmail).orElse(null);
        String userName  = userRepository.findById(currentUser.getId())
                .map(u -> u.getFirstName() != null ? u.getFirstName() : "Mama")
                .orElse("Mama");

        // ── 1. HYPERTENSION ───────────────────────────────────────
        if (vitals.getSystolicBp() != null && vitals.getDiastolicBp() != null) {

            if (vitals.getSystolicBp() >= 160 || vitals.getDiastolicBp() >= 110) {
                Alert alert = buildAlert(currentUser, vitals,
                        Alert.AlertType.HYPERTENSION, Alert.AlertSeverity.CRITICAL,
                        "Severe hypertension: " + vitals.getSystolicBp() + "/" + vitals.getDiastolicBp() + " mmHg. Medical emergency during pregnancy.",
                        "🚨 Call your doctor or emergency services immediately. Lie on your left side. Do not take medication without advice. Avoid any physical effort."
                );
                alertRepository.save(alert);
                sendAlertEmail(userEmail, userName, alert, vitals); // ← EMAIL

                saveExam(vitals, "Emergency BP monitoring", "Recommended — severe hypertension detected (" + vitals.getSystolicBp() + "/" + vitals.getDiastolicBp() + " mmHg)", Alert.AlertSeverity.CRITICAL);
                saveExam(vitals, "Urine protein test (preeclampsia)", "Recommended — rule out preeclampsia after critical BP reading", Alert.AlertSeverity.CRITICAL);
                saveExam(vitals, "Fetal monitoring (CTG)", "Recommended — check baby's wellbeing after severe hypertension", Alert.AlertSeverity.CRITICAL);

            } else if (vitals.getSystolicBp() >= 140 || vitals.getDiastolicBp() >= 90) {
                Alert alert = buildAlert(currentUser, vitals,
                        Alert.AlertType.HYPERTENSION, Alert.AlertSeverity.DANGER,
                        "High blood pressure: " + vitals.getSystolicBp() + "/" + vitals.getDiastolicBp() + " mmHg.",
                        "⚠️ Rest immediately. Reduce salt intake. Lie on your left side for 20 min. Contact your doctor if BP stays elevated."
                );
                alertRepository.save(alert);
                sendAlertEmail(userEmail, userName, alert, vitals); // ← EMAIL

                saveExam(vitals, "Blood pressure follow-up", "Recommended — hypertension detected (" + vitals.getSystolicBp() + "/" + vitals.getDiastolicBp() + " mmHg)", Alert.AlertSeverity.DANGER);
                saveExam(vitals, "Kidney function blood test", "Recommended — monitor kidney health after elevated BP", Alert.AlertSeverity.DANGER);

            } else if (vitals.getSystolicBp() >= 130 || vitals.getDiastolicBp() >= 80) {
                Alert alert = buildAlert(currentUser, vitals,
                        Alert.AlertType.HYPERTENSION, Alert.AlertSeverity.WARNING,
                        "Borderline blood pressure: " + vitals.getSystolicBp() + "/" + vitals.getDiastolicBp() + " mmHg.",
                        "💡 Monitor BP more frequently. Reduce salt. Practice slow breathing. Inform your doctor at next appointment."
                );
                alertRepository.save(alert);
                // WARNING → pas d'email, juste alerte dans l'app

                saveExam(vitals, "Blood pressure monitoring", "Recommended — borderline BP reading (" + vitals.getSystolicBp() + "/" + vitals.getDiastolicBp() + " mmHg)", Alert.AlertSeverity.WARNING);
            }
        }

        // ── 2. TACHYCARDIE ────────────────────────────────────────
        if (vitals.getHeartRate() != null) {

            if (vitals.getHeartRate() > 120) {
                Alert alert = buildAlert(currentUser, vitals,
                        Alert.AlertType.TACHYCARDIA, Alert.AlertSeverity.CRITICAL,
                        "Severe tachycardia: " + vitals.getHeartRate() + " bpm. Heart rate critically elevated.",
                        "🚨 Sit or lie down immediately. Call your doctor. Breathe slowly (4s in, 4s hold, 6s out). Do not drive."
                );
                alertRepository.save(alert);
                sendAlertEmail(userEmail, userName, alert, vitals); // ← EMAIL

                saveExam(vitals, "Cardiac monitoring (ECG)", "Recommended — severe tachycardia detected (" + vitals.getHeartRate() + " bpm)", Alert.AlertSeverity.CRITICAL);
                saveExam(vitals, "Thyroid function test", "Recommended — rule out hyperthyroidism after tachycardia", Alert.AlertSeverity.CRITICAL);

            } else if (vitals.getHeartRate() > 100) {
                Alert alert = buildAlert(currentUser, vitals,
                        Alert.AlertType.TACHYCARDIA, Alert.AlertSeverity.WARNING,
                        "Elevated heart rate: " + vitals.getHeartRate() + " bpm.",
                        "💡 Rest 15 min in calm environment. Drink cold water slowly. Avoid caffeine and stress. Inform doctor if recurrent."
                );
                alertRepository.save(alert);

                saveExam(vitals, "Heart rate follow-up", "Recommended — elevated heart rate (" + vitals.getHeartRate() + " bpm)", Alert.AlertSeverity.WARNING);
            }

            if (vitals.getHeartRate() < 50) {
                Alert alert = buildAlert(currentUser, vitals,
                        Alert.AlertType.TACHYCARDIA, Alert.AlertSeverity.DANGER,
                        "Bradycardia detected: " + vitals.getHeartRate() + " bpm.",
                        "⚠️ Lie down and rest. Call your doctor if you feel dizzy or short of breath."
                );
                alertRepository.save(alert);
                sendAlertEmail(userEmail, userName, alert, vitals); // ← EMAIL

                saveExam(vitals, "Cardiac monitoring (ECG)", "Recommended — bradycardia detected (" + vitals.getHeartRate() + " bpm)", Alert.AlertSeverity.DANGER);
            }
        }

        // ── 3. FIÈVRE ─────────────────────────────────────────────
        if (vitals.getTemperatureC() != null) {

            if (vitals.getTemperatureC() > 39.0) {
                Alert alert = buildAlert(currentUser, vitals,
                        Alert.AlertType.FEVER, Alert.AlertSeverity.CRITICAL,
                        "High fever: " + vitals.getTemperatureC() + "°C. Immediate medical attention required.",
                        "🚨 Go to emergency room. Take paracetamol only if prescribed. Apply cool cloths. Drink cold water. No aspirin or ibuprofen."
                );
                alertRepository.save(alert);
                sendAlertEmail(userEmail, userName, alert, vitals); // ← EMAIL

                saveExam(vitals, "Infectious disease blood test", "Recommended — high fever (" + vitals.getTemperatureC() + "°C) requires infection screening", Alert.AlertSeverity.CRITICAL);
                saveExam(vitals, "Urine culture test", "Recommended — rule out urinary infection after high fever", Alert.AlertSeverity.CRITICAL);
                saveExam(vitals, "Fetal monitoring (CTG)", "Recommended — check fetal wellbeing after high fever", Alert.AlertSeverity.CRITICAL);

            } else if (vitals.getTemperatureC() > 38.0) {
                Alert alert = buildAlert(currentUser, vitals,
                        Alert.AlertType.FEVER, Alert.AlertSeverity.DANGER,
                        "Fever detected: " + vitals.getTemperatureC() + "°C.",
                        "⚠️ Rest in cool room. Drink 2L water. Take paracetamol as directed. No aspirin. Contact doctor if fever persists 24h."
                );
                alertRepository.save(alert);
                sendAlertEmail(userEmail, userName, alert, vitals); // ← EMAIL

                saveExam(vitals, "Blood count (CBC)", "Recommended — fever (" + vitals.getTemperatureC() + "°C) detected", Alert.AlertSeverity.DANGER);
                saveExam(vitals, "Urine analysis", "Recommended — rule out UTI after fever episode", Alert.AlertSeverity.DANGER);
            }
        }

        // ── 4. OXYGÈNE ────────────────────────────────────────────
        if (vitals.getOxygenPct() != null) {

            if (vitals.getOxygenPct() < 92) {
                Alert alert = buildAlert(currentUser, vitals,
                        Alert.AlertType.OXYGEN, Alert.AlertSeverity.CRITICAL,
                        "Critically low oxygen: " + vitals.getOxygenPct() + "%. Baby may not be receiving enough oxygen.",
                        "🚨 Call emergency services immediately. Sit upright or left side. Open windows. Breathe slowly through nose. Do not drive."
                );
                alertRepository.save(alert);
                sendAlertEmail(userEmail, userName, alert, vitals); // ← EMAIL

                saveExam(vitals, "Emergency fetal monitoring (CTG)", "Recommended — critical SpO2 (" + vitals.getOxygenPct() + "%) — fetal distress risk", Alert.AlertSeverity.CRITICAL);
                saveExam(vitals, "Arterial blood gas test", "Recommended — evaluate oxygen levels after critical SpO2 reading", Alert.AlertSeverity.CRITICAL);
                saveExam(vitals, "Chest X-ray (if prescribed)", "Recommended — rule out respiratory issue after low oxygen", Alert.AlertSeverity.CRITICAL);

            } else if (vitals.getOxygenPct() < 95) {
                Alert alert = buildAlert(currentUser, vitals,
                        Alert.AlertType.OXYGEN, Alert.AlertSeverity.DANGER,
                        "Low oxygen saturation: " + vitals.getOxygenPct() + "%.",
                        "⚠️ Sit upright. Take slow deep breaths. Open windows. Avoid exertion. Call doctor if SpO2 doesn't improve in 10 min."
                );
                alertRepository.save(alert);
                sendAlertEmail(userEmail, userName, alert, vitals); // ← EMAIL

                saveExam(vitals, "Fetal monitoring (CTG)", "Recommended — low SpO2 (" + vitals.getOxygenPct() + "%) detected", Alert.AlertSeverity.DANGER);
                saveExam(vitals, "Blood count (CBC)", "Recommended — check for anemia after low oxygen reading", Alert.AlertSeverity.DANGER);
            }
        }

        // ── 5. GLYCÉMIE ───────────────────────────────────────────
        if (vitals.getGlucoseMmol() != null) {

            if (vitals.getGlucoseMmol() < 3.0) {
                Alert alert = buildAlert(currentUser, vitals,
                        Alert.AlertType.HYPOGLYCEMIA, Alert.AlertSeverity.CRITICAL,
                        "Severe hypoglycemia: " + vitals.getGlucoseMmol() + " mmol/L. Dangerously low blood sugar.",
                        "🚨 Consume fast sugar immediately: 200ml juice OR 3 glucose tablets OR 1 tbsp honey. Rest 15 min. Recheck glucose. Call doctor if faint."
                );
                alertRepository.save(alert);
                sendAlertEmail(userEmail, userName, alert, vitals); // ← EMAIL

                saveExam(vitals, "Fasting glucose test", "Recommended — severe hypoglycemia (" + vitals.getGlucoseMmol() + " mmol/L)", Alert.AlertSeverity.CRITICAL);
                saveExam(vitals, "HbA1c blood test", "Recommended — evaluate long-term glucose control after critical reading", Alert.AlertSeverity.CRITICAL);

            } else if (vitals.getGlucoseMmol() < 4.0) {
                Alert alert = buildAlert(currentUser, vitals,
                        Alert.AlertType.HYPOGLYCEMIA, Alert.AlertSeverity.WARNING,
                        "Low blood glucose: " + vitals.getGlucoseMmol() + " mmol/L.",
                        "💡 Eat complex carbs: bread, crackers or banana. Avoid sugary drinks. Eat small meals every 2-3 hours."
                );
                alertRepository.save(alert);

                saveExam(vitals, "Glucose monitoring test", "Recommended — low glucose (" + vitals.getGlucoseMmol() + " mmol/L)", Alert.AlertSeverity.WARNING);

            } else if (vitals.getGlucoseMmol() > 9.0) {
                Alert alert = buildAlert(currentUser, vitals,
                        Alert.AlertType.HYPOGLYCEMIA, Alert.AlertSeverity.WARNING,
                        "High blood glucose: " + vitals.getGlucoseMmol() + " mmol/L (hyperglycemia).",
                        "💡 Drink water. Avoid carbs and sugar. Gentle walk if feeling well. Recheck in 2h. Contact doctor — gestational diabetes monitoring needed."
                );
                alertRepository.save(alert);

                saveExam(vitals, "Gestational diabetes screening (OGTT)", "Recommended — high glucose (" + vitals.getGlucoseMmol() + " mmol/L) detected", Alert.AlertSeverity.WARNING);
                saveExam(vitals, "HbA1c blood test", "Recommended — evaluate long-term glucose control", Alert.AlertSeverity.WARNING);
            }
        }
    }

    // ── Envoie l'email d'alerte ──────────────────────────────────
    private void sendAlertEmail(String email, String name,
                                Alert alert, Vitals vitals) {
        if (email == null || email.isEmpty()) {
            log.warn("No email found for user — skipping alert email");
            return;
        }

        String severityLabel = alert.getSeverity() == Alert.AlertSeverity.CRITICAL
                ? "🚨 CRITICAL ALERT" : "⚠️ HEALTH ALERT";
        String headerColor   = alert.getSeverity() == Alert.AlertSeverity.CRITICAL
                ? "#c94d6a" : "#d97b58";
        String subject       = alert.getSeverity() == Alert.AlertSeverity.CRITICAL
                ? "🚨 TFAKADNI — CRITICAL health alert detected!"
                : "⚠️ TFAKADNI — Health alert: " + alert.getMessage();

        // Valeurs vitals pour affichage
        String bpDisplay   = (vitals.getSystolicBp() != null && vitals.getDiastolicBp() != null)
                ? vitals.getSystolicBp() + "/" + vitals.getDiastolicBp() + " mmHg" : "—";
        String hrDisplay   = vitals.getHeartRate()   != null ? vitals.getHeartRate()   + " bpm" : "—";
        String o2Display   = vitals.getOxygenPct()   != null ? vitals.getOxygenPct()   + "%"    : "—";
        String tmpDisplay  = vitals.getTemperatureC()!= null ? vitals.getTemperatureC()+ "°C"   : "—";
        String gluDisplay  = vitals.getGlucoseMmol() != null ? vitals.getGlucoseMmol()+ " mmol/L" : "—";

        String html = """
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"/></head>
        <body style="margin:0; padding:0; background:#f7ede4; font-family:Arial,sans-serif;">

          <table width="100%%" cellpadding="0" cellspacing="0"
                 style="background:#f7ede4; padding:32px 16px;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0"
                     style="background:#ffffff; border-radius:24px; overflow:hidden;
                            box-shadow:0 4px 24px rgba(201,77,106,0.15);">

                <!-- HEADER -->
                <tr>
                  <td style="background:%s; padding:32px 40px; text-align:center;">
                    <p style="margin:0 0 6px; font-size:36px;">🏥</p>
                    <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;
                                font-family:Georgia,serif;">TFAKADNI</h1>
                    <p style="margin:6px 0 0; color:rgba(255,255,255,0.85); font-size:12px;
                               letter-spacing:0.12em; text-transform:uppercase;">
                      Pregnancy Health Companion
                    </p>
                  </td>
                </tr>

                <!-- ALERT BANNER -->
                <tr>
                  <td style="background:%s22; padding:16px 40px; text-align:center;
                              border-bottom:2px solid %s44;">
                    <p style="margin:0; color:%s; font-size:18px; font-weight:700;
                               letter-spacing:0.05em;">
                      %s
                    </p>
                  </td>
                </tr>

                <!-- BODY -->
                <tr>
                  <td style="padding:36px 40px;">

                    <p style="margin:0 0 20px; color:#7a5c65; font-size:14px;">
                      Dear <strong style="color:#1e1215;">%s</strong>,<br/>
                      A health alert has been detected from your latest vitals measurement.
                      Please read carefully and act accordingly.
                    </p>

                    <!-- Alert message -->
                    <table width="100%%" cellpadding="0" cellspacing="0"
                           style="background:%s15; border-radius:14px;
                                  border-left:4px solid %s; margin-bottom:24px;">
                      <tr>
                        <td style="padding:18px 20px;">
                          <p style="margin:0 0 8px; color:%s; font-size:13px; font-weight:700;
                                     text-transform:uppercase; letter-spacing:0.08em;">
                            Alert detected
                          </p>
                          <p style="margin:0; color:#1e1215; font-size:15px; font-weight:600;
                                     line-height:1.5;">
                            %s
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Vitals snapshot -->
                    <table width="100%%" cellpadding="0" cellspacing="0"
                           style="background:#f7ede4; border-radius:14px; margin-bottom:24px;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <p style="margin:0 0 12px; color:#7a5c65; font-size:11px; font-weight:700;
                                     text-transform:uppercase; letter-spacing:0.1em;">
                            Your measurements
                          </p>
                          <table width="100%%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:4px 0; color:#4a3038; font-size:13px; width:50%%;">
                                ❤️ Blood Pressure: <strong>%s</strong>
                              </td>
                              <td style="padding:4px 0; color:#4a3038; font-size:13px;">
                                💓 Heart Rate: <strong>%s</strong>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:4px 0; color:#4a3038; font-size:13px;">
                                🫁 Oxygen: <strong>%s</strong>
                              </td>
                              <td style="padding:4px 0; color:#4a3038; font-size:13px;">
                                🌡️ Temperature: <strong>%s</strong>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:4px 0; color:#4a3038; font-size:13px;">
                                🩸 Glucose: <strong>%s</strong>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Recommendation -->
                    <table width="100%%" cellpadding="0" cellspacing="0"
                           style="background:#fff0f5; border-radius:14px;
                                  border:1.5px solid #f5c6d0; margin-bottom:28px;">
                      <tr>
                        <td style="padding:18px 20px;">
                          <p style="margin:0 0 8px; color:#c94d6a; font-size:11px; font-weight:700;
                                     text-transform:uppercase; letter-spacing:0.1em;">
                            What to do now
                          </p>
                          <p style="margin:0; color:#4a3038; font-size:14px; line-height:1.7;">
                            %s
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA -->
                    <div style="text-align:center; margin-bottom:8px;">
                      <a href="http://localhost:4200/mother/vitals"
                         style="display:inline-block; background:%s; color:#ffffff;
                                padding:14px 32px; border-radius:30px; text-decoration:none;
                                font-weight:700; font-size:15px;">
                        View my vitals dashboard
                      </a>
                    </div>
                    <p style="text-align:center; margin:12px 0 0; color:#7a5c65;
                               font-size:12px; font-style:italic;">
                      If you feel unwell, contact your doctor or emergency services immediately.
                    </p>

                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td style="background:#f7ede4; padding:16px 40px; text-align:center;
                              border-top:1px solid #f5c6d0;">
                    <p style="margin:0; color:#7a5c65; font-size:11px; line-height:1.6;">
                      TFAKADNI · Pregnancy Health Companion<br/>
                      This alert was generated automatically from your vitals measurement.<br/>
                      Always consult your healthcare provider for medical decisions.
                    </p>
                  </td>
                </tr>

              </table>
            </td></tr>
          </table>

        </body>
        </html>
        """.formatted(
                headerColor,
                headerColor, headerColor,
                headerColor, severityLabel,
                name,
                headerColor, headerColor, headerColor,
                alert.getMessage(),
                bpDisplay, hrDisplay,
                o2Display, tmpDisplay,
                gluDisplay,
                alert.getRecommendation(),
                headerColor
        );

        log.info("Sending vital alert email to {} — {}", email, alert.getSeverity());
        emailService.sendEmail(email, subject, html);
    }

    // ── Helper : construire une alerte ───────────────────────────
    private Alert buildAlert(User user, Vitals vitals,
                             Alert.AlertType type, Alert.AlertSeverity severity,
                             String message, String recommendation) {
        Alert alert = new Alert();
        alert.setUser(user);
        alert.setVital(vitals);
        alert.setAlertType(type);
        alert.setSeverity(severity);
        alert.setMessage(message);
        alert.setRecommendation(recommendation);
        return alert;
    }

    // ── Helper : créer un examen lié au vital ────────────────────
    private void saveExam(Vitals vitals, String examName,
                          String notes, Alert.AlertSeverity severity) {
        if (vitals.getPregnancy() == null) return;

        PrenatalExam exam = new PrenatalExam();
        exam.setExamName(examName);
        exam.setExamType(PrenatalExam.ExamType.CUSTOM);
        exam.setResultNotes(notes);
        exam.setDone(false);
        exam.setPregnancy(vitals.getPregnancy());
        exam.setVital(vitals);
        exam.setAlertSeverity(severity.name());
        if (vitals.getPregnancy().getLmpDate() != null) {
            long days = java.time.temporal.ChronoUnit.DAYS.between(
                    vitals.getPregnancy().getLmpDate(),
                    java.time.LocalDate.now()
            );
            exam.setRecommendedWeek((int) (days / 7));
        }
        prenatalExamRepository.save(exam);
    }
}