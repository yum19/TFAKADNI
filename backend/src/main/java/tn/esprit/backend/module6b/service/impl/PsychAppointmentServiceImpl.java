package tn.esprit.backend.module6b.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.module6b.dto.PsychAppointmentRequestDto;
import tn.esprit.backend.module6b.dto.PsychAppointmentResponseDto;
import tn.esprit.backend.module6b.entity.PredictionResult;
import tn.esprit.backend.module6b.entity.PsychAppointment;
import tn.esprit.backend.module6b.exception.PostpartumAccountContextException;
import tn.esprit.backend.module6b.exception.PostpartumLinkedDataException;
import tn.esprit.backend.module6b.exception.PostpartumOwnershipException;
import tn.esprit.backend.module6b.exception.PostpartumRecordMissingException;
import tn.esprit.backend.module6b.repository.PredictionResultRepository;
import tn.esprit.backend.module6b.repository.PsychAppointmentRepository;
import tn.esprit.backend.module6b.service.IPsychAppointmentService;
import tn.esprit.backend.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PsychAppointmentServiceImpl implements IPsychAppointmentService {

    private static final String DEFAULT_TYPE = "IN_PERSON";
    private static final String DEFAULT_STATUS = "PLANNED";
    private static final Set<String> ALLOWED_STATUSES = Set.of("PLANNED", "COMPLETED", "CANCELLED");

    private final PsychAppointmentRepository psychAppointmentRepository;
    private final UserRepository userRepository;
    private final PredictionResultRepository predictionResultRepository;

    @Override
    public PsychAppointmentResponseDto createAppointment(String email, PsychAppointmentRequestDto dto) {
        User user = getUserByEmail(email);

        PsychAppointment appointment = new PsychAppointment();
        appointment.setMother(user);
        appointment.setCreatedAt(LocalDateTime.now());
        appointment.setAppointmentDate(dto.getAppointmentDate());
        appointment.setType(normalizeType(dto.getType()));
        appointment.setStatus(DEFAULT_STATUS); // toujours PLANNED au create
        appointment.setLocation(clean(dto.getLocation()));
        appointment.setNotes(clean(dto.getNotes()));
        appointment.setPsychologistName(clean(dto.getPsychologistName()));

        if (dto.getPredictionResultId() != null) {
            PredictionResult predictionResult = predictionResultRepository.findById(dto.getPredictionResultId())
                    .orElseThrow(() -> new PostpartumLinkedDataException(
                            "PredictionResult not found with id: " + dto.getPredictionResultId()
                    ));
            appointment.setPredictionResult(predictionResult);
        } else {
            appointment.setPredictionResult(null);
        }

        return mapToResponse(psychAppointmentRepository.save(appointment));
    }

    @Override
    public List<PsychAppointmentResponseDto> getAppointmentsByMother(String email) {
        User user = getUserByEmail(email);
        return psychAppointmentRepository.findByMotherIdOrderByAppointmentDateDesc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<PsychAppointmentResponseDto> getAppointmentsByMotherAndStatus(String email, String status) {
        User user = getUserByEmail(email);
        return psychAppointmentRepository.findByMotherIdAndStatusOrderByAppointmentDateDesc(
                        user.getId(),
                        normalizeStatus(status)
                )
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public PsychAppointmentResponseDto getAppointmentById(String email, Long id) {
        User user = getUserByEmail(email);
        PsychAppointment appointment = psychAppointmentRepository.findById(id)
                .orElseThrow(() -> new PostpartumRecordMissingException("PsychAppointment not found with id: " + id));

        checkOwner(appointment.getMother().getId(), user.getId());
        return mapToResponse(appointment);
    }

    @Override
    public PsychAppointmentResponseDto updateAppointment(String email, Long id, PsychAppointmentRequestDto dto) {
        User user = getUserByEmail(email);
        PsychAppointment existing = psychAppointmentRepository.findById(id)
                .orElseThrow(() -> new PostpartumRecordMissingException("PsychAppointment not found with id: " + id));

        checkOwner(existing.getMother().getId(), user.getId());

        existing.setAppointmentDate(dto.getAppointmentDate());
        existing.setType(normalizeType(dto.getType()));
        existing.setStatus(normalizeStatus(dto.getStatus()));
        existing.setLocation(clean(dto.getLocation()));
        existing.setNotes(clean(dto.getNotes()));
        existing.setPsychologistName(clean(dto.getPsychologistName()));

        if (dto.getPredictionResultId() != null) {
            PredictionResult predictionResult = predictionResultRepository.findById(dto.getPredictionResultId())
                    .orElseThrow(() -> new PostpartumLinkedDataException(
                            "PredictionResult not found with id: " + dto.getPredictionResultId()
                    ));
            existing.setPredictionResult(predictionResult);
        } else {
            existing.setPredictionResult(null);
        }

        return mapToResponse(psychAppointmentRepository.save(existing));
    }

    @Override
    public void deleteAppointment(String email, Long id) {
        User user = getUserByEmail(email);
        PsychAppointment appointment = psychAppointmentRepository.findById(id)
                .orElseThrow(() -> new PostpartumRecordMissingException("PsychAppointment not found with id: " + id));

        checkOwner(appointment.getMother().getId(), user.getId());
        psychAppointmentRepository.delete(appointment);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new PostpartumAccountContextException("Authenticated postpartum user not found"));
    }

    private void checkOwner(Long ownerId, Long currentUserId) {
        if (ownerId == null || !ownerId.equals(currentUserId)) {
            throw new PostpartumOwnershipException("You are not allowed to access this postpartum resource");
        }
    }

    private String clean(String value) {
        if (value == null) return null;
        String cleaned = value.trim();
        return cleaned.isEmpty() ? null : cleaned;
    }

    private String normalizeType(String value) {
        String type = clean(value);
        return type == null ? DEFAULT_TYPE : type.toUpperCase();
    }

    private String normalizeStatus(String value) {
        String status = clean(value);
        if (status == null) {
            return DEFAULT_STATUS;
        }

        String normalized = status.toUpperCase();
        if (!ALLOWED_STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("Invalid appointment status: " + value);
        }
        return normalized;
    }

    private PsychAppointmentResponseDto mapToResponse(PsychAppointment appointment) {
        return PsychAppointmentResponseDto.builder()
                .id(appointment.getId())
                .motherId(appointment.getMother() != null ? appointment.getMother().getId() : null)
                .predictionResultId(appointment.getPredictionResult() != null ? appointment.getPredictionResult().getId() : null)
                .psychologistName(appointment.getPsychologistName())
                .appointmentDate(appointment.getAppointmentDate())
                .type(appointment.getType())
                .status(appointment.getStatus())
                .location(appointment.getLocation())
                .notes(appointment.getNotes())
                .createdAt(appointment.getCreatedAt())
                .build();
    }
}