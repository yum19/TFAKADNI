package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import tn.esprit.backend.entity.Post;
import tn.esprit.backend.service.FakeInfoService;
import tn.esprit.backend.service.PostService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PostController {

    private final PostService postService;
    private final RestTemplate restTemplate;

    private static final String FLASK_BASE = "http://localhost:5000";

    @PostMapping
    public ResponseEntity<Post> creer(Authentication authentication,
                                      @RequestBody Post post) {
        return ResponseEntity.ok(postService.creer(authentication.getName(), post));
    }

    @GetMapping
    public ResponseEntity<List<Post>> recupererTout() {
        return ResponseEntity.ok(postService.recupererTout());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Post> recupererParId(@PathVariable Long id) {
        return ResponseEntity.ok(postService.recupererParId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Post> mettreAJour(Authentication authentication,
                                            @PathVariable Long id,
                                            @RequestBody Post post) {
        return ResponseEntity.ok(postService.mettreAJour(authentication.getName(), id, post));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(Authentication authentication,
                                          @PathVariable Long id) {
        postService.supprimer(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/posts/{id}/summarize
     * Calls the Flask ML summarization service and returns the summary.
     * Body (optional): { "numSentences": 3 }
     */
    @PostMapping("/{id}/summarize")
    public ResponseEntity<Map<String, Object>> summarize(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> options) {

        // Load the post
        Post post = postService.recupererParId(id);
        String text = post.getContenu();

        if (text == null || text.isBlank()) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Post has no content to summarize");
            return ResponseEntity.badRequest().body(err);
        }

        // Build Flask request payload
        Map<String, Object> payload = new HashMap<>();
        payload.put("text", text);
        payload.put("postId", id);
        payload.put("numSentences", options != null && options.containsKey("numSentences")
                ? options.get("numSentences") : 3);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> flaskResponse = restTemplate.postForObject(
                    FLASK_BASE + "/summarize", entity, Map.class);
            return ResponseEntity.ok(flaskResponse);
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Summarization service unavailable: " + e.getMessage());
            return ResponseEntity.status(503).body(err);
        }
    }


    // Inject FakeInfoService — add to constructor
    private final FakeInfoService fakeInfoService;

    /**
     * GET /api/posts/{id}/fake-info
     * Calls Flask in real-time and returns the fake-info analysis for this post.
     */
    @GetMapping("/{id}/fake-info")
    public ResponseEntity<Map<String, Object>> getFakeInfo(@PathVariable Long id) {
        Post post = postService.recupererParId(id);
        String text = post.getContenu();

        if (text == null || text.isBlank()) {
            Map<String, Object> r = new HashMap<>();
            r.put("isFakeInfo", false);
            r.put("label", "VERIFIED");
            return ResponseEntity.ok(r);
        }

        Map<String, Object> result = fakeInfoService.analyse(id, text);
        if (result == null) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Fake info service unavailable");
            return ResponseEntity.status(503).body(err);
        }
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/posts/{id}/fake-info/check
     * Trigger on-demand check (same as GET but explicit POST for batch use).
     */
    @PostMapping("/{id}/fake-info/check")
    public ResponseEntity<Map<String, Object>> checkFakeInfo(@PathVariable Long id) {
        return getFakeInfo(id);
    }

}