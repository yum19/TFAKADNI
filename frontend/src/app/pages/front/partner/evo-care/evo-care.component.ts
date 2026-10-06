import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { environment } from '../../../../../environments/environment';

// UPDATED to match DynamicCareTask from backend
export interface TaskDef {
  title: string;
  description: string;
  category: string;
  baseHealingScore: number;
}

@Component({
  selector: 'app-evo-care',
  standalone: true,
  imports: [CommonModule, MatIconModule, DragDropModule],
  templateUrl: './evo-care.component.html',
  styleUrl: './evo-care.component.scss'
})
export class EvoCareComponent implements OnInit {

  schedule: TaskDef[] = [];
  stats: any = null;
  isEvolving = false;
  evolutionText = '';
  currentGeneration = 0;
  hasEvolved = false;
  todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  private readonly DAYS_ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  constructor(private http: HttpClient) {}

  ngOnInit() {}

  startEvolution() {
    this.isEvolving = true;
    this.hasEvolved = false;
    this.currentGeneration = 0;
    this.evolutionText = 'Initializing Population (Size: 100)...';

    this.http.get<any>(`${environment.apiUrl}/partner/neuro-evo/generate-schedule`).subscribe({
      next: (res) => this.simulateEvolutionAnimation(res),
      error: (err) => {
        console.error('Evolution failed:', err);
        this.isEvolving = false;
        
        // ADD THIS ALERT: It will literally display "No active pregnancy linked to your account."
        const errorMessage = typeof err.error === 'string' ? err.error : "Failed to evolve schedule.";
        alert("⚠️ " + errorMessage);
      }
    });
  }

  private simulateEvolutionAnimation(responseData: any) {
    const msgs = [
      'Generating DNA via Generative AI...',
      "Calculating Fitness from Mother's Context...",
      'Performing Crossover & Genetic Mutations...',
      'Isolating Alpha Schedule...'
    ];
    const interval = setInterval(() => {
      this.currentGeneration = Math.min(this.currentGeneration + 22, 500);
      const mi = this.currentGeneration < 100 ? 0 : this.currentGeneration < 260 ? 1 : this.currentGeneration < 420 ? 2 : 3;
      this.evolutionText = msgs[mi];
      
      if (this.currentGeneration >= 500) {
        clearInterval(interval);
        setTimeout(() => {
          // UPDATED: map to the new backend variable names
          this.schedule = responseData.optimizedSchedule;
          this.stats = responseData;
          this.isEvolving = false;
          this.hasEvolved = true;
        }, 400);
      }
    }, 100);
  }

  drop(event: CdkDragDrop<TaskDef[]>) {
    moveItemInArray(this.schedule, event.previousIndex, event.currentIndex);
  }

  getDayAbbr(index: number): string {
    return this.DAYS_ABBR[index] ?? '';
  }

  getDayDate(index: number): number {
    const base = new Date();
    const monday = new Date(base);
    monday.setDate(base.getDate() - (base.getDay() === 0 ? 6 : base.getDay() - 1));
    monday.setDate(monday.getDate() + index);
    return monday.getDate();
  }

  // UPDATED mappings for the new AI categories
  getTypeKey(category: string): string {
    const map: Record<string, string> = {
      'CHORE': 'chore',
      'PHYSICAL': 'relax',
      'MEDICAL': 'medical',
      'EMOTIONAL': 'bonding'
    };
    return map[category] ?? 'chore';
  }

  getTypeLabel(category: string): string {
    const map: Record<string, string> = {
      'CHORE': 'Chore',
      'PHYSICAL': 'Physical Care',
      'MEDICAL': 'Medical',
      'EMOTIONAL': 'Emotional'
    };
    return map[category] ?? category;
  }

  getTypeIcon(category: string): string {
    const map: Record<string, string> = {
      'CHORE': 'cleaning_services',
      'PHYSICAL': 'spa',
      'MEDICAL': 'medical_services',
      'EMOTIONAL': 'favorite'
    };
    return map[category] ?? 'task';
  }
}