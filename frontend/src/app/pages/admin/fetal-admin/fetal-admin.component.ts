import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { FetalMilestone } from '../../../core/models/pregnancy.model';
import { FetalMilestoneService } from '../../../core/services/fetal-milestone.service';

@Component({
  selector: 'app-fetal-admin',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDividerModule, ReactiveFormsModule,
  ],
  templateUrl: './fetal-admin.html',
  styleUrl: './fetal-admin.scss'
})
export class FetalAdminComponent implements OnInit {

  milestones: FetalMilestone[] = [];
  milestonesT1: FetalMilestone[] = [];
  milestonesT2: FetalMilestone[] = [];
  milestonesT3: FetalMilestone[] = [];
  loading = true;
  saving = false;

  // ===== CAROUSEL =====
  pageT1 = 0; pageT2 = 0; pageT3 = 0;
  readonly PAGE_SIZE = 3;
  showDeleteMilestoneConfirm = false;
milestoneToDelete: FetalMilestone | null = null;
  showForm = false;
  showEditForm = false;
  showDetailPopup = false;

  // ===== AI GENERATION =====
  showAiPopup = false;
  aiSelectedWeek: number | null = null;
  aiGenerating = false;
  aiGenerated: Partial<FetalMilestone> | null = null;
  aiError = '';
  aiStreamText = '';

  selectedMilestone: FetalMilestone | null = null;
  detailMilestone: FetalMilestone | null = null;

  milestoneForm: FormGroup;
  editForm: FormGroup;
  configuredWeeks: number[] = [];

