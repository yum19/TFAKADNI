// src/main/java/tn/esprit/backend/service/ReportService.java
package tn.esprit.backend.service;

import tn.esprit.backend.dto.ReportRequestDTO;

public interface ReportService {
    void reportPost(String reporterEmail, ReportRequestDTO dto);
}