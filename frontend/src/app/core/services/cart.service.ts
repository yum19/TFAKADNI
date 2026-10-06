import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Produit } from '../models/produit.model';
import { environment } from '../../../environments/environment';

export interface CartItem {
  produit: Produit;
  quantite: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {

  private _items   = signal<CartItem[]>([]);
  private _isOpen  = signal(false);
  private _addBump = signal(0);

  readonly items   = this._items.asReadonly();
  readonly isOpen  = this._isOpen.asReadonly();
  readonly addBump = this._addBump.asReadonly();

  readonly count   = computed(() => this._items().reduce((sum, i) => sum + i.quantite, 0));
  readonly total   = computed(() => this._items().reduce((sum, i) => sum + i.produit.prix * i.quantite, 0));
  readonly isEmpty = computed(() => this._items().length === 0);

  constructor(private http: HttpClient) {
    this.loadFromBackend(); // ← load on app start
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // ── Load existing cart from DB on startup ──────────────────
  loadFromBackend(): void {
    const token = localStorage.getItem('access_token');
    if (!token) return; // not logged in yet

    this.http.get<any[]>(`${environment.apiUrl}/paniers`, { headers: this.getHeaders() })
      .subscribe({
        next: paniers => {
          if (!paniers || paniers.length === 0) return;

          // Take the most recent panier
          const latest = paniers[paniers.length - 1];
          const items: CartItem[] = (latest.items ?? []).map((item: any) => ({
            produit: item.produit,
            quantite: item.quantite ?? 1
          }));
          this._items.set(items);
        },
        error: () => {} // silently fail if not authenticated yet
      });
  }

  open():   void { this._isOpen.set(true);  }
  close():  void { this._isOpen.set(false); }
  toggle(): void { this._isOpen.set(!this._isOpen()); }

  add(produit: Produit, quantite = 1): void {
    const current = this._items();
    const idx = current.findIndex(i => i.produit.id === produit.id);
    if (idx >= 0) {
      const updated = [...current];
      updated[idx] = { ...updated[idx], quantite: Math.min(updated[idx].quantite + quantite, produit.stock ?? 99) };
      this._items.set(updated);
    } else {
      this._items.set([...current, { produit, quantite }]);
    }
    this._addBump.update(v => v + 1);

    // Save to backend
    const panier = { items: [{ produit: { id: produit.id }, quantite }] };
    this.http.post(`${environment.apiUrl}/paniers`, panier, { headers: this.getHeaders() })
      .subscribe({
        next: () => console.log('Cart saved to DB'),
        error: (e) => console.error('Failed to save cart:', e)
      });
  }

  remove(produitId: number): void {
    this._items.update(items => items.filter(i => i.produit.id !== produitId));
  }

  setQuantite(produitId: number, quantite: number): void {
    this._items.update(items =>
      items.map(i => i.produit.id === produitId ? { ...i, quantite } : i)
    );
  }

  isProductInCart(produitId: number): boolean {
    return this._items().some(i => i.produit.id === produitId);
  }

  clear(): void { this._items.set([]); }
}