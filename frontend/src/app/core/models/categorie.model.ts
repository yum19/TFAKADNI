export interface Categorie {
  id?: number;
  nom: string;
  parent?: Categorie;
  produits?: any[];
}