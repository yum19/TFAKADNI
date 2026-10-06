package tn.esprit.backend.module6b.service;

public interface StoryAudioGeneratorService {
    String generateAudioFile(Long storyId, String text, String voiceType);
}