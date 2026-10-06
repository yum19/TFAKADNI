import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-referral',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule, MatIconModule, RouterModule],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');

    :host {
      --plum:        #c94d6a;
      --plum-light:  #f5c6d0;
      --plum-pale:   #fdf0f3;
      --plum-bg:     rgba(201,77,106,0.10);
      --plum-border: rgba(201,77,106,0.25);
      --cream:       #f7ede4;
      --text-dark:   #1e1215;
      --text-mid:    #4a3038;
      --text-soft:   #7a5c65;
      --font-display: 'Playfair Display', Georgia, serif;
      --font-body:    'DM Sans', sans-serif;
      --radius-lg:   20px;
      --radius-xl:   28px;
      --shadow-card: 0 2px 16px rgba(30,18,21,0.10);
    }

    /* ── Page ── */
    .ref-page {
      min-height: 100vh;
      position: relative;
      font-family: var(--font-body);
    }
    .ref-page::before {
      content: '';
      position: fixed;
      inset: 0;
      background-image: url('/assets/img/mother_pages_background-3.png');
      background-size: cover;
      background-position: center;
      z-index: -1;
    }
    .ref-page::after {
      content: '';
      position: fixed;
      inset: 0;
      background: rgba(247, 237, 228, 0.84);
      z-index: -1;
    }

    .ref-wrap {
      position: relative;
      z-index: 1;
      max-width: 1400px;
      margin: 0 auto;
      padding: 3rem 2rem 4rem;
    }
    @media(max-width:600px) { .ref-wrap { padding: 2rem 1.25rem 3rem; } }

    /* ── Hero ── */
    .hero {
      background: linear-gradient(135deg, #1a1a2e, #2d1b4e);
      border-radius: var(--radius-xl);
      padding: 2.2rem 2rem;
      margin-bottom: 1.5rem;
      position: relative;
      overflow: hidden;
    }
    .blob1 { position: absolute; top: -40px; right: -40px; width: 180px; height: 180px; border-radius: 50%; background: rgba(232,67,108,0.15); }
    .blob2 { position: absolute; bottom: -20px; left: 25%; width: 100px; height: 100px; border-radius: 50%; background: rgba(232,67,108,0.08); }
    .hero-inner { position: relative; }

    .header-badge {
      display: inline-flex; align-items: center; gap: 8px;
      font-family: var(--font-body); font-size: 0.72rem; font-weight: 500;
      letter-spacing: 0.12em; text-transform: uppercase;
      color: var(--plum); background: var(--plum-bg);
      border: 1.5px solid var(--plum-border);
      padding: 4px 14px; border-radius: 20px; margin-bottom: 1rem;
    }
    .badge-pulse {
      width: 7px; height: 7px; border-radius: 50%;
      background: var(--plum); animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.5)} }

    .hero-top {
      display: flex; align-items: flex-start;
      justify-content: space-between; gap: 1rem;
    }
    .hero-title {
      font-family: var(--font-display);
      font-size: clamp(1.5rem, 3.5vw, 2.2rem);
      font-weight: 700; color: white;
      margin: 0.4rem 0 0.5rem; line-height: 1.2;
    }
    .title-accent {
      font-style: italic;
      background: linear-gradient(135deg, #e8436c, #f08090, #e8436c);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .hero-sub { font-size: 0.82rem; color: rgba(255,255,255,0.6); }
    .powered-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 0.8rem; }
    .powered-chip {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,0.12);
      border: 1.5px solid rgba(255,255,255,0.20);
      border-radius: 30px; padding: 5px 12px;
      font-size: 0.68rem; font-weight: 600;
      color: rgba(255,255,255,0.75);
    }

    /* Hero stat card */
    .hero-stat-card {
      background: rgba(255,255,255,0.10);
      backdrop-filter: blur(8px);
      border: 1.5px solid rgba(255,255,255,0.15);
      border-radius: 16px; padding: 16px 20px;
      text-align: center; flex-shrink: 0; min-width: 100px;
    }
    .hero-stat-num {
      font-family: var(--font-display); font-size: 2rem;
      font-weight: 700; color: #e8436c; line-height: 1;
    }
    .hero-stat-lbl {
      font-size: 0.65rem; color: rgba(255,255,255,0.55);
      font-weight: 600; letter-spacing: 0.08em;
      text-transform: uppercase; margin-top: 4px;
    }

    /* Code box */
    .code-box {
      background: rgba(255,255,255,0.08);
      border: 1.5px dashed rgba(232,67,108,0.55);
      border-radius: 14px; padding: 1rem 1.25rem;
      margin-top: 1.25rem;
      display: flex; align-items: center;
      justify-content: space-between; gap: 1rem;
    }
    .code-label {
      font-size: 0.65rem; color: rgba(255,255,255,0.45);
      letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px;
    }
    .code-val {
      font-size: 26px; font-weight: 700; color: #e8436c;
      letter-spacing: 4px; font-family: monospace;
    }
    .copy-btn {
      background: #e8436c; border: none; color: white;
      border-radius: 10px; padding: 9px 18px;
      font-size: 0.78rem; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: 6px; flex-shrink: 0;
      font-family: var(--font-body); transition: opacity 0.2s;
    }
    .copy-btn:hover { opacity: 0.88; }

    /* ── Feature Strip ── */
    .feature-strip {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 1rem; margin-bottom: 1.5rem;
    }
    @media(max-width:500px) { .feature-strip { grid-template-columns: 1fr; } }
    .feature-card {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255,255,255,0.75);
      border-radius: var(--radius-lg); padding: 1.2rem;
      text-align: center; box-shadow: var(--shadow-card);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .feature-card:hover { transform: translateY(-3px); box-shadow: 0 6px 24px rgba(30,18,21,0.12); }
    .feature-card-icon { font-size: 1.4rem; margin-bottom: 7px; display: block; }
    .feature-card-title {
      font-family: var(--font-display); font-size: 0.88rem;
      font-weight: 700; color: var(--text-dark); margin-bottom: 4px;
    }
    .feature-card-sub { font-size: 0.70rem; color: var(--text-soft); line-height: 1.4; }

    /* ── Section Meta ── */
    .section-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 1.2rem; }
    .section-chip {
      font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em;
      text-transform: uppercase; color: var(--plum);
      background: var(--plum-bg); border: 1.5px solid var(--plum-border);
      padding: 3px 14px; border-radius: 20px; white-space: nowrap;
    }
    .section-line { flex: 1; height: 1px; background: linear-gradient(90deg, var(--plum-border), transparent); }

    /* ── Stats ── */
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255,255,255,0.75);
      border-radius: var(--radius-lg); padding: 1.25rem;
      text-align: center; box-shadow: var(--shadow-card);
    }
    .stat-val {
      font-family: var(--font-display); font-size: 2.4rem;
      font-weight: 700; color: #e8436c; line-height: 1; margin-bottom: 4px;
    }
    .stat-lbl { font-size: 0.68rem; color: var(--text-soft); font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }

    /* ── Promo ── */
    .promo {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      border: 1.5px solid var(--plum-border);
      border-radius: var(--radius-lg); padding: 1.25rem;
      margin-bottom: 1.5rem;
      display: flex; align-items: center; gap: 1rem;
      box-shadow: var(--shadow-card);
    }
    .promo-icon { font-size: 1.8rem; flex-shrink: 0; }
    .promo-title { font-family: var(--font-display); font-size: 0.95rem; font-weight: 700; color: var(--text-dark); margin-bottom: 3px; }
    .promo-sub { font-size: 0.75rem; color: var(--text-soft); }
    .promo-code {
      background: var(--plum-bg); border: 2px dashed var(--plum);
      border-radius: 10px; padding: 7px 16px;
      font-weight: 700; font-size: 18px; letter-spacing: 3px;
      color: var(--plum); margin-left: auto; flex-shrink: 0; font-family: monospace;
    }

    /* ── Panels ── */
    .panel {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255,255,255,0.75);
      border-radius: var(--radius-lg); padding: 1.5rem;
      margin-bottom: 1.5rem; box-shadow: var(--shadow-card);
    }
    .panel-title {
      font-family: var(--font-display); font-size: 1rem;
      font-weight: 700; color: var(--text-dark);
      margin: 0 0 1rem; display: flex; align-items: center; gap: 8px;
    }
    .share-link {
      background: rgba(201,77,106,0.06);
      border: 1.5px solid var(--plum-border);
      border-radius: 10px; padding: 10px 14px;
      font-size: 0.72rem; color: var(--text-soft);
      margin-bottom: 12px; word-break: break-all; font-family: monospace;
    }
    .share-btns { display: flex; gap: 10px; flex-wrap: wrap; }
    .share-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 9px 18px; border-radius: 30px;
      border: 1.5px solid var(--plum-border);
      font-size: 0.78rem; font-weight: 600; cursor: pointer;
      font-family: var(--font-body); transition: all 0.2s;
    }
    .share-copy { background: #e8436c; color: white; border-color: #e8436c; }
    .share-copy:hover { opacity: 0.88; }
    .share-wa { background: #25D366; color: white; border-color: #25D366; }
    .share-wa:hover { opacity: 0.88; }
    .share-email { background: rgba(255,255,255,0.9); color: var(--text-mid); }
    .share-email:hover { background: var(--plum-bg); color: var(--plum); }

    /* ── Filleuls ── */
    .filleul {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid var(--plum-border);
    }
    .filleul:last-child { border: none; }
    .filleul-avatar {
      width: 42px; height: 42px; border-radius: 50%;
      background: var(--plum-bg); border: 1.5px solid var(--plum-border);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; flex-shrink: 0; object-fit: cover;
    }
    .filleul-name { font-size: 0.88rem; font-weight: 600; color: var(--text-dark); }
    .filleul-date { font-size: 0.70rem; color: var(--text-soft); margin-top: 2px; }
    .badge-rewarded {
      background: rgba(16,185,129,0.12); color: #059669;
      border: 1.5px solid rgba(16,185,129,0.3);
      font-size: 0.68rem; font-weight: 700;
      padding: 4px 12px; border-radius: 20px;
      margin-left: auto; white-space: nowrap;
    }
    .badge-pending {
      background: rgba(245,158,11,0.12); color: #d97706;
      border: 1.5px solid rgba(245,158,11,0.3);
      font-size: 0.68rem; font-weight: 700;
      padding: 4px 12px; border-radius: 20px;
      margin-left: auto; white-space: nowrap;
    }
    .empty { text-align: center; padding: 2.5rem 1rem; color: var(--text-soft); font-size: 0.82rem; }
    .empty-icon { font-size: 2.5rem; display: block; margin-bottom: 10px; }

    /* ── Loading ── */
    .loading { text-align: center; padding: 3rem; color: var(--text-soft); font-family: var(--font-body); }
  `],
  template: `
    <div class="ref-page">
      <div class="ref-wrap">

        <!-- ── Hero ── -->
        <div class="hero">
          <div class="blob1"></div>
          <div class="blob2"></div>
          <div class="hero-inner">
            <span class="header-badge">
              <span class="badge-pulse"></span>
              Programme de parrainage
            </span>
            <div class="hero-top">
              <div>
                <h1 class="hero-title">
                  Invitez vos amis,<br />
                  <span class="title-accent">gagnez des récompenses.</span>
                </h1>
                <p class="hero-sub">Chaque filleul inscrit vous offre un code promo WELCOME5 — à vous deux !</p>
                <div class="powered-row">
                  <div class="powered-chip">🎁 Récompenses</div>
                  <div class="powered-chip">🔗 Partage facile</div>
                  <div class="powered-chip">✅ Suivi en temps réel</div>
                </div>
              </div>
              @if (data) {
                <div class="hero-stat-card">
                  <div class="hero-stat-num">{{ data.total }}</div>
                  <div class="hero-stat-lbl">Filleuls</div>
                </div>
              }
            </div>

            @if (data) {
              <div class="code-box">
                <div>
                  <div class="code-label">Votre code</div>
                  <div class="code-val">{{ data.code }}</div>
                </div>
                <button class="copy-btn" (click)="copyLink()">📋 Copier le lien</button>
              </div>
            }
          </div>
        </div>

        @if (!data && loading) {
          <div class="loading">⏳ Chargement...</div>
        }

        @if (data) {

          <!-- ── Feature Strip ── -->
          <div class="feature-strip">
            <div class="feature-card">
              <span class="feature-card-icon">🔗</span>
              <div class="feature-card-title">Lien unique</div>
              <div class="feature-card-sub">Partagez votre lien personnel partout</div>
            </div>
            <div class="feature-card">
              <span class="feature-card-icon">🎁</span>
              <div class="feature-card-title">Code WELCOME5</div>
              <div class="feature-card-sub">-5% pour vous et chaque filleul inscrit</div>
            </div>
            <div class="feature-card">
              <span class="feature-card-icon">👥</span>
              <div class="feature-card-title">Suivi filleuls</div>
              <div class="feature-card-sub">Historique complet de vos parrainages</div>
            </div>
          </div>

          <!-- ── Stats ── -->
          <div class="section-meta">
            <span class="section-chip">Statistiques</span>
            <div class="section-line"></div>
          </div>
          <div class="stats">
            <div class="stat-card">
              <div class="stat-val">{{ data.total }}</div>
              <div class="stat-lbl">Total filleuls</div>
            </div>
            <div class="stat-card">
              <div class="stat-val" style="color:#10b981">{{ data.totalRewarded }}</div>
              <div class="stat-lbl">Récompensés ✅</div>
            </div>
            <div class="stat-card">
              <div class="stat-val" style="color:#f59e0b">{{ data.totalPending }}</div>
              <div class="stat-lbl">En attente ⏳</div>
            </div>
          </div>

          <!-- ── Promo ── -->
          @if (data.total > 0) {
            <div class="promo">
              <div class="promo-icon">🎁</div>
              <div>
                <div class="promo-title">Récompense débloquée !</div>
                <div class="promo-sub">Vous et vos filleuls avez reçu ce code promo par email</div>
              </div>
              <div class="promo-code">WELCOME5</div>
            </div>
          }

          <!-- ── Share ── -->
          <div class="section-meta">
            <span class="section-chip">Partager</span>
            <div class="section-line"></div>
          </div>
          <div class="panel">
            <div class="panel-title">🔗 Mon lien d'invitation</div>
            <div class="share-link">{{ data.link }}</div>
            <div class="share-btns">
              <button class="share-btn share-copy" (click)="copyLink()">📋 Copier le lien</button>
              <button class="share-btn share-wa" (click)="shareWhatsApp()">📱 WhatsApp</button>
              <button class="share-btn share-email" (click)="shareEmail()">📧 Email</button>
            </div>
          </div>

          <!-- ── History ── -->
          <div class="section-meta">
            <span class="section-chip">Mes filleuls</span>
            <div class="section-line"></div>
          </div>
          <div class="panel">
            <div class="panel-title">👥 Historique ({{ data.total }})</div>

            @if (data.referrals.length === 0) {
              <div class="empty">
                <span class="empty-icon">🤝</span>
                <p>Aucun filleul encore</p>
                <p style="margin-top:4px">Partagez votre lien pour commencer !</p>
              </div>
            }

            @for (r of data.referrals; track r.id) {
              <div class="filleul">
                @if (r.avatarUrl) {
                  <img [src]="r.avatarUrl" class="filleul-avatar" alt="Avatar" />
                } @else {
                  <div class="filleul-avatar">👤</div>
                }
                <div>
                  <div class="filleul-name">{{ r.referredName }}</div>
                  <div class="filleul-date">{{ formatDate(r.createdAt) }}</div>
                </div>
                <span [class]="r.status === 'REWARDED' ? 'badge-rewarded' : 'badge-pending'">
                  {{ r.status === 'REWARDED' ? '✅ Récompensé' : '⏳ En attente' }}
                </span>
              </div>
            }
          </div>

        }
      </div>
    </div>
  `
})
export class MotherReferralComponent implements OnInit {
  data: any = null;
  loading = true;

  constructor(private http: HttpClient, private snack: MatSnackBar) {}

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/referrals/my-code`).subscribe({
      next: (res) => { this.data = res.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  copyLink(): void {
    if (!this.data?.link) return;
    navigator.clipboard.writeText(this.data.link).then(() => {
      this.snack.open('🔗 Lien copié ! Partagez-le avec vos amis.', 'OK', { duration: 3000 });
    });
  }

  shareWhatsApp(): void {
    const msg = encodeURIComponent(`Rejoins MAMAAI avec mon code de parrainage et reçois -5% ! ${this.data.link}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  }

  shareEmail(): void {
    const subject = encodeURIComponent('Rejoins MAMAAI — Code parrainage -5%');
    const body = encodeURIComponent(
      `Salut !\n\nJe t'invite à rejoindre MAMAAI, l'app de santé maternelle.\nUtilise mon lien pour t'inscrire et on reçoit tous les deux un code promo de -5% !\n\n${this.data.link}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  } 
}