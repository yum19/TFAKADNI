package tn.esprit.backend.util;

import lombok.Data;
import tn.esprit.backend.dto.request.DynamicCareTask;

import java.util.ArrayList;
import java.util.List;

@Data
public class ScheduleChromosome implements Comparable<ScheduleChromosome> {
    private List<DynamicCareTask> genes = new ArrayList<>();
    private double fitnessScore = 0.0;

    public ScheduleChromosome(List<DynamicCareTask> genes) {
        this.genes = genes;
    }

    @Override
    public int compareTo(ScheduleChromosome other) {
        return Double.compare(other.fitnessScore, this.fitnessScore); // Descending order
    }
}