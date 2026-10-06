/**
 * Mirrors PostAnalysisDTO from the Spring Boot backend.
 * Returned by GET /api/posts/{postId}/analysis
 */
export interface PostAnalysis {
  postId:             number;
  isHarmful:          boolean;
  severity:           'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  category:           string;
  categoryLabel:      string;
  confidence:         number;
  warningMessage:     string | null;  // shown to the post AUTHOR only
  blurMessage:        string | null;  // shown to OTHER users when blurred
  shouldBlur:         boolean;
  authorAcknowledged: boolean;
}