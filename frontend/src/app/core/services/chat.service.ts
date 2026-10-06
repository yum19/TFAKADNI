// src/app/core/services/chat.service.ts
import { Injectable }                  from '@angular/core';
import { HttpClient, HttpHeaders }     from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import * as Stomp                      from 'stompjs';
import SockJS                          from 'sockjs-client';
import {
  ChatMessage, ChatUser, MessageReaction, WsOutgoing, MessageType,
  ModerationEvent, ConversationOrderEvent
} from '../models/chat.model';

@Injectable({ providedIn: 'root' })
export class ChatService {

  private readonly WS_URL  = 'http://localhost:8081/ws-chat';
  private readonly API_URL = 'http://localhost:8081/api';

  private stompClient: any = null;

  private _connected      = new BehaviorSubject<boolean>(false);
  private _messages       = new BehaviorSubject<ChatMessage[]>([]);
  private _currentConvo   = new BehaviorSubject<number | null>(null);
  private _moderation     = new BehaviorSubject<ModerationEvent | null>(null);
  private _convoOrder     = new BehaviorSubject<ConversationOrderEvent | null>(null);
  private _typingUsers    = new BehaviorSubject<Set<number>>(new Set());
  private _banTimer       = new BehaviorSubject<number>(0);
  private _banInterval: any = null;

  connected$    = this._connected.asObservable();
  messages$     = this._messages.asObservable();
  moderation$   = this._moderation.asObservable();
  convoOrder$   = this._convoOrder.asObservable();
  typingUsers$  = this._typingUsers.asObservable();
  banTimer$     = this._banTimer.asObservable();

  private _meId: number | null = null;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ── WebSocket ─────────────────────────────────────────────────────────────

  connect(userId: number): void {
    if (this.stompClient?.connected) return;
    this._meId = userId;

    const socket = new SockJS(this.WS_URL);
    this.stompClient = Stomp.over(socket);
    this.stompClient.debug = null;

    this.stompClient.connect({}, () => {
      this._connected.next(true);

      // ── Main chat messages ────────────────────────────────────────────────
      this.stompClient.subscribe(`/queue/chat.${userId}`, (frame: any) => {
        try {
          const msg: ChatMessage = JSON.parse(frame.body);
          const convo = this._currentConvo.value;
          if (convo !== null && (msg.senderId === convo || msg.receiverId === convo)) {
            this._messages.next([...this._messages.value, msg]);
          }
        } catch (e) { console.error('WS parse error', e); }
      });

      // ── Emoji reactions ───────────────────────────────────────────────────
      this.stompClient.subscribe(`/queue/reaction.${userId}`, (frame: any) => {
        try {
          const update: { messageId: number; reactions: MessageReaction[] } = JSON.parse(frame.body);
          const msgs = this._messages.value.map(m =>
            m.messageId === update.messageId ? { ...m, reactions: update.reactions } : m
          );
          this._messages.next(msgs);
        } catch (e) { console.error('Reaction parse error', e); }
      });

      // ── Status updates (DELIVERED / SEEN) ─────────────────────────────────
      this.stompClient.subscribe(`/queue/status.${userId}`, (frame: any) => {
        try {
          const update: { messageId: number; status: string } = JSON.parse(frame.body);
          const msgs = this._messages.value.map(m =>
            m.messageId === update.messageId ? { ...m, status: update.status as any } : m
          );
          this._messages.next(msgs);
        } catch (e) { console.error('Status parse error', e); }
      });

      // ── Moderation events ─────────────────────────────────────────────────
      this.stompClient.subscribe(`/queue/moderation.${userId}`, (frame: any) => {
        try {
          const event: ModerationEvent = JSON.parse(frame.body);
          this._moderation.next(event);
          if (event.type === 'BAN' && event.banSeconds) {
            this._startBanTimer(event.banSeconds);
          }
        } catch (e) { console.error('Moderation parse error', e); }
      });

      // ── Conversation order ────────────────────────────────────────────────
      this.stompClient.subscribe(`/queue/conversations.${userId}`, (frame: any) => {
        try {
          const event: ConversationOrderEvent = JSON.parse(frame.body);
          this._convoOrder.next(event);
        } catch (e) { console.error('ConvoOrder parse error', e); }
      });

      // ── Typing indicator ──────────────────────────────────────────────────
      this.stompClient.subscribe(`/queue/typing.${userId}`, (frame: any) => {
        try {
          const event: { senderId: number; typing: boolean } = JSON.parse(frame.body);
          const set = new Set(this._typingUsers.value);
          if (event.typing) set.add(event.senderId);
          else set.delete(event.senderId);
          this._typingUsers.next(set);
        } catch (e) { console.error('Typing parse error', e); }
      });

    }, (err: any) => {
      console.error('WS error', err);
      this._connected.next(false);
    });
  }

