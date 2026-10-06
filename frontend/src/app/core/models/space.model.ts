// src/app/core/models/space.model.ts

export type SpaceCategory = 'GROSSESSE' | 'POSTPARTUM' | 'FERTILITE' | 'NUTRITION';
export type SpaceAudience = 'EVERYONE' | 'FOLLOWERS';
export type SpaceStatus   = 'SCHEDULED' | 'LIVE' | 'ENDED';
export type ParticipantRole = 'HOST' | 'SPEAKER' | 'LISTENER';

export interface SpaceParticipant {
  userId: number;
  userName: string;
  userEmail: string;
  role: ParticipantRole;
  micActive: boolean;
  handRaised: boolean;
  anonymous: boolean;   // ← ADD THIS

}

export interface Space {
  id: number;
  title: string;
  category: SpaceCategory;
  audience: SpaceAudience;
  anonymousAllowed: boolean;
  maxSpeakers: number;
  scheduledAt: string;
  startedAt?: string;
  status: SpaceStatus;
  hostEmail: string;
  hostId: number;
  hostName: string;
  createdAt: string;
  listenerCount: number;
  speakerCount: number;
  participants: SpaceParticipant[];
}

export interface CreateSpaceRequest {
  title: string;
  category: SpaceCategory;
  audience: SpaceAudience;
  anonymousAllowed: boolean;
  maxSpeakers: number;
  scheduledAt: string | null;
}

export interface SpaceWsMessage {
  type: 'JOIN' | 'LEAVE' | 'MIC_TOGGLE' | 'HAND_RAISE' | 'PROMOTE'
      | 'KICK' | 'SUBTITLE' | 'END' | 'STARTED' | 'CREATED' | 'ERROR'|"SPACE_STARTED_FOLLOW";   // ← Add this line;
  spaceId: number;
  userId?: number;
  userName?: string;
  payload?: string;
  value?: boolean;
}

export const CATEGORY_META: Record<SpaceCategory, { label: string; emoji: string; color: string }> = {
  GROSSESSE:  { label: 'Pregnancy',  emoji: '🤰', color: 'linear-gradient(135deg,#ff4f75,#ff6b8a)' },
  POSTPARTUM: { label: 'Postpartum', emoji: '👶', color: 'linear-gradient(135deg,#6c5ce7,#a29bfe)' },
  FERTILITE:  { label: 'Fertility',  emoji: '🌸', color: 'linear-gradient(135deg,#fd79a8,#e84393)' },
  NUTRITION:  { label: 'Nutrition',  emoji: '🥗', color: 'linear-gradient(135deg,#00b894,#00cec9)' },
};