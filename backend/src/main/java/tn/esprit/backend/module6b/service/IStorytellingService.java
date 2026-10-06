package tn.esprit.backend.module6b.service;

import tn.esprit.backend.module6b.dto.StoryAudioResponseDto;
import tn.esprit.backend.module6b.dto.StoryRequestDto;
import tn.esprit.backend.module6b.dto.StoryResponseDto;

import java.util.List;

public interface IStorytellingService {

    StoryResponseDto generateStory(String email, StoryRequestDto request);

    StoryResponseDto getLatestStory(String email);

    List<StoryResponseDto> getStoryHistory(String email);

    StoryResponseDto getStoryById(String email, Long id);

    void deleteStory(String email, Long id);

    StoryAudioResponseDto generateAudioForStory(String email, Long storyId, String voiceType);
}