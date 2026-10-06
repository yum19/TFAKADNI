package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.entity.Story;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.repository.StoryRepository;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.StoryService;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class StoryServiceImpl implements StoryService {

    private final StoryRepository storyRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public Story createStory(String email, Story story) {
        User user = getUserByEmail(email);
        story.setUser(user);
        return storyRepository.save(story);
    }

    @Override
    public List<Story> getActiveStories() {
        return storyRepository.findByExpiresAtGreaterThanOrderByCreatedAtDesc(LocalDateTime.now());
    }

    @Override
    public List<Story> getAllStories() {
        return storyRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    @Transactional
    public void deleteExpiredStories() {
        log.info("Manual cleanup called (not scheduled)");
    }

    @Override
    public Story getStoryById(Long id) {
        return storyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Story not found: " + id));
    }

    @Override
    public void deleteStory(String email, Long id) {
        User user = getUserByEmail(email);
        Story story = storyRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Story non trouvée ou accès refusé"));
        storyRepository.delete(story);
    }

    @Override
    public long countActiveStories() {
        return storyRepository.countByExpiresAtGreaterThan(LocalDateTime.now());
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }
}