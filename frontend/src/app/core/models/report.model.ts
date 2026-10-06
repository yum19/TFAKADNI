// src/app/core/models/report.model.ts
export type ReportReason =
  | 'SPAM'
  | 'HARASSMENT'
  | 'MISINFORMATION'
  | 'INAPPROPRIATE_CONTENT'
  | 'HATE_SPEECH'
  | 'OTHER';

export interface ReportRequest {
  postId: number;
  reason: ReportReason;
  details?: string;
}

export interface PostNotification {
  type: 'POST_REPORTED' | 'POST_DELETED';
  postId: number;
  message: string;
  id?: string;
  readAt?: Date;
}

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  SPAM:                  '🚫 Spam',
  HARASSMENT:            '😤 Harassment',
  MISINFORMATION:        '❌ Misinformation',
  INAPPROPRIATE_CONTENT: '🔞 Inappropriate Content',
  HATE_SPEECH:           '💢 Hate Speech',
  OTHER:                 '📝 Other',
};