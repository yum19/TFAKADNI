import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';

import { StorytellingPopupComponent } from '../storytelling-popup/storytelling-popup.component';
import { PredictionResultResponseDto, PredictionResultService } from '../../../../../core/services/module6b/prediction-result.service';
import { MoodLogResponseDto, MoodLogService } from '../../../../../core/services/module6b/mood-log.service';
import { PsychAppointmentResponseDto, PsychAppointmentService } from '../../../../../core/services/module6b/psych-appointment.service';
import { SupportResourceResponseDto } from '../../../../../core/services/module6b/admin-support-resource.service';
import { AppLang, LocalTranslateService } from '../../../../../core/services/local-translate.service';
import { SupportResourceService } from '../../../../../core/services/module6b/support-resource.service';
import { StorytellingService } from '../../../../../core/services/module6b/storytelling.service';

interface UiTexts {
  heroEpdsButton: string;

  aboutTitle: string;
  aboutSubtitle: string;

  noScreeningBadge: string;
  noScreeningTitle: string;
  noScreeningSub: string;
  takeScreening: string;

  latestRiskSuffix: string;
  latestTestSubtitle: string;
  viewOtherResults: string;
  noLatestScreening: string;

  riskTitleLow: string;
  riskTitleModerate: string;
  riskTitleHigh: string;

  riskSummaryLow: string;
  riskSummaryModerate: string;
  riskSummaryHigh: string;

  noMoodBadge: string;
  noMoodTitle: string;
  noMoodSub: string;
  addMoodLog: string;

  latestMoodBadge: string;
  latestMoodSaved: string;
  viewMoodHistory: string;

  moodTitleGreat: string;
  moodTitleOkay: string;
  moodTitleLow: string;
  moodTitleTough: string;

  noAppointmentBadge: string;
  noAppointmentTitle: string;
  noAppointmentSub: string;
  scheduleAppointment: string;

  nextAppointmentBadge: string;
  apptTitle: string;
  viewAppointments: string;

  dateLabel: string;
  timeLabel: string;
  typeLabel: string;
  placeLabel: string;

  statusPlanned: string;
  statusDone: string;
  statusCancelled: string;

  personalizedSupport: string;
  resourcesTitle: string;
  viewMoreResources: string;
  viewResourcesPage: string;

  noResourcesTitle: string;
  noResourcesSub: string;
  resourceOpen: string;
  riskLabel: string;
  helpfulResourceFallback: string;
  resourcesSubtitleWithRisk: string;
  resourcesSubtitleDefault: string;

  footerText: string;

  typeArticle: string;
  typeVideo: string;
  typeAudio: string;
  typeHotline: string;
  typeDefault: string;

  translationPopupTitle: string;
  translationPopupMessage: string;

  storytellingButtonLabel: string;
}

interface DisplayResource {
  id: number;
  type?: string;
  language?: string;
  url?: string;
  title: string;
  description: string;
  category: string;
  riskLevelTarget: string;
}

interface DynamicTranslationPayload {
  texts: string[];
  predictionRiskLevelIndex?: number;
  moodEmotionIndex?: number;
  moodNotesIndex?: number;
  appointmentTypeIndex?: number;
  appointmentLocationIndex?: number;
  resources: Array<{
    id: number;
    type?: string;
    language?: string;
    url?: string;
    titleIndex?: number;
    descriptionIndex?: number;
    categoryIndex?: number;
    riskLevelTargetIndex?: number;
  }>;
}

@Component({
  selector: 'app-home-postpartum',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule, StorytellingPopupComponent],
  templateUrl: './home-postpartum.component.html',
  styleUrls: ['./home-postpartum.component.css'],
})
export class HomePostpartumComponent implements OnInit, OnDestroy {
  prediction: PredictionResultResponseDto | null = null;
  loadingScreening = true;

  latestMood: MoodLogResponseDto | null = null;
  loadingMood = true;

  nextAppointment: PsychAppointmentResponseDto | null = null;
  loadingAppt = true;

  resources: SupportResourceResponseDto[] = [];
  displayResources: DisplayResource[] = [];
  loadingResources = true;

  savedStoriesCount = 0;

  loadingTranslations = false;
  translationPopupDismissed = false;
  showStorytellingPopup = false;

  currentLang: AppLang = 'en';
  readonly baseLang: AppLang = 'en';

  displayedPredictionRiskLevel = '';
  displayedMoodEmotion = '';
  displayedMoodNotes = '';
  displayedAppointmentType = '';
  displayedAppointmentLocation = '';

