// src/app/components/messenger-bubble/messenger-bubble.component.ts
import {
  Component, OnInit, OnDestroy, AfterViewChecked,
  ViewChild, ElementRef, ChangeDetectorRef, HostListener
} from '@angular/core';
import { CommonModule }           from '@angular/common';
import { FormsModule }            from '@angular/forms';
import { Router }                 from '@angular/router';
import { Subscription }           from 'rxjs';
import { ChatService }            from '../../core/services/chat.service';
import { CallService }            from '../../core/services/call.service';
import { ChatMessage, ChatUser, ModerationEvent } from '../../core/models/chat.model';

const EMOJIS = ['❤️','😂','😮','😢','😡','👍'];

@Component({
  selector:    'app-messenger-bubble',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './messenger-bubble.component.html',
  styleUrls:   ['./messenger-bubble.component.css'],
})
export class MessengerBubbleComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('bubbleEnd')   private bubbleEnd!: ElementRef;
  @ViewChild('fileInput')   private fileInput!: ElementRef<HTMLInputElement>;

  readonly EMOJIS = EMOJIS;

  // ── State ─────────────────────────────────────────────────
  isOpen        = false;
  activeUser:   ChatUser | null = null;
  users:        ChatUser[]      = [];
  messages:     ChatMessage[]   = [];
  msgText       = '';
  isTyping      = false;
  isBanned      = false;
  banSeconds    = 0;
  moderationMsg = '';
  unreadTotal   = 0;
  loadingHist   = false;
  isUploading   = false;
  showUserList  = false;
  meId:         number | null = null;

  // Reply
  replyingTo: ChatMessage | null = null;

  // Emoji picker
  emojiPickerMsgId: number | null = null;

  // Voice recording
  isRecording   = false;
  recordingTime = 0;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordInterval: any = null;

  private shouldScroll     = false;
  private subs: Subscription[] = [];
  private typingTimeout: any   = null;
  private typingActive         = false;
  private moderationTimer: any = null;

  constructor(
    public  chatSvc: ChatService,
    public  callSvc: CallService,
    private router:  Router,
    private cdr:     ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
  const token = localStorage.getItem('access_token'); // ← was 'auth_token'
  if (!token) {
    // fallback: try reading user directly from current_user
    const stored = localStorage.getItem('current_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user.id) {
          this.meId = user.id;
          this._initBubble(Number(user.id));
          this.cdr.markForCheck();
        }
      } catch {}
    }
    return;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const email = payload.sub;
    if (!email) return;

    const headers = { 'Authorization': `Bearer ${token}` };
    fetch('http://localhost:8081/api/chat/users', { headers })
      .then(r => r.json())
      .then((users: any[]) => {
        const me = users.find((u: any) => u.email === email);
        if (me?.id) {
          this.meId = me.id;
          this._initBubble(Number(me.id));
          this.cdr.markForCheck();
        }
      })
      .catch(e => console.warn('MessengerBubble: could not resolve userId', e));
  } catch (e) {
    console.warn('MessengerBubble: could not decode JWT', e);
  }
}

  private _initBubble(userId: number): void {
    this.meId = userId;
    this.chatSvc.connect(userId);

    setTimeout(() => {
      const stomp = this.chatSvc.stompClientRef;
      if (stomp) {
        this.callSvc.init(stomp, userId, 'User ' + userId);
      }
    }, 1200);

    this.chatSvc.getAllUsers().subscribe({
      next: (all) => {
        this.users = all
          .filter(u => u.id !== userId)
          .map(u => ({ ...u, displayName: u.email?.split('@')[0] || 'User ' + u.id }));
        this._computeUnreadTotal();
        this.cdr.markForCheck();
      }
    });

    this.subs.push(
      this.chatSvc.messages$.subscribe(msgs => {
        this.messages     = msgs;
        this.shouldScroll = true;
        this.cdr.markForCheck();
      }),
      this.chatSvc.moderation$.subscribe(ev => {
        if (!ev) return;
        this._handleMod(ev);
        this.cdr.markForCheck();
      }),
      this.chatSvc.banTimer$.subscribe(secs => {
        this.banSeconds = secs;
        this.isBanned   = secs > 0;
        this.cdr.markForCheck();
      }),
      this.chatSvc.convoOrder$.subscribe(ev => {
        if (!ev) return;
        const u = this.users.find(x => x.id === ev.partnerId);
        if (u) {
          u.lastMessage = ev.lastMessage;
          u.lastTime    = ev.timestamp;
          if (!this.activeUser || this.activeUser.id !== ev.partnerId) {
            u.unread = (u.unread || 0) + 1;
            this._computeUnreadTotal();
          }
        }
        this.users.sort((a, b) => {
          const ta = a.lastTime ? new Date(a.lastTime).getTime() : 0;
          const tb = b.lastTime ? new Date(b.lastTime).getTime() : 0;
          return tb - ta;
        });
        this.cdr.markForCheck();
      }),
      this.chatSvc.typingUsers$.subscribe(set => {
        this.isTyping = this.activeUser ? set.has(this.activeUser.id) : false;
        this.cdr.markForCheck();
      }),
    );
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      try { this.bubbleEnd?.nativeElement.scrollIntoView({ behavior: 'smooth' }); } catch {}
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    clearTimeout(this.moderationTimer);
  }

  // ── Open / Close ──────────────────────────────────────────
  toggleOpen(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen && !this.activeUser) this.showUserList = true;
    else if (!this.isOpen) this.showUserList = false;
  }

  openUser(user: ChatUser): void {
    this.activeUser   = user;
    this.showUserList = false;
    this.loadingHist  = true;
    this.replyingTo   = null;
    this.chatSvc.loadHistory(user.id).subscribe({
      next: (h) => {
        this.chatSvc.setHistory(h);
        this.loadingHist  = false;
        this.shouldScroll = true;
        this.chatSvc.markAsRead(user.id);
        user.unread = 0;
        this._computeUnreadTotal();
      },
      error: () => { this.loadingHist = false; }
    });
  }

  // ── Send ──────────────────────────────────────────────────
  send(): void {
    if (!this.msgText.trim() || !this.activeUser || this.isBanned) return;
    this.chatSvc.send(this.activeUser.id, this.msgText, {
      replyToId: this.replyingTo?.messageId ?? undefined,
    });
    this.msgText    = '';
    this.replyingTo = null;
    this._stopTyping();
  }

  onEnter(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
  }

  onInput(): void {
    if (!this.activeUser) return;
    if (!this.typingActive) {
      this.typingActive = true;
      this.chatSvc.sendTyping(this.activeUser.id, true);
    }
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => this._stopTyping(), 3000);
  }

  private _stopTyping(): void {
    if (this.typingActive && this.activeUser) {
      this.chatSvc.sendTyping(this.activeUser.id, false);
    }
    this.typingActive = false;
    clearTimeout(this.typingTimeout);
  }

  // ── Reply ─────────────────────────────────────────────────
  setReply(msg: ChatMessage): void  { this.replyingTo = msg; }
  cancelReply(): void               { this.replyingTo = null; }

  // ── File upload ───────────────────────────────────────────
  triggerFileInput(type: 'image' | 'file'): void {
    if (!this.fileInput) return;
    this.fileInput.nativeElement.accept = type === 'image' ? 'image/*' : '*/*';
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file || !this.activeUser) return;
    const type = file.type.startsWith('image/') ? 'IMAGE' : 'FILE';
    this.isUploading = true;
    this.chatSvc.uploadFile(file).subscribe({
      next: (res) => {
        this.isUploading = false;
        this.chatSvc.sendFile(
          this.activeUser!.id, res.url, res.fileName, res.fileSize,
          type as any, undefined, this.replyingTo?.messageId ?? undefined
        );
        this.replyingTo = null;
      },
      error: () => { this.isUploading = false; }
    });
    input.value = '';
  }

  // ── Voice recording ───────────────────────────────────────
  async startRecording(): Promise<void> {
    if (!navigator.mediaDevices) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks   = [];
      this.mediaRecorder = new MediaRecorder(stream);
      this.mediaRecorder.ondataavailable = e => { if (e.data.size) this.audioChunks.push(e.data); };
      this.mediaRecorder.start();
      this.isRecording   = true;
      this.recordingTime = 0;
      this.recordInterval = setInterval(() => { this.recordingTime++; this.cdr.markForCheck(); }, 1000);
    } catch {}
  }

  stopRecording(send: boolean): void {
    if (!this.mediaRecorder) return;
    clearInterval(this.recordInterval);
    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
      if (send && this.activeUser) {
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        const dur  = this.recordingTime;
        this.isUploading = true;
        this.chatSvc.uploadFile(file).subscribe({
          next: (res) => {
            this.isUploading = false;
            this.chatSvc.sendFile(
              this.activeUser!.id, res.url, res.fileName, res.fileSize,
              'VOICE', dur, this.replyingTo?.messageId ?? undefined
            );
            this.replyingTo = null;
          },
          error: () => { this.isUploading = false; }
        });
      }
      this.mediaRecorder?.stream.getTracks().forEach(t => t.stop());
    };
    this.mediaRecorder.stop();
    this.isRecording = false;
  }

  formatRecordingTime(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // ── Reactions ─────────────────────────────────────────────
  toggleEmojiPicker(msgId: number | undefined, event: MouseEvent): void {
    event.stopPropagation();
    this.emojiPickerMsgId = this.emojiPickerMsgId === msgId ? null : (msgId ?? null);
  }

  pickEmoji(msgId: number | undefined, emoji: string): void {
    if (!msgId) return;
    this.chatSvc.reactToMessage(msgId, emoji);
    this.emojiPickerMsgId = null;
  }

  @HostListener('document:click')
  closeEmojiPicker(): void { this.emojiPickerMsgId = null; }

  reactionGroups(msg: ChatMessage): { emoji: string; count: number; hasMe: boolean }[] {
    const map = new Map<string, { count: number; hasMe: boolean }>();
    (msg.reactions || []).forEach(r => {
      const ex = map.get(r.emoji) || { count: 0, hasMe: false };
      ex.count++;
      if (r.userId === this.meId) ex.hasMe = true;
      map.set(r.emoji, ex);
    });
    return Array.from(map.entries()).map(([emoji, val]) => ({ emoji, ...val }));
  }

  // ── Navigation ────────────────────────────────────────────
  openFullChat(): void {
    if (this.meId) {
      this.router.navigate(['/mother/communaute/chat'], { queryParams: { userId: this.meId } });
    }
  }

  backToList(): void { this.showUserList = true; this.activeUser = null; }

  // ── Helpers ───────────────────────────────────────────────
  isMe(msg: ChatMessage): boolean { return msg.senderId === this.meId; }
  isUrl(text: string): boolean {
    try { new URL(text); return true; } catch { return false; }
  }
  fileIcon(msg: ChatMessage): string {
    const name = msg.fileName?.toLowerCase() ?? '';
    if (name.endsWith('.pdf'))  return '📄';
    if (name.endsWith('.doc') || name.endsWith('.docx')) return '📝';
    if (name.endsWith('.xls') || name.endsWith('.xlsx')) return '📊';
    if (name.endsWith('.zip') || name.endsWith('.rar'))  return '🗜️';
    return '📎';
  }
  formatSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024)        return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
  initial(u: ChatUser | null): string {
    return (u?.displayName || u?.email || '?').charAt(0).toUpperCase();
  }
  formatTime(ts?: string): string {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private _handleMod(ev: ModerationEvent): void {
    clearTimeout(this.moderationTimer);
    this.moderationMsg = ev.reason;
    if (ev.type !== 'BAN') {
      this.moderationTimer = setTimeout(() => { this.moderationMsg = ''; this.cdr.markForCheck(); }, 5000);
    }
  }

  private _computeUnreadTotal(): void {
    this.unreadTotal = this.users.reduce((sum, u) => sum + (u.unread || 0), 0);
  }
}