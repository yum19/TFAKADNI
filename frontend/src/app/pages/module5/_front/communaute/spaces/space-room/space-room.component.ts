import {
  Component, Input, Output, EventEmitter, OnInit, OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { SpaceService } from '../../../../../../core/services/space.service';
import {
  Space, SpaceParticipant, CATEGORY_META, SpaceWsMessage
} from '../../../../../../core/models/space.model';
import { environment } from '../../../../../../../environments/environment';
import { ToastService } from '../../../../../../core/services/toast.service';

interface SubtitleEntry { userName: string; text: string; id: number; }

const WS_URL = `${environment.apiUrl.replace('/api', '')}/ws-chat`;
function pad(n: number): string { return n.toString().padStart(2, '0'); }

@Component({
  selector: 'app-space-room',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
<div class="sr-overlay">
  <div class="sr-modal">

    <!-- TOP BAR -->
    <div class="sr-topbar">
      <div class="sr-topbar-left">
        <span class="sr-live-badge" *ngIf="space.status==='LIVE'">
          <span class="sr-live-dot"></span> LIVE
        </span>
        <span class="sr-cat-pill" [style.background]="catMeta[space.category]?.color">
          {{catMeta[space.category]?.emoji}} {{catMeta[space.category]?.label}}
        </span>
      </div>
      <div class="sr-topbar-center">
        <span class="sr-timer" *ngIf="space.status==='LIVE'">
          <mat-icon>timer</mat-icon> {{timerDisplay}}
        </span>
      </div>
      <div class="sr-topbar-right">
        <span class="sr-listener-count">
          <mat-icon>headphones</mat-icon> {{participants.length}}
        </span>
        <button class="sr-leave-btn" (click)="doLeave()" type="button">
          <mat-icon>logout</mat-icon> {{isHost ? 'End' : 'Leave'}}
        </button>
      </div>
    </div>

    <!-- TITLE -->
    <div class="sr-title-area">
      <h2 class="sr-title">{{space.title}}</h2>
      <div class="sr-host-line">Hosted by <strong>{{space.hostName}}</strong></div>
    </div>

    <!-- ANON PROMPT -->
    <div class="sr-anon-banner" *ngIf="showAnonPrompt">
      <p>Join anonymously or as yourself?</p>
      <div class="sr-anon-name-row">
        <input class="sr-anon-input" [(ngModel)]="anonDisplayName"
               placeholder="Anonymous display name (optional)" maxlength="30"/>
      </div>
      <div class="sr-anon-actions">
        <button class="sr-anon-btn" (click)="joinAsAnon()">👤 Join Anonymously</button>
        <button class="sr-anon-btn real" (click)="joinAsReal()">Join as {{myRealName}}</button>
      </div>
    </div>

    <!-- MAIN CONTENT -->
    <div class="sr-body" *ngIf="!showAnonPrompt">

      <!-- SPEAKERS -->
      <div class="sr-section" *ngIf="speakers.length > 0">
        <div class="sr-section-label">
          <mat-icon>record_voice_over</mat-icon>
          Speakers
          <span class="sr-count-badge">{{speakers.length}}</span>
        </div>
        <div class="sr-speakers-grid">
          <div *ngFor="let p of speakers" class="sr-speaker-card">
            <div class="sr-avatar-wrap">
              <div class="sr-avatar"
                   [class.mic-on]="p.micActive"
                   [style.background]="getRoleColor(p.role)">
                <span class="sr-avatar-text">{{p.anonymous ? '👤' : getInitials(p.userName)}}</span>
              </div>
              <!-- Speaking ring -->
              <div class="sr-speak-ring" *ngIf="p.micActive"
                   [style.opacity]="getSpeakingOpacity(p.userId)"
                   [style.transform]="'scale(' + getSpeakingScale(p.userId) + ')'">
              </div>
              <!-- Host crown -->
              <div class="sr-crown" *ngIf="p.role==='HOST'">👑</div>
            </div>

            <!-- Volume bar -->
            <div class="sr-vol-wrap">
              <div class="sr-vol-bar"
                   [style.width.%]="getVolume(p.userId)"
                   [class.vol-low]="getVolume(p.userId) <= 20"
                   [class.vol-mid]="getVolume(p.userId) > 20 && getVolume(p.userId) <= 60"
                   [class.vol-high]="getVolume(p.userId) > 60">
              </div>
            </div>

            <div class="sr-speaker-name">{{p.anonymous ? 'Anonymous' : p.userName}}</div>

            <div class="sr-speaker-status">
              <mat-icon class="sr-mic-icon" [class.mic-active]="p.micActive">
                {{p.micActive ? 'mic' : 'mic_off'}}
              </mat-icon>
              <mat-icon class="sr-hand-icon" *ngIf="p.handRaised">pan_tool</mat-icon>
            </div>

            <!-- Host controls -->
            <div class="sr-host-controls" *ngIf="isHost && p.userId !== myUserId">
              <button class="sr-hc-btn" (click)="hostToggleMic(p)" [title]="p.micActive ? 'Mute' : 'Unmute'">
                <mat-icon>{{p.micActive ? 'mic_off' : 'mic'}}</mat-icon>
              </button>
              <button class="sr-hc-btn promote" *ngIf="p.role==='LISTENER'" (click)="promote(p)" title="Promote">
                <mat-icon>record_voice_over</mat-icon>
              </button>
              <button class="sr-hc-btn kick" (click)="kick(p)" title="Remove">
                <mat-icon>person_remove</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- LISTENERS -->
      <div class="sr-section" *ngIf="listeners.length > 0">
        <div class="sr-section-label">
          <mat-icon>headphones</mat-icon>
          Listeners
          <span class="sr-count-badge">{{listeners.length}}</span>
        </div>
        <div class="sr-listeners-row">
          <div *ngFor="let p of listeners.slice(0,16)" class="sr-listener-chip"
               [title]="p.anonymous ? 'Anonymous' : p.userName">
            <div class="sr-listener-av">
              {{p.anonymous ? '👤' : getInitials(p.userName)}}
            </div>
            <span class="sr-listener-name">{{p.anonymous ? 'Anon' : p.userName.split(' ')[0]}}</span>
            <mat-icon class="sr-listener-hand" *ngIf="p.handRaised">pan_tool</mat-icon>
          </div>
          <div *ngIf="listeners.length > 16" class="sr-listener-more">
            +{{listeners.length - 16}} more
          </div>
        </div>
      </div>

      <!-- SUBTITLES -->
      <div class="sr-subtitles" *ngIf="subtitleList.length > 0">
        <div class="sr-sub-header">
          <mat-icon>closed_caption</mat-icon> Live Subtitles
        </div>
        <div class="sr-sub-lines">
          <div *ngFor="let s of subtitleList" class="sr-sub-line">
            <span class="sr-sub-name">{{s.userName}}:</span>
            <span class="sr-sub-text">{{s.text}}</span>
          </div>
        </div>
      </div>

      <!-- AUDIO UNLOCK -->
      <div class="sr-audio-unlock" *ngIf="audioBlocked">
        <button class="sr-unlock-btn" (click)="unlockAudio()" type="button">
          <mat-icon>volume_up</mat-icon> Tap to enable audio
        </button>
      </div>

    </div>

    <!-- CONTROLS -->
    <div class="sr-controls" *ngIf="!showAnonPrompt">
      <button class="sr-ctrl mic"
              [class.on]="micActive"
              (click)="toggleMic()" type="button">
        <div class="sr-ctrl-icon">
          <mat-icon>{{micActive ? 'mic' : 'mic_off'}}</mat-icon>
        </div>
        <span>{{micActive ? 'Mute' : 'Unmute'}}</span>
      </button>

      <button *ngIf="myRole === 'LISTENER'" class="sr-ctrl hand"
              [class.on]="handRaised"
              (click)="toggleHand()" type="button">
        <div class="sr-ctrl-icon">
          <mat-icon>pan_tool</mat-icon>
        </div>
        <span>{{handRaised ? 'Lower' : 'Raise Hand'}}</span>
      </button>

      <button class="sr-ctrl subtitle"
              [class.on]="subtitleActive"
              (click)="toggleSubtitle()" type="button">
        <div class="sr-ctrl-icon">
          <mat-icon>{{subtitleActive ? 'closed_caption' : 'closed_caption_disabled'}}</mat-icon>
        </div>
        <span>Subtitles</span>
      </button>

      <button *ngIf="isHost" class="sr-ctrl end" (click)="doEnd()" type="button">
        <div class="sr-ctrl-icon">
          <mat-icon>stop_circle</mat-icon>
        </div>
        <span>End</span>
      </button>
    </div>

    <!-- SUBTITLE STATUS -->
    <div class="sr-sub-status" *ngIf="subtitleActive && !showAnonPrompt">
      <span class="sr-sub-dot"></span>
      Subtitles active — speak to share captions
    </div>

  </div>
</div>
<div id="sr-audio-container" style="display:none"></div>
  `,
  styles: [`
    /* ── Overlay ── */
    .sr-overlay {
      position: fixed; inset: 0; z-index: 8000;
      background: rgba(8, 3, 6, 0.92);
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(20px);
      animation: srFadeIn .25s ease;
    }
    @keyframes srFadeIn { from { opacity: 0 } to { opacity: 1 } }

    /* ── Modal ── */
    .sr-modal {
      width: 720px;
      max-width: calc(100vw - 20px);
      max-height: 92vh;
      overflow-y: auto;
      background: linear-gradient(160deg, #1e0b14 0%, #140810 60%, #0f0608 100%);
      border: 1px solid rgba(255, 79, 117, 0.2);
      border-radius: 24px;
      display: flex;
      flex-direction: column;
      box-shadow:
        0 0 0 1px rgba(255,79,117,0.05),
        0 40px 80px rgba(0,0,0,0.7),
        0 0 120px rgba(255,79,117,0.04) inset;
      animation: srSlideUp .35s cubic-bezier(.22,1,.36,1) both;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,79,117,.2) transparent;
    }
    .sr-modal::-webkit-scrollbar { width: 4px; }
    .sr-modal::-webkit-scrollbar-track { background: transparent; }
    .sr-modal::-webkit-scrollbar-thumb { background: rgba(255,79,117,.2); border-radius: 2px; }
    @keyframes srSlideUp {
      from { opacity: 0; transform: translateY(32px) scale(0.98) }
      to   { opacity: 1; transform: translateY(0) scale(1) }
    }

    /* ── Top bar ── */
    .sr-topbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px 14px;
      border-bottom: 1px solid rgba(255,79,117,.1);
      gap: 8px;
    }
    .sr-topbar-left, .sr-topbar-right { display: flex; align-items: center; gap: 8px; }
    .sr-topbar-center { flex: 1; display: flex; justify-content: center; }

    .sr-live-badge {
      display: inline-flex; align-items: center; gap: 5px;
      background: rgba(255,79,117,.15);
      border: 1px solid rgba(255,79,117,.35);
      color: #ff6b8a;
      font-size: .68rem; font-weight: 800;
      padding: 4px 10px; border-radius: 20px;
      text-transform: uppercase; letter-spacing: .8px;
    }
    .sr-live-dot {
      width: 6px; height: 6px; border-radius: 50%; background: #ff4f75;
      animation: livePulse 1.2s ease-in-out infinite;
    }
    @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.6)} }

    .sr-cat-pill {
      font-size: .68rem; font-weight: 800; color: white;
      padding: 4px 12px; border-radius: 20px;
    }

    .sr-timer {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: .78rem; font-weight: 700; color: #ff6b8a;
      background: rgba(255,79,117,.08);
      border: 1px solid rgba(255,79,117,.18);
      padding: 4px 12px; border-radius: 20px;
    }
    .sr-timer mat-icon { font-size: 13px !important; width: 13px !important; height: 13px !important; }

    .sr-listener-count {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: .74rem; font-weight: 600; color: #7a5060;
    }
    .sr-listener-count mat-icon { font-size: 13px !important; width: 13px !important; height: 13px !important; }

    .sr-leave-btn {
      display: inline-flex; align-items: center; gap: 4px;
      background: rgba(255,79,117,.1);
      border: 1px solid rgba(255,79,117,.3);
      color: #ff6b8a; font-size: .74rem; font-weight: 700;
      font-family: inherit; padding: 7px 14px; border-radius: 20px;
      cursor: pointer; transition: all .2s;
    }
    .sr-leave-btn:hover { background: #ff4f75; color: white; border-color: #ff4f75; }
    .sr-leave-btn mat-icon { font-size: 14px !important; width: 14px !important; height: 14px !important; }

    /* ── Title ── */
    .sr-title-area { padding: 18px 20px 10px; }
    .sr-title {
      font-size: 1.25rem; font-weight: 900; color: white;
      margin: 0 0 6px; line-height: 1.3;
      background: linear-gradient(135deg, #fff 60%, #ff8fa8);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .sr-host-line { font-size: .8rem; color: #7a5060; }
    .sr-host-line strong { color: #ff8fa8; }

    /* ── Anon banner ── */
    .sr-anon-banner {
      margin: 16px 20px;
      background: rgba(108,92,231,.1);
      border: 1px solid rgba(108,92,231,.25);
      border-radius: 16px; padding: 22px; text-align: center;
    }
    .sr-anon-banner p { color: #c0a0b0; font-size: .88rem; margin: 0 0 14px; }
    .sr-anon-name-row { margin-bottom: 14px; }
    .sr-anon-input {
      width: 100%; border: 1.5px solid rgba(255,79,117,.25); border-radius: 10px;
      padding: 9px 14px; background: rgba(255,255,255,.04); color: white;
      font-family: inherit; font-size: .86rem; outline: none; box-sizing: border-box;
      transition: border-color .2s;
    }
    .sr-anon-input:focus { border-color: #ff4f75; }
    .sr-anon-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
    .sr-anon-btn {
      padding: 10px 20px; border-radius: 20px;
      border: 1.5px solid rgba(255,255,255,.15);
      background: rgba(255,255,255,.06); color: #c0a0b0;
      font-family: inherit; font-size: .82rem; font-weight: 700; cursor: pointer;
      transition: all .2s;
    }
    .sr-anon-btn.real {
      background: linear-gradient(135deg,#ff4f75,#ff6b8a);
      border-color: transparent; color: white;
    }

    /* ── Body ── */
    .sr-body { padding: 8px 20px 4px; display: flex; flex-direction: column; gap: 20px; }

    /* ── Section ── */
    .sr-section { display: flex; flex-direction: column; gap: 12px; }
    .sr-section-label {
      display: flex; align-items: center; gap: 6px;
      font-size: .68rem; font-weight: 800; color: #5a3545;
      text-transform: uppercase; letter-spacing: .8px;
    }
    .sr-section-label mat-icon { font-size: 13px !important; width: 13px !important; height: 13px !important; color: #7a4560; }
    .sr-count-badge {
      background: rgba(255,79,117,.15); color: #ff8fa8;
      font-size: .62rem; padding: 1px 7px; border-radius: 10px;
    }

    /* ── Speaker cards ── */
    .sr-speakers-grid { display: flex; flex-wrap: wrap; gap: 14px; }

    .sr-speaker-card {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      min-width: 82px; position: relative; padding: 4px;
    }
    .sr-speaker-card:hover .sr-host-controls { opacity: 1; }

    .sr-avatar-wrap {
      position: relative; width: 68px; height: 68px;
    }
    .sr-avatar {
      width: 68px; height: 68px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid rgba(255,255,255,.08);
      position: relative; z-index: 1;
      transition: border-color .3s;
    }
    .sr-avatar.mic-on { border-color: rgba(34,197,94,.5); }
    .sr-avatar-text { font-size: 1.1rem; font-weight: 800; color: white; }

    .sr-speak-ring {
      position: absolute; inset: -5px; border-radius: 50%;
      border: 2px solid #22c55e; z-index: 0;
      transition: opacity 100ms, transform 100ms;
    }

    .sr-crown {
      position: absolute; top: -6px; right: -4px;
      font-size: .8rem; z-index: 2;
    }

    .sr-vol-wrap {
      width: 64px; height: 3px;
      background: rgba(255,255,255,.06); border-radius: 2px; overflow: hidden;
    }
    .sr-vol-bar {
      height: 100%; border-radius: 2px;
      transition: width 80ms linear;
      background: rgba(122,80,96,.6);
    }
    .sr-vol-bar.vol-mid  { background: rgba(245,158,11,.7); }
    .sr-vol-bar.vol-high { background: rgba(34,197,94,.8); }

    .sr-speaker-name {
      font-size: .7rem; font-weight: 700; color: #c0a0b0;
      max-width: 82px; text-align: center;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

    .sr-speaker-status { display: flex; align-items: center; gap: 4px; }
    .sr-mic-icon {
      font-size: 13px !important; width: 13px !important; height: 13px !important;
      color: #5a3545;
    }
    .sr-mic-icon.mic-active { color: #22c55e; }
    .sr-hand-icon {
      font-size: 12px !important; width: 12px !important; height: 12px !important;
      color: #f59e0b;
    }

    /* Host controls */
    .sr-host-controls {
      display: flex; gap: 4px; opacity: 0; transition: opacity .2s;
    }
    .sr-hc-btn {
      width: 22px; height: 22px; border-radius: 50%;
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      background: rgba(245,158,11,.2); color: #f59e0b;
      transition: all .15s;
    }
    .sr-hc-btn mat-icon { font-size: 11px !important; width: 11px !important; height: 11px !important; }
    .sr-hc-btn.promote { background: rgba(34,197,94,.2); color: #22c55e; }
    .sr-hc-btn.kick { background: rgba(239,68,68,.2); color: #ef4444; }
    .sr-hc-btn:hover { filter: brightness(1.3); transform: scale(1.1); }

    /* ── Listeners ── */
    .sr-listeners-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .sr-listener-chip {
      display: flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,.04);
      border: 1px solid rgba(255,79,117,.1);
      border-radius: 20px; padding: 5px 10px 5px 6px;
      transition: border-color .2s;
    }
    .sr-listener-chip:hover { border-color: rgba(255,79,117,.25); }
    .sr-listener-av {
      width: 26px; height: 26px; border-radius: 50%;
      background: linear-gradient(135deg,#3d1a26,#7a3050);
      display: flex; align-items: center; justify-content: center;
      font-size: .6rem; font-weight: 800; color: #c0a0b0;
      flex-shrink: 0;
    }
    .sr-listener-name {
      font-size: .7rem; font-weight: 600; color: #7a5060;
      max-width: 60px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .sr-listener-hand {
      font-size: 11px !important; width: 11px !important; height: 11px !important;
      color: #f59e0b;
    }
    .sr-listener-more {
      display: flex; align-items: center;
      font-size: .7rem; color: #5a3545; padding: 5px 10px;
      background: rgba(255,255,255,.03); border: 1px dashed rgba(255,79,117,.1);
      border-radius: 20px;
    }

    /* ── Subtitles ── */
    .sr-subtitles {
      background: rgba(255,255,255,.03);
      border: 1px solid rgba(255,79,117,.12);
      border-radius: 12px; padding: 12px 14px;
      max-height: 110px; overflow-y: auto;
    }
    .sr-sub-header {
      display: flex; align-items: center; gap: 5px;
      font-size: .65rem; font-weight: 800; color: #5a3545;
      text-transform: uppercase; letter-spacing: .6px; margin-bottom: 8px;
    }
    .sr-sub-header mat-icon { font-size: 12px !important; width: 12px !important; height: 12px !important; }
    .sr-sub-lines { display: flex; flex-direction: column; gap: 4px; }
    .sr-sub-line { display: flex; gap: 6px; align-items: baseline; }
    .sr-sub-name { font-size: .72rem; font-weight: 800; color: #ff8fa8; flex-shrink: 0; }
    .sr-sub-text { font-size: .82rem; color: #c0a0b0; line-height: 1.5; }

    /* ── Audio unlock ── */
    .sr-audio-unlock { display: flex; justify-content: center; padding: 6px 0; }
    .sr-unlock-btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 11px 22px; border-radius: 20px;
      background: linear-gradient(135deg,#6c5ce7,#a29bfe);
      border: none; color: white; font-family: inherit;
      font-size: .84rem; font-weight: 800; cursor: pointer;
      box-shadow: 0 4px 16px rgba(108,92,231,.3);
    }
    .sr-unlock-btn mat-icon { font-size: 16px !important; width: 16px !important; height: 16px !important; }

    /* ── Controls bar ── */
    .sr-controls {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      padding: 16px 20px 14px;
      border-top: 1px solid rgba(255,79,117,.08);
      flex-wrap: wrap; margin-top: 8px;
    }

    .sr-ctrl {
      display: flex; flex-direction: column; align-items: center; gap: 5px;
      padding: 11px 16px; border-radius: 14px;
      border: 1px solid rgba(255,255,255,.1);
      background: rgba(255,255,255,.04);
      cursor: pointer; font-family: inherit;
      font-size: .68rem; font-weight: 700;
      color: #7a5060; text-transform: uppercase; letter-spacing: .4px;
      transition: all .2s; min-width: 68px;
    }
    .sr-ctrl-icon { display: flex; align-items: center; justify-content: center; }
    .sr-ctrl mat-icon { font-size: 20px !important; width: 20px !important; height: 20px !important; }

    /* Mic */
    .sr-ctrl.mic.on {
      background: rgba(34,197,94,.1);
      border-color: rgba(34,197,94,.35); color: #22c55e;
    }
    .sr-ctrl.mic:not(.on) {
      background: rgba(239,68,68,.08);
      border-color: rgba(239,68,68,.25); color: #ef4444;
    }
    /* Hand */
    .sr-ctrl.hand.on {
      background: rgba(245,158,11,.1);
      border-color: rgba(245,158,11,.35); color: #f59e0b;
    }
    /* Subtitle */
    .sr-ctrl.subtitle.on {
      background: rgba(108,92,231,.1);
      border-color: rgba(108,92,231,.35); color: #a29bfe;
    }
    /* End */
    .sr-ctrl.end {
      background: rgba(239,68,68,.08);
      border-color: rgba(239,68,68,.25); color: #ef4444;
    }
    .sr-ctrl.end:hover { background: #ef4444; color: white; border-color: #ef4444; }

    .sr-ctrl:hover:not(.end) { filter: brightness(1.15); transform: translateY(-1px); }

    /* ── Subtitle status ── */
    .sr-sub-status {
      display: flex; align-items: center; gap: 6px; justify-content: center;
      padding: 8px 20px 14px; font-size: .7rem; color: #5a3545; font-weight: 600;
    }
    .sr-sub-dot {
      width: 6px; height: 6px; border-radius: 50%; background: #a29bfe;
      animation: subBlink 1.4s ease-in-out infinite;
    }
    @keyframes subBlink { 0%,100%{opacity:1} 50%{opacity:.2} }

    /* ── Responsive ── */
    @media (max-width: 600px) {
      .sr-modal { border-radius: 18px 18px 0 0; max-height: 96vh; }
      .sr-overlay { align-items: flex-end; }
      .sr-ctrl { min-width: 58px; padding: 10px 12px; }
    }
  `]
})
export class SpaceRoomComponent implements OnInit, OnDestroy {

  @Input() space!: Space;
  @Input() myUserId!: number;
  @Input() myEmail!: string;
  @Input() myRealName = 'You';
  @Input() token!: string;
  @Output() left = new EventEmitter<void>();

  catMeta = CATEGORY_META;
  participants: SpaceParticipant[] = [];
  micActive = false;
  handRaised = false;
  subtitleActive = false;
  subtitleList: SubtitleEntry[] = [];
  private subIdCtr = 0;
  timerDisplay = '00:00';
  private timerInterval: any = null;
  private startedAt: Date | null = null;
  showAnonPrompt = false;
  anonDisplayName = '';
  private hasJoined = false;
  audioBlocked = false;
  stompReady = false;
  trackEnabled = false;

  myRole: 'HOST' | 'SPEAKER' | 'LISTENER' | '' = '';

  localStream: MediaStream | null = null;
  private peers = new Map<number, RTCPeerConnection>();
  private volumeMap = new Map<number, number>();
  private analyserMap = new Map<number, AnalyserNode>();
  private audioCtx: AudioContext | null = null;
  private volRafId: number | null = null;
  private rtcStomp: Client | null = null;
  private shouldStartRtcSession = false;

  private iceServers: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  private wsSub?: Subscription;
  private recognition: any = null;

  get isHost(): boolean { return Number(this.space.hostId) === Number(this.myUserId); }
  get speakers(): SpaceParticipant[] { return this.participants.filter(p => p.role !== 'LISTENER'); }
  get listeners(): SpaceParticipant[] { return this.participants.filter(p => p.role === 'LISTENER'); }
  get peerCount(): number { return this.peers.size; }

  constructor(
    private spaceSvc: SpaceService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.myUserId = Number(this.myUserId);
    this.participants = [...(this.space.participants || [])];
    this.updateMyRole();

    this.spaceSvc.connectToSpace(this.space.id, this.token);
    document.addEventListener('click', () => this.unlockAudio(), { once: true });
    this.wsSub = this.spaceSvc.wsMessages$.subscribe(m => this.handleWsMessage(m));
    this.connectRtcStomp();

    if (this.space.startedAt) {
      this.startedAt = new Date(this.space.startedAt);
      this.startTimer();
    }

    if (this.space.anonymousAllowed && !this.isHost) {
      this.showAnonPrompt = true;
    } else {
      this.proceedJoin(false, '');
    }
  }

  ngOnDestroy(): void {
    this.stopSpeechRecognition();
    this.stopTimer();
    this.closeAllPeers();
    this.rtcStomp?.deactivate();
    this.localStream?.getTracks().forEach(t => t.stop());
    if (this.volRafId) cancelAnimationFrame(this.volRafId);
    this.audioCtx?.close();
    this.wsSub?.unsubscribe();
    this.spaceSvc.disconnectFromSpace();
    document.getElementById('sr-audio-container')?.remove();
  }

  private updateMyRole(): void {
    if (this.isHost) { this.myRole = 'HOST'; return; }
    const me = this.participants.find(p => Number(p.userId) === Number(this.myUserId));
    this.myRole = (me?.role as any) ?? '';
  }

  // ─── RTC STOMP ───────────────────────────────────────────────
  private connectRtcStomp(): void {
    this.rtcStomp = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${this.token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        this.stompReady = true;
        this.cdr.markForCheck();

        this.rtcStomp!.subscribe(
          `/topic/rtc.${this.space.id}.user.${this.myUserId}`,
          (msg: IMessage) => {
            try { this.handleRtcSignal(JSON.parse(msg.body)); } catch {}
          }
        );
        this.rtcStomp!.subscribe(
          `/topic/rtc.${this.space.id}.announce`,
          (msg: IMessage) => {
            try { this.handleRtcSignal(JSON.parse(msg.body)); } catch {}
          }
        );

        if (this.shouldStartRtcSession) {
          this.shouldStartRtcSession = false;
          this.startRtcSession();
        }
      },
      onStompError: () => {},
    });
    this.rtcStomp.activate();
  }

  private publishRtc(payload: object): void {
    if (!this.rtcStomp?.active) return;
    this.rtcStomp.publish({
      destination: `/app/rtc.${this.space.id}`,
      body: JSON.stringify(payload),
    });
  }

  // ─── Anon & Join ─────────────────────────────────────────────
  joinAsAnon(): void { this.showAnonPrompt = false; this.proceedJoin(true, this.anonDisplayName || 'Anonymous'); }
  joinAsReal(): void { this.showAnonPrompt = false; this.proceedJoin(false, ''); }

  private proceedJoin(anonymous: boolean, displayName: string): void {
    if (this.hasJoined) return;
    this.hasJoined = true;

    const afterJoin = (s: Space) => { this.syncFromSpace(s); this.initAudio(); };

    if (anonymous) {
      this.postHttp<Space>(`/api/spaces/${this.space.id}/join-anonymous`, { displayName })
        .subscribe({ next: afterJoin, error: () => this.initAudio() });
    } else {
      this.spaceSvc.joinSpace(this.space.id)
        .subscribe({ next: afterJoin, error: () => this.initAudio() });
    }
  }

  // ─── Audio init ──────────────────────────────────────────────
  private async initAudio(): Promise<void> {
    this.audioCtx = new AudioContext();
    this.startVolumeLoop();

    await new Promise(resolve => setTimeout(resolve, 800));

    if (!this.myRole && !this.isHost) {
      try {
        const fresh = await this.spaceSvc.getSpace(this.space.id).toPromise();
        if (fresh) this.syncFromSpace(fresh);
      } catch {}
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
      const startMuted = !this.isHost;
      this.localStream.getAudioTracks().forEach(t => t.enabled = !startMuted);
      this.micActive = !startMuted;
      this.trackEnabled = !startMuted;
      if (!startMuted) this.spaceSvc.toggleMic(this.space.id, true).subscribe();
      this.attachAnalyser(this.myUserId, this.localStream);
    } catch {}

    if (this.stompReady) {
      this.startRtcSession();
    } else {
      this.shouldStartRtcSession = true;
    }
  }

  // ─── RTC Session ─────────────────────────────────────────────
  private startRtcSession(): void {
    setTimeout(() => {
      this.publishRtc({
        type: 'JOIN_ANNOUNCE',
        targetUserId: 0,
        spaceId: this.space.id,
        fromUserId: this.myUserId,
      });
    }, 500);

    if (this.localStream) {
      const others = this.participants.filter(p => Number(p.userId) !== Number(this.myUserId));
      others.forEach((p, i) => {
        const theirId = Number(p.userId);
        if (Number(this.myUserId) < theirId) {
          setTimeout(() => {
            if (!this.peers.has(theirId)) this.createPeerConnection(theirId, true);
          }, 800 + i * 600);
        }
      });
    }
  }

  // ─── Volume ──────────────────────────────────────────────────
  private attachAnalyser(userId: number, stream: MediaStream): void {
    if (!this.audioCtx) return;
    try {
      const source = this.audioCtx.createMediaStreamSource(stream);
      const analyser = this.audioCtx.createAnalyser();
      analyser.fftSize = 512; analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      this.analyserMap.set(userId, analyser);
      this.volumeMap.set(userId, 0);
    } catch {}
  }

  private startVolumeLoop(): void {
    const buf = new Uint8Array(128);
    const tick = () => {
      this.analyserMap.forEach((analyser, userId) => {
        analyser.getByteFrequencyData(buf);
        const sum = buf.reduce((a, b) => a + b, 0);
        this.volumeMap.set(userId, Math.min(100, Math.round((sum / buf.length) * 100 / 255)));
      });
      if (this.analyserMap.size > 0) this.cdr.markForCheck();
      this.volRafId = requestAnimationFrame(tick);
    };
    this.volRafId = requestAnimationFrame(tick);
  }

  getVolume(userId: number): number { return this.volumeMap.get(userId) ?? 0; }
  getSpeakingOpacity(userId: number): number {
    const v = this.getVolume(userId);
    return v > 10 ? Math.min(1, v / 60) : 0;
  }
  getSpeakingScale(userId: number): number {
    const v = this.getVolume(userId);
    return v > 10 ? 1 + (v / 100) * 0.15 : 1;
  }

  // ─── RTCPeerConnection ───────────────────────────────────────
  private createPeerConnection(remoteUserId: number, initiator: boolean): RTCPeerConnection {
    remoteUserId = Number(remoteUserId);
    const existing = this.peers.get(remoteUserId);
    if (existing && (existing.connectionState === 'connected' || existing.connectionState === 'connecting')) return existing;
    existing?.close();
    this.peers.delete(remoteUserId);

    const pc = new RTCPeerConnection(this.iceServers);
    this.peers.set(remoteUserId, pc);

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.enabled = true;
        pc.addTrack(track, this.localStream!);
      });
    } else {
      pc.addTransceiver('audio', { direction: 'recvonly' });
    }

    pc.ontrack = (event) => {
      const stream = event.streams[0] ?? new MediaStream([event.track]);
      this.playRemoteAudio(remoteUserId, stream);
      this.attachAnalyser(remoteUserId, stream);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.publishRtc({ type: 'ICE', targetUserId: remoteUserId, fromUserId: this.myUserId, candidate: event.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
        this.peers.delete(remoteUserId);
        this.volumeMap.delete(remoteUserId);
        this.analyserMap.delete(remoteUserId);
      }
      this.cdr.markForCheck();
    };

    if (initiator && this.localStream) {
      pc.createOffer({ offerToReceiveAudio: true })
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          this.publishRtc({ type: 'OFFER', targetUserId: remoteUserId, fromUserId: this.myUserId, sdp: pc.localDescription });
        })
        .catch(() => {});
    }

    return pc;
  }

  // ─── RTC Signal Handler ──────────────────────────────────────
  private async handleRtcSignal(data: any): Promise<void> {
    const fromId: number = Number(data.fromUserId);
    if (!fromId || fromId === Number(this.myUserId)) return;

    switch (data.type) {
      case 'JOIN_ANNOUNCE':
        if (this.localStream) {
          const theirId = Number(fromId);
          const shouldOffer = Number(this.myUserId) < theirId;
          setTimeout(() => {
            const existing = this.peers.get(theirId);
            if (!existing || existing.connectionState === 'failed' || existing.connectionState === 'closed') {
              if (shouldOffer) this.createPeerConnection(theirId, true);
            }
          }, 300);
        }
        break;

      case 'OFFER':
        if (Number(data.targetUserId) !== Number(this.myUserId)) return;
        {
          const existing = this.peers.get(fromId);
          if (existing && existing.signalingState !== 'stable') {
            if (Number(this.myUserId) > fromId) return;
            existing.close(); this.peers.delete(fromId);
          }
          const pc = this.createPeerConnection(fromId, false);
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            this.publishRtc({ type: 'ANSWER', targetUserId: fromId, fromUserId: this.myUserId, sdp: pc.localDescription });
          } catch {}
        }
        break;

      case 'ANSWER':
        if (Number(data.targetUserId) !== Number(this.myUserId)) return;
        {
          const pc = this.peers.get(fromId);
          if (pc && pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          }
        }
        break;

      case 'ICE':
        if (Number(data.targetUserId) !== Number(this.myUserId)) return;
        {
          const pc = this.peers.get(fromId);
          if (pc && pc.remoteDescription && data.candidate) {
            try { await pc.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch {}
          }
        }
        break;
    }
    this.cdr.markForCheck();
  }

  // ─── Audio Playback ──────────────────────────────────────────
  private playRemoteAudio(userId: number, stream: MediaStream): void {
    let container = document.getElementById('sr-audio-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'sr-audio-container';
      container.style.display = 'none';
      document.body.appendChild(container);
    }
    document.getElementById(`audio-${userId}`)?.remove();

    const audio = document.createElement('audio') as HTMLAudioElement;
    audio.id = `audio-${userId}`;
    audio.autoplay = true;
    audio.volume = 1.0;
    audio.srcObject = stream;
    container.appendChild(audio);

    this.audioCtx?.resume();
    audio.play().catch(() => { this.audioBlocked = true; this.cdr.markForCheck(); });
  }

  unlockAudio(): void {
    this.audioBlocked = false;
    this.audioCtx?.resume();
    document.querySelectorAll('#sr-audio-container audio').forEach((a: any) => a.play().catch(() => {}));
    this.cdr.markForCheck();
  }

  private closeAllPeers(): void {
    this.peers.forEach((pc, uid) => { pc.close(); document.getElementById(`audio-${uid}`)?.remove(); });
    this.peers.clear(); this.volumeMap.clear(); this.analyserMap.clear();
  }

  // ─── Space WS events ─────────────────────────────────────────
  private handleWsMessage(msg: SpaceWsMessage): void {
    if (msg.spaceId !== this.space.id) return;

    switch (msg.type) {
      case 'JOIN':
        this.spaceSvc.getSpace(this.space.id).subscribe(s => {
          this.syncFromSpace(s);
          if (this.localStream && this.stompReady) {
            const newPeers = (s.participants || []).filter(
              p => Number(p.userId) !== Number(this.myUserId) && !this.peers.has(Number(p.userId))
            );
            newPeers.forEach((p, i) => {
              setTimeout(() => this.createPeerConnection(Number(p.userId), true), 400 + i * 600);
            });
          }
        });
        break;

      case 'LEAVE':
        this.participants = this.participants.filter(p => Number(p.userId) !== Number(msg.userId));
        if (msg.userId) {
          const uid = Number(msg.userId);
          this.peers.get(uid)?.close(); this.peers.delete(uid);
          this.volumeMap.delete(uid); this.analyserMap.delete(uid);
          document.getElementById(`audio-${uid}`)?.remove();
        }
        break;

      case 'MIC_TOGGLE':
        this.participants = this.participants.map(p =>
          Number(p.userId) === Number(msg.userId) ? { ...p, micActive: !!msg.value } : p
        );
        if (Number(msg.userId) === Number(this.myUserId)) {
          this.micActive = !!msg.value;
          this.localStream?.getAudioTracks().forEach(t => t.enabled = !!msg.value);
          this.trackEnabled = !!msg.value;
        }
        break;

      case 'HAND_RAISE':
        this.participants = this.participants.map(p =>
          Number(p.userId) === Number(msg.userId) ? { ...p, handRaised: !!msg.value } : p
        );
        if (Number(msg.userId) === Number(this.myUserId)) this.handRaised = !!msg.value;
        break;

      case 'PROMOTE':
        this.participants = this.participants.map(p =>
          Number(p.userId) === Number(msg.userId) ? { ...p, role: 'SPEAKER', micActive: true } : p
        );
        if (Number(msg.userId) === Number(this.myUserId)) {
          this.myRole = 'SPEAKER'; this.micActive = true; this.trackEnabled = true;
          if (!this.localStream) {
            navigator.mediaDevices.getUserMedia({ audio: true, video: false })
              .then(stream => {
                this.localStream = stream;
                stream.getAudioTracks().forEach(t => t.enabled = true);
                this.attachAnalyser(this.myUserId, stream);
                this.spaceSvc.toggleMic(this.space.id, true).subscribe();
                if (this.stompReady) this.startRtcSession();
                this.cdr.markForCheck();
              }).catch(() => {});
          } else {
            this.localStream.getAudioTracks().forEach(t => t.enabled = true);
            this.spaceSvc.toggleMic(this.space.id, true).subscribe();
            if (this.stompReady) this.startRtcSession();
          }
        }
        break;

      case 'KICK':
        if (Number(msg.userId) === Number(this.myUserId)) {
    this.toast.alert('You have been removed from this space.', () => this.left.emit());
    return; }
        this.participants = this.participants.filter(p => Number(p.userId) !== Number(msg.userId));
        break;

      case 'SUBTITLE':
        if (msg.payload) {
          this.subtitleList = [
            ...this.subtitleList.slice(-4),
            { id: ++this.subIdCtr, userName: msg.userName || 'Speaker', text: msg.payload }
          ];
        }
        break;

      case 'END':
          this.toast.alert('This space has ended.', () => this.left.emit());
        return;
    }
    this.updateMyRole();
    this.cdr.markForCheck();
  }

  private syncFromSpace(s: Space): void {
    this.space = { ...this.space, ...s };
    this.participants = s.participants || [];
    if (s.startedAt && !this.startedAt) { this.startedAt = new Date(s.startedAt); this.startTimer(); }
    this.updateMyRole();
    this.cdr.markForCheck();
  }

  // ─── Controls ────────────────────────────────────────────────
  toggleMic(): void {
    if (!this.localStream) {
      navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(stream => {
          this.localStream = stream;
          this.micActive = true; this.trackEnabled = true;
          stream.getAudioTracks().forEach(t => t.enabled = true);
          this.peers.forEach(pc => stream.getTracks().forEach(t => pc.addTrack(t, stream)));
          this.attachAnalyser(this.myUserId, stream);
          this.spaceSvc.toggleMic(this.space.id, true).subscribe();
          if (this.stompReady) this.startRtcSession();
          this.cdr.markForCheck();
        }).catch(() => this.toast.error('Microphone access denied.'));
      return;
    }
    this.micActive = !this.micActive;
    this.trackEnabled = this.micActive;
    this.localStream.getAudioTracks().forEach(t => t.enabled = this.micActive);
    this.spaceSvc.toggleMic(this.space.id, this.micActive).subscribe();
  }

  hostToggleMic(p: SpaceParticipant): void {
    this.postHttp<void>(`/api/spaces/${this.space.id}/mic/${p.userId}`, { active: !p.micActive }).subscribe();
  }

  toggleHand(): void {
    this.handRaised = !this.handRaised;
    this.spaceSvc.raiseHand(this.space.id, this.handRaised).subscribe();
  }

  toggleSubtitle(): void {
    this.subtitleActive = !this.subtitleActive;
    this.subtitleActive ? this.startSpeechRecognition() : this.stopSpeechRecognition();
  }

  promote(p: SpaceParticipant): void { this.spaceSvc.promote(this.space.id, p.userId).subscribe(); }

  kick(p: SpaceParticipant): void {
    this.toast.confirm(`Remove ${p.userName}?`, () => {
    this.spaceSvc.kick(this.space.id, p.userId).subscribe();
    });
  }

  doLeave(): void {
  if (this.isHost) {
    this.toast.confirm('Ending the space removes everyone. Continue?', () => {
      this.spaceSvc.endSpace(this.space.id).subscribe();
      this.left.emit();
    });
  } else {
    this.spaceSvc.leaveSpace(this.space.id).subscribe();
    this.left.emit();
  }
}

  doEnd(): void {
  this.toast.confirm('End this space for everyone?', () => {
    this.spaceSvc.endSpace(this.space.id).subscribe();
    this.left.emit();
  });
}

  // ─── Timer ───────────────────────────────────────────────────
  private startTimer(): void {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      if (!this.startedAt) return;
      const diff = Math.floor((Date.now() - this.startedAt.getTime()) / 1000);
      const h = Math.floor(diff / 3600), m = Math.floor((diff % 3600) / 60), s = diff % 60;
      this.timerDisplay = h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
      this.cdr.markForCheck();
    }, 1000);
  }
  private stopTimer(): void { if (this.timerInterval) clearInterval(this.timerInterval); }

  // ─── Speech recognition ──────────────────────────────────────
  private startSpeechRecognition(): void {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { this.toast.error('Speech recognition not supported.'); return; }
    this.recognition = new SR();
    this.recognition.continuous = true; this.recognition.interimResults = false;
    this.recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript.trim();
          if (text) this.postHttp<void>(`/api/spaces/${this.space.id}/subtitle`, { text }).subscribe();
        }
      }
    };
    this.recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech') { this.subtitleActive = false; this.cdr.markForCheck(); }
    };
    this.recognition.onend = () => { if (this.subtitleActive) this.recognition?.start(); };
    this.recognition.start();
  }
  private stopSpeechRecognition(): void { this.recognition?.stop(); this.recognition = null; }

  private postHttp<T>(path: string, body: any) {
    return this.http.post<T>(`${environment.apiUrl.replace('/api', '')}${path}`, body, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.token}` })
    });
  }

  getInitials(name: string): string {
    return (name || '?').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getRoleColor(role: string): string {
    if (role === 'HOST')    return 'linear-gradient(135deg,#ff4f75,#ff6b8a)';
    if (role === 'SPEAKER') return 'linear-gradient(135deg,#6c5ce7,#a29bfe)';
    return 'linear-gradient(135deg,#3d1a26,#7a3050)';
  }
}