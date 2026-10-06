import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminSidebarComponent } from '../../shared/components/admin-sidebar/admin-sidebar.component';
import { AdminHeaderComponent } from '../../shared/components/admin-header/admin-header.component';
import { ThemeComponent } from '../../components/theme/theme.component';
import { ThemeRoleService } from '../../core/services/theme-role.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    RouterOutlet,
    AdminSidebarComponent,
    AdminHeaderComponent,
    ThemeComponent,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent implements OnInit {
  @ViewChild('themeDrawer') themeDrawer?: MatSidenav;

  /** Desktop: icon-only collapsed state */
  sidebarCollapsed = false;

  /** Mobile: drawer open/closed */
  mobileSidebarOpen = false;

  isMobile = false;

  noPadding = false;

  constructor(private themeRole: ThemeRoleService, private router: Router) {
    this.router.events.subscribe(event => {
    if (event instanceof NavigationEnd) {
      this.noPadding = event.url.includes('dashboard');
    }
  });
  }

  @HostListener('window:resize')
  onResize(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 1024;

    // Transitioning TO mobile — close mobile drawer, reset desktop collapse
    if (!wasMobile && this.isMobile) {
      this.mobileSidebarOpen = false;
    }
    // Transitioning TO desktop — close mobile drawer
    if (wasMobile && !this.isMobile) {
      this.mobileSidebarOpen = false;
    }
  }

  ngOnInit(): void {
    this.onResize();
    this.themeRole.initializeTheme('ADMIN');
  }

  onToggleSidebar(): void {
    if (this.isMobile) {
      this.mobileSidebarOpen = !this.mobileSidebarOpen;
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }
  }

  closeMobileSidebar(): void {
    if (this.isMobile) this.mobileSidebarOpen = false;
  }
}