import { CommonModule, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  BabyMilestoneResponseDTO,
  MediaType,
  MilestoneCategory,
  MilestoneService
} from '../../../../../core/services/module6a/milestone.service';

type MilestoneFilter = 'ALL' | 'PHOTO' | 'VIDEO' | 'AUDIO';

@Component({
  selector: 'app-milestone',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, NgClass, DatePipe, ReactiveFormsModule],
  templateUrl: './milestone.component.html',
  styleUrls: ['./milestone.component.css']
})
export class MilestoneComponent implements OnInit {
  readonly pageSize = 6;

  babyId = 0;
  milestones: BabyMilestoneResponseDTO[] = [];
  filteredMilestones: BabyMilestoneResponseDTO[] = [];
  currentPage = 1;

  loading = false;
  submitting = false;
  errorMessage = '';
  successMessage = '';

  showModal = false;
  isEditMode = false;
  editingMilestoneId: number | null = null;
  activeFilter: MilestoneFilter = 'ALL';
  searchTerm = '';

  showMediaViewer = false;
  selectedMediaUrl = '';
  selectedMediaTitle = '';

  selectedFile: File | null = null;
  selectedFileName = '';
  previewUrl: string | null = null;

  categories: MilestoneCategory[] = ['MOTOR', 'SOCIAL', 'LANGUAGE', 'COGNITIVE', 'OTHER'];
  mediaTypes: MediaType[] = ['PHOTO', 'VIDEO', 'AUDIO'];

