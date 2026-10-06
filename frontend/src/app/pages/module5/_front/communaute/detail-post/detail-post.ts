import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { PostService } from '../../../../../core/services/post.services';
import { ReactionService } from '../../../../../core/services/reaction.service';
import { Post } from '../../../../../core/models/post.model';
import { Commentaire } from '../../../../../core/models/commentaire.model';
import { REACTION_META, REACTION_TYPES, ReactionType, ReactionSummary } from '../../../../../core/models/reaction.model';
import { IndexHeaderComponent } from '../../../../../components/index-header/index-header.component';
import { IndexFooterComponent } from '../../../../../components/index-footer/index-footer.component';

@Component({
  selector: 'app-detail-post',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatIconModule, MatMenuModule,
    IndexHeaderComponent, IndexFooterComponent,
  ],
  templateUrl: './detail-post.html',
  styleUrls: ['./detail-post.css'],
})
export class DetailPost implements OnInit {
  post: Post | null = null;
  loading = true;
  newComment = '';

  editingCommentId: number | null = null;
  editingCommentText = '';

  // ── Reaction constants ────────────────────────────────────────
  readonly REACTION_META  = REACTION_META;
  readonly REACTION_TYPES = REACTION_TYPES;

  // ── Post reaction state ───────────────────────────────────────
  openPostPicker = false;
  reactingPost   = false;

  // ── Comment reaction state (persisted) ───────────────────────
  openCommentPickerId: number | null = null;
  reactingCommentId:  number | null = null;

  tagLabels: Record<string, string> = {
    GROSSESSE: 'Pregnancy', POSTPARTUM: 'Postpartum',
    FERTILITE: 'Fertility', NUTRITION: 'Nutrition',
  };
  tagEmoji: Record<string, string> = {
    GROSSESSE: '🤰', POSTPARTUM: '👶', FERTILITE: '🌸', NUTRITION: '🥗',
  };

  constructor(
    private route: ActivatedRoute,
    private postService: PostService,
    private reactionService: ReactionService,
    public router: Router,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.postService.getById(id).subscribe({
      next: (data) => {
        this.post    = data;
        this.loading = false;
        if (data.id) {
          this._loadPostReactionSummary(data);
          (data.commentaires || []).forEach(c => {
            if (c.id) this._loadCommentReactionSummary(c);
          });
        }
      },
      error: () => { this.loading = false; },
    });
  }

  // ── Post Reactions ────────────────────────────────────────────

  togglePostPicker(event: Event): void {
    event.stopPropagation();
    this.openPostPicker      = !this.openPostPicker;
    this.openCommentPickerId = null;
  }

  reactToPost(type: ReactionType, event: Event): void {
    event.stopPropagation();
    this.openPostPicker = false;
    if (!this.post?.id || this.reactingPost) return;
    this.reactingPost = true;
    this.reactionService.reactToPost(this.post.id, type).subscribe({
      next: (summary) => { this.post!.reactionSummary = summary; this.reactingPost = false; },
      error: ()       => { this.reactingPost = false; },
    });
  }

  quickLikePost(event: Event): void { this.reactToPost('LIKE', event); }

  myPostReactionColor(): string {
    const r = this.post?.reactionSummary?.myReaction as ReactionType | null | undefined;
    return r ? REACTION_META[r].color : '#6b7280';
  }

  private _loadPostReactionSummary(post: Post): void {
    this.reactionService.getPostSummary(post.id!).subscribe({
      next:  (s) => (post.reactionSummary = s),
      error: (e) => console.warn('Post reaction load failed', e),
    });
  }

  // ── Comment Reactions (persisted to DB) ───────────────────────

  toggleCommentPicker(commentId: number, event: Event): void {
    event.stopPropagation();
    this.openCommentPickerId = this.openCommentPickerId === commentId ? null : commentId;
    this.openPostPicker      = false;
  }

