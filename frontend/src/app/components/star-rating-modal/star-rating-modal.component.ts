// src/app/components/star-rating-modal/star-rating-modal.component.ts
import {
  Component, Input, Output, EventEmitter,
  OnInit, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RatingService, RatingDTO } from '../../core/services/rating.service';

@Component({
  selector: 'app-star-rating-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './star-rating-modal.component.html',
  styleUrls: ['./star-rating-modal.component.css'],
})
export class StarRatingModalComponent implements OnInit {
  @Input() matchId!:    number;
  @Input() ratedName!:  string;   // display name of the person being rated
  @Input() ratedId!:    number;

  @Output() close   = new EventEmitter<void>();
  @Output() rated   = new EventEmitter<RatingDTO>();

  private ratingSvc = inject(RatingService);

  hoveredStar  = 0;
  selectedStar = 0;
  comment      = '';
  submitting   = false;
  submitted    = false;
  error        = '';

  existing: RatingDTO | null = null;

  stars = [1, 2, 3, 4, 5];

  ngOnInit(): void {
    // Pre-fill if user already rated this match
    this.ratingSvc.getMyRating(this.matchId).subscribe({
      next: (r) => {
        if (r) {
          this.existing     = r;
          this.selectedStar = r.stars ?? 0;
          this.comment      = r.comment ?? '';
        }
      },
      error: () => { /* 204 = no content, safe to ignore */ }
    });
  }

  get label(): string {
    const n = this.hoveredStar || this.selectedStar;
    return ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][n] ?? '';
  }

  hover(n: number)  { this.hoveredStar = n; }
  leave()           { this.hoveredStar = 0; }
  select(n: number) { this.selectedStar = n; }

  submit(): void {
    if (!this.selectedStar) { this.error = 'Please select a star rating.'; return; }
    this.error      = '';
    this.submitting = true;

    this.ratingSvc.rate({
      matchId: this.matchId,
      stars:   this.selectedStar,
      comment: this.comment.trim() || undefined
    }).subscribe({
      next: (dto) => {
        this.submitting = false;
        this.submitted  = true;
        this.rated.emit(dto);
        setTimeout(() => this.close.emit(), 1800);
      },
      error: (err) => {
        this.submitting = false;
        this.error = err?.error?.message ?? 'Could not save rating. Please try again.';
      }
    });
  }
}