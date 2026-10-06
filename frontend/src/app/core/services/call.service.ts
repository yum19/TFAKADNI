// src/app/core/services/call.service.ts
import { Injectable, NgZone } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { BehaviorSubject }    from 'rxjs';

export type CallType  = 'audio' | 'video';
export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

export interface CallSession {
  callId:     string;
  callerId:   number;
  callerName: string;
  calleeId:   number;
  calleeName: string;
  type:       CallType;
  state:      CallState;
  startedAt?: Date;
}

export interface SignalPayload {
  type:             string;
  callId:           string;
  fromId:           number;
  toId:             number;
  fromName:         string;
  callType?:        string;
  sdp?:             RTCSessionDescriptionInit;
  candidate?:       RTCIceCandidateInit;
}

/** Emitted when a call ends, so the chat can show a call bubble */
export interface CallBubble {
  callId:          string;
  callerId:        number;
  calleeId:        number;
  callType:        string;
  callStatus:      string;   // ANSWERED | MISSED | REJECTED | CANCELLED
  durationSeconds: number;
  timestamp:       string;
}

const ICE: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302'  },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

@Injectable({ providedIn: 'root' })
export class CallService {

  private readonly API = 'http://localhost:8081/api';

  // ── Public streams ─────────────────────────────────────────────
  session$      = new BehaviorSubject<CallSession | null>(null);
  localStream$  = new BehaviorSubject<MediaStream | null>(null);
  remoteStream$ = new BehaviorSubject<MediaStream | null>(null);
  incomingCall$ = new BehaviorSubject<CallSession | null>(null);
  callDuration$ = new BehaviorSubject<number>(0);
  /** Fires when a call ends so the chat can add a call bubble */
  callBubble$   = new BehaviorSubject<CallBubble | null>(null);

  // ── Internal ───────────────────────────────────────────────────
  private pc:                RTCPeerConnection | null = null;
  private stomp:             any    = null;
  private meId:              number = 0;
  private meName:            string = '';
  private durationTimer:     any    = null;
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private ringInterval:      any    = null;
  private callStartedAt:     Date | null = null;

  constructor(private zone: NgZone, private http: HttpClient) {}

  // ── Init ───────────────────────────────────────────────────────

  init(stompClient: any, meId: number, meName: string): void {
    this.stomp  = stompClient;
    this.meId   = meId;
    this.meName = meName;

    // Subscribe to this user's signal queue
    stompClient.subscribe(`/queue/signal.${meId}`, (frame: any) => {
      try {
        const sig: SignalPayload = JSON.parse(frame.body);
        this.zone.run(() => this._handleSignal(sig));
      } catch (e) { console.error('Signal parse error', e); }
    });
  }

  // ── Outgoing call ──────────────────────────────────────────────

  async startCall(calleeId: number, calleeName: string, type: CallType): Promise<void> {
    if (this.session$.value) return; // already in a call

    const callId = `call-${this.meId}-${calleeId}-${Date.now()}`;
    this.session$.next({
      callId, callerId: this.meId, callerName: this.meName,
      calleeId, calleeName, type, state: 'calling',
    });

    // Get local media now so we're ready when accepted
    try {
      const stream = await this._getMedia(type);
      this.localStream$.next(stream);
    } catch {
      this._endLocally('CANCELLED'); throw new Error('Microphone/camera access denied');
    }

    this._send({ type: 'call-request', callId, fromId: this.meId, toId: calleeId, fromName: this.meName, callType: type });
    this._playTone('outgoing');
  }

  // ── Cancel (caller hangs up before answer) ─────────────────────

  cancelCall(): void {
    const s = this.session$.value;
    if (!s || s.state !== 'calling') return;
    this._send({ type: 'call-cancel', callId: s.callId, fromId: this.meId, toId: s.calleeId, fromName: this.meName });
    this._stopTone();
    this._saveToDb(s.callId, s.callerId, s.calleeId, s.type, 'CANCELLED', 0);
    this._endLocally('CANCELLED');
  }

  // ── Accept ─────────────────────────────────────────────────────

  async acceptCall(): Promise<void> {
    const inc = this.incomingCall$.value;
    if (!inc) return;

    this._stopTone();
    this.incomingCall$.next(null);
    this.callStartedAt = new Date();
    this.session$.next({ ...inc, state: 'connected', startedAt: this.callStartedAt });

    const stream = await this._getMedia(inc.type).catch(() => null);
    if (!stream) { this.endCall(); return; }
    this.localStream$.next(stream);

    this._createPC(inc.type);
    stream.getTracks().forEach(t => this.pc!.addTrack(t, stream));

    this._send({ type: 'call-accept', callId: inc.callId, fromId: this.meId, toId: inc.callerId, fromName: this.meName });
    this._startTimer();
  }

  // ── Reject ─────────────────────────────────────────────────────

