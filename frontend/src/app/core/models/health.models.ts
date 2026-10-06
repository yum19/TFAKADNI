// ─── Health Profile ───────────────────────────────────────────────────────────

export type BloodType = 'A_POS' | 'A_NEG' | 'B_POS' | 'B_NEG' | 'AB_POS' | 'AB_NEG' | 'O_POS' | 'O_NEG';

export interface HealthProfileRequest {
  age: number;
  weightKg: number;
  heightCm: number;
  bloodType?: BloodType;
  medicalHistoryJson?: string;
}

export interface HealthProfileResponse {
  id: number;
  age: number;
  weightKg: number;
  heightCm: number;
  bloodType?: BloodType;
  medicalHistoryJson?: string;
  updatedAt: string;
  firstName: string;
  lastName: string;
}

// ─── Session ──────────────────────────────────────────────────────────────────

export interface SessionResponse {
  id: number;
  deviceInfo: string;
  ip: string;
  createdAt: string;
  expiresAt: string;
  current: boolean;
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export type SubscriptionPlan = 'FREE' | 'PREMIUM' | 'PRO';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PENDING';

export interface SubscriptionRequest {
  plan: SubscriptionPlan;
  promoCode?: string;
}

export interface SubscriptionResponse {
  id: number;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

// ─── Invoice ──────────────────────────────────────────────────────────────────

export type InvoiceStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type PaymentProvider = 'STRIPE' | 'KONNECT';

export interface InvoiceResponse {
  id: number;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  paymentProvider: PaymentProvider;
  paidAt?: string;
  pdfUrl?: string;
  createdAt: string;
}

// ─── Promo Code ───────────────────────────────────────────────────────────────

export interface ValidatePromoRequest {
  code: string;
  plan: SubscriptionPlan;
}

export interface PromoCodeResponse {
  id: number;
  code: string;
  discountPercent?: number;
  discountPct?: number;
  expiresAt?: string;
  usageLimit?: number;
  usageCount: number;
}