  uiTexts: UiTexts = {
    heroEpdsButton: 'Start the EPDS Test',

    aboutTitle: 'Your latest test result',
    aboutSubtitle: 'Track, manage, and celebrate the postpartum journey',

    noScreeningBadge: 'No screening yet',
    noScreeningTitle: 'Start your first\nscreening today',
    noScreeningSub: 'Postpartum mental health check',
    takeScreening: 'Take Screening',

    latestRiskSuffix: 'Risk',
    latestTestSubtitle: 'Latest postpartum screening taken',
    viewOtherResults: 'View other results',
    noLatestScreening: 'No latest screening result is available yet.',

    riskTitleLow: "You're doing\nreally well",
    riskTitleModerate: 'Take care\nof yourself',
    riskTitleHigh: 'You need\nsupport now',

    riskSummaryLow:
      'Low risk: the screening does not currently suggest urgent follow-up, but continuing routine monitoring is still useful.',
    riskSummaryModerate:
      'Moderate risk: the screening shows signs that deserve attention and a closer review in the near term.',
    riskSummaryHigh:
      'High risk: the screening suggests significant concern and the follow-up should be prioritized as soon as possible.',

    noMoodBadge: 'No mood log yet',
    noMoodTitle: 'Track your mood\nevery day',
    noMoodSub: 'Save how you feel and follow your wellbeing',
    addMoodLog: 'Add Mood Log',

    latestMoodBadge: 'Latest Mood',
    latestMoodSaved: 'Your latest mood entry has been saved successfully.',
    viewMoodHistory: 'View mood history',

    moodTitleGreat: 'Feeling great\ntoday!',
    moodTitleOkay: 'Doing okay,\nkeep going',
    moodTitleLow: 'Feeling a bit\nlow today',
    moodTitleTough: 'Having a\ntough day',

    noAppointmentBadge: 'No appointment yet',
    noAppointmentTitle: 'Book your next\nfollow-up',
    noAppointmentSub: 'Stay connected with your psychological support plan',
    scheduleAppointment: 'Schedule appointment',

    nextAppointmentBadge: 'Next Appointment',
    apptTitle: 'Your follow-up\nis scheduled',
    viewAppointments: 'View appointments',

    dateLabel: 'Date',
    timeLabel: 'Time',
    typeLabel: 'Type',
    placeLabel: 'Place',

    statusPlanned: 'Planned',
    statusDone: 'Done',
    statusCancelled: 'Cancelled',

    personalizedSupport: '💗 Personalized support',
    resourcesTitle: 'Recommended resources for you',
    viewMoreResources: 'View more resources',
    viewResourcesPage: 'View resources page',

    noResourcesTitle: 'No resources available yet',
    noResourcesSub:
      'Helpful support resources will appear here once they are available.',
    resourceOpen: 'Open resource ↗',
    riskLabel: 'Risk',
    helpfulResourceFallback:
      'Helpful postpartum support content tailored for mothers.',
    resourcesSubtitleWithRisk:
      'Helpful postpartum resources selected for {risk} risk support needs',
    resourcesSubtitleDefault:
      'Helpful postpartum resources selected for your current wellbeing and support needs',

    footerText:
      'Our Postpartum section is designed to help you stay focused on recovery, wellbeing, and every important step of the journey.',

    typeArticle: 'Article',
    typeVideo: 'Video',
    typeAudio: 'Audio',
    typeHotline: 'Hotline',
    typeDefault: 'Resource',

    translationPopupTitle: 'Translation in progress',
    translationPopupMessage: 'Please wait until we finish the translation.',

    storytellingButtonLabel: 'My healing stories',
  };

  private readonly baseUiTexts: UiTexts = { ...this.uiTexts };

  private readonly languageChangeHandler = (event: Event) => {
    const customEvent = event as CustomEvent<AppLang>;
    const lang = customEvent.detail || 'en';
    this.changeLanguage(lang);
  };

  constructor(
    private predictionService: PredictionResultService,
    private moodService: MoodLogService,
    private apptService: PsychAppointmentService,
    private resourceService: SupportResourceService,
    private localTranslateService: LocalTranslateService,
    private storytellingService: StorytellingService
  ) {}

