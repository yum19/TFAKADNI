package tn.esprit.backend.module6a.service;

import tn.esprit.backend.module6a.dto.TimelineEventResponseDTO;

import java.util.List;

public interface IBabyTimelineService {

    List<TimelineEventResponseDTO> getTimeline(String email, Long babyId);

    List<TimelineEventResponseDTO> getTimeline(String email, Long babyId, Integer days);
}