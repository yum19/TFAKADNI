// src/app/core/models/user-summary.model.ts

export interface UserSummary {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  isFollowedByMe: boolean;
  followersCount: number;
  followingCount: number;
}