  milestoneForm!: FormGroup;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly fb: FormBuilder,
    private readonly milestoneService: MilestoneService
  ) {}

  ngOnInit(): void {
    this.babyId = Number(this.route.snapshot.paramMap.get('babyId')) || 0;
    this.initForm();
    this.loadMilestones();
  }

  initForm(): void {
    this.milestoneForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      category: ['MOTOR', Validators.required],
      milestoneDate: ['', Validators.required],
      description: [''],
      mediaType: ['PHOTO']
    });
  }

  loadMilestones(): void {
    this.loading = true;
    this.errorMessage = '';

    this.milestoneService.getAllMilestonesByBaby(this.babyId).subscribe({
      next: (data) => {
        this.milestones = data ?? [];
        this.applyFiltersAndSearch();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load milestones.';
        this.loading = false;
      }
    });
  }

  applyFilter(filter: MilestoneFilter): void {
    this.activeFilter = filter;
    this.currentPage = 1;

    this.applyFiltersAndSearch();
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.currentPage = 1;

    this.applyFiltersAndSearch();
  }

  private applyFiltersAndSearch(): void {
    const filter = this.activeFilter;
    const query = this.searchTerm.trim().toLowerCase();

    const filteredByType = filter === 'ALL'
      ? [...this.milestones]
      : this.milestones.filter((item) => (item.mediaType || '').toUpperCase() === filter);

    if (!query) {
      this.filteredMilestones = filteredByType;
      return;
    }

    this.filteredMilestones = filteredByType.filter((item) => {
      const readableDate = item.milestoneDate
        ? new Date(item.milestoneDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }).toLowerCase()
        : '';

      const searchableText = [
        item.title,
        item.description,
        item.category,
        this.formatCategory(item.category),
        item.mediaType,
        this.getMediaLabel(item.mediaType),
        item.milestoneDate,
        readableDate,
        item.createdAt
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredMilestones.length / this.pageSize));
  }

  get paginatedMilestones(): BabyMilestoneResponseDTO[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredMilestones.slice(startIndex, startIndex + this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  goToPage(page: number): void {
    this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  openMediaViewer(milestone: BabyMilestoneResponseDTO): void {
    if (!this.isPhoto(milestone) || !milestone.mediaUrl) return;

    this.selectedMediaUrl = milestone.mediaUrl;
    this.selectedMediaTitle = milestone.title || 'Milestone image';
    this.showMediaViewer = true;
  }

  closeMediaViewer(): void {
    this.showMediaViewer = false;
    this.selectedMediaUrl = '';
    this.selectedMediaTitle = '';
  }

  openAddModal(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.isEditMode = false;
    this.editingMilestoneId = null;
    this.showModal = true;
    this.resetFormState();
  }

  openEditModal(milestone: BabyMilestoneResponseDTO): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.isEditMode = true;
    this.editingMilestoneId = milestone.id;
    this.showModal = true;

    this.milestoneForm.patchValue({
      title: milestone.title || '',
      category: milestone.category || 'MOTOR',
      milestoneDate: milestone.milestoneDate || '',
      description: milestone.description || '',
      mediaType: milestone.mediaType || 'PHOTO'
    });

    this.selectedFile = null;
    this.selectedFileName = '';
    this.previewUrl = milestone.mediaUrl || null;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.editingMilestoneId = null;
    this.resetFormState();
  }

  resetFormState(): void {
    this.milestoneForm.reset({
      title: '',
      category: 'MOTOR',
      milestoneDate: '',
      description: '',
      mediaType: 'PHOTO'
    });
    this.selectedFile = null;
    this.selectedFileName = '';
    this.previewUrl = null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;

    this.selectedFile = file;
    this.selectedFileName = file ? file.name : '';

    if (file) {
      this.previewUrl = URL.createObjectURL(file);
    } else {
      this.previewUrl = null;
    }
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    this.selectedFileName = '';
    this.previewUrl = null;
  }

  buildFormData(): FormData {
    const formValue = this.milestoneForm.value;
    const formData = new FormData();

    formData.append('title', formValue.title.trim());
    formData.append('category', formValue.category);
    formData.append('milestoneDate', formValue.milestoneDate);

    if (formValue.description?.trim()) {
      formData.append('description', formValue.description.trim());
    }

    if (this.selectedFile) {
      formData.append('mediaType', formValue.mediaType);
      formData.append('mediaFile', this.selectedFile);
    } else if (this.isEditMode && formValue.mediaType) {
      formData.append('mediaType', formValue.mediaType);
    }

    return formData;
  }

  onSubmit(): void {
    if (this.milestoneForm.invalid) {
      this.milestoneForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = this.buildFormData();

    if (this.isEditMode && this.editingMilestoneId !== null) {
      this.milestoneService.updateMilestone(this.babyId, this.editingMilestoneId, formData).subscribe({
        next: () => {
          this.successMessage = 'Milestone updated successfully.';
          this.submitting = false;
          this.closeModal();
          this.loadMilestones();
        },
        error: (err) => {
          this.errorMessage =
            err?.error?.message ||
            err?.error ||
            'Error while updating milestone.';
          this.submitting = false;
        }
      });
      return;
    }

    this.milestoneService.createMilestone(this.babyId, formData).subscribe({
      next: () => {
        this.successMessage = 'Milestone added successfully.';
        this.submitting = false;
        this.closeModal();
        this.loadMilestones();
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message ||
          err?.error ||
          'Error while adding milestone.';
        this.submitting = false;
      }
    });
  }

  deleteMilestone(milestoneId: number): void {
    const confirmed = window.confirm('Do you really want to delete this memory?');
    if (!confirmed) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.milestoneService.deleteMilestone(this.babyId, milestoneId).subscribe({
      next: () => {
        this.successMessage = 'Milestone deleted successfully.';
        this.loadMilestones();
      },
      error: () => {
        this.errorMessage = 'Error while deleting milestone.';
      }
    });
  }

  get totalCount(): number {
    return this.milestones.length;
  }

  get recentCount(): number {
    return this.milestones.filter((item) => item.recent).length;
  }

  get photoCount(): number {
    return this.milestones.filter((item) => item.mediaType === 'PHOTO').length;
  }

  get videoCount(): number {
    return this.milestones.filter((item) => item.mediaType === 'VIDEO').length;
  }

  get audioCount(): number {
    return this.milestones.filter((item) => item.mediaType === 'AUDIO').length;
  }

  formatCategory(category?: string): string {
    switch ((category || '').toUpperCase()) {
      case 'MOTOR': return 'Motor';
      case 'SOCIAL': return 'Social';
      case 'LANGUAGE': return 'Language';
      case 'COGNITIVE': return 'Cognitive';
      default: return 'Other';
    }
  }

  getMediaLabel(type?: string): string {
    switch ((type || '').toUpperCase()) {
      case 'PHOTO': return 'Photo';
      case 'VIDEO': return 'Video';
      case 'AUDIO': return 'Audio';
      default: return 'Memory';
    }
  }

  isPhoto(item: BabyMilestoneResponseDTO): boolean {
    return (item.mediaType || '').toUpperCase() === 'PHOTO' && !!item.mediaUrl;
  }

  isVideo(item: BabyMilestoneResponseDTO): boolean {
    return (item.mediaType || '').toUpperCase() === 'VIDEO' && !!item.mediaUrl;
  }

  isAudio(item: BabyMilestoneResponseDTO): boolean {
    return (item.mediaType || '').toUpperCase() === 'AUDIO';
  }

  isPreviewPhoto(): boolean {
    return this.milestoneForm.get('mediaType')?.value === 'PHOTO' && !!this.previewUrl;
  }

  isPreviewVideo(): boolean {
    return this.milestoneForm.get('mediaType')?.value === 'VIDEO' && !!this.previewUrl;
  }

  isPreviewAudio(): boolean {
    return this.milestoneForm.get('mediaType')?.value === 'AUDIO' && !!this.previewUrl;
  }

  trackByMilestoneId(index: number, milestone: BabyMilestoneResponseDTO): number {
    return milestone.id;
  }
}