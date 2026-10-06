import { CommonModule, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CareScoreResponseDTO, CareScoreService } from '../../../../../core/services/module6a/care-score.service';

@Component({
  selector: 'app-care-score',
  standalone: true,
  imports: [CommonModule, NgIf, RouterLink],
  templateUrl: './care-score.component.html',
  styleUrls: ['./care-score.component.css']
})
export class CareScoreComponent implements OnInit {
  babyId = 0;
  careScore: CareScoreResponseDTO | null = null;

  loading = false;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly careScoreService: CareScoreService
  ) {}

  ngOnInit(): void {
    this.babyId = Number(this.route.snapshot.paramMap.get('babyId')) || 0;
    this.loadCareScore();
  }

  loadCareScore(): void {
    this.loading = true;
    this.errorMessage = '';

    this.careScoreService.getCareScore(this.babyId).subscribe({
      next: (data) => {
        this.careScore = data;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Error loading care score.';
        this.loading = false;
      }
    });
  }
}
