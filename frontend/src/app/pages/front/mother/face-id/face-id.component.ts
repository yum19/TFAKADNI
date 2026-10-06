import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { FaceIdService } from '../../../../core/services/face-id.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-face-id',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatSlideToggleModule,
    MatSnackBarModule, MatProgressSpinnerModule, RouterModule,
  ],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

    :root {
      --rose:        #c94d6a;
      --rose-light:  #f5c6d0;
      --peach:       #d97b58;
      --gold:        #a8722e;
      --cream:       #f7ede4;
      --text-dark:   #1e1215;
      --text-mid:    #4a3038;
      --text-soft:   #7a5c65;
      --font-display: 'Cormorant Garamond', Georgia, serif;
      --font-body:    'DM Sans', sans-serif;
    }

    :host { display: block; font-family: var(--font-body); }

    .page {
      min-height: 100vh; position: relative;
    }
    .page::before {
      content: '';
      position: fixed; inset: 0;
      background-image: url('/assets/img/mother_pages_background-3.png');
      background-size: cover; background-position: center; z-index: -1;
    }
    .page::after {
      content: '';
      position: fixed; inset: 0;
      background: rgba(247,237,228,0.85); z-index: -1;
    }

    .wrap {
      position: relative; z-index: 1;
      max-width: 1400px; margin: 0 auto;
      padding: 3rem 1.5rem 5rem;
    }

    /* ── HEADER ── */
    .page-header { margin-bottom: 2rem; }
    .header-badge {
      display: inline-block;
      font-size: 0.72rem; font-weight: 600;
      letter-spacing: 0.12em; text-transform: uppercase;
      color: var(--rose); background: var(--rose-light);
      padding: 4px 14px; border-radius: 20px;
      border: 1.5px solid rgba(201,77,106,0.25);
      margin-bottom: 10px;
    }
    .page-title {
      font-family: var(--font-display);
      font-size: clamp(1.8rem, 3vw, 2.4rem);
      font-weight: 700; color: var(--text-dark);
      line-height: 1.2; margin-bottom: 6px;
    }
    .page-title em { font-style: italic; color: var(--rose); }
    .page-sub { font-size: 0.88rem; color: var(--text-soft); line-height: 1.6; }

    /* ── STATUS CARD ── */
    .status-card {
      border-radius: 24px; overflow: hidden;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 32px rgba(30,18,21,0.12);
      animation: cardIn 0.5s ease both;
    }
    @keyframes cardIn {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .status-card-header {
      background: linear-gradient(150deg, #1e1215 0%, #3d1a28 60%, #5c2038 100%);
      padding: 2.5rem 2rem;
      display: flex; align-items: center;
      gap: 1.5rem; position: relative; overflow: hidden;
    }
    .status-card-header::before {
      content: '';
      position: absolute; top: -40px; right: -40px;
      width: 200px; height: 200px; border-radius: 50%;
      background: rgba(201,77,106,0.12);
    }
    .face-scan-ring {
      width: 80px; height: 80px; border-radius: 50%;
      border: 2px solid rgba(201,77,106,0.5);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; position: relative; z-index: 1;
      background: rgba(255,255,255,0.06);
    }
    .face-scan-ring::before {
      content: '';
      position: absolute; inset: -6px;
      border-radius: 50%;
      border: 1px dashed rgba(201,77,106,0.3);
      animation: spin 8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .face-scan-icon { font-size: 36px; position: relative; z-index: 1; }
    .status-info { flex: 1; position: relative; z-index: 1; }
    .status-title {
      font-family: var(--font-display);
      font-size: 1.5rem; font-weight: 700; color: white;
      margin-bottom: 4px;
    }
    .status-sub { font-size: 0.82rem; color: rgba(255,255,255,0.55); margin-bottom: 12px; }
    .status-badge {
      display: inline-flex; align-items: center; gap: 7px;
      border-radius: 20px; padding: 5px 14px;
      font-size: 0.72rem; font-weight: 600;
    }
    .status-badge.active {
      background: rgba(16,185,129,0.2);
      border: 1px solid rgba(16,185,129,0.4);
      color: #6ee7b7;
    }
    .status-badge.inactive {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.15);
      color: rgba(255,255,255,0.5);
    }
    .badge-dot {
      width: 6px; height: 6px; border-radius: 50%;
    }
    .badge-dot.green { background: #10b981; }
    .badge-dot.gray  { background: rgba(255,255,255,0.35); }

    /* Toggle inside status card */
    .status-card-body {
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(12px);
      padding: 1.5rem 2rem;
      display: flex; align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(201,77,106,0.1);
    }
    .toggle-label { font-size: 0.95rem; font-weight: 600; color: var(--text-dark); }
    .toggle-sub   { font-size: 0.78rem; color: var(--text-soft); margin-top: 2px; }

    /* ── MAIN CARD ── */
    .main-card {
      background: rgba(255,255,255,0.88);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255,255,255,0.75);
      border-radius: 24px; overflow: hidden;
      box-shadow: 0 2px 16px rgba(30,18,21,0.08);
      margin-bottom: 1.5rem;
    }
    .main-card-inner { padding: 1.75rem 2rem; }
    .section-label {
      font-size: 0.65rem; font-weight: 700;
      letter-spacing: 0.12em; text-transform: uppercase;
      color: var(--rose); margin-bottom: 1.25rem;
      display: flex; align-items: center; gap: 8px;
    }
    .section-label::after {
      content: '';
      flex: 1; height: 1px;
      background: linear-gradient(90deg, rgba(201,77,106,0.25), transparent);
    }

    /* Registered photo */
    .photo-showcase {
      display: flex; align-items: center; gap: 1.25rem;
      padding: 1.25rem;
      background: var(--cream);
      border-radius: 16px;
      border: 1px solid rgba(201,77,106,0.12);
      margin-bottom: 1.25rem;
    }
    .photo-avatar {
      width: 76px; height: 76px; border-radius: 50%;
      border: 3px solid var(--rose);
      overflow: hidden; flex-shrink: 0;
      position: relative;
    }
    .photo-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .photo-verified {
      position: absolute; bottom: 2px; right: 2px;
      width: 22px; height: 22px; border-radius: 50%;
      background: #10b981; border: 2px solid white;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px;
    }
    .photo-placeholder {
      width: 76px; height: 76px; border-radius: 50%;
      border: 2px dashed rgba(201,77,106,0.3);
      background: rgba(201,77,106,0.05);
      display: flex; align-items: center; justify-content: center;
      font-size: 32px; flex-shrink: 0;
    }
    .photo-info-title { font-size: 0.95rem; font-weight: 600; color: var(--text-dark); }
    .photo-info-sub   { font-size: 0.78rem; color: var(--text-soft); margin-top: 3px; }

    /* Camera view */
   .camera-container {
  background: var(--text-dark);
  border-radius: 16px; overflow: hidden;
  margin: 0 auto 1.25rem;
  position: relative;
  width: 300px;
  height: 300px;
}
.camera-video {
  width: 100%; height: 100%;
  display: block;
  transform: scaleX(-1);
  object-fit: cover;
}
.camera-overlay-frame {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -52%);
  width: 180px; height: 220px;
  border: 2.5px solid rgba(201,77,106,0.9);
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  pointer-events: none;
}
.camera-hint {
  position: absolute; bottom: 12px; left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.5);
  color: rgba(255,255,255,0.8);
  font-size: 0.72rem; padding: 4px 14px;
  border-radius: 20px; white-space: nowrap;
}
    /* Preview */
    .preview-photo {
      width: 130px; height: 130px; border-radius: 50%;
      object-fit: cover;
      border: 3px solid var(--rose);
      display: block; margin: 0 auto 12px;
      box-shadow: 0 4px 24px rgba(201,77,106,0.25);
    }

    /* Password step */
    .pwd-security-banner {
      background: linear-gradient(135deg, #fff0f5, #fce4ec);
      border: 1.5px solid rgba(201,77,106,0.2);
      border-radius: 12px; padding: 14px 16px;
      margin-bottom: 1.25rem;
      display: flex; align-items: flex-start; gap: 10px;
    }
    .pwd-security-icon { font-size: 20px; flex-shrink: 0; }
    .pwd-security-text { font-size: 0.82rem; color: var(--text-mid); line-height: 1.5; }
    .pwd-error {
      background: #fff5f5; border: 1px solid #fca5a5;
      border-radius: 10px; padding: 10px 14px;
      color: #991b1b; font-size: 0.82rem;
      margin-bottom: 1rem;
      display: flex; align-items: center; gap: 8px;
    }
    .pwd-input-wrap {
      position: relative; margin-bottom: 1.25rem;
    }
    .pwd-input {
      width: 100%; padding: 13px 44px 13px 14px;
      border-radius: 12px;
      border: 1.5px solid rgba(201,77,106,0.2);
      background: var(--cream);
      color: var(--text-dark); font-size: 0.9rem;
      font-family: var(--font-body); outline: none;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }
    .pwd-input:focus { border-color: var(--rose); background: white; }
    .pwd-eye {
      position: absolute; right: 12px; top: 50%;
      transform: translateY(-50%);
      background: none; border: none; cursor: pointer;
      color: var(--text-soft); font-size: 18px; padding: 4px;
    }

    /* Buttons */
    .btn-primary {
      width: 100%; padding: 13px; border-radius: 12px; border: none;
      background: linear-gradient(135deg, #e8436c, #c94d6a);
      color: white; font-size: 0.9rem; font-weight: 600;
      font-family: var(--font-body);
      cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      margin-bottom: 8px;
      box-shadow: 0 3px 12px rgba(201,77,106,0.3);
    }
    .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 5px 20px rgba(201,77,106,0.4); }
    .btn-primary:disabled { opacity: 0.5; cursor: default; }

    .btn-secondary {
      width: 100%; padding: 13px; border-radius: 12px;
      border: 1.5px solid rgba(201,77,106,0.2);
      background: var(--cream);
      color: var(--text-mid); font-size: 0.9rem; font-weight: 600;
      font-family: var(--font-body);
      cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      margin-bottom: 8px;
    }
    .btn-secondary:hover { border-color: var(--rose); color: var(--rose); }

    .btn-danger {
      width: 100%; padding: 12px; border-radius: 12px; border: none;
      background: transparent;
      color: var(--rose); font-size: 0.85rem; font-weight: 600;
      font-family: var(--font-body);
      cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .btn-danger:hover { background: #fff0f5; }
    .btn-danger:disabled { opacity: 0.5; }

    .btn-row { display: flex; gap: 8px; }
    .btn-row .btn-primary  { flex: 1; margin-bottom: 0; }
    .btn-row .btn-secondary { flex: 1; margin-bottom: 0; }

    /* Tips */
    .tips-card {
      background: rgba(255,255,255,0.7);
      backdrop-filter: blur(8px);
      border: 1.5px solid rgba(201,77,106,0.12);
      border-radius: 20px; padding: 1.5rem;
    }
    .tips-title {
      font-family: var(--font-display);
      font-size: 1.05rem; font-weight: 700;
      color: var(--text-dark); margin-bottom: 1rem;
    }
    .tip-row {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid rgba(201,77,106,0.08);
    }
    .tip-row:last-child { border: none; padding-bottom: 0; }
    .tip-icon-wrap {
      width: 38px; height: 38px; border-radius: 12px; flex-shrink: 0;
      background: var(--cream);
      border: 1px solid rgba(201,77,106,0.15);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
    }
    .tip-title { font-size: 0.85rem; font-weight: 600; color: var(--text-dark); margin-bottom: 2px; }
    .tip-desc  { font-size: 0.78rem; color: var(--text-soft); line-height: 1.5; }

    @media (max-width: 500px) {
      .wrap { padding: 1.5rem 1rem 3rem; }
      .status-card-header { flex-direction: column; align-items: flex-start; }
    }
  `],
  template: `
    <div class="page">
      <div class="wrap">

        <!-- Header -->
        <div class="page-header">
          <div class="header-badge">🔒 Sécurité Biométrique</div>
          <h1 class="page-title">Connexion<br /><em>Face ID</em></h1>
          <p class="page-sub">Activez la reconnaissance faciale pour vous connecter instantanément et en toute sécurité.</p>
        </div>

        <!-- Status card -->
        <div class="status-card">
          <div class="status-card-header">
            <div class="face-scan-ring">
              <span class="face-scan-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path d="M7 3H5C3.9 3 3 3.9 3 5V7" stroke="#e8436c" stroke-width="1.8" stroke-linecap="round"/>
                  <path d="M17 3H19C20.1 3 21 3.9 21 5V7" stroke="#e8436c" stroke-width="1.8" stroke-linecap="round"/>
                  <path d="M7 21H5C3.9 21 3 20.1 3 19V17" stroke="#e8436c" stroke-width="1.8" stroke-linecap="round"/>
                  <path d="M17 21H19C20.1 21 21 20.1 21 19V17" stroke="#e8436c" stroke-width="1.8" stroke-linecap="round"/>
                  <circle cx="9" cy="10" r="1.2" fill="#e8436c"/>
                  <circle cx="15" cy="10" r="1.2" fill="#e8436c"/>
                  <path d="M9 15s1 1.8 3 1.8 3-1.8 3-1.8" stroke="#e8436c" stroke-width="1.5" stroke-linecap="round"/>
                  <path d="M12 7v2" stroke="#e8436c" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </span>
            </div>
            <div class="status-info">
              <div class="status-title">Face ID</div>
              <div class="status-sub">Reconnaissance faciale sécurisée · Chiffrement AES-256</div>
              @if (enabled && facePhoto) {
                <div class="status-badge active">
                  <div class="badge-dot green"></div>
                  Activé · Données sécurisées
                </div>
              } @else {
                <div class="status-badge inactive">
                  <div class="badge-dot gray"></div>
                  Non configuré
                </div>
              }
            </div>
          </div>
          <div class="status-card-body">
            <div>
              <div class="toggle-label">Connexion Face ID</div>
              <div class="toggle-sub">{{ enabled && facePhoto ? 'Authentification sans mot de passe activée' : 'Enregistrez votre visage pour activer' }}</div>
            </div>
            <mat-slide-toggle
              [checked]="enabled"
              [disabled]="!facePhoto || saving"
              (change)="toggleFaceId($event.checked)"
              color="warn">
            </mat-slide-toggle>
          </div>
        </div>

        <!-- Loading -->
        @if (pageLoading) {
          <div style="text-align:center;padding:3rem;color:var(--text-soft)">
            <mat-spinner diameter="40" style="margin:0 auto 1rem"></mat-spinner>
            <p style="font-size:0.88rem">Chargement de votre configuration...</p>
          </div>
        }

        @if (!pageLoading) {

          <div class="main-card">
            <div class="main-card-inner">
              <div class="section-label">Visage enregistré</div>

              <!-- Camera mode -->
              @if (showCamera) {
                <div style="text-align:center">
                  <div class="camera-container">
                    <video #videoRef autoplay playsinline muted class="camera-video"></video>
                    <div class="camera-overlay-frame"></div>
                    <div class="camera-hint">Centrez votre visage dans le cadre</div>
                  </div>
                  <div class="btn-row" style="margin-top:0">
                    <button class="btn-primary" (click)="capturePhoto()">
                      📸 Capturer
                    </button>
                    <button class="btn-secondary" (click)="closeCamera()">Annuler</button>
                  </div>
                </div>
              }

              <!-- Preview -->
              @if (showPreview && previewPhoto) {
                <div style="text-align:center;padding:1rem 0">
                  <img [src]="previewPhoto" class="preview-photo" alt="Aperçu" />
                  <p style="font-size:0.85rem;color:var(--text-soft);margin-bottom:1.25rem">
                    Votre visage est bien visible et bien éclairé ?
                  </p>
                  <div class="btn-row">
                    <button class="btn-primary" (click)="goToPassword()">✅ Valider</button>
                    <button class="btn-secondary" (click)="retakePhoto()">🔄 Reprendre</button>
                  </div>
                </div>
              }

              <!-- Password confirmation -->
              @if (showPasswordStep) {
                <div>
                  <div class="pwd-security-banner">
                    <span class="pwd-security-icon">🔐</span>
                    <div class="pwd-security-text">
                      <strong style="color:var(--text-dark)">Confirmez votre identité</strong><br/>
                      Entrez votre mot de passe pour sécuriser la configuration Face ID. Vos données sont chiffrées en base.
                    </div>
                  </div>
                  @if (pwdError) {
                    <div class="pwd-error">⚠️ {{ pwdError }}</div>
                  }
                  @if (isGoogleUser) {
                    <p style="font-size:0.85rem;color:var(--text-soft);text-align:center;margin-bottom:1.25rem">
                      Compte Google — aucun mot de passe requis 🎉
                    </p>
                  } @else {
                    <div class="pwd-input-wrap">
                      <input class="pwd-input" [(ngModel)]="enteredPassword"
                             [type]="showPwd ? 'text' : 'password'"
                             placeholder="Votre mot de passe actuel..." />
                      <button class="pwd-eye" type="button" (click)="showPwd = !showPwd">
                        {{ showPwd ? '🙈' : '👁️' }}
                      </button>
                    </div>
                  }
                  <div class="btn-row">
                    <button class="btn-primary"
                            [disabled]="(!isGoogleUser && enteredPassword.length < 4) || saving"
                            (click)="confirmSetup()">
                      @if (saving) { <mat-spinner diameter="16" style="--mdc-circular-progress-active-indicator-color:white"></mat-spinner> }
                      {{ saving ? 'Activation...' : '🔓 Activer Face ID' }}
                    </button>
                    <button class="btn-secondary" (click)="cancelPasswordStep()">Annuler</button>
                  </div>
                </div>
              }

              <!-- Default: photo registered or empty -->
              @if (!showCamera && !showPreview && !showPasswordStep) {
                @if (facePhoto) {
                  <div class="photo-showcase">
                    <div class="photo-avatar">
                      <img [src]="facePhoto" alt="Visage" />
                      <div class="photo-verified">✓</div>
                    </div>
                    <div>
                      <div class="photo-info-title">Visage vérifié ✅</div>
                      <div class="photo-info-sub">🔒 Stocké de manière sécurisée</div>
                      <div class="photo-info-sub" style="margin-top:2px">🛡️ Chiffrement AES-256</div>
                    </div>
                  </div>
                } @else {
                  <div style="text-align:center;padding:2rem 0 1.5rem">
                    <div class="photo-placeholder" style="width:80px;height:80px;margin:0 auto 12px;font-size:36px">
                      👤
                    </div>
                    <p style="font-size:0.85rem;color:var(--text-soft)">Aucun visage enregistré</p>
                  </div>
                }

                <button class="btn-primary" (click)="openCamera()">
                  📸 {{ facePhoto ? 'Mettre à jour la photo' : 'Prendre une photo' }}
                </button>
                <button class="btn-secondary" (click)="fileInput.click()">
                  📤 Importer depuis la galerie
                </button>
                <input #fileInput type="file" accept="image/*" style="display:none" (change)="onFileSelected($event)" />
                @if (facePhoto) {
                  <button class="btn-danger" (click)="deleteFaceId()" [disabled]="saving">
                    🗑️ Supprimer Face ID
                  </button>
                }
              }

            </div>
          </div>

          <!-- Tips -->
          <div class="tips-card">
            <div class="tips-title">💡 Pour de meilleurs résultats</div>
            <div class="tip-row">
              <div class="tip-icon-wrap">☀️</div>
              <div>
                <div class="tip-title">Bonne luminosité</div>
                <div class="tip-desc">Placez-vous face à une source de lumière naturelle ou dans une pièce bien éclairée.</div>
              </div>
            </div>
            <div class="tip-row">
              <div class="tip-icon-wrap">😐</div>
              <div>
                <div class="tip-title">Expression neutre</div>
                <div class="tip-desc">Regards direct vers la caméra, sans lunettes de soleil ni chapeau.</div>
              </div>
            </div>
            <div class="tip-row">
              <div class="tip-icon-wrap">🔒</div>
              <div>
                <div class="tip-title">Sécurité garantie</div>
                <div class="tip-desc">Vos données biométriques sont chiffrées et ne sont jamais partagées.</div>
              </div>
            </div>
          </div>

        }
      </div>
    </div>
  `,
})
export class FaceIdComponent implements OnInit, OnDestroy {
  @ViewChild('videoRef') videoRef!: ElementRef<HTMLVideoElement>;

  facePhoto: string | null = null;
  enabled      = false;
  pageLoading  = true;
  saving       = false;

  showCamera       = false;
  showPreview      = false;
  previewPhoto: string | null = null;
  showPasswordStep = false;
  enteredPassword  = '';
  showPwd          = false;
  pwdError         = '';
  pendingPhoto: string | null = null;

  private stream: MediaStream | null = null;

  constructor(
    public faceIdService: FaceIdService,
    public authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  get isGoogleUser(): boolean {
    return this.authService.currentUser()?.provider === 'GOOGLE';
  }

  async ngOnInit(): Promise<void> {
    await this.faceIdService.loadFromServer();
    this.facePhoto  = this.faceIdService.getPhoto();
    this.enabled    = this.faceIdService.isEnabled();
    this.pageLoading = false;
    const email = this.authService.currentUser()?.email;
    if (email && this.facePhoto) localStorage.setItem('faceid_hint_email', email);
    this.faceIdService.preloadModels();
  }

  async openCamera(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 640 } });
      this.showCamera = true; this.showPreview = false;
      setTimeout(() => { if (this.videoRef?.nativeElement) this.videoRef.nativeElement.srcObject = this.stream; }, 150);
    } catch {
      this.snackBar.open('Impossible d\'accéder à la caméra.', 'Fermer', { duration: 3000 });
    }
  }

  capturePhoto(): void {
    const v = this.videoRef?.nativeElement;
    if (!v) return;
    const size = Math.min(v.videoWidth, v.videoHeight);
    const c = document.createElement('canvas'); c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    ctx.translate(size, 0); ctx.scale(-1, 1);
    ctx.drawImage(v, (v.videoWidth-size)/2, (v.videoHeight-size)/2, size, size, 0, 0, size, size);
    this.previewPhoto = c.toDataURL('image/jpeg', 0.9);
    this.closeCamera(); this.showPreview = true;
  }

  closeCamera(): void { this.stream?.getTracks().forEach(t => t.stop()); this.stream = null; this.showCamera = false; }
  goToPassword(): void { this.pendingPhoto = this.previewPhoto; this.showPreview = false; this.showPasswordStep = true; this.enteredPassword = ''; this.pwdError = ''; }
  retakePhoto(): void { this.showPreview = false; this.previewPhoto = null; this.openCamera(); }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { this.previewPhoto = e.target?.result as string; this.showPreview = true; };
    reader.readAsDataURL(file);
  }

  async confirmSetup(): Promise<void> {
    if (!this.pendingPhoto) return;
    this.saving = true;
    const email = this.authService.currentUser()?.email ?? '';
    if (!this.isGoogleUser) {
      try { await this.authService.login({ email, password: this.enteredPassword }).toPromise(); }
      catch { this.saving = false; this.pwdError = 'Mot de passe incorrect. Réessayez.'; return; }
    }
    this.pwdError = '';
    const pwd = this.isGoogleUser ? undefined : this.enteredPassword;
    try {
      await this.faceIdService.savePhoto(this.pendingPhoto, email, pwd);
      this.facePhoto = this.pendingPhoto; this.enabled = true;
      localStorage.setItem('faceid_hint_email', email);
      this.pendingPhoto = null; this.showPasswordStep = false; this.enteredPassword = '';
      this.snackBar.open('✅ Face ID activé avec succès !', 'OK', { duration: 3000 });
    } catch { this.snackBar.open('Erreur lors de la sauvegarde.', 'Fermer', { duration: 3000 }); }
    finally { this.saving = false; }
  }

  cancelPasswordStep(): void { this.showPasswordStep = false; this.pendingPhoto = null; this.enteredPassword = ''; }

  async toggleFaceId(enabled: boolean): Promise<void> {
    this.saving = true;
    try {
      await this.faceIdService.setEnabled(enabled); this.enabled = enabled;
      this.snackBar.open(enabled ? '✅ Face ID activé' : 'Face ID désactivé', 'OK', { duration: 2000 });
    } catch { this.snackBar.open('Erreur.', 'Fermer', { duration: 3000 }); }
    finally { this.saving = false; }
  }

  async deleteFaceId(): Promise<void> {
    this.saving = true;
    try {
      await this.faceIdService.disable(); this.facePhoto = null; this.enabled = false;
      localStorage.removeItem('faceid_hint_email');
      this.snackBar.open('Face ID supprimé.', 'OK', { duration: 2000 });
    } catch { this.snackBar.open('Erreur.', 'Fermer', { duration: 3000 }); }
    finally { this.saving = false; }
  }

  ngOnDestroy(): void { this.closeCamera(); }
}