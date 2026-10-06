// src/app/core/models/follow-notification.model.ts

export interface FollowNotification {
  followerId: number;
  followerName: string;
  message: string;
  type: 'FOLLOW';
  readAt?: Date;
  id?: string; // local UUID for tracking
}