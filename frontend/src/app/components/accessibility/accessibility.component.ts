import { Component, OnInit, OnDestroy, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { VoiceCommandService } from '../../core/services/voice-command.service';
import { LsfService, LsfTerm } from '../../core/services/lsf.service';
import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../../core/services/session.service';

interface VoiceCmd {
  say: string;
  desc: string;
}

@Component({
  selector: 'app-accessibility',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (panelOpen) {
      <div class="a11y-panel">
        <div class="ph">
          <span class="ph-title">♿ Accessibilité</span>
          <div style="font-size:10px;color:var(--color-text-secondary);margin-top:2px">
            {{ authService.currentUser()?.role || 'USER' }}
          </div>
          <button class="ph-close" (click)="panelOpen=false">×</button>
        </div>
        <div class="pb">

          <div class="slbl">🎤 Commandes vocales</div>
          @if (!voiceService.isSupported) {
            <div style="font-size:11px;color:var(--color-text-danger);padding:6px 8px;background:var(--color-background-danger);border-radius:6px">
              Utilisez Chrome ou Edge
            </div>
          } @else {
            <button class="mic-btn" [class.active]="voiceService.isListening" (click)="toggleVoice()">
              @if (voiceService.isListening) {
                <div class="waves"><span></span><span></span><span></span><span></span><span></span></div>
                <span>J'écoute...</span>
              } @else {
                <span>🎤 Parlez une commande</span>
              }
            </button>
            @if (voiceService.transcript) {
              <div class="transcript">"{{ voiceService.transcript }}"</div>
            }
            @if (cmdFeedback) {
              <div class="fb" [class.fb-ok]="!cmdIsError" [class.fb-err]="cmdIsError">{{ cmdFeedback }}</div>
            }
            <div class="sep"></div>
            <div class="slbl">Commandes disponibles</div>
            <div class="cmd-list">
              @for (cmd of cmds; track cmd.say) {
                <div class="cmd-row">
                  <span class="cmd-key">{{ cmd.say }}</span>
                  <span>→ {{ cmd.desc }}</span>
                </div>
              }
            </div>
          }

          <div class="sep"></div>

          <div class="lsf-row">
            <div class="slbl" style="margin:0">🤟 Signes LSF</div>
            <button (click)="lsfEnabled = !lsfEnabled"
              style="border:none;cursor:pointer;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500;transition:all .2s"
              [style.background]="lsfEnabled ? '#e8436c' : '#eee'"
              [style.color]="lsfEnabled ? 'white' : '#666'">
              {{ lsfEnabled ? 'ON' : 'OFF' }}
            </button>
          </div>
          @if (lsfEnabled) {
            <p style="font-size:11px;color:var(--color-text-secondary);margin-bottom:8px">
              Cliquez pour voir le signe :
            </p>
            <div class="terms">
              @for (t of lsfService.terms; track t.term) {
                <div class="term" (click)="showLsf(t)">🤟 {{ t.term }}</div>
              }
            </div>
          }

          <div class="sep"></div>

          <div class="slbl">♿ Accessibilité Visuelle</div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; align-items:center; justify-content:space-between;">
              <span style="font-size:11px;color:var(--color-text-secondary)">Contraste élevé</span>
              <button (click)="toggleHighContrast()"
                style="border:none;cursor:pointer;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500;transition:all .2s"
                [style.background]="highContrast ? '#e8436c' : '#eee'"
                [style.color]="highContrast ? 'white' : '#666'">
                {{ highContrast ? 'ON' : 'OFF' }}
              </button>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:11px;color:var(--color-text-secondary)">Taille du texte</span>
              <button (click)="decreaseFontSize()" style="border:0.5px solid var(--color-border-secondary);background:white;border-radius:4px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;">-</button>
              <span style="font-size:11px;color:var(--color-text-primary);min-width:30px;text-align:center">{{ fontSize }}%</span>
              <button (click)="increaseFontSize()" style="border:0.5px solid var(--color-border-secondary);background:white;border-radius:4px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;">+</button>
              <button (click)="resetFontSize()" style="border:0.5px solid var(--color-border-secondary);background:white;border-radius:4px;padding:2px 6px;font-size:10px;cursor:pointer;">Reset</button>
            </div>
          </div>

          <div class="sep"></div>

          <div class="slbl">⌨ Raccourcis Clavier</div>
          <div class="cmd-list">
            <div class="cmd-row">
              <span class="cmd-key">Alt + A</span>
              <span>Ouvrir/Fermer l'accessibilité</span>
            </div>
            <div class="cmd-row">
              <span class="cmd-key">Alt + V</span>
              <span>Activer/Désactiver la voix</span>
            </div>
            <div class="cmd-row">
              <span class="cmd-key">Échap</span>
              <span>Fermer les modales</span>
            </div>
          </div>

          <div class="sep"></div>

          <div style="display:flex; justify-content:center;">
            <button (click)="resetAccessibilitySettings()"
              style="border:0.5px solid var(--color-border-secondary);background:var(--color-background-secondary);color:var(--color-text-primary);border-radius:6px;padding:6px 12px;font-size:11px;cursor:pointer;">
              🔄 Réinitialiser les paramètres
            </button>
          </div>
        </div>
      </div>
    }

    <div class="a11y-fab">
      <button class="a11y-toggle" (click)="panelOpen=!panelOpen" title="Accessibilité">♿</button>
    </div>

    @if (lsfModal) {
      <div class="lsf-overlay" (click)="lsfModal=null">
        <div class="lsf-box" (click)="$event.stopPropagation()">
          <div class="lsf-hd">
            <span class="lsf-hd-title">🤟 {{ lsfModal.term }}</span>
            <button (click)="lsfModal=null">×</button>
          </div>
          <div class="lsf-bd">
            <div style="background:#f8f8f8;border-radius:12px;padding:24px;text-align:center;margin-bottom:16px">
              <div style="font-size:64px;margin-bottom:12px">🤟</div>
              <div style="font-size:18px;font-weight:600;color:#1a1a2e;margin-bottom:6px">{{ lsfModal.term }}</div>
              <div style="font-size:13px;color:#666;margin-bottom:16px">{{ lsfModal.description }}</div>
              <a [href]="lsfService.getYoutubeSearch(lsfModal.term)" target="_blank"
                 style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:#FF0000;color:white;border-radius:8px;text-decoration:none;font-size:13px;font-weight:500;margin-bottom:8px">
                ▶ Voir le signe sur YouTube
              </a>
              <br/>
              <a [href]="lsfService.getSearchUrl(lsfModal)" target="_blank"
                 style="display:inline-flex;align-items:center;gap:8px;padding:8px 16px;background:#e8436c;color:white;border-radius:8px;text-decoration:none;font-size:12px;margin-top:6px">
                📖 Dictionnaire Sematos LSF
              </a>
            </div>
            <p style="font-size:11px;color:var(--color-text-secondary);text-align:center">
              Les vidéos LSF s'ouvrent dans un nouvel onglet
            </p>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .a11y-fab {
      position: fixed;
      bottom: 24px;
      right: 80px;
      z-index: 9999;
    }
    .a11y-toggle {
      width: 44px; height: 44px; border-radius: 50%; border: none; cursor: pointer;
      background: #e8436c; color: white; font-size: 18px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 12px rgba(232,67,108,0.4);
      transition: transform .2s;
    }
    .a11y-toggle:hover { transform: scale(1.08); }

    .a11y-panel {
      position: fixed;
      bottom: 76px;
      right: 24px;
      z-index: 9998;
      width: 270px;
      max-height: 60vh;
      overflow-y: auto;
      background: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.15);
    }
    .ph {
      padding: 12px 14px;
      border-bottom: 0.5px solid var(--color-border-tertiary);
      display: flex; align-items: center; justify-content: space-between;
      position: sticky; top: 0;
      background: white;
    }
    .ph-title { font-size: 13px; font-weight: 600; color: var(--color-text-primary); display:flex; align-items:center; gap:6px; }
    .ph-close { background:none; border:none; color:var(--color-text-secondary); cursor:pointer; font-size:18px; line-height:1; padding:0; }
    .pb { padding: 12px 14px; }

    .slbl { font-size: 10px; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: .08em; margin-bottom: 8px; }

    .mic-btn {
      width: 100%; padding: 10px 12px; border-radius: 8px; border: 0.5px solid var(--color-border-secondary);
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
      font-size: 13px; font-weight: 500; transition: all .2s;
      background: var(--color-background-secondary); color: var(--color-text-primary);
    }
    .mic-btn.active { background: #e8436c; color: white; border-color: #e8436c; animation: glow 1.5s infinite; }
    @keyframes glow { 0%,100%{box-shadow:0 0 0 0 rgba(232,67,108,0.3)} 50%{box-shadow:0 0 0 6px rgba(232,67,108,0)} }
    .waves { display:flex; align-items:center; gap:2px; }
    .waves span { display:block; width:2px; border-radius:2px; background:white; animation:wv .8s ease-in-out infinite; }
    .waves span:nth-child(1){height:6px;animation-delay:0s}
    .waves span:nth-child(2){height:12px;animation-delay:.1s}
    .waves span:nth-child(3){height:8px;animation-delay:.2s}
    .waves span:nth-child(4){height:16px;animation-delay:.3s}
    .waves span:nth-child(5){height:7px;animation-delay:.4s}
    @keyframes wv { 0%,100%{transform:scaleY(.3)} 50%{transform:scaleY(1)} }

    .transcript { font-size:11px; color:var(--color-text-secondary); margin-top:6px; padding:6px 8px; background:var(--color-background-secondary); border-radius:6px; font-style:italic; }
    .fb { font-size:11px; margin-top:5px; padding:5px 8px; border-radius:6px; }
    .fb-ok  { background:var(--color-background-success); color:var(--color-text-success); }
    .fb-err { background:var(--color-background-danger); color:var(--color-text-danger); }

    .sep { height:0.5px; background:var(--color-border-tertiary); margin:10px 0; }

    .cmd-list { display:flex; flex-direction:column; gap:3px; }
    .cmd-row { display:flex; align-items:center; gap:6px; font-size:11px; color:var(--color-text-secondary); }
    .cmd-key { background:var(--color-background-secondary); border:0.5px solid var(--color-border-tertiary); color:var(--color-text-primary); border-radius:4px; padding:1px 5px; font-size:10px; font-weight:600; white-space:nowrap; }

    .lsf-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
    .sw { position:relative; width:40px; height:22px; flex-shrink:0; display:inline-block; }
    .sw input { opacity:0; width:0; height:0; position:absolute; }
    .sl { position:absolute; top:0; left:0; right:0; bottom:0; border-radius:11px; background:#ccc; cursor:pointer; transition:.3s; }
    .sl:before { position:absolute; content:''; height:16px; width:16px; left:3px; bottom:3px; border-radius:50%; background:white; transition:.3s; }
    input:checked + .sl { background:#e8436c; }
    input:checked + .sl:before { transform:translateX(18px); }

    .terms { display:flex; flex-wrap:wrap; gap:4px; }
    .term { background:var(--color-background-secondary); border:0.5px solid var(--color-border-tertiary); border-radius:20px; padding:3px 8px; font-size:11px; color:var(--color-text-primary); cursor:pointer; transition:all .15s; }
    .term:hover { border-color:#e8436c; color:#e8436c; background:#fff0f5; }

    .lsf-overlay { position:fixed; inset:0; z-index:99999; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; padding:1rem; }
    .lsf-box { background:var(--color-background-primary); border-radius:14px; overflow:hidden; width:300px; border:0.5px solid var(--color-border-secondary); }
    .lsf-hd { padding:12px 16px; display:flex; align-items:center; justify-content:space-between; border-bottom:0.5px solid var(--color-border-tertiary); }
    .lsf-hd-title { font-size:14px; font-weight:600; color:var(--color-text-primary); }
    .lsf-hd button { background:none; border:none; color:var(--color-text-secondary); cursor:pointer; font-size:20px; line-height:1; }
    .lsf-bd { padding:16px; text-align:center; }
    .lsf-gif { width:100%; border-radius:8px; max-height:200px; object-fit:contain; }
    .lsf-desc { font-size:13px; color:var(--color-text-secondary); margin-top:10px; }
    .lsf-src { font-size:10px; color:var(--color-text-tertiary); margin-top:4px; }
    .lsf-link { color:#e8436c; font-size:12px; text-decoration:none; margin-top:8px; display:inline-block; }
  `,

  `
    :host-context(.high-contrast) {
      --color-background-primary: #000000 !important;
      --color-background-secondary: #1a1a1a !important;
      --color-text-primary: #ffffff !important;
      --color-text-secondary: #cccccc !important;
      --color-border-primary: #ffffff !important;
      --color-border-secondary: #666666 !important;
    }

    :host-context(.high-contrast) .a11y-panel {
      background: #000000 !important;
      border-color: #ffffff !important;
      box-shadow: 0 4px 24px rgba(255,255,255,0.2) !important;
    }

    :host-context(.high-contrast) .ph {
      border-bottom-color: #666666 !important;
    }

    :host-context(.high-contrast) .mic-btn {
      background: #1a1a1a !important;
      border-color: #666666 !important;
      color: #ffffff !important;
    }

    :host-context(.high-contrast) .mic-btn.active {
      background: #ffffff !important;
      color: #000000 !important;
      border-color: #ffffff !important;
    }

    :host-context(.high-contrast) .term {
      background: #1a1a1a !important;
      border-color: #666666 !important;
      color: #ffffff !important;
    }

    :host-context(.high-contrast) .term:hover {
      border-color: #ffffff !important;
      background: #333333 !important;
      color: #ffffff !important;
    }

    :host-context(.high-contrast) .cmd-key {
      background: #1a1a1a !important;
      border-color: #666666 !important;
      color: #ffffff !important;
    }
  `,
]
}
)

export class AccessibilityComponent implements OnInit, OnDestroy {
  panelOpen  = false;
  lsfEnabled = false;
  lsfModal: any = null;
  videoError = false;
  cmdFeedback = '';
  cmdIsError  = false;
  highContrast = false;
  fontSize = 100; // percentage
  private subs: Subscription[] = [];

  cmds: VoiceCmd[] = [];

  constructor(public voiceService: VoiceCommandService, public lsfService: LsfService, private authService: AuthService, private sessionService: SessionService) {
    this.updateCommands();

    effect(() => {
      this.authService.currentUser(); // Read the signal to trigger effect
      this.updateCommands();
    });
  }

  private updateCommands(): void {
    const user = this.authService.currentUser();
    const role = user?.role || 'USER';

    switch (role) {
      case 'ADMIN':
        this.cmds = [
          { say: 'Dashboard',      desc: 'Tableau de bord admin' },
          { say: 'Utilisateurs',   desc: 'Gestion utilisateurs' },
          { say: 'Plans',          desc: 'Gestion des plans' },
          { say: 'Promotions',     desc: 'Codes promo' },
          { say: 'Rapports',       desc: 'Rapports & statistiques' },
          { say: 'Paramètres',     desc: 'Paramètres système' },
          { say: 'Cours',          desc: 'Gestion des cours' },
          { say: 'Guides',         desc: 'Guides médicaux' },
          { say: 'Profil',         desc: 'Mon profil admin' },
          { say: 'Retour',         desc: 'Page précédente' },
        ];
        break;

      case 'PARTNER':
        this.cmds = [
          { say: 'Dashboard',      desc: 'Tableau de bord partenaire' },
          { say: 'Invitations',    desc: 'Centre d\'invitations' },
          { say: 'Notifications',  desc: 'Notifications' },
          { say: 'Notes',          desc: 'Mes notes' },
          { say: 'Guides',         desc: 'Guides médicaux' },
          { say: 'Assistant IA',   desc: 'Assistant IA' },
          { say: 'Grossesse',      desc: 'Suivi grossesse' },
          { say: 'Examens',        desc: 'Examens médicaux' },
          { say: 'Fœtal',          desc: 'Développement fœtal' },
          { say: 'Retour',         desc: 'Page précédente' },
        ];
        break;

      case 'USER':
      default:
        this.cmds = [
          { say: 'Dashboard',      desc: 'Tableau de bord' },
          { say: 'Profil',         desc: 'Mon profil' },
          { say: 'Profil Santé',   desc: 'Profil santé' },
          { say: 'Abonnement',     desc: 'Abonnement' },
          { say: 'Assistant IA',   desc: 'Assistant IA' },
          { say: 'Maternités',     desc: 'Maternités' },
          { say: 'Carte',          desc: 'Carte Médicale' },
          { say: 'Émotions',       desc: 'Émotions IA' },
          { say: 'Grossesse',      desc: 'Suivi grossesse' },
          { say: 'Examens',        desc: 'Examens médicaux' },
          { say: 'Fœtal',          desc: 'Développement fœtal' },
          { say: 'Constantes',     desc: 'Constantes vitales' },
          { say: 'Alertes',        desc: 'Alertes médicales' },
          { say: 'Cours',          desc: 'Cours de grossesse' },
          { say: 'Recommandations', desc: 'Recommandations' },
          { say: 'Retour',         desc: 'Page précédente' },
        ];
        break;
    }
  }

  ngOnInit(): void {
    this.subs.push(this.voiceService.onCommand.subscribe(cmd => {
      this.cmdIsError  = cmd.includes('non reconnue');
      this.cmdFeedback = this.cmdIsError ? '❌ ' + cmd : '✅ ' + cmd;
      setTimeout(() => this.cmdFeedback = '', 3500);
    }));

    // Update commands when user changes (multiple ways to ensure it works)
    this.subs.push(this.sessionService.auth$.subscribe(() => {
      this.updateCommands();
      this.voiceService.refreshCommands();
    }));

    // Update commands when user changes
    

    this.loadAccessibilitySettings();
  }

  toggleVoice(): void { this.voiceService.toggleListening(); this.cmdFeedback = ''; }

  showLsf(t: any): void { this.lsfModal = t; this.videoError = false; }

  toggleHighContrast(): void {
    this.highContrast = !this.highContrast;
    document.documentElement.classList.toggle('high-contrast', this.highContrast);
    localStorage.setItem('accessibility-high-contrast', this.highContrast.toString());
  }

  increaseFontSize(): void {
    if (this.fontSize < 150) {
      this.fontSize += 10;
      this.updateFontSize();
    }
  }

  decreaseFontSize(): void {
    if (this.fontSize > 80) {
      this.fontSize -= 10;
      this.updateFontSize();
    }
  }

  resetFontSize(): void {
    this.fontSize = 100;
    this.updateFontSize();
  }

  private updateFontSize(): void {
    document.documentElement.style.fontSize = this.fontSize + '%';
    localStorage.setItem('accessibility-font-size', this.fontSize.toString());
  }

  resetAccessibilitySettings(): void {
    this.highContrast = false;
    this.fontSize = 100;
    document.documentElement.classList.remove('high-contrast');
    document.documentElement.style.fontSize = '100%';
    localStorage.removeItem('accessibility-high-contrast');
    localStorage.removeItem('accessibility-font-size');
  }

  private loadAccessibilitySettings(): void {
    const savedContrast = localStorage.getItem('accessibility-high-contrast');
    if (savedContrast === 'true') {
      this.highContrast = true;
      document.documentElement.classList.add('high-contrast');
    }

    const savedFontSize = localStorage.getItem('accessibility-font-size');
    if (savedFontSize) {
      this.fontSize = parseInt(savedFontSize, 10);
      this.updateFontSize();
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void { this.lsfModal = null; this.panelOpen = false; }

  @HostListener('document:keydown.alt.a', ['$event'])
  onAltA(event: KeyboardEvent): void {
    event.preventDefault();
    this.panelOpen = !this.panelOpen;
  }

  @HostListener('document:keydown.alt.v', ['$event'])
  onAltV(event: KeyboardEvent): void {
    event.preventDefault();
    this.toggleVoice();
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }
}