  reactToComment(comment: Commentaire, type: ReactionType, event: Event): void {
    event.stopPropagation();
    this.openCommentPickerId = null;
    if (!comment.id || this.reactingCommentId === comment.id) return;
    this.reactingCommentId = comment.id;
    this.reactionService.reactToComment(comment.id, type).subscribe({
      next: (summary) => {
        comment.reactionSummary = summary;
        this.reactingCommentId  = null;
      },
      error: (err) => {
        console.error('Comment reaction failed', err);
        this.reactingCommentId = null;
      },
    });
  }

  quickLikeComment(comment: Commentaire, event: Event): void {
    this.reactToComment(comment, 'LIKE', event);
  }

  commentReactionColor(comment: Commentaire): string {
    const r = comment.reactionSummary?.myReaction;
    return r ? REACTION_META[r].color : '#6b7280';
  }

  dominantCommentEmoji(comment: Commentaire): string {
    const counts = comment.reactionSummary?.counts;
    if (!counts) return '👍';
    let max = 0;
    let winner: ReactionType = 'LIKE';
    for (const t of REACTION_TYPES) {
      if ((counts[t] || 0) > max) { max = counts[t]; winner = t; }
    }
    return max > 0 ? REACTION_META[winner].emoji : '👍';
  }

  private _loadCommentReactionSummary(comment: Commentaire): void {
    this.reactionService.getCommentSummary(comment.id!).subscribe({
      next:  (s) => (comment.reactionSummary = s),
      error: (e) => console.warn('Comment reaction load failed', comment.id, e),
    });
  }

  closePickers(): void {
    this.openPostPicker      = false;
    this.openCommentPickerId = null;
  }

  // ── Comments CRUD ─────────────────────────────────────────────

  submitComment(): void {
    const text = this.newComment.trim();
    if (!text || !this.post?.id) return;
    this.postService.addComment(this.post.id, text).subscribe({
      next: (c) => {
        this.post!.commentaires = [...(this.post!.commentaires ?? []), c];
        this.newComment = '';
        // Load reaction summary for the new comment
        if (c.id) this._loadCommentReactionSummary(c);
      },
      error: (err) => console.error(err),
    });
  }

  startEditComment(commentId: number, currentText: string): void {
    this.editingCommentId   = commentId;
    this.editingCommentText = currentText;
  }

  cancelEditComment(): void {
    this.editingCommentId   = null;
    this.editingCommentText = '';
  }

  saveEditComment(commentId: number): void {
    const text = this.editingCommentText.trim();
    if (!text || !this.post?.id) return;
    this.postService.updateComment(this.post.id, commentId, text).subscribe({
      next: (updated) => {
        const idx = this.post!.commentaires!.findIndex(c => c.id === commentId);
        if (idx !== -1) {
          // Preserve existing reactionSummary after edit
          const existing = this.post!.commentaires![idx];
          this.post!.commentaires![idx] = { ...updated, reactionSummary: existing.reactionSummary };
        }
        this.cancelEditComment();
      },
      error: (err) => console.error(err),
    });
  }

  deleteComment(commentId: number): void {
    if (!confirm('Delete this comment?') || !this.post?.id) return;
    this.postService.deleteComment(this.post.id, commentId).subscribe({
      next: () => {
        this.post!.commentaires = this.post!.commentaires!.filter(c => c.id !== commentId);
      },
      error: (err) => console.error(err),
    });
  }

  openEditPost(): void {
    if (!this.post) return;
    this.router.navigate(['/communaute/creer-post'], { state: { post: { ...this.post }, isEdit: true } });
  }

  deletePost(): void {
    if (!this.post?.id || !confirm('Are you sure you want to delete this post?')) return;
    this.postService.delete(this.post.id).subscribe({
      next: () => { alert('Post deleted successfully'); this.router.navigate(['/communaute']); },
      error: (err) => { console.error(err); alert('Error deleting post'); },
    });
  }

  goBack(): void { this.router.navigate(['/communaute']); }
}