package tn.esprit.backend.module6a.service;

import tn.esprit.backend.module6a.dto.BabyRequestDTO;
import tn.esprit.backend.module6a.dto.BabyResponseDTO;

import java.util.List;

public interface IBabyService {

    BabyResponseDTO createBaby(String email, BabyRequestDTO request);

    List<BabyResponseDTO> getMyBabies(String email);

    BabyResponseDTO getBabyById(String email, Long babyId);

    BabyResponseDTO updateBaby(String email, Long babyId, BabyRequestDTO request);

    void deleteBaby(String email, Long babyId);
}