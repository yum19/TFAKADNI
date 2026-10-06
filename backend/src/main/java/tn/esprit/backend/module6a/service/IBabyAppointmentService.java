package tn.esprit.backend.module6a.service;

import tn.esprit.backend.module6a.dto.BabyAppointmentRequestDTO;
import tn.esprit.backend.module6a.dto.BabyAppointmentResponseDTO;

import java.util.List;

public interface IBabyAppointmentService {

    BabyAppointmentResponseDTO createAppointment(String email, Long babyId, BabyAppointmentRequestDTO request);

    List<BabyAppointmentResponseDTO> getAllAppointmentsByBaby(String email, Long babyId);

    BabyAppointmentResponseDTO getAppointmentById(String email, Long babyId, Long appointmentId);

    BabyAppointmentResponseDTO updateAppointment(String email, Long babyId, Long appointmentId, BabyAppointmentRequestDTO request);

    void deleteAppointment(String email, Long babyId, Long appointmentId);

    List<BabyAppointmentResponseDTO> getUpcomingAppointments(String email, Long babyId);

    List<BabyAppointmentResponseDTO> getAppointmentHistory(String email, Long babyId);
}