  rejectCall(): void {
    const inc = this.incomingCall$.value;
    if (!inc) return;
    this._stopTone();
    this._send({ type: 'call-reject', callId: inc.callId, fromId: this.meId, toId: inc.callerId, fromName: this.meName });
    // Callee saves as REJECTED; caller saves as MISSED (handled in _handleSignal)
    this.incomingCall$.next(null);
  }

  // ── End active call ────────────────────────────────────────────

  endCall(): void {
    const s = this.session$.value;
    if (!s) { this.incomingCall$.next(null); return; }
    if (s.state === 'calling') { this.cancelCall(); return; }

    const duration = this.callDuration$.value;
    const otherId  = s.callerId === this.meId ? s.calleeId : s.callerId;
    this._send({ type: 'call-end', callId: s.callId, fromId: this.meId, toId: otherId, fromName: this.meName });
    this._stopTone();

    // Save the call record — only the person who initiated end does the save (avoids race condition: just save from both, server deduplicates by callId)
    this._saveToDb(s.callId, s.callerId, s.calleeId, s.type, 'ANSWERED', duration);
    this._endLocally('ANSWERED');
  }

  // ── Media controls ─────────────────────────────────────────────

  toggleMic(): boolean {
    const t = this.localStream$.value?.getAudioTracks()[0];
    if (!t) return false;
    t.enabled = !t.enabled; return t.enabled;
  }

  toggleCamera(): boolean {
    const t = this.localStream$.value?.getVideoTracks()[0];
    if (!t) return false;
    t.enabled = !t.enabled; return t.enabled;
  }

