export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface UserSummary {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'USER' | 'PARTNER' | 'ADMIN';
  provider?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface AuthPayload {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserSummary;
}

export interface HealthProfile {
  id?: number;
  age?: number;
  weightKg?: number;
  heightCm?: number;
  bloodType?: string;
  medicalHistoryJson?: string;
  updatedAt?: string;
}

export interface CourseCard {
  id: number;
  title: string;
  titleAr?: string;
  category?: string;
  durationMin?: number;
  level?: string;
  thumbnail?: string;
  moduleCount?: number;
}

export interface Course {
  id: number;
  title: string;
  titleAr?: string;
  description?: string;
  category?: string;
  durationMin?: number;
  level?: string;
  thumbnail?: string;
  modules?: CourseModule[];
}

export interface CourseModule {
  id: number;
  courseId: number;
  courseTitle?: string;
  title: string;
  contentType: string;
  contentUrl?: string;
  contentText?: string;
  orderIndex: number;
  durationMin: number;
  quizId?: number;
}

export interface Enrollment {
  id: number;
  userId: number;
  courseId: number;
  courseTitle: string;
  progressPct: number;
  status: string;
  startedAt?: string;
  completedAt?: string;
}

export interface Review {
  id?: number;
  rating: number;
  comment?: string;
  userId?: number;
  courseId: number;
}

export interface PartnerGuide {
  id: number;
  title: string;
  titleAr?: string;
  content: string;
  targetWeek: number;
  category?: string;
  publishedAt?: string;
}

export interface PartnerPermission {
  id?: number;
  permissionType: string;
  allowed: boolean;
}

export interface PermissionDefinition extends PartnerPermission {
  label: string;
}

export interface PartnerLink {
  id: number;
  status: string;
  linkedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  motherId: number;
  partnerId: number;
  pregnancyId: number;
  permissions: PartnerPermission[];
}

export interface PartnerNote {
  id: number;
  content: string;
  isRead: boolean;
  authorId: number;
  authorName?: string;
  recipientId: number;
  pregnancyId: number;
  createdAt?: string;
}

export interface PartnerNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt?: string;
}

export interface Choice {
  id?: number;
  choiceText: string;
  choiceOrder?: number;
  correct?: boolean;
}

export interface Question {
  id?: number;
  questionText: string;
  questionOrder?: number;
  questionType?: string;
  choices: Choice[];
}

export interface Quiz {
  id: number;
  courseModuleId: number;
  passScore: number;
  questions: Question[];
}

export interface QuizAttemptAnswer {
  questionId: number;
  questionText?: string;
  selectedChoiceId: number;
  selectedChoiceText?: string;
  correct?: boolean;
}

export interface QuizAttempt {
  id: number;
  quizId: number;
  score: number;
  passed: boolean;
  takenAt?: string;
  answers: QuizAttemptAnswer[];
}

export interface RecommendedCourse extends CourseCard {
  recommendationReason?: string;
}

export interface Subscription {
  id: number;
  plan: 'FREE' | 'PREMIUM' | 'PRO';
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PENDING';
  startDate?: string;
  endDate?: string;
  createdAt?: string;
}

export interface Invoice {
  id: number;
  amount: number;
  currency?: string;
  status?: string;
  paymentProvider?: string;
  paidAt?: string;
  pdfUrl?: string;
  createdAt?: string;
}

export interface AiTextResponse {
  feature: string;
  model: string;
  result: string;
}

export interface PregnancyContext {
  id: number | null;
  source: 'api' | 'manual' | 'link' | 'none';
}
