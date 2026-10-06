package tn.esprit.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import tn.esprit.backend.dto.HarmfulAnalysisResponse;
import tn.esprit.backend.dto.PostAnalysisDTO;
import tn.esprit.backend.entity.Post;
import tn.esprit.backend.entity.PostAnalysis;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.repository.PostAnalysisRepository;
import tn.esprit.backend.repository.PostRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class HarmfulContentService {

    private final RestTemplate           restTemplate;
    private final PostAnalysisRepository postAnalysisRepository;
    private final PostRepository         postRepository;

    @Value("${ml.service.url:http://localhost:5000}")
    private String mlServiceUrl;

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Synchronous analysis — called when you NEED the result immediately
     * (e.g. from the /trigger endpoint called by Angular right after post creation).
     */
    public PostAnalysisDTO analyseAndPersist(Long postId, String text, List<String> imageUrls) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found: " + postId));

        HarmfulAnalysisResponse mlResult = callMlService(postId, text, imageUrls);
        return upsertAndReturn(post, mlResult);
    }

    /** Convenience overload without images */
    public PostAnalysisDTO analyseAndPersist(Long postId, String text) {
        return analyseAndPersist(postId, text, List.of());
    }

    /**
     * Async analysis — called automatically after post create/update.
     * Runs in background; does NOT block the HTTP response.
     * Angular should poll /analysis after a short delay.
     */
    @Async("mlTaskExecutor")
    public void analyseAsync(Long postId, String text, List<String> imageUrls) {
        try {
            analyseAndPersist(postId, text, imageUrls);
        } catch (Exception e) {
            log.warn("[HarmfulContent] Async analysis failed for postId={}: {}", postId, e.getMessage());
        }
    }

    public void analyseAsync(Long postId, String text) {
        analyseAsync(postId, text, List.of());
    }

    /** Return stored analysis, or a safe default if not yet computed */
    public PostAnalysisDTO getAnalysis(Long postId) {
        return postAnalysisRepository.findByPostId(postId)
                .map(this::toDTO)
                .orElse(safeDTO(postId));
    }

    /** Author clicks "I understand" → mark warning dismissed */
    public PostAnalysisDTO acknowledge(Long postId) {
        PostAnalysis analysis = postAnalysisRepository.findByPostId(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Analysis not found: " + postId));
        analysis.setAuthorAcknowledged(true);
        postAnalysisRepository.save(analysis);
        return toDTO(analysis);
    }

    // ── Private: ML call ─────────────────────────────────────────────────────

    private HarmfulAnalysisResponse callMlService(Long postId, String text, List<String> imageUrls) {
        try {
            /*
             * ROOT CAUSE FIX: must use HttpEntity with Content-Type: application/json.
             * Without explicit headers RestTemplate picks StringHttpMessageConverter or
             * XmlMapper and serializes the Map as <HashMap><text>...</HashMap>.
             * Flask then receives XML → get_json() returns None → wrong result.
             */
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));

            Map<String, Object> body = new HashMap<>();
            body.put("text",      text != null ? text : "");
            body.put("postId",    postId);
            body.put("imageUrls", imageUrls != null ? imageUrls : List.of());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<HarmfulAnalysisResponse> resp = restTemplate.exchange(
                    mlServiceUrl + "/detect-harmful",
                    HttpMethod.POST,
                    entity,
                    HarmfulAnalysisResponse.class
            );

            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                log.info("[HarmfulContent] postId={} → harmful={} severity={} category={}",
                        postId,
                        resp.getBody().getIsHarmful(),
                        resp.getBody().getSeverity(),
                        resp.getBody().getCategory());
                return resp.getBody();
            }

            log.warn("[HarmfulContent] ML returned {} for postId={}", resp.getStatusCode(), postId);

        } catch (Exception e) {
            log.warn("[HarmfulContent] ML call failed for postId={}: {}", postId, e.getMessage());
        }

        return safeFallback();
    }

    // ── Private: DB upsert ───────────────────────────────────────────────────

    private PostAnalysisDTO upsertAndReturn(Post post, HarmfulAnalysisResponse mlResult) {
        PostAnalysis analysis = postAnalysisRepository.findByPostId(post.getId())
                .orElse(PostAnalysis.builder()
                        .post(post)
                        .authorAcknowledged(false)
                        .build());

        analysis.setIsHarmful(     mlResult.getIsHarmful()    != null && mlResult.getIsHarmful());
        analysis.setSeverity(      nvl(mlResult.getSeverity(),      "NONE"));
        analysis.setCategory(      nvl(mlResult.getCategory(),      "SAFE"));
        analysis.setCategoryLabel( nvl(mlResult.getCategoryLabel(), "Safe content"));
        analysis.setConfidence(    mlResult.getConfidence());
        analysis.setWarningMessage(mlResult.getWarningMessage());
        analysis.setBlurMessage(   mlResult.getBlurMessage());
        analysis.setShouldBlur(    mlResult.getShouldBlur() != null && mlResult.getShouldBlur());

        PostAnalysis saved = postAnalysisRepository.save(analysis);
        log.info("[HarmfulContent] Saved → postId={} harmful={} severity={} category={}",
                post.getId(), saved.getIsHarmful(), saved.getSeverity(), saved.getCategory());
        return toDTO(saved);
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private PostAnalysisDTO toDTO(PostAnalysis a) {
        return PostAnalysisDTO.builder()
                .postId(             a.getPost().getId())
                .isHarmful(          a.getIsHarmful())
                .severity(           a.getSeverity())
                .category(           a.getCategory())
                .categoryLabel(      a.getCategoryLabel())
                .confidence(         a.getConfidence())
                .warningMessage(     a.getWarningMessage())
                .blurMessage(        a.getBlurMessage())
                .shouldBlur(         a.getShouldBlur())
                .authorAcknowledged( a.getAuthorAcknowledged())
                .build();
    }

    private PostAnalysisDTO safeDTO(Long postId) {
        return PostAnalysisDTO.builder()
                .postId(postId).isHarmful(false).severity("NONE")
                .category("SAFE").categoryLabel("Safe content")
                .shouldBlur(false).authorAcknowledged(false)
                .build();
    }

    private HarmfulAnalysisResponse safeFallback() {
        HarmfulAnalysisResponse r = new HarmfulAnalysisResponse();
        r.setIsHarmful(false); r.setSeverity("NONE");
        r.setCategory("SAFE"); r.setCategoryLabel("Safe content");
        r.setShouldBlur(false);
        return r;
    }

    private String nvl(String v, String d) { return v != null ? v : d; }
}