import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { HealthProfileResponse, SubscriptionResponse, SessionResponse } from '../../../core/models/health.models';
import { environment } from '../../../../environments/environment';
import { ConfirmDialogComponent } from '../../admin/admin-users.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule,
    MatTooltipModule,
  ],
  template: `
    <div class="container fade-in py-3 py-lg-4">
      <div class="row gx-3 align-items-center mb-4">
        <div class="col">
          <h3 class="mb-1">Mon Profil</h3>
          <p class="text-secondary small">Informations de votre compte MAMAAI</p>
        </div>
        <div class="col-auto">
          <button matButton="filled" routerLink="../health-profile">
            <mat-icon class="material-icons-outlined">favorite</mat-icon> Profil Santé
          </button>
        </div>
        <div class="col-auto">
          <button matButton="filled" routerLink="../subscription">
            <mat-icon class="material-icons-outlined">star</mat-icon> Abonnement
          </button>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="row gx-3 gx-lg-4">

        <!-- LEFT -->
        <div class="col-12 col-lg-4 mb-3">
          <mat-card class="overflow-hidden">
            <div class="w-100" style="background: linear-gradient(135deg, #f8a7c5, #e8c4e8); height: 110px;"></div>
            <mat-card-content class="pb-0">
              <div class="text-center mb-3">
                <div class="position-relative mb-3" style="margin-top:-56px">
                  <!-- Avatar -->
                  <div class="avatar-circle mx-auto d-flex align-items-center justify-content-center rounded-circle bg-white shadow"
                    style="width:100px;height:100px;border:3px solid #f8a7c5;overflow:hidden;cursor:pointer"
                    (click)="avatarUrl ? showZoom = true : null">
                    @if (avatarUrl) {
                      <img [src]="avatarUrl" alt="Avatar" style="width:100%;height:100%;object-fit:cover" />
                    } @else {
                      <mat-icon color="primary" style="font-size:52px;width:52px;height:52px">account_circle</mat-icon>
                    }
                  </div>

                  <!-- Zoom modal -->
                  @if (showZoom && avatarUrl) {
                    <div (click)="showZoom = false"
                      style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out">
                      <img [src]="avatarUrl" alt="Avatar"
                        style="max-width:90vw;max-height:90vh;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.5)" />
                    </div>
                  }
                  <!-- Spinner upload -->
                  @if (uploadingAvatar) {
                    <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:100px;height:100px;background:rgba(255,255,255,0.7);border-radius:50%;display:flex;align-items:center;justify-content:center">
                      <mat-spinner diameter="32"></mat-spinner>
                    </div>
                  }
                  <!-- Input fichier caché -->
                  <input #fileInput type="file" accept="image/*"
                    style="display:none" (change)="onFileSelected($event)" />
                </div>

                <h4 class="mb-0">{{ authService.currentUser()?.firstName }} {{ authService.currentUser()?.lastName }}</h4>

                <!-- Boutons photo -->
                <div class="d-flex justify-content-center gap-2 mt-2 mb-1">
                  <button matButton (click)="triggerFileInput()" [disabled]="uploadingAvatar" style="font-size:11px">
                    <mat-icon style="font-size:14px;width:14px;height:14px">folder_open</mat-icon>
                    Fichier
                  </button>
                  <button matButton color="primary" (click)="openCamera()" [disabled]="uploadingAvatar" style="font-size:11px">
                    <mat-icon style="font-size:14px;width:14px;height:14px">photo_camera</mat-icon>
                    Caméra
                  </button>
                </div>

                <!-- Modal caméra -->
                @if (showCamera) {
                  <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center">
                    <div style="background:white;border-radius:16px;padding:24px;max-width:480px;width:90%">
                      <h5 class="mb-3 text-center">📷 Prendre une photo</h5>
                      <video #videoEl autoplay playsinline
                        style="width:100%;border-radius:8px;background:#000"></video>
                      <canvas #canvasEl style="display:none"></canvas>
                      <div class="d-flex gap-2 mt-3 justify-content-center">
                        <button matButton (click)="closeCamera()">Annuler</button>
                        <button matButton="filled" color="primary" (click)="capturePhoto()">
                          <mat-icon>camera</mat-icon> Capturer
                        </button>
                      </div>
                    </div>
                  </div>
                }
                <p class="text-secondary small mt-1">
                  <span class="badge"
                    [class.bg-success]="authService.currentUser()?.role === 'USER'"
                    [class.bg-warning]="authService.currentUser()?.role === 'PARTNER'"
                    [class.bg-danger]="authService.currentUser()?.role === 'ADMIN'">
                    {{ authService.currentUser()?.role }}
                  </span>
                  &nbsp;·&nbsp;
                  <span [class.text-success]="authService.currentUser()?.isActive"
                        [class.text-danger]="!authService.currentUser()?.isActive">
                    {{ authService.currentUser()?.isActive ? 'Actif' : 'Inactif' }}
                  </span>
                </p>
              </div>

              <mat-divider></mat-divider>

              <div class="py-3">
                <div class="row gx-3 align-items-center mb-3">
                  <div class="col-auto"><mat-icon class="material-icons-outlined text-secondary">mail</mat-icon></div>
                  <div class="col">
                    <p class="text-secondary small mb-0">Email</p>
                    <p class="mb-0 small">{{ authService.currentUser()?.email }}</p>
                  </div>
                </div>
                <div class="row gx-3 align-items-center mb-3">
                  <div class="col-auto"><mat-icon class="material-icons-outlined text-secondary">login</mat-icon></div>
                  <div class="col">
                    <p class="text-secondary small mb-0">Connexion via</p>
                    <p class="mb-0 small">{{ authService.currentUser()?.provider }}</p>
                  </div>
                </div>
                <div class="row gx-3 align-items-center mb-3">
                  <div class="col-auto"><mat-icon class="material-icons-outlined text-secondary">event</mat-icon></div>
                  <div class="col">
                    <p class="text-secondary small mb-0">Membre depuis</p>
                    <p class="mb-0 small">{{ authService.currentUser()?.createdAt | date:'dd/MM/yyyy' }}</p>
                  </div>
                </div>
              </div>

              <mat-divider></mat-divider>
              <div class="py-3">
                <button matButton color="warn" class="w-100" (click)="confirmDeleteAccount()" [disabled]="deletingAccount">
                  <mat-icon class="material-icons-outlined">delete_forever</mat-icon>
                  {{ deletingAccount ? 'Suppression...' : 'Supprimer mon compte (RGPD)' }}
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- RIGHT -->
        <div class="col-12 col-lg-8">

          <!-- Health -->
          <mat-card class="mb-3">
            <mat-card-content class="p-4">
              <div class="row align-items-center mb-3">
                <div class="col"><h5 class="mb-0"><mat-icon color="primary" class="align-middle me-1">favorite</mat-icon>Profil Santé</h5></div>
                <div class="col-auto"><a matButton routerLink="../health-profile"><mat-icon class="material-icons-outlined">edit</mat-icon> Modifier</a></div>
              </div>
              @if (loadingHealth) {
                <div class="d-flex justify-content-center py-3"><mat-spinner diameter="28"></mat-spinner></div>
              } @else if (healthProfile) {
                <div class="row gx-3 gy-3">
                  <div class="col-6 col-md-3">
                    <div class="text-center p-3 rounded-3 bg-light">
                      <p class="text-secondary small mb-1">Âge</p><p class="fw-bold mb-0">{{ healthProfile.age }} ans</p>
                    </div>
                  </div>
                  <div class="col-6 col-md-3">
                    <div class="text-center p-3 rounded-3 bg-light">
                      <p class="text-secondary small mb-1">Poids</p><p class="fw-bold mb-0">{{ healthProfile.weightKg }} kg</p>
                    </div>
                  </div>
                  <div class="col-6 col-md-3">
                    <div class="text-center p-3 rounded-3 bg-light">
                      <p class="text-secondary small mb-1">Taille</p><p class="fw-bold mb-0">{{ healthProfile.heightCm }} cm</p>
                    </div>
                  </div>
                  <div class="col-6 col-md-3">
                    <div class="text-center p-3 rounded-3 bg-light">
                      <p class="text-secondary small mb-1">Groupe sanguin</p><p class="fw-bold mb-0">{{ healthProfile.bloodType ?? '—' }}</p>
                    </div>
                  </div>
                </div>
              } @else {
                <div class="text-center py-3 text-secondary">
                  <mat-icon class="mb-2">health_and_safety</mat-icon>
                  <p class="mb-0 small">Profil santé non renseigné.</p>
                  <a matButton color="primary" routerLink="../health-profile">Créer maintenant</a>
                </div>
              }
            </mat-card-content>
          </mat-card>

          <!-- Subscription -->
          <mat-card class="mb-3">
            <mat-card-content class="p-4">
              <div class="row align-items-center mb-3">
                <div class="col"><h5 class="mb-0"><mat-icon color="primary" class="align-middle me-1">star</mat-icon>Abonnement</h5></div>
                <div class="col-auto"><a matButton routerLink="../subscription"><mat-icon class="material-icons-outlined">manage_subscriptions</mat-icon> Gérer</a></div>
              </div>
              @if (loadingSub) {
                <div class="d-flex justify-content-center py-3"><mat-spinner diameter="28"></mat-spinner></div>
              } @else if (activeSub) {
                <div class="row align-items-center">
                  <div class="col">
                    <p class="fw-semibold mb-1">Plan {{ activeSub.plan }}</p>
                    <p class="text-secondary small mb-0">
                      Du {{ activeSub.startDate | date:'dd/MM/yyyy' }}
                      @if (activeSub.endDate) { au {{ activeSub.endDate | date:'dd/MM/yyyy' }} }
                      @else { · Sans limite }
                    </p>
                  </div>
                  <div class="col-auto">
                    <span class="badge"
                      [class.bg-success]="activeSub.status === 'ACTIVE'"
                      [class.bg-warning]="activeSub.status === 'PENDING'"
                      [class.bg-danger]="activeSub.status === 'CANCELLED' || activeSub.status === 'EXPIRED'">
                      {{ activeSub.status }}
                    </span>
                  </div>
                </div>
              } @else {
                <div class="text-center py-3 text-secondary">
                  <mat-icon class="mb-2">card_membership</mat-icon>
                  <p class="mb-0 small">Aucun abonnement actif.</p>
                  <a matButton color="primary" routerLink="../subscription">Voir les plans</a>
                </div>
              }
            </mat-card-content>
          </mat-card>

          <!-- Sessions — ADMIN uniquement -->
          @if (authService.currentUser()?.role === 'ADMIN') {
            <mat-card>
              <mat-card-content class="p-4">
                <h5 class="mb-3"><mat-icon color="primary" class="align-middle me-1">devices</mat-icon>Sessions actives</h5>
                @if (loadingSessions) {
                  <div class="d-flex justify-content-center py-3"><mat-spinner diameter="28"></mat-spinner></div>
                } @else if (sessions.length === 0) {
                  <div class="text-secondary text-center small py-2">Aucune session active.</div>
                } @else {
                  @for (s of sessions; track s.id; let i = $index) {
                    <div class="row align-items-center py-2" [class.border-top]="i > 0">
                      <div class="col-auto">
                        <mat-icon class="material-icons-outlined"
                          [class.text-primary]="s.current"
                          [class.text-secondary]="!s.current">computer</mat-icon>
                      </div>
                      <div class="col">
                        <p class="mb-0 small fw-semibold">
                          {{ s.deviceInfo | slice:0:55 }}{{ s.deviceInfo.length > 55 ? '…' : '' }}
                          @if (s.current) {
                            <span class="badge bg-success ms-1" style="font-size:10px">Session actuelle</span>
                          }
                        </p>
                        <p class="mb-0 small text-secondary">IP: {{ s.ip }} · Expire {{ s.expiresAt | date:'dd/MM HH:mm' }}</p>
                      </div>
                      <div class="col-auto">
                        <button matIconButton color="warn" (click)="revokeSession(s.id, s.current)" title="Révoquer">
                          <mat-icon>logout</mat-icon>
                        </button>
                      </div>
                    </div>
                  }
                }
              </mat-card-content>
            </mat-card>
          }

        </div>
      </div>
    </div>
  `,
})
export class MotherProfileComponent implements OnInit {
  @ViewChild('videoEl') videoEl!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl') canvasEl!: ElementRef<HTMLCanvasElement>;

