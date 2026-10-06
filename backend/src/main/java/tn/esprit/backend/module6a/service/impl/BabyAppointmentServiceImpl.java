package tn.esprit.backend.module6a.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.module6a.dto.BabyAppointmentRequestDTO;
import tn.esprit.backend.module6a.dto.BabyAppointmentResponseDTO;
import tn.esprit.backend.module6a.entity.Baby;
import tn.esprit.backend.module6a.entity.BabyAppointment;
import tn.esprit.backend.module6a.exception.BabyNotFoundException;
import tn.esprit.backend.module6a.exception.InvalidDateRangeException;
import tn.esprit.backend.module6a.exception.InvalidEnumValueException;
import tn.esprit.backend.module6a.exception.Module6aBadRequestException;
import tn.esprit.backend.module6a.exception.Module6aResourceNotFoundException;
import tn.esprit.backend.module6a.repository.BabyAppointmentRepository;
import tn.esprit.backend.module6a.repository.BabyRepository;
import tn.esprit.backend.module6a.service.IBabyAppointmentService;
import tn.esprit.backend.module6a.service.IReminderService;
import tn.esprit.backend.repository.UserRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BabyAppointmentServiceImpl implements IBabyAppointmentService {

    private final BabyAppointmentRepository babyAppointmentRepository;
    private final BabyRepository babyRepository;
    private final IReminderService reminderService;
    private final UserRepository userRepository;

    @Override
    public BabyAppointmentResponseDTO createAppointment(String email, Long babyId, BabyAppointmentRequestDTO request) {
        User currentUser = getUserByEmail(email);
        Baby baby = getOwnedBabyOrThrow(currentUser, babyId);

        validateAppointmentRequest(request, baby, true);

        BabyAppointment appointment = BabyAppointment.builder()
                .baby(baby)
                .appointmentDate(request.getAppointmentDate())
                .doctorName(normalizeText(request.getDoctorName()))
                .type(normalizeType(request.getType()))
                .location(normalizeText(request.getLocation()))
                .status(normalizeStatus(request.getStatus()))
                .reminderDate(request.getReminderDate())
                .notes(normalizeText(request.getNotes()))
                .build();

        BabyAppointment saved = babyAppointmentRepository.save(appointment);

        if (saved.getReminderDate() != null) {
            reminderService.createOrUpdateAutoReminder(
                    babyId,
                    "APPOINTMENT",
                    saved.getReminderDate(),
                    "Rappel rendez-vous : " + saved.getType()
                            + " avec " + saved.getDoctorName()
                            + " le " + saved.getAppointmentDate(),
                    "APPOINTMENT",
                    saved.getId()
            );
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BabyAppointmentResponseDTO> getAllAppointmentsByBaby(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        return babyAppointmentRepository
                .findByBabyIdOrderByAppointmentDateDescIdDesc(babyId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BabyAppointmentResponseDTO getAppointmentById(String email, Long babyId, Long appointmentId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        BabyAppointment appointment = babyAppointmentRepository
                .findByIdAndBabyId(appointmentId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Rendez-vous introuvable : " + appointmentId));

        return mapToResponse(appointment);
    }

    @Override
    public BabyAppointmentResponseDTO updateAppointment(String email, Long babyId, Long appointmentId, BabyAppointmentRequestDTO request) {
        User currentUser = getUserByEmail(email);
        Baby baby = getOwnedBabyOrThrow(currentUser, babyId);

        BabyAppointment appointment = babyAppointmentRepository
                .findByIdAndBabyId(appointmentId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Rendez-vous introuvable : " + appointmentId));

        ensureNotPastForMutation(appointment.getAppointmentDate(), "Impossible de modifier un rendez-vous passé");
        validateAppointmentRequest(request, baby, false);

        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setDoctorName(normalizeText(request.getDoctorName()));
        appointment.setType(normalizeType(request.getType()));
        appointment.setLocation(normalizeText(request.getLocation()));
        appointment.setStatus(normalizeStatus(request.getStatus()));
        appointment.setReminderDate(request.getReminderDate());
        appointment.setNotes(normalizeText(request.getNotes()));

        BabyAppointment updated = babyAppointmentRepository.save(appointment);

        if (updated.getReminderDate() != null) {
            reminderService.createOrUpdateAutoReminder(
                    babyId,
                    "APPOINTMENT",
                    updated.getReminderDate(),
                    "Rappel rendez-vous : " + updated.getType()
                            + " avec " + updated.getDoctorName()
                            + " le " + updated.getAppointmentDate(),
                    "APPOINTMENT",
                    updated.getId()
            );
        } else {
            reminderService.deleteAutoReminder(babyId, "APPOINTMENT", updated.getId());
        }

        return mapToResponse(updated);
    }

    @Override
    public void deleteAppointment(String email, Long babyId, Long appointmentId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        BabyAppointment appointment = babyAppointmentRepository
                .findByIdAndBabyId(appointmentId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Rendez-vous introuvable : " + appointmentId));

        ensureNotPastForMutation(appointment.getAppointmentDate(), "Impossible de supprimer un rendez-vous passé");

        reminderService.deleteAutoReminder(babyId, "APPOINTMENT", appointment.getId());
        babyAppointmentRepository.delete(appointment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BabyAppointmentResponseDTO> getUpcomingAppointments(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        return babyAppointmentRepository
                .findByBabyIdAndAppointmentDateAfterOrderByAppointmentDateAscIdAsc(babyId, LocalDateTime.now())
                .stream()
                .filter(a -> "PLANNED".equals(a.getStatus()))
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BabyAppointmentResponseDTO> getAppointmentHistory(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        return babyAppointmentRepository
                .findByBabyIdAndAppointmentDateBeforeOrderByAppointmentDateDescIdDesc(babyId, LocalDateTime.now())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }

    private Baby getOwnedBabyOrThrow(User user, Long babyId) {
        return babyRepository.findByIdAndMotherId(babyId, user.getId())
                .orElseThrow(() -> new BabyNotFoundException("Bébé introuvable ou accès refusé"));
    }

    private BabyAppointmentResponseDTO mapToResponse(BabyAppointment appointment) {
        return BabyAppointmentResponseDTO.builder()
                .id(appointment.getId())
                .babyId(appointment.getBaby().getId())
                .appointmentDate(appointment.getAppointmentDate())
                .doctorName(appointment.getDoctorName())
                .type(appointment.getType())
                .location(appointment.getLocation())
                .status(appointment.getStatus())
                .reminderDate(appointment.getReminderDate())
                .notes(appointment.getNotes())
                .createdAt(appointment.getCreatedAt())
                .upcoming(appointment.getAppointmentDate() != null
                        && appointment.getAppointmentDate().isAfter(LocalDateTime.now()))
                .build();
    }

    private void validateAppointmentRequest(BabyAppointmentRequestDTO request, Baby baby, boolean creationMode) {
        if (request.getAppointmentDate() == null) {
            throw new Module6aBadRequestException("Appointment date is required");
        }

        if (request.getAppointmentDate().toLocalDate().isBefore(baby.getBirthDate())) {
            throw new InvalidDateRangeException("Appointment date cannot be before baby's birth date");
        }

        if (request.getAppointmentDate().toLocalDate().isBefore(LocalDate.now())) {
            throw new InvalidDateRangeException("Appointment date cannot be before today");
        }

        if (request.getDoctorName() == null || request.getDoctorName().isBlank()) {
            throw new Module6aBadRequestException("Doctor name is required");
        }

        if (request.getType() == null || request.getType().isBlank()) {
            throw new Module6aBadRequestException("Appointment type is required");
        }

        String type = normalizeType(request.getType());
        if (!type.equals("PEDIATRE")
                && !type.equals("VACCIN")
                && !type.equals("CONTROLE")
                && !type.equals("URGENCE")
                && !type.equals("AUTRE")) {
            throw new InvalidEnumValueException("Invalid appointment type");
        }

        if (request.getStatus() == null || request.getStatus().isBlank()) {
            throw new Module6aBadRequestException("Appointment status is required");
        }

        String status = normalizeStatus(request.getStatus());
        if (!status.equals("PLANNED")
                && !status.equals("DONE")
                && !status.equals("CANCELLED")
                && !status.equals("MISSED")) {
            throw new InvalidEnumValueException("Invalid appointment status");
        }

        if (creationMode && !status.equals("PLANNED")) {
            throw new Module6aBadRequestException("New appointments must be created with PLANNED status");
        }

        if (request.getReminderDate() != null
                && request.getReminderDate().isAfter(request.getAppointmentDate())) {
            throw new InvalidDateRangeException("Reminder date must be before or equal to appointment date");
        }

        if (request.getReminderDate() != null
                && request.getReminderDate().toLocalDate().isBefore(baby.getBirthDate())) {
            throw new InvalidDateRangeException("Reminder date cannot be before baby's birth date");
        }
    }

    private void ensureNotPastForMutation(LocalDateTime appointmentDate, String message) {
        if (appointmentDate != null && appointmentDate.toLocalDate().isBefore(LocalDate.now())) {
            throw new Module6aBadRequestException(message);
        }
    }

    private String normalizeType(String value) {
        return value == null ? null : value.trim().toUpperCase();
    }

    private String normalizeStatus(String value) {
        return value == null ? null : value.trim().toUpperCase();
    }

    private String normalizeText(String value) {
        return value == null ? null : value.trim();
    }
}