import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Maternity {
  id: number;
  name: string;
  type: 'maternite' | 'hopital' | 'clinique';
  address: string;
  phone: string;
  lat: number;
  lng: number;
  rating: number;
  distance?: number;
  open24h: boolean;
  emergency: boolean;
  specialties?: string[];
  beds?: number;
  founded?: number;
}

@Component({
  selector: 'app-maternities',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
      min-height: 100vh;
      position: relative;
      background: var(--cream);
    }
    .page::before {
      content: '';
      position: fixed; inset: 0;
      background-image: url('/assets/img/mother_pages_background-3.png');
      background-size: cover;
      background-position: center;
      z-index: -1;
    }
    .page::after {
      content: '';
      position: fixed; inset: 0;
      background: rgba(247,237,228,0.85);
      z-index: -1;
    }

    .wrap {
      position: relative; z-index: 1;
      max-width: 1400px;
      margin: 0 auto;
      padding: 3rem 2.5rem 5rem;
    }

    /* ── HERO SPLIT ── */
    .hero {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      border-radius: 28px;
      overflow: hidden;
      margin-bottom: 2.5rem;
      box-shadow: 0 4px 40px rgba(201,77,106,0.18);
    }
    .hero-left {
      background: linear-gradient(150deg, #1e1215 0%, #3d1a28 60%, #5c2038 100%);
      padding: 3rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
    }
    .hero-left::before {
      content: '🏥';
      position: absolute;
      bottom: -20px; right: -20px;
      font-size: 140px;
      opacity: 0.06;
      line-height: 1;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(201,77,106,0.25);
      border: 1px solid rgba(201,77,106,0.4);
      color: var(--rose-light);
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      padding: 5px 14px;
      border-radius: 20px;
      width: fit-content;
      margin-bottom: 1.5rem;
    }
    .hero-title {
      font-family: var(--font-display);
      font-size: clamp(2rem, 3.5vw, 3rem);
      font-weight: 600;
      color: #fff;
      line-height: 1.15;
      margin-bottom: 1rem;
    }
    .hero-title em {
      font-style: italic;
      color: var(--rose-light);
    }
    .hero-sub {
      font-size: 0.88rem;
      color: rgba(255,255,255,0.55);
      line-height: 1.7;
      margin-bottom: 2rem;
    }
    .sos-btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: linear-gradient(135deg, #e8436c, #c94d6a);
      color: white;
      border: none;
      border-radius: 14px;
      padding: 14px 24px;
      font-size: 0.9rem;
      font-weight: 700;
      font-family: var(--font-body);
      cursor: pointer;
      width: fit-content;
      letter-spacing: 0.03em;
      box-shadow: 0 4px 20px rgba(232,67,108,0.4);
      animation: pulse-sos 2.5s infinite;
      transition: transform 0.2s;
    }
    .sos-btn:hover { transform: translateY(-2px); }
    @keyframes pulse-sos {
      0%,100% { box-shadow: 0 4px 20px rgba(232,67,108,0.4); }
      50%      { box-shadow: 0 4px 30px rgba(232,67,108,0.7); }
    }

    .hero-right {
      background: rgba(255,255,255,0.88);
      backdrop-filter: blur(16px);
      padding: 2.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
    }
    .stat-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 0.5rem;
    }
    .stat-box {
      background: var(--cream);
      border-radius: 14px;
      padding: 14px 16px;
      text-align: center;
      border: 1px solid rgba(201,77,106,0.15);
    }
    .stat-num {
      font-family: var(--font-display);
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--rose);
      line-height: 1;
      display: block;
    }
    .stat-lbl {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-soft);
      font-weight: 600;
      margin-top: 4px;
      display: block;
    }

    /* Search & Filters */
    .controls {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .search-wrap {
      background: rgba(255,255,255,0.82);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255,255,255,0.75);
      border-radius: 24px;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 2px 16px rgba(30,18,21,0.08);
    }
    .search-icon { color: var(--text-soft); flex-shrink: 0; font-size: 16px; }
    .search-input {
      background: transparent; border: none; outline: none;
      color: var(--text-dark); font-size: 0.9rem;
      font-family: var(--font-body); flex: 1;
    }
    .search-input::placeholder { color: var(--text-soft); }
    .locate-btn {
      background: var(--rose-light);
      border: 1.5px solid rgba(201,77,106,0.3);
      color: var(--rose);
      border-radius: 20px;
      padding: 7px 16px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      font-family: var(--font-body);
      white-space: nowrap;
      transition: all 0.2s;
    }
    .locate-btn:hover { background: var(--rose); color: white; }

    .filter-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .f-btn {
      padding: 7px 18px;
      border-radius: 20px;
      border: 1.5px solid rgba(201,77,106,0.2);
      background: rgba(255,255,255,0.7);
      color: var(--text-mid);
      font-size: 0.78rem;
      font-weight: 600;
      font-family: var(--font-body);
      cursor: pointer;
      transition: all 0.2s;
      backdrop-filter: blur(8px);
    }
    .f-btn:hover { border-color: var(--rose); color: var(--rose); }
    .f-btn.active { background: var(--rose); color: white; border-color: var(--rose); box-shadow: 0 3px 12px rgba(201,77,106,0.3); }

    /* Section meta */
    .section-meta {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 1.5rem;
    }
    .section-chip {
      font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em;
      text-transform: uppercase; color: var(--rose);
      background: var(--rose-light);
      border: 1.5px solid rgba(201,77,106,0.25);
      padding: 3px 14px; border-radius: 20px; white-space: nowrap;
    }
    .section-line {
      flex: 1; height: 1px;
      background: linear-gradient(90deg, rgba(201,77,106,0.25), transparent);
    }
    .result-count { font-size: 0.78rem; color: var(--text-soft); font-weight: 600; }

    /* Grid */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
      gap: 1.2rem;
    }

    /* Cards */
    .mat-card {
      background: rgba(255,255,255,0.88);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255,255,255,0.75);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 2px 16px rgba(30,18,21,0.08);
      transition: transform 0.25s ease, box-shadow 0.25s ease;
      animation: cardIn 0.5s ease both;
    }
    .mat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 32px rgba(201,77,106,0.15);
    }
    @keyframes cardIn {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    .card-stripe {
      height: 5px;
      background: linear-gradient(90deg, var(--rose), var(--peach));
    }
    .card-stripe.hopital { background: linear-gradient(90deg, #3a8fb5, #5b9dca); }
    .card-stripe.clinique { background: linear-gradient(90deg, #10b981, #34d399); }
    .card-stripe.maternite { background: linear-gradient(90deg, #c94d6a, #e8436c); }

    .card-inner { padding: 1.4rem; }

    .card-top {
      display: flex; align-items: flex-start;
      justify-content: space-between; gap: 8px;
      margin-bottom: 10px;
    }
    .type-icon {
      width: 40px; height: 40px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; flex-shrink: 0;
    }
    .type-icon.maternite { background: #fff0f5; }
    .type-icon.hopital   { background: #eff6ff; }
    .type-icon.clinique  { background: #f0fff4; }

    .mat-name {
      font-family: var(--font-display);
      font-size: 1.05rem; font-weight: 600;
      color: var(--text-dark); line-height: 1.3;
      flex: 1;
    }

    .type-badge {
      font-size: 0.6rem; font-weight: 700;
      padding: 3px 10px; border-radius: 10px;
      letter-spacing: 0.08em; text-transform: uppercase;
      flex-shrink: 0;
    }
    .badge-maternite { background: #fff0f5; color: #c94d6a; border: 1px solid rgba(201,77,106,0.2); }
    .badge-hopital   { background: #eff6ff; color: #3a8fb5; border: 1px solid rgba(58,143,181,0.2); }
    .badge-clinique  { background: #f0fff4; color: #10b981; border: 1px solid rgba(16,185,129,0.2); }

    .mat-address {
      font-size: 0.8rem; color: var(--text-soft);
      margin-bottom: 10px; display: flex; align-items: center; gap: 5px;
    }

    .specialties {
      display: flex; flex-wrap: wrap; gap: 5px;
      margin-bottom: 12px;
    }
    .spec-tag {
      font-size: 0.65rem; font-weight: 500;
      color: var(--text-mid);
      background: var(--cream);
      border: 1px solid rgba(201,77,106,0.15);
      padding: 3px 9px; border-radius: 8px;
    }

    .card-meta {
      display: flex; align-items: center;
      gap: 8px; flex-wrap: wrap;
      padding: 10px 0;
      border-top: 1px solid rgba(201,77,106,0.1);
      border-bottom: 1px solid rgba(201,77,106,0.1);
      margin-bottom: 14px;
    }
    .stars { color: #d97b58; font-size: 11px; }
    .rating-val { font-size: 0.78rem; font-weight: 600; color: var(--text-dark); }
    .dist { font-size: 0.72rem; color: var(--text-soft); }
    .badge-24  { background: #d1fae5; color: #065f46; font-size: 0.62rem; padding: 2px 7px; border-radius: 6px; font-weight: 700; letter-spacing: 0.05em; }
    .badge-urg { background: #fee2e2; color: #991b1b; font-size: 0.62rem; padding: 2px 7px; border-radius: 6px; font-weight: 700; letter-spacing: 0.05em; }
    .dot { color: var(--rose-light); }

    .card-actions { display: flex; gap: 8px; }
    .btn-call {
      flex: 1; padding: 10px;
      background: linear-gradient(135deg, #e8436c, #c94d6a);
      color: white; border: none; border-radius: 10px;
      font-size: 0.8rem; font-weight: 600;
      font-family: var(--font-body);
      cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center;
      justify-content: center; gap: 5px;
    }
    .btn-call:hover { box-shadow: 0 4px 16px rgba(201,77,106,0.4); transform: translateY(-1px); }
    .btn-map {
      flex: 1; padding: 10px;
      background: var(--cream);
      color: var(--text-mid);
      border: 1.5px solid rgba(201,77,106,0.2);
      border-radius: 10px;
      font-size: 0.8rem; font-weight: 600;
      font-family: var(--font-body);
      cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center;
      justify-content: center; gap: 5px;
    }
    .btn-map:hover { border-color: var(--rose); color: var(--rose); }

    .empty {
      grid-column: 1/-1;
      text-align: center; padding: 4rem;
      color: var(--text-soft);
    }
    .empty-icon { font-size: 48px; margin-bottom: 12px; display: block; }

    @media (max-width: 800px) {
      .hero { grid-template-columns: 1fr; }
      .wrap { padding: 1.5rem 1rem 3rem; }
    }
  `],
  template: `
    <div class="page">
      <div class="wrap">

        <!-- HERO -->
        <div class="hero">
          <div class="hero-left">
            <div>
              <div class="hero-badge">🌸 Réseau de Soin</div>
              <h1 class="hero-title">
                Maternités &<br /><em>Établissements</em><br />de Santé
              </h1>
              <p class="hero-sub">
                Trouvez les meilleures maternités, hôpitaux et cliniques près de vous.
                Triés par distance et disponibilité.
              </p>
            </div>
            <button class="sos-btn" (click)="callSOS()">
              <span>🚨</span>
              <span>URGENCE — Composer le 190</span>
            </button>
          </div>
          <div class="hero-right">
            <div class="stat-row">
              <div class="stat-box">
                <span class="stat-num">10</span>
                <span class="stat-lbl">Établissements</span>
              </div>
              <div class="stat-box">
                <span class="stat-num">7</span>
                <span class="stat-lbl">Urgences 24h</span>
              </div>
              <div class="stat-box">
                <span class="stat-num">3</span>
                <span class="stat-lbl">Maternités</span>
              </div>
              <div class="stat-box">
                <span class="stat-num">5</span>
                <span class="stat-lbl">Cliniques</span>
              </div>
            </div>
            <div style="font-size:0.82rem;color:var(--text-soft);background:rgba(201,77,106,0.08);border-radius:12px;padding:12px 16px;border:1px solid rgba(201,77,106,0.15)">
              💡 <strong style="color:var(--text-dark)">Conseil :</strong>
              Activez la géolocalisation pour trier les établissements par distance et trouver le plus proche en cas d'urgence.
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="controls">
          <div class="search-wrap">
            <span class="search-icon">🔍</span>
            <input class="search-input" [(ngModel)]="searchQuery"
                   placeholder="Rechercher par nom, ville ou spécialité..."
                   (input)="filterList()" />
            <button class="locate-btn" (click)="locateMe()">📍 Me localiser</button>
          </div>
          <div class="filter-row">
            <button class="f-btn" [class.active]="activeFilter==='all'"       (click)="setFilter('all')">Tous ({{maternities.length}})</button>
            <button class="f-btn" [class.active]="activeFilter==='maternite'" (click)="setFilter('maternite')">🏥 Maternités</button>
            <button class="f-btn" [class.active]="activeFilter==='hopital'"   (click)="setFilter('hopital')">🏨 Hôpitaux</button>
            <button class="f-btn" [class.active]="activeFilter==='clinique'"  (click)="setFilter('clinique')">💊 Cliniques</button>
            <button class="f-btn" [class.active]="activeFilter==='urgence'"   (click)="setFilter('urgence')">🔴 Urgences 24h</button>
          </div>
        </div>

        <div class="section-meta">
          <span class="section-chip">Établissements de santé</span>
          <div class="section-line"></div>
          <span class="result-count">{{ filteredList.length }} résultats</span>
        </div>

        <!-- Grid -->
        <div class="grid">
          @for (m of filteredList; track m.id) {
            <div class="mat-card">
              <div class="card-stripe" [class]="m.type"></div>
              <div class="card-inner">
                <div class="card-top">
                  <div class="type-icon" [class]="m.type">
                    {{ m.type === 'maternite' ? '🏥' : m.type === 'hopital' ? '🏨' : '💊' }}
                  </div>
                  <div class="mat-name">{{ m.name }}</div>
                  <span class="type-badge" [class]="'badge-' + m.type">
                    {{ m.type === 'maternite' ? 'Maternité' : m.type === 'hopital' ? 'Hôpital' : 'Clinique' }}
                  </span>
                </div>
                <div class="mat-address">📍 {{ m.address }}</div>
                @if (m.specialties?.length) {
                  <div class="specialties">
                    @for (s of m.specialties; track s) {
                      <span class="spec-tag">{{ s }}</span>
                    }
                  </div>
                }
                <div class="card-meta">
                  <span class="stars">{{ getStars(m.rating) }}</span>
                  <span class="rating-val">{{ m.rating }}/5</span>
                  @if (m.distance !== undefined) {
                    <span class="dot">·</span>
                    <span class="dist">📏 {{ m.distance }} km</span>
                  }
                  @if (m.beds) {
                    <span class="dot">·</span>
                    <span class="dist">🛏 {{ m.beds }} lits</span>
                  }
                  @if (m.open24h) { <span class="badge-24">24h/24</span> }
                  @if (m.emergency) { <span class="badge-urg">Urgences</span> }
                </div>
                <div class="card-actions">
                  <button class="btn-call" (click)="call(m)">📞 Appeler</button>
                  <button class="btn-map"  (click)="openMaps(m)">🗺️ Itinéraire</button>
                </div>
              </div>
            </div>
          }
          @if (filteredList.length === 0) {
            <div class="empty">
              <span class="empty-icon">🏥</span>
              <p>Aucun établissement trouvé pour cette recherche</p>
            </div>
          }
        </div>

      </div>
    </div>
  `
})
export class MaternitiesComponent implements OnInit {
  userLocation: { lat: number; lng: number } | null = null;
  searchQuery = '';
  activeFilter = 'all';
  filteredList: Maternity[] = [];

  maternities: Maternity[] = [
    { id:1,  name:'Maternité de la Rabta',       type:'maternite', address:'Rue Jabbari, Tunis',           phone:'+216 71 560 300', lat:36.8189, lng:10.1729, rating:4.1, open24h:true,  emergency:true,  specialties:['Grossesse à risque','Néonatologie','Échographie'], beds:120, founded:1944 },
    { id:2,  name:'Clinique El Azher',            type:'clinique',  address:'Avenue de la Liberté, Tunis', phone:'+216 71 780 000', lat:36.8297, lng:10.1722, rating:4.5, open24h:true,  emergency:true,  specialties:['Obstétrique','Pédiatrie','Chirurgie'], beds:80, founded:1990 },
    { id:3,  name:'Hôpital Charles Nicolle',      type:'hopital',   address:'Boulevard 9 Avril, Tunis',    phone:'+216 71 578 000', lat:36.8225, lng:10.1800, rating:3.9, open24h:true,  emergency:true,  specialties:['Urgences','Cardiologie','Neurologie'], beds:350, founded:1930 },
    { id:4,  name:'Clinique Taoufik',             type:'clinique',  address:'Lac 2, Tunis',                phone:'+216 71 963 000', lat:36.8432, lng:10.2310, rating:4.6, open24h:false, emergency:false, specialties:['Maternité','FIV','Gynécologie'], beds:60, founded:2002 },
    { id:5,  name:'Clinique Les Jasmins',         type:'clinique',  address:'La Marsa, Tunis',             phone:'+216 71 744 000', lat:36.8827, lng:10.3237, rating:4.3, open24h:true,  emergency:true,  specialties:['Accouchement','Pédiatrie','Anesthésie'], beds:70, founded:1998 },
    { id:6,  name:'Maternité Sahloul',            type:'maternite', address:'Sahloul, Sousse',             phone:'+216 73 369 000', lat:35.8358, lng:10.6110, rating:4.0, open24h:true,  emergency:true,  specialties:['Obstétrique','Prématurité','Réanimation'], beds:100, founded:1985 },
    { id:7,  name:'Clinique El Manzah',           type:'clinique',  address:'El Manzah, Tunis',            phone:'+216 71 704 000', lat:36.8521, lng:10.1893, rating:4.4, open24h:false, emergency:false, specialties:['Gynécologie','Endoscopie','Échographie'], beds:45, founded:2005 },
    { id:8,  name:'Hôpital Militaire de Tunis',   type:'hopital',   address:'Montfleury, Tunis',           phone:'+216 71 391 133', lat:36.8098, lng:10.1642, rating:4.2, open24h:true,  emergency:true,  specialties:['Chirurgie','Urgences','Cardiologie'], beds:280, founded:1950 },
    { id:9,  name:'Clinique Hannibal',            type:'clinique',  address:'Les Berges du Lac, Tunis',    phone:'+216 71 965 000', lat:36.8382, lng:10.2258, rating:4.7, open24h:true,  emergency:false, specialties:['Maternité','Néonatologie','IRM'], beds:90, founded:1995 },
    { id:10, name:'Centre Maternité de Sfax',     type:'maternite', address:'Route Menzel Chaker, Sfax',   phone:'+216 74 240 300', lat:34.7398, lng:10.7600, rating:3.8, open24h:true,  emergency:true,  specialties:['Accouchement naturel','Suivi grossesse','Nutrition'], beds:80, founded:1975 },
  ];

  ngOnInit(): void { this.filteredList = [...this.maternities]; this.locateMe(); }

  locateMe(): void {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      this.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      this.calcDistances();
    }, () => {});
  }

  private calcDistances(): void {
    if (!this.userLocation) return;
    this.maternities.forEach(m => {
      const R = 6371, dLat = this.toRad(m.lat - this.userLocation!.lat), dLng = this.toRad(m.lng - this.userLocation!.lng);
      const a = Math.sin(dLat/2)**2 + Math.cos(this.toRad(this.userLocation!.lat)) * Math.cos(this.toRad(m.lat)) * Math.sin(dLng/2)**2;
      m.distance = parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1));
    });
    this.maternities.sort((a,b) => (a.distance||0) - (b.distance||0));
    this.filterList();
  }

  private toRad(v: number): number { return v * Math.PI / 180; }
  setFilter(f: string): void { this.activeFilter = f; this.filterList(); }
  filterList(): void {
    this.filteredList = this.maternities.filter(m => {
      const matchSearch = !this.searchQuery || m.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        m.address.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        m.specialties?.some(s => s.toLowerCase().includes(this.searchQuery.toLowerCase()));
      const matchFilter = this.activeFilter === 'all' ||
        (this.activeFilter === 'urgence' ? m.open24h && m.emergency : m.type === this.activeFilter);
      return matchSearch && matchFilter;
    });
  }
  call(m: Maternity): void { window.open(`tel:${m.phone}`); }
  openMaps(m: Maternity): void { window.open(`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`, '_blank'); }
  callSOS(): void { window.open('tel:190'); }
  getStars(r: number): string { return '★'.repeat(Math.round(r)) + '☆'.repeat(5-Math.round(r)); }
}