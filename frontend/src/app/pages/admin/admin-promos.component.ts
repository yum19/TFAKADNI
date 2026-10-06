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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ConfirmDialogComponent } from './admin-users.component';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.models';

interface PromoCode {
  id: number;
  code: string;
  discountPct: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  active: boolean;
}

// ── Create/Edit Dialog ────────────────────────────────────────────────────────
@Component({
  selector: 'app-promo-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatIconModule,
    MatDialogModule, MatInputModule, MatFormFieldModule,
    MatDatepickerModule, MatNativeDateModule],
  providers: [MatDatepickerModule],
  styles: [`
    :host {  }
    .dialog-wrap { padding: 0; min-width: 420px; }
    .dialog-header {
      background: linear-gradient(135deg, #1a1028 0%, #3d2f4a 100%);
      padding: 1.75rem 2rem;
      position: relative;
      overflow: hidden;
    }
    .dialog-header::after {
      content: '';
      position: absolute;
      top: -30px; right: -30px;
      width: 100px; height: 100px;
      border-radius: 50%;
      background: rgba(232,67,108,.25);
    }
    .dialog-header::before {
      content: '';
      position: absolute;
      bottom: -20px; right: 40px;
      width: 60px; height: 60px;
      border-radius: 50%;
      background: rgba(232,67,108,.15);
    }
    .dialog-title {
      
      font-size: 1.3rem;
      font-weight: 800;
      color: #fff;
      margin: 0 0 .25rem;
      position: relative;
      z-index: 1;
    }
    .dialog-sub { font-size: 13px; color: rgba(255,255,255,.6); margin: 0; position: relative; z-index: 1; }
    .dialog-icon {
      width: 40px; height: 40px;
      background: rgba(232,67,108,.3);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: .75rem;
      position: relative; z-index: 1;
    }
    .dialog-icon mat-icon { color: #fff; font-size: 22px; width: 22px; height: 22px; }
    .dialog-body { padding: 1.75rem 2rem; }
    .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
    .field-full { grid-column: 1 / -1; }
    mat-form-field { width: 100%; }
    .dialog-footer {
      padding: 1rem 2rem 1.5rem;
      display: flex; justify-content: flex-end; gap: .75rem;
      border-top: 1px solid #ede8f2;
    }
    .btn-cancel {
      
      font-weight: 600 !important;
      color: #8b7d98 !important;
      border: 1.5px solid #ede8f2 !important;
      border-radius: 10px !important;
      padding: 0 1.25rem !important;
      height: 42px !important;
    }
    .btn-submit {
      
      font-weight: 700 !important;
      background: #e8436c !important;
      color: #fff !important;
      border-radius: 10px !important;
      padding: 0 1.5rem !important;
      height: 42px !important;
      box-shadow: 0 4px 16px rgba(232,67,108,.35) !important;
    }
    .btn-submit:hover { background: #d63560 !important; }
    .btn-submit[disabled] { opacity: .5 !important; box-shadow: none !important; }
  `],
  template: `
    <div class="dialog-wrap">
      <div class="dialog-header">
        <div class="dialog-icon"><mat-icon>local_offer</mat-icon></div>
        <h2 class="dialog-title">{{ data.promo ? 'Modifier le code' : 'Nouveau code promo' }}</h2>
        <p class="dialog-sub">{{ data.promo ? 'Modifiez les paramètres du code promo' : 'Créez une nouvelle offre promotionnelle' }}</p>
      </div>

      <div class="dialog-body">
        <form [formGroup]="form">
          <div class="field-grid">
            <div class="field-full">
              <mat-form-field appearance="outline">
                <mat-label>Code promo</mat-label>
                <mat-icon matPrefix style="color:#e8436c;margin-right:.5rem">tag</mat-icon>
                <input matInput formControlName="code" placeholder="Ex: MAMA20" style="text-transform:uppercase;font-weight:600;letter-spacing:.08em" />
                <mat-error>Requis (3–50 caractères)</mat-error>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline">
              <mat-label>Réduction (%)</mat-label>
              <input matInput type="number" formControlName="discountPct" placeholder="20" min="1" max="100" />
              <mat-icon matSuffix>percent</mat-icon>
              <mat-error>Entre 1 et 100</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Max utilisations</mat-label>
              <input matInput type="number" formControlName="maxUses" placeholder="Illimité" min="1" />
              <mat-icon matSuffix style="font-size:18px;color:#8b7d98">all_inclusive</mat-icon>
            </mat-form-field>

            <div class="field-full">
              <mat-form-field appearance="outline">
                <mat-label>Date d'expiration</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="expiresAt" placeholder="Sélectionner..." />
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>
            </div>
          </div>
        </form>
      </div>

      <div class="dialog-footer">
        <button mat-flat-button class="btn-cancel" (click)="ref.close(null)">Annuler</button>
        <button mat-flat-button class="btn-submit" (click)="submit()" [disabled]="form.invalid">
          <mat-icon style="font-size:18px;width:18px;height:18px;margin-right:.35rem">
            {{ data.promo ? 'save' : 'add_circle' }}
          </mat-icon>
          {{ data.promo ? 'Enregistrer' : 'Créer le code' }}
        </button>
      </div>
    </div>
  `,
})
export class PromoFormDialogComponent {
  form: FormGroup;
  constructor(
    public ref: MatDialogRef<PromoFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { promo?: PromoCode },
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      code: [data.promo?.code ?? '', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      discountPct: [data.promo?.discountPct ?? null, [Validators.required, Validators.min(1), Validators.max(100)]],
      maxUses: [data.promo?.maxUses ?? null],
      expiresAt: [data.promo?.expiresAt ? new Date(data.promo.expiresAt) : null],
    });
  }
  submit(): void {
    if (this.form.invalid) return;
    const val = this.form.value;
    let expiresAt = null;
    if (val.expiresAt) {
      const d = new Date(val.expiresAt);
      d.setHours(12, 0, 0, 0);
      expiresAt = d.toISOString();
    }
    this.ref.close({
      code: val.code.toUpperCase(),
      discountPct: val.discountPct,
      maxUses: val.maxUses || null,
      expiresAt,
    });
  }
}

