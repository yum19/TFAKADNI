package tn.esprit.backend.module6b.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.File;

@RestController
@RequestMapping("/api/postpartum/storytelling/audio-files")
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class StoryAudioFileController {

    @Value("${storytelling.audio.storage}")
    private String path;

    @GetMapping("/{fileName:.+}")
    public ResponseEntity<Resource> getAudio(@PathVariable String fileName) {
        File file = new File(path, fileName);

        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(file);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getName() + "\"")
                .contentType(MediaType.parseMediaType("audio/mpeg"))
                .body(resource);
    }
}