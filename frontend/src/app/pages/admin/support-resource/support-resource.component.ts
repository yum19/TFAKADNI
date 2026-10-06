import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { PageRightComponent } from '../../../components/page-right/pageright.component';
import { AdminSupportResourceService, SupportResourceRequestDto, SupportResourceResponseDto } from '../../../core/services/module6b/admin-support-resource.service';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

@Component({
  selector: 'app-support-resource-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatSidenavModule,
    MatChipsModule,
    MatSelectModule,
    MatSlideToggleModule,
    PageRightComponent,
  ],
  templateUrl: './support-resource.component.html',
  styleUrls: ['./support-resource.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SupportResourceComponent implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource<SupportResourceResponseDto>([]);
  displayedColumns: string[] = ['title', 'type', 'category', 'language', 'riskLevelTarget', 'isActive', 'actions'];
  toasts: ToastMessage[] = [];

  isFormOpen = false;
  editingId: number | null = null;
  saving = false;
  previewResource: SupportResourceResponseDto | null = null;
  isPreviewOpen = false;

  form: SupportResourceRequestDto = this.getEmptyForm();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private supportResourceService: AdminSupportResourceService) {}

  ngOnInit(): void {
    this.loadSupportResources();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (data, filter) => {
      const haystack = [
        data.title,
        data.description,
        data.type,
        data.category,
        data.language,
        data.riskLevelTarget,
        data.phoneNumber,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(filter);
    };
  }

  get totalCount(): number {
    return this.dataSource.data.length;
  }

  get activeCount(): number {
    return this.dataSource.data.filter((item) => item.isActive).length;
  }

  get articleCount(): number {
    return this.dataSource.data.filter((item) => item.type?.toUpperCase() === 'ARTICLE').length;
  }

  get mediaCount(): number {
    return this.dataSource.data.filter((item) =>
      ['VIDEO', 'AUDIO'].includes(item.type?.toUpperCase() || '')
    ).length;
  }

  get hotlineCount(): number {
    return this.dataSource.data.filter((item) => item.type?.toUpperCase() === 'HOTLINE').length;
  }

  get languageCount(): number {
    return new Set(
      this.dataSource.data
        .map((item) => item.language?.toUpperCase())
        .filter((value): value is string => !!value)
    ).size;
  }

  get visibleCount(): number {
    return this.dataSource.data.filter((item) => item.isActive).length;
  }

  get inactiveCount(): number {
    return this.dataSource.data.filter((item) => !item.isActive).length;
  }

  get isArticle(): boolean {
    return this.form.type?.toUpperCase() === 'ARTICLE';
  }

  get isAudio(): boolean {
    return this.form.type?.toUpperCase() === 'AUDIO';
  }

  get isVideo(): boolean {
    return this.form.type?.toUpperCase() === 'VIDEO';
  }

  get isHotline(): boolean {
    return this.form.type?.toUpperCase() === 'HOTLINE';
  }

  loadSupportResources(): void {
    this.supportResourceService.getAllResourcesAdmin().subscribe({
      next: (items) => {
        this.dataSource.data = [...(items ?? [])].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
        this.syncPreviewResource();
      },
      error: () => {
        this.dataSource.data = [];
        this.showToast('Unable to load support resources.', 'error');
      },
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
  }

  getRiskClass(riskLevel: string | undefined): string {
    const value = (riskLevel ?? '').toLowerCase();

    if (value === 'low') return 'theme-green';
    if (value === 'moderate') return 'theme-orange';
    if (value === 'high') return 'theme-red';
    return 'theme-sky';
  }

  getTypeClass(type: string | undefined): string {
    const value = (type ?? '').toLowerCase();

    if (value === 'article') return 'type-article';
    if (value === 'audio') return 'type-audio';
    if (value === 'video') return 'type-video';
    if (value === 'hotline') return 'type-hotline';
    return 'type-default';
  }

  openCreateForm(): void {
    this.editingId = null;
    this.form = this.getEmptyForm();
    this.isFormOpen = true;
  }

  openEditForm(item: SupportResourceResponseDto): void {
    this.editingId = item.id;
    this.form = {
      title: item.title || '',
      type: item.type || 'ARTICLE',
      category: item.category || 'General',
      description: item.description || '',
      url: item.url || '',
      contentText: item.contentText || '',
      phoneNumber: item.phoneNumber || '',
      thumbnailUrl: item.thumbnailUrl || '',
      displayMode: item.displayMode || this.resolveDisplayMode(item.type),
      estimatedMinutes: item.estimatedMinutes,
      isRecommended: !!item.isRecommended,
      language: item.language || 'FR',
      riskLevelTarget: item.riskLevelTarget || 'ALL',
      isActive: item.isActive,
    };
    this.isFormOpen = true;
  }

  closeForm(): void {
    this.isFormOpen = false;
    this.editingId = null;
    this.form = this.getEmptyForm();
  }

  onTypeChange(): void {
    this.form.displayMode = this.resolveDisplayMode(this.form.type);
    if (!this.isArticle) this.form.contentText = '';
    if (!this.isHotline) this.form.phoneNumber = '';
  }

  submitForm(): void {
    const payload = this.buildPayload();

    if (!this.validateForm(payload)) {
      return;
    }

    this.saving = true;

    const request$ = this.editingId
      ? this.supportResourceService.updateResource(this.editingId, payload)
      : this.supportResourceService.createResource(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.showToast(
          this.editingId ? 'Resource updated successfully.' : 'Resource created successfully.',
          'success'
        );
        this.closeForm();
        this.loadSupportResources();
      },
      error: (error) => {
        this.saving = false;
        const message =
          error?.error?.message ||
          error?.error ||
          error?.message ||
          'Unable to save support resource.';
        this.showToast(message, 'error');
      }
    });
  }

  openResource(item: SupportResourceResponseDto): void {
    this.previewResource = item;
    this.isPreviewOpen = true;
  }

  closePreview(): void {
    this.isPreviewOpen = false;
    this.previewResource = null;
  }

  deleteResource(item: SupportResourceResponseDto): void {
    if (!confirm(`Hide support resource "${item.title}"?`)) {
      return;
    }

    this.supportResourceService.deleteResource(item.id).subscribe({
      next: () => {
        this.showToast('Resource hidden successfully.', 'success');
        this.loadSupportResources();
      },
      error: () => {
        this.showToast('Unable to hide resource.', 'error');
        this.loadSupportResources();
      },
    });
  }

  activateResource(item: SupportResourceResponseDto): void {
    this.supportResourceService.activateResource(item.id).subscribe({
      next: () => {
        this.showToast('Resource activated successfully.', 'success');
        this.loadSupportResources();
      },
      error: () => {
        this.showToast('Unable to activate resource.', 'error');
      },
    });
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
      type,
    };

    this.toasts = [...this.toasts, toast];

    setTimeout(() => {
      this.toasts = this.toasts.filter((item) => item.id !== toast.id);
    }, 3200);
  }

  removeToast(id: number): void {
    this.toasts = this.toasts.filter((item) => item.id !== id);
  }

  private buildPayload(): SupportResourceRequestDto {
    return {
      title: (this.form.title || '').trim(),
      type: (this.form.type || '').trim().toUpperCase(),
      category: (this.form.category || '').trim(),
      description: (this.form.description || '').trim(),
      url: (this.form.url || '').trim(),
      contentText: (this.form.contentText || '').trim(),
      phoneNumber: (this.form.phoneNumber || '').trim(),
      thumbnailUrl: (this.form.thumbnailUrl || '').trim(),
      displayMode: (this.form.displayMode || this.resolveDisplayMode(this.form.type)).trim().toUpperCase(),
      estimatedMinutes: this.form.estimatedMinutes ? Number(this.form.estimatedMinutes) : undefined,
      isRecommended: !!this.form.isRecommended,
      language: (this.form.language || '').trim().toUpperCase(),
      riskLevelTarget: (this.form.riskLevelTarget || '').trim().toUpperCase(),
      isActive: this.form.isActive ?? true,
    };
  }

  private validateForm(payload: SupportResourceRequestDto): boolean {
    if (!payload.title || !payload.type || !payload.category || !payload.language || !payload.riskLevelTarget) {
      this.showToast('Please fill all required fields.', 'error');
      return false;
    }

    if (payload.type === 'ARTICLE' && !payload.contentText && !payload.url) {
      this.showToast('Article requires content text or URL.', 'error');
      return false;
    }

    if ((payload.type === 'VIDEO' || payload.type === 'AUDIO') && !payload.url) {
      this.showToast(`${payload.type} requires a media URL.`, 'error');
      return false;
    }

    if (payload.type === 'HOTLINE' && !payload.phoneNumber) {
      this.showToast('Hotline requires a phone number.', 'error');
      return false;
    }

    return true;
  }

  private resolveDisplayMode(type?: string): string {
    const value = (type || '').toUpperCase();
    if (value === 'VIDEO' || value === 'AUDIO') return 'MEDIA';
    if (value === 'ARTICLE') return 'TEXT';
    if (value === 'HOTLINE') return 'PHONE';
    return 'LINK';
  }

  private getEmptyForm(): SupportResourceRequestDto {
    return {
      title: '',
      type: 'ARTICLE',
      category: 'General',
      description: '',
      url: '',
      contentText: '',
      phoneNumber: '',
      thumbnailUrl: '',
      displayMode: 'TEXT',
      estimatedMinutes: undefined,
      isRecommended: false,
      language: 'FR',
      riskLevelTarget: 'ALL',
      isActive: true,
    };
  }

  private syncPreviewResource(): void {
    if (!this.previewResource) return;
    const fresh = this.dataSource.data.find((item) => item.id === this.previewResource?.id);
    if (fresh) this.previewResource = fresh;
  }
}