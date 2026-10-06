import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PartnerGuide, PartnerLink, PartnerNote, PartnerNotification, PregnancyContext } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class PartnerService {
  private http = inject(HttpClient);
  private readonly api = environment.apiUrl;


  getPermissionTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.api}/partner/partner-links/permission-types`);
  }

  getGuides(): Observable<PartnerGuide[]> {
    return this.http.get<PartnerGuide[]>(`${this.api}/partner/partner-guides`);
  }

  searchGuides(keyword: string): Observable<PartnerGuide[]> {
    return this.http.get<PartnerGuide[]>(`${this.api}/partner/partner-guides/search`, { params: { keyword } });
  }

  getGuide(id: number): Observable<PartnerGuide> {
    return this.http.get<PartnerGuide>(`${this.api}/partner/partner-guides/${id}`);
  }

  getMyPartnerInvites(): Observable<PartnerLink[]> {
    return this.http.get<PartnerLink[]>(`${this.api}/partner/partner-links/me/invites`);
  }

  getMyMotherLinks(): Observable<PartnerLink[]> {
    return this.http.get<PartnerLink[]>(`${this.api}/partner/partner-links/me/mother-links`);
  }

  createInvite(payload: { partnerId: number; pregnancyId: number; permissions: { permissionType: string; allowed: boolean }[] }): Observable<PartnerLink> {
    return this.http.post<PartnerLink>(`${this.api}/partner/partner-links`, payload);
  }

  acceptInvite(id: number): Observable<PartnerLink> {
    return this.http.put<PartnerLink>(`${this.api}/partner/partner-links/${id}/accept`, {});
  }

  rejectInvite(id: number): Observable<PartnerLink> {
    return this.http.put<PartnerLink>(`${this.api}/partner/partner-links/${id}/reject`, {});
  }

  updatePermissions(id: number, permissions: { permissionType: string; allowed: boolean }[]): Observable<PartnerLink> {
    return this.http.put<PartnerLink>(`${this.api}/partner/partner-links/${id}/permissions`, { permissions });
  }

  getActiveLink(pregnancyId: number): Observable<PartnerLink> {
    return this.http.get<PartnerLink>(`${this.api}/partner/partner-links/pregnancy/${pregnancyId}/active`);
  }

  getNotes(pregnancyId: number): Observable<PartnerNote[]> {
    return this.http.get<PartnerNote[]>(`${this.api}/partner/partner-notes/pregnancy/${pregnancyId}`);
  }

  getInbox(): Observable<PartnerNote[]> {
    return this.http.get<PartnerNote[]>(`${this.api}/partner/partner-notes/inbox/me`);
  }

  getUnreadNotesCount(): Observable<number> {
    return this.http.get<number>(`${this.api}/partner/partner-notes/inbox/me/unread-count`);
  }

  createNote(recipientId: number, pregnancyId: number, content: string): Observable<PartnerNote> {
    return this.http.post<PartnerNote>(`${this.api}/partner/partner-notes`, { recipientId, pregnancyId, content });
  }

  markNoteAsRead(id: number): Observable<PartnerNote> {
    return this.http.put<PartnerNote>(`${this.api}/partner/partner-notes/${id}/read`, {});
  }

  deleteNote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/partner/partner-notes/${id}`);
  }

  getNotifications(): Observable<PartnerNotification[]> {
    return this.http.get<PartnerNotification[]>(`${this.api}/partner/notifications/me`);
  }

  getUnreadNotificationsCount(): Observable<number> {
    return this.http.get<number>(`${this.api}/partner/notifications/me/unread-count`);
  }

  markNotificationAsRead(id: number): Observable<PartnerNotification> {
    return this.http.put<PartnerNotification>(`${this.api}/partner/notifications/${id}/read`, {});
  }

  getPregnancyContext(): Observable<PregnancyContext> {
    return this.http.get<any>(`${this.api}/pregnancies/me/active/context`).pipe(
      map(response => ({ id: response?.data?.id ?? response?.id ?? null, source: 'api' as const })),
      catchError(() => {
        const manual = localStorage.getItem('mamaai-active-pregnancy-id');
        return of({ id: manual ? Number(manual) : null, source: manual ? 'manual' as const : 'none' as const });
      })
    );
  }

  setManualPregnancyId(id: number | null): void {
    if (id) {
      localStorage.setItem('mamaai-active-pregnancy-id', String(id));
    } else {
      localStorage.removeItem('mamaai-active-pregnancy-id');
    }
  }
}
