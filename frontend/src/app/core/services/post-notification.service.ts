// src/app/core/services/post-notification.service.ts
import { Injectable, signal } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { PostNotification } from '../models/report.model';

declare const SockJS: any;

@Injectable({ providedIn: 'root' })
export class PostNotificationService {

  notifications  = signal<PostNotification[]>([]);
  unreadCount    = signal<number>(0);

  private client: Client | null         = null;
  private sub: StompSubscription | null = null;
  private currentEmail: string | null   = null;

  private getToken(): string {
    return localStorage.getItem('access_token') ?? localStorage.getItem('token') ?? '';
  }

  connect(userEmail: string): void {
    if (this.client?.active && this.currentEmail === userEmail) return;
    this.disconnect();
    this.currentEmail = userEmail;
    const self = this;

    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8081/ws-chat'),
      connectHeaders: {
        get Authorization() { return `Bearer ${self.getToken()}`; },
        get login()         { return userEmail; },
        get passcode()      { return self.getToken(); },
      },
      reconnectDelay: 5000,
      onConnect: () => {
        if (this.sub) { this.sub.unsubscribe(); this.sub = null; }
        this.sub = this.client!.subscribe(
          `/user/queue/post-notifications`,
          (msg: IMessage) => {
            try {
              const raw = JSON.parse(msg.body);
              const n: PostNotification = { ...raw, id: crypto.randomUUID(), readAt: undefined };
              this.notifications.update(list => [n, ...list]);
              this.unreadCount.update(c => c + 1);
            } catch (e) { console.error('[PostNotif] parse error:', e); }
          }
        );
      },
      onStompError:     (f) => console.error('[PostNotif] STOMP error:', f),
      onWebSocketError: (e) => console.error('[PostNotif] WS error:', e),
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
    this.notifications.update(list => list.map(n => ({ ...n, readAt: n.readAt ?? new Date() })));
    this.unreadCount.set(0);
  }

  clearAll(): void {
    this.notifications.set([]);
    this.unreadCount.set(0);
  }
}