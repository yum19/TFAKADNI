import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PrenatalExamService } from './prenatal-exam.service';
import { PregnancyService } from './pregnancy.service';

@Injectable({ providedIn: 'root' })
export class ExamBadgeService {

  private dueCount$ = new BehaviorSubject<number>(0);

  readonly due$ = this.dueCount$.asObservable();

  constructor(
    private examService: PrenatalExamService,
    private pregnancyService: PregnancyService
  ) {}

  /** Calcul semaine actuelle depuis lmpDate */
  getCurrentWeek(lmpDate: string): number {
    const lmp = new Date(lmpDate);
    const now = new Date();
    const diff = Math.floor((now.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24 * 7));
    return Math.max(1, Math.min(40, diff));
  }

  /**
   * Recharge depuis le backend :
   * badge = exams dus cette semaine + tous les alert-triggered (vital != null)
   */
  refresh() {
    this.pregnancyService.getMyPregnancies().subscribe({
      next: (pregnancies) => {
        const active = pregnancies.find((p: any) => p.status === 'ACTIVE');
        if (!active) { this.dueCount$.next(0); return; }

        const currentWeek = active.lmpDate ? this.getCurrentWeek(active.lmpDate) : 0;

        this.examService.getExamsByPregnancy(active.id).subscribe({
          next: (exams) => {
            const pending = exams.filter((e: any) => !e.done);

            // Exams dus cette semaine (sans alert-triggered)
            const dueThisWeek = pending.filter((e: any) =>
              e.recommendedWeek !== null &&
              e.recommendedWeek === currentWeek &&
              !e.vital
            ).length;

            // Tous les alert-triggered non complétés
            const alertTriggered = pending.filter((e: any) => !!e.vital).length;

            this.dueCount$.next(dueThisWeek + alertTriggered);
          },
          error: () => {}
        });
      },
      error: () => {}
    });
  }

  /** Setter direct (utilisé dans exams.component après calcul local) */
  set(count: number) {
    this.dueCount$.next(count);
  }

  /** Décrémenter sans reload réseau */
  decrement() {
    const current = this.dueCount$.getValue();
    if (current > 0) this.dueCount$.next(current - 1);
  }

  /** Reset à zéro */
  reset() {
    this.dueCount$.next(0);
  }
}