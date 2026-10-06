// src/app/components/cart-sidebar/cart-sidebar.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../../core/services/cart.service';

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-sidebar.html',
  styleUrls: ['./cart-sidebar.css'],
})
export class CartSidebarComponent {
  removingId: number | null = null;
  flashId:    number | null = null;
  Math = Math;

  constructor(public cartSvc: CartService, private router: Router) {}

  get items():   CartItem[] { return this.cartSvc.items(); }
  get total():   number     { return this.cartSvc.total(); }
  get isEmpty(): boolean    { return this.cartSvc.isEmpty(); }
  get count():   number     { return this.cartSvc.count(); }

  maxReached(item: CartItem): boolean {
    return item.quantite >= (item.produit.stock || 99);
  }

  lineTot(item: CartItem): number {
    return (item.produit.prix || 0) * item.quantite;
  }

  increase(item: CartItem): void {
    if (!this.maxReached(item)) {
      this.cartSvc.setQuantite(item.produit.id!, item.quantite + 1);
      this._flash(item.produit.id!);
    }
  }

  decrease(item: CartItem): void {
    if (item.quantite <= 1) { this.remove(item); }
    else {
      this.cartSvc.setQuantite(item.produit.id!, item.quantite - 1);
      this._flash(item.produit.id!);
    }
  }

  remove(item: CartItem): void {
    this.removingId = item.produit.id!;
    setTimeout(() => {
      this.cartSvc.remove(item.produit.id!);
      this.removingId = null;
    }, 300);
  }

  checkout(): void {
    this.cartSvc.close();
    this.router.navigate(['/mother/shop/order']);
  }

  continueShopping(): void {
    this.cartSvc.close();
    this.router.navigate(['/mother/shop']);
  }

  private _flash(id: number): void {
    this.flashId = id;
    setTimeout(() => (this.flashId = null), 350);
  }
}