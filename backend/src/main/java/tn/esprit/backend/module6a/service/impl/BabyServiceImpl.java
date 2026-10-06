package tn.esprit.backend.module6a.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.module6a.dto.BabyRequestDTO;
import tn.esprit.backend.module6a.dto.BabyResponseDTO;
import tn.esprit.backend.module6a.entity.Baby;
import tn.esprit.backend.module6a.exception.BabyNotFoundException;
import tn.esprit.backend.module6a.exception.InvalidDateRangeException;
import tn.esprit.backend.module6a.exception.InvalidEnumValueException;
import tn.esprit.backend.module6a.exception.Module6aBadRequestException;
import tn.esprit.backend.module6a.repository.BabyRepository;
import tn.esprit.backend.module6a.service.IBabyService;
import tn.esprit.backend.repository.UserRepository;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BabyServiceImpl implements IBabyService {

    private final BabyRepository babyRepository;
    private final UserRepository userRepository;

    @Override
    public BabyResponseDTO createBaby(String email, BabyRequestDTO request) {
        validateRequest(request);

        User currentUser = getUserByEmail(email);

        Baby baby = Baby.builder()
                .mother(currentUser)
                .firstName(normalizeText(request.getFirstName()))
                .lastName(normalizeText(request.getLastName()))
                .birthDate(request.getBirthDate())
                .gender(normalizeGender(request.getGender()))
                .birthWeight(request.getBirthWeight())
                .birthHeight(request.getBirthHeight())
                .bloodType(normalizeText(request.getBloodType()))
                .birthPlace(normalizeText(request.getBirthPlace()))
                .gestationalAgeAtBirth(request.getGestationalAgeAtBirth())
                .deliveryType(normalizeText(request.getDeliveryType()))
                .photoUrl(normalizeText(request.getPhotoUrl()))
                .notes(request.getNotes())
                .build();

        Baby savedBaby = babyRepository.save(baby);
        return mapToResponse(savedBaby);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BabyResponseDTO> getMyBabies(String email) {
        User currentUser = getUserByEmail(email);
        return babyRepository.findByMother(currentUser)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BabyResponseDTO getBabyById(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        Baby baby = getOwnedBabyOrThrow(currentUser, babyId);
        return mapToResponse(baby);
    }

    @Override
    public BabyResponseDTO updateBaby(String email, Long babyId, BabyRequestDTO request) {
        User currentUser = getUserByEmail(email);
        Baby baby = getOwnedBabyOrThrow(currentUser, babyId);

        validateRequest(request);

        baby.setFirstName(normalizeText(request.getFirstName()));
        baby.setLastName(normalizeText(request.getLastName()));
        baby.setBirthDate(request.getBirthDate());
        baby.setGender(normalizeGender(request.getGender()));
        baby.setBirthWeight(request.getBirthWeight());
        baby.setBirthHeight(request.getBirthHeight());
        baby.setBloodType(normalizeText(request.getBloodType()));
        baby.setBirthPlace(normalizeText(request.getBirthPlace()));
        baby.setGestationalAgeAtBirth(request.getGestationalAgeAtBirth());
        baby.setDeliveryType(normalizeText(request.getDeliveryType()));
        baby.setPhotoUrl(normalizeText(request.getPhotoUrl()));
        baby.setNotes(request.getNotes());

        Baby updatedBaby = babyRepository.save(baby);
        return mapToResponse(updatedBaby);
    }

    @Override
    public void deleteBaby(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        Baby baby = getOwnedBabyOrThrow(currentUser, babyId);
        babyRepository.delete(baby);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }

    private Baby getOwnedBabyOrThrow(User currentUser, Long babyId) {
        return babyRepository.findByIdAndMotherId(babyId, currentUser.getId())
                .orElseThrow(() -> new BabyNotFoundException("Baby introuvable ou accès refusé"));
    }

    private BabyResponseDTO mapToResponse(Baby baby) {
        return BabyResponseDTO.builder()
                .id(baby.getId())
                .motherId(baby.getMother() != null ? baby.getMother().getId() : null)
                .firstName(baby.getFirstName())
                .lastName(baby.getLastName())
                .birthDate(baby.getBirthDate())
                .gender(baby.getGender())
                .birthWeight(baby.getBirthWeight())
                .birthHeight(baby.getBirthHeight())
                .bloodType(baby.getBloodType())
                .birthPlace(baby.getBirthPlace())
                .gestationalAgeAtBirth(baby.getGestationalAgeAtBirth())
                .deliveryType(baby.getDeliveryType())
                .photoUrl(baby.getPhotoUrl())
                .notes(baby.getNotes())
                .createdAt(baby.getCreatedAt())
                .updatedAt(baby.getUpdatedAt())
                .build();
    }

    private void validateRequest(BabyRequestDTO request) {
        if (request.getFirstName() == null || request.getFirstName().isBlank()) {
            throw new Module6aBadRequestException("First name is required");
        }

        if (request.getLastName() == null || request.getLastName().isBlank()) {
            throw new Module6aBadRequestException("Last name is required");
        }

        if (request.getBirthDate() == null) {
            throw new Module6aBadRequestException("Birth date is required");
        }

        if (request.getBirthDate().isAfter(LocalDate.now())) {
            throw new InvalidDateRangeException("Birth date cannot be in the future");
        }

        if (request.getGender() == null || request.getGender().isBlank()) {
            throw new Module6aBadRequestException("Gender is required");
        }

        String gender = normalizeGender(request.getGender());
        if (!gender.equals("MALE") && !gender.equals("FEMALE")) {
            throw new InvalidEnumValueException("Gender must be MALE or FEMALE");
        }

        if (request.getBirthWeight() != null && request.getBirthWeight() <= 0) {
            throw new Module6aBadRequestException("Birth weight must be greater than 0");
        }

        if (request.getBirthHeight() != null && request.getBirthHeight() <= 0) {
            throw new Module6aBadRequestException("Birth height must be greater than 0");
        }

        if (request.getGestationalAgeAtBirth() != null && request.getGestationalAgeAtBirth() <= 0) {
            throw new Module6aBadRequestException("Gestational age must be greater than 0");
        }
    }

    private String normalizeText(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeGender(String value) {
        return value == null ? null : value.trim().toUpperCase();
    }
}