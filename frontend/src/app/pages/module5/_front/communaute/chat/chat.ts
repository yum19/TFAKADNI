// src/app/pages/shop/_front/communaute/chat/chat.ts
import {
  Component, OnInit, OnDestroy, AfterViewChecked,
  ViewChild, ElementRef, ChangeDetectorRef, HostListener
} from '@angular/core';
import { CommonModule }           from '@angular/common';
import { FormsModule }            from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription }           from 'rxjs';

import { ChatService }                                from '../../../../../core/services/chat.service';
import { CallService, CallType, CallBubble }          from '../../../../../core/services/call.service';
import { ChatMessage, ChatUser, ModerationEvent }     from '../../../../../core/models/chat.model';
import { IndexHeaderComponent }                       from '../../../../../components/index-header/index-header.component';
import { CallOverlayComponent }                       from '../../../../../components/call-overlay/call-overlay.component';

const EMOJIS = ['❤️','😂','😮','😢','😡','👍'];

// ── Shared file model ──────────────────────────────────────────
export interface SharedFile {
  id:        string;
  name:      string;
  url:       string;
  size:      number;
  mimeType:  string;
  sharedAt:  string;
  senderId:  number;
  category:  'doc' | 'img' | 'vid' | 'oth';
}

// ── Theme model ────────────────────────────────────────────────
export interface ChatTheme {
  key:     string;
  label:   string;
  preview: string;
}

const CHAT_THEMES: ChatTheme[] = [
  { key: 'default',  label: 'Default',  preview: '#f7f8fa' },
  { key: 'rose',     label: 'Rose',     preview: 'linear-gradient(160deg,#fff0f3,#fce7f3,#f0f3ff)' },
  { key: 'midnight', label: 'Midnight', preview: 'linear-gradient(160deg,#0f172a,#1e1b4b,#1a0a2e)' },
  { key: 'forest',   label: 'Forest',   preview: 'linear-gradient(160deg,#f0fdf4,#dcfce7,#ecfdf5)' },
  { key: 'ocean',    label: 'Ocean',    preview: 'linear-gradient(160deg,#e0f2fe,#dbeafe,#ede9fe)' },
  { key: 'sunset',   label: 'Sunset',   preview: 'linear-gradient(160deg,#fff7ed,#fef3c7,#fce7f3)' },
];

const THEME_STORAGE_KEY = 'chat_theme';
const SHARED_FILES_KEY  = 'shared_files_';

@Component({
  selector:    'app-chat',
  standalone:  true,
  imports:     [CommonModule, FormsModule, IndexHeaderComponent, CallOverlayComponent],
  templateUrl: './chat.html',
  styleUrls:   ['./chat.css'],
})
export class Chat implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('msgEnd')          private msgEnd!: ElementRef;
  @ViewChild('fileInput')       private fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('sharedFileInput') private sharedFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('msgTextarea')     private msgTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('filesPanel')      filesPanel!: ElementRef;

  // ── State ─────────────────────────────────────────────────────────────────
  me:           ChatUser | null = null;
  users:        ChatUser[]      = [];
  activeUser:   ChatUser | null = null;
  messages:     ChatMessage[]   = [];
  msgText       = '';
  loadingHist   = false;
  loading       = true;
  error         = '';
  unreadMap:    Record<number, number> = {};
  searchQuery   = '';
  showArchive   = false;
  callActive    = false;

  // Ban
  banSeconds    = 0;
  isBanned      = false;

  // Moderation
  moderationMsg = '';
  moderationTimer: any = null;

  // Reply
  replyingTo: ChatMessage | null = null;

  // Emoji picker
  emojiPickerMsgId: number | null = null;
  readonly EMOJIS = EMOJIS;

  // Typing
  isPartnerTyping = false;
  private typingSet: Set<number> = new Set();
  private typingTimeout: any = null;
  private typingActive = false;

  // Voice recording
  isRecording   = false;
  recordingTime = 0;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordInterval: any = null;

  // Upload
  isUploading = false;

  // ── Theme ─────────────────────────────────────────────────────────────────
  readonly chatThemes: ChatTheme[] = CHAT_THEMES;
  activeTheme    = 'default';
  showThemePanel = false;

  // ── Shared files ──────────────────────────────────────────────────────────
  sharedFiles:  SharedFile[] = [];
  sharedLinks:  { url: string; sharedAt: string }[] = [];
  openCategory: Record<string, boolean> = { doc: true, img: true, vid: false, oth: false };

  private shouldScroll = false;
  private subs: Subscription[] = [];

  constructor(
    public  chatSvc: ChatService,
    public  callSvc: CallService,
    private router:  Router,
    private route:   ActivatedRoute,
    private cdr:     ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && this.chatThemes.find(t => t.key === saved)) {
      this.activeTheme = saved;
    }

    const userId = Number(this.route.snapshot.queryParamMap.get('userId'));
