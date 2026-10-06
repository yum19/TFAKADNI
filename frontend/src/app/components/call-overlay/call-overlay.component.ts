// src/app/components/call-overlay/call-overlay.component.ts
import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { CallService, CallSession } from '../../core/services/call.service';

@Component({
  selector: 'app-call-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './call-overlay.component.html',
  styleUrls: ['./call-overlay.component.css'],
})
export class CallOverlayComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  session: CallSession | null = null;
  incoming: CallSession | null = null;
  duration = 0;
  micOn = true;
  camOn = true;
  speakerOn = true;
  localMinimised = false;

  private subs: Subscription[] = [];

  constructor(
    public callSvc: CallService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.callSvc.session$.subscribe(s => {
        this.session = s;
        // Reset controls on new call
        if (s?.state === 'calling') {
          this.micOn = true;
          this.camOn = true;
        }
        this.cdr.detectChanges();
      }),
      this.callSvc.incomingCall$.subscribe(i => {
        this.incoming = i;
        this.cdr.detectChanges();
      }),
      this.callSvc.callDuration$.subscribe(d => {
        this.duration = d;
        this.cdr.detectChanges();
      }),
    );
  }

  ngAfterViewInit(): void {
    this.subs.push(
      this.callSvc.localStream$.subscribe(s => {
        if (this.localVideo?.nativeElement) {
          this.localVideo.nativeElement.srcObject = s;
        }
      }),
      this.callSvc.remoteStream$.subscribe(s => {
        if (this.remoteVideo?.nativeElement) {
          this.remoteVideo.nativeElement.srcObject = s;
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  // ── Actions ───────────────────────────────────────────────────

  accept(): void {
    this.micOn = true;
    this.camOn = true;
    this.callSvc.acceptCall();
  }

  reject(): void {
    this.callSvc.rejectCall();
  }

  endCall(): void {
    this.callSvc.endCall();
  }

  toggleMic(): void {
    this.micOn = this.callSvc.toggleMic();
  }

  toggleCamera(): void {
    this.camOn = this.callSvc.toggleCamera();
  }

  switchCam(): void {
    this.callSvc.flipCamera();
  }

  toggleSpeaker(): void {
    this.speakerOn = !this.speakerOn;
    const el = this.remoteVideo?.nativeElement;
    if (el) {
      (el as HTMLMediaElement).muted = !this.speakerOn;
    }
  }

  toggleLocalMinimised(): void {
    this.localMinimised = !this.localMinimised;
  }

  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  // ── Computed Properties ───────────────────────────────────────

  get showOverlay(): boolean {
    return !!(this.session || this.incoming);
  }

  get isVideo(): boolean {
    return this.session?.type === 'video' || this.incoming?.type === 'video';
  }

  get isConnected(): boolean {
    return this.session?.state === 'connected';
  }

  get isCalling(): boolean {
    return this.session?.state === 'calling' || this.session?.state === 'ringing';
  }

  get isEnded(): boolean {
    return this.session?.state === 'ended';
  }

  get callerName(): string {
    if (this.incoming) return this.incoming.callerName;
    if (!this.session) return '';
    return (this.callSvc as any).meId_ === this.session.callerId
      ? this.session.calleeName
      : this.session.callerName;
  }

  get callerInitial(): string {
    return (this.callerName || '?').charAt(0).toUpperCase();
  }

  get statusLabel(): string {
    if (!this.session) return '';
    switch (this.session.state) {
      case 'calling':
        return 'Calling…';
      case 'ringing':
        return 'Ringing…';
      case 'connected':
        return this.callSvc.formatDuration(this.duration);
      case 'ended':
        return 'Call ended';
      default:
        return '';
    }
  }
}