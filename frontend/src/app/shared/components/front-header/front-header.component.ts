import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenav } from '@angular/material/sidenav';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SessionService } from '../../../core/services/session.service';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeRoleService } from '../../../core/services/theme-role.service';
import { MatDividerModule } from '@angular/material/divider';
import { AlertBadgeService } from '../../../core/services/alert-badge.service';
import { ExamBadgeService } from '../../../core/services/exam-badge.service';
import { CartService } from '../../../core/services/cart.service';
import { CartSidebarComponent } from '../../../components/cart-sidebar/cart-sidebar.component';
import { FollowNotificationService } from '../../../core/services/follow-notification.service';

interface NavLink {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-front-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatMenuModule, MatDividerModule, CartSidebarComponent],
  templateUrl: './front-header.component.html',
  styleUrls: ['./front-header.component.scss']
})
export class FrontHeaderComponent {
  @Input() drawer?: MatSidenav;
  @Output() openTheme = new EventEmitter<void>();

  session = inject(SessionService);
  private auth = inject(AuthService);
  private router = inject<Router>(Router);
  private themeRole = inject(ThemeRoleService);
  private alertBadge = inject(AlertBadgeService);
  private examBadge = inject(ExamBadgeService);

  openGroupKey: string | null = null;
  private closeTimer: any;

  alertCount$ = this.alertBadge.unread$;
  examCount$ = this.examBadge.due$;

  cartSvc = inject(CartService);
  followNotificationSvc = inject(FollowNotificationService);

  get role(): string | null {
    return this.session.role;
  }

  // ── Categorized links ─────────────────────────────────

  get learningLinks(): NavLink[] {
    if (this.role === 'PARTNER') return [];
    return [
      { label: 'Courses',         path: '/mother/courses',         icon: 'menu_book' },
      { label: 'My Learning',     path: '/mother/enrollments',     icon: 'playlist_add_check' },
      { label: 'Recommendations', path: '/mother/recommendations', icon: 'lightbulb' },
      { label: 'Collaboration',   path: '/mother/collaboration',   icon: 'groups' },
      { label: 'Notes',           path: '/mother/notes',           icon: 'sticky_note_2' },
    ];
  }

  get CommunityLinks(): NavLink[] {
  if (this.role === 'PARTNER') return [];
  return [
    { label: 'Community', path: '/mother/communaute', icon: 'people' },  // ← was /mother/community
    { label: 'My Matches', path: '/mother/mes-matches', icon: 'favorite' }, // ← was /mes-matches
    { label: 'Shop',       path: '/mother/shop',        icon: 'shopping_cart' } // ← was /shop
  ];
}

  get healthLinks(): NavLink[] {
    if (this.role === 'PARTNER') return [];
    return [
      { label: 'Health Profile',   path: '/mother/health-profile',   icon: 'monitor_heart' },
      { label: 'Medical Card',     path: '/mother/medical-card',     icon: 'badge' },
      { label: 'Maternities',      path: '/mother/maternities',      icon: 'pregnant_woman' },
      { label: 'Phase Predictor',  path: '/mother/phase-predictor',  icon: 'calendar_month' },
      { label: 'Emotion Detector', path: '/mother/emotion-detector', icon: 'mood' },
      { label: 'Face ID',          path: '/mother/face-id',          icon: 'face' },
    ];
  }

  get careLinks(): NavLink[] {
    if (this.role === 'PARTNER') {
      return [
        { label: 'Pregnancy', path: '/partner/pregnancy', icon: 'pregnant_woman' },
        { label: 'Exams',     path: '/partner/exams',     icon: 'science' },
        { label: 'Fetal',     path: '/partner/fetal',     icon: 'child_friendly' },
      ];
    }
    return [
      { label: 'Pregnancy',           path: '/mother/pregnancy',           icon: 'pregnant_woman' },
      { label: 'Pregnancy Dashboard', path: '/mother/pregnancy-dashboard', icon: 'monitor_heart' },
      { label: 'Vitals',              path: '/mother/vitals',              icon: 'monitor_heart' },
      { label: 'Exams',               path: '/mother/exams',               icon: 'science' },
      { label: 'Fetal',               path: '/mother/fetal',               icon: 'child_friendly' },
      { label: 'Alerts',              path: '/mother/alerts',              icon: 'warning' },
      // IKBEL MODULE INTEGRATION
      { label: 'Postpartum Care',     path: '/mother/postpartum',          icon: 'spa' },
      { label: 'My Babies',           path: '/mother/babies',              icon: 'child_care' },
      { label: 'Baby Profiles',       path: '/mother/baby-profiles',       icon: 'family_restroom' },
      { label: 'Add Baby',            path: '/mother/add-baby',            icon: 'person_add' },
      // { label: 'Add Baby Size',       path: '/mother/add-baby-size',       icon: 'height' }
    ];
  }

  get toolLinks(): NavLink[] {
    if (this.role === 'PARTNER') {
      return [
        { label: 'AI Assistant', path: '/partner/ai', icon: 'smart_toy' },
        { label: 'Guides',       path: '/partner/guides', icon: 'auto_stories' },
        { label: 'Evo-Care Engine',        path: '/partner/evo-care', icon: 'auto_awesome' },
      ];
    }
    return [
      { label: 'AI Assistant', path: '/mother/ai',        icon: 'smart_toy' },
      { label: 'AI Health',    path: '/mother/ai-health', icon: 'health_and_safety' },
      { label: 'Notifications',path: '/mother/notifications', icon: 'notifications' },
      { label: 'Subscription', path: '/mother/subscription',  icon: 'workspace_premium' },
      { label: 'Referral',     path: '/mother/referral',     icon: 'share' },
    ];
  }

  get partnerLinks(): NavLink[] {
    return [
      { label: 'Invite Center', path: '/partner/invites',       icon: 'person_add' },
      { label: 'Notes',         path: '/partner/notes',         icon: 'sticky_note_2' },
      { label: 'Notifications', path: '/partner/notifications', icon: 'notifications' },
    ];
  }

  // ── Group hover logic ─────────────────────────────────

  openGroup(key: string): void {
    clearTimeout(this.closeTimer);
    this.openGroupKey = key;
  }

  closeGroup(): void {
    this.closeTimer = setTimeout(() => {
      this.openGroupKey = null;
    }, 120);
  }

  isGroupActive(key: string): boolean {
    return this.openGroupKey === key;
  }

  isGroupRouteActive(links: NavLink[]): boolean {
    const url = this.router.url;
    return links.some(l => url.startsWith(l.path));
  }

  // ── Misc ─────────────────────────────────────────────

  toggleDark(): void {
    this.themeRole.toggleMode();
  }

  logout(): void {
    this.auth.logout().subscribe();
  }

  homePath(): string {
    return this.role === 'PARTNER' ? '/partner/home' : '/mother/home';
  }

  profilePath(): string {
    return this.role === 'PARTNER' ? '/partner/home' : '/mother/profile';
  }
}