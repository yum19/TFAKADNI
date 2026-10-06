import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { PlanConfigResponse, PlanConfigService } from '../../core/services/plan-config.service';
export { PlanConfigResponse as PlanConfig };

@Component({
  selector: 'app-admin-plans',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule,
    MatSnackBarModule, MatDividerModule, MatProgressSpinnerModule, MatTooltipModule,
  ],
  styles: [`

    :host {
      --rose: #e8436c;
      --rose-light: #fdf0f3;
      --rose-mid: #f9d0d8;
      --ink: #1a1028;
      --ink-soft: #3d2f4a;
      --muted: #8b7d98;
      --border: #ede8f2;
      --surface: #faf8fc;
      --white: #ffffff;
      --gold: #c9972b;
      --gold-light: #fef8ec;
      --shadow-sm: 0 2px 8px rgba(26,16,40,.06);
      --shadow-md: 0 8px 32px rgba(26,16,40,.10);
      --shadow-lg: 0 20px 60px rgba(26,16,40,.14);
      display: block;
    
      min-height: 100vh;
    }

    .plans-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2.5rem 2rem;
    }

    /* ── Header ── */
    .page-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      margin-bottom: 3rem;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .header-left {}
    .page-eyebrow {
      
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .18em;
      text-transform: uppercase;
      color: var(--rose);
      margin-bottom: .5rem;
    }
    .page-title {
      
      font-size: 2.2rem;
      font-weight: 800;
      color: var(--ink);
      line-height: 1.1;
      margin: 0 0 .4rem;
    }
    .page-sub {
      font-size: 15px;
      color: var(--muted);
      font-weight: 300;
      margin: 0;
    }
    .save-btn {
      
      font-weight: 700 !important;
      font-size: 14px !important;
      padding: 0 2rem !important;
      height: 48px !important;
      background: var(--ink) !important;
      color: #fff !important;
      border-radius: 12px !important;
      letter-spacing: .04em;
      display: flex !important;
      align-items: center !important;
      gap: .5rem !important;
      transition: all .2s !important;
      box-shadow: var(--shadow-md) !important;
    }
    .save-btn:hover:not([disabled]) {
      background: var(--rose) !important;
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(232,67,108,.3) !important;
    }
    .save-btn[disabled] { opacity: .5 !important; }

    /* ── Stats Strip ── */
    .stats-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2.5rem;
    }
    .stat-tile {
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: var(--shadow-sm);
      transition: box-shadow .2s, transform .2s;
    }
    .stat-tile:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .stat-icon {
      width: 44px; height: 44px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .stat-icon mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .stat-label { font-size: 12px; color: var(--muted); font-weight: 400; }
    .stat-value {  font-size: 1.5rem; font-weight: 700; color: var(--ink); line-height: 1.1; }

    /* ── Plan Cards ── */
    .plans-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }
    @media (max-width: 900px) { .plans-grid { grid-template-columns: 1fr; } }
    @media (max-width: 1100px) { .plans-grid { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); } }

    .plan-card {
      background: var(--white);
      border-radius: 24px;
      border: 1.5px solid var(--border);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
      transition: box-shadow .25s, transform .25s;
      position: relative;
      display: flex;
      flex-direction: column;
    }
    .plan-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-4px); }

    .plan-card.featured {
      border-color: var(--rose);
      box-shadow: 0 0 0 1px var(--rose), var(--shadow-md);
    }
    .plan-card.featured:hover { box-shadow: 0 0 0 1px var(--rose), var(--shadow-lg); }

    .plan-badge {
      position: absolute;
      top: 1rem; right: 1rem;
      background: var(--rose);
      color: #fff;
      
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .12em;
      text-transform: uppercase;
      padding: 3px 10px;
      border-radius: 20px;
    }

    .plan-header {
      padding: 1.75rem 1.75rem 0;
    }
    .plan-icon-wrap {
      width: 52px; height: 52px;
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 1rem;
    }
    .plan-icon-wrap mat-icon { font-size: 28px; width: 28px; height: 28px; }
    .plan-key-badge {
      display: inline-block;
      font-size: 11px;
      
      font-weight: 700;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: .4rem;
    }

    .plan-body { padding: 0 1.75rem 1.75rem; flex: 1; display: flex; flex-direction: column; }

    .plan-name-field { margin-top: 1rem; margin-bottom: 1rem; }
    .plan-name-field mat-form-field { width: 100%; }

    .price-row { display: flex; align-items: center; gap: .5rem; margin-bottom: .25rem; }
    .price-field { flex: 1; }
    .price-field mat-form-field { width: 100%; }

    .features-section { margin-top: 1.25rem; flex: 1; }
    .features-label {
      font-size: 11px;
      
      font-weight: 700;
      letter-spacing: .12em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: .75rem;
    }
    .feature-row {
      display: flex;
      align-items: center;
      gap: .5rem;
      margin-bottom: .5rem;
    }
    .feature-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--rose);
      flex-shrink: 0;
    }
    .feature-row mat-form-field { flex: 1; font-size: 13px; }
    .feature-row button { flex-shrink: 0; }
    .add-feature-btn {
      width: 100%;
      margin-top: .5rem;
      border: 1.5px dashed var(--border) !important;
      border-radius: 10px !important;
      color: var(--muted) !important;
      font-size: 13px !important;
      padding: .5rem !important;
      transition: all .2s !important;
    }
    .add-feature-btn:hover {
      border-color: var(--rose) !important;
      color: var(--rose) !important;
      background: var(--rose-light) !important;
    }

    /* ── Mat overrides ── */
    ::ng-deep .plans-page .mat-mdc-form-field-subscript-wrapper { display: none !important; }
    ::ng-deep .plans-page .mat-mdc-text-field-wrapper { border-radius: 10px !important; }

    /* ── Loading ── */
    .loading-wrap {
      display: flex; justify-content: center; align-items: center;
      padding: 6rem 0;
    }

    /* ── Stats strip responsive ── */
    @media (max-width: 768px) {
      .stats-strip { grid-template-columns: repeat(2, 1fr); }
      .page-title { font-size: 1.6rem; }
    }
  `],
  template: `
    <div class="plans-page">

      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="page-eyebrow">Abonnements</div>
          <h1 class="page-title">Gestion des Plans</h1>
          <p class="page-sub">Personnalisez les offres présentées aux utilisateurs</p>
        </div>
        <button class="save-btn" mat-flat-button (click)="saveAll()" [disabled]="!form || form.invalid || saving">
          <mat-spinner *ngIf="saving" diameter="16"></mat-spinner>
          <mat-icon *ngIf="!saving">save</mat-icon>
          {{ saving ? 'Enregistrement...' : 'Sauvegarder tout' }}
        </button>
      </div>

      <!-- Stats Strip -->
      <div class="stats-strip">
        <div class="stat-tile">
          <div class="stat-icon" style="background:#fdf0f3">
            <mat-icon style="color:#e8436c">layers</mat-icon>
          </div>
          <div>
            <div class="stat-label">Plans actifs</div>
            <div class="stat-value">3</div>
          </div>
        </div>
        <div class="stat-tile">
          <div class="stat-icon" style="background:#f0fdf4">
            <mat-icon style="color:#16a34a">people</mat-icon>
          </div>
          <div>
            <div class="stat-label">Abonnés totaux</div>
            <div class="stat-value">1,248</div>
          </div>
        </div>
        <div class="stat-tile">
          <div class="stat-icon" style="background:#fef8ec">
            <mat-icon style="color:#c9972b">trending_up</mat-icon>
          </div>
          <div>
            <div class="stat-label">MRR estimé</div>
            <div class="stat-value">18.4k</div>
          </div>
        </div>
        <div class="stat-tile">
          <div class="stat-icon" style="background:#f0f4fe">
            <mat-icon style="color:#4361ee">star</mat-icon>
          </div>
          <div>
            <div class="stat-label">Plan populaire</div>
            <div class="stat-value" style="font-size:1rem">Premium</div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      @if (loading) {
        <div class="loading-wrap">
          <mat-spinner diameter="40" color="warn"></mat-spinner>
        </div>
      } @else {
        <form [formGroup]="form">
          <div class="plans-grid" formArrayName="plans">
            @for (plan of plansArray.controls; track $index; let i = $index) {
              <div class="plan-card" [class.featured]="i === 1" [formGroupName]="i">

                @if (i === 1) { <div class="plan-badge">⭐ Populaire</div> }

                <div class="plan-header">
                  <div class="plan-icon-wrap"
                    [style.background]="i === 0 ? '#f0f4fe' : i === 1 ? '#fdf0f3' : '#f0fdf4'">
                    <mat-icon [style.color]="i === 0 ? '#4361ee' : i === 1 ? '#e8436c' : '#16a34a'">
                      {{ plan.get('icon')?.value || (i === 0 ? 'spa' : i === 1 ? 'favorite' : 'diamond') }}
                    </mat-icon>
                  </div>
                  <span class="plan-key-badge">{{ plan.get('planKey')?.value }}</span>
                </div>

                <div class="plan-body">
                  <div class="plan-name-field">
                    <mat-form-field appearance="outline">
                      <mat-label>Nom du plan</mat-label>
                      <input matInput formControlName="label" />
                    </mat-form-field>
                  </div>

                  <div class="price-row">
                    <div class="price-field">
                      <mat-form-field appearance="outline">
                        <mat-label>Prix affiché</mat-label>
                        <input matInput formControlName="price" placeholder="Ex: 29 TND/mois" />
                        <mat-icon matSuffix style="font-size:18px;color:var(--muted)">sell</mat-icon>
                      </mat-form-field>
                    </div>
                  </div>

                  <div class="features-section">
                    <div class="features-label">Fonctionnalités incluses</div>
                    <div formArrayName="features">
                      @for (feat of getFeaturesArray(i).controls; track $index; let j = $index) {
                        <div class="feature-row">
                          <div class="feature-dot"></div>
                          <mat-form-field appearance="outline" style="font-size:13px">
                            <input matInput [formControlName]="j" placeholder="Fonctionnalité..." />
                          </mat-form-field>
                          <button mat-icon-button color="warn" type="button"
                            (click)="removeFeature(i, j)"
                            [disabled]="getFeaturesArray(i).length <= 1"
                            matTooltip="Retirer">
                            <mat-icon style="font-size:18px">remove_circle_outline</mat-icon>
                          </button>
                        </div>
                      }
                    </div>
                    <button mat-button type="button" class="add-feature-btn" (click)="addFeature(i)">
                      <mat-icon style="font-size:16px;vertical-align:middle">add</mat-icon>
                      Ajouter une fonctionnalité
                    </button>
                  </div>
                </div>

              </div>
            }
          </div>
        </form>
      }

    </div>
  `,
})
export class AdminPlansComponent implements OnInit {
  form!: FormGroup;
  loading = true;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private planService: PlanConfigService,
    private snackBar: MatSnackBar
  ) {}

  get plansArray(): FormArray { return this.form.get('plans') as FormArray; }

  getFeaturesArray(i: number): FormArray {
    return this.plansArray.at(i).get('features') as FormArray;
  }

  ngOnInit(): void {
    this.planService.getAll().subscribe({
      next: (res) => { this.buildForm(res.data); this.loading = false; },
      error: () => { this.loading = false; this.snackBar.open('Erreur chargement des plans.', 'Fermer', { duration: 3000 }); },
    });
  }

  buildForm(plans: PlanConfigResponse[]): void {
    this.form = this.fb.group({
      plans: this.fb.array(
        plans.map(p =>
          this.fb.group({
            planKey: [p.planKey],
            label: [p.label, Validators.required],
            price: [p.price, Validators.required],
            icon: [p.icon],
            features: this.fb.array(p.features.map(f => this.fb.control(f, Validators.required))),
          })
        )
      ),
    });
  }

  addFeature(i: number): void { this.getFeaturesArray(i).push(this.fb.control('', Validators.required)); }
  removeFeature(i: number, j: number): void { this.getFeaturesArray(i).removeAt(j); }

  saveAll(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const plans = this.plansArray.controls;
    let completed = 0;
    plans.forEach(ctrl => {
      const key = ctrl.get('planKey')?.value;
      const payload = {
        label: ctrl.get('label')?.value,
        price: ctrl.get('price')?.value,
        icon: ctrl.get('icon')?.value,
        features: (ctrl.get('features') as FormArray).controls.map(f => f.value),
      };
      this.planService.update(key, payload).subscribe({
        next: () => {
          completed++;
          if (completed === plans.length) {
            this.saving = false;
            this.snackBar.open('Plans mis à jour avec succès ✓', 'OK', { duration: 3000 });
          }
        },
        error: () => { this.saving = false; this.snackBar.open('Erreur mise à jour.', 'Fermer', { duration: 4000 }); },
      });
    });
  }
}