  disconnect(): void {
    if (this.stompClient?.connected) this.stompClient.disconnect();
    this.stompClient = null;
    this._connected.next(false);
    this._messages.next([]);
    this._meId = null;
    this._clearBanTimer();
  }

  // ── Send text message ─────────────────────────────────────────────────────
  send(receiverId: number, content: string, extra?: Partial<WsOutgoing>): void {
    if (!this.stompClient?.connected || !this._meId) return;
    const payload: WsOutgoing = {
      senderId: this._meId,
      receiverId,
      content: content.trim(),
      messageType: 'TEXT',
      ...extra,
    };
    this.stompClient.send('/app/chat.send', {}, JSON.stringify(payload));
  }

  // ── Send file/image/voice message ─────────────────────────────────────────
  sendFile(receiverId: number, fileUrl: string, fileName: string,
           fileSize: number, type: MessageType, duration?: number,
           replyToId?: number): void {
    if (!this.stompClient?.connected || !this._meId) return;
    const payload: WsOutgoing = {
      senderId: this._meId,
      receiverId,
      content: fileName,
      messageType: type,
      fileUrl, fileName, fileSize, duration, replyToId,
    };
    this.stompClient.send('/app/chat.send', {}, JSON.stringify(payload));
  }

  // ── Emoji react ───────────────────────────────────────────────────────────
  reactToMessage(messageId: number, emoji: string): void {
    if (!this.stompClient?.connected || !this._meId) return;
    this.stompClient.send('/app/chat.react', {}, JSON.stringify({
      messageId, userId: this._meId, emoji,
    }));
  }

  // ── Typing ────────────────────────────────────────────────────────────────
  sendTyping(receiverId: number, isTyping: boolean): void {
    if (!this.stompClient?.connected || !this._meId) return;
    this.stompClient.send('/app/chat.typing', {}, JSON.stringify({
      senderId: this._meId, receiverId, typing: isTyping,
    }));
  }

  // ── REST ──────────────────────────────────────────────────────────────────

  loadHistory(otherUserId: number): Observable<ChatMessage[]> {
    this._currentConvo.next(otherUserId);
    this._messages.next([]);
    return this.http.get<ChatMessage[]>(
      `${this.API_URL}/messages/conversation?a=${this._meId}&b=${otherUserId}`,
      { headers: this.getHeaders() }
    );
  }

  setHistory(msgs: ChatMessage[]): void { this._messages.next(msgs); }

  uploadFile(file: File): Observable<{ url: string; fileName: string; fileSize: number }> {
    const fd = new FormData();
    fd.append('file', file);
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.post<{ url: string; fileName: string; fileSize: number }>(
      `${this.API_URL}/messages/upload`, fd, { headers }
    );
  }

  // ── CHANGED: now uses /api/chat/users (no ADMIN required) ────────────────
  getAllUsers(): Observable<ChatUser[]> {
    return this.http.get<ChatUser[]>(
      `${this.API_URL}/chat/users`,
      { headers: this.getHeaders() }
    );
  }

  getUserById(id: number): Observable<ChatUser> {
    return this.http.get<ChatUser>(
      `${this.API_URL}/chat/users/${id}`,
      { headers: this.getHeaders() }
    );
  }

  getLastMessages(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.API_URL}/messages/last-messages?userId=${this._meId}`,
      { headers: this.getHeaders() }
    );
  }

  markAsRead(fromId: number): void {
    if (!this._meId) return;
    this.http.post(
      `${this.API_URL}/messages/read?fromId=${fromId}&toId=${this._meId}`, null,
      { headers: this.getHeaders() }
    ).subscribe();
  }

  getUnreadCount(fromId: number): Observable<number> {
    return this.http.get<number>(
      `${this.API_URL}/messages/unread?fromId=${fromId}&toId=${this._meId}`,
      { headers: this.getHeaders() }
    );
  }

  isArchived(a: number, b: number): Observable<{ archived: boolean }> {
    return this.http.get<{ archived: boolean }>(
      `${this.API_URL}/messages/archived?a=${a}&b=${b}`,
      { headers: this.getHeaders() }
    );
  }

  // ── Ban timer ─────────────────────────────────────────────────────────────
  private _startBanTimer(seconds: number): void {
    this._clearBanTimer();
    this._banTimer.next(seconds);
    this._banInterval = setInterval(() => {
      const curr = this._banTimer.value - 1;
      this._banTimer.next(curr);
      if (curr <= 0) this._clearBanTimer();
    }, 1000);
  }

  private _clearBanTimer(): void {
    if (this._banInterval) { clearInterval(this._banInterval); this._banInterval = null; }
    this._banTimer.next(0);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  setCurrentConvo(id: number | null): void { this._currentConvo.next(id); }
  get meId() { return this._meId; }
  get stompClientRef() { return this.stompClient; }
  get currentMessages() { return this._messages.value; }
}