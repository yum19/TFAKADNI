import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { FetalMilestone } from '../../../../core/models/pregnancy.model';
import { BabyName, BabyNamePrefs, BabyNameService } from '../../../../core/services/baby-name.service';
import { FetalMilestoneService } from '../../../../core/services/fetal-milestone.service';
import { PregnancyService } from '../../../../core/services/pregnancy.service';
import { environment } from '../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-femme-fetal',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatDividerModule, MatSelectModule, FormsModule,
  ],
  templateUrl: './fetal.html',
  styleUrl: './fetal.scss',
  encapsulation: ViewEncapsulation.None,
})
export class FetalComponent implements OnInit {

  Math = Math;
  currentMilestone: FetalMilestone | null = null;
  allMilestones: FetalMilestone[] = [];
  currentWeek      = 0;
  selectedWeek     = 0;
  loading          = true;
  loadingMilestone = false;
  isSharedPartner  = false;
  weeks: number[]  = Array.from({length: 40}, (_, i) => i + 1);

  // ── Baby Name AI ──────────────────────────────────────
  showNamePopup  = false;
  nameLoading    = false;
  nameError      = '';
  nameCopied     = false;
  nameResults: BabyName[] = [];
  favoriteNames: string[] = [];

  namePrefs: BabyNamePrefs = {
    gender:  'girl',
    origin:  'Arabic',
    style:   'Classic',
    letter:  '',
    meaning: '',
  };

  readonly ORIGINS = [
    'Arabic', 'French', 'English', 'Hebrew', 'Latin',
    'Persian', 'Turkish', 'Spanish', 'Italian', 'Greek', 'No preference'
  ];
  readonly STYLES = [
    'Classic', 'Modern', 'Short', 'Rare & Unique',
    'Romantic', 'Strong', 'No preference'
  ];
  readonly LETTERS = [
    'No preference',
    'A','B','C','D','E','F','G','H','I','J','K','L','M',
    'N','O','P','Q','R','S','T','U','V','W','X','Y','Z'
  ];

  // ── Baby Portrait AI ──────────────────────────────────
  showPortraitPopup = false;
  portraitLoading   = false;
  portraitCopied    = false;
  portraitError     = '';

  // Portrait structuré (JSON parsé)
  portrait: {
    eyes: string; hair: string; skin: string; face: string;
    hands: string; dream: string; message: string; poem: string;
  } | null = null;

  portraitForm = {
    momEyeColor:  'Brown',
    momHairColor: 'Dark brown',
    momSkinTone:  'Medium',
    momFeatures:  '',
    dadEyeColor:  'Brown',
    dadHairColor: 'Dark brown',
    dadSkinTone:  'Medium',
    dadFeatures:  '',
  };

  readonly EYE_COLORS  = ['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Dark brown', 'Amber'];
  readonly HAIR_COLORS = ['Dark brown', 'Black', 'Blonde', 'Light brown', 'Red', 'Auburn', 'Chestnut'];
  readonly SKIN_TONES  = ['Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Brown', 'Dark'];

  // Couleurs avatar selon sélection
  getEyeColorHex(color: string): string {
    const map: Record<string, string> = {
      'Brown': '#6b3a2a', 'Blue': '#4a90d9', 'Green': '#4a8c4a',
      'Hazel': '#7d5a2a', 'Gray': '#7a8a99', 'Dark brown': '#3d1f0f', 'Amber': '#c17f2a'
    };
    return map[color] || '#6b3a2a';
  }

  getHairColorHex(color: string): string {
    const map: Record<string, string> = {
      'Dark brown': '#3d1f0f', 'Black': '#1a1008', 'Blonde': '#d4a843',
      'Light brown': '#8b5e3c', 'Red': '#b03a2a', 'Auburn': '#8b2a1a', 'Chestnut': '#5c2d1e'
    };
    return map[color] || '#3d1f0f';
  }

  getSkinColorHex(tone: string): string {
    const map: Record<string, string> = {
      'Fair': '#fde8d8', 'Light': '#f5d5b8', 'Medium': '#e8b898',
      'Olive': '#d4a070', 'Tan': '#c8895a', 'Brown': '#a0623a', 'Dark': '#7a3f20'
    };
    return map[tone] || '#e8b898';
  }

  // Couleur blended des yeux bébé (mix mom + dad)
  get babyEyeColor(): string {
    const mom = this.getEyeColorHex(this.portraitForm.momEyeColor);
    const dad = this.getEyeColorHex(this.portraitForm.dadEyeColor);
    return this.blendColors(mom, dad);
  }

  get babyHairColor(): string {
    const mom = this.getHairColorHex(this.portraitForm.momHairColor);
    const dad = this.getHairColorHex(this.portraitForm.dadHairColor);
    return this.blendColors(mom, dad);
  }