  ngOnInit(): void {
    const savedLang = (localStorage.getItem('app-lang') as AppLang) || 'en';
    this.changeLanguage(savedLang);

    this.predictionService.getLatestPredictionByMother().subscribe({
      next: (data) => {
        this.prediction = data;
        this.loadingScreening = false;
        this.loadRecommendedResources();
        this.refreshDynamicTranslationsIfNeeded();
      },
      error: () => {
        this.loadingScreening = false;
        this.loadRecommendedResources();
        this.refreshDynamicTranslationsIfNeeded();
      },
    });

    this.moodService.getMoodLogsByMother().subscribe({
      next: (list) => {
        this.latestMood = list?.[0] ?? null;
        this.loadingMood = false;
        this.refreshDynamicTranslationsIfNeeded();
      },
      error: () => {
        this.loadingMood = false;
        this.refreshDynamicTranslationsIfNeeded();
      },
    });

    this.apptService.getAppointmentsByMother('PLANNED').subscribe({
      next: (list) => {
        const now = new Date();

        const sorted = [...list].sort(
          (a, b) =>
            new Date(a.appointmentDate).getTime() -
            new Date(b.appointmentDate).getTime()
        );

        const upcoming = sorted.find((a) => new Date(a.appointmentDate) >= now);

        if (upcoming) {
          this.nextAppointment = upcoming;
        } else {
          this.nextAppointment = sorted.length
            ? sorted[sorted.length - 1]
            : null;
        }

        this.loadingAppt = false;
        this.refreshDynamicTranslationsIfNeeded();
      },
      error: () => {
        this.loadingAppt = false;
        this.refreshDynamicTranslationsIfNeeded();
      },
    });

    this.refreshStoryBadge();

    window.addEventListener(
      'app-language-changed',
      this.languageChangeHandler as EventListener
    );
  }

  ngOnDestroy(): void {
    window.removeEventListener(
      'app-language-changed',
      this.languageChangeHandler as EventListener
    );
  }

  private loadRecommendedResources(): void {
    const riskLevel = this.prediction?.riskLevel;

    this.resourceService
      .getResources(riskLevel ? { riskLevel } : undefined)
      .subscribe({
        next: (list) => {
          this.resources = [...(list ?? [])]
            .sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
            .slice(0, 3);

          this.loadingResources = false;
          this.refreshDynamicTranslationsIfNeeded();
        },
        error: () => {
          this.resources = [];
          this.loadingResources = false;
          this.refreshDynamicTranslationsIfNeeded();
        },
      });
  }

  changeLanguage(lang: AppLang): void {
    this.currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    if (lang === this.baseLang) {
      this.resetBaseTexts();
      return;
    }

    this.loadingTranslations = true;
    this.translationPopupDismissed = false;

    const uiArray = Object.values(this.baseUiTexts);
    const dynamicPayload = this.buildDynamicTranslationPayload();

    forkJoin({
      ui: this.localTranslateService.translateMany(uiArray, this.baseLang, lang),
      dynamic: dynamicPayload.texts.length
        ? this.localTranslateService.translateMany(dynamicPayload.texts, this.baseLang, lang)
        : of<string[]>([]),
    }).subscribe({
      next: ({ ui, dynamic }) => {
        this.uiTexts = {
          heroEpdsButton: ui[0],

          aboutTitle: ui[1],
          aboutSubtitle: ui[2],

          noScreeningBadge: ui[3],
          noScreeningTitle: ui[4],
          noScreeningSub: ui[5],
          takeScreening: ui[6],

          latestRiskSuffix: ui[7],
          latestTestSubtitle: ui[8],
          viewOtherResults: ui[9],
          noLatestScreening: ui[10],

          riskTitleLow: ui[11],
          riskTitleModerate: ui[12],
          riskTitleHigh: ui[13],

          riskSummaryLow: ui[14],
          riskSummaryModerate: ui[15],
          riskSummaryHigh: ui[16],

          noMoodBadge: ui[17],
          noMoodTitle: ui[18],
          noMoodSub: ui[19],
          addMoodLog: ui[20],

          latestMoodBadge: ui[21],
          latestMoodSaved: ui[22],
          viewMoodHistory: ui[23],

          moodTitleGreat: ui[24],
          moodTitleOkay: ui[25],
          moodTitleLow: ui[26],
          moodTitleTough: ui[27],

          noAppointmentBadge: ui[28],
          noAppointmentTitle: ui[29],
          noAppointmentSub: ui[30],
          scheduleAppointment: ui[31],

          nextAppointmentBadge: ui[32],
          apptTitle: ui[33],
          viewAppointments: ui[34],

          dateLabel: ui[35],
          timeLabel: ui[36],
          typeLabel: ui[37],
          placeLabel: ui[38],

          statusPlanned: ui[39],
          statusDone: ui[40],
          statusCancelled: ui[41],

          personalizedSupport: ui[42],
          resourcesTitle: ui[43],
          viewMoreResources: ui[44],
          viewResourcesPage: ui[45],

          noResourcesTitle: ui[46],
          noResourcesSub: ui[47],
          resourceOpen: ui[48],
          riskLabel: ui[49],
          helpfulResourceFallback: ui[50],
          resourcesSubtitleWithRisk: ui[51],
          resourcesSubtitleDefault: ui[52],

          footerText: ui[53],

          typeArticle: ui[54],
          typeVideo: ui[55],
          typeAudio: ui[56],
          typeHotline: ui[57],
          typeDefault: ui[58],

          translationPopupTitle: ui[59],
          translationPopupMessage: ui[60],

          storytellingButtonLabel: ui[61],
        };

        this.applyDynamicTranslations(dynamicPayload, dynamic);
        this.loadingTranslations = false;
      },
      error: (err) => {
        console.error('Translation error', err);
        this.resetDisplayedDynamicValues();
        this.loadingTranslations = false;
      },
    });
  }

