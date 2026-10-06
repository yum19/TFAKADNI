import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem  { label: string; icon: string; path: string; }
interface NavSection { label: string; items: NavItem[]; }

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.scss'],
})
export class AdminSidebarComponent {
  @Input()  collapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  private auth = inject(AuthService);

  navSections: NavSection[] = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard',      icon: 'dashboard',      path: '/admin/dashboard' },
        { label: 'Reports',        icon: 'assessment',     path: '/admin/reports'   },
      ],
    },
    // IKBEL MODULE INTEGRATION - ANALYTICS
    {
      label: 'Postpartum Analytics',
      items: [
        { label: 'Screenings',       icon: 'analytics',      path: '/admin/screening-analytics' },
        { label: 'Follow-ups',       icon: 'trending_up',    path: '/admin/follow-up-analytics' },
        { label: 'Contraception',    icon: 'pie_chart',      path: '/admin/contraception-analytics' },
      ]
    },
    {
      label: 'Content',
      items: [
        { label: 'Content Studio', icon: 'edit_square',    path: '/admin/studio'   },
        { label: 'Course Library', icon: 'library_books',  path: '/admin/courses'  },
        { label: 'Partner Guides', icon: 'menu_book',      path: '/admin/guides'   },
        // IKBEL MODULE INTEGRATION - RESOURCES
        { label: 'Support Resources', icon: 'support',     path: '/admin/support-resource' },
      ],
    },
    {
      label: 'Management',
      items: [
        { label: 'Users',          icon: 'people',          path: '/admin/users'    },
        { label: 'Plans',          icon: 'card_membership', path: '/admin/plans'    },
        { label: 'Promos',         icon: 'local_offer',     path: '/admin/promos'   },
        { label: 'Products',       icon: 'inventory_2',     path: '/admin/shop/liste-produits' },  // ← add
        { label: 'Community',      icon: 'forum',           path: '/admin/community' },
      ],
    },
    {
      label: 'Care',
      items: [
        { label: 'Pregnancies',    icon: 'pregnant_woman',  path: '/admin/pregnancies' },
        { label: 'Vitals',         icon: 'monitor_heart',   path: '/admin/vitals-admin' },
        { label: 'Exams',          icon: 'science',         path: '/admin/exams-admin' },
        { label: 'Fetal',          icon: 'child_friendly',  path: '/admin/fetal-admin' },
        { label: 'Alerts',         icon: 'warning',         path: '/admin/alerts-admin' },
        { label: 'Alert Rules',    icon: 'rule',            path: '/admin/alert-rules' },
      ],
    },
    {
      label: 'System',
      items: [
        { label: 'Settings',       icon: 'tune',            path: '/admin/settings' },
      ],
    },
  ];

  logout(): void {
    this.auth.logout().subscribe();
  }
}