const targetUserId = Number(this.route.snapshot.queryParamMap.get('targetUserId'));

if (!userId || isNaN(userId)) {
  this.error   = 'No user ID in URL. Use /communaute/chat?userId=1';
  this.loading = false;
  return;
}
this._init(userId, targetUserId || null);
  }

  // ── Theme ─────────────────────────────────────────────────────────────────

  toggleThemePanel(event: MouseEvent): void {
    event.stopPropagation();
    this.showThemePanel = !this.showThemePanel;
  }
  closeThemePanel(): void { this.showThemePanel = false; }
  setTheme(key: string): void {
    this.activeTheme    = key;
    this.showThemePanel = false;
    localStorage.setItem(THEME_STORAGE_KEY, key);
    this.cdr.markForCheck();
  }

  // ── Shared files ──────────────────────────────────────────────────────────

  /** Load stored shared files for current conversation */
  private _loadSharedFiles(): void {
    if (!this.me || !this.activeUser) return;
    const key = SHARED_FILES_KEY + Math.min(this.me.id, this.activeUser.id) + '_' + Math.max(this.me.id, this.activeUser.id);
    try {
      const raw = localStorage.getItem(key);
      this.sharedFiles = raw ? JSON.parse(raw) : [];
    } catch { this.sharedFiles = []; }
    // Extract link messages as "shared links"
    this.sharedLinks = this.messages
      .filter(m => m.messageType === 'LINK' || (m.messageType === 'TEXT' && this.isUrl(m.content)))
      .map(m => ({ url: m.content, sharedAt: m.timestamp || '' }));
    // Also populate sharedFiles from FILE/IMAGE messages in history
    const msgFiles = this.messages
      .filter(m => (m.messageType === 'FILE' || m.messageType === 'IMAGE') && m.fileUrl)
      .map(m => this._chatMsgToSharedFile(m))
      .filter((f): f is SharedFile => !!f);
    // Merge with stored (avoid duplicates by url)
    const existingUrls = new Set(this.sharedFiles.map(f => f.url));
    for (const f of msgFiles) {
      if (!existingUrls.has(f.url)) {
        this.sharedFiles.push(f);
        existingUrls.add(f.url);
      }
    }
    this._saveSharedFiles();
  }

  private _chatMsgToSharedFile(msg: ChatMessage): SharedFile | null {
    if (!msg.fileUrl) return null;
    return {
      id:       String(msg.messageId || Date.now()),
      name:     msg.fileName || 'file',
      url:      msg.fileUrl,
      size:     msg.fileSize || 0,
      mimeType: this._guessMime(msg.fileName || ''),
      sharedAt: msg.timestamp || new Date().toISOString(),
      senderId: msg.senderId,
      category: this._categorize(msg.fileName || '', msg.messageType as string),
    };
  }

  private _guessMime(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
      pdf: 'application/pdf', doc: 'application/msword', docx: 'application/msword',
      xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.ms-excel',
      png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
      mp4: 'video/mp4', mov: 'video/quicktime', avi: 'video/avi',
      mp3: 'audio/mpeg', wav: 'audio/wav',
      zip: 'application/zip', rar: 'application/rar',
    };
    return map[ext] || 'application/octet-stream';
  }

  private _categorize(name: string, msgType: string): 'doc' | 'img' | 'vid' | 'oth' {
    if (msgType === 'IMAGE') return 'img';
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) return 'img';
    if (['mp4','mov','avi','mkv','webm','flv'].includes(ext)) return 'vid';
    if (['pdf','doc','docx','xls','xlsx','ppt','pptx','txt','csv'].includes(ext)) return 'doc';
    return 'oth';
  }

  private _saveSharedFiles(): void {
    if (!this.me || !this.activeUser) return;
    const key = SHARED_FILES_KEY + Math.min(this.me.id, this.activeUser.id) + '_' + Math.max(this.me.id, this.activeUser.id);
    try { localStorage.setItem(key, JSON.stringify(this.sharedFiles)); } catch {}
  }

  filesByCategory(cat: string): SharedFile[] {
    return this.sharedFiles.filter(f => f.category === cat);
  }

  categorySize(cat: string): string {
    const total = this.filesByCategory(cat).reduce((s, f) => s + f.size, 0);
    return this.formatSize(total);
  }

  toggleCategory(cat: string): void {
    this.openCategory[cat] = !this.openCategory[cat];
  }

  fileItemIconClass(f: SharedFile): string {
    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return 'ch-file-item-icon--pdf';
    if (['doc','docx','txt'].includes(ext)) return 'ch-file-item-icon--doc';
    if (['xls','xlsx','csv'].includes(ext)) return 'ch-file-item-icon--xls';
    if (['jpg','jpeg','png','gif','webp'].includes(ext)) return 'ch-file-item-icon--img';
    if (['mp4','mov','avi','mkv'].includes(ext)) return 'ch-file-item-icon--vid';
    if (['zip','rar','7z'].includes(ext)) return 'ch-file-item-icon--zip';
    return 'ch-file-item-icon--oth';
  }

  fileItemLabel(f: SharedFile): string {
    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return 'PDF';
    if (['doc','docx'].includes(ext)) return 'DOC';
    if (['xls','xlsx'].includes(ext)) return 'XLS';
    if (['zip','rar'].includes(ext)) return 'ZIP';
    return ext.toUpperCase().substring(0, 3) || 'FILE';
  }

  triggerSharedFileInput(): void {
    this.sharedFileInput?.nativeElement.click();
  }

  onSharedFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || !this.activeUser) return;

    Array.from(files).forEach(file => {
      this.isUploading = true;
      this.chatSvc.uploadFile(file).subscribe({
        next: (res) => {
          this.isUploading = false;
          const sf: SharedFile = {
            id:       Date.now() + '_' + file.name,
            name:     res.fileName || file.name,
            url:      res.url,
            size:     res.fileSize || file.size,
            mimeType: file.type,
            sharedAt: new Date().toISOString(),
            senderId: this.me!.id,
            category: this._categorize(file.name, file.type.startsWith('image/') ? 'IMAGE' : 'FILE'),
          };
          this.sharedFiles = [...this.sharedFiles, sf];
          this._saveSharedFiles();
          // Also send as a message in the chat
          this.chatSvc.sendFile(
            this.activeUser!.id, res.url, res.fileName, res.fileSize,
            file.type.startsWith('image/') ? 'IMAGE' : 'FILE'
          );
          this.cdr.markForCheck();
        },
        error: () => { this.isUploading = false; }
      });
    });
    input.value = '';
  }

  scrollToSharedFiles(): void {
    this.filesPanel?.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  private _init(userId: number, autoOpenTargetId: number | null = null): void {
  this.loading = true;
  this.error   = '';

  this.chatSvc.getUserById(userId).subscribe({
    next: (me) => {
      this.me = this._withDisplay(me);

      this.chatSvc.getAllUsers().subscribe({
        next: (all) => {
          this.users   = all.filter(u => u.id !== userId).map(u => this._withDisplay(u));
          this.loading = false;

          this.chatSvc.connect(userId);

          setTimeout(() => {
            const stomp = this.chatSvc.stompClientRef;
            if (stomp) {
              const displayName = me.email ? me.email.split('@')[0] : 'User ' + userId;
              this.callSvc.init(stomp, userId, displayName);
            }
          }, 1000);

          this._loadConversationOrder();

          this.subs.push(
            this.chatSvc.messages$.subscribe(msgs => {
              this.messages     = msgs;
              this.shouldScroll = true;
              if (this.activeUser) this._loadSharedFiles();
              this.cdr.markForCheck();
            }),
            this.chatSvc.moderation$.subscribe(ev => {
              if (!ev) return;
              this._handleModeration(ev);
              this.cdr.markForCheck();
            }),
            this.chatSvc.convoOrder$.subscribe(ev => {
              if (!ev) return;
              this._updateUserOrder(ev.partnerId, ev.lastMessage, ev.timestamp);
              this.cdr.markForCheck();
            }),
            this.chatSvc.typingUsers$.subscribe(set => {
              this.typingSet       = set;
              this.isPartnerTyping = this.activeUser ? set.has(this.activeUser.id) : false;
              this.cdr.markForCheck();
            }),
            this.chatSvc.banTimer$.subscribe(secs => {
              this.banSeconds = secs;
              this.isBanned   = secs > 0;
              this.cdr.markForCheck();
            }),
            this.callSvc.session$.subscribe(s => {
              this.callActive = !!(s && s.state !== 'ended');
              this.cdr.markForCheck();
            }),
            this.callSvc.callBubble$.subscribe(bubble => {
              if (!bubble || !this.activeUser) return;
              const involved =
                (bubble.callerId === this.me?.id && bubble.calleeId === this.activeUser.id) ||
                (bubble.calleeId === this.me?.id && bubble.callerId === this.activeUser.id);
              if (!involved) return;
              const callMsg: ChatMessage = {
                senderId:    bubble.callerId,
                receiverId:  bubble.calleeId,
                content:     this._callBubbleText(bubble),
                timestamp:   bubble.timestamp,
                messageType: 'CALL' as any,
              };
              this.chatSvc.setHistory([...this.chatSvc.currentMessages, callMsg]);
              this.shouldScroll = true;
            }),
          );

          this.users.forEach(u => this._refreshUnread(u.id));

          // ← AUTO-OPEN target conversation if provided
          if (autoOpenTargetId) {
            const target = this.users.find(u => u.id === autoOpenTargetId);
            if (target) {
              setTimeout(() => this.openConversation(target), 300);
            }
          }
        },
        error: () => { this.error = 'Could not load users.'; this.loading = false; },
      });
    },
    error: () => { this.error = `User ${userId} not found.`; this.loading = false; },
  });
}

  private _handleModeration(ev: ModerationEvent): void {
    clearTimeout(this.moderationTimer);
    if (ev.type === 'WARNING') {
      this.moderationMsg = ev.reason;
      this.moderationTimer = setTimeout(() => { this.moderationMsg = ''; this.cdr.markForCheck(); }, 6000);
    } else if (ev.type === 'BAN') {
      this.moderationMsg = ev.reason + ` (${ev.banSeconds}s ban)`;
    } else if (ev.type === 'PEER_BANNED') {
      this.moderationMsg = '🚫 ' + ev.reason;
      this.moderationTimer = setTimeout(() => { this.moderationMsg = ''; this.cdr.markForCheck(); }, 8000);
    }
  }

  private _loadConversationOrder(): void {
    this.chatSvc.getLastMessages().subscribe({
      next: (rows: any[]) => {
        rows.forEach(row => {
          const user = this.users.find(u => u.id === Number(row.partnerId));
          if (user) {
            user.lastMessage = row.lastMessage;
            user.lastTime    = row.timestamp;
            user.unread      = Number(row.unread) || 0;
          }
        });
        this._sortUsers();
        this.cdr.markForCheck();
      }
    });
  }

  private _updateUserOrder(partnerId: number, lastMsg: string, ts: string): void {
    const user = this.users.find(u => u.id === partnerId);
    if (user) {
      user.lastMessage = lastMsg;
      user.lastTime    = ts;
      if (this.activeUser?.id !== partnerId) user.unread = (user.unread || 0) + 1;
    }
    this._sortUsers();
  }

  private _sortUsers(): void {
    this.users.sort((a, b) => {
      const ta = a.lastTime ? new Date(a.lastTime).getTime() : 0;
      const tb = b.lastTime ? new Date(b.lastTime).getTime() : 0;
      return tb - ta;
    });
  }

  ngOnDestroy(): void {
    this.chatSvc.disconnect();
    this.subs.forEach(s => s.unsubscribe());
    clearTimeout(this.moderationTimer);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) { this._scrollBottom(); this.shouldScroll = false; }
  }

  // ── Conversation ──────────────────────────────────────────────────────────

  openConversation(user: ChatUser): void {
    if (this.activeUser?.id === user.id) return;
    this.activeUser      = user;
    this.replyingTo      = null;
    this.moderationMsg   = '';
    this.loadingHist     = true;
    this.isPartnerTyping = false;
    this.sharedFiles     = [];
    this.sharedLinks     = [];
    this.showThemePanel  = false;

    this.chatSvc.loadHistory(user.id).subscribe({
      next: (history) => {
        this.chatSvc.setHistory(history);
        this.loadingHist  = false;
        this.shouldScroll = true;
        this.chatSvc.markAsRead(user.id);
        user.unread = 0;

        this._loadSharedFiles();

        this.chatSvc.isArchived(this.me!.id, user.id).subscribe(r => {
          user.isArchived = r.archived;
          this.cdr.markForCheck();
        });
      },
      error: () => { this.loadingHist = false; },
    });
  }

  // ── Send ──────────────────────────────────────────────────────────────────

  send(): void {
    if (!this.msgText.trim() || !this.activeUser || this.isBanned) return;
    this.chatSvc.send(this.activeUser.id, this.msgText, {
      replyToId: this.replyingTo?.messageId ?? undefined,
    });
    this.msgText    = '';
    this.replyingTo = null;
    this._stopTypingSignal();
    if (this.msgTextarea) this.msgTextarea.nativeElement.style.height = 'auto';
  }

  onEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); this.send(); }
  }

  // ── Typing ────────────────────────────────────────────────────────────────

  onInput(): void {
    if (!this.activeUser) return;
    if (!this.typingActive) {
      this.typingActive = true;
      this.chatSvc.sendTyping(this.activeUser.id, true);
    }
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => this._stopTypingSignal(), 3000);
  }

  private _stopTypingSignal(): void {
    if (this.typingActive && this.activeUser) this.chatSvc.sendTyping(this.activeUser.id, false);
    this.typingActive = false;
    clearTimeout(this.typingTimeout);
  }

  isTypingUser(userId: number): boolean { return this.typingSet.has(userId); }

  // ── Reply ─────────────────────────────────────────────────────────────────
  setReply(msg: ChatMessage): void  { this.replyingTo = msg; }
  cancelReply(): void               { this.replyingTo = null; }

  // ── File upload ───────────────────────────────────────────────────────────

  triggerFileInput(type: 'image' | 'file'): void {
    if (!this.fileInput) return;
    this.fileInput.nativeElement.accept = type === 'image' ? 'image/*' : '*/*';
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file || !this.activeUser) return;

    const isImage = file.type.startsWith('image/');
    const type    = isImage ? 'IMAGE' : 'FILE';

    this.isUploading = true;
    this.chatSvc.uploadFile(file).subscribe({
      next: (res) => {
        this.isUploading = false;
        this.chatSvc.sendFile(
          this.activeUser!.id, res.url, res.fileName, res.fileSize,
          type as any, undefined, this.replyingTo?.messageId ?? undefined
        );
        // Add to shared files panel
        const sf: SharedFile = {
          id:       Date.now() + '_' + file.name,
          name:     res.fileName || file.name,
          url:      res.url,
          size:     res.fileSize || file.size,
          mimeType: file.type,
          sharedAt: new Date().toISOString(),
          senderId: this.me!.id,
          category: this._categorize(file.name, type),
        };
        this.sharedFiles = [...this.sharedFiles, sf];
        this._saveSharedFiles();
        this.replyingTo = null;
        this.cdr.markForCheck();
      },
      error: () => { this.isUploading = false; }
    });
    input.value = '';
  }

  // ── Voice recording ───────────────────────────────────────────────────────

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

  // ── Reactions ─────────────────────────────────────────────────────────────

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
  onDocumentClick(): void {
    this.emojiPickerMsgId = null;
    this.showThemePanel   = false;
  }

  // ── Calls ─────────────────────────────────────────────────────────────────

  startVoiceCall(): void {
    if (!this.activeUser || this.callActive) return;
    this.callSvc.startCall(this.activeUser.id, this.activeUser.displayName ?? '', 'audio').catch(console.error);
  }
  startVideoCall(): void {
    if (!this.activeUser || this.callActive) return;
    this.callSvc.startCall(this.activeUser.id, this.activeUser.displayName ?? '', 'video').catch(console.error);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  isMe(msg: ChatMessage): boolean      { return msg.senderId === this.me?.id; }
  isCallMsg(msg: ChatMessage): boolean { return (msg as any).messageType === 'CALL'; }

  reactionGroups(msg: ChatMessage): { emoji: string; count: number; hasMe: boolean }[] {
    const map = new Map<string, { count: number; hasMe: boolean }>();
    (msg.reactions || []).forEach(r => {
      const e = map.get(r.emoji) || { count: 0, hasMe: false };
      e.count++;
      if (r.userId === this.me?.id) e.hasMe = true;
      map.set(r.emoji, e);
    });
    return Array.from(map.entries()).map(([emoji, val]) => ({ emoji, ...val }));
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
    if (bytes < 1024)         return bytes + ' B';
    if (bytes < 1024 * 1024)  return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  isUrl(text: string): boolean {
    try { new URL(text); return true; } catch { return false; }
  }

  callIcon(msg: ChatMessage): string  { return msg.content?.includes('Video') ? '📹' : '📞'; }
  callLabel(msg: ChatMessage): string { return msg.content ?? 'Call'; }

  formatTime(ts?: string): string {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(ts?: string): string {
    if (!ts) return '';
    const d = new Date(ts); const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';
    const y = new Date(now); y.setDate(now.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  get groupedMessages(): { date: string; msgs: ChatMessage[] }[] {
    const g: Record<string, ChatMessage[]> = {};
    for (const m of this.messages) {
      const k = this.formatDate(m.timestamp);
      if (!g[k]) g[k] = [];
      g[k].push(m);
    }
    return Object.entries(g).map(([date, msgs]) => ({ date, msgs }));
  }

  get filteredUsers(): ChatUser[] {
    const q = this.searchQuery.toLowerCase();
    let list = this.showArchive
      ? this.users.filter(u => u.isArchived)
      : this.users.filter(u => !u.isArchived);
    if (q) list = list.filter(u =>
      (u.displayName || '').toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
    return list;
  }

  initial(user: ChatUser | null): string {
    return (user?.displayName || user?.email || '?').charAt(0).toUpperCase();
  }

  private _withDisplay(u: ChatUser): ChatUser {
    return { ...u, displayName: u.email ? u.email.split('@')[0] : 'User ' + u.id };
  }

  private _scrollBottom(): void {
    try { this.msgEnd?.nativeElement.scrollIntoView({ behavior: 'smooth' }); } catch {}
  }

  private _refreshUnread(fromId: number): void {
    this.chatSvc.getUnreadCount(fromId).subscribe({ next: n => { this.unreadMap[fromId] = n; } });
  }

  private _callBubbleText(b: CallBubble): string {
    const type = b.callType === 'VIDEO' ? 'Video call' : 'Voice call';
    switch (b.callStatus) {
      case 'ANSWERED':  return `${type} · ${this.callSvc.formatDuration(b.durationSeconds)}`;
      case 'MISSED':    return `Missed ${type.toLowerCase()}`;
      case 'REJECTED':  return `${type} declined`;
      case 'CANCELLED': return `${type} cancelled`;
      default:          return type;
    }
  }

  goBack(): void { this.router.navigate(['/mother/communaute']); }
  copyLink(id: number): void {
    navigator.clipboard.writeText(`${window.location.origin}/mother/communaute/chat?userId=${id}`);
  }
}