import { Produit } from './produit.model';

export interface PanierItem {
  id?: number;
  produit: Produit;
  quantite: number;
}

export interface Panier {
  id?: number;
  items: PanierItem[];
}