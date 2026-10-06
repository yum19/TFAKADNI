package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.entity.Story;
import tn.esprit.backend.service.StoryService;

import java.util.List;

@RestController
@RequestMapping("/api/stories")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StoryController {

    private final StoryService storyService;

    @PostMapping
    public ResponseEntity<?> create(Authentication authentication,
                                    @RequestBody Story story) {
        try {
            Story saved = storyService.createStory(authentication.getName(), story);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(Authentication authentication,
                                          @PathVariable Long id) {
        storyService.deleteStory(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<Story>> getActive() {
        return ResponseEntity.ok(storyService.getActiveStories());
    }

    @GetMapping("/all")
    public ResponseEntity<List<Story>> getAll() {
        return ResponseEntity.ok(storyService.getAllStories());
    }
}