  constructor(
    private fetalService: FetalMilestoneService,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    const formFields = {
      weekNumber:     [null, [Validators.required, Validators.min(1), Validators.max(40)]],
      title:          ['', Validators.required],
      titleAr:        [''],
      trimester:      ['T1', Validators.required],
      sizeCm:         [null],
      weightG:        [null],
      sizeComparison: [''],
      description:    ['', Validators.required],
      descriptionAr:  [''],
      motherSymptoms: [''],
      medicalAdvice:  [''],
      imageUrl:       [''],
    };
    this.milestoneForm = this.fb.group(formFields);
    this.editForm = this.fb.group(formFields);
  }

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading = true;
    this.fetalService.getAllAdmin().subscribe({
      next: (list) => {
        this.milestones = list.sort((a, b) => a.weekNumber - b.weekNumber);
        this.milestonesT1 = this.milestones.filter(m => m.trimester === 'T1');
        this.milestonesT2 = this.milestones.filter(m => m.trimester === 'T2');
        this.milestonesT3 = this.milestones.filter(m => m.trimester === 'T3');
        this.configuredWeeks = list.map(m => m.weekNumber);
        this.pageT1 = 0; this.pageT2 = 0; this.pageT3 = 0;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  // ===== CAROUSEL =====
  getPage(list: FetalMilestone[], page: number): FetalMilestone[] {
    return list.slice(page * this.PAGE_SIZE, (page + 1) * this.PAGE_SIZE);
  }
  prev(trim: 'T1' | 'T2' | 'T3') {
    if (trim === 'T1' && this.pageT1 > 0) this.pageT1--;
    if (trim === 'T2' && this.pageT2 > 0) this.pageT2--;
    if (trim === 'T3' && this.pageT3 > 0) this.pageT3--;
  }
  next(trim: 'T1' | 'T2' | 'T3') {
    if (trim === 'T1' && (this.pageT1 + 1) * this.PAGE_SIZE < this.milestonesT1.length) this.pageT1++;
    if (trim === 'T2' && (this.pageT2 + 1) * this.PAGE_SIZE < this.milestonesT2.length) this.pageT2++;
    if (trim === 'T3' && (this.pageT3 + 1) * this.PAGE_SIZE < this.milestonesT3.length) this.pageT3++;
  }
  min(a: number, b: number): number { return Math.min(a, b); }

  // ===== AI GENERATION =====
  openAiPopup() {
    this.showAiPopup = true;
    this.aiSelectedWeek = null;
    this.aiGenerated = null;
    this.aiError = '';
  }

  closeAiPopup() {
    this.showAiPopup = false;
    this.aiGenerated = null;
    this.aiError = '';
  }

  generateWithAI() {
    if (!this.aiSelectedWeek) return;
    this.aiGenerating = true;
    this.aiGenerated = null;
    this.aiError = '';
    this.aiStreamText = '🤖 Generating content...';

    // ← Appel sécurisé via Spring Boot proxy — clé API cachée côté serveur
    this.http.post<any>(
      `${environment.apiUrl}/ai/generate-fetal`,
      { weekNumber: this.aiSelectedWeek }
    ).subscribe({
      next: (result) => {
        this.aiGenerated = result;
        this.aiStreamText = '';
        this.aiGenerating = false;
      },
      error: (err) => {
        this.aiError = err.error?.error || 'Generation failed. Please try again.';
        this.aiStreamText = '';
        this.aiGenerating = false;
      }
    });
  }

  saveAiGenerated() {
    if (!this.aiGenerated) return;
    this.saving = true;
    this.fetalService.createMilestone(this.aiGenerated as any).subscribe({
      next: () => {
        this.saving = false;
        this.closeAiPopup();
        this.loadAll();
      },
      error: () => { this.saving = false; }
    });
  }

  useAiInForm() {
    if (!this.aiGenerated) return;
    this.milestoneForm.patchValue({
      weekNumber:     this.aiGenerated.weekNumber,
      title:          this.aiGenerated.title,
      trimester:      this.aiGenerated.trimester,
      sizeCm:         this.aiGenerated.sizeCm,
      weightG:        this.aiGenerated.weightG,
      sizeComparison: this.aiGenerated.sizeComparison,
      description:    this.aiGenerated.description,
      motherSymptoms: this.aiGenerated.motherSymptoms,
      medicalAdvice:  this.aiGenerated.medicalAdvice,
    });
    this.closeAiPopup();
    this.showForm = true;
  }

  // ===== DETAIL =====
  openDetail(m: FetalMilestone) { this.detailMilestone = m; this.showDetailPopup = true; }
  closeDetail() { this.showDetailPopup = false; this.detailMilestone = null; }

  // ===== ADD =====
  openForm() {
    if (this.milestones.length >= 40) { alert('All 40 weeks are already configured!'); return; }
    this.milestoneForm.reset({ trimester: 'T1' });
    this.showForm = true;
  }
  closeForm() { this.showForm = false; }

  save() {
    if (this.milestoneForm.invalid) return;
    const weekNumber = this.milestoneForm.value.weekNumber;
    if (this.configuredWeeks.includes(weekNumber)) {
      alert(`Week ${weekNumber} is already configured!`); return;
    }
    this.saving = true;
    this.fetalService.createMilestone(this.milestoneForm.value).subscribe({
      next: () => { this.saving = false; this.closeForm(); this.loadAll(); },
      error: () => { this.saving = false; }
    });
  }

  // ===== EDIT =====
  openEditForm(m: FetalMilestone, event?: Event) {
    event?.stopPropagation();
    this.selectedMilestone = m;
    this.editForm.patchValue({
      weekNumber: m.weekNumber, title: m.title || '', titleAr: m.titleAr || '',
      trimester: m.trimester, sizeCm: m.sizeCm ?? null, weightG: m.weightG ?? null,
      sizeComparison: m.sizeComparison || '', description: m.description || '',
      descriptionAr: m.descriptionAr || '', motherSymptoms: m.motherSymptoms || '',
      medicalAdvice: m.medicalAdvice || '', imageUrl: m.imageUrl || '',
    });
    this.showEditForm = true;
  }
  closeEditForm() { this.showEditForm = false; this.selectedMilestone = null; }

  saveEdit() {
    if (this.editForm.invalid || !this.selectedMilestone) return;
    this.saving = true;
    this.fetalService.updateMilestone(this.selectedMilestone.id, this.editForm.value).subscribe({
      next: () => { this.saving = false; this.closeEditForm(); this.loadAll(); },
      error: (err) => { this.saving = false; alert(`Error ${err.status}: ${err.error?.message || 'Update failed'}`); }
    });
  }

  // ===== DELETE =====
delete(m: FetalMilestone, event?: Event) {
  event?.stopPropagation();
  this.milestoneToDelete = m;
  this.showDeleteMilestoneConfirm = true;
}

confirmDeleteMilestone() {
  if (!this.milestoneToDelete) return;
  this.showDeleteMilestoneConfirm = false;
  this.fetalService.deleteMilestone(this.milestoneToDelete.id).subscribe({
    next: () => { this.milestoneToDelete = null; this.loadAll(); },
    error: () => { this.milestoneToDelete = null; }
  });
}

  getTrimLabel(t: string): string {
    return ({ T1: 'Trimester 1', T2: 'Trimester 2', T3: 'Trimester 3' } as any)[t] || t;
  }
  getTrimColor(t: string): string {
    return ({ T1: '#e91e63', T2: '#ff9800', T3: '#9c27b0' } as any)[t] || '#999';
  }
  isConfigured(week: number): boolean { return this.configuredWeeks.includes(week); }
  getUnconfiguredWeeks(): number[] {
    return Array.from({ length: 40 }, (_, i) => i + 1).filter(w => !this.configuredWeeks.includes(w));
  }
  getComparisonEmoji(comparison: string): string {
    if (!comparison) return '🍼';
    const text = comparison.toLowerCase();

    // ── Français ──────────────────────────────
    if (text.includes('pastèque'))                          return '🍉';
    if (text.includes('citrouille') || text.includes('courge')) return '🎃';
    if (text.includes('ananas'))                            return '🍍';
    if (text.includes('mangue'))                            return '🥭';
    if (text.includes('avocat'))                            return '🥑';
    if (text.includes('citron'))                            return '🍋';
    if (text.includes('orange'))                            return '🍊';
    if (text.includes('pomme de terre'))                    return '🥔';
    if (text.includes('pomme'))                             return '🍎';
    if (text.includes('raisin'))                            return '🍇';
    if (text.includes('fraise'))                            return '🍓';
    if (text.includes('cerise'))                            return '🍒';
    if (text.includes('pêche'))                             return '🍑';
    if (text.includes('prune'))                             return '🫐';
    if (text.includes('myrtille'))                          return '🫐';
    if (text.includes('framboise'))                         return '🍓';
    if (text.includes('kiwi'))                              return '🥝';
    if (text.includes('noix de coco') || text.includes('coco')) return '🥥';
    if (text.includes('banane'))                            return '🍌';
    if (text.includes('maïs'))                              return '🌽';
    if (text.includes('carotte'))                           return '🥕';
    if (text.includes('poivron'))                           return '🫑';
    if (text.includes('aubergine'))                         return '🍆';
    if (text.includes('concombre'))                         return '🥒';
    if (text.includes('courgette'))                         return '🥒';
    if (text.includes('brocoli'))                           return '🥦';
    if (text.includes('laitue') || text.includes('salade')) return '🥬';
    if (text.includes('chou'))                              return '🥬';
    if (text.includes('poireau'))                           return '🧅';
    if (text.includes('oignon'))                            return '🧅';
    if (text.includes('ail'))                               return '🧄';
    if (text.includes('patate'))                            return '🍠';
    if (text.includes('tomate'))                            return '🍅';
    if (text.includes('champignon'))                        return '🍄';
    if (text.includes('céleri'))                            return '🥬';
    if (text.includes('asperge'))                           return '🫛';
    if (text.includes('artichaut'))                         return '🫛';
    if (text.includes('navet'))                             return '🫛';
    if (text.includes('melon'))                             return '🍈';
    if (text.includes('figue'))                             return '🍑';
    if (text.includes('olive'))                             return '🫒';
    if (text.includes('grenade'))                           return '🍎';
    if (text.includes('litchi'))                            return '🍒';
    if (text.includes('goyave'))                            return '🍈';
    if (text.includes('papaye'))                            return '🥭';
    if (text.includes('noix'))                              return '🥜';
    if (text.includes('amande'))                            return '🥜';
    if (text.includes('cacahuète'))                         return '🥜';
    if (text.includes('graine') || text.includes('grain')) return '🌱';

    // ── English ───────────────────────────────
    if (text.includes('watermelon'))                        return '🍉';
    if (text.includes('squash') || text.includes('pumpkin')) return '🎃';
    if (text.includes('pineapple'))                         return '🍍';
    if (text.includes('mango'))                             return '🥭';
    if (text.includes('avocado'))                           return '🥑';
    if (text.includes('lemon'))                             return '🍋';
    if (text.includes('orange'))                            return '🍊';
    if (text.includes('sweet potato'))                      return '🍠';
    if (text.includes('potato'))                            return '🥔';
    if (text.includes('apple'))                             return '🍎';
    if (text.includes('grape'))                             return '🍇';
    if (text.includes('strawberry'))                        return '🍓';
    if (text.includes('cherry'))                            return '🍒';
    if (text.includes('peach'))                             return '🍑';
    if (text.includes('plum'))                              return '🫐';
    if (text.includes('blueberry'))                         return '🫐';
    if (text.includes('raspberry'))                         return '🍓';
    if (text.includes('kiwi'))                              return '🥝';
    if (text.includes('coconut'))                           return '🥥';
    if (text.includes('banana'))                            return '🍌';
    if (text.includes('corn'))                              return '🌽';
    if (text.includes('carrot'))                            return '🥕';
    if (text.includes('pepper'))                            return '🫑';
    if (text.includes('eggplant'))                          return '🍆';
    if (text.includes('zucchini'))                          return '🥒';
    if (text.includes('cucumber'))                          return '🥒';
    if (text.includes('broccoli'))                          return '🥦';
    if (text.includes('lettuce') || text.includes('romaine')) return '🥬';
    if (text.includes('cabbage'))                           return '🥬';
    if (text.includes('celery'))                            return '🥬';
    if (text.includes('leek'))                              return '🧅';
    if (text.includes('onion'))                             return '🧅';
    if (text.includes('garlic'))                            return '🧄';
    if (text.includes('tomato'))                            return '🍅';
    if (text.includes('mushroom'))                          return '🍄';
    if (text.includes('asparagus'))                         return '🫛';
    if (text.includes('artichoke'))                         return '🫛';
    if (text.includes('turnip'))                            return '🫛';
    if (text.includes('bean'))                              return '🫘';
    if (text.includes('pea'))                               return '🫛';
    if (text.includes('melon') || text.includes('cantaloupe')) return '🍈';
    if (text.includes('fig'))                               return '🍑';
    if (text.includes('olive'))                             return '🫒';
    if (text.includes('pomegranate'))                       return '🍎';
    if (text.includes('lychee'))                            return '🍒';
    if (text.includes('papaya'))                            return '🥭';
    if (text.includes('guava'))                             return '🍈';
    if (text.includes('passion'))                           return '🍊';
    if (text.includes('walnut'))                            return '🥜';
    if (text.includes('almond'))                            return '🥜';
    if (text.includes('peanut'))                            return '🥜';
    if (text.includes('seed'))                              return '🌱';

    return '🍼';
  }
}