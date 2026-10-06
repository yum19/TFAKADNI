// src/app/core/models/commentaire.model.ts
import { Post } from './post.model';
import { ReactionSummary } from './reaction.model';

export interface Commentaire {
  id?:       number;
  contenu:   string;
  anonyme:   boolean;
  date?:     string;
  post?:     Post;
  authorEmail?: string; 

  // Client-side only — populated after load from ReactionService
  reactionSummary?: ReactionSummary;
}