package tn.esprit.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import tn.esprit.backend.dto.request.DynamicCareTask;

import java.util.List;

@Data
@Builder
public class EvoCareResponse {
    private String algorithmType;
    private int generationsRun;
    private long computeTimeMs;
    private double finalFitnessScore;
    private List<DynamicCareTask> optimizedSchedule;
}