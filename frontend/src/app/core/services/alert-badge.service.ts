import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AlertsService } from './alerts.service';

@Injectable({ providedIn: 'root' })
export class AlertBadgeService {

  private unreadCount$ = new BehaviorSubject<number>(0);

  /** Observable que les composants peuvent écouter */
  readonly unread$ = this.unreadCount$.asObservable();

  constructor(private alertsService: AlertsService) {}

  /** Charger le count depuis le backend */
  refresh() {
    this.alertsService.getUnreadAlerts().subscribe({
      next: (list) => this.unreadCount$.next(list.length),
      error: () => {}
    });
  }

  /** Décrémenter sans appel réseau (ex: après markAsRead) */
  decrement() {
    const current = this.unreadCount$.getValue();
    if (current > 0) this.unreadCount$.next(current - 1);
  }

  /** Remettre à zéro (ex: après markAllAsRead) */
  reset() {
    this.unreadCount$.next(0);
  }

  /** Setter direct */
  set(count: number) {
    this.unreadCount$.next(count);
  }
}