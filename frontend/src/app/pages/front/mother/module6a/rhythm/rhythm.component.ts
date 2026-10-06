import { CommonModule, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import {
  BabyPredictionDTO,
  BabyRhythmProfileDTO,
  RhythmService
} from '../../../../../core/services/module6a/rhythm.service';

@Component({
  selector: 'app-rhythm',
  standalone: true,
  imports: [CommonModule, NgIf, MatIconModule],
  templateUrl: './rhythm.component.html',
  styleUrls: ['./rhythm.component.css']
})
export class RhythmComponent implements OnInit {
  babyId = 0;

  rhythm: BabyRhythmProfileDTO | null = null;
  nextFeeding: BabyPredictionDTO | null = null;
  nextSleep: BabyPredictionDTO | null = null;

  loading = false;
  recalculating = false;

  errorMessage = '';
  feedingWarning = '';
  sleepWarning = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly rhythmService: RhythmService
  ) {}

  ngOnInit(): void {
    this.babyId = Number(this.route.snapshot.paramMap.get('babyId')) || 0;
    this.loadRhythmPage();
  }

  loadRhythmPage(): void {
    if (!this.babyId) {
      this.errorMessage = 'Invalid baby id.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.feedingWarning = '';
    this.sleepWarning = '';
    this.nextFeeding = null;
    this.nextSleep = null;

    this.rhythmService.getRhythmProfile(this.babyId).subscribe({
      next: (rhythm) => {
        this.rhythm = rhythm;
        this.loadPredictions();
      },
      error: (err) => {
        const status = err?.status;

        if (status === 404) {
          this.rhythmService.recalculateRhythmProfile(this.babyId).subscribe({
            next: (rhythm) => {
              this.rhythm = rhythm;
              this.loadPredictions();
            },
            error: (recalcErr) => {
              this.errorMessage =
                recalcErr?.error?.message || 'Error recalculating rhythm profile.';
              this.loading = false;
            }
          });
        } else {
          this.errorMessage =
            err?.error?.message || 'Error loading rhythm profile.';
          this.loading = false;
        }
      }
    });
  }

  loadPredictions(): void {
    this.rhythmService.predictNextFeeding(this.babyId).pipe(
      catchError((err) => {
        this.feedingWarning =
          err?.error?.message || 'Next feeding prediction unavailable.';
        return of(null);
      })
    ).subscribe((result) => {
      this.nextFeeding = result;
    });

    this.rhythmService.predictNextSleep(this.babyId).pipe(
      catchError((err) => {
        this.sleepWarning =
          err?.error?.message || 'Next sleep prediction unavailable.';
        return of(null);
      }),
      finalize(() => {
        this.loading = false;
      })
    ).subscribe((result) => {
      this.nextSleep = result;
    });
  }

  recalculate(): void {
    if (!this.babyId) {
      this.errorMessage = 'Invalid baby id.';
      return;
    }

    this.recalculating = true;
    this.errorMessage = '';
    this.feedingWarning = '';
    this.sleepWarning = '';

    this.rhythmService.recalculateRhythmProfile(this.babyId).subscribe({
      next: (rhythm) => {
        this.rhythm = rhythm;
        this.nextFeeding = null;
        this.nextSleep = null;
        this.loadPredictions();
        this.recalculating = false;
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message || 'Error recalculating rhythm profile.';
        this.recalculating = false;
      }
    });
  }

  refresh(): void {
    this.loadRhythmPage();
  }
}