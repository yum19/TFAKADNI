// src/app/core/models/reaction.model.ts

export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'SAD' | 'ANGRY' | 'WOW';

export interface ReactionSummary {
  counts:     Record<ReactionType, number>;
  myReaction: ReactionType | null;
  total:      number;
}

// Emoji + label + color for the picker UI
export const REACTION_META: Record<ReactionType, { emoji: string; label: string; color: string }> = {
  LIKE:  { emoji: '👍', label: 'Like',    color: '#1877f2' },
  LOVE:  { emoji: '❤️', label: 'Love',    color: '#f33e58' },
  HAHA:  { emoji: '😂', label: 'Haha',    color: '#f7b125' },
  WOW:   { emoji: '😮', label: 'Wow',     color: '#f7b125' },
  SAD:   { emoji: '😢', label: 'Sad',     color: '#f7b125' },
  ANGRY: { emoji: '😠', label: 'Angry',   color: '#e9710f' },
};

export const REACTION_TYPES: ReactionType[] = ['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY'];