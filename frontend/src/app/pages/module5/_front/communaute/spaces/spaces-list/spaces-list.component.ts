// src/app/pages/shop/_front/communaute/spaces/spaces-list/spaces-list.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { SpaceService } from '../../../../../../core/services/space.service';
import { Space, CATEGORY_META, SpaceWsMessage } from '../../../../../../core/models/space.model';
import { IndexHeaderComponent } from '../../../../../../components/index-header/index-header.component';
import { IndexFooterComponent } from '../../../../../../components/index-footer/index-footer.component';
import { CreateSpaceModalComponent } from '../create-space-modal/create-space-modal.component';
import { SpaceRoomComponent } from '../space-room/space-room.component';
import { getEmailFromToken, getUserIdFromToken } from '../../../../../../core/services/token.helper';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../../../../environments/environment';
import { storeUserId } from '../../../../../../core/services/token.helper';

@Component({
  selector: 'app-spaces-list',
  standalone: true,
  imports: [
    CommonModule, MatIconModule,
    IndexHeaderComponent, IndexFooterComponent,
    CreateSpaceModalComponent, SpaceRoomComponent
  ],
  template: `
<app-index-header></app-index-header>

<div class="sl-wrap">
  <div class="sl-hero">
    <div class="sl-hero-bg"></div>
    <div class="sl-hero-inner">
      <div class="sl-hero-icon">🎙️</div>
      <h1 class="sl-hero-title">Live Spaces</h1>
      <p class="sl-hero-sub">Join live audio conversations with your community</p>
      <button class="sl-create-btn" (click)="showCreate = true" type="button">
        <mat-icon>add</mat-icon> Create a Space
      </button>
    </div>
  </div>

  <div class="sl-content">

    <!-- Filter tabs -->
    <div class="sl-filter-row">
      <button class="sl-filter-btn" [class.active]="filter === 'all'" (click)="filter='all'" type="button">
        All
      </button>
      <button class="sl-filter-btn" [class.active]="filter === 'LIVE'" (click)="filter='LIVE'" type="button">
        <span class="sl-live-dot"></span> Live Now
      </button>
      <button class="sl-filter-btn" [class.active]="filter === 'SCHEDULED'" (click)="filter='SCHEDULED'" type="button">
        <mat-icon>schedule</mat-icon> Scheduled
      </button>
      <button *ngFor="let cat of categoryKeys" class="sl-filter-btn"
              [class.active]="filter === cat"
              (click)="filter = cat" type="button">
        {{ catMeta[cat].emoji }} {{ catMeta[cat].label }}
      </button>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="sl-loading">
      <div class="sl-spinner"></div>
      <p>Loading spaces…</p>
    </div>

    <!-- Empty -->
    <div *ngIf="!loading && filteredSpaces.length === 0" class="sl-empty">
      <div class="sl-empty-icon">🎧</div>
      <h3>No spaces yet</h3>
      <p>Be the first to start a live conversation!</p>
      <button class="sl-create-btn" (click)="showCreate = true" type="button">
        <mat-icon>add</mat-icon> Create a Space
      </button>
    </div>

    <!-- Spaces grid -->
    <div class="sl-grid" *ngIf="!loading && filteredSpaces.length > 0">
      <div *ngFor="let space of filteredSpaces" class="sl-card"
           [class.sl-card-live]="space.status === 'LIVE'">

        <div class="sl-card-header">
          <span class="sl-status-badge live" *ngIf="space.status === 'LIVE'">
            <span class="sl-live-dot"></span> LIVE
          </span>
          <span class="sl-status-badge sched" *ngIf="space.status === 'SCHEDULED'">
            <mat-icon>schedule</mat-icon>
            {{ space.scheduledAt | date:'MMM d · h:mm a' }}
          </span>
          <span class="sl-cat-badge"
                [style.background]="catMeta[space.category]?.color">
            {{ catMeta[space.category]?.emoji }} {{ catMeta[space.category]?.label }}
          </span>
        </div>

        <h3 class="sl-card-title">{{ space.title }}</h3>

        <div class="sl-card-host">
          <div class="sl-host-av"
               [style.background]="catMeta[space.category]?.color">
            {{ getInitials(space.hostName) }}
          </div>
          <div>
            <div class="sl-host-name">{{ space.hostName }}</div>
            <div class="sl-host-role">Host</div>
          </div>
        </div>

        <div class="sl-card-stats">
          <span class="sl-stat">
            <mat-icon>record_voice_over</mat-icon> {{ space.speakerCount }}
          </span>
          <span class="sl-stat">
            <mat-icon>headphones</mat-icon> {{ space.listenerCount }}
          </span>
          <span class="sl-stat" *ngIf="space.anonymousAllowed">
            <mat-icon>visibility</mat-icon> Open
          </span>
          <span class="sl-stat aud" *ngIf="space.audience === 'FOLLOWERS'">
            <mat-icon>people</mat-icon> Followers only
          </span>
        </div>

        <div class="sl-card-footer">
          <button
            class="sl-join-btn"
            [class.sl-join-live]="space.status === 'LIVE'"
            (click)="joinRoom(space)"
            type="button">
            <mat-icon>{{ space.status === 'LIVE' ? 'headphones' : 'notifications' }}</mat-icon>
            {{ space.status === 'LIVE' ? 'Join Space' : 'Remind Me' }}
          </button>

          <!-- Host: start button if scheduled -->
          <button
            *ngIf="space.status === 'SCHEDULED' && space.hostId === myUserId"
            class="sl-start-btn"
            (click)="startSpace(space)"
            type="button">
            <mat-icon>play_arrow</mat-icon> Start Now
          </button>
        </div>

      </div>
    </div>

  </div>
</div>

<!-- Create space modal -->
<app-create-space-modal
  *ngIf="showCreate"
  (close)="showCreate = false"
  (created)="loadSpaces()">
</app-create-space-modal>

<!-- Space room -->
<app-space-room
  *ngIf="activeRoom"
  [space]="activeRoom"
  [myUserId]="myUserId"
  [myEmail]="myEmail"
  [token]="token"
  (left)="closeRoom()">
</app-space-room>

<app-index-footer></app-index-footer>
  `,
  styles: [`
    .sl-wrap { min-height: 100vh; background: #fdf0f4; }

    /* Hero */
    .sl-hero {
      position: relative; overflow: hidden;
      background: linear-gradient(135deg, #1a0a10 0%, #3d1a26 50%, #1a0a10 100%);
      padding: 70px 24px 60px; text-align: center;
    }
    .sl-hero-bg {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse at 50% 0%, rgba(255,79,117,.25) 0%, transparent 70%);
    }
    .sl-hero-inner { position: relative; z-index: 1; max-width: 600px; margin: 0 auto; }
    .sl-hero-icon  { font-size: 3.5rem; margin-bottom: 16px; }
    .sl-hero-title { font-size: 2.4rem; font-weight: 900; color: white; margin: 0 0 10px; }
    .sl-hero-sub   { font-size: 1rem; color: #b08a9a; margin: 0 0 28px; }

    .sl-create-btn {
      display: inline-flex; align-items: center; gap: 6px;
      background: linear-gradient(135deg,#ff4f75,#ff6b8a);
      color: white; border: none; border-radius: 30px;
      padding: 13px 28px; font-size: .96rem; font-weight: 800;
      font-family: inherit; cursor: pointer;
      box-shadow: 0 8px 24px rgba(255,79,117,.4);
      transition: all .25s;
    }
    .sl-create-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(255,79,117,.5); }
    .sl-create-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* Content */
    .sl-content { max-width: 1200px; margin: 0 auto; padding: 32px 24px 60px; }

    /* Filters */
    .sl-filter-row {
      display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 28px; align-items: center;
    }
    .sl-filter-btn {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 8px 18px; border-radius: 30px;
      border: 1.5px solid #f0d0d9; background: white;
      font-family: inherit; font-size: .82rem; font-weight: 700;
      color: #7a5060; cursor: pointer; transition: all .2s;
    }
    .sl-filter-btn mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .sl-filter-btn:hover { border-color: #ff4f75; color: #ff4f75; }
    .sl-filter-btn.active { background: linear-gradient(135deg,#ff4f75,#ff6b8a); color: white; border-color: transparent; }

    .sl-live-dot {
      width: 6px; height: 6px; border-radius: 50%; background: currentColor;
      animation: ldp 1.2s ease-in-out infinite;
    }
    @keyframes ldp { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.4)} }

    /* Loading/Empty */
    .sl-loading, .sl-empty {
      display: flex; flex-direction: column; align-items: center;
      gap: 14px; padding: 80px 20px; text-align: center; color: #b08a9a;
    }
    .sl-spinner {
      width: 44px; height: 44px; border: 4px solid #f0d0d9;
      border-top-color: #ff4f75; border-radius: 50%;
      animation: spin .9s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg) } }
    .sl-empty-icon { font-size: 4rem; }
    .sl-empty h3 { font-size: 1.2rem; font-weight: 800; color: #1a0a10; margin: 0; }
    .sl-empty p  { font-size: .9rem; margin: 0; }

    /* Grid */
    .sl-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }

    /* Card */
    .sl-card {
      background: white; border-radius: 20px;
      border: 1.5px solid #f0d0d9;
      padding: 20px; display: flex; flex-direction: column; gap: 14px;
      box-shadow: 0 4px 16px rgba(255,79,117,.06);
      transition: all .25s;
    }
    .sl-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(255,79,117,.14); }
    .sl-card-live { border-color: rgba(255,79,117,.5); }

    .sl-card-header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

    .sl-status-badge {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: .68rem; font-weight: 800; padding: 3px 10px; border-radius: 20px;
      text-transform: uppercase; letter-spacing: .5px;
    }
    .sl-status-badge.live { background: rgba(255,79,117,.12); color: #ff4f75; }
    .sl-status-badge.sched { background: rgba(245,158,11,.1); color: #d97706; }
    .sl-status-badge mat-icon { font-size: 12px; width: 12px; height: 12px; }

    .sl-cat-badge {
      font-size: .68rem; font-weight: 800; color: white;
      padding: 3px 10px; border-radius: 20px;
    }

    .sl-card-title {
      font-size: 1.05rem; font-weight: 800; color: #1a0a10;
      margin: 0; line-height: 1.4;
    }

    .sl-card-host { display: flex; align-items: center; gap: 10px; }
    .sl-host-av {
      width: 38px; height: 38px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: .72rem; font-weight: 800; flex-shrink: 0;
      border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,.12);
    }
    .sl-host-name { font-size: .86rem; font-weight: 700; color: #1a0a10; }
    .sl-host-role { font-size: .7rem; color: #b08a9a; }

    .sl-card-stats { display: flex; gap: 14px; }
    .sl-stat {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: .78rem; font-weight: 600; color: #7a5060;
    }
    .sl-stat mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .sl-card-footer { display: flex; gap: 8px; margin-top: 4px; }

    .sl-join-btn {
      flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      padding: 10px 18px; border-radius: 20px; border: none;
      font-family: inherit; font-size: .84rem; font-weight: 800;
      background: #fff0f5; color: #ff4f75; cursor: pointer;
      border: 1.5px solid #ffd6e0; transition: all .2s;
    }
    .sl-join-btn:hover { background: #ff4f75; color: white; border-color: #ff4f75; }
    .sl-join-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .sl-join-btn.sl-join-live {
      background: linear-gradient(135deg,#ff4f75,#ff6b8a);
      color: white; border-color: transparent;
      box-shadow: 0 4px 14px rgba(255,79,117,.3);
    }

    .sl-start-btn {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 10px 16px; border-radius: 20px; border: none;
      font-family: inherit; font-size: .82rem; font-weight: 800;
      background: rgba(34,197,94,.1); color: #16a34a;
      border: 1.5px solid rgba(34,197,94,.3); cursor: pointer;
      transition: all .2s;
    }
    .sl-start-btn:hover { background: #22c55e; color: white; border-color: #22c55e; }
    .sl-start-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }

    @media (max-width: 768px) {
      .sl-hero-title { font-size: 1.8rem; }
      .sl-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class SpacesListComponent implements OnInit, OnDestroy {

  catMeta      = CATEGORY_META;
  categoryKeys = Object.keys(CATEGORY_META) as (keyof typeof CATEGORY_META)[];
  spaces:    Space[] = [];
  loading  = true;
  filter   = 'all';
  showCreate = false;
  activeRoom: Space | null = null;

  myUserId = 0;
  myEmail  = '';
  token    = '';

  private wsSub?: Subscription;

  get filteredSpaces(): Space[] {
    return this.spaces.filter(s => {
      if (this.filter === 'all') return true;
      if (this.filter === 'LIVE' || this.filter === 'SCHEDULED') return s.status === this.filter;
      return s.category === this.filter;
    });
  }

  constructor(
    private spaceSvc: SpaceService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private http: HttpClient 
  ) {}

  ngOnInit(): void {
    this.myEmail  = getEmailFromToken() || '';
    this.myUserId = getUserIdFromToken() || 0;
    this.token    = localStorage.getItem('auth_token') || '';
    

    this.loadSpaces();
    

    // Subscribe to real-time notifications
    this.spaceSvc.connectForNotifications(this.token);
    this.wsSub = this.spaceSvc.wsMessages$.subscribe(msg => {
      this.handleGlobalWs(msg);
    });

    // Listen for open-space-room event from create modal
    window.addEventListener('open-space-room', this.onOpenRoom);
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    window.removeEventListener('open-space-room', this.onOpenRoom);
  }

  private onOpenRoom = (e: Event): void => {
    const space = (e as CustomEvent).detail as Space;
    this.activeRoom = space;
    this.cdr.markForCheck();
  };

  loadSpaces(): void {
    this.loading = true;
    this.spaceSvc.getSpaces().subscribe({
      next: (list) => {
        this.spaces  = list;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; }
    });
  }

  private handleGlobalWs(msg: SpaceWsMessage): void {
    if (msg.type === 'CREATED') {
      this.loadSpaces();
    } else if (msg.type === 'STARTED') {
      this.spaces = this.spaces.map(s =>
        s.id === msg.spaceId ? { ...s, status: 'LIVE' } : s
      );
      // Show notification
      this.showStartNotification(msg.payload || 'A space just started!');
    }
    this.cdr.markForCheck();
  }

  private showStartNotification(title: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🎙️ Space Starting!', {
        body: title,
        icon: '/assets/img/logo.png'
      });
    }
  }

 joinRoom(space: Space): void {
  if (space.status === 'LIVE') {
    this.token = localStorage.getItem('auth_token') || '';
    this.myEmail = getEmailFromToken() || '';

    const openRoom = () => {
      this.myUserId = getUserIdFromToken();
      console.log('Opening room as userId:', this.myUserId, 'email:', this.myEmail);
      this.activeRoom = space;
      this.cdr.markForCheck();
    };

    // If userId already resolved, open immediately
    if (getUserIdFromToken() > 0) {
      openRoom();
      return;
    }

    // Not resolved yet — fetch now and wait
    const headers = new HttpHeaders({ Authorization: `Bearer ${this.token}` });
    this.http.get<any[]>(`${environment.apiUrl}/users/all`, { headers }).subscribe({
      next: (users: any[]) => {
        const me = users.find((u: any) =>
          u.email?.toLowerCase() === this.myEmail.toLowerCase()
        );
        if (me?.id) {
          storeUserId(Number(me.id));
          console.log('✅ userId resolved on join:', me.id);
        } else {
          console.error('❌ User not found in /api/users/all for email:', this.myEmail);
        }
        openRoom();
      },
      error: () => {
        console.error('❌ /api/users/all failed');
        openRoom(); // still open, SpaceRoom will show userId:0
      }
    });
  } else {
    if ('Notification' in window) {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') alert('You\'ll be notified when this space starts!');
      });
    }
  }
}

  startSpace(space: Space): void {
    this.spaceSvc.startSpace(space.id).subscribe(updated => {
      this.spaces = this.spaces.map(s => s.id === updated.id ? updated : s);
      this.activeRoom = updated;
      this.cdr.markForCheck();
    });
  }

  closeRoom(): void {
    this.activeRoom = null;
    this.loadSpaces();
  }

  getInitials(name: string): string {
    return (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}