  async flipCamera(): Promise<void> {
    const stream = this.localStream$.value; if (!stream) return;
    const old  = stream.getVideoTracks()[0];
    const mode = old?.getSettings().facingMode === 'user' ? 'environment' : 'user';
    const ns   = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode }, audio: false }).catch(() => null);
    if (!ns) return;
    const nv = ns.getVideoTracks()[0];
    const sender = this.pc?.getSenders().find(s => s.track?.kind === 'video');
    if (sender) await sender.replaceTrack(nv);
    old?.stop(); stream.removeTrack(old); stream.addTrack(nv);
    this.localStream$.next(stream);
  }

  // ── Signal handler ─────────────────────────────────────────────

  private async _handleSignal(sig: SignalPayload): Promise<void> {

    switch (sig.type) {

      case 'call-request': {
        // If already in a call, send busy
        if (this.session$.value) {
          this._send({ type: 'call-busy', callId: sig.callId, fromId: this.meId, toId: sig.fromId, fromName: this.meName });
          return;
        }
        this.incomingCall$.next({
          callId: sig.callId, callerId: sig.fromId, callerName: sig.fromName,
          calleeId: this.meId, calleeName: this.meName,
          type: (sig.callType as CallType) || 'audio', state: 'ringing',
        });
        this._playTone('incoming');
        break;
      }

      case 'call-accept': {
        const s = this.session$.value; if (!s) return;
        this._stopTone();
        this.callStartedAt = new Date();
        this.session$.next({ ...s, state: 'connected', startedAt: this.callStartedAt });
        // Caller creates PC and sends offer
        this._createPC(s.type);
        const stream = this.localStream$.value!;
        stream.getTracks().forEach(t => this.pc!.addTrack(t, stream));
        const offer = await this.pc!.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: s.type === 'video' });
        await this.pc!.setLocalDescription(offer);
        this._send({ type: 'offer', callId: s.callId, fromId: this.meId, toId: s.calleeId, fromName: this.meName, sdp: offer });
        this._startTimer();
        break;
      }

      case 'offer': {
        if (!this.pc) return;
        await this.pc.setRemoteDescription(new RTCSessionDescription(sig.sdp!));
        for (const c of this.pendingCandidates) await this.pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
        this.pendingCandidates = [];
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        const s = this.session$.value!;
        this._send({ type: 'answer', callId: s.callId, fromId: this.meId, toId: sig.fromId, fromName: this.meName, sdp: answer });
        break;
      }

      case 'answer': {
        if (!this.pc) return;
        await this.pc.setRemoteDescription(new RTCSessionDescription(sig.sdp!));
        break;
      }

      case 'candidate': {
        if (this.pc?.remoteDescription) {
          await this.pc.addIceCandidate(new RTCIceCandidate(sig.candidate!)).catch(() => {});
        } else {
          this.pendingCandidates.push(sig.candidate!);
        }
        break;
      }

      case 'call-reject': {
        // The callee rejected — save as MISSED for caller
        const s = this.session$.value;
        if (s) this._saveToDb(s.callId, s.callerId, s.calleeId, s.type, 'MISSED', 0);
        this._stopTone();
        this._endLocally('MISSED');
        break;
      }

      case 'call-cancel': {
        // Caller cancelled before we answered
        const inc = this.incomingCall$.value;
        if (inc) this._saveToDb(inc.callId, inc.callerId, inc.calleeId, inc.type, 'MISSED', 0);
        this._stopTone();
        this._endLocally('MISSED');
        break;
      }

      case 'call-busy':
      case 'call-end': {
        const s = this.session$.value;
        if (s && s.state === 'connected') {
          const duration = this.callDuration$.value;
          this._saveToDb(s.callId, s.callerId, s.calleeId, s.type, 'ANSWERED', duration);
        }
        this._stopTone();
        this._endLocally('ANSWERED');
        break;
      }
    }
  }

  // ── RTCPeerConnection ──────────────────────────────────────────

  private _createPC(type: CallType): void {
    this.pc = new RTCPeerConnection(ICE);

    this.pc.onicecandidate = (ev) => {
      if (!ev.candidate) return;
      const s = this.session$.value; if (!s) return;
      const toId = s.callerId === this.meId ? s.calleeId : s.callerId;
      this._send({ type: 'candidate', callId: s.callId, fromId: this.meId, toId, fromName: this.meName, candidate: ev.candidate.toJSON() });
    };

    this.pc.ontrack = (ev) => {
      this.zone.run(() => { if (ev.streams?.[0]) this.remoteStream$.next(ev.streams[0]); });
    };

    this.pc.onconnectionstatechange = () => {
      const st = this.pc?.connectionState;
      if (st === 'disconnected' || st === 'failed' || st === 'closed') {
        this.zone.run(() => {
          const s = this.session$.value;
          if (s && s.state === 'connected') {
            const duration = this.callDuration$.value;
            this._saveToDb(s.callId, s.callerId, s.calleeId, s.type, 'ANSWERED', duration);
          }
          this._endLocally('ANSWERED');
        });
      }
    };
  }

  // ── DB persistence ─────────────────────────────────────────────

  private _saveToDb(callId: string, callerId: number, calleeId: number, type: CallType | string, status: string, duration: number): void {
    const body = {
      callId,
      callerId,
      calleeId,
      callType:        type.toString().toUpperCase(),
      callStatus:      status.toUpperCase(),
      durationSeconds: Math.round(duration),
    };
    this.http.post(`${this.API}/calls/save`, body).subscribe({
      next: () => {
        // Emit bubble so chat shows the call record
        this.callBubble$.next({
          callId, callerId, calleeId,
          callType:        body.callType,
          callStatus:      body.callStatus,
          durationSeconds: body.durationSeconds,
          timestamp:       new Date().toISOString(),
        });
      },
      error: (e) => console.error('Could not save call record', e),
    });
  }

  // ── Helpers ────────────────────────────────────────────────────

  private async _getMedia(type: CallType): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 48000 },
      video: type === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
    });
  }

  private _send(sig: Partial<SignalPayload>): void {
    if (!this.stomp?.connected) return;
    this.stomp.send('/app/call.signal', {}, JSON.stringify(sig));
  }

  private _endLocally(status: string): void {
    this._stopTimer();
    this.localStream$.value?.getTracks().forEach(t => t.stop());
    this.localStream$.next(null);
    this.remoteStream$.next(null);
    this.pc?.close(); this.pc = null;
    this.pendingCandidates = [];
    const s = this.session$.value;
    if (s) this.session$.next({ ...s, state: 'ended' });
    setTimeout(() => this.session$.next(null), 2500);
    this.incomingCall$.next(null);
    this.callStartedAt = null;
  }

  private _startTimer(): void {
    this.callDuration$.next(0);
    this.durationTimer = setInterval(() => this.callDuration$.next(this.callDuration$.value + 1), 1000);
  }

  private _stopTimer(): void {
    if (this.durationTimer) { clearInterval(this.durationTimer); this.durationTimer = null; }
  }

  private _playTone(mode: 'incoming' | 'outgoing'): void {
    this._stopTone();
    try {
      const ctx = new AudioContext();
      const beep = (freq: number, when: number, dur: number) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = freq; o.type = 'sine';
        g.gain.setValueAtTime(0, ctx.currentTime + when);
        g.gain.linearRampToValueAtTime(0.22, ctx.currentTime + when + 0.04);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + when + dur - 0.04);
        o.start(ctx.currentTime + when); o.stop(ctx.currentTime + when + dur);
      };
      if (mode === 'incoming') {
        const ring = () => { beep(880, 0, 0.35); beep(660, 0.4, 0.35); };
        ring(); this.ringInterval = setInterval(ring, 1800);
      } else {
        const ring = () => { beep(440, 0, 0.25); beep(480, 0.3, 0.25); };
        ring(); this.ringInterval = setInterval(ring, 2000);
      }
    } catch {}
  }

  private _stopTone(): void {
    if (this.ringInterval) { clearInterval(this.ringInterval); this.ringInterval = null; }
  }

  formatDuration(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
    return `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  }

  get meId_() { return this.meId; }
}