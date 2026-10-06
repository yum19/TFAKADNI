// src/app/pages/shop/_front/produit-detail/produit-detail.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ProduitService } from '../../../../core/services/produit.service';
import { CartService } from '../../../../core/services/cart.service';
import { Produit } from '../../../../core/models/produit.model';
import { IndexHeaderComponent } from '../../../../components/index-header/index-header.component';
import { IndexFooterComponent } from '../../../../components/index-footer/index-footer.component';

@Component({
  selector: 'app-produit-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, IndexHeaderComponent, IndexFooterComponent],
  templateUrl: './produit-detail.html',
  styleUrls: ['./produit-detail.css'],
})
export class ProduitDetail implements OnInit {

  produit: Produit | null = null;
  loading  = true;
  notFound = false;

  selectedImageIndex = 0;
  quantity    = 1;
  wishlist    = false;
  activeTab: 'description' | 'details' | 'delivery' = 'description';

  constructor(
    private route:      ActivatedRoute,
    private produitSvc: ProduitService,
    public  cartSvc:    CartService,
    public  router:     Router,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.notFound = true; this.loading = false; return; }
    if (!id || isNaN(+id)) {
      this.router.navigate(['/communaute']);
      return;
    }
    this.produitSvc.getById(id).subscribe({
      next: data => { this.produit = data; this.loading = false; },
      error: ()   => { this.notFound = true; this.loading = false; },
    });
  }

  get selectedImage(): string {
    if (!this.produit?.images?.length) return '';
    return this.produit.images[this.selectedImageIndex] ?? this.produit.images[0];
  }
  selectImage(i: number): void { this.selectedImageIndex = i; }
  prevImage(): void {
    if (!this.produit?.images?.length) return;
    this.selectedImageIndex = (this.selectedImageIndex - 1 + this.produit.images.length) % this.produit.images.length;
  }
  nextImage(): void {
    if (!this.produit?.images?.length) return;
    this.selectedImageIndex = (this.selectedImageIndex + 1) % this.produit.images.length;
  }

  increase(): void { if (this.quantity < (this.produit?.stock || 99)) this.quantity++; }
  decrease(): void { if (this.quantity > 1) this.quantity--; }

  get isInCart(): boolean {
    return this.produit ? this.cartSvc.isProductInCart(this.produit.id!) : false;
  }

  addToCart(): void {
    if (!this.inStock || !this.produit) return;
    if (this.isInCart) {
      this.cartSvc.open();
      return;
    }
    this.cartSvc.add(this.produit, this.quantity);
  }

  buyNow(): void {
    if (!this.produit || !this.inStock) return;
    if (!this.isInCart) {
      this.cartSvc.add(this.produit, this.quantity);
    }
    this.router.navigate(['/shop/order']);
  }

  toggleWishlist(): void { this.wishlist = !this.wishlist; }
  goBack(): void { this.router.navigate(['/shop']); }

  get inStock(): boolean { return (this.produit?.stock || 0) > 0; }
  get imageCount(): number { return this.produit?.images?.length || 0; }

  get stockLabel(): string {
    const s = this.produit?.stock || 0;
    if (s === 0) return 'Out of stock';
    if (s <= 5)  return `Only ${s} left in stock!`;
    return 'In stock';
  }

  get stockClass(): 'ok' | 'low' | 'out' {
    const s = this.produit?.stock || 0;
    if (s === 0) return 'out';
    if (s <= 5)  return 'low';
    return 'ok';
  }

  maxQty(): number { return this.produit?.stock || 0; }
}