  healthProfile: HealthProfileResponse | null = null;
  activeSub: SubscriptionResponse | null = null;
  sessions: SessionResponse[] = [];

  loadingHealth = true;
  loadingSub = true;
  loadingSessions = false;
  deletingAccount = false;
  uploadingAvatar = false;
  avatarUrl: string | null = null;
  showCamera = false;
  showZoom = false;
  private stream: MediaStream | null = null;

  constructor(
    public authService: AuthService,
    private userService: UserService,
    private subscriptionService: SubscriptionService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (!user) return;
    const userId = user.id;

    // Charger l'avatar depuis le user connecté (signal)
    this.avatarUrl = user.avatarUrl ?? null;

    // ✅ Recharger depuis la BDD pour avoir les données à jour (avatarUrl, createdAt, referralCode)
    this.http.get<any>(`${environment.apiUrl}/users/me`).subscribe({
      next: (res) => {
        if (res?.data) {
          this.avatarUrl = res.data.avatarUrl ?? null;
          this.authService.updateCurrentUser(res.data);
        }
      },
      error: () => {}
    });

    this.userService.getMyHealthProfile().subscribe({
      next: (res) => { this.healthProfile = res.data; this.loadingHealth = false; },
      error: () => { this.healthProfile = null; this.loadingHealth = false; },
    });

    this.subscriptionService.getActiveSubscription(userId).subscribe({
      next: (res) => { this.activeSub = res.data; this.loadingSub = false; },
      error: () => { this.activeSub = null; this.loadingSub = false; },
    });

    if (user.role === 'ADMIN') {
      this.loadingSessions = true;
      this.userService.getSessions(userId).subscribe({
        next: (res) => { this.sessions = res.data; this.loadingSessions = false; },
        error: () => { this.sessions = []; this.loadingSessions = false; },
      });
    }
  }

