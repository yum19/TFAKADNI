import { Categorie } from './categorie.model';

export interface Produit {
  id?: number;
  nom: string;
  description: string;
  prix: number;
  stock: number;
  images?: string[];
  categorie?: Categorie;
}