  private refreshDynamicTranslationsIfNeeded(): void {
    if (this.currentLang === this.baseLang) {
      this.resetDisplayedDynamicValues();
      return;
    }

    const payload = this.buildDynamicTranslationPayload();

    if (!payload.texts.length) {
      this.resetDisplayedDynamicValues();
      return;
    }

    this.loadingTranslations = true;
    this.translationPopupDismissed = false;

    this.localTranslateService
      .translateMany(payload.texts, this.baseLang, this.currentLang)
      .subscribe({
        next: (translated) => {
          this.applyDynamicTranslations(payload, translated);
          this.loadingTranslations = false;
        },
        error: (err) => {
          console.error('Dynamic translation error', err);
          this.resetDisplayedDynamicValues();
          this.loadingTranslations = false;
        },
      });
  }

  private resetBaseTexts(): void {
    this.uiTexts = { ...this.baseUiTexts };
    this.resetDisplayedDynamicValues();
    this.loadingTranslations = false;
  }

  private resetDisplayedDynamicValues(): void {
    this.displayedPredictionRiskLevel = this.titleCaseText(this.prediction?.riskLevel);
    this.displayedMoodEmotion = this.latestMood?.emotionType ?? '';
    this.displayedMoodNotes = this.latestMood?.notes ?? '';
    this.displayedAppointmentType = this.nextAppointment?.type ?? '';
    this.displayedAppointmentLocation = this.nextAppointment?.location ?? '';

    this.displayResources = this.resources.map((resource) => ({
      id: resource.id,
      type: resource.type,
      language: resource.language,
      url: resource.url,
      title: resource.title ?? '',
      description: resource.description ?? '',
      category: resource.category ?? '',
      riskLevelTarget: resource.riskLevelTarget ?? '',
    }));
  }

  private buildDynamicTranslationPayload(): DynamicTranslationPayload {
    const payload: DynamicTranslationPayload = {
      texts: [],
      resources: [],
    };

    if (this.prediction?.riskLevel) {
      payload.predictionRiskLevelIndex = payload.texts.length;
      payload.texts.push(this.titleCaseText(this.prediction.riskLevel));
    }

    if (this.latestMood?.emotionType) {
      payload.moodEmotionIndex = payload.texts.length;
      payload.texts.push(this.latestMood.emotionType);
    }

    if (this.latestMood?.notes) {
      payload.moodNotesIndex = payload.texts.length;
      payload.texts.push(this.latestMood.notes);
    }

    if (this.nextAppointment?.type) {
      payload.appointmentTypeIndex = payload.texts.length;
      payload.texts.push(this.nextAppointment.type);
    }

    if (this.nextAppointment?.location) {
      payload.appointmentLocationIndex = payload.texts.length;
      payload.texts.push(this.nextAppointment.location);
    }

    for (const resource of this.resources) {
      const item: DynamicTranslationPayload['resources'][number] = {
        id: resource.id,
        type: resource.type,
        language: resource.language,
        url: resource.url,
      };

      if (resource.title) {
        item.titleIndex = payload.texts.length;
        payload.texts.push(resource.title);
      }

      if (resource.description) {
        item.descriptionIndex = payload.texts.length;
        payload.texts.push(resource.description);
      }

      if (resource.category) {
        item.categoryIndex = payload.texts.length;
        payload.texts.push(resource.category);
      }

      if (resource.riskLevelTarget) {
        item.riskLevelTargetIndex = payload.texts.length;
        payload.texts.push(resource.riskLevelTarget);
      }

      payload.resources.push(item);
    }

    return payload;
  }

