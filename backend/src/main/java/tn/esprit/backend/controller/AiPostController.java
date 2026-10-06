package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.service.GroqService;
import tn.esprit.backend.service.TrieService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AiPostController {

    private final TrieService trieService;
    private final GroqService groqService;

    @GetMapping("/autocomplete")
    public ResponseEntity<List<String>> autocomplete(@RequestParam String prefix) {
        String[] words = prefix.trim().split("\\s+");
        String lastWord = words[words.length - 1];
        return ResponseEntity.ok(trieService.suggest(lastWord, 6));
    }

    @PostMapping("/generate-post")
    public ResponseEntity<Map<String, String>> generatePost(@RequestBody Map<String, String> body) {
        String topic = body.getOrDefault("topic", "").trim();
        String tag   = body.getOrDefault("tag", "GROSSESSE");

        System.out.println("=== /api/ai/generate-post called | topic: '" + topic + "' | tag: " + tag);

        if (topic.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "content", "",
                    "error", "Write a few words first so the AI knows what to expand."
            ));
        }

        try {
            String generated = groqService.generatePost(topic, tag);
            return ResponseEntity.ok(Map.of("content", generated, "error", ""));
        } catch (RuntimeException e) {
            if ("RATE_LIMIT".equals(e.getMessage())) {
                return ResponseEntity.status(429).body(Map.of(
                        "content", "",
                        "error", "AI rate limit reached. Please wait a moment and try again."
                ));
            }
            return ResponseEntity.status(500).body(Map.of(
                    "content", "",
                    "error", "Could not reach AI. Check your Groq API key."
            ));
        }
    }
}