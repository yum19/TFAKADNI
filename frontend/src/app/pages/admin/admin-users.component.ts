import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.models';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  plan: 'FREE' | 'BASIC' | 'PREMIUM';
  role: 'USER' | 'ADMIN';
  createdAt: string;
  isActive: boolean;
  pregnancyWeek?: number;
  avatarInitials?: string;
}

// ── Confirm Dialog ─────────────────────────────────────────────────────────────
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  styles: [`
    :host {  }
    .confirm-wrap { padding: 0; }
    .confirm-header {
      background: linear-gradient(135deg, #1a1028, #3d2f4a);
      padding: 1.5rem 2rem 1.25rem; position: relative; overflow: hidden;
    }
    .confirm-header::after {
      content: ''; position: absolute; top: -20px; right: -20px;
      width: 80px; height: 80px; border-radius: 50%; background: rgba(220,38,38,.3);
    }
    .icon-circle {
      width: 44px; height: 44px; background: rgba(220,38,38,.25);
      border-radius: 12px; display: flex; align-items: center; justify-content: center;
      margin-bottom: .75rem; position: relative; z-index: 1;
    }
    .icon-circle mat-icon { color: #fca5a5; font-size: 22px; width: 22px; height: 22px; }
    .confirm-title {  font-size: 1.1rem; font-weight: 800; color: #fff; margin: 0; position: relative; z-index: 1; }
    .confirm-body { padding: 1.5rem 2rem; }
    .confirm-msg { font-size: 14px; color: #3d2f4a; line-height: 1.6; margin: 0; }
    .confirm-footer { padding: .75rem 2rem 1.5rem; display: flex; justify-content: flex-end; gap: .75rem; border-top: 1px solid #ede8f2; }
    .btn-cancel {
       font-weight: 600 !important;
      color: #8b7d98 !important; border: 1.5px solid #ede8f2 !important;
      border-radius: 10px !important; height: 42px !important; padding: 0 1.25rem !important;
    }
    .btn-confirm {
       font-weight: 700 !important;
      background: #dc2626 !important; color: #fff !important;
      border-radius: 10px !important; height: 42px !important; padding: 0 1.5rem !important;
      box-shadow: 0 4px 14px rgba(220,38,38,.35) !important;
    }
  `],
  template: `
    <div class="confirm-wrap">
      <div class="confirm-header">
        <div class="icon-circle"><mat-icon>warning_amber</mat-icon></div>
        <h2 class="confirm-title">{{ data.title }}</h2>
      </div>
      <div class="confirm-body">
        <p class="confirm-msg">{{ data.message }}</p>
      </div>
      <div class="confirm-footer">
        <button mat-flat-button class="btn-cancel" (click)="ref.close(false)">Annuler</button>
        <button mat-flat-button class="btn-confirm" (click)="ref.close(true)">
          {{ data.confirmLabel || 'Confirmer' }}
        </button>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  constructor(
    public ref: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string; message: string; confirmLabel?: string }
  ) {}
}

// ── User Detail Dialog ──────────────────────────────────────────────────────────
@Component({
  selector: 'app-user-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  styles: [`
    :host {  }
    .wrap { padding: 0; min-width: 380px; }
    .ud-header { background: linear-gradient(135deg, #1a1028, #3d2f4a); padding: 2rem; text-align: center; }
    .avatar-lg {
      width: 72px; height: 72px; border-radius: 50%; display: flex;
      align-items: center; justify-content: center; margin: 0 auto 1rem;
       font-size: 1.5rem; font-weight: 800;
      border: 3px solid rgba(255,255,255,.2);
    }
    .ud-name {  font-size: 1.2rem; font-weight: 800; color: #fff; margin-bottom: .25rem; }
    .ud-email { font-size: 13px; color: rgba(255,255,255,.55); }
    .ud-body { padding: 1.5rem; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .875rem; }
    .detail-item { background: #faf8fc; border-radius: 12px; padding: .875rem 1rem; }
    .detail-lbl { font-size: 11px; color: #8b7d98; text-transform: uppercase; letter-spacing: .08em; margin-bottom: .25rem; }
    .detail-val {  font-size: .9rem; font-weight: 700; color: #1a1028; }
    .ud-footer { padding: .75rem 1.5rem 1.5rem; display: flex; justify-content: flex-end; }
    .btn-close {  font-weight: 700 !important; background: #1a1028 !important; color: #fff !important; border-radius: 10px !important; height: 40px !important; padding: 0 1.5rem !important; }
  `],
  template: `
    <div class="wrap">
      <div class="ud-header">
        <div class="avatar-lg" [style.background]="getAvatarColor(data.user.plan)">
          {{ data.user.avatarInitials || (data.user.firstName[0] + data.user.lastName[0]) }}
        </div>
        <div class="ud-name">{{ data.user.firstName }} {{ data.user.lastName }}</div>
        <div class="ud-email">{{ data.user.email }}</div>
      </div>
      <div class="ud-body">
        <div class="detail-grid">
          <div class="detail-item">
            <div class="detail-lbl">Plan</div>
            <div class="detail-val">{{ data.user.plan }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-lbl">Rôle</div>
            <div class="detail-val">{{ data.user.role }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-lbl">Statut</div>
            <div class="detail-val" [style.color]="data.user.isActive ? '#16a34a' : '#dc2626'">
              {{ data.user.isActive ? 'Actif' : 'Inactif' }}
            </div>
          </div>
          <div class="detail-item">
            <div class="detail-lbl">Semaine grossesse</div>
            <div class="detail-val">{{ data.user.pregnancyWeek ? 'SA ' + data.user.pregnancyWeek : '—' }}</div>
          </div>
          <div class="detail-item" style="grid-column:1/-1">
            <div class="detail-lbl">Inscrit le</div>
            <div class="detail-val">{{ data.user.createdAt | date:'dd MMMM yyyy' }}</div>
          </div>
        </div>
      </div>
      <div class="ud-footer">
        <button mat-flat-button class="btn-close" (click)="ref.close()">Fermer</button>
      </div>
    </div>
  `,
})
export class UserDetailDialogComponent {
  constructor(
    public ref: MatDialogRef<UserDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: User }
  ) {}
  getAvatarColor(plan: string): string {
    const map: Record<string, string> = { FREE: '#4361ee', BASIC: '#c9972b', PREMIUM: '#e8436c' };
    return map[plan] || '#8b7d98';
  }
}

// ── Admin Users Component ──────────────────────────────────────────────────────
@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatSnackBarModule, MatDialogModule,
    MatInputModule, MatFormFieldModule, MatProgressSpinnerModule,
    MatMenuModule, MatSelectModule, MatTooltipModule, MatChipsModule,
  ],
  styles: [`

    :host {
      --rose: #e8436c;
      --rose-light: #fdf0f3;
      --ink: #1a1028;
      --ink-soft: #3d2f4a;
      --muted: #8b7d98;
      --border: #ede8f2;
      --surface: #faf8fc;
      --white: #fff;
      --shadow-sm: 0 2px 8px rgba(26,16,40,.06);
      --shadow-md: 0 8px 32px rgba(26,16,40,.10);
      display: block;
      min-height: 100vh;
    }

    .users-page { max-width: 1280px; margin: 0 auto; padding: 2.5rem 2rem; }

    /* ── Header ── */
    .page-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap; }
    .page-eyebrow {  font-size: 11px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: var(--rose); margin-bottom: .4rem; }
    .page-title {  font-size: 2.2rem; font-weight: 800; color: var(--ink); margin: 0 0 .35rem; }
    .page-sub { font-size: 14px; color: var(--muted); margin: 0; font-weight: 300; }

    /* ── Stats ── */
    .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-bottom: 1.75rem; }
    @media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 600px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    .stat-card {
      background: var(--white); border: 1px solid var(--border); border-radius: 16px;
      padding: 1.125rem; box-shadow: var(--shadow-sm);
      display: flex; align-items: center; gap: .875rem;
      transition: box-shadow .2s, transform .2s;
    }
    .stat-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .stat-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .stat-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .stat-lbl { font-size: 11px; color: var(--muted); }
    .stat-val {  font-size: 1.35rem; font-weight: 700; color: var(--ink); line-height: 1.1; }

    /* ── Toolbar ── */
    .table-container { background: var(--white); border-radius: 20px; border: 1.5px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden; }
    .table-toolbar { display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
    .search-field { flex: 1; min-width: 200px; }
    .search-field mat-form-field { width: 100%; }
    .filter-select { min-width: 130px; }
    .filter-select mat-form-field { width: 100%; }

    /* ── Mat Table ── */
    table { width: 100%; }
    ::ng-deep .mat-mdc-header-row { background: #faf8fc !important; }
    ::ng-deep .mat-mdc-header-cell {  font-size: 11px !important; font-weight: 700 !important; letter-spacing: .1em !important; text-transform: uppercase !important; color: #8b7d98 !important; border-bottom: 1px solid #ede8f2 !important; padding: .875rem 1rem !important; }
    ::ng-deep .mat-mdc-row { transition: background .15s !important; cursor: pointer; }
    ::ng-deep .mat-mdc-row:hover { background: #faf8fc !important; }
    ::ng-deep .mat-mdc-cell { border-bottom: 1px solid #f4f0f8 !important; font-size: 14px !important; padding: .875rem 1rem !important; }
    .ps-table { padding-left: 1.5rem !important; }
    .pe-table { padding-right: 1.5rem !important; }

    /* Avatar */
    .avatar {
      width: 38px; height: 38px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
       font-size: 13px; font-weight: 700; color: #fff;
      flex-shrink: 0;
    }
    .user-cell { display: flex; align-items: center; gap: .75rem; }
    .user-name { font-weight: 500; color: var(--ink); font-size: 14px; }
    .user-email { font-size: 12px; color: var(--muted); }

    /* Plan badge */
    .plan-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; border-radius: 20px; font-size: 12px;  font-weight: 700; letter-spacing: .04em; }
    .plan-FREE { background: #f0f4fe; color: #4361ee; }
    .plan-BASIC { background: #fef8ec; color: #c9972b; }
    .plan-PREMIUM { background: #fdf0f3; color: #e8436c; }

    /* Role badge */
    .role-badge { display: inline-block; padding: 3px 10px; border-radius: 8px; font-size: 11px;  font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
    .role-ADMIN { background: var(--ink); color: #fff; }
    .role-USER { background: var(--surface); color: var(--muted); border: 1px solid var(--border); }

    /* Status dot */
    .status-cell { display: flex; align-items: center; gap: .4rem; }
    .dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
    .dot.on { background: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,.2); }
    .dot.off { background: #dc2626; }
    .status-text { font-size: 13px; }

    /* Actions */
    .actions-cell { display: flex; align-items: center; justify-content: flex-end; gap: .2rem; }
    .action-btn { width: 32px !important; height: 32px !important; border-radius: 8px !important; }

    /* Pagination row */
    .pagination-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.5rem; border-top: 1px solid var(--border); flex-wrap: wrap; gap: .5rem;
    }
    .pagination-info { font-size: 13px; color: var(--muted); }
    .pagination-btns { display: flex; gap: .4rem; }
    .pag-btn { width: 32px !important; height: 32px !important; border-radius: 8px !important;  font-size: 13px !important; border: 1.5px solid var(--border) !important; }
    .pag-btn.active { background: var(--ink) !important; color: #fff !important; border-color: var(--ink) !important; }

    /* Empty / Loading */
    .loading-wrap { display: flex; justify-content: center; padding: 4rem 0; }
    .empty-state { padding: 4rem 2rem; text-align: center; }
    .empty-icon { font-size: 48px; width: 48px; height: 48px; color: var(--border); margin: 0 auto 1rem; display: block; }
    .empty-title {  font-size: 1rem; font-weight: 700; color: var(--ink-soft); margin-bottom: .4rem; }
    .empty-sub { font-size: 14px; color: var(--muted); }

    ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none !important; }
  `],
  template: `
    <div class="users-page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <div class="page-eyebrow">Gestion</div>
          <h1 class="page-title">Utilisateurs</h1>
          <p class="page-sub">{{ filteredUsers.length }} utilisateur(s) correspondent aux filtres</p>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background:#fdf0f3"><mat-icon style="color:#e8436c">people</mat-icon></div>
          <div><div class="stat-lbl">Total</div><div class="stat-val">{{ users.length }}</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#f0fdf4"><mat-icon style="color:#16a34a">check_circle</mat-icon></div>
          <div><div class="stat-lbl">Actifs</div><div class="stat-val">{{ activeCount }}</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fdf0f3"><mat-icon style="color:#e8436c">workspace_premium</mat-icon></div>
          <div><div class="stat-lbl">Premium</div><div class="stat-val">{{ premiumCount }}</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef8ec"><mat-icon style="color:#c9972b">star</mat-icon></div>
          <div><div class="stat-lbl">Basic</div><div class="stat-val">{{ basicCount }}</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#f0f4fe"><mat-icon style="color:#4361ee">person</mat-icon></div>
          <div><div class="stat-lbl">Gratuit</div><div class="stat-val">{{ freeCount }}</div></div>
        </div>
      </div>

      <!-- Table Container -->
      <div class="table-container">

        <!-- Toolbar -->
        <div class="table-toolbar">
          <div class="search-field">
            <mat-form-field appearance="outline">
              <mat-icon matPrefix style="color:#8b7d98;font-size:20px;width:20px;height:20px;margin-right:.4rem">search</mat-icon>
              <input matInput [(ngModel)]="searchQuery" (ngModelChange)="applyFilters()" placeholder="Rechercher un utilisateur..." />
            </mat-form-field>
          </div>
          <div class="filter-select">
            <mat-form-field appearance="outline">
              <mat-select [(ngModel)]="planFilter" (ngModelChange)="applyFilters()" placeholder="Plan">
                <mat-option value="">Tous les plans</mat-option>
                <mat-option value="FREE">Gratuit</mat-option>
                <mat-option value="BASIC">Basic</mat-option>
                <mat-option value="PREMIUM">Premium</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="filter-select">
            <mat-form-field appearance="outline">
              <mat-select [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()" placeholder="Statut">
                <mat-option value="">Tous</mat-option>
                <mat-option value="active">Actifs</mat-option>
                <mat-option value="inactive">Inactifs</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>

        @if (loading) {
          <div class="loading-wrap"><mat-spinner diameter="36" color="warn"></mat-spinner></div>
        } @else if (filteredUsers.length === 0) {
          <div class="empty-state">
            <mat-icon class="empty-icon">search_off</mat-icon>
            <div class="empty-title">Aucun utilisateur trouvé</div>
            <p class="empty-sub">Essayez de modifier vos filtres de recherche</p>
          </div>
        } @else {
          <div style="overflow-x:auto">
            <table mat-table [dataSource]="pagedUsers">

              <ng-container matColumnDef="user">
                <th mat-header-cell *matHeaderCellDef class="ps-table">Utilisateur</th>
                <td mat-cell *matCellDef="let u" class="ps-table">
                  <div class="user-cell">
                    <div class="avatar" [style.background]="getAvatarColor(u.plan)">
                      {{ (u.firstName[0] + u.lastName[0]).toUpperCase() }}
                    </div>
                    <div>
                      <div class="user-name">{{ u.firstName }} {{ u.lastName }}</div>
                      <div class="user-email">{{ u.email }}</div>
                    </div>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="plan">
                <th mat-header-cell *matHeaderCellDef>Plan</th>
                <td mat-cell *matCellDef="let u">
                  <span class="plan-badge" [class]="'plan-badge plan-' + u.plan">
                    <mat-icon style="font-size:12px;width:12px;height:12px">
                      {{ u.plan === 'PREMIUM' ? 'workspace_premium' : u.plan === 'BASIC' ? 'star' : 'person' }}
                    </mat-icon>
                    {{ u.plan }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Rôle</th>
                <td mat-cell *matCellDef="let u">
                  <span class="role-badge" [class]="'role-badge role-' + u.role">{{ u.role }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="week">
                <th mat-header-cell *matHeaderCellDef>Semaine</th>
                <td mat-cell *matCellDef="let u" style="color:#8b7d98;font-size:13px">
                  {{ u.pregnancyWeek ? 'SA ' + u.pregnancyWeek : '—' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Statut</th>
                <td mat-cell *matCellDef="let u">
                  <div class="status-cell">
                    <span class="dot" [class.on]="u.isActive" [class.off]="!u.isActive"></span>
                    <span class="status-text" [style.color]="u.isActive ? '#16a34a' : '#8b7d98'">
                      {{ u.isActive ? 'Actif' : 'Inactif' }}
                    </span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="pe-table"></th>
                <td mat-cell *matCellDef="let u" class="pe-table">
                  <div class="actions-cell">
                    <button mat-icon-button class="action-btn" (click)="viewUser(u, $event)" matTooltip="Voir le profil">
                      <mat-icon style="color:#4361ee;font-size:19px">person</mat-icon>
                    </button>
                    <!-- <button mat-icon-button class="action-btn" (click)="toggleUserStatus(u, $event)"
                      [matTooltip]="u.isActive ? 'Désactiver' : 'Activer'">
                      <mat-icon [style.color]="u.isActive ? '#e8436c' : '#16a34a'" style="font-size:19px">
                        {{ u.isActive ? 'block' : 'check_circle' }}
                      </mat-icon>
                    </button> -->
                    <button mat-icon-button class="action-btn" (click)="deleteUser(u, $event)" matTooltip="Supprimer">
                      <mat-icon style="color:#dc2626;font-size:19px">delete_outline</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="created">
                <th mat-header-cell *matHeaderCellDef>Inscrit le</th>
                <td mat-cell *matCellDef="let u" style="color:#8b7d98;font-size:13px">
                  {{ u.createdAt | date:'dd/MM/yyyy' }}
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;" (click)="viewUser(row, $event)"></tr>
            </table>
          </div>

          <!-- Pagination -->
          <div class="pagination-row">
            <span class="pagination-info">
              {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, filteredUsers.length) }}
              sur {{ filteredUsers.length }}
            </span>
            <div class="pagination-btns">
              <button mat-flat-button class="pag-btn" (click)="prevPage()" [disabled]="currentPage === 1">
                <mat-icon style="font-size:18px">chevron_left</mat-icon>
              </button>
              @for (p of pages; track p) {
                <button mat-flat-button class="pag-btn" [class.active]="p === currentPage" (click)="goToPage(p)">
                  {{ p }}
                </button>
              }
              <button mat-flat-button class="pag-btn" (click)="nextPage()" [disabled]="currentPage === totalPages">
                <mat-icon style="font-size:18px">chevron_right</mat-icon>
              </button>
            </div>
          </div>
        }

      </div>
    </div>
  `,
})
export class AdminUsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  pagedUsers: User[] = [];
  loading = true;
  columns = ['user', 'plan', 'role', 'week', 'status', 'created', 'actions'];
  searchQuery = '';
  planFilter = '';
  statusFilter = '';
  currentPage = 1;
  pageSize = 10;
  readonly Math = Math;

  get activeCount() { return this.users.filter(u => u.isActive).length; }
  get premiumCount() { return this.users.filter(u => u.plan === 'PREMIUM').length; }
  get basicCount() { return this.users.filter(u => u.plan === 'BASIC').length; }
  get freeCount() { return this.users.filter(u => u.plan === 'FREE').length; }
  get totalPages() { return Math.ceil(this.filteredUsers.length / this.pageSize) || 1; }
  get pages() {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1)
      .filter(p => Math.abs(p - this.currentPage) <= 2);
  }

  constructor(private http: HttpClient, private snackBar: MatSnackBar, private dialog: MatDialog) {}

  ngOnInit(): void { this.loadUsers(); }

  loadUsers(): void {
    this.loading = true;
    this.http.get<ApiResponse<User[]>>(`${environment.apiUrl}/users`).subscribe({
      next: (res) => {
        this.users = res.data;
        console.log('Loaded users:', this.users);
        this.applyFilters();
        console.log('Filtered users:', this.filteredUsers);
        this.loading = false;
      },
      error: () => { this.loading = false; this.snackBar.open('Erreur chargement.', 'Fermer', { duration: 3000 }); }
    });
  }

  applyFilters(): void {
    const q = this.searchQuery.toLowerCase();
    this.filteredUsers = this.users.filter(u => {
      const matchSearch = !q || u.email.toLowerCase().includes(q)
        || u.firstName.toLowerCase().includes(q)
        || u.lastName.toLowerCase().includes(q);
      const matchPlan = !this.planFilter || u.plan === this.planFilter;
      const matchStatus = !this.statusFilter
        || (this.statusFilter === 'active' && u.isActive)
        || (this.statusFilter === 'inactive' && !u.isActive);
      return matchSearch && matchPlan && matchStatus;
    });
    this.currentPage = 1;
    this.updatePage();
  }

  updatePage(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedUsers = this.filteredUsers.slice(start, start + this.pageSize);
  }

  prevPage(): void { if (this.currentPage > 1) { this.currentPage--; this.updatePage(); } }
  nextPage(): void { if (this.currentPage < this.totalPages) { this.currentPage++; this.updatePage(); } }
  goToPage(p: number): void { this.currentPage = p; this.updatePage(); }

  getAvatarColor(plan: string): string {
    const map: Record<string, string> = { FREE: '#4361ee', BASIC: '#c9972b', PREMIUM: '#e8436c' };
    return map[plan] || '#8b7d98';
  }

  viewUser(user: User, event?: Event): void {
    if (event) event.stopPropagation();
    this.dialog.open(UserDetailDialogComponent, { width: '440px', data: { user }, panelClass: 'rounded-dialog' });
  }

  /* toggleUserStatus(user: User, event?: Event): void {
    if (event) event.stopPropagation();
    this.http.patch<ApiResponse<User>>(`${environment.apiUrl}/users/${user.id}/toggle`, {}).subscribe({
      next: (res) => {
        const idx = this.users.findIndex(u => u.id === user.id);
        if (idx !== -1) this.users[idx] = res.data;
        this.applyFilters();
        this.snackBar.open(`Utilisateur ${res.data.isActive ? 'activé' : 'désactivé'}.`, 'OK', { duration: 2500 });
      },
      error: () => this.snackBar.open('Erreur.', 'Fermer', { duration: 3000 })
    });
  } */

  deleteUser(user: User, event?: Event): void {
    if (event) event.stopPropagation();
    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Supprimer l\'utilisateur',
        message: `Voulez-vous supprimer définitivement le compte de ${user.firstName} ${user.lastName} (${user.email}) ? Cette action est irréversible.`,
        confirmLabel: 'Supprimer'
      }
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.http.delete<ApiResponse<void>>(`${environment.apiUrl}/users/${user.id}`).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== user.id);
          this.applyFilters();
          this.snackBar.open('Utilisateur supprimé.', 'OK', { duration: 3000 });
        },
        error: () => this.snackBar.open('Erreur suppression.', 'Fermer', { duration: 3000 })
      });
    });
  }
}