  private applyDynamicTranslations(
    payload: DynamicTranslationPayload,
    translated: string[]
  ): void {
    this.displayedPredictionRiskLevel =
      payload.predictionRiskLevelIndex !== undefined
        ? translated[payload.predictionRiskLevelIndex] || this.titleCaseText(this.prediction?.riskLevel)
        : this.titleCaseText(this.prediction?.riskLevel);

    this.displayedMoodEmotion =
      payload.moodEmotionIndex !== undefined
        ? translated[payload.moodEmotionIndex] || (this.latestMood?.emotionType ?? '')
        : (this.latestMood?.emotionType ?? '');

    this.displayedMoodNotes =
      payload.moodNotesIndex !== undefined
        ? translated[payload.moodNotesIndex] || (this.latestMood?.notes ?? '')
        : (this.latestMood?.notes ?? '');

    this.displayedAppointmentType =
      payload.appointmentTypeIndex !== undefined
        ? translated[payload.appointmentTypeIndex] || (this.nextAppointment?.type ?? '')
        : (this.nextAppointment?.type ?? '');

    this.displayedAppointmentLocation =
      payload.appointmentLocationIndex !== undefined
        ? translated[payload.appointmentLocationIndex] || (this.nextAppointment?.location ?? '')
        : (this.nextAppointment?.location ?? '');

    this.displayResources = payload.resources.map((resource) => ({
      id: resource.id,
      type: resource.type,
      language: resource.language,
      url: resource.url,
      title:
        resource.titleIndex !== undefined
          ? translated[resource.titleIndex] || ''
          : '',
      description:
        resource.descriptionIndex !== undefined
          ? translated[resource.descriptionIndex] || ''
          : '',
      category:
        resource.categoryIndex !== undefined
          ? translated[resource.categoryIndex] || ''
          : '',
      riskLevelTarget:
        resource.riskLevelTargetIndex !== undefined
          ? translated[resource.riskLevelTargetIndex] || ''
          : '',
    }));
  }

  private titleCaseText(value?: string | null): string {
    if (!value) return '';
    return value
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  trackByResourceId(index: number, item: DisplayResource): number {
    return item.id;
  }

  openResource(url: string | undefined): void {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  get level(): string {
    return this.prediction?.riskLevel?.toLowerCase() ?? '';
  }

  get riskClass(): string {
    if (this.level === 'low') return 'risk-low';
    if (this.level === 'moderate') return 'risk-moderate';
    if (this.level === 'high') return 'risk-high';
    return '';
  }

  get badgeClass(): string {
    if (this.level === 'low') return 'badge-low';
    if (this.level === 'moderate') return 'badge-moderate';
    if (this.level === 'high') return 'badge-high';
    return '';
  }

  get dotClass(): string {
    if (this.level === 'low') return 'dot-low';
    if (this.level === 'moderate') return 'dot-moderate';
    if (this.level === 'high') return 'dot-high';
    return '';
  }

  get titleColorClass(): string {
    if (this.level === 'low') return 'title-low';
    if (this.level === 'moderate') return 'title-moderate';
    if (this.level === 'high') return 'title-high';
    return '';
  }

  get riskEmoji(): string {
    if (this.level === 'low') return '😌';
    if (this.level === 'moderate') return '😟';
    if (this.level === 'high') return '😰';
    return '🩺';
  }

  get riskTitle(): string {
    if (this.level === 'low') return this.uiTexts.riskTitleLow;
    if (this.level === 'moderate') return this.uiTexts.riskTitleModerate;
    if (this.level === 'high') return this.uiTexts.riskTitleHigh;
    return '';
  }

  get latestTestSubtitle(): string {
    return this.uiTexts.latestTestSubtitle;
  }

  get riskSummary(): string {
    if (!this.prediction) {
      return this.uiTexts.noLatestScreening;
    }

    if (this.level === 'low') {
      return this.uiTexts.riskSummaryLow;
    }

    if (this.level === 'moderate') {
      return this.uiTexts.riskSummaryModerate;
    }

    if (this.level === 'high') {
      return this.uiTexts.riskSummaryHigh;
    }

    return this.uiTexts.noLatestScreening;
  }

  get moodEmoji(): string {
    const s = this.latestMood?.moodScore ?? 5;
    if (s >= 8) return '😄';
    if (s >= 6) return '🙂';
    if (s >= 4) return '😔';
    if (s >= 2) return '😢';
    return '😞';
  }

  get moodTitle(): string {
    const s = this.latestMood?.moodScore ?? 5;
    if (s >= 8) return this.uiTexts.moodTitleGreat;
    if (s >= 6) return this.uiTexts.moodTitleOkay;
    if (s >= 4) return this.uiTexts.moodTitleLow;
    return this.uiTexts.moodTitleTough;
  }

  get apptStatusClass(): string {
    const s = this.nextAppointment?.status?.toLowerCase() ?? '';
    if (s === 'planned') return 'status-planned';
    if (s === 'done') return 'status-done';
    if (s === 'cancelled') return 'status-cancelled';
    return '';
  }

  get displayedAppointmentStatus(): string {
    const s = this.nextAppointment?.status?.toLowerCase() ?? '';
    if (s === 'planned') return this.uiTexts.statusPlanned;
    if (s === 'done') return this.uiTexts.statusDone;
    if (s === 'cancelled') return this.uiTexts.statusCancelled;
    return this.nextAppointment?.status ?? '';
  }

  get resourcesSubtitle(): string {
    if (this.displayedPredictionRiskLevel) {
      return this.uiTexts.resourcesSubtitleWithRisk.replace(
        '{risk}',
        this.displayedPredictionRiskLevel.toLowerCase()
      );
    }

    if (this.prediction?.riskLevel) {
      return this.uiTexts.resourcesSubtitleWithRisk.replace(
        '{risk}',
        this.titleCaseText(this.prediction.riskLevel).toLowerCase()
      );
    }

    return this.uiTexts.resourcesSubtitleDefault;
  }

  getTypeIcon(type: string | undefined): string {
    const value = (type ?? '').toUpperCase();

    if (value === 'ARTICLE') return '📄';
    if (value === 'VIDEO') return '🎥';
    if (value === 'AUDIO') return '🎧';
    if (value === 'HOTLINE') return '☎️';

    return '💗';
  }

  getTypeClass(type: string | undefined): string {
    const value = (type ?? '').toUpperCase();

    if (value === 'ARTICLE') return 'type-article';
    if (value === 'VIDEO') return 'type-video';
    if (value === 'AUDIO') return 'type-audio';
    if (value === 'HOTLINE') return 'type-hotline';

    return 'type-default';
  }

  getTypeLabel(type: string | undefined): string {
    const value = (type ?? '').toUpperCase();

    if (value === 'ARTICLE') return this.uiTexts.typeArticle;
    if (value === 'VIDEO') return this.uiTexts.typeVideo;
    if (value === 'AUDIO') return this.uiTexts.typeAudio;
    if (value === 'HOTLINE') return this.uiTexts.typeHotline;

    return this.uiTexts.typeDefault;
  }

  getLanguageLabel(language: string | undefined): string {
    const value = (language ?? '').toLowerCase();

    if (value === 'fr') return 'FR';
    if (value === 'ar') return 'AR';
    return (language ?? 'N/A').toUpperCase();
  }

  getShortDescription(text: string | undefined): string {
    const content = text || this.uiTexts.helpfulResourceFallback;

    if (content.length <= 110) {
      return content;
    }

    return `${content.slice(0, 107)}...`;
  }

  private getLocale(): string {
    if (this.currentLang === 'fr') return 'fr-FR';
    if (this.currentLang === 'ar') return 'ar-EG';
    return 'en-US';
  }

  formatDisplayDate(date?: string | Date): string {
    if (!date) return '—';

    return new Intl.DateTimeFormat(this.getLocale(), {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  }

  formatDisplayTime(date?: string | Date): string {
    if (!date) return '—';

    return new Intl.DateTimeFormat(this.getLocale(), {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(date));
  }

  openStorytellingPopup(): void {
    this.showStorytellingPopup = true;
  }

  closeStorytellingPopup(): void {
    this.showStorytellingPopup = false;
    this.refreshStoryBadge();
  }

  closeTranslationPopup(): void {
    this.translationPopupDismissed = true;
  }

  refreshStoryBadge(): void {
    this.storytellingService.getStoryHistory().subscribe({
      next: (stories) => {
        this.savedStoriesCount = stories?.length ?? 0;
      },
      error: () => {
        this.savedStoriesCount = 0;
      },
    });
  }
}