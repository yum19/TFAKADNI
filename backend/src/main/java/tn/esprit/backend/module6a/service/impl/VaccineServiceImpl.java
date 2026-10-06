package tn.esprit.backend.module6a.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.module6a.dto.VaccineRequestDTO;
import tn.esprit.backend.module6a.dto.VaccineResponseDTO;
import tn.esprit.backend.module6a.entity.Baby;
import tn.esprit.backend.module6a.entity.Vaccine;
import tn.esprit.backend.module6a.exception.BabyNotFoundException;
import tn.esprit.backend.module6a.exception.InvalidDateRangeException;
import tn.esprit.backend.module6a.exception.InvalidEnumValueException;
import tn.esprit.backend.module6a.exception.Module6aBadRequestException;
import tn.esprit.backend.module6a.exception.Module6aResourceNotFoundException;
import tn.esprit.backend.module6a.repository.BabyRepository;
import tn.esprit.backend.module6a.repository.VaccineRepository;
import tn.esprit.backend.module6a.service.IReminderService;
import tn.esprit.backend.module6a.service.IVaccineService;
import tn.esprit.backend.repository.UserRepository;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class VaccineServiceImpl implements IVaccineService {

    private final VaccineRepository vaccineRepository;
    private final BabyRepository babyRepository;
    private final IReminderService reminderService;
    private final UserRepository userRepository;

    @Override
    public VaccineResponseDTO createVaccine(String email, Long babyId, VaccineRequestDTO request) {
        User currentUser = getUserByEmail(email);
        Baby baby = getOwnedBabyOrThrow(currentUser, babyId);
        validateVaccineRequest(request, baby);

        Vaccine vaccine = Vaccine.builder()
                .baby(baby)
                .vaccineName(normalizeText(request.getVaccineName()))
                .scheduledDate(request.getScheduledDate())
                .takenDate(request.getTakenDate())
                .status(normalizeStatus(request.getStatus()))
                .reminderDate(request.getReminderDate())
                .batchNumber(normalizeText(request.getBatchNumber()))
                .administeredBy(normalizeText(request.getAdministeredBy()))
                .notes(normalizeText(request.getNotes()))
                .build();

        Vaccine savedVaccine = vaccineRepository.save(vaccine);

        if (savedVaccine.getReminderDate() != null) {
            reminderService.createOrUpdateAutoReminder(
                    babyId,
                    "VACCINE",
                    savedVaccine.getReminderDate().atStartOfDay(),
                    "Rappel vaccin : " + savedVaccine.getVaccineName() +
                            " prévu le " + savedVaccine.getScheduledDate(),
                    "VACCINE",
                    savedVaccine.getId()
            );
        }

        return mapToResponse(savedVaccine);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VaccineResponseDTO> getAllVaccinesByBaby(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        return vaccineRepository.findByBabyIdOrderByScheduledDateAscIdAsc(babyId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public VaccineResponseDTO getVaccineById(String email, Long babyId, Long vaccineId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        Vaccine vaccine = vaccineRepository.findByIdAndBabyId(vaccineId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Vaccine introuvable : " + vaccineId));

        return mapToResponse(vaccine);
    }

    @Override
    public VaccineResponseDTO updateVaccine(String email, Long babyId, Long vaccineId, VaccineRequestDTO request) {
        User currentUser = getUserByEmail(email);
        Baby baby = getOwnedBabyOrThrow(currentUser, babyId);
        validateVaccineRequest(request, baby);

        Vaccine vaccine = vaccineRepository.findByIdAndBabyId(vaccineId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Vaccine introuvable : " + vaccineId));

        vaccine.setVaccineName(normalizeText(request.getVaccineName()));
        vaccine.setScheduledDate(request.getScheduledDate());
        vaccine.setTakenDate(request.getTakenDate());
        vaccine.setStatus(normalizeStatus(request.getStatus()));
        vaccine.setReminderDate(request.getReminderDate());
        vaccine.setBatchNumber(normalizeText(request.getBatchNumber()));
        vaccine.setAdministeredBy(normalizeText(request.getAdministeredBy()));
        vaccine.setNotes(normalizeText(request.getNotes()));

        Vaccine updatedVaccine = vaccineRepository.save(vaccine);

        if (updatedVaccine.getReminderDate() != null) {
            reminderService.createOrUpdateAutoReminder(
                    babyId,
                    "VACCINE",
                    updatedVaccine.getReminderDate().atStartOfDay(),
                    "Rappel vaccin : " + updatedVaccine.getVaccineName() +
                            " prévu le " + updatedVaccine.getScheduledDate(),
                    "VACCINE",
                    updatedVaccine.getId()
            );
        } else {
            reminderService.deleteAutoReminder(babyId, "VACCINE", updatedVaccine.getId());
        }

        return mapToResponse(updatedVaccine);
    }

    @Override
    public void deleteVaccine(String email, Long babyId, Long vaccineId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        Vaccine vaccine = vaccineRepository.findByIdAndBabyId(vaccineId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Vaccine introuvable : " + vaccineId));

        reminderService.deleteAutoReminder(babyId, "VACCINE", vaccine.getId());
        vaccineRepository.delete(vaccine);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VaccineResponseDTO> getUpcomingVaccines(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        return vaccineRepository.findByBabyIdOrderByScheduledDateAscIdAsc(babyId)
                .stream()
                .filter(v -> "SCHEDULED".equals(v.getStatus()))
                .filter(v -> !v.getScheduledDate().isBefore(LocalDate.now()))
                .filter(v -> !v.getScheduledDate().isAfter(LocalDate.now().plusDays(30)))
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VaccineResponseDTO> getOverdueVaccines(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        return vaccineRepository.findByBabyIdOrderByScheduledDateAscIdAsc(babyId)
                .stream()
                .filter(v -> "SCHEDULED".equals(v.getStatus()))
                .filter(v -> v.getScheduledDate().isBefore(LocalDate.now()))
                .map(this::mapToResponse)
                .toList();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }

    private Baby getOwnedBabyOrThrow(User currentUser, Long babyId) {
        return babyRepository.findByIdAndMotherId(babyId, currentUser.getId())
                .orElseThrow(() -> new BabyNotFoundException("Bébé introuvable ou accès refusé"));
    }

    private VaccineResponseDTO mapToResponse(Vaccine vaccine) {
        return VaccineResponseDTO.builder()
                .id(vaccine.getId())
                .babyId(vaccine.getBaby().getId())
                .vaccineName(vaccine.getVaccineName())
                .scheduledDate(vaccine.getScheduledDate())
                .takenDate(vaccine.getTakenDate())
                .status(vaccine.getStatus())
                .reminderDate(vaccine.getReminderDate())
                .batchNumber(vaccine.getBatchNumber())
                .administeredBy(vaccine.getAdministeredBy())
                .notes(vaccine.getNotes())
                .createdAt(vaccine.getCreatedAt())
                .build();
    }

    private void validateVaccineRequest(VaccineRequestDTO request, Baby baby) {
        if (request.getVaccineName() == null || request.getVaccineName().isBlank()) {
            throw new Module6aBadRequestException("Vaccine name is required");
        }

        if (request.getScheduledDate() == null) {
            throw new Module6aBadRequestException("Scheduled date is required");
        }

        if (request.getScheduledDate().isBefore(baby.getBirthDate())) {
            throw new InvalidDateRangeException("Scheduled date cannot be before baby's birth date");
        }

        if (request.getStatus() == null || request.getStatus().isBlank()) {
            throw new Module6aBadRequestException("Vaccine status is required");
        }

        String status = normalizeStatus(request.getStatus());

        if (!status.equals("SCHEDULED")
                && !status.equals("DONE")
                && !status.equals("MISSED")
                && !status.equals("CANCELLED")) {
            throw new InvalidEnumValueException("Invalid vaccine status");
        }

        if (request.getTakenDate() != null && request.getTakenDate().isBefore(baby.getBirthDate())) {
            throw new InvalidDateRangeException("Taken date cannot be before baby's birth date");
        }

        if (request.getReminderDate() != null && request.getReminderDate().isBefore(baby.getBirthDate())) {
            throw new InvalidDateRangeException("Reminder date cannot be before baby's birth date");
        }

        if (status.equals("DONE") && request.getTakenDate() == null) {
            throw new Module6aBadRequestException("Taken date is required when status is DONE");
        }

        if (!status.equals("DONE") && request.getTakenDate() != null) {
            throw new Module6aBadRequestException("Taken date is only allowed when status is DONE");
        }

        if (request.getTakenDate() != null && request.getTakenDate().isAfter(LocalDate.now())) {
            throw new InvalidDateRangeException("Taken date cannot be in the future");
        }

        if (request.getTakenDate() != null && request.getTakenDate().isBefore(request.getScheduledDate())) {
            throw new InvalidDateRangeException("Taken date cannot be before scheduled date");
        }

        if (request.getReminderDate() != null && request.getReminderDate().isAfter(request.getScheduledDate())) {
            throw new InvalidDateRangeException("Reminder date should be on or before scheduled date");
        }

        if (status.equals("DONE") && (request.getBatchNumber() == null || request.getBatchNumber().isBlank())) {
            throw new Module6aBadRequestException("Batch number is required when status is DONE");
        }

        if (status.equals("DONE") && (request.getAdministeredBy() == null || request.getAdministeredBy().isBlank())) {
            throw new Module6aBadRequestException("Administered by is required when status is DONE");
        }
    }

    private String normalizeStatus(String value) {
        return value == null ? null : value.trim().toUpperCase();
    }

    private String normalizeText(String value) {
        return value == null ? null : value.trim();
    }
}