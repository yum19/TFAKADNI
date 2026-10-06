import { CommonModule, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TodaySummaryResponseDTO, TodaySummaryService } from '../../../../../core/services/module6a/today-summary.service';

@Component({
  selector: 'app-today-summary',
  standalone: true,
  imports: [CommonModule, NgIf, RouterLink],
  templateUrl: './today-summary.component.html',
  styleUrls: ['./today-summary.component.css']
})
export class TodaySummaryComponent implements OnInit {
  babyId = 0;
  summary: TodaySummaryResponseDTO | null = null;

  loading = false;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly todaySummaryService: TodaySummaryService
  ) {}

  ngOnInit(): void {
    this.babyId = Number(this.route.snapshot.paramMap.get('babyId')) || 0;
    this.loadSummary();
  }

  loadSummary(): void {
    this.loading = true;
    this.errorMessage = '';

    this.todaySummaryService.getTodaySummary(this.babyId).subscribe({
      next: (data) => {
        this.summary = data;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Error loading today summary.';
        this.loading = false;
      }
    });
  }
}
