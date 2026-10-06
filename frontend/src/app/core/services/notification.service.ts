import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AppNotification {
  id: string;
  type: 'EXAM_DUE' | 'ALERT_TRIGGERED' | 'VITALS_REMINDER';
  title: string;
  message: string;
  count?: number;
  isRead: boolean;
  createdAt: string;
  // Frontend-only
  _exiting?: boolean;
  _duration?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private url = `${environment.apiUrl}/notifications`;
  private notifications$ = new BehaviorSubject<AppNotification[]>([]);
  readonly notifications = this.notifications$.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Load unread from backend — also triggers server-side checks.
   * Called once on app load from web-layout.
   */
  loadUnread() {
    console.log('NotificationService: loading unread notifications');
    this.http.get<AppNotification[]>(`${this.url}/me/unread`).subscribe({
      next: (list) => {
        console.log('NotificationService: unread response length =', list.length, list);
        if (list.length === 0) {
          console.warn('NotificationService: unread returned empty; falling back to get all notifications');
          this.http.get<AppNotification[]>(`${this.url}/me`).subscribe({
            next: (all) => {
              const unread = all.filter(n => !n.isRead);
              console.log('NotificationService: fallback all response length =', all.length, 'unread count =', unread.length, all);
              const withDuration = unread.map(n => ({
                ...n,
                _duration: this.getDuration(n.type),
                _exiting: false,
              }));
              this.notifications$.next(withDuration);
            },
            error: (err) => {
              console.error('NotificationService: fallback getAll failed', err);
            }
          });
          return;
        }

        const withDuration = list.map(n => ({
          ...n,
          _duration: this.getDuration(n.type),
          _exiting: false,
        }));
        this.notifications$.next(withDuration);
      },
      error: (err) => {
        console.error('Failed to load notifications', err);
      }
    });
  }

  /**
   * Get all notifications for the page view
   */
  getAll() {
    return this.http.get<AppNotification[]>(`${this.url}/me`);
  }

  /**
   * Mark as read
   */
  markAsRead(id: string) {
    return this.http.put(`${this.url}/${id}/read`, {});
  }

  /**
   * Mark all as read
   */
  markAllAsRead() {
    return this.http.put(`${this.url}/me/read-all`, {});
  }

  dismiss(id: string) {
    // Mark as exiting (animation)
    const current = this.notifications$.getValue();
    this.notifications$.next(
      current.map(n => n.id === id ? { ...n, _exiting: true } : n)
    );
    // Remove after animation + mark as read so it doesn't reappear
    setTimeout(() => {
      this.notifications$.next(
        this.notifications$.getValue().filter(n => n.id !== id)
      );
      // Mark as read instead of delete
      this.http.put(`${this.url}/${id}/read`, {}).subscribe();
    }, 350);
  }

  dismissAll() {
    this.notifications$.next([]);
    // Mark all as read
    this.http.put(`${this.url}/me/read-all`, {}).subscribe();
  }

  private getDuration(type: string): number {
    const m: any = {
      VITALS_REMINDER: 7000,
      EXAM_DUE: 8000,
      ALERT_TRIGGERED: 10000,
    };
    return m[type] ?? 6000;
  }
}