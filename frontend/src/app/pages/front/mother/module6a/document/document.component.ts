import { CommonModule, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  BabyDocumentResponseDTO,
  DocumentService,
  DocumentType
} from '../../../../../core/services/module6a/document.service';

type DocumentFilter = 'ALL' | DocumentType;

@Component({
  selector: 'app-document',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, NgClass, DatePipe, ReactiveFormsModule],
  templateUrl: './document.component.html',
  styleUrls: ['./document.component.css']
})
export class DocumentComponent implements OnInit {
  babyId = 0;
  documents: BabyDocumentResponseDTO[] = [];
  filteredDocuments: BabyDocumentResponseDTO[] = [];

  loading = false;
  submitting = false;
  errorMessage = '';
  successMessage = '';

  showModal = false;
  isEditMode = false;
  editingDocumentId: number | null = null;
  activeFilter: DocumentFilter = 'ALL';

  selectedFile: File | null = null;
  selectedFileName = '';

  documentTypes: DocumentType[] = ['ORDONNANCE', 'COMPTE_RENDU', 'ANALYSE', 'RADIO', 'AUTRE'];

  documentForm!: FormGroup;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly fb: FormBuilder,
    private readonly documentService: DocumentService
  ) {}

  ngOnInit(): void {
    this.babyId = Number(this.route.snapshot.paramMap.get('babyId')) || 0;
    this.initForm();
    this.loadDocuments();
  }

  initForm(): void {
    this.documentForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      documentType: ['AUTRE', Validators.required],
      notes: ['']
    });
  }

  loadDocuments(): void {
    this.loading = true;
    this.errorMessage = '';

    this.documentService.getAllDocumentsByBaby(this.babyId).subscribe({
      next: (data) => {
        this.documents = data ?? [];
        this.applyFilter(this.activeFilter);
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Error loading documents.';
        this.loading = false;
      }
    });
  }

  applyFilter(filter: DocumentFilter): void {
    this.activeFilter = filter;

    if (filter === 'ALL') {
      this.filteredDocuments = [...this.documents];
      return;
    }

    this.filteredDocuments = this.documents.filter(
      (doc) => (doc.documentType || '').toUpperCase() === filter
    );
  }

  openAddModal(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.isEditMode = false;
    this.editingDocumentId = null;
    this.showModal = true;
    this.resetFormState();
  }

  openEditModal(document: BabyDocumentResponseDTO): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.isEditMode = true;
    this.editingDocumentId = document.id;
    this.showModal = true;

    this.documentForm.patchValue({
      title: document.title || '',
      documentType: document.documentType || 'AUTRE',
      notes: document.notes || ''
    });

    this.selectedFile = null;
    this.selectedFileName = '';
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.editingDocumentId = null;
    this.resetFormState();
  }

  resetFormState(): void {
    this.documentForm.reset({
      title: '',
      documentType: 'AUTRE',
      notes: ''
    });
    this.selectedFile = null;
    this.selectedFileName = '';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;

    this.selectedFile = file;
    this.selectedFileName = file ? file.name : '';
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    this.selectedFileName = '';
  }

  buildFormData(): FormData {
    const formValue = this.documentForm.value;
    const formData = new FormData();

    formData.append('title', formValue.title?.trim() || '');
    formData.append('documentType', formValue.documentType || 'AUTRE');

    if (formValue.notes?.trim()) {
      formData.append('notes', formValue.notes.trim());
    }

    if (this.selectedFile) {
      formData.append('file', this.selectedFile, this.selectedFile.name);
    }

    return formData;
  }

  onSubmit(): void {
    if (this.documentForm.invalid) {
      this.documentForm.markAllAsTouched();
      return;
    }

    if (!this.isEditMode && !this.selectedFile) {
      this.errorMessage = 'Please select a file.';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = this.buildFormData();

    if (this.isEditMode && this.editingDocumentId !== null) {
      this.documentService.updateDocument(this.babyId, this.editingDocumentId, formData).subscribe({
        next: () => {
          this.successMessage = 'Document updated successfully.';
          this.submitting = false;
          this.closeModal();
          this.loadDocuments();
        },
        error: (err) => {
          this.errorMessage =
            err?.error?.message ||
            err?.error ||
            'Error updating document.';
          this.submitting = false;
        }
      });
      return;
    }

    this.documentService.createDocument(this.babyId, formData).subscribe({
      next: () => {
        this.successMessage = 'Document added successfully.';
        this.submitting = false;
        this.closeModal();
        this.loadDocuments();
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message ||
          err?.error ||
          'Error adding document.';
        this.submitting = false;
      }
    });
  }

  deleteDocument(documentId: number): void {
    const confirmed = window.confirm('Do you really want to delete this document?');
    if (!confirmed) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.documentService.deleteDocument(this.babyId, documentId).subscribe({
      next: () => {
        this.successMessage = 'Document deleted successfully.';
        this.loadDocuments();
      },
      error: () => {
        this.errorMessage = 'Error deleting document.';
      }
    });
  }

  get totalCount(): number {
    return this.documents.length;
  }

  get ordonnanceCount(): number {
    return this.documents.filter((doc) => doc.documentType === 'ORDONNANCE').length;
  }

  get compteRenduCount(): number {
    return this.documents.filter((doc) => doc.documentType === 'COMPTE_RENDU').length;
  }

  get analyseCount(): number {
    return this.documents.filter((doc) => doc.documentType === 'ANALYSE').length;
  }

  get radioCount(): number {
    return this.documents.filter((doc) => doc.documentType === 'RADIO').length;
  }

  get autreCount(): number {
    return this.documents.filter((doc) => doc.documentType === 'AUTRE').length;
  }

  formatDocumentType(type?: string): string {
    switch ((type || '').toUpperCase()) {
      case 'ORDONNANCE':
        return 'Ordonnance';
      case 'COMPTE_RENDU':
        return 'Compte rendu';
      case 'ANALYSE':
        return 'Analyse';
      case 'RADIO':
        return 'Radio';
      default:
        return 'Autre';
    }
  }

  getDocumentIcon(type?: string): string {
    switch ((type || '').toUpperCase()) {
      case 'ORDONNANCE':
        return '🩺';
      case 'COMPTE_RENDU':
        return '📋';
      case 'ANALYSE':
        return '🧪';
      case 'RADIO':
        return '🩻';
      default:
        return '📄';
    }
  }

  formatFileSize(size?: number): string {
    if (size === null || size === undefined || Number.isNaN(size)) {
      return '—';
    }

    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  openFile(url?: string): void {
    if (!url) return;
    window.open(url, '_blank');
  }

  trackByDocumentId(index: number, document: BabyDocumentResponseDTO): number {
    return document.id;
  }
}