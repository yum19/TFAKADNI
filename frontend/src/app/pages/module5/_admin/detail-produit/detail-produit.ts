import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProduitService } from '../../../../core/services/produit.service';
import { Produit } from '../../../../core/models/produit.model';

@Component({
  selector: 'app-detail-produit',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatTooltipModule],
  templateUrl: './detail-produit.html',
  styleUrls: ['./detail-produit.css'],
})
export class DetailProduit implements OnInit {
  produit: Produit | null = null;
  loading  = true;
  notFound = false;

  selectedImageIndex = 0;
  deleting = false;

  constructor(
    private route: ActivatedRoute,
    private produitService: ProduitService,
    public router: Router,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.produitService.getById(id).subscribe({
      next: (data) => {
        this.produit = data;
        this.loading = false;
      },
      error: () => {
        this.notFound = true;
        this.loading  = false;
      },
    });
  }

  // ── Image gallery ────────────────────────────────────────────
  get selectedImage(): string {
    if (!this.produit?.images?.length) return '';
    return this.produit.images[this.selectedImageIndex] ?? this.produit.images[0];
  }

  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  prevImage(): void {
    if (!this.produit?.images?.length) return;
    this.selectedImageIndex =
      (this.selectedImageIndex - 1 + this.produit.images.length) % this.produit.images.length;
  }

  nextImage(): void {
    if (!this.produit?.images?.length) return;
    this.selectedImageIndex =
      (this.selectedImageIndex + 1) % this.produit.images.length;
  }

  // ── Stock helpers ────────────────────────────────────────────
  stockBadge(stock?: number): string {
    const s = stock ?? 0;
    if (s === 0)  return 'rupture';
    if (s <= 5)   return 'faible';
    if (s <= 20)  return 'moyen';
    return 'ok';
  }

  stockLabel(stock?: number): string {
    const s = stock ?? 0;
    if (s === 0)  return 'Rupture de stock';
    if (s <= 5)   return 'Stock critique';
    if (s <= 20)  return 'Stock moyen';
    return 'En stock';
  }

  stockPercent(stock?: number): number {
    const s = stock ?? 0;
    // Visual bar — cap display at 100 when > 100
    return Math.min(100, Math.round((s / 100) * 100));
  }

  get valeurStock(): number {
    if (!this.produit) return 0;
    return (this.produit.prix ?? 0) * (this.produit.stock ?? 0);
  }

  // ── Admin actions ────────────────────────────────────────────
  goBack(): void {
    this.router.navigate(['/admin/shop/liste-produits']);
  }

  modifierProduit(): void {
    if (!this.produit) return;
    this.router.navigate(['/admin/shop/creer-produit'], {
      state: { produit: { ...this.produit }, isEdit: true },
    });
  }

  supprimerProduit(): void {
    if (!this.produit?.id) return;
    if (!confirm(`Supprimer « ${this.produit.nom} » ? Cette action est irréversible.`)) return;
    this.deleting = true;
    this.produitService.delete(this.produit.id).subscribe({
      next: () => {
        this.deleting = false;
        alert('✅ Produit supprimé avec succès.');
        this.router.navigate(['/app/shop/liste-produits']);
      },
      error: () => {
        this.deleting = false;
        alert('❌ Erreur lors de la suppression.');
      },
    });
  }
}