import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }                 from '@angular/common';
import { RouterLink, Router }           from '@angular/router';
import { FormsModule }                  from '@angular/forms';
import { MatIconModule }                from '@angular/material/icon';
import { MatMenuModule }                from '@angular/material/menu';
import { MatDividerModule }             from '@angular/material/divider';
import { HttpClient, HttpHeaders }      from '@angular/common/http';

import { PostService }           from '../../../../core/services/post.services';
import { StoryService }          from '../../../../core/services/story.service';
import { ReactionService }       from '../../../../core/services/reaction.service';
import { FollowService }         from '../../../../core/services/follow.service';
import { SavedPostService }      from '../../../../core/services/saved-post.service';
import { HarmfulContentService } from '../../../../core/services/harmful-content.service';

import { Post }        from '../../../../core/models/post.model';
import { Story }       from '../../../../core/models/story.model';
import { Commentaire } from '../../../../core/models/commentaire.model';
import { REACTION_META, REACTION_TYPES } from '../../../../core/models/reaction.model';

import { MessengerBubbleComponent } from '../../../../components/messenger-bubble/messenger-bubble.component';

import { getEmailFromToken, getUserIdFromToken } from '../../../../core/services/token.helper';
import { environment } from '../../../../../environments/environment';

const ADMIN_NAME  = 'TFAKADNI';
const ADMIN_EMAIL = 'admin';

