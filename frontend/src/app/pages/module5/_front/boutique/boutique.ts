// src/app/pages/shop/_front/boutique/boutique.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProduitService } from '../../../../core/services/produit.service';
import { CategorieService } from '../../../../core/services/categorie.service';
import { CartService } from '../../../../core/services/cart.service';
import { Produit } from '../../../../core/models/produit.model';
import { Categorie } from '../../../../core/models/categorie.model';
import { IndexHeaderComponent } from '../../../../components/index-header/index-header.component';
import { IndexFooterComponent } from '../../../../components/index-footer/index-footer.component';

@Component({
  selector: 'app-boutique',
  standalone: true,
  imports: [CommonModule, FormsModule, IndexHeaderComponent, IndexFooterComponent],
  templateUrl: './boutique.html',
  styleUrls: ['./boutique.css'],
})
export class Boutique implements OnInit {

  produits: Produit[]         = [];
  filteredProduits: Produit[] = [];
  categories: Categorie[]     = [];
  loading      = true;
  searchQuery  = '';
  selectedCat: number | null  = null;
  sortMode: 'default' | 'prix-asc' | 'prix-desc' | 'nom' = 'default';
  viewMode: 'grid' | 'list'   = 'grid';
  wishlist     = new Set<number>();
  cartFeedback = new Set<number>();
  cartBurst    = new Set<number>();
  alreadyFeedback = new Set<number>();

  get totalProduits() { return this.produits.length; }
  get enStock()       { return this.produits.filter(p => (p.stock || 0) > 0).length; }
  get hasActiveFilter() {
    return !!this.searchQuery || this.selectedCat !== null || this.sortMode !== 'default';
  }

  constructor(
    private produitSvc:   ProduitService,
    private categorieSvc: CategorieService,
    public  cartSvc:      CartService,
    private router:       Router,
  ) {}

  ngOnInit(): void {
    this.produitSvc.getAll().subscribe({
      next: data => {
        this.produits = data.filter(p => (p.stock || 0) > 0);
        this.applyFilter();
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
    this.categorieSvc.getAll().subscribe({
      next: data => { this.categories = data.filter(c => !c.parent); },
    });
  }

  applyFilter(): void {
    let r = [...this.produits];
    const q = this.searchQuery.toLowerCase().trim();
    if (q) r = r.filter(p =>
      p.nom?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.categorie?.nom?.toLowerCase().includes(q)
    );
    if (this.selectedCat !== null)
      r = r.filter(p => p.categorie?.id === this.selectedCat || p.categorie?.parent?.id === this.selectedCat);
    switch (this.sortMode) {
      case 'prix-asc':  r.sort((a, b) => (a.prix || 0) - (b.prix || 0)); break;
      case 'prix-desc': r.sort((a, b) => (b.prix || 0) - (a.prix || 0)); break;
      case 'nom':       r.sort((a, b) => (a.nom || '').localeCompare(b.nom || '')); break;
    }
    this.filteredProduits = r;
  }

  selectCat(id: number | null): void {
    this.selectedCat = this.selectedCat === id ? null : id;
    this.applyFilter();
  }
  onSort(m: string): void { this.sortMode = m as typeof this.sortMode; this.applyFilter(); }
  clearFilters(): void    { this.searchQuery = ''; this.selectedCat = null; this.sortMode = 'default'; this.applyFilter(); }
  voirProduit(p: Produit): void { this.router.navigate(['/mother/shop/product', p.id]); }

  toggleWishlist(e: Event, id: number): void {
    e.stopPropagation();
    this.wishlist.has(id) ? this.wishlist.delete(id) : this.wishlist.add(id);
  }

  addToCart(e: Event, produit: Produit): void {
    e.stopPropagation();
    if (!produit.id) return;

    const alreadyIn = this.cartSvc.isProductInCart(produit.id);

    if (alreadyIn) {
      this.alreadyFeedback.add(produit.id);
      setTimeout(() => this.alreadyFeedback.delete(produit.id!), 2000);
      return;
    }

    this.cartSvc.add(produit, 1);

    this.cartFeedback.add(produit.id);
    this.cartBurst.add(produit.id);
    setTimeout(() => this.cartFeedback.delete(produit.id!), 2000);
    setTimeout(() => this.cartBurst.delete(produit.id!), 700);
  }

  descLen(p: Produit): number { return p.description ? p.description.length : 0; }
  isLowStock(p: Produit) { return (p.stock || 0) > 0 && (p.stock || 0) <= 5; }
  isInCart(p: Produit)   { return this.cartSvc.isProductInCart(p.id!); }
}