package tn.esprit.backend.service.advanced;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Service
public class AiModuleService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String PYTHON_SIDECAR_URL = "http://localhost:8000/api/ai";

    /* public Map<String, String> triggerVideoGeneration(String moduleContent, MultipartFile file) {
        String url = PYTHON_SIDECAR_URL + "/generate-video";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

        if (moduleContent != null && !moduleContent.isEmpty()) {
            body.add("content", moduleContent);
        }

        if (file != null && !file.isEmpty()) {
            try {
                // Wrap the multipart file in a resource so RestTemplate can send it
                ByteArrayResource fileAsResource = new ByteArrayResource(file.getBytes()) {
                    @Override
                    public String getFilename() {
                        return file.getOriginalFilename();
                    }
                };
                body.add("file", fileAsResource);
            } catch (Exception e) {
                throw new RuntimeException("Failed to process file for video generation", e);
            }
        }

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);
        return response.getBody();
    } */

    public Map<String, String> triggerVideoGeneration(String moduleContent, MultipartFile file, String courseTitle, String courseId, String moduleTitle) {
        String url = PYTHON_SIDECAR_URL + "/generate-video";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

        if (moduleContent != null && !moduleContent.isEmpty()) {
            body.add("content", moduleContent);
        }

        // Add the new synchronization parameters
        body.add("course_title", courseTitle);
        body.add("course_id", courseId);
        body.add("module_title", moduleTitle);

        if (file != null && !file.isEmpty()) {
            try {
                ByteArrayResource fileAsResource = new ByteArrayResource(file.getBytes()) {
                    @Override
                    public String getFilename() {
                        return file.getOriginalFilename();
                    }
                };
                body.add("file", fileAsResource);
            } catch (Exception e) {
                throw new RuntimeException("Failed to process file for video generation", e);
            }
        }

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);
        return response.getBody();
    }

    public Map<String, String> getVideoStatus(String taskId) {
        String url = PYTHON_SIDECAR_URL + "/video-status/" + taskId;
        return restTemplate.getForObject(url, Map.class);
    }
}