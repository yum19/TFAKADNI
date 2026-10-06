import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProduitService } from '../../../../core/services/produit.service';
import { Produit } from '../../../../core/models/produit.model';

@Component({
  selector: 'app-liste-produits',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatIconModule, MatTooltipModule],
  templateUrl: './liste-produits.html',
  styleUrls: ['./liste-produits.css'],
})
export class ListeProduits implements OnInit {
  produits: Produit[]         = [];
  filteredProduits: Produit[] = [];
  loading     = true;
  searchQuery = '';
  viewMode: 'grid' | 'table' = 'grid';

  // ── Confirm dialog ─────────────────────────────────────────
  confirmTarget: Produit | null = null;
  deleting = false;

  // ── Toast ──────────────────────────────────────────────────
  toast: { message: string; type: 'success' | 'error' } | null = null;
  private toastTimer: any;

  get totalProduits() { return this.produits.length; }
  get totalStock()    { return this.produits.reduce((s, p) => s + (p.stock ?? 0), 0); }
  get valeurStock()   { return this.produits.reduce((s, p) => s + (p.prix ?? 0) * (p.stock ?? 0), 0); }
  get ruptures()      { return this.produits.filter(p => (p.stock ?? 0) === 0).length; }

  constructor(private produitService: ProduitService, public router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  // ── Toast helper ───────────────────────────────────────────
  showToast(message: string, type: 'success' | 'error'): void {
    clearTimeout(this.toastTimer);
    this.toast = { message, type };
    this.toastTimer = setTimeout(() => (this.toast = null), 3500);
  }

  // ── Data ───────────────────────────────────────────────────
  load(): void {
    this.loading = true;
    this.produitService.getAll().subscribe({
      next: (data) => {
        this.produits = data;
        this.applyFilter();
        this.loading  = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.showToast('Failed to load products. Please try again.', 'error');
      },
    });
  }

  applyFilter(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredProduits = q
      ? this.produits.filter(p =>
          p.nom?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.categorie?.nom?.toLowerCase().includes(q)
        )
      : [...this.produits];
  }

  search(): void {
    this.applyFilter();
  }

  // ── Navigation ─────────────────────────────────────────────
  viewProduct(produit: Produit): void {
    this.router.navigate(['/admin/shop/product', produit.id]);
  }

  editProduct(produit: Produit): void {
    this.router.navigate(['/admin/shop/creer-produit'], {
      state: { produit: { ...produit }, isEdit: true },
    });
  }

  // ── Delete (with inline confirm dialog) ────────────────────
  requestDelete(produit: Produit): void {
    this.confirmTarget = produit;
  }

  cancelDelete(): void {
    this.confirmTarget = null;
  }

  confirmDelete(): void {
    if (!this.confirmTarget?.id) return;
    this.deleting = true;
    this.produitService.delete(this.confirmTarget.id).subscribe({
      next: () => {
        this.produits         = this.produits.filter(p => p.id !== this.confirmTarget!.id);
        this.filteredProduits = this.filteredProduits.filter(p => p.id !== this.confirmTarget!.id);
        this.showToast(`"${this.confirmTarget!.nom}" has been deleted.`, 'success');
        this.confirmTarget = null;
        this.deleting      = false;
      },
      error: () => {
        this.deleting = false;
        this.showToast('Failed to delete the product. Please try again.', 'error');
      },
    });
  }

  // ── Stock helpers ──────────────────────────────────────────
  stockBadge(stock: number): string {
    if (stock === 0) return 'out';
    if (stock <= 5)  return 'low';
    return 'ok';
  }

  stockLabel(stock: number): string {
    if (stock === 0) return 'Out of stock';
    if (stock <= 5)  return 'Low stock';
    return 'In stock';
  }
}