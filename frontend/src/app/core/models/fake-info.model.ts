// src/app/core/models/fake-info.model.ts
export interface FakeInfoAnalysis {
  postId:         number;
  isFakeInfo:     boolean;
  label:          string;       // "VERIFIED" | "NOT_MEDICALLY_VERIFIED"
  labelText:      string;
  confidence:     number;
  category:       string;
  categoryLabel:  string;
  severity?:      string;       // "HIGH" | "MEDIUM" | "LOW"
  badgeText?:     string;
  badgeColor?:    string;
  warningMessage?: string;
  shouldWarn:     boolean;
  badgeIcon?: string;           // ← Add this
}