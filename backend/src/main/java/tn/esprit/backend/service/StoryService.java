package tn.esprit.backend.service;

import tn.esprit.backend.entity.Story;

import java.util.List;

public interface StoryService {
    Story createStory(String email, Story story);
    List<Story> getActiveStories();
    List<Story> getAllStories();
    void deleteExpiredStories();
    Story getStoryById(Long id);
    void deleteStory(String email, Long id);
    long countActiveStories();
}