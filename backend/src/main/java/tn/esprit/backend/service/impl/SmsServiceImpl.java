// tn/esprit/backend/service/impl/SmsServiceImpl.java
package tn.esprit.backend.service.impl;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tn.esprit.backend.service.SmsService;

@Slf4j
@Service
public class SmsServiceImpl implements SmsService {

    @Value("${twilio.account-sid}")
    private String accountSid;

    @Value("${twilio.auth-token}")
    private String authToken;

    @Value("${twilio.from-number}")
    private String fromNumber;

    @PostConstruct
    public void init() {
        Twilio.init(accountSid, authToken);
    }

    @Override
    public void sendSms(String toPhone, String message) {
        if (toPhone == null || toPhone.trim().isBlank()) {
            log.warn("SMS skipped: no phone number provided");
            return;
        }

        try {
            // Clean the phone number aggressively
            String cleaned = toPhone.trim()
                    .replaceAll("[^0-9+]", "")   // keep only digits and +
                    .replaceFirst("^00", "+");   // convert 00... to +

            // Ensure it starts with +216 for Tunisia
            if (!cleaned.startsWith("+216")) {
                if (cleaned.startsWith("216")) {
                    cleaned = "+" + cleaned;
                } else if (cleaned.startsWith("0")) {
                    cleaned = "+216" + cleaned.substring(1);
                } else {
                    cleaned = "+216" + cleaned;
                }
            }

            // Optional: validate length (Tunisia mobile = 12 chars: +216 + 8 digits)
            if (cleaned.length() != 12 || !cleaned.matches("\\+216[0-9]{8}")) {
                log.error("SMS failed to {}: Invalid Tunisian number after cleaning", toPhone);
                return;
            }

            Message.creator(
                    new PhoneNumber(cleaned),      // cleaned E.164
                    new PhoneNumber(fromNumber),
                    message
            ).create();

            log.info("SMS sent successfully to {}", cleaned);
        } catch (Exception e) {
            log.error("SMS failed to {} (original: {}): {}",
                    toPhone, e.getMessage(), e.getClass().getSimpleName());
        }
    }
}