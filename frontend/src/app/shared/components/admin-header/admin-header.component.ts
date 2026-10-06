import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { ThemeRoleService } from '../../../core/services/theme-role.service';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [MatIconModule, DatePipe, RouterLink],
  templateUrl: './admin-header.component.html',
  styleUrls: ['./admin-header.component.scss'],
})
export class AdminHeaderComponent implements OnInit, OnDestroy {
  @Input()  sidebarCollapsed = false;
  @Output() openTheme      = new EventEmitter<void>();
  @Output() toggleSidebar  = new EventEmitter<void>();

  private themeRole = inject(ThemeRoleService);
  private clockInterval: ReturnType<typeof setInterval> | null = null;
  currentTime = new Date();

  ngOnInit(): void {
    this.clockInterval = setInterval(() => this.currentTime = new Date(), 1000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  toggleMode(): void { this.themeRole.toggleMode(); }
}