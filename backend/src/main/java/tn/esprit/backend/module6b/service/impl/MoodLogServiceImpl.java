package tn.esprit.backend.module6b.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.module6b.dto.MoodLogRequestDto;
import tn.esprit.backend.module6b.dto.MoodLogResponseDto;
import tn.esprit.backend.module6b.entity.MoodLog;
import tn.esprit.backend.module6b.exception.PostpartumAccountContextException;
import tn.esprit.backend.module6b.exception.PostpartumOwnershipException;
import tn.esprit.backend.module6b.exception.PostpartumRecordMissingException;
import tn.esprit.backend.module6b.repository.MoodLogRepository;
import tn.esprit.backend.module6b.service.IMoodLogService;
import tn.esprit.backend.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MoodLogServiceImpl implements IMoodLogService {

    private final MoodLogRepository moodLogRepository;
    private final UserRepository userRepository;

    @Override
    public MoodLogResponseDto createMoodLog(String email, MoodLogRequestDto dto) {
        User user = getUserByEmail(email);

        MoodLog moodLog = MoodLog.builder()
                .mother(user)
                .logDate(dto.getLogDate())
                .moodScore(dto.getMoodScore())
                .emotionType(dto.getEmotionType())
                .notes(dto.getNotes())
                .isShared(dto.getIsShared())
                .createdAt(LocalDateTime.now())
                .build();

        return mapToResponse(moodLogRepository.save(moodLog));
    }

    @Override
    public List<MoodLogResponseDto> getMoodLogsByMother(String email) {
        User user = getUserByEmail(email);
        return moodLogRepository.findByMotherIdOrderByLogDateDesc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public MoodLogResponseDto getMoodLogById(String email, Long id) {
        User user = getUserByEmail(email);
        MoodLog moodLog = moodLogRepository.findById(id)
                .orElseThrow(() -> new PostpartumRecordMissingException("MoodLog not found with id: " + id));

        checkOwner(moodLog.getMother().getId(), user.getId());
        return mapToResponse(moodLog);
    }

    @Override
    public MoodLogResponseDto updateMoodLog(String email, Long id, MoodLogRequestDto dto) {
        User user = getUserByEmail(email);
        MoodLog existingMoodLog = moodLogRepository.findById(id)
                .orElseThrow(() -> new PostpartumRecordMissingException("MoodLog not found with id: " + id));

        checkOwner(existingMoodLog.getMother().getId(), user.getId());

        existingMoodLog.setLogDate(dto.getLogDate());
        existingMoodLog.setMoodScore(dto.getMoodScore());
        existingMoodLog.setEmotionType(dto.getEmotionType());
        existingMoodLog.setNotes(dto.getNotes());
        existingMoodLog.setIsShared(dto.getIsShared());

        return mapToResponse(moodLogRepository.save(existingMoodLog));
    }

    @Override
    public void deleteMoodLog(String email, Long id) {
        User user = getUserByEmail(email);
        MoodLog moodLog = moodLogRepository.findById(id)
                .orElseThrow(() -> new PostpartumRecordMissingException("MoodLog not found with id: " + id));

        checkOwner(moodLog.getMother().getId(), user.getId());
        moodLogRepository.delete(moodLog);
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

    private MoodLogResponseDto mapToResponse(MoodLog moodLog) {
        return MoodLogResponseDto.builder()
                .id(moodLog.getId())
                .motherId(moodLog.getMother() != null ? moodLog.getMother().getId() : null)
                .logDate(moodLog.getLogDate())
                .moodScore(moodLog.getMoodScore())
                .emotionType(moodLog.getEmotionType())
                .notes(moodLog.getNotes())
                .isShared(moodLog.getIsShared())
                .createdAt(moodLog.getCreatedAt())
                .build();
    }
}