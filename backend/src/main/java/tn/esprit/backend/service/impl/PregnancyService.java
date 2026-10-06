package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.entity.Pregnancy;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.repository.AlertRepository;
import tn.esprit.backend.repository.PregnancyRepository;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.repository.VitalsRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
@RequiredArgsConstructor
public class PregnancyService {

    private final PregnancyRepository pregnancyRepository;
    private final AlertRepository alertRepository;
    private final VitalsRepository vitalsRepository;
    private final PrenatalExamService prenatalExamService;
    private final UserRepository userRepository;

    /* private static final Long USER_ID = 1L;
    private static final Long ADMIN_ID = 2L;
    private static final Long PARTNER_ID = 3L; */

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public Pregnancy create(Pregnancy pregnancy) {
        User currentUser = getAuthenticatedUser();
        Pregnancy existing = pregnancyRepository
                .findByUserIdAndStatus(currentUser.getId(), Pregnancy.PregnancyStatus.ACTIVE);
        if (existing != null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Une grossesse active existe déjà. Clôturez-la avant d'en créer une nouvelle."
            );
        }

        User user = new User();
        user.setId(currentUser.getId());
        pregnancy.setUser(user);
        if (pregnancy.getLmpDate() != null) {
            pregnancy.setDueDate(pregnancy.getLmpDate().plusDays(280));
        }

        // 1. Sauvegarder la grossesse
        Pregnancy saved = pregnancyRepository.save(pregnancy);

        // 2. Générer automatiquement les examens standards ← NOUVEAU
        prenatalExamService.generateStandardExams(saved);

        return saved;
    }

    public List<Pregnancy> getMyPregnancies() {
        User currentUser = getAuthenticatedUser();
        List<Pregnancy> list = pregnancyRepository.findByUserId(currentUser.getId());
        list.forEach(p -> {
            Pregnancy.PregnancyStatus calculated = calculateStatus(p);
            if (calculated != p.getStatus()) {
                p.setStatus(calculated);
                pregnancyRepository.save(p);
            }
        });
        return list;
    }

    public Pregnancy getActive() {
        User currentUser = getAuthenticatedUser();
        return pregnancyRepository.findByUserIdAndStatus(
                currentUser.getId(), Pregnancy.PregnancyStatus.ACTIVE);
    }

    public Pregnancy getById(Long id) {
        Pregnancy pregnancy = pregnancyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Grossesse non trouvée"));
        Pregnancy.PregnancyStatus calculatedStatus = calculateStatus(pregnancy);
        if (calculatedStatus != pregnancy.getStatus()) {
            pregnancy.setStatus(calculatedStatus);
            pregnancyRepository.save(pregnancy);
        }
        return pregnancy;
    }

    public Pregnancy update(Long id, Pregnancy updated) {
        Pregnancy existing = getById(id);
        existing.setLmpDate(updated.getLmpDate());
        existing.setDueDate(updated.getLmpDate().plusDays(280));
        existing.setHospitalName(updated.getHospitalName());
        existing.setDoctorName(updated.getDoctorName());
        existing.setNotes(updated.getNotes());
        existing.setPregnancyType(updated.getPregnancyType());
        existing.setIsSharedPartner(updated.getIsSharedPartner());
        return pregnancyRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        Pregnancy pregnancy = getById(id);

        // 1. Supprimer les alertes liées aux vitals
        if (pregnancy.getVitals() != null) {
            pregnancy.getVitals().forEach(v ->
                    alertRepository.deleteByVitalId(v.getId()));
        }

        // 2. Supprimer les vitals
        vitalsRepository.deleteByPregnancyId(pregnancy.getId());

        // 3. Supprimer la grossesse (examens supprimés en cascade via orphanRemoval)
        pregnancyRepository.deleteById(id);
    }

    public int getCurrentWeek(Pregnancy pregnancy) {
        if (pregnancy.getLmpDate() == null) return 0;
        long days = java.time.temporal.ChronoUnit.DAYS
                .between(pregnancy.getLmpDate(), LocalDate.now());
        return (int) (days / 7);
    }

    public Pregnancy getActiveForPartner() {
        User currentUser = getAuthenticatedUser();
        return pregnancyRepository.findByUserIdAndStatus(
                currentUser.getId(), Pregnancy.PregnancyStatus.ACTIVE);
    }

    public List<Pregnancy> getAllForAdmin() {
        return pregnancyRepository.findAll();
    }

    public Pregnancy updateStatus(Long id, Pregnancy.PregnancyStatus status) {
        if (status == Pregnancy.PregnancyStatus.ACTIVE ||
                status == Pregnancy.PregnancyStatus.COMPLETED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Les statuts ACTIVE et COMPLETED sont gérés automatiquement."
            );
        }
        Pregnancy existing = getById(id);
        existing.setStatus(status);
        return pregnancyRepository.save(existing);
    }

    private Pregnancy.PregnancyStatus calculateStatus(Pregnancy pregnancy) {
        if (pregnancy.getStatus() == Pregnancy.PregnancyStatus.MISCARRIAGE ||
                pregnancy.getStatus() == Pregnancy.PregnancyStatus.TERMINATED) {
            return pregnancy.getStatus();
        }
        if (pregnancy.getDueDate() != null &&
                LocalDate.now().isAfter(pregnancy.getDueDate())) {
            return Pregnancy.PregnancyStatus.COMPLETED;
        }
        return Pregnancy.PregnancyStatus.ACTIVE;
    }
}