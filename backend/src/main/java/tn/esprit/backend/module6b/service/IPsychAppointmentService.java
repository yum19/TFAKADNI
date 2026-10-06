package tn.esprit.backend.module6b.service;

import tn.esprit.backend.module6b.dto.PsychAppointmentRequestDto;
import tn.esprit.backend.module6b.dto.PsychAppointmentResponseDto;

import java.util.List;

public interface IPsychAppointmentService {

    PsychAppointmentResponseDto createAppointment(String email, PsychAppointmentRequestDto dto);

    List<PsychAppointmentResponseDto> getAppointmentsByMother(String email);

    List<PsychAppointmentResponseDto> getAppointmentsByMotherAndStatus(String email, String status);

    PsychAppointmentResponseDto getAppointmentById(String email, Long id);

    PsychAppointmentResponseDto updateAppointment(String email, Long id, PsychAppointmentRequestDto dto);

    void deleteAppointment(String email, Long id);
}