  get babySkinColor(): string {
    const mom = this.getSkinColorHex(this.portraitForm.momSkinTone);
    const dad = this.getSkinColorHex(this.portraitForm.dadSkinTone);
    return this.blendColors(mom, dad);
  }

  private blendColors(hex1: string, hex2: string): string {
    const r1 = parseInt(hex1.slice(1,3), 16);
    const g1 = parseInt(hex1.slice(3,5), 16);
    const b1 = parseInt(hex1.slice(5,7), 16);
    const r2 = parseInt(hex2.slice(1,3), 16);
    const g2 = parseInt(hex2.slice(3,5), 16);
    const b2 = parseInt(hex2.slice(5,7), 16);
    const r = Math.round((r1 + r2) / 2).toString(16).padStart(2,'0');
    const g = Math.round((g1 + g2) / 2).toString(16).padStart(2,'0');
    const b = Math.round((b1 + b2) / 2).toString(16).padStart(2,'0');
    return `#${r}${g}${b}`;
  }

  constructor(
    private fetalService:     FetalMilestoneService,
    private pregnancyService: PregnancyService,
    private babyNameService:  BabyNameService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.pregnancyService.getMyPregnancies().subscribe({
      next: (list) => {
        const active = list.find(p => p.status === 'ACTIVE') || list[list.length - 1];
        if (active) {
          this.isSharedPartner = active.isSharedPartner || false;
          const start = new Date(active.lmpDate);
          const diff  = Math.floor((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
          this.currentWeek  = Math.min(Math.max(diff, 1), 40);
          this.selectedWeek = this.currentWeek;
          this.loadMilestone(this.currentWeek);
          this.loadAllMilestones();
        } else {
          this.loading = false;
        }
      },
      error: () => { this.loading = false; }
    });
  }

  loadMilestone(week: number) {
    this.loadingMilestone = true;
    this.fetalService.getByWeek(week).subscribe({
      next:  (m) => { this.currentMilestone = m;    this.loadingMilestone = false; this.loading = false; },
      error: ()  => { this.currentMilestone = null; this.loadingMilestone = false; this.loading = false; }
    });
  }

  loadAllMilestones() {
    this.fetalService.getAll().subscribe({
      next:  (list) => { this.allMilestones = list.sort((a, b) => a.weekNumber - b.weekNumber); },
      error: ()     => {}
    });
  }

  onWeekChange() { this.loadMilestone(this.selectedWeek); }
  previousWeek() { if (this.selectedWeek > 1)  { this.selectedWeek--; this.loadMilestone(this.selectedWeek); } }
  nextWeek()     { if (this.selectedWeek < 40) { this.selectedWeek++; this.loadMilestone(this.selectedWeek); } }

  // ── Baby Name AI ──────────────────────────────────────
  openNamePopup()  { this.showNamePopup = true; this.nameResults = []; this.nameError = ''; this.nameCopied = false; }
  closeNamePopup() { this.showNamePopup = false; this.nameResults = []; this.nameError = ''; }

  generateNames() {
    this.nameLoading = true; this.nameResults = []; this.nameError = '';
    this.babyNameService.generateNames(this.namePrefs).subscribe({
      next:  (res) => { this.nameResults = res.names || []; this.nameLoading = false; },
      error: (err) => { this.nameError = err.error?.error || 'Generation failed. Please try again.'; this.nameLoading = false; }
    });
  }

  toggleFavorite(name: string) {
    const idx = this.favoriteNames.indexOf(name);
    if (idx >= 0) this.favoriteNames.splice(idx, 1);
    else          this.favoriteNames.push(name);
  }
  isFavorite(name: string): boolean { return this.favoriteNames.includes(name); }

  copyNames() {
    const text = this.nameResults.map(n => `${n.name} (${n.origin}) — ${n.meaning}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      this.nameCopied = true;
      setTimeout(() => this.nameCopied = false, 2000);
    });
  }

  // ── Baby Portrait AI ──────────────────────────────────
  openPortraitPopup() {
    this.showPortraitPopup = true;
    this.portrait          = null;
    this.portraitError     = '';
    this.portraitCopied    = false;
  }

  closePortraitPopup() {
    this.showPortraitPopup = false;
    this.portrait          = null;
    this.portraitError     = '';
  }

  async generatePortrait() {
    this.portraitLoading = true;
    this.portrait        = null;
    this.portraitError   = '';

    /* try {
      const body = {
        week:         this.currentWeek || this.selectedWeek,
        momEyeColor:  this.portraitForm.momEyeColor,
        momHairColor: this.portraitForm.momHairColor,
        momSkinTone:  this.portraitForm.momSkinTone,
        momFeatures:  this.portraitForm.momFeatures,
        dadEyeColor:  this.portraitForm.dadEyeColor,
        dadHairColor: this.portraitForm.dadHairColor,
        dadSkinTone:  this.portraitForm.dadSkinTone,
        dadFeatures:  this.portraitForm.dadFeatures,
      };

      const response = await fetch('http://localhost:8081/api/ai/baby-portrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Server error');
      const data = await response.json();

      // Parse JSON portrait
      const raw = data.portrait || '{}';
      const clean = raw.replace(/```json|```/g, '').trim();
      this.portrait = JSON.parse(clean);

    } catch {
      this.portraitError = 'An error occurred. Please check your connection and try again.';
    }

    this.portraitLoading = false;
  } */

    // 1. Prepare the request body
    const body = {
      week:         this.currentWeek || this.selectedWeek,
      momEyeColor:  this.portraitForm.momEyeColor,
      momHairColor: this.portraitForm.momHairColor,
      momSkinTone:  this.portraitForm.momSkinTone,
      momFeatures:  this.portraitForm.momFeatures,
      dadEyeColor:  this.portraitForm.dadEyeColor,
      dadHairColor: this.portraitForm.dadHairColor,
      dadSkinTone:  this.portraitForm.dadSkinTone,
      dadFeatures:  this.portraitForm.dadFeatures,
    };

    // 2. Set loading state to true before the call starts
    this.portraitLoading = true;
    this.portraitError = null; // Clear previous errors

    // 3. Use HttpClient POST
    this.http.post<any>(`${environment.apiUrl}/ai/baby-portrait`, body).subscribe({
      next: (data) => {
        try {
          // Parse JSON portrait and handle potential markdown formatting from AI
          const raw = data.portrait || '{}';
          const clean = raw.replace(/```json|```/g, '').trim();
          this.portrait = JSON.parse(clean);
        } catch (parseError) {
          console.error("JSON Parsing Error:", parseError);
          this.portraitError = 'Failed to process the portrait data.';
        }
        this.portraitLoading = false;
      },
      error: (err) => {
        console.error("Fetal Portrait Error:", err);
        this.portraitError = 'An error occurred. Please check your connection and try again.';
        this.portraitLoading = false;
      }
    });
  }

  copyPortrait() {
    if (!this.portrait) return;
    const text = [
      `👁️ Eyes: ${this.portrait.eyes}`,
      `💇 Hair: ${this.portrait.hair}`,
      `🌸 Skin: ${this.portrait.skin}`,
      `😊 Face: ${this.portrait.face}`,
      `🤲 Hands: ${this.portrait.hands}`,
      `💭 Dream: ${this.portrait.dream}`,
      `💌 ${this.portrait.message}`,
      `\n"${this.portrait.poem}"`,
    ].join('\n');
    navigator.clipboard.writeText(text).then(() => {
      this.portraitCopied = true;
      setTimeout(() => this.portraitCopied = false, 2000);
    });
  }

  // ── Helpers ───────────────────────────────────────────
  getTrimester(week: number): string {
    if (week <= 12) return 'T1';
    if (week <= 26) return 'T2';
    return 'T3';
  }
  getTrimesterLabel(week: number): string {
    if (week <= 12) return '1st Trimester';
    if (week <= 26) return '2nd Trimester';
    return '3rd Trimester';
  }
  getTrimesterColor(week: number): string {
    if (week <= 12) return '#03a9f4';
    if (week <= 26) return '#e91e63';
    return '#9c27b0';
  }
  isCurrentWeek(): boolean { return this.selectedWeek === this.currentWeek; }
  isPast(week: number): boolean { return week < this.currentWeek; }

  getComparisonEmoji(comparison: string): string {
    if (!comparison) return '🍼';
    const text = comparison.toLowerCase();
    if (text.includes('pastèque'))                              return '🍉';
    if (text.includes('citrouille') || text.includes('courge')) return '🎃';
    if (text.includes('ananas'))                                return '🍍';
    if (text.includes('mangue'))                                return '🥭';
    if (text.includes('avocat'))                                return '🥑';
    if (text.includes('citron'))                                return '🍋';
    if (text.includes('orange'))                                return '🍊';
    if (text.includes('pomme de terre'))                        return '🥔';
    if (text.includes('pomme'))                                 return '🍎';
    if (text.includes('raisin'))                                return '🍇';
    if (text.includes('fraise'))                                return '🍓';
    if (text.includes('cerise'))                                return '🍒';
    if (text.includes('pêche'))                                 return '🍑';
    if (text.includes('prune'))                                 return '🫐';
    if (text.includes('myrtille'))                              return '🫐';
    if (text.includes('framboise'))                             return '🍓';
    if (text.includes('kiwi'))                                  return '🥝';
    if (text.includes('noix de coco') || text.includes('coco')) return '🥥';
    if (text.includes('banane'))                                return '🍌';
    if (text.includes('maïs'))                                  return '🌽';
    if (text.includes('carotte'))                               return '🥕';
    if (text.includes('poivron'))                               return '🫑';
    if (text.includes('aubergine'))                             return '🍆';
    if (text.includes('concombre'))                             return '🥒';
    if (text.includes('courgette'))                             return '🥒';
    if (text.includes('brocoli'))                               return '🥦';
    if (text.includes('laitue') || text.includes('salade'))     return '🥬';
    if (text.includes('chou'))                                  return '🥬';
    if (text.includes('poireau'))                               return '🧅';
    if (text.includes('oignon'))                                return '🧅';
    if (text.includes('ail'))                                   return '🧄';
    if (text.includes('patate'))                                return '🍠';
    if (text.includes('tomate'))                                return '🍅';
    if (text.includes('champignon'))                            return '🍄';
    if (text.includes('céleri'))                                return '🥬';
    if (text.includes('asperge'))                               return '🫛';
    if (text.includes('artichaut'))                             return '🫛';
    if (text.includes('navet'))                                 return '🫛';
    if (text.includes('melon'))                                 return '🍈';
    if (text.includes('figue'))                                 return '🍑';
    if (text.includes('olive'))                                 return '🫒';
    if (text.includes('grenade'))                               return '🍎';
    if (text.includes('litchi'))                                return '🍒';
    if (text.includes('goyave'))                                return '🍈';
    if (text.includes('papaye'))                                return '🥭';
    if (text.includes('noix'))                                  return '🥜';
    if (text.includes('amande'))                                return '🥜';
    if (text.includes('cacahuète'))                             return '🥜';
    if (text.includes('graine') || text.includes('grain'))      return '🌱';
    if (text.includes('watermelon'))                            return '🍉';
    if (text.includes('squash') || text.includes('pumpkin'))    return '🎃';
    if (text.includes('pineapple'))                             return '🍍';
    if (text.includes('mango'))                                 return '🥭';
    if (text.includes('avocado'))                               return '🥑';
    if (text.includes('lemon'))                                 return '🍋';
    if (text.includes('sweet potato'))                          return '🍠';
    if (text.includes('potato'))                                return '🥔';
    if (text.includes('apple'))                                 return '🍎';
    if (text.includes('grape'))                                 return '🍇';
    if (text.includes('strawberry'))                            return '🍓';
    if (text.includes('cherry'))                                return '🍒';
    if (text.includes('peach'))                                 return '🍑';
    if (text.includes('plum'))                                  return '🫐';
    if (text.includes('blueberry'))                             return '🫐';
    if (text.includes('raspberry'))                             return '🍓';
    if (text.includes('coconut'))                               return '🥥';
    if (text.includes('banana'))                                return '🍌';
    if (text.includes('corn'))                                  return '🌽';
    if (text.includes('carrot'))                                return '🥕';
    if (text.includes('pepper'))                                return '🫑';
    if (text.includes('eggplant'))                              return '🍆';
    if (text.includes('zucchini'))                              return '🥒';
    if (text.includes('cucumber'))                              return '🥒';
    if (text.includes('broccoli'))                              return '🥦';
    if (text.includes('lettuce') || text.includes('romaine'))   return '🥬';
    if (text.includes('cabbage'))                               return '🥬';
    if (text.includes('celery'))                                return '🥬';
    if (text.includes('leek'))                                  return '🧅';
    if (text.includes('onion'))                                 return '🧅';
    if (text.includes('garlic'))                                return '🧄';
    if (text.includes('tomato'))                                return '🍅';
    if (text.includes('mushroom'))                              return '🍄';
    if (text.includes('asparagus'))                             return '🫛';
    if (text.includes('artichoke'))                             return '🫛';
    if (text.includes('turnip'))                                return '🫛';
    if (text.includes('bean'))                                  return '🫘';
    if (text.includes('pea'))                                   return '🫛';
    if (text.includes('cantaloupe'))                            return '🍈';
    if (text.includes('fig'))                                   return '🍑';
    if (text.includes('pomegranate'))                           return '🍎';
    if (text.includes('lychee'))                                return '🍒';
    if (text.includes('papaya'))                                return '🥭';
    if (text.includes('guava'))                                 return '🍈';
    if (text.includes('walnut'))                                return '🥜';
    if (text.includes('almond'))                                return '🥜';
    if (text.includes('peanut'))                                return '🥜';
    if (text.includes('seed'))                                  return '🌱';
    return '🍼';
  }
}