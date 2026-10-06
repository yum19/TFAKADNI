import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarrainageService, MarraineDTO } from '../../../../core/services/marrainage.service';

@Component({
  selector: 'app-marrainage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './marrainage.component.html',
  styleUrls: ['./marrainage.component.scss'],
})
export class MarrainageComponent implements OnInit {

  private svc = inject(MarrainageService);

  marraines: MarraineDTO[] = [];
  loading = false;
  error = '';

  readonly CURRENT_USER_ID = 1;

  ngOnInit() {
    
    this.loadMatches();
  }

  loadMatches() {
    this.loading = true;
    this.error = '';

    this.svc.findBestMatches().subscribe({
      next: (data: MarraineDTO[]) => {
        this.marraines = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les marraines.';
        this.loading = false;
      }
    });
  }

  getScoreColor(score: number): string {
    if (score >= 70) return '#22c55e';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}