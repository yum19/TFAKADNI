import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LearningService } from '../../../../core/services/learning.service';
import { RecommendedCourse } from '../../../../core/models/api.models';

@Component({
  selector: 'app-mother-recommendations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recommendations.component.html',
  styleUrls: ['./recommendations.component.scss']
})
export class MotherRecommendationsComponent implements OnInit {
  private learning = inject(LearningService);

  currentWeek: number | null = 20;
  recommendations: RecommendedCourse[] = [];

  notes = [
    'Choose one course that solves a current question, not five that sound useful later.',
    'If energy is low, prefer shorter content blocks over longer "perfect study sessions".',
    'Use recommendations as guidance, then decide with your own comfort level and care plan.'
  ];

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.learning.getRecommendations(this.currentWeek ?? undefined).subscribe({
      next: data => this.recommendations = data
    });
  }
}