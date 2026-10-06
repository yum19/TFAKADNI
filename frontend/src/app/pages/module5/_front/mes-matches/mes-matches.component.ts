// src/app/features/communaute/mes-matches/mes-matches.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatchService, MatchDTO } from '../../../../core/services/match.service';
import { RatingService, RatingDTO } from '../../../../core/services/rating.service';
import { StarRatingModalComponent } from '../../../../components/star-rating-modal/star-rating-modal.component';
import { IndexHeaderComponent } from '../../../../components/index-header/index-header.component';
import { IndexFooterComponent } from '../../../../components/index-footer/index-footer.component';

@Component({
  selector: 'app-mes-matches',
  standalone: true,
  imports: [
    CommonModule,
    IndexHeaderComponent,
    IndexFooterComponent,
    StarRatingModalComponent,
  ],
  templateUrl: './mes-matches.component.html',
  styleUrls: ['./mes-matches.component.css'],
})
export class MesMatchesComponent implements OnInit {
  private matchSvc  = inject(MatchService);
  private ratingSvc = inject(RatingService);
  private router    = inject(Router);

  loading = true;
  matches: MatchDTO[] = [];
  hasShownIncoming = false;

  /** Track which matchId has the rating modal open */
  ratingModalMatchId: number | null = null;
  ratingModalName    = '';
  ratingModalRatedId = 0;

  /** Cache: matchId → my existing rating (stars) */
  myRatings: Record<number, RatingDTO> = {};

  /** Cache: ratedId → their average stats */
  userStats: Record<number, RatingDTO> = {};

  get mutualMatches(): MatchDTO[] { return this.matches.filter(m => m.mutualMatch); }
  get myDecisions():   MatchDTO[] { return this.matches.filter(m => m.iAmA && !m.mutualMatch); }
  get incomingMatches(): MatchDTO[] { return this.matches.filter(m => !m.iAmA && !m.mutualMatch); }

  ngOnInit(): void {
    this.matchSvc.loadMyMatches().subscribe({
      next: () => { this.loading = false; },
      error: () => { this.loading = false; }
    });
    this.matchSvc.matches$.subscribe(m => {
      this.matches = m;
      if (m.some(x => !x.iAmA)) this.hasShownIncoming = true;
      // Load ratings for all mutual matches
      this.mutualMatches.forEach(match => this._loadRatingData(match));
    });
  }

  private _loadRatingData(match: MatchDTO): void {
    const mid = match.matchId;
    // My existing rating for this match
    if (this.myRatings[mid] === undefined) {
      this.ratingSvc.getMyRating(mid).subscribe({
        next:  (r) => { if (r) this.myRatings[mid] = r; },
        error: ()  => { /* 204 no content = not yet rated */ }
      });
    }
    // Their average stars
    const oid = match.otherUserId;
    if (this.userStats[oid] === undefined) {
      this.ratingSvc.getUserStats(oid).subscribe({
        next: (s) => { this.userStats[oid] = s; },
        error: () => {}
      });
    }
  }

  // ── Rating modal ──────────────────────────────────────────────────────────

  openRatingModal(match: MatchDTO): void {
    this.ratingModalMatchId = match.matchId;
    this.ratingModalName    = match.otherUserName;
    this.ratingModalRatedId = match.otherUserId;
  }

  closeRatingModal(): void {
    this.ratingModalMatchId = null;
  }

  onRated(dto: RatingDTO): void {
    if (dto.matchId != null) {
      this.myRatings[dto.matchId] = dto;
    }
    if (dto.ratedId != null) {
      this.userStats[dto.ratedId] = dto;
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getMyStars(matchId: number): number {
    return this.myRatings[matchId]?.stars ?? 0;
  }

  getAvgStars(userId: number): number {
    return this.userStats[userId]?.avgStars ?? 0;
  }

  getTotalRatings(userId: number): number {
    return Number(this.userStats[userId]?.totalRatings ?? 0);
  }

  /** Returns array [1..5] for rendering read-only stars */
  starArray(count: number): boolean[] {
    return [1, 2, 3, 4, 5].map(n => n <= Math.round(count));
  }

  scoreColor(score: number): string {
    if (score >= 70) return '#00b894';
    if (score >= 40) return '#f59e0b';
    return '#e24b4a';
  }

  avatarColor(score: number): string {
    return score >= 70
      ? 'linear-gradient(135deg,#ff4f75,#f472b6)'
      : 'linear-gradient(135deg,#6c5ce7,#a29bfe)';
  }

  getInitials(name: string): string {
    return (name || '??').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  openMessage(m: MatchDTO): void {
    this.router.navigate(['/mother/communaute/chat'], { queryParams: { userId: m.otherUserId } });
  }
}