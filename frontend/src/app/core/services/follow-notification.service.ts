// src/app/core/services/follow-notification.service.ts
import { Injectable, signal } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { FollowNotification } from '../models/follow-notification.model';
import { UserSummary } from '../models/user-summary.model';

declare const SockJS: any;

@Injectable({ providedIn: 'root' })
export class FollowNotificationService {

  notifications  = signal<FollowNotification[]>([]);
  unreadCount    = signal<number>(0);

  private client: Client | null         = null;
  private sub: StompSubscription | null = null;
  private currentEmail: string | null   = null;
  onlineUsers = signal<UserSummary[]>([]);
onlineCount = signal<number>(0);

  // ── Read token fresh every time — never cache it ──────────────────────────
  private getToken(): string {
    // Try both keys in case auth service uses either
    return localStorage.getItem('auth_token')
        ?? localStorage.getItem('token')
        ?? '';
  }
  setOnlineUsers(users: UserSummary[]): void {
  this.onlineUsers.set(users);
  this.onlineCount.set(users.length);
}

  connect(userEmail: string): void {
    if (this.client?.active && this.currentEmail === userEmail) {
      console.log('[Notif] already connected for', userEmail);
      return;
    }
    this.disconnect();
    this.currentEmail = userEmail;

    console.log('[Notif] connecting for:', userEmail);
    console.log('[Notif] token at connect time:', this.getToken().substring(0, 30) + '...');

    const self = this; // capture reference for closures

    this.client = new Client({
      // ── Read token INSIDE factory so it's fresh ──────────────────────────
      webSocketFactory: () => {
        const token = self.getToken();
        console.log('[Notif] webSocketFactory token:', token.substring(0, 30) + '...');
        return new SockJS('http://localhost:8081/ws-chat');
      },

      // ── connectHeaders as a FUNCTION so token is read at connect time ────
      connectHeaders: {
        get Authorization() { return `Bearer ${self.getToken()}`; },
        get login()         { return userEmail; },
        get passcode()      { return self.getToken(); },
      },

      reconnectDelay: 5000,
      debug: (str: string) => console.log('[STOMP]', str),

      onConnect: (frame) => {
        console.log('[Notif] ✅ connected');
        console.log('[Notif] frame user:', frame.headers['user-name']);

        if (this.sub) { this.sub.unsubscribe(); this.sub = null; }

        this.sub = this.client!.subscribe(
  `/user/queue/follow-notifications`,
  (msg: IMessage) => {
    console.log('[Notif] 🔔 received:', msg.body);
    try {
      const raw = JSON.parse(msg.body);

      // Handle both follow notifications and space-started notifications
      const n: FollowNotification = raw.type === 'SPACE_STARTED_FOLLOW'
        ? {
            followerId:   raw.spaceId,
            followerName: '🎙️ Space',
            message:      raw.payload ?? 'A space you follow just started!',
            type:         'FOLLOW',
            id:           crypto.randomUUID(),
            readAt:       undefined,
          }
        : {
            ...raw,
            id:     crypto.randomUUID(),
            readAt: undefined,
          };

      this.notifications.update(list => [n, ...list]);
      this.unreadCount.update(c => c + 1);
    } catch (e) {
      console.error('[Notif] parse error:', e);
    }
  }
);
      },

      onStompError:     (f) => console.error('[Notif] STOMP error:', f.headers['message'], f.body),
      onWebSocketError: (e) => console.error('[Notif] WS error:', e),
      onDisconnect:     ()  => console.log('[Notif] disconnected'),
    });

    this.client.activate();
  }

  disconnect(): void {
    this.sub?.unsubscribe();
    this.sub = null;
    this.client?.deactivate();
    this.client       = null;
    this.currentEmail = null;
  }

  markAllRead(): void {
    this.notifications.update(list =>
      list.map(n => ({ ...n, readAt: n.readAt ?? new Date() }))
    );
    this.unreadCount.set(0);
  }

  clearAll(): void {
    this.notifications.set([]);
    this.unreadCount.set(0);
  }
}