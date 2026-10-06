import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface EmotionResult {
  dominant: string;
  emoji: string;
  color: string;
  scores: { [key: string]: number };
  advice: string;
  breathingEx: boolean;
}

@Component({
  selector: 'app-emotion-detector',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');

    :host { display: block; }

    :host {
      --teal:        #c94d6a;
      --teal-light:  #f5c6d0;
      --teal-pale:   #fdf0f3;
      --teal-bg:     rgba(201,77,106,0.10);
      --teal-border: rgba(201,77,106,0.25);
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
    .ed-page {
      min-height: 100vh;
      position: relative;
      font-family: var(--font-body);
    }
    .ed-page::before {
      content: '';
      position: fixed;
      inset: 0;
      background-image: url('/assets/img/mother_pages_background-3.png');
      background-size: cover;
      background-position: center;
      z-index: -1;
    }
    .ed-page::after {
      content: '';
      position: fixed;
      inset: 0;
      background: rgba(247, 237, 228, 0.85);
      z-index: -1;
    }

    .ed-wrap {
      position: relative;
      z-index: 1;
      max-width: 1400px;
      margin: 0 auto;
      padding: 3rem 2.5rem 4rem;
    }
    @media(max-width:600px){ .ed-wrap { padding: 2rem 1.5rem 3rem; } }

    /* ── Header ── */
    .ed-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2.5rem;
      margin-bottom: 2.5rem;
    }
    @media(max-width:900px){ .ed-header { flex-direction: column; align-items: flex-start; } }

    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.75rem;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--teal);
      background: var(--teal-bg);
      border: 1.5px solid var(--teal-border);
      padding: 4px 14px;
      border-radius: 20px;
      margin-bottom: 1rem;
    }
    .badge-live {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--teal);
      animation: livePulse 1.5s ease-in-out infinite;
    }
    @keyframes livePulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(201,77,106,0.5)} 50%{opacity:0.6;box-shadow:0 0 0 5px rgba(58,158,138,0)} }

    .ed-title {
      font-family: var(--font-display);
      font-size: clamp(2.2rem, 4.5vw, 3.5rem);
      font-weight: 700;
      line-height: 1.1;
      color: var(--text-dark);
      margin-bottom: 0.8rem;
    }
    .title-accent {
      font-style: italic;
      background: linear-gradient(135deg, #c94d6a, #e8758a, #c94d6a);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .ed-lead {
      font-size: 0.95rem;
      color: var(--text-mid);
      max-width: 480px;
      line-height: 1.7;
      margin-bottom: 1.5rem;
    }
    .feature-pills { display: flex; gap: 8px; flex-wrap: wrap; }
    .feature-pill {
      display: inline-flex; align-items: center; gap: 5px;
      background: rgba(255,255,255,0.75);
      border: 1.5px solid var(--teal-border);
      border-radius: 20px;
      padding: 5px 12px;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-mid);
    }

    /* Hero stat */
    .hero-ed-wrap { flex-shrink: 0; }
    @media(max-width:900px){ .hero-ed-wrap { display: none; } }
    .hero-ed-card {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      border: 1.5px solid var(--teal-border);
      border-radius: var(--radius-xl);
      padding: 24px 28px;
      text-align: center;
      box-shadow: var(--shadow-card);
    }
    .hero-ed-icon { font-size: 2.4rem; margin-bottom: 8px; }
    .hero-ed-num {
      font-family: var(--font-display);
      font-size: 2.4rem;
      font-weight: 700;
      color: var(--teal);
      line-height: 1;
    }
    .hero-ed-lbl {
      font-size: 0.68rem;
      color: var(--text-soft);
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-top: 4px;
    }

    /* ── Stats Strip ── */
    .stats-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }
    @media(max-width:900px){ .stats-strip { grid-template-columns: repeat(2, 1fr); } }
    .stat-mini {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255,255,255,0.75);
      border-radius: var(--radius-lg);
      padding: 1rem 1.2rem;
      text-align: center;
      box-shadow: var(--shadow-card);
      transition: transform 0.2s;
    }
    .stat-mini:hover { transform: translateY(-2px); }
    .stat-mini-icon { font-size: 1.4rem; margin-bottom: 5px; }
    .stat-mini-val {
      font-family: var(--font-display);
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--teal);
    }
    .stat-mini-lbl { font-size: 0.65rem; color: var(--text-soft); font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }

    /* ── Section Meta ── */
    .section-meta {
      display: flex; align-items: center; gap: 10px; margin-bottom: 1.2rem; margin-top: 2rem;
    }
    .section-chip {
      font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
      color: var(--teal); background: var(--teal-bg); border: 1.5px solid var(--teal-border);
      padding: 3px 14px; border-radius: 20px; white-space: nowrap;
    }
    .section-line { flex: 1; height: 1px; background: linear-gradient(90deg, var(--teal-border), transparent); }

    /* ── Main Grid ── */
    .ed-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    @media(max-width:900px){ .ed-grid { grid-template-columns: 1fr; } }

    /* ── Camera Panel ── */
    .camera-panel {
      background: rgba(255,255,255,0.88);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255,255,255,0.75);
      border-radius: var(--radius-xl);
      overflow: hidden;
      box-shadow: var(--shadow-card);
    }
    .camera-panel-header {
      padding: 18px 22px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .panel-title {
      font-family: var(--font-display);
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-dark);
      display: flex; align-items: center; gap: 8px;
    }
    .live-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #ef4444;
      animation: livePulse 1.5s ease-in-out infinite;
    }
    .live-dot.inactive { background: rgba(0,0,0,0.2); animation: none; }
    .panel-status { font-size: 0.72rem; color: var(--text-soft); font-weight: 500; }

    .video-area {
      padding: 18px;
      display: flex; flex-direction: column; align-items: center;
    }
    .video-frame {
      position: relative;
      width: 100%;
      max-width: 320px;
      margin-bottom: 14px;
    }
    video {
      width: 100%;
      border-radius: 14px;
      transform: scaleX(-1);
      background: #0a1810;
      display: block;
      aspect-ratio: 4/3;
      object-fit: cover;
    }
    .video-overlay-emotion {
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      backdrop-filter: blur(8px);
      color: white;
      border-radius: 20px;
      padding: 4px 14px;
      font-size: 0.78rem;
      font-weight: 700;
      white-space: nowrap;
      border: 1px solid rgba(255,255,255,0.25);
    }
    .face-oval {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -55%);
      width: 130px; height: 165px;
      border: 2.5px solid;
      border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
      pointer-events: none;
      transition: border-color 0.5s ease;
    }
    .scanner-line {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(201,77,106,0.85), transparent);
      animation: scan 2.5s linear infinite;
    }
    @keyframes scan { 0%{top:0;opacity:1} 90%{top:100%;opacity:0.5} 100%{top:100%;opacity:0} }

    /* Control button */
    .detect-btn {
      width: 100%;
      max-width: 280px;
      padding: 12px 22px;
      border-radius: 30px;
      border: none;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      font-family: var(--font-body);
      transition: all 0.22s;
      display: flex; align-items: center; justify-content: center; gap: 7px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .detect-btn.start {
      background: linear-gradient(135deg, rgba(201,77,106,0.15), rgba(233,117,138,0.10));
      border: 1.5px solid var(--teal-border);
      color: var(--teal);
    }
    .detect-btn.start:hover {
      background: linear-gradient(135deg, rgba(201,77,106,0.25), rgba(233,117,138,0.18));
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(201,77,106,0.22);
    }
    .detect-btn.stop {
      background: rgba(239,68,68,0.08);
      border: 1.5px solid rgba(239,68,68,0.25);
      color: #dc2626;
    }
    .detect-btn.stop:hover { background: rgba(239,68,68,0.14); }

    .status-text {
      margin-top: 8px;
      font-size: 0.72rem;
      color: var(--text-soft);
      text-align: center;
    }

    /* ── Result Column ── */
    .result-column { display: flex; flex-direction: column; gap: 1rem; }

    .no-emotion {
      flex: 1;
      background: rgba(255,255,255,0.80);
      border: 1.5px dashed var(--teal-border);
      border-radius: var(--radius-xl);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 3rem 1.5rem; text-align: center;
      box-shadow: var(--shadow-card);
    }
    .no-emotion-icon { font-size: 3rem; margin-bottom: 10px; opacity: 0.4; }
    .no-emotion-text { font-size: 0.88rem; color: var(--text-soft); line-height: 1.6; }

    /* Emotion Card */
    .emotion-main-card {
      background: rgba(255,255,255,0.88);
      backdrop-filter: blur(12px);
      border: 1.5px solid;
      border-radius: var(--radius-xl);
      padding: 1.5rem;
      text-align: center;
      box-shadow: var(--shadow-card);
      transition: all 0.5s ease;
    }
    .emotion-emoji-lg { font-size: 3.8rem; display: block; margin-bottom: 8px; }
    .emotion-name-lg {
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .emotion-advice-text { font-size: 0.82rem; color: var(--text-mid); line-height: 1.6; }

    /* Bars */
    .bars-panel {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255,255,255,0.75);
      border-radius: var(--radius-lg);
      padding: 1.2rem 1.4rem;
      box-shadow: var(--shadow-card);
    }
    .bars-title {
      font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em;
      text-transform: uppercase; color: var(--text-soft); margin-bottom: 12px;
    }
    .bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 9px; }
    .bar-label { font-size: 0.75rem; color: var(--text-mid); width: 76px; flex-shrink: 0; font-weight: 500; }
    .bar-track { flex: 1; height: 6px; background: rgba(201,77,106,0.10); border-radius: 3px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 3px; transition: width 0.6s cubic-bezier(.2,1,.3,1); }
    .bar-pct { font-size: 0.68rem; color: var(--text-soft); width: 30px; text-align: right; flex-shrink: 0; }

    /* Breathing */
    .breathing-panel {
      background: rgba(255,255,255,0.88);
      backdrop-filter: blur(12px);
      border: 1.5px solid var(--teal-border);
      border-radius: var(--radius-xl);
      padding: 1.5rem;
      text-align: center;
      box-shadow: var(--shadow-card);
    }
    .breathing-label {
      font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em;
      text-transform: uppercase; color: var(--teal); margin-bottom: 1.2rem;
    }
    .breathing-ring {
      width: 88px; height: 88px;
      border-radius: 50%;
      border: 2.5px solid var(--teal);
      margin: 0 auto 14px;
      display: flex; align-items: center; justify-content: center;
      color: var(--teal);
      font-size: 0.78rem; font-weight: 700;
      transition: all 0.3s;
    }
    .breathing-ring.inhale { animation: breathIn 4s ease-in-out infinite; box-shadow: 0 0 20px rgba(201,77,106,0.20); }
    .breathing-ring.exhale { animation: breathOut 4s ease-in-out infinite; }
    @keyframes breathIn  { 0%,100%{transform:scale(1)}   50%{transform:scale(1.35)} }
    @keyframes breathOut { 0%,100%{transform:scale(1.35)} 50%{transform:scale(1)} }
    .breathing-instruction { font-size: 0.72rem; color: var(--text-soft); }

    /* ── History ── */
    .history-panel {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255,255,255,0.75);
      border-radius: var(--radius-xl);
      overflow: hidden;
      box-shadow: var(--shadow-card);
    }
    .history-title {
      font-family: var(--font-display);
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-dark);
      padding: 1.2rem 1.4rem 0.8rem;
      border-bottom: 1px solid rgba(201,77,106,0.10);
    }
    .history-row {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 1.4rem;
      border-bottom: 1px solid rgba(201,77,106,0.07);
      transition: background 0.15s;
    }
    .history-row:last-child { border-bottom: none; }
    .history-row:hover { background: rgba(201,77,106,0.04); }
    .h-time { font-size: 0.68rem; color: var(--text-soft); width: 46px; flex-shrink: 0; }
    .h-emoji { font-size: 1.2rem; flex-shrink: 0; }
    .h-name { font-size: 0.82rem; font-weight: 600; color: var(--text-dark); flex: 1; }
    .h-bar { height: 4px; border-radius: 2px; opacity: 0.65; min-width: 20px; }

    /* Loading */
    .loading-screen {
      text-align: center; padding: 80px 20px;
      background: rgba(255,255,255,0.80);
      border-radius: var(--radius-xl);
      border: 1.5px solid rgba(255,255,255,0.75);
      box-shadow: var(--shadow-card);
    }
    .loading-orb {
      width: 56px; height: 56px;
      border: 3px solid var(--teal-border);
      border-top-color: var(--teal);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 18px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-title { font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; color: var(--text-dark); margin-bottom: 7px; }
    .loading-step { font-size: 0.82rem; color: var(--text-soft); }

    /* How it works strip */
    .how-strip {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }
    @media(max-width:700px){ .how-strip { grid-template-columns: 1fr; } }
    .how-card {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255,255,255,0.75);
      border-radius: var(--radius-lg);
      padding: 1.2rem 1.4rem;
      text-align: center;
      box-shadow: var(--shadow-card);
    }
    .how-num {
      font-family: var(--font-display);
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--teal);
      margin-bottom: 4px;
    }
    .how-title { font-weight: 700; font-size: 0.88rem; color: var(--text-dark); margin-bottom: 4px; }
    .how-sub { font-size: 0.72rem; color: var(--text-soft); line-height: 1.5; }
  `],
  template: `
    <div class="ed-page">
      <div class="ed-wrap">

        <!-- ── Header ── -->
        <header class="ed-header">
          <div class="header-copy">
            <span class="header-badge">
              <span class="badge-live"></span>
              Détection en temps réel
            </span>
            <h1 class="ed-title">
              Vos émotions,<br />
              <span class="title-accent">comprises & guidées.</span>
            </h1>
            <p class="ed-lead">
              L'IA analyse votre expression faciale en temps réel via votre caméra
              et adapte ses conseils et exercices à votre état émotionnel du moment.
            </p>
            <div class="feature-pills">
              <span class="feature-pill">📷 Analyse caméra live</span>
              <span class="feature-pill">🔒 Aucune donnée sauvegardée</span>
              <span class="feature-pill">🌬️ Exercices de respiration</span>
              <span class="feature-pill">📊 Historique de session</span>
            </div>
          </div>
          <div class="hero-ed-wrap">
            <div class="hero-ed-card">
              <div class="hero-ed-icon">🎭</div>
              <div class="hero-ed-num">7</div>
              <div class="hero-ed-lbl">Émotions détectées</div>
            </div>
          </div>
        </header>

        <!-- ── How it works ── -->
        <div class="how-strip">
          <div class="how-card">
            <div class="how-num">01</div>
            <div class="how-title">Activez la caméra</div>
            <div class="how-sub">Cliquez sur démarrer pour lancer la détection en temps réel</div>
          </div>
          <div class="how-card">
            <div class="how-num">02</div>
            <div class="how-title">IA analyse</div>
            <div class="how-sub">Les modèles détectent votre expression faciale toutes les 1,5 secondes</div>
          </div>
          <div class="how-card">
            <div class="how-num">03</div>
            <div class="how-title">Conseils personnalisés</div>
            <div class="how-sub">Recevez des conseils adaptés à votre émotion et exercices de respiration</div>
          </div>
        </div>

        <!-- Loading screen -->
        @if (loadingModels) {
          <div class="loading-screen">
            <div class="loading-orb"></div>
            <div class="loading-title">Chargement des modèles IA...</div>
            <div class="loading-step">{{ loadingStep }}</div>
          </div>
        } @else {

          <!-- ── Quick Stats ── -->
          <div class="stats-strip">
            <div class="stat-mini">
              <div class="stat-mini-icon">📊</div>
              <div class="stat-mini-val">{{ history.length }}</div>
              <div class="stat-mini-lbl">Analyses session</div>
            </div>
            <div class="stat-mini">
              <div class="stat-mini-icon">{{ currentEmotion?.emoji || '😐' }}</div>
              <div class="stat-mini-val">{{ currentEmotion?.dominant || '—' }}</div>
              <div class="stat-mini-lbl">Émotion actuelle</div>
            </div>
            <div class="stat-mini">
              <div class="stat-mini-icon">🎯</div>
              <div class="stat-mini-val">{{ isDetecting ? 'Actif' : 'Inactif' }}</div>
              <div class="stat-mini-lbl">Statut</div>
            </div>
            <div class="stat-mini">
              <div class="stat-mini-icon">🌬️</div>
              <div class="stat-mini-val">{{ currentEmotion?.breathingEx ? 'Oui' : 'Non' }}</div>
              <div class="stat-mini-lbl">Respiration guidée</div>
            </div>
          </div>

          <!-- ── Section Meta ── -->
          <div class="section-meta">
            <span class="section-chip">Détecteur Émotionnel</span>
            <div class="section-line"></div>
          </div>

          <!-- ── Main Grid ── -->
          <div class="ed-grid">

            <!-- Camera Panel -->
            <div class="camera-panel">
              <div class="camera-panel-header">
                <div class="panel-title">
                  <div class="live-dot" [class.inactive]="!isDetecting"></div>
                  Caméra Live
                </div>
                <div class="panel-status">{{ statusMsg }}</div>
              </div>
              <div class="video-area">
                <div class="video-frame">
                  <video #videoEl autoplay playsinline muted></video>
                  @if (isDetecting) { <div class="scanner-line"></div> }
                  @if (isDetecting && currentEmotion) {
                    <div class="video-overlay-emotion" [style.background]="currentEmotion.color + 'cc'">
                      {{ currentEmotion.emoji }} {{ currentEmotion.dominant }}
                    </div>
                  }
                  <div class="face-oval"
                    [style.border-color]="isDetecting ? (currentEmotion?.color || '#3a9e8a') : 'rgba(58,158,138,0.25)'">
                  </div>
                </div>
                <button class="detect-btn" [class.start]="!isDetecting" [class.stop]="isDetecting"
                  (click)="toggleDetection()">
                  {{ isDetecting ? '⏹ Arrêter la détection' : '▶ Démarrer la détection' }}
                </button>
                <div class="status-text">{{ statusMsg }}</div>
              </div>
            </div>

            <!-- Result Column -->
            <div class="result-column">
              @if (!currentEmotion) {
                <div class="no-emotion">
                  <div class="no-emotion-icon">🎭</div>
                  <div class="no-emotion-text">
                    Démarrez la détection pour que l'IA<br />analyse votre état émotionnel
                  </div>
                </div>
              } @else {
                <div class="emotion-main-card"
                  [style.background]="'rgba(255,255,255,0.88)'"
                  [style.border-color]="currentEmotion.color + '55'">
                  <span class="emotion-emoji-lg">{{ currentEmotion.emoji }}</span>
                  <div class="emotion-name-lg" [style.color]="currentEmotion.color">{{ currentEmotion.dominant }}</div>
                  <div class="emotion-advice-text">{{ currentEmotion.advice }}</div>
                </div>
                <div class="bars-panel">
                  <div class="bars-title">Intensité par émotion</div>
                  @for (bar of getEmotionBars(); track bar.label) {
                    <div class="bar-row">
                      <span class="bar-label">{{ bar.label }}</span>
                      <div class="bar-track">
                        <div class="bar-fill" [style.width]="bar.pct + '%'" [style.background]="bar.color"></div>
                      </div>
                      <span class="bar-pct">{{ bar.pct }}%</span>
                    </div>
                  }
                </div>
                @if (currentEmotion.breathingEx) {
                  <div class="breathing-panel">
                    <div class="breathing-label">🌬️ Exercice de respiration guidé</div>
                    <div class="breathing-ring" [class.inhale]="breathPhase === 'inhale'" [class.exhale]="breathPhase === 'exhale'">
                      {{ breathPhase === 'inhale' ? 'Inspirez' : 'Expirez' }}
                    </div>
                    <div class="breathing-instruction">4 secondes inspirer · 4 secondes expirer</div>
                  </div>
                }
              }
            </div>
          </div>

          <!-- ── History ── -->
          @if (history.length > 0) {
            <div class="section-meta">
              <span class="section-chip">Historique</span>
              <div class="section-line"></div>
            </div>
            <div class="history-panel">
              <div class="history-title">📜 Historique de session</div>
              @for (h of history.slice().reverse(); track h.time) {
                <div class="history-row">
                  <span class="h-time">{{ h.time }}</span>
                  <span class="h-emoji">{{ h.emoji }}</span>
                  <span class="h-name">{{ h.emotion }}</span>
                  <div class="h-bar" [style.background]="h.color" [style.width]="h.score + 'px'"></div>
                  <span style="font-size:0.68rem;color:var(--text-soft);width:30px;text-align:right">{{ h.score }}%</span>
                </div>
              }
            </div>
          }
        }

      </div>
    </div>
  `
})
export class EmotionDetectorComponent implements OnInit, OnDestroy {
  @ViewChild('videoEl') videoRef!: ElementRef<HTMLVideoElement>;

  loadingModels = true;
  loadingStep   = 'Initialisation...';
  isDetecting   = false;
  statusMsg     = 'Appuyez sur démarrer pour analyser vos émotions';
  currentEmotion: EmotionResult | null = null;
  breathPhase   = 'inhale';
  history: { time: string; emotion: string; emoji: string; color: string; score: number }[] = [];

  private stream: MediaStream | null = null;
  private detectionInterval: any = null;
  private breathInterval: any = null;
  private faceapi: any = null;

  private emotionMap: Record<string, { emoji: string; color: string; advice: string; breathingEx: boolean }> = {
    happy:     { emoji: '😊', color: '#10b981', advice: 'Vous rayonnez de bonheur ! Ce bien-être est excellent pour bébé. Profitez de cet instant précieux.', breathingEx: false },
    neutral:   { emoji: '😐', color: '#6366f1', advice: 'Vous semblez calme et sereine. Un bon état pour se reposer et prendre soin de vous.', breathingEx: false },
    surprised: { emoji: '😮', color: '#f59e0b', advice: 'Une petite surprise ? Respirez doucement. Les émotions intenses méritent un moment de pause.', breathingEx: true },
    sad:       { emoji: '😢', color: '#3b82f6', advice: 'Il est normal d\'avoir des moments de tristesse pendant la grossesse. N\'hésitez pas à en parler à votre médecin.', breathingEx: true },
    angry:     { emoji: '😠', color: '#ef4444', advice: 'Vous semblez tendue. Essayez cet exercice de respiration pour retrouver la sérénité.', breathingEx: true },
    fearful:   { emoji: '😨', color: '#8b5cf6', advice: 'L\'anxiété est fréquente pendant la grossesse. La respiration guidée peut vous aider.', breathingEx: true },
    disgusted: { emoji: '🤢', color: '#84cc16', advice: 'Nausées ou inconfort ? Respirez par le nez, restez hydratée et reposez-vous.', breathingEx: false },
  };

  constructor(private zone: NgZone) {}

  async ngOnInit(): Promise<void> {
    await this.loadModels();
    this.startBreathingCycle();
  }

  private async loadModels(): Promise<void> {
    try {
      this.loadingStep = 'Chargement de face-api.js...';
      const faceapi = await import('face-api.js' as any);
      this.faceapi = faceapi;
      this.loadingStep = 'Chargement détecteur de visage...';
      await faceapi.nets.tinyFaceDetector.loadFromUri('/assets/models');
      this.loadingStep = 'Chargement détecteur d\'expressions...';
      await faceapi.nets.faceExpressionNet.loadFromUri('/assets/models');
      this.loadingModels = false;
      this.statusMsg = '✅ Prêt — Appuyez sur démarrer';
    } catch (e) {
      this.loadingModels = false;
      this.statusMsg = '⚠️ Modèles non trouvés — placez-les dans /assets/models';
    }
  }

  async toggleDetection(): Promise<void> {
    if (this.isDetecting) this.stopDetection();
    else await this.startDetection();
  }

  private async startDetection(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      await new Promise(r => setTimeout(r, 100));
      if (this.videoRef?.nativeElement) {
        this.videoRef.nativeElement.srcObject = this.stream;
        await this.videoRef.nativeElement.play();
      }
      this.isDetecting = true;
      this.statusMsg = '📷 Analyse en cours...';
      this.detectionInterval = setInterval(() => this.detectEmotion(), 1500);
    } catch (e) {
      this.statusMsg = '❌ Impossible d\'accéder à la caméra';
    }
  }

  private stopDetection(): void {
    this.isDetecting = false;
    this.statusMsg = 'Détection arrêtée';
    clearInterval(this.detectionInterval);
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
  }

  private async detectEmotion(): Promise<void> {
    const video = this.videoRef?.nativeElement;
    if (!video || !this.faceapi) return;
    try {
      const opts = new this.faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 });
      const detection = await this.faceapi.detectSingleFace(video, opts).withFaceExpressions();
      if (detection) {
        const expressions = detection.expressions;
        const dominant = Object.entries(expressions).reduce((a: any, b: any) => b[1] > a[1] ? b : a)[0] as string;
        const map = this.emotionMap[dominant] || this.emotionMap['neutral'];
        this.zone.run(() => {
          this.currentEmotion = {
            dominant: this.translateEmotion(dominant), emoji: map.emoji, color: map.color,
            scores: Object.fromEntries(Object.entries(expressions).map(([k, v]) => [k, Math.round((v as number) * 100)])),
            advice: map.advice, breathingEx: map.breathingEx
          };
          const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          if (this.history.length === 0 || this.history[this.history.length - 1].time !== now) {
            if (this.history.length >= 20) this.history.shift();
            this.history.push({ time: now, emotion: this.currentEmotion.dominant, emoji: map.emoji, color: map.color, score: Math.round((expressions[dominant] as number) * 100) });
          }
        });
      } else {
        this.zone.run(() => { this.statusMsg = '🔍 Positionnez votre visage dans le cadre...'; });
      }
    } catch (e) {}
  }

  private translateEmotion(e: string): string {
    const tr: Record<string, string> = { happy: 'Heureuse', neutral: 'Neutre', surprised: 'Surprise', sad: 'Triste', angry: 'Stressée', fearful: 'Anxieuse', disgusted: 'Inconfort' };
    return tr[e] || e;
  }

  getEmotionBars(): { label: string; pct: number; color: string }[] {
    if (!this.currentEmotion?.scores) return [];
    return Object.entries(this.currentEmotion.scores)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([k, v]) => ({ label: this.translateEmotion(k), pct: v as number, color: this.emotionMap[k]?.color || '#3a9e8a' }));
  }

  private startBreathingCycle(): void {
    this.breathInterval = setInterval(() => {
      this.breathPhase = this.breathPhase === 'inhale' ? 'exhale' : 'inhale';
    }, 4000);
  }

  ngOnDestroy(): void {
    this.stopDetection();
    clearInterval(this.breathInterval);
  }
}