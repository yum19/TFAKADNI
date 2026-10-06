// src/app/core/models/saved-post.model.ts

export interface SavedPostResponse {
  savedPostId: number;
  savedAt: string;
  postId: number;
  contenu: string;
  tag: 'GROSSESSE' | 'POSTPARTUM' | 'FERTILITE' | 'NUTRITION';
  anonyme: boolean;
  likes: number;
  postDate: string;
  images: string[];
  commentCount: number;
  authorName: string;
  authorEmail?: string;
  authorId?: number;
}

export interface ToggleSaveResponse {
  saved: boolean;
  count: number;
}