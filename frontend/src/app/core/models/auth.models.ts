// ─── Requests ─────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  referralCode?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// ─── Responses ────────────────────────────────────────────────────────────────

export interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'USER' | 'PARTNER' | 'ADMIN';
  provider: 'EMAIL' | 'GOOGLE' | 'APPLE';
  isActive: boolean;
  createdAt: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponse;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminUserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'USER' | 'PARTNER' | 'ADMIN';
  provider: 'EMAIL' | 'GOOGLE' | 'APPLE';
  isActive: boolean;
  createdAt: string;
  age?: number;
  weightKg?: number;
  heightCm?: number;
  bloodType?: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
}