/**
 * We use `any` for post objects throughout this admin component to avoid
 * conflicts with the strict `Post` model (e.g. `anonyme: boolean` vs
 * the server returning `anonyme?: boolean | undefined`).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPost = any;

@Component({
  selector: 'app-liste-posts-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MessengerBubbleComponent,
  ],
  templateUrl: './liste-posts-admin.html',
  styleUrls: ['./liste-posts-admin.css'],
})
export class ListePostsAdmin implements OnInit, OnDestroy {

  // ── Identity ───────────────────────────────────────────────
  readonly ADMIN_NAME = ADMIN_NAME;
  myEmail  = '';
  myUserId = 0;

  // ── Posts — typed any[] to sidestep Post.anonyme strict clash ─
  posts:         AnyPost[] = [];
  filteredPosts: AnyPost[] = [];
  loading        = true;
  activeTab      = 'all';
  activeFilter   = 'all';
  searchQuery    = '';
  sortMode: 'recent' | 'oldest' | 'top' = 'recent';

  // ── Compose ────────────────────────────────────────────────
  newPostContent   = '';
  newPostTag       = 'GROSSESSE';
  posting          = false;
  showComposeModal = false;

  // ── Edit post ──────────────────────────────────────────────
  editingPost:     AnyPost = null;
  editPostContent  = '';
  editPostTag      = 'GROSSESSE';

  // ── Comments ───────────────────────────────────────────────
  commentInputs:        Record<number, string> = {};
  editingCommentId:     number | null = null;
  editingCommentText    = '';
  editingCommentPostId: number | null = null;

  // ── Stories ────────────────────────────────────────────────
  activeStories: Story[] = [];

  // ── Reports ────────────────────────────────────────────────
  allReports: AnyPost[] = [];

  // ── Stats ──────────────────────────────────────────────────
  totalPosts       = 0;
  totalUsers       = 0;
  totalComments    = 0;
  totalReactions   = 0;
  totalStories     = 0;
  adminPostsCount  = 0;
  pendingReports   = 0;
  activeUsersCount = 0;
  postsToday       = 0;
  anonymousPosts   = 0;

  // Community Health (0–100)
  engagementRate = 0;
  commentRate    = 0;
  safetyScore    = 100;
  mediaRichness  = 0;

  // Top posters for sidebar
  topPosters: { name: string; email: string; count: number; pct: number }[] = [];

  // ── AI Summary ─────────────────────────────────────────────
  postSummaryMap:    Record<number, string> = {};
  summarizingPostId: number | null = null;

  // ── Toast ──────────────────────────────────────────────────
  toast: { message: string; type: 'success' | 'error' | 'info' } | null = null;
  private toastTimer:  ReturnType<typeof setTimeout> | null = null;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  // Picker state
  openReactionPickerId:  number | null = null;
  openCommentReactionId: number | null = null;
  copiedPostId:          number | null = null;

  readonly REACTION_META  = REACTION_META;
  readonly REACTION_TYPES = REACTION_TYPES;

  readonly availableTags = [
    { value: 'GROSSESSE',  label: 'Grossesse',  emoji: '🤰' },
    { value: 'POSTPARTUM', label: 'Postpartum', emoji: '👶' },
    { value: 'FERTILITE',  label: 'Fertilité',  emoji: '🌸' },
    { value: 'NUTRITION',  label: 'Nutrition',  emoji: '🥗' },
  ];

  readonly tagLabels: Record<string, string> = {
    GROSSESSE: 'Pregnancy', POSTPARTUM: 'Postpartum',
    FERTILITE: 'Fertility', NUTRITION: 'Nutrition',
  };
  readonly tagEmoji: Record<string, string> = {
    GROSSESSE: '🤰', POSTPARTUM: '👶', FERTILITE: '🌸', NUTRITION: '🥗',
  };

  private readonly storyColors = [
    'linear-gradient(135deg,#ff4f75,#ff6b8a)',
    'linear-gradient(135deg,#6c5ce7,#a29bfe)',
    'linear-gradient(135deg,#00b894,#00cec9)',
    'linear-gradient(135deg,#e17055,#d63031)',
  ];

  private authorNameCache = new Map<string, string>();

  constructor(
    private postService:     PostService,
    private storyService:    StoryService,
    private reactionService: ReactionService,
    private followService:   FollowService,
    private savedPostSvc:    SavedPostService,
    private harmfulSvc:      HarmfulContentService,
    private http:            HttpClient,
    private router:          Router,
  ) {}

  ngOnInit(): void {
    this.myEmail  = getEmailFromToken() || '';
    this.myUserId = getUserIdFromToken() || 0;
    this.loadPosts();
    this.loadStories();
    this.loadReports();
    this.loadUserStats();
    this.refreshTimer = setInterval(() => this.loadPosts(), 45_000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    if (this.toastTimer)   clearTimeout(this.toastTimer);
  }

  // ── Navigation ─────────────────────────────────────────────
  goBackToDashboard(): void {
    this.router.navigate(['admin/community']);
  }

  // ── Admin identity helpers ─────────────────────────────────
  isAdminPost(post: AnyPost): boolean {
    return post._admin === true
        || post.authorEmail === ADMIN_EMAIL
        || post.user?.role === 'ADMIN'
        || (String(post.user?.firstName ?? '') + ' ' + String(post.user?.lastName ?? '')).trim() === ADMIN_NAME;
  }

  getPostAuthorName(post: AnyPost): string {
  if (this.isAdminPost(post)) return ADMIN_NAME;
  if (post.anonyme)           return 'Anonymous Member';

  // ── Primary: user object nested on the post (most reliable) ──
  if (post.user) {
    const full = `${post.user.firstName ?? ''} ${post.user.lastName ?? ''}`.trim();
    if (full) return full;
    if (post.user.username) return post.user.username;
    if (post.user.email)    return this._nameFromEmail(post.user.email);
  }

  // ── Secondary: flat fields the backend might denormalize ──
  const direct = post.authorName || post.userName || post.fullName
              || post.author?.fullName || post.author?.name;
  if (direct) return direct;

  // ── Tertiary: email → cache → derive ──
  if (post.authorEmail) {
    const cached = this.authorNameCache.get((post.authorEmail as string).toLowerCase());
    if (cached) return cached;
    return this._nameFromEmail(post.authorEmail as string);
  }

  return 'Unknown User';
}

  getCommentAuthorName(c: AnyPost): string {
  // Comments nest the user the same way
  if (c.user) {
    const full = `${c.user.firstName ?? ''} ${c.user.lastName ?? ''}`.trim();
    if (full) return full;
    if (c.user.username) return c.user.username;
    if (c.user.email)    return this._nameFromEmail(c.user.email);
  }

  const direct = c.authorName || c.userName || c.fullName || c.author?.fullName;
  if (direct) return direct;

  if (c.authorEmail) {
    const cached = this.authorNameCache.get((c.authorEmail as string).toLowerCase());
    if (cached) return cached;
    return this._nameFromEmail(c.authorEmail as string);
  }

  return 'Unknown User';
}

  private _nameFromEmail(email: string): string {
    if (!email) return 'Community Member';
    return email.split('@')[0]
      .replace(/[._\-+]/g, ' ')
      .replace(/\b\w/g, (ch: string) => ch.toUpperCase())
      .trim() || 'Community Member';
  }

  getInitials(name: string): string {
    return (name || '??').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  // ── Toast ──────────────────────────────────────────────────
  showToast(msg: string, type: 'success' | 'error' | 'info' = 'success'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = { message: msg, type };
    this.toastTimer = setTimeout(() => (this.toast = null), 3500);
  }

  private h(): HttpHeaders {
    return new HttpHeaders({
      Authorization:  `Bearer ${localStorage.getItem('auth_token') || ''}`,
      'Content-Type': 'application/json',
    });
  }

  // ── Load Posts ─────────────────────────────────────────────
  loadPosts(): void {
    this.postService.getAll().subscribe({
      next: (posts: Post[]) => {
        // Cast to AnyPost[] so we can set _admin and handle optional fields freely
        this.posts   = posts as AnyPost[];
        this.loading = false;
        this._computeStats(this.posts);
        this.applySearch();
        this.posts.forEach((p: AnyPost) => {
          if (p.id) this._loadReactionSummary(p);
          (p.commentaires ?? []).forEach((c: AnyPost) => {
            if (c.id) this._loadCommentReactionSummary(c);
          });
        });
      },
      error: () => { this.loading = false; },
    });
  }

  private _computeStats(posts: AnyPost[]): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.totalPosts      = posts.length;
    this.adminPostsCount = posts.filter((p: AnyPost) => this.isAdminPost(p)).length;
    this.postsToday      = posts.filter((p: AnyPost) => new Date(p.date ?? 0) >= today).length;
    this.anonymousPosts  = posts.filter((p: AnyPost) => !!p.anonyme).length;
    this.totalComments   = posts.reduce((s: number, p: AnyPost) => s + (p.commentaires?.length ?? 0), 0);
    this.totalReactions  = posts.reduce((s: number, p: AnyPost) => s + (p.reactionSummary?.total ?? 0), 0);

    const withImages = posts.filter((p: AnyPost) => (p.images?.length ?? 0) > 0).length;

    this.engagementRate = posts.length
      ? Math.min(100, Math.round((this.totalReactions / posts.length) * 10)) : 0;
    this.commentRate = posts.length
      ? Math.min(100, Math.round((this.totalComments / posts.length) * 20)) : 0;
    this.safetyScore = posts.length
      ? Math.max(0, Math.round((1 - this.pendingReports / posts.length) * 100)) : 100;
    this.mediaRichness = posts.length
      ? Math.round((withImages / posts.length) * 100) : 0;

    // Build top posters
    const authorMap: Record<string, { name: string; count: number }> = {};
    posts.forEach((p: AnyPost) => {
      const email = (p.authorEmail ?? p.user?.email ?? '') as string;
      const name  = this.getPostAuthorName(p);
      if (email) {
        if (!authorMap[email]) authorMap[email] = { name, count: 0 };
        authorMap[email].count++;
      }
    });
    const maxCount = Math.max(1, ...Object.values(authorMap).map((a) => a.count));
    this.topPosters = Object.entries(authorMap)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([email, v]) => ({
        email,
        name:  v.name,
        count: v.count,
        pct:   Math.round((v.count / maxCount) * 100),
      }));
  }

  // ── Filter / Sort / Search ─────────────────────────────────
  setFilter(f: string): void {
    this.activeFilter = f;
    this.applySearch();
  }

  get sortLabel(): string {
    return this.sortMode === 'recent' ? 'Most Recent'
         : this.sortMode === 'oldest' ? 'Oldest First'
         : 'Most Liked';
  }

  setSortMode(m: 'recent' | 'oldest' | 'top'): void {
    this.sortMode = m;
    this.applySearch();
  }

  applySearch(): void {
    let list: AnyPost[] = [...this.posts];
    const q = (this.searchQuery ?? '').toLowerCase();

    // Tab filter
    if (this.activeTab === 'admin')
      list = list.filter((p: AnyPost) => this.isAdminPost(p));
    if (this.activeTab === 'reports')
      list = list.filter((p: AnyPost) => (p.reports?.length ?? 0) > 0);

    // Sidebar filter (takes priority if not 'all')
    if (this.activeFilter === 'admin')
      list = list.filter((p: AnyPost) => this.isAdminPost(p));
    else if (this.activeFilter === 'reported')
      list = list.filter((p: AnyPost) => (p.reports?.length ?? 0) > 0);
    else if (this.activeFilter === 'anonymous')
      list = list.filter((p: AnyPost) => !!p.anonyme);
    else if (['GROSSESSE', 'POSTPARTUM', 'FERTILITE', 'NUTRITION'].includes(this.activeFilter))
      list = list.filter((p: AnyPost) => p.tag === this.activeFilter);

    // Text search
    if (q) {
      list = list.filter((p: AnyPost) =>
        (p.contenu ?? '').toLowerCase().includes(q) ||
        this.getPostAuthorName(p).toLowerCase().includes(q) ||
        (p.tag ?? '').toLowerCase().includes(q)
      );
    }

    // Sort
    switch (this.sortMode) {
      case 'recent':
        list.sort((a: AnyPost, b: AnyPost) =>
          new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());
        break;
      case 'oldest':
        list.sort((a: AnyPost, b: AnyPost) =>
          new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime());
        break;
      case 'top':
        list.sort((a: AnyPost, b: AnyPost) =>
          (b.reactionSummary?.total ?? b.likes ?? 0) -
          (a.reactionSummary?.total ?? a.likes ?? 0));
        break;
    }

    this.filteredPosts = list;
  }

  // ── Compose / Post as Admin ────────────────────────────────
  openComposeModal(): void  { this.showComposeModal = true; }
  closeComposeModal(): void { this.showComposeModal = false; }

  postAsAdmin(): void {
    if (!this.newPostContent.trim() || this.posting) return;
    this.posting = true;
    const body = {
      contenu: this.newPostContent,
      tag:     this.newPostTag,
      anonyme: false,
      likes:   0,
    };
    this.http
      .post<AnyPost>(`${environment.apiUrl}/posts`, body, { headers: this.h() })
      .subscribe({
        next: (p: AnyPost) => {
          p._admin = true;
          this.posts.unshift(p);
          this.adminPostsCount++;
          this._computeStats(this.posts);
          this.applySearch();
          this.newPostContent   = '';
          this.posting          = false;
          this.showComposeModal = false;
          this.showToast(`Post published as ${ADMIN_NAME}! 🚀`, 'success');
        },
        error: () => {
          this.posting = false;
          this.showToast('Post failed', 'error');
        },
      });
  }

  // ── Edit Post ──────────────────────────────────────────────
  openEditPostModal(post: AnyPost): void {
    this.editingPost     = post;
    this.editPostContent = post.contenu ?? '';
    this.editPostTag     = post.tag ?? 'GROSSESSE';
  }

  cancelEditPost(): void { this.editingPost = null; }

  saveEditPost(): void {
    if (!this.editingPost) return;
    const body: AnyPost = {
      ...this.editingPost,
      contenu: this.editPostContent,
      tag:     this.editPostTag,
    };
    this.http
      .put<AnyPost>(`${environment.apiUrl}/admin/posts/${this.editingPost.id}`, body, { headers: this.h() })
      .subscribe({
        next:  (u: AnyPost) => this._onPostEdited(u),
        error: () => {
          // Fallback to regular endpoint
          this.http
            .put<AnyPost>(`${environment.apiUrl}/posts/${this.editingPost.id}`, body, { headers: this.h() })
            .subscribe({
              next:  (u: AnyPost) => this._onPostEdited(u),
              error: () => this.showToast('Edit failed', 'error'),
            });
        },
      });
  }

  private _onPostEdited(_updated: AnyPost): void {
    const idx = this.posts.findIndex((p: AnyPost) => p.id === this.editingPost.id);
    if (idx !== -1) {
      this.posts[idx] = {
        ...this.posts[idx],
        contenu: this.editPostContent,
        tag:     this.editPostTag,
      };
    }
    this.applySearch();
    this.editingPost = null;
    this.showToast('Post updated ✓', 'success');
  }

  // ── Delete Post ────────────────────────────────────────────
  deletePost(post: AnyPost): void {
    if (!post.id || !window.confirm('Delete this post permanently?')) return;
    this.http
      .delete(`${environment.apiUrl}/admin/posts/${post.id}`, { headers: this.h() })
      .subscribe({
        next:  () => this._onPostDeleted(post.id as number),
        error: () =>
          this.postService.delete(post.id as number).subscribe({
            next:  () => this._onPostDeleted(post.id as number),
            error: () => this.showToast('Delete failed', 'error'),
          }),
      });
  }

  forceDeletePost(post: AnyPost): void {
    if (!post.id || !window.confirm(`⚠️ Force-delete post #${post.id}? Cannot be undone.`)) return;
    this.http
      .delete(`${environment.apiUrl}/admin/posts/${post.id}`, { headers: this.h() })
      .subscribe({
        next:  () => this._onPostDeleted(post.id as number),
        error: () => this.showToast('Force delete failed', 'error'),
      });
  }

  private _onPostDeleted(postId: number): void {
    this.posts         = this.posts.filter((p: AnyPost) => p.id !== postId);
    this.filteredPosts = this.filteredPosts.filter((p: AnyPost) => p.id !== postId);
    this._computeStats(this.posts);
    this.showToast(`Post #${postId} deleted`, 'success');
  }

  pinPost(post: AnyPost): void {
    this.showToast(`Post #${post.id} pinned (UI only)`, 'info');
  }

  // ── Comments ───────────────────────────────────────────────
  submitComment(post: AnyPost): void {
    const text = (this.commentInputs[post.id as number] ?? '').trim();
    if (!text || !post.id) return;
    this.postService.addComment(post.id as number, text).subscribe({
      next: (c: Commentaire) => {
        if (!post.commentaires) post.commentaires = [];
        (post.commentaires as AnyPost[]).push(c);
        this.commentInputs[post.id as number] = '';
        this.showToast('Comment posted as TFAKADNI ✓', 'success');
        if (c.id) this._loadCommentReactionSummary(c as AnyPost);
      },
      error: () => this.showToast('Failed to post comment', 'error'),
    });
  }

  startEditComment(post: AnyPost, commentId: number, text: string): void {
    this.editingCommentPostId = post.id as number;
    this.editingCommentId     = commentId;
    this.editingCommentText   = text;
  }

  cancelEditComment(): void {
    this.editingCommentId     = null;
    this.editingCommentText   = '';
    this.editingCommentPostId = null;
  }

  saveEditComment(post: AnyPost, commentId: number): void {
    const text = this.editingCommentText.trim();
    if (!text || !post.id) return;
    this.postService.updateComment(post.id as number, commentId, text).subscribe({
      next: (updated: Commentaire) => {
        const comments = post.commentaires as AnyPost[];
        const idx = comments.findIndex((c: AnyPost) => c.id === commentId);
        if (idx !== -1) {
          const ex = comments[idx];
          comments[idx] = { ...updated, reactionSummary: ex.reactionSummary };
        }
        this.cancelEditComment();
        this.showToast('Comment updated ✓', 'success');
      },
      error: () => this.showToast('Update failed', 'error'),
    });
  }

  deleteComment(post: AnyPost, commentId: number): void {
    if (!window.confirm('Delete this comment?') || !post.id) return;
    this.postService.deleteComment(post.id as number, commentId).subscribe({
      next: () => {
        post.commentaires = (post.commentaires as AnyPost[])
          .filter((c: AnyPost) => c.id !== commentId);
        this.showToast('Comment deleted ✓', 'success');
      },
      error: () => this.showToast('Delete failed', 'error'),
    });
  }

  // ── Stories ────────────────────────────────────────────────
  loadStories(): void {
    this.storyService.getActiveStories().subscribe({
      next: (s: Story[]) => { this.activeStories = s; this.totalStories = s.length; },
      error: () => {},
    });
  }

  deleteStory(story: Story): void {
    if (!story.id || !window.confirm('Delete this story?')) return;
    this.http
      .delete(`${environment.apiUrl}/stories/${story.id}`, { headers: this.h() })
      .subscribe({
        next: () => {
          this.activeStories = this.activeStories.filter(s => s.id !== story.id);
          this.totalStories  = this.activeStories.length;
          this.showToast(`Story #${story.id} deleted`, 'success');
        },
        error: () => this.showToast('Story delete failed', 'error'),
      });
  }

  getStoryColor(story: Story): string {
    return this.storyColors[(story.id ?? 0) % this.storyColors.length];
  }

  // ── Reports ────────────────────────────────────────────────
  loadReports(): void {
    this.http
      .get<AnyPost[]>(`${environment.apiUrl}/admin/reports`, { headers: this.h() })
      .subscribe({
        next: (r: AnyPost[]) => {
          this.allReports     = r ?? [];
          this.pendingReports = r?.length ?? 0;
        },
        error: () => {},
      });
}

  // ── User Stats ─────────────────────────────────────────────
  loadUserStats(): void {
    this.http
      .get<AnyPost>(`${environment.apiUrl}/users`, { headers: this.h() })
      .subscribe({
        next: (res: AnyPost) => {
          const list: AnyPost[] = Array.isArray(res) ? res : (res?.data ?? []);
          this.totalUsers        = list.length;
          this.activeUsersCount  = list.filter((u: AnyPost) => u.isActive).length;
          list.forEach((u: AnyPost) => {
            if (u.email && u.fullName)
              this.authorNameCache.set((u.email as string).toLowerCase(), u.fullName as string);
          });
        },
        error: () => {},
      });
  }

  // ── Share ──────────────────────────────────────────────────
  sharePost(post: AnyPost, event: Event): void {
    event.stopPropagation();
    if (!post.id) return;
    const url = `${window.location.origin}/communaute/${post.id}`;
    navigator.clipboard?.writeText(url).then(() => {
      this.copiedPostId = post.id as number;
      this.showToast('Link copied!', 'info');
      setTimeout(() => (this.copiedPostId = null), 2000);
    }).catch(() => {});
  }

  // ── AI Summarize ───────────────────────────────────────────
  summarizePost(post: AnyPost, event: Event): void {
    event.stopPropagation();
    if (!post.id || this.summarizingPostId === (post.id as number)) return;
    this.summarizingPostId = post.id as number;
    this.http
      .post<AnyPost>(
        `${environment.apiUrl}/posts/${post.id}/summarize`,
        { numSentences: 3 },
        { headers: this.h() }
      )
      .subscribe({
        next: (res: AnyPost) => {
          if (res?.summary) this.postSummaryMap[post.id as number] = res.summary as string;
          this.summarizingPostId = null;
        },
        error: () => {
          this.showToast('Summarize failed', 'error');
          this.summarizingPostId = null;
        },
      });
  }

  // ── Reactions (display only) ───────────────────────────────
  private _loadReactionSummary(post: AnyPost): void {
    this.reactionService.getPostSummary(post.id as number).subscribe({
      next: (s: AnyPost) => (post.reactionSummary = s),
      error: () => {},
    });
  }

  private _loadCommentReactionSummary(comment: AnyPost): void {
    this.reactionService.getCommentSummary(comment.id as number).subscribe({
      next: (s: AnyPost) => (comment.reactionSummary = s),
      error: () => {},
    });
  }

  closeAllPickers(): void {
    this.openReactionPickerId  = null;
    this.openCommentReactionId = null;
  }

  // ── Hashtags ───────────────────────────────────────────────
  extractHashtags(text: string): string[] {
    if (!text) return [];
    return [...new Set(text.match(/#[a-zA-Z]\w*/g) ?? [])].slice(0, 5);
  }
}