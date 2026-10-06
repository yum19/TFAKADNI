package tn.esprit.backend.module6a.service;

import tn.esprit.backend.module6a.dto.VaccineRequestDTO;
import tn.esprit.backend.module6a.dto.VaccineResponseDTO;

import java.util.List;

public interface IVaccineService {

    VaccineResponseDTO createVaccine(String email, Long babyId, VaccineRequestDTO request);

    List<VaccineResponseDTO> getAllVaccinesByBaby(String email, Long babyId);

    VaccineResponseDTO getVaccineById(String email, Long babyId, Long vaccineId);

    VaccineResponseDTO updateVaccine(String email, Long babyId, Long vaccineId, VaccineRequestDTO request);

    void deleteVaccine(String email, Long babyId, Long vaccineId);

    List<VaccineResponseDTO> getUpcomingVaccines(String email, Long babyId);

    List<VaccineResponseDTO> getOverdueVaccines(String email, Long babyId);
}