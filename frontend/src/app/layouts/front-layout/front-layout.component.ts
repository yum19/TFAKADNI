import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';
import { FrontHeaderComponent } from '../../shared/components/front-header/front-header.component';
import { FrontFooterComponent } from '../../shared/components/front-footer/front-footer.component';
import { ThemeComponent } from '../../components/theme/theme.component';
import { SessionService } from '../../core/services/session.service';
import { ThemeRoleService } from '../../core/services/theme-role.service';
import { NotificationService } from '../../core/services/notification.service';
import { AlertBadgeService } from '../../core/services/alert-badge.service';
import { ExamBadgeService } from '../../core/services/exam-badge.service';

@Component({
  selector: 'app-front-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, MatSidenavModule, MatListModule, MatButtonModule, FrontHeaderComponent, FrontFooterComponent, ThemeComponent],
  templateUrl: './front-layout.component.html',
  styleUrls: ['./front-layout.component.scss']
})
export class FrontLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('drawer') drawer?: MatSidenav;
  @ViewChild('themeDrawer') themeDrawer?: MatSidenav;

  private sessionSubscription?: Subscription;

  constructor(public session: SessionService, private themeRole: ThemeRoleService, private notificationService: NotificationService, private alertBadge: AlertBadgeService, private examBadge: ExamBadgeService) {}

 ngOnInit(): void {
  this.themeRole.initializeTheme(this.session.role);
  console.log('FrontLayoutComponent initialized, session role =', this.session.role);
  
  let initialLoad = true; // ← add this flag

  this.sessionSubscription = this.session.auth$.subscribe((auth) => {
    console.log('FrontLayoutComponent auth$ update', auth?.user?.role);
    if (auth?.user?.role === 'USER') {
      if (initialLoad) {
        initialLoad = false; // ← skip the first emission
        return;
      }
      this.refreshMotherNotifications();
    }
  });

  this.refreshMotherNotifications(); // ← this handles the first load
}

  ngOnDestroy(): void {
    this.sessionSubscription?.unsubscribe();
  }

  private refreshMotherNotifications(): void {
    if (this.session.role === 'USER') {
      this.notificationService.loadUnread();
      this.alertBadge.refresh();
      this.examBadge.refresh();
    }
  }

  navLinks() {
    return this.session.role === 'PARTNER'
      ? [
          { label: 'Partner home', path: '/front/partner/home' },
          { label: 'Invites', path: '/front/partner/invites' },
          { label: 'Guides', path: '/front/partner/guides' },
          { label: 'Notes', path: '/front/partner/notes' },
          { label: 'Notifications', path: '/front/partner/notifications' },
          { label: 'AI assistant', path: '/front/partner/ai' }
        ]
      : [
          { label: 'Mother home', path: '/front/mother/home' },
          { label: 'Courses', path: '/front/mother/courses' },
          { label: 'My learning', path: '/front/mother/enrollments' },
          { label: 'Recommendations', path: '/front/mother/recommendations' },
          { label: 'Collaboration', path: '/front/mother/collaboration' },
          { label: 'Notes', path: '/front/mother/notes' },
          { label: 'Notifications', path: '/front/mother/notifications' },
          { label: 'AI assistant', path: '/front/mother/ai' }
        ];
  }
}
