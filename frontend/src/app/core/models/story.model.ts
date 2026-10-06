// src/app/core/models/story.model.ts
export interface Story {
  id?: number;
  contenu?: string;
  imageUrl?: string;  // Base64 string
  type: 'TEXT' | 'PHOTO';
  createdAt?: string;
  expiresAt?: string;
}