// ── Admin Promos Component ────────────────────────────────────────────────────
@Component({
  selector: 'app-admin-promos',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatSnackBarModule, MatDialogModule,
    MatInputModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatTooltipModule, MatChipsModule,
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

    .promos-page { max-width: 1200px; margin: 0 auto; padding: 2.5rem 2rem; }

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap;
    }
    .page-eyebrow {
       font-size: 11px; font-weight: 700;
      letter-spacing: .18em; text-transform: uppercase; color: var(--rose); margin-bottom: .4rem;
    }
    .page-title {  font-size: 2.2rem; font-weight: 800; color: var(--ink); margin: 0 0 .35rem; }
    .page-sub { font-size: 14px; color: var(--muted); margin: 0; font-weight: 300; }

    .new-btn {
       font-weight: 700 !important;
      background: var(--rose) !important; color: #fff !important;
      border-radius: 12px !important; height: 46px !important; padding: 0 1.5rem !important;
      box-shadow: 0 4px 16px rgba(232,67,108,.35) !important;
      transition: all .2s !important; gap: .4rem !important; display: flex !important; align-items: center !important;
    }
    .new-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 28px rgba(232,67,108,.4) !important; }

    /* ── Summary Cards ── */
    .summary-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
    @media (max-width: 768px) { .summary-row { grid-template-columns: repeat(2, 1fr); } }
    .summary-card {
      background: var(--white); border: 1px solid var(--border); border-radius: 16px;
      padding: 1.25rem; box-shadow: var(--shadow-sm);
      display: flex; align-items: center; gap: .875rem;
      transition: box-shadow .2s, transform .2s;
    }
    .summary-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .sc-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .sc-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .sc-label { font-size: 12px; color: var(--muted); }
    .sc-value {  font-size: 1.35rem; font-weight: 700; color: var(--ink); line-height: 1.1; }

    /* ── Table Section ── */
    .table-card {
      background: var(--white); border-radius: 20px;
      border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden;
    }
    .table-toolbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border);
    }
    .table-title {  font-size: 1rem; font-weight: 700; color: var(--ink); }
    .table-count { font-size: 12px; color: var(--muted); background: var(--surface); padding: 3px 10px; border-radius: 20px; border: 1px solid var(--border); }

    /* ── Mat Table ── */
    table { width: 100%; }
    ::ng-deep .mat-mdc-header-row { background: #faf8fc !important; }
    ::ng-deep .mat-mdc-header-cell {
       font-size: 11px !important; font-weight: 700 !important;
      letter-spacing: .1em !important; text-transform: uppercase !important; color: #8b7d98 !important;
      border-bottom: 1px solid #ede8f2 !important;
    }
    ::ng-deep .mat-mdc-row { transition: background .15s !important; }
    ::ng-deep .mat-mdc-row:hover { background: #faf8fc !important; }
    ::ng-deep .mat-mdc-cell { border-bottom: 1px solid #f4f0f8 !important; font-size: 14px !important; padding: .875rem 1rem !important; }
    .ps-table { padding-left: 1.5rem !important; }

    .code-chip {
      display: inline-block; background: var(--ink); color: #fff;
       font-size: 12px; font-weight: 600;
      letter-spacing: .08em; padding: 4px 12px; border-radius: 8px;
    }
    .badge-discount {
      display: inline-flex; align-items: center;
      background: #d1fae5; color: #065f46;
       font-size: 13px; font-weight: 700;
      padding: 3px 10px; border-radius: 8px;
    }
    .badge-active { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-active.on { background: #d1fae5; color: #065f46; }
    .badge-active.off { background: #fee2e2; color: #991b1b; }
    .dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .dot.on { background: #16a34a; }
    .dot.off { background: #dc2626; }

    .usage-bar-wrap { display: flex; align-items: center; gap: .5rem; }
    .usage-bar { height: 4px; width: 60px; background: #f0ebf8; border-radius: 4px; overflow: hidden; }
    .usage-bar-fill { height: 100%; background: var(--rose); border-radius: 4px; transition: width .4s; }
    .usage-text { font-size: 12px; color: var(--muted); white-space: nowrap; }

    .actions-cell { display: flex; align-items: center; justify-content: flex-end; gap: .25rem; }
    .action-btn { width: 34px !important; height: 34px !important; border-radius: 8px !important; transition: background .15s !important; }
    .action-btn:hover { background: var(--surface) !important; }

    /* Empty state */
    .empty-state {
      padding: 5rem 2rem; text-align: center;
    }
    .empty-icon { font-size: 56px; width: 56px; height: 56px; color: var(--border); margin: 0 auto 1rem; display: block; }
    .empty-title {  font-size: 1.1rem; font-weight: 700; color: var(--ink-soft); margin-bottom: .5rem; }
    .empty-sub { font-size: 14px; color: var(--muted); margin-bottom: 1.5rem; }

    .loading-wrap { display: flex; justify-content: center; padding: 5rem 0; }
  `],
  template: `
    <div class="promos-page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <div class="page-eyebrow">Promotions</div>
          <h1 class="page-title">Codes Promo</h1>
          <p class="page-sub">Créez et gérez vos offres promotionnelles</p>
        </div>
        <button mat-flat-button class="new-btn" (click)="openCreate()">
          <mat-icon>add</mat-icon> Nouveau code
        </button>
      </div>

      <!-- Summary Cards -->
      <div class="summary-row">
        <div class="summary-card">
          <div class="sc-icon" style="background:#fdf0f3"><mat-icon style="color:#e8436c">local_offer</mat-icon></div>
          <div><div class="sc-label">Total codes</div><div class="sc-value">{{ promos.length }}</div></div>
        </div>
        <div class="summary-card">
          <div class="sc-icon" style="background:#d1fae5"><mat-icon style="color:#16a34a">check_circle</mat-icon></div>
          <div><div class="sc-label">Codes actifs</div><div class="sc-value">{{ activeCount }}</div></div>
        </div>
        <div class="summary-card">
          <div class="sc-icon" style="background:#fef8ec"><mat-icon style="color:#c9972b">bar_chart</mat-icon></div>
          <div><div class="sc-label">Utilisations totales</div><div class="sc-value">{{ totalUses }}</div></div>
        </div>
        <div class="summary-card">
          <div class="sc-icon" style="background:#f0f4fe"><mat-icon style="color:#4361ee">percent</mat-icon></div>
          <div><div class="sc-label">Réduction moy.</div><div class="sc-value">{{ avgDiscount }}%</div></div>
        </div>
      </div>

      <!-- Table -->
      <div class="table-card">
        <div class="table-toolbar">
          <div class="table-title">Liste des codes</div>
          <span class="table-count">{{ promos.length }} code(s)</span>
        </div>

        @if (loading) {
          <div class="loading-wrap"><mat-spinner diameter="36" color="warn"></mat-spinner></div>
        } @else if (promos.length === 0) {
          <div class="empty-state">
            <mat-icon class="empty-icon">local_offer</mat-icon>
            <div class="empty-title">Aucun code promo</div>
            <p class="empty-sub">Créez votre premier code pour offrir des réductions à vos utilisateurs</p>
            <button mat-flat-button class="new-btn" (click)="openCreate()">
              <mat-icon>add</mat-icon> Créer un code
            </button>
          </div>
        } @else {
          <div style="overflow-x:auto">
            <table mat-table [dataSource]="promos">

              <ng-container matColumnDef="code">
                <th mat-header-cell *matHeaderCellDef class="ps-table">Code</th>
                <td mat-cell *matCellDef="let p" class="ps-table">
                  <span class="code-chip">{{ p.code }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="discount">
                <th mat-header-cell *matHeaderCellDef>Réduction</th>
                <td mat-cell *matCellDef="let p">
                  <span class="badge-discount">{{ p.discountPct }}%</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="usage">
                <th mat-header-cell *matHeaderCellDef>Utilisation</th>
                <td mat-cell *matCellDef="let p">
                  <div class="usage-bar-wrap">
                    <div class="usage-bar">
                      <div class="usage-bar-fill"
                        [style.width.%]="p.maxUses ? (p.usedCount / p.maxUses * 100) : 30"></div>
                    </div>
                    <span class="usage-text">{{ p.usedCount }} / {{ p.maxUses ?? '∞' }}</span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="expires">
                <th mat-header-cell *matHeaderCellDef>Expire le</th>
                <td mat-cell *matCellDef="let p" style="color:#8b7d98;font-size:13px">
                  <span *ngIf="p.expiresAt">{{ p.expiresAt | date:'dd MMM yyyy' }}</span>
                  <span *ngIf="!p.expiresAt" style="color:#c4b8d0;font-style:italic">Jamais</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Statut</th>
                <td mat-cell *matCellDef="let p">
                  <span class="badge-active" [class.on]="p.active" [class.off]="!p.active">
                    <span class="dot" [class.on]="p.active" [class.off]="!p.active"></span>
                    {{ p.active ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let p">
                  <div class="actions-cell">
                    <button mat-icon-button class="action-btn" (click)="toggleActive(p)"
                      [matTooltip]="p.active ? 'Désactiver' : 'Activer'">
                      <mat-icon [style.color]="p.active ? '#e8436c' : '#16a34a'">
                        {{ p.active ? 'toggle_off' : 'toggle_on' }}
                      </mat-icon>
                    </button>
                    <button mat-icon-button class="action-btn" (click)="openEdit(p)" matTooltip="Modifier">
                      <mat-icon style="color:#4361ee;font-size:20px">edit</mat-icon>
                    </button>
                    <button mat-icon-button class="action-btn" (click)="deletePromo(p)" matTooltip="Supprimer">
                      <mat-icon style="color:#e8436c;font-size:20px">delete_outline</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;"></tr>
            </table>
          </div>
        }
      </div>

    </div>
  `,
})
export class AdminPromosComponent implements OnInit {
  promos: PromoCode[] = [];
  loading = true;
  columns = ['code', 'discount', 'usage', 'expires', 'status', 'actions'];
  private api = `${environment.apiUrl}/promo-codes`;

  get activeCount() { return this.promos.filter(p => p.active).length; }
  get totalUses() { return this.promos.reduce((s, p) => s + p.usedCount, 0); }
  get avgDiscount() {
    if (!this.promos.length) return 0;
    return Math.round(this.promos.reduce((s, p) => s + p.discountPct, 0) / this.promos.length);
  }

  constructor(private http: HttpClient, private snackBar: MatSnackBar, private dialog: MatDialog) {}

  ngOnInit(): void { this.loadPromos(); }

  loadPromos(): void {
    this.loading = true;
    this.http.get<ApiResponse<PromoCode[]>>(this.api).subscribe({
      next: (res) => { this.promos = res.data; this.loading = false; },
      error: () => { this.loading = false; this.snackBar.open('Erreur chargement.', 'Fermer', { duration: 3000 }); },
    });
  }

  openCreate(): void {
    this.dialog.open(PromoFormDialogComponent, { width: '480px', data: {}, panelClass: 'rounded-dialog' })
      .afterClosed().subscribe(payload => {
        if (!payload) return;
        this.http.post<ApiResponse<PromoCode>>(this.api, payload).subscribe({
          next: (res) => { this.promos = [...this.promos, res.data]; this.snackBar.open(`Code ${res.data.code} créé ✓`, 'OK', { duration: 3000 }); },
          error: (err) => this.snackBar.open(err?.error?.message ?? 'Erreur création.', 'Fermer', { duration: 4000 }),
        });
      });
  }

  openEdit(promo: PromoCode): void {
    this.dialog.open(PromoFormDialogComponent, { width: '480px', data: { promo }, panelClass: 'rounded-dialog' })
      .afterClosed().subscribe(payload => {
        if (!payload) return;
        this.http.put<ApiResponse<PromoCode>>(`${this.api}/${promo.id}/update`, payload).subscribe({
          next: (res) => { this.promos = this.promos.map(p => p.id === promo.id ? res.data : p); this.snackBar.open('Code modifié ✓', 'OK', { duration: 3000 }); },
          error: (err) => this.snackBar.open(err?.error?.message ?? 'Erreur.', 'Fermer', { duration: 4000 }),
        });
      });
  }

  toggleActive(promo: PromoCode): void {
    this.http.put<ApiResponse<PromoCode>>(`${this.api}/${promo.id}`, {}).subscribe({
      next: (res) => { this.promos = this.promos.map(p => p.id === promo.id ? res.data : p); this.snackBar.open(`Code ${res.data.active ? 'activé' : 'désactivé'}.`, 'OK', { duration: 2000 }); },
      error: () => this.snackBar.open('Erreur.', 'Fermer', { duration: 3000 }),
    });
  }

  deletePromo(promo: PromoCode): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Supprimer le code promo', message: `Voulez-vous supprimer le code "${promo.code}" ? Cette action est irréversible.`, confirmLabel: 'Supprimer' }
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.http.delete<ApiResponse<void>>(`${this.api}/${promo.id}`).subscribe({
        next: () => { this.promos = this.promos.filter(p => p.id !== promo.id); this.snackBar.open('Code supprimé.', 'OK', { duration: 3000 }); },
        error: () => this.snackBar.open('Erreur suppression.', 'Fermer', { duration: 3000 }),
      });
    });
  }
}