  triggerFileInput(): void {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    input?.click();
  }

  async openCamera(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.showCamera = true;
      setTimeout(() => {
        if (this.videoEl?.nativeElement) {
          this.videoEl.nativeElement.srcObject = this.stream;
        }
      }, 100);
    } catch (err) {
      this.snackBar.open('Impossible d\'accéder à la caméra.', 'Fermer', { duration: 3000 });
    }
  }

  capturePhoto(): void {
    const video = this.videoEl.nativeElement;
    const canvas = this.canvasEl.nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      this.closeCamera();
      this.uploadFile(file);
    }, 'image/jpeg', 0.9);
  }

  closeCamera(): void {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
    this.showCamera = false;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.uploadFile(input.files[0]);
  }

  private uploadFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Veuillez sélectionner une image.', 'Fermer', { duration: 3000 });
      return;
    }
    this.uploadingAvatar = true;
    const formData = new FormData();
    formData.append('file', file);

    this.http.post<any>(`${environment.apiUrl}/users/me/avatar`, formData).subscribe({
      next: (res) => {
        this.avatarUrl = res.data;
        const user = this.authService.currentUser();
        if (user) this.authService.updateCurrentUser({ ...user, avatarUrl: res.data });
        this.uploadingAvatar = false;
        this.snackBar.open('Photo de profil mise à jour ✓', 'OK', { duration: 3000 });
      },
      error: () => {
        this.uploadingAvatar = false;
        this.snackBar.open('Erreur lors de l\'upload.', 'Fermer', { duration: 3000 });
      },
    });
  }

  revokeSession(sessionId: number, isCurrent: boolean): void {
    const user = this.authService.currentUser();
    if (!user) return;

    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Révoquer la session',
        message: isCurrent
          ? 'Vous allez révoquer votre session actuelle. Vous serez déconnecté immédiatement.'
          : 'Cet appareil sera déconnecté immédiatement.',
        confirmLabel: 'Révoquer',
      }
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.userService.revokeSession(user.id, sessionId).subscribe({
        next: () => {
          if (isCurrent) {
            this.authService.logoutLocal();
          } else {
            this.sessions = this.sessions.filter((s) => s.id !== sessionId);
            this.snackBar.open('Session révoquée.', 'OK', { duration: 3000 });
          }
        },
        error: () => this.snackBar.open('Erreur lors de la révocation.', 'Fermer', { duration: 3000 }),
      });
    });
  }

  confirmDeleteAccount(): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        title: 'Supprimer mon compte',
        message: 'Cette action est irréversible. Toutes vos données seront supprimées définitivement (RGPD).',
        confirmLabel: 'Supprimer définitivement',
      }
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.deletingAccount = true;
      this.userService.deleteMyAccount().subscribe({
        next: () => this.authService.logoutLocal(),
        error: (err) => {
          this.deletingAccount = false;
          this.snackBar.open(err?.error?.message ?? 'Erreur lors de la suppression.', 'Fermer', { duration: 4000 });
        },
      });
    });
  }
}