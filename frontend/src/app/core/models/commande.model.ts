// src/app/core/models/commande.model.ts
import { Produit } from './produit.model';

export interface CommandeItem {
  id?:           number;
  produit:       Produit;
  quantite:      number;
  prixUnitaire:  number;
}

export interface Commande {
  id?:              number;
  nom?:             string;
  prenom?:          string;
  mail?:            string;
  adresse?:         string;
  total?:           number;
  date?:            string;
  stripeSessionId?: string;
  /** PENDING | PAID | FAILED */
  statut?:          string;
  items?:           CommandeItem[];
}