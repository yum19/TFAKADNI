import { ReactionSummary } from "./reaction.model";
import { Commentaire } from './commentaire.model';
export { Commentaire };

export interface Post {
  id?: number;
  contenu: string;
  tag: 'GROSSESSE' | 'POSTPARTUM' | 'FERTILITE' | 'NUTRITION';
  anonyme: boolean;
  likes?: number;
  date?: string;
  images?: string[];
  commentaires?: Commentaire[];
  reactionSummary?: ReactionSummary;
  authorEmail?: string; 
  userId?: number;  
}


