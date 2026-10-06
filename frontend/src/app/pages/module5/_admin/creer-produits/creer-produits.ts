import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ProduitService } from '../../../../core/services/produit.service';
import { CategorieService } from '../../../../core/services/categorie.service';
import { Produit } from '../../../../core/models/produit.model';
import { Categorie } from '../../../../core/models/categorie.model';

@Component({
  selector: 'app-creer-produit',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatIconModule],
  templateUrl: './creer-produits.html',
  styleUrls: ['./creer-produits.css'],
})
export class CreerProduit implements OnInit {
  isEdit     = false;
  loading    = false;
  submitted  = false;
  isDragOver = false;

  imagePreviews: string[] = [];

  produit: Produit = {
    nom: '', description: '', prix: 0, stock: 0, images: [], categorie: undefined,
  };

  allCategories:    Categorie[] = [];
  parentCategories: Categorie[] = [];
  childCategories:  Categorie[] = [];
  selectedParentId: number | null = null;

  showAddCatPanel = false;
  newCatNom       = '';
  newCatParentId: number | null = null;
  savingCat = false;
  catSaved  = false;

  // ── Toast ──────────────────────────────────────────────────
  toast: { message: string; type: 'success' | 'error' } | null = null;
  private toastTimer: any;

  constructor(
    private produitService: ProduitService,
    private categorieService: CategorieService,
    public router: Router,
  ) {}

  ngOnInit(): void {
    const nav = history.state as { produit?: Produit; isEdit?: boolean };

    if (nav?.isEdit && nav?.produit) {
      this.isEdit  = true;
      this.produit = { ...nav.produit };
      this.imagePreviews = [...(this.produit.images ?? [])];
      if (this.produit.categorie?.parent?.id) {
        this.selectedParentId = this.produit.categorie.parent.id;
      } else if (this.produit.categorie?.id) {
        this.selectedParentId = this.produit.categorie.id;
      }
    }

    this.loadCategories();
  }

  // ── Toast helper ───────────────────────────────────────────
  showToast(message: string, type: 'success' | 'error'): void {
    clearTimeout(this.toastTimer);
    this.toast = { message, type };
    this.toastTimer = setTimeout(() => (this.toast = null), 3500);
  }

  // ── Categories ─────────────────────────────────────────────
  loadCategories(): void {
    this.categorieService.getAll().subscribe({
      next: (data) => {
        this.allCategories    = data;
        this.parentCategories = data.filter(c => !c.parent);
        if (this.selectedParentId) {
          this.childCategories = data.filter(c => c.parent?.id === this.selectedParentId);
        }
      },
      error: (e) => console.error('Error loading categories', e),
    });
  }

  onParentChange(parentId: number | null): void {
    this.selectedParentId = parentId;
    if (!parentId) {
      this.childCategories   = [];
      this.produit.categorie = undefined;
      return;
    }
    this.childCategories = this.allCategories.filter(c => c.parent?.id === parentId);
    if (this.childCategories.length === 0) {
      this.produit.categorie = this.allCategories.find(c => c.id === parentId);
    } else {
      this.produit.categorie = undefined;
    }
  }

  onChildChange(childId: number | null): void {
    this.produit.categorie = childId
      ? this.allCategories.find(c => c.id === childId)
      : undefined;
  }

  toggleAddCat(): void {
    this.showAddCatPanel = !this.showAddCatPanel;
    this.newCatNom = ''; this.newCatParentId = null; this.catSaved = false;
  }

  saveNewCategory(): void {
    if (!this.newCatNom.trim() || this.savingCat) return;
    this.savingCat = true;
    const payload: Categorie = {
      nom: this.newCatNom.trim(),
      parent: this.newCatParentId
        ? this.allCategories.find(c => c.id === this.newCatParentId)
        : undefined,
    };
    this.categorieService.create(payload).subscribe({
      next: (created) => {
        this.savingCat = false;
        this.catSaved  = true;
        this.loadCategories();
        setTimeout(() => {
          if (created.parent) {
            this.onParentChange(created.parent.id!);
            this.onChildChange(created.id!);
          } else {
            this.onParentChange(created.id!);
          }
          this.showAddCatPanel = false;
          this.catSaved = false;
        }, 800);
      },
      error: () => {
        this.savingCat = false;
        this.showToast('Failed to create category. Please try again.', 'error');
      },
    });
  }

  // ── Image handling ─────────────────────────────────────────
  onFileSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files) this.processFiles(files);
  }

  onDragOver(e: DragEvent): void { e.preventDefault(); this.isDragOver = true; }
  onDragLeave(): void { this.isDragOver = false; }
  onDrop(e: DragEvent): void {
    e.preventDefault(); this.isDragOver = false;
    if (e.dataTransfer?.files) this.processFiles(e.dataTransfer.files);
  }

  private processFiles(files: FileList): void {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.imagePreviews.push(result);
        this.produit.images = [...this.imagePreviews];
      };
      reader.readAsDataURL(file);
    });
  }

  onImageUrlAdd(input: HTMLInputElement): void {
    const url = input.value.trim();
    if (!url) return;
    this.imagePreviews.push(url);
    this.produit.images = [...this.imagePreviews];
    input.value = '';
  }

  removeImage(i: number): void {
    this.imagePreviews.splice(i, 1);
    this.produit.images = [...this.imagePreviews];
  }

  // ── Validation ─────────────────────────────────────────────
  get nomInvalid(): boolean {
    return this.submitted && !this.produit.nom?.trim();
  }

  get prixInvalid(): boolean {
    return this.submitted && (
      this.produit.prix == null ||
      isNaN(Number(this.produit.prix)) ||
      Number(this.produit.prix) <= 0
    );
  }

  get stockInvalid(): boolean {
    return this.submitted && (
      this.produit.stock == null ||
      isNaN(Number(this.produit.stock)) ||
      Number(this.produit.stock) < 0 ||
      !Number.isInteger(Number(this.produit.stock))
    );
  }

  get descriptionInvalid(): boolean {
    return this.submitted && (this.produit.description?.length ?? 0) > 500;
  }

  get categorieInvalid(): boolean {
    return this.submitted && !this.produit.categorie;
  }

  get descriptionLength(): number {
    return this.produit.description?.length ?? 0;
  }

  get isFormValid(): boolean {
    return (
      !!this.produit.nom?.trim() &&
      this.produit.prix != null && Number(this.produit.prix) > 0 &&
      this.produit.stock != null && Number(this.produit.stock) >= 0 &&
      Number.isInteger(Number(this.produit.stock)) &&
      (this.produit.description?.length ?? 0) <= 500 &&
      !!this.produit.categorie
    );
  }

  get completenessPercent(): number {
    let s = 0;
    if (this.produit.nom?.trim())                                    s += 25;
    if (this.produit.prix != null && Number(this.produit.prix) > 0)  s += 20;
    if (this.produit.stock != null && Number(this.produit.stock) >= 0) s += 15;
    if (this.produit.description?.trim())                            s += 15;
    if (this.produit.categorie)                                      s += 15;
    if (this.imagePreviews.length > 0)                               s += 10;
    return s;
  }

  // ── Submit ─────────────────────────────────────────────────
  soumettre(): void {
    this.submitted = true;
    if (!this.isFormValid) {
      this.showToast('Please fix the errors before submitting.', 'error');
      return;
    }
    this.loading = true;

    const action = this.isEdit && this.produit.id
      ? this.produitService.update(this.produit.id, this.produit)
      : this.produitService.create(this.produit);

      
    action.subscribe({
      next: () => {
        this.loading = false;
        this.showToast(
          this.isEdit ? 'Product updated successfully!' : 'Product added successfully!',
          'success'
        );
        setTimeout(() => this.router.navigate(['/admin/shop/liste-produits']), 1200);
      },
      error: () => {
        this.loading = false;
        this.showToast('Something went wrong. Please try again.', 'error');
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/shop/liste-produits']);
  }
}