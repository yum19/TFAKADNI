// src/app/core/services/space.service.ts

import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import {
  Space,
  CreateSpaceRequest,
  SpaceWsMessage
} from '../models/space.model';

const BACKEND_URL = 'http://localhost:8081';           // ← Change if your backend port is different
const API_BASE = `${BACKEND_URL}/api/spaces`;
const WS_URL = `${BACKEND_URL}/ws-chat`;

@Injectable({ providedIn: 'root' })
export class SpaceService {

  // Reactive state
  spaces      = signal<Space[]>([]);
  activeSpace = signal<Space | null>(null);
  subtitles   = signal<{ userName: string; text: string }[]>([]);

  private wsMessage$ = new Subject<SpaceWsMessage>();
  wsMessages$ = this.wsMessage$.asObservable();

  private stompClient: Client | null = null;
  private currentSpaceId: number | null = null;

  constructor(private http: HttpClient) {}

  // ── REST Calls ─────────────────────────────────────────────────

  createSpace(req: CreateSpaceRequest): Observable<Space> {
    return this.http.post<Space>(API_BASE, req);
  }

  getSpaces(): Observable<Space[]> {
    return this.http.get(API_BASE, { observe: 'response' }).pipe(
      map(response => {
        if (response.status === 200 && Array.isArray(response.body)) {
          return response.body;
        }
        return [];
      }),
      catchError(err => {
        console.error('❌ Failed to load spaces:', err);
        return of([]);   // Prevent component crash
      })
    );
  }

  getSpace(id: number): Observable<Space> {
    return this.http.get<Space>(`${API_BASE}/${id}`);
  }

  startSpace(id: number): Observable<Space> {
    return this.http.post<Space>(`${API_BASE}/${id}/start`, {});
  }

  joinSpace(id: number): Observable<Space> {
    return this.http.post<Space>(`${API_BASE}/${id}/join`, {});
  }

  leaveSpace(id: number): Observable<void> {
    return this.http.post<void>(`${API_BASE}/${id}/leave`, {});
  }

  endSpace(id: number): Observable<void> {
    return this.http.post<void>(`${API_BASE}/${id}/end`, {});
  }

  toggleMic(id: number, active: boolean): Observable<void> {
    return this.http.post<void>(`${API_BASE}/${id}/mic`, { active });
  }

  raiseHand(id: number, raised: boolean): Observable<void> {
    return this.http.post<void>(`${API_BASE}/${id}/hand`, { raised });
  }

  promote(id: number, userId: number): Observable<void> {
    return this.http.post<void>(`${API_BASE}/${id}/promote/${userId}`, {});
  }

  kick(id: number, userId: number): Observable<void> {
    return this.http.post<void>(`${API_BASE}/${id}/kick/${userId}`, {});
  }

  // ── WebSocket ────────────────────────────────────────────

  // Replace connectToSpace in space.service.ts

private rtcReadyCallbacks: (() => void)[] = [];

// Call this before connectToSpace to register a callback that fires once STOMP connects
onStompConnect(cb: () => void): void {
  this.rtcReadyCallbacks.push(cb);
}


connectToSpace(spaceId: number, token: string): void {
  if (this.stompClient?.active) {
    this.disconnectFromSpace();
  }

  this.currentSpaceId = spaceId;
  this.subtitles.set([]);

  this.stompClient = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5000,

    onConnect: () => {
      console.log(`[SpaceService] ✅ STOMP connected for space ${spaceId}`);

      // Space event subscription
      this.stompClient!.subscribe(
        `/topic/space.${spaceId}`,
        (msg: IMessage) => {
          try {
            const data: SpaceWsMessage = JSON.parse(msg.body);
            this.wsMessage$.next(data);
          } catch(e) { console.error(e); }
        }
      );

      // Global space list
      this.stompClient!.subscribe(
        '/topic/spaces-list',
        (msg: IMessage) => {
          try {
            const data: SpaceWsMessage = JSON.parse(msg.body);
            this.wsMessage$.next({ ...data, type: 'CREATED' });
          } catch(e) { console.error(e); }
        }
      );

      // Fire RTC-ready callbacks registered by room component
      const cbs = [...this.rtcReadyCallbacks];
      this.rtcReadyCallbacks = [];
      cbs.forEach(cb => {
        try { cb(); } catch(e) { console.error('[SpaceService] RTC callback error:', e); }
      });
    },

    onStompError:     (frame) => console.error('[SpaceService] STOMP error:', frame),
    onWebSocketError: (event) => console.error('[SpaceService] WS error:', event),
  });

  this.stompClient.activate();
}

  connectForNotifications(token: string): void {
    if (this.stompClient?.active) return;

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,

      onConnect: () => {
        console.log('✅ Connected to global notifications');

        // Global space list updates
        this.stompClient!.subscribe('/topic/spaces-list', (msg: IMessage) => {
          try {
            const data: SpaceWsMessage = JSON.parse(msg.body);
            this.wsMessage$.next(data);
          } catch (e) { console.error(e); }
        });

        // Global notifications
        this.stompClient!.subscribe('/topic/spaces-notifications', (msg: IMessage) => {
          try {
            const data: SpaceWsMessage = JSON.parse(msg.body);
            this.wsMessage$.next(data);
          } catch (e) { console.error(e); }
        });

        // ✅ NEW: Personal follower notifications (Space started by someone you follow)
        const userId = localStorage.getItem('userId') || '';
        if (userId) {
          this.stompClient!.subscribe(`/topic/user.${userId}.notifications`, (msg: IMessage) => {
            try {
              const data: SpaceWsMessage = JSON.parse(msg.body);
              this.wsMessage$.next(data);

              // Show browser notification when a followed user starts a space
              if (data.type === 'SPACE_STARTED_FOLLOW' && 'Notification' in window
                  && Notification.permission === 'granted') {
                new Notification('🎙️ Space starting!', { 
                  body: data.payload || 'Someone you follow started a space!',
                  icon: '/assets/img/logo.png'
                });
              }
            } catch (e) {
              console.error('Failed to parse personal notification:', e);
            }
          });
        }
      },

      onStompError: (frame) => console.error('STOMP Error:', frame),
    });

    this.stompClient.activate();
  }

  sendWsMessage(spaceId: number, msg: SpaceWsMessage): void {
    if (!this.stompClient?.active) {
      console.warn('WebSocket not connected');
      return;
    }

    this.stompClient.publish({
      destination: `/app/space.${spaceId}`,
      body: JSON.stringify(msg),
    });
  }

  disconnectFromSpace(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
    this.currentSpaceId = null;
  }

  // Add to SpaceService

// Publish a WebRTC signal through the existing STOMP connection
publishRtcSignal(
  spaceId: number,
  dest: 'offer' | 'answer' | 'ice',
  payload: object
): void {
  if (!this.stompClient?.active) {
    console.warn('[SpaceService] STOMP not active, cannot publish RTC signal');
    return;
  }
  this.stompClient.publish({
    destination: `/app/webrtc.${dest}.${spaceId}`,
    body: JSON.stringify(payload),
  });
}

// Subscribe to a WebRTC topic through the existing STOMP connection
// Returns an unsubscribe function
subscribeRtc(topic: string, callback: (data: any) => void): () => void {
  if (!this.stompClient?.active) {
    console.warn('[SpaceService] STOMP not active for RTC subscription:', topic);
    return () => {};
  }
  const sub = this.stompClient.subscribe(topic, (msg: IMessage) => {
    try { callback(JSON.parse(msg.body)); }
    catch(e) { console.error('[SpaceService] RTC parse error:', e); }
  });
  return () => sub.unsubscribe();
}
}