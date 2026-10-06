import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink, RouterModule } from '@angular/router';

import {
  SupportResourceFilters,
  SupportResourceResponseDto,
  SupportResourceService,
} from '../../../../../core/services/module6b/support-resource.service';
import {
  PredictionResultResponseDto,
  PredictionResultService
} from '../../../../../core/services/module6b/prediction-result.service';

type ResourceTypeFilter = 'ALL' | 'ARTICLE' | 'AUDIO' | 'VIDEO' | 'HOTLINE';
type RiskLevelFilter = 'ALL' | 'LOW' | 'MODERATE' | 'HIGH';
type LanguageFilter = 'ALL' | 'FR' | 'AR' | 'EN';
type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

interface CarePathStep {
  title: string;
  subtitle: string;
  icon: string;
  resources: SupportResourceResponseDto[];
}

@Component({
  selector: 'app-support-resource',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatPaginatorModule, RouterLink, RouterModule],
  templateUrl: './support-resource.component.html',
  styleUrls: ['./support-resource.component.css']
})
export class SupportResourceComponent implements OnInit {
  resources: SupportResourceResponseDto[] = [];
  filteredResources: SupportResourceResponseDto[] = [];
  recommendedResources: SupportResourceResponseDto[] = [];
  favoriteResources: SupportResourceResponseDto[] = [];
  carePath: CarePathStep[] = [];
  toasts: ToastMessage[] = [];

  loading = false;
  loadingRecommended = false;
  loadingSituation = false;

  selectedRiskLevel: RiskLevelFilter = 'ALL';
  selectedType: ResourceTypeFilter = 'ALL';
  selectedLanguage: LanguageFilter = 'ALL';
  selectedCategory = 'ALL';
  searchTerm = '';

  detectedRiskLevel: RiskLevelFilter = 'ALL';
  latestPrediction: PredictionResultResponseDto | null = null;

  activeViewerResource: SupportResourceResponseDto | null = null;
  isViewerOpen = false;

  readonly favoriteStorageKey = 'postpartum_support_resource_favorites';
  private searchFilterTimer: number | null = null;
  pageSize = 4;
  currentPageIndex = 0;

  constructor(
    private supportResourceService: SupportResourceService,
    private predictionResultService: PredictionResultService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadLatestSituation();
  }

  loadLatestSituation(): void {
    this.loadingSituation = true;

    this.predictionResultService.getLatestPredictionByMother().subscribe({
      next: (prediction) => {
        this.latestPrediction = prediction;

        const risk = this.normalize(prediction?.riskLevel);

        if (risk === 'LOW' || risk === 'MODERATE' || risk === 'HIGH') {
          this.detectedRiskLevel = risk as RiskLevelFilter;
          this.selectedRiskLevel = risk as RiskLevelFilter;
        } else {
          this.detectedRiskLevel = 'ALL';
          this.selectedRiskLevel = 'ALL';
        }

        this.loadingSituation = false;
        this.loadResources();
        this.loadRecommendedResources();
      },
      error: (error) => {
        console.error('Load latest prediction error:', error);
        this.loadingSituation = false;
        this.detectedRiskLevel = 'ALL';
        this.selectedRiskLevel = 'ALL';
        this.loadResources();
        this.loadRecommendedResources();
      }
    });
  }

  loadResources(): void {
    this.loading = true;

    const filters: SupportResourceFilters = {
      riskLevel: this.selectedRiskLevel !== 'ALL' ? this.selectedRiskLevel : undefined,
      type: this.selectedType !== 'ALL' ? this.selectedType : undefined,
      language: this.selectedLanguage !== 'ALL' ? this.selectedLanguage : undefined,
      category: this.selectedCategory !== 'ALL' ? this.selectedCategory : undefined,
      search: this.searchTerm.trim() || undefined
    };

    this.supportResourceService.getResources(filters).subscribe({
      next: (data) => {
        this.resources = (data ?? []).filter(item => item?.isActive !== false);
        this.filteredResources = [...this.resources];
        this.currentPageIndex = 0;
        this.syncFavorites();
        this.buildCarePath();
        this.loading = false;
      },
      error: (error) => {
        console.error('Load resources error:', error);
        this.loading = false;
        this.showToast('Unable to load support resources.', 'error');
      }
    });
  }

  loadRecommendedResources(): void {
    this.loadingRecommended = true;

    const riskToUse: RiskLevelFilter | undefined =
      this.detectedRiskLevel !== 'ALL'
        ? this.detectedRiskLevel
        : this.selectedRiskLevel !== 'ALL'
        ? this.selectedRiskLevel
        : undefined;

    this.supportResourceService.getRecommendedResources(
      riskToUse,
      this.selectedLanguage !== 'ALL' ? this.selectedLanguage : undefined
    ).subscribe({
      next: (data) => {
        const incoming = (data ?? []).filter(item => item?.isActive !== false);

        this.recommendedResources = incoming
          .filter(item => {
            const itemRisk = this.normalize(item.riskLevelTarget);

            // si on a un dernier risk, on n'affiche QUE ce risk
          if (riskToUse) {
  return itemRisk === riskToUse;
}

            return true;
          })
          .slice(0, 6);

        this.loadingRecommended = false;
      },
      error: (error) => {
        console.error('Load recommended resources error:', error);
        this.loadingRecommended = false;
        this.showToast('Unable to load recommended resources.', 'error');
      }
    });
  }

  onFiltersChanged(): void {
    this.loadResources();
    this.loadRecommendedResources();
  }

  onSearchChanged(): void {
    if (this.searchFilterTimer !== null) {
      window.clearTimeout(this.searchFilterTimer);
    }

    this.searchFilterTimer = window.setTimeout(() => {
      this.onFiltersChanged();
    }, 200);
  }

  resetFilters(): void {
    this.selectedRiskLevel = this.detectedRiskLevel !== 'ALL' ? this.detectedRiskLevel : 'ALL';
    this.selectedType = 'ALL';
    this.selectedLanguage = 'ALL';
    this.selectedCategory = 'ALL';
    this.searchTerm = '';
    this.currentPageIndex = 0;

    this.loadResources();
    this.loadRecommendedResources();
    this.showToast('Filters reset successfully.', 'info');
  }

  get categories(): string[] {
    const values = this.resources.map(item => item.category).filter(Boolean);
    return ['ALL', ...Array.from(new Set(values.map(item => item.toUpperCase())))];
  }

  get situationLabel(): string {
    return this.detectedRiskLevel === 'ALL'
      ? 'General support'
      : `${this.detectedRiskLevel} risk support`;
  }

  get totalCount(): number {
    return this.filteredResources.length;
  }

  get articleCount(): number {
    return this.filteredResources.filter(item => this.normalize(item.type) === 'ARTICLE').length;
  }

  get mediaCount(): number {
    return this.filteredResources.filter(item =>
      ['VIDEO', 'AUDIO'].includes(this.normalize(item.type))
    ).length;
  }

  get hotlineCount(): number {
    return this.filteredResources.filter(item => this.normalize(item.type) === 'HOTLINE').length;
  }

  get savedCount(): number {
    return this.favoriteResources.length;
  }

  get paginatedResources(): SupportResourceResponseDto[] {
    const startIndex = this.currentPageIndex * this.pageSize;
    return this.filteredResources.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredResources.length / this.pageSize));
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.currentPageIndex = event.pageIndex;
  }

  buildCarePath(): void {
    const resources = [...this.filteredResources];

    this.carePath = [
      {
        title: 'Start here',
        subtitle: 'Gentle first steps and easy-to-access support.',
        icon: 'flag',
        resources: resources
          .filter(item => ['GENERAL', 'BABY BLUES', 'DEPRESSION', 'ANXIETY', 'EMERGENCY'].includes(this.normalize(item.category)))
          .slice(0, 3)
      },
      {
        title: 'Understand',
        subtitle: 'Learn more about symptoms, emotions, and postpartum changes.',
        icon: 'psychology',
        resources: resources
          .filter(item => this.normalize(item.type) === 'ARTICLE')
          .slice(0, 3)
      },
      {
        title: 'Calm down',
        subtitle: 'Audio and video resources to soothe and regulate.',
        icon: 'headphones',
        resources: resources
          .filter(item => ['AUDIO', 'VIDEO'].includes(this.normalize(item.type)))
          .slice(0, 3)
      },
      {
        title: 'Get support now',
        subtitle: 'Immediate ways to reach help when needed.',
        icon: 'support_agent',
        resources: resources
          .filter(item => this.normalize(item.type) === 'HOTLINE')
          .slice(0, 3)
      }
    ];
  }

  openViewer(resource: SupportResourceResponseDto, event?: Event): void {
    event?.stopPropagation();

    const type = this.normalize(resource.type);

    // ARTICLE
    if (type === 'ARTICLE') {
      // si on a du texte local -> ouvrir la modale
      if (resource.contentText && resource.contentText.trim().length > 0) {
        this.activeViewerResource = resource;
        this.isViewerOpen = true;
        return;
      }

      // sinon, si on a une url -> ouvrir le site externe
      if (resource.url && resource.url.trim().length > 0) {
        window.open(resource.url, '_blank', 'noopener,noreferrer');
        return;
      }

      // fallback modale avec description
      this.activeViewerResource = resource;
      this.isViewerOpen = true;
      return;
    }

    // AUDIO / VIDEO / HOTLINE / autres
    this.activeViewerResource = resource;
    this.isViewerOpen = true;
  }

  closeViewer(): void {
    this.activeViewerResource = null;
    this.isViewerOpen = false;
  }

  openArticle(resource: SupportResourceResponseDto, event?: Event): void {
    this.openViewer(resource, event);
  }

  listenAudio(resource: SupportResourceResponseDto, event?: Event): void {
    event?.stopPropagation();

    // si l'URL audio n'est ni directe ni Spotify compatible, on informe l'utilisateur
    if (!this.isDirectAudio(resource.url) && !this.canEmbedSpotify(resource.url)) {
      this.showToast('This audio link is not playable. Please use a direct .mp3 link or an open.spotify.com episode/show/track link.', 'error');
      return;
    }

    this.activeViewerResource = resource;
    this.isViewerOpen = true;
  }

  isFavorite(resourceId: number): boolean {
    const ids = this.getStoredFavoriteIds();
    return ids.includes(resourceId);
  }

  toggleFavorite(resource: SupportResourceResponseDto, event?: Event): void {
    event?.stopPropagation();

    const ids = this.getStoredFavoriteIds();
    const exists = ids.includes(resource.id);

    const nextIds = exists
      ? ids.filter(id => id !== resource.id)
      : [...ids, resource.id];

    localStorage.setItem(this.favoriteStorageKey, JSON.stringify(nextIds));
    this.syncFavorites();

    this.showToast(
      exists ? 'Removed from saved resources.' : 'Saved for later successfully.',
      'success'
    );
  }

  syncFavorites(): void {
    const ids = this.getStoredFavoriteIds();
    this.favoriteResources = this.resources.filter(item => ids.includes(item.id));
  }

  copyPhoneNumber(resource: SupportResourceResponseDto, event?: Event): void {
    event?.stopPropagation();

    if (!resource.phoneNumber) {
      this.showToast('No phone number available.', 'error');
      return;
    }

    navigator.clipboard.writeText(resource.phoneNumber)
      .then(() => this.showToast('Phone number copied.', 'success'))
      .catch(() => this.showToast('Unable to copy phone number.', 'error'));
  }

  shareResource(resource: SupportResourceResponseDto, event?: Event): void {
    event?.stopPropagation();

    const text = `${resource.title}${resource.url ? ' - ' + resource.url : ''}`;

    navigator.clipboard.writeText(text)
      .then(() => this.showToast('Resource copied to clipboard.', 'success'))
      .catch(() => this.showToast('Unable to copy resource details.', 'error'));
  }

  openPhone(resource: SupportResourceResponseDto, event?: Event): void {
    event?.stopPropagation();
    if (!resource.phoneNumber) {
      this.showToast('No phone number available.', 'error');
      return;
    }
    window.location.href = `tel:${resource.phoneNumber}`;
  }

  getTypeIcon(type: string | undefined): string {
    switch (this.normalize(type)) {
      case 'ARTICLE': return 'article';
      case 'AUDIO': return 'graphic_eq';
      case 'VIDEO': return 'play_circle';
      case 'HOTLINE': return 'call';
      default: return 'help';
    }
  }

  getRiskBadgeClass(value: string | undefined): string {
    switch (this.normalize(value)) {
      case 'LOW': return 'risk-low';
      case 'MODERATE': return 'risk-moderate';
      case 'HIGH': return 'risk-high';
      case 'ALL': return 'risk-all';
      default: return 'risk-default';
    }
  }

  getTypeClass(type: string | undefined): string {
    switch (this.normalize(type)) {
      case 'ARTICLE': return 'type-article';
      case 'AUDIO': return 'type-audio';
      case 'VIDEO': return 'type-video';
      case 'HOTLINE': return 'type-hotline';
      default: return 'type-default';
    }
  }

  getPreviewText(resource: SupportResourceResponseDto): string {
    if (resource.contentText && resource.contentText.trim()) {
      return resource.contentText.length > 220
        ? `${resource.contentText.slice(0, 220)}...`
        : resource.contentText;
    }

    if (resource.description && resource.description.trim()) {
      return resource.description.length > 220
        ? `${resource.description.slice(0, 220)}...`
        : resource.description;
    }

    return 'No preview available.';
  }

  getRecommendationReason(resource: SupportResourceResponseDto): string {
    if (this.normalize(resource.riskLevelTarget) === this.detectedRiskLevel) {
      return 'Matched to your last result';
    }
    if (resource.isRecommended) {
      return 'Recommended for you';
    }
    if (this.normalize(resource.language) === this.selectedLanguage && this.selectedLanguage !== 'ALL') {
      return 'In your language';
    }
    if (this.normalize(resource.type) === 'HOTLINE') {
      return 'Quick help';
    }
    return 'Suggested support';
  }

  getDisplayTitle(resource: SupportResourceResponseDto): string {
    return resource.title || 'Untitled resource';
  }

  getSanitizedVideoUrl(url?: string): SafeResourceUrl | null {
    if (!url) return null;

    const youtubeId = this.extractYoutubeId(url);
    if (youtubeId) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube.com/embed/${youtubeId}`
      );
    }

    const vimeoId = this.extractVimeoId(url);
    if (vimeoId) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://player.vimeo.com/video/${vimeoId}`
      );
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getSpotifyEmbedUrl(url?: string): SafeResourceUrl | null {
    if (!url) return null;

    // open.spotify.com
    const openSpotifyMatch = url.match(
      /spotify\.com\/(episode|track|show|playlist|album|artist)\/([a-zA-Z0-9]+)/i
    );

    if (openSpotifyMatch) {
      const type = openSpotifyMatch[1];
      const id = openSpotifyMatch[2];
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://open.spotify.com/embed/${type}/${id}`
      );
    }

    // creators.spotify.com/pod/profile/... => pas d'embed direct fiable
    return null;
  }

  canEmbedSpotify(url?: string): boolean {
    return this.getSpotifyEmbedUrl(url) !== null;
  }

  isYoutubeOrVimeo(url?: string): boolean {
    if (!url) return false;
    return /youtube\.com|youtu\.be|vimeo\.com/i.test(url);
  }

  isSpotify(url?: string): boolean {
    if (!url) return false;
    return /spotify\.com/i.test(url);
  }

  isDirectVideo(url?: string): boolean {
    if (!url) return false;
    return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
  }

  isDirectAudio(url?: string): boolean {
    if (!url) return false;
    return /\.(mp3|wav|ogg|m4a)(\?.*)?$/i.test(url);
  }

  showToast(text: string, type: ToastType = 'info'): void {
    const toast: ToastMessage = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      text,
      type
    };

    this.toasts = [...this.toasts, toast];

    setTimeout(() => {
      this.toasts = this.toasts.filter(item => item.id !== toast.id);
    }, 3200);
  }

  removeToast(id: number): void {
    this.toasts = this.toasts.filter(item => item.id !== id);
  }

  trackByResourceId(index: number, item: SupportResourceResponseDto): number {
    return item.id;
  }

  private getStoredFavoriteIds(): number[] {
    try {
      const raw = localStorage.getItem(this.favoriteStorageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private normalize(value: string | undefined): string {
    return (value || '').trim().toUpperCase();
  }

  private extractYoutubeId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/i);
    return match?.[1] || null;
  }

  private extractVimeoId(url: string): string | null {
    const match = url.match(/vimeo\.com\/(\d+)/i);
    return match?.[1] || null;
  }
}