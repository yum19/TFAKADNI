package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.MarraineDTO;
import tn.esprit.backend.dto.MatchingRequest;
import tn.esprit.backend.service.MarrainageService;

import java.util.List;

@RestController
@RequestMapping("/api/marrainage")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MarrainageController {

    private final MarrainageService marrainageService;

    @PostMapping("/match")
    public ResponseEntity<List<MarraineDTO>> findBestMatches(@RequestBody MatchingRequest request) {
        List<MarraineDTO> matches = marrainageService.findBestMarraines(request.getMotherUserId());
        return ResponseEntity.ok(matches);
    }
}