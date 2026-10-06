import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { PostService } from '../../../../../core/services/post.services';
import { StoryService } from '../../../../../core/services/story.service';
import { ReactionService } from '../../../../../core/services/reaction.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { MatchService, MatchDTO } from '../../../../../core/services/match.service';
import { HarmfulContentService } from '../../../../../core/services/harmful-content.service'; // NEW

import { Post } from '../../../../../core/models/post.model';
import { Story } from '../../../../../core/models/story.model';
import { Commentaire } from '../../../../../core/models/commentaire.model';
import { REACTION_META, REACTION_TYPES, ReactionType } from '../../../../../core/models/reaction.model';
import { PostAnalysis } from '../../../../../core/models/post-analysis.model'; // NEW

import { FrontHeaderComponent } from '../../../../../shared/components/front-header/front-header.component';
import { IndexFooterComponent } from '../../../../../components/index-footer/index-footer.component';
import { MessengerBubbleComponent } from '../../../../../components/messenger-bubble/messenger-bubble.component';
import { FollowService } from '../../../../../core/services/follow.service';
import { UserSummary } from '../../../../../core/models/user-summary.model';

import { getEmailFromToken, getUserIdFromToken } from '../../../../../core/services/token.helper';

import { SpaceService } from '../../../../../core/services/space.service';
import { Space, CATEGORY_META } from '../../../../../core/models/space.model';
import { CreateSpaceModalComponent } from './../spaces/create-space-modal/create-space-modal.component';
import { SpaceRoomComponent } from './../spaces/space-room/space-room.component';

import { AiRecommendationsComponent } from '../../../../../components/ai-recommendations/ai-recommendations.component';
import { ReportModalComponent } from '../../../../../components/report-modal/report-modal.component';
import { PostNotificationBannerComponent } from '../post-notification-banner/post-notification-banner.component';
import { PostNotificationService } from '../../../../../core/services/post-notification.service';
import { SavedPostService } from '../../../../../core/services/saved-post.service';
import { environment } from '../../../../../../environments/environment';
import { storeUserId } from '../../../../../core/services/token.helper';

// NEW: warning & blur components
import { PostWarningBannerComponent } from '../post-warning-banner/post-warning-banner.component';
import { PostBlurOverlayComponent } from '../post-blur-overlay/post-blur-overlay.component';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { FakeInfoService } from '../../../../../core/services/fake-info.service';
import { FakeInfoAnalysis } from '../../../../../core/models/fake-info.model';

import { PresenceService } from '../../../../../core/services/presence.service';
import { FollowNotificationService } from '../../../../../core/services/follow-notification.service';


import { ConfirmModalComponent } from '../../../../../components/confirm-modal/confirm-modal.component';

const MATCH_ACTIVATOR_KEY = 'matchActivatorOn';

export interface MatchWithDecision extends MatchDTO {
  fullName: string;
  city: string;
  currentWeek: number;
  hasBaby: boolean;
  compatibilityScore: number;
}

@Component({
  selector: 'app-liste-posts',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatIconModule,
    MatMenuModule,
    FrontHeaderComponent,
    IndexFooterComponent,
    MessengerBubbleComponent,
    CreateSpaceModalComponent,
    SpaceRoomComponent,
    AiRecommendationsComponent,
    ReportModalComponent,
    PostNotificationBannerComponent,
    PostWarningBannerComponent,   // NEW
    PostBlurOverlayComponent,
    ConfirmModalComponent,
            // NEW
  ],
  templateUrl: './liste-posts.html',
  styleUrls: ['./liste-posts.css'],
})
export class ListePosts implements OnInit, OnDestroy {

  // ── Posts ──────────────────────────────────────────────────────
  posts: Post[] = [];
  filteredPosts: Post[] = [];
  loading = true;
  selectedTag: string | null = null;
  activeTab = 'feed';
  sortMode: 'recent' | 'oldest' | 'top' = 'recent';
  searchQuery = '';
  copiedPostId: number | null = null;
  commentInputs: Record<number, string> = {};
  editingCommentId: number | null = null;
  editingCommentText = '';
  editingCommentPostId: number | null = null;

  readonly REACTION_META = REACTION_META;
  readonly REACTION_TYPES = REACTION_TYPES;
  openReactionPickerId: number | null = null;
  reactingPostId: number | null = null;
  openCommentReactionId: number | null = null;
  reactingCommentId: number | null = null;

  // ── Stories ────────────────────────────────────────────────────
  activeStories: Story[] = [];
  viewingStory: Story | null = null;
  currentStoryIndex = 0;
  storyProgress = 0;
  private storyTimer: any = null;
  private progressTimer: any = null;
  private readonly STORY_DURATION_MS = 5000;

  // ── Match system ───────────────────────────────────────────────
  matchActivatorOn = false;
  matchesLoading = false;
  noPregnancyData = false;
  swipeQueue: MatchDTO[] = [];
  swipeCard: MatchWithDecision | null = null;
  swipeDirection: 'left' | 'right' | null = null;
  swipeHint: 'left' | 'right' | null = null;
  mutualMatches: MatchWithDecision[] = [];
  myDecisionMatches: MatchWithDecision[] = [];
  incomingMatches: MatchWithDecision[] = [];

  // ── Follow / suggestions ───────────────────────────────────────
  suggestedUsers: UserSummary[] = [];
  followingUsers: UserSummary[] = [];
  followingInProgress = new Set<number>();
  whoToFollow: UserSummary[] = [];

  // ── Current user identity ──────────────────────────────────────
  myUserId = Number(localStorage.getItem('userId') || getUserIdFromToken() || 0);
  myEmail  = '';

  onlineFollowingUsers: UserSummary[] = [];
  private onlineEmailsSet = new Set<string>();
  private onlinePollInterval: any = null;

  // ── Current user profile ──────────────────────────────────────
  currentUserName   = 'Community Member';
  currentUserHandle = '';
  currentUserCity   = '';
  myPostsCount      = 0;
  myFollowersCount  = 0;
  myFollowingCount  = 0;

  currentStoryGroup: Story[] = [];

  private authorNameCache = new Map<string, string>();

  // ── Saved posts ────────────────────────────────────────────────
  reportingPostId: number | null = null;
  savedPostIds   = new Set<number>();
  savingPostId: number | null = null;
  savedCount     = 0;
  saveAnimating  = false;
  justSavedPostId: number | null = null;

  // ── Spaces ────────────────────────────────────────────────────
  spaces: Space[] = [];
  showCreateSpace = false;
  activeSpaceRoom: Space | null = null;
  catMeta = CATEGORY_META;
  spacesToken = localStorage.getItem('auth_token') || '';

  // ── Harmful content detection (NEW) ───────────────────────────
  /** Map of postId → PostAnalysis result */
  postAnalysisMap: Record<number, PostAnalysis> = {};
  /** Set of postIds where user chose to reveal blurred content */
  revealedPostIds = new Set<number>();
  // ── AI Summarization ───────────────────────────────────
/** Map of postId → summary text */
postSummaryMap: Record<number, string> = {};
/** postId currently being summarized */
summarizingPostId: number | null = null;

postFakeInfoMap: Record<number, FakeInfoAnalysis> = {};
  // ── Tag helpers ───────────────────────────────────────────────
  tagLabels: Record<string, string> = {
    GROSSESSE: 'Pregnancy', POSTPARTUM: 'Postpartum',
    FERTILITE: 'Fertility', NUTRITION:  'Nutrition',
  };
  tagEmoji: Record<string, string> = {
    GROSSESSE: '🤰', POSTPARTUM: '👶', FERTILITE: '🌸', NUTRITION: '🥗',
  };

  private storyColors = [
    'linear-gradient(135deg,#ff4f75,#ff6b8a)', 'linear-gradient(135deg,#6c5ce7,#a29bfe)',
    'linear-gradient(135deg,#00b894,#00cec9)', 'linear-gradient(135deg,#e17055,#d63031)',
    'linear-gradient(135deg,#0984e3,#74b9ff)', 'linear-gradient(135deg,#fd79a8,#e84393)',
    'linear-gradient(135deg,#fdcb6e,#f39c12)', 'linear-gradient(135deg,#636e72,#2d3436)',
  ];

  private readonly tagGradients: Record<string, string> = {
    pregnancy:  'linear-gradient(135deg,#ff4f75,#ff6b8a)',
    postpartum: 'linear-gradient(135deg,#6c5ce7,#a29bfe)',
    fertility:  'linear-gradient(135deg,#fd79a8,#e84393)',
    nutrition:  'linear-gradient(135deg,#00b894,#00cec9)',
    momlife:    'linear-gradient(135deg,#fdcb6e,#f39c12)',
    baby:       'linear-gradient(135deg,#0984e3,#74b9ff)',
    health:     'linear-gradient(135deg,#e17055,#d63031)',
    wellness:   'linear-gradient(135deg,#636e72,#2d3436)',
  };
  private readonly defaultGradients = [
    'linear-gradient(135deg,#ff4f75,#ff6b8a)', 'linear-gradient(135deg,#6c5ce7,#a29bfe)',
    'linear-gradient(135deg,#00b894,#00cec9)', 'linear-gradient(135deg,#e17055,#d63031)',
    'linear-gradient(135deg,#0984e3,#74b9ff)', 'linear-gradient(135deg,#fd79a8,#e84393)',
    'linear-gradient(135deg,#fdcb6e,#f39c12)',
  ];

  get trendingTopics(): Array<{ tag: string; count: string; gradient: string }> {
    const map = new Map<string, number>();
    for (const p of this.posts) {
      (p.contenu?.match(/#[a-zA-Z]\w*/g) ?? []).forEach(raw => {
        const t = raw.toLowerCase();
        map.set(t, (map.get(t) ?? 0) + 1);
      });
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([tag, count], i) => ({
        tag,
        count: count >= 1000 ? `${(count / 1000).toFixed(1)}K` : `${count}`,
        gradient: this.tagGradients[tag.slice(1)] ?? this.defaultGradients[i % this.defaultGradients.length],
      }));
  }

  get pendingMatchCount(): number {
    return this.swipeQueue.length + (this.swipeCard ? 1 : 0);
  }

  myPostsList: Post[] = [];
  myPostsLoaded = false;

  get myPosts(): Post[] {
    if (this.myPostsLoaded) return this._applySort(this.myPostsList);
    if (!this.myEmail && !this.myUserId) return [];
    const filtered = this.posts.filter(p => {
      const raw = p as any;
      const postEmail: string = raw.authorEmail || raw.userEmail || raw.email || raw.author?.email || raw.user?.email || '';
      const postUserId: number = raw.userId || raw.authorId || raw.author?.id || raw.user?.id || 0;
      const byEmail = this.myEmail && postEmail && postEmail.toLowerCase() === this.myEmail.toLowerCase();
      const byId    = this.myUserId && postUserId && postUserId === this.myUserId;
      return byEmail || byId;
    });
    return this._applySort(filtered);
  }

  get sortLabel(): string {
    return this.sortMode === 'recent' ? 'Most Recent'
         : this.sortMode === 'oldest' ? 'Oldest First'
         : 'Most Liked';
  }

  constructor(
    private postService:         PostService,
    private storyService:        StoryService,
    private reactionService:     ReactionService,
    private toast:               ToastService,
    private matchSvc:            MatchService,
    private followService:       FollowService,
    public  router:              Router,
    private spaceSvc:            SpaceService,
    private postNotifService:    PostNotificationService,
    private savedPostSvc:        SavedPostService,
    private http:                HttpClient,
    private harmfulSvc:          HarmfulContentService,
    private fakeInfoSvc: FakeInfoService,   
    private presenceSvc: PresenceService,
    private followNotifSvc:      FollowNotificationService,  // ← ADD THIS

  ) {}

  ngOnInit(): void {
  this.myEmail  = getEmailFromToken() || '';
  this.myUserId = getUserIdFromToken() || 0;

  if (this.myEmail) {
    this.currentUserName   = this._nameFromEmail(this.myEmail);
    this.currentUserHandle = '@' + this.myEmail.split('@')[0];
  }

  this.loadCurrentUserProfile(() => {
    // Both follow data AND online poll start AFTER userId is resolved
    this.loadFollowingUsers(() => {
      // Only start polling AFTER following users are loaded
      this._startOnlinePoll();
    });
    if (this.myEmail) this.postNotifService.connect(this.myEmail);
  });

  this.loadPosts();
  this.loadStories();
  this.loadSuggestedUsers();
  this.presenceSvc.startHeartbeat();
  this.loadSavedPosts();

  setInterval(() => this.loadStories(), 30_000);

  if (sessionStorage.getItem(MATCH_ACTIVATOR_KEY) === 'true') {
    this.matchActivatorOn = true;
    this._subscribeToMatchStore();
    this._loadExistingMatches();
  }

  this.loadSpacesList();
  this.connectSpaceWs();
  window.addEventListener('open-space-room', (e: Event) => {
    this.activeSpaceRoom = (e as CustomEvent).detail as Space;
  });
}

  ngOnDestroy(): void { 
    this.clearStoryTimers();
    if (this.onlinePollInterval) clearInterval(this.onlinePollInterval);
   }

  // ── Harmful content helpers (NEW) ─────────────────────────────

  /**
   * True if the logged-in user is the author of this post.
   */
  isMyPost(post: Post): boolean {
    const raw        = post as any;
    const postEmail  = (raw.authorEmail || raw.userEmail || raw.email || raw.author?.email || '').toLowerCase().trim();
    const postUserId = Number(raw.userId || raw.authorId || raw.author?.id || raw.user?.id || 0);
    const myEmailLow = (this.myEmail || '').toLowerCase().trim();
    return (!!myEmailLow && !!postEmail && postEmail === myEmailLow)
        || (!!this.myUserId && !!postUserId && postUserId === this.myUserId);
  }

  /**
   * Should the blur overlay be shown for this post?
   * Yes if: harmful + shouldBlur + user is NOT the author + user hasn't revealed it.
   */
  shouldShowBlur(post: Post): boolean {
    if (!post.id) return false;
    if (this.revealedPostIds.has(post.id)) return false;
    return this.harmfulSvc.shouldShowBlur(
      this.postAnalysisMap[post.id] ?? null,
      this.isMyPost(post)
    );
  }

  /**
   * Should the author warning banner be shown for this post?
   */
  shouldShowAuthorWarning(post: Post): boolean {
    if (!post.id) return false;
    return this.harmfulSvc.shouldShowAuthorWarning(
      this.postAnalysisMap[post.id] ?? null,
      this.isMyPost(post)
    );
  }

  /** User clicked "I understand" on their own post warning. */
  onWarningAcknowledged(postId: number): void {
    this.harmfulSvc.acknowledge(postId).subscribe(result => {
      if (result) this.postAnalysisMap = { ...this.postAnalysisMap, [postId]: result };
    });
  }

  /** Non-author clicked the eye icon to reveal blurred content. */
  onPostRevealed(postId: number): void {
    this.revealedPostIds = new Set(this.revealedPostIds).add(postId);
  }

  /**
   * Load analyses for all posts in a single batch of HTTP calls.
   * Runs in parallel (forkJoin).
   */
  private loadPostAnalyses(): void {
    const ids = this.posts.map(p => p.id).filter((id): id is number => !!id);
    if (ids.length === 0) return;

    // Fire one request per post (parallel)
    const requests = ids.map(id =>
      this.harmfulSvc.getAnalysis(id).pipe(catchError(() => of(null)))
    );

    forkJoin(requests).subscribe(results => {
      results.forEach((analysis, i) => {
        if (analysis) this.postAnalysisMap[ids[i]] = analysis;
      });
    });
  }

  /** Refresh analysis for one post (e.g. after creating a new post). */
  private loadSingleAnalysis(postId: number): void {
    this.harmfulSvc.getAnalysis(postId).subscribe(analysis => {
      if (analysis) this.postAnalysisMap[postId] = analysis;
    });
  }

  // ── Profile helpers ───────────────────────────────────────────
  private _nameFromEmail(email: string): string {
    if (!email) return 'Community Member';
    const local = email.split('@')[0];
    return local.replace(/[._\-+]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim() || 'Community Member';
  }

loadCurrentUserProfile(onResolved?: () => void): void {
  this.followService.getAllUsers().subscribe({
    next: users => {
      const me = users.find(u =>
        (this.myEmail && u.email?.toLowerCase() === this.myEmail.toLowerCase()) ||
        (this.myUserId && u.id === this.myUserId)
      );
      if (me) {
        this.myUserId = me.id;
        if (me.fullName) this.currentUserName   = me.fullName;
        if (me.email)    this.currentUserHandle = '@' + me.email.split('@')[0];
        if ((me as any).city) this.currentUserCity = (me as any).city;

        // ← READ COUNTS DIRECTLY FROM THE USER OBJECT
        const raw = me as any;
        console.log('[profile] me object from getAllUsers:', JSON.stringify(raw));
        // Try every possible field name your backend might use
        this.myFollowersCount = raw.followersCount ?? raw.followers_count ?? raw.followerCount ?? 0;
        this.myFollowingCount = raw.followingCount ?? raw.following_count ?? raw.followingUsers?.length ?? 0;
      }
      onResolved?.();
    },
    error: () => { onResolved?.(); },
  });
}

  getPostAuthorName(post: Post): string {
  if (this.isAdminPost(post)) return 'TFAKADNI';
  if (post.anonyme) return 'Anonymous Member';

  // ── Primary: nested user object ──
  const raw = post as any;
  if (raw.user) {
    const full = `${raw.user.firstName ?? ''} ${raw.user.lastName ?? ''}`.trim();
    if (full) return full;
    if (raw.user.username) return raw.user.username;
    if (raw.user.email)    return this._nameFromEmail(raw.user.email);
  }

  // ── Secondary: flat denormalized fields ──
  const direct = raw.authorName || raw.userName || raw.fullName
              || raw.author?.fullName || raw.author?.name;
  if (direct) return direct;

  // ── Tertiary: cache or derive from email ──
  if (post.authorEmail) {
    const cached = this.authorNameCache.get(post.authorEmail.toLowerCase());
    if (cached) return cached;
  }

  // ── Quaternary: check if it's the current user's post ──
  const isMyPost = (post.authorEmail && this.myEmail &&
                    post.authorEmail.toLowerCase() === this.myEmail.toLowerCase()) ||
                   (post.userId && this.myUserId && post.userId === this.myUserId);
  if (isMyPost) return this.currentUserName;

  if (post.authorEmail) return this._nameFromEmail(post.authorEmail);
  return 'Unknown User';
}

getCommentAuthorName(c: Commentaire): string {
  const raw = c as any;

  // ── Primary: nested user object ──
  if (raw.user) {
    const full = `${raw.user.firstName ?? ''} ${raw.user.lastName ?? ''}`.trim();
    if (full) return full;
    if (raw.user.username) return raw.user.username;
    if (raw.user.email)    return this._nameFromEmail(raw.user.email);
  }

  // ── Secondary: flat fields ──
  const direct = raw.authorName || raw.userName || raw.fullName || raw.author?.fullName;
  if (direct) return direct;

  // ── Tertiary: email ──
  if (c.authorEmail) {
    const cached = this.authorNameCache.get(c.authorEmail.toLowerCase());
    if (cached) return cached;
    if (this.myEmail && c.authorEmail.toLowerCase() === this.myEmail.toLowerCase())
      return this.currentUserName;
    return this._nameFromEmail(c.authorEmail);
  }

  return 'Unknown User';
}

  // ── Report modal ──────────────────────────────────────────────
  openReportModal(post: Post, event: Event): void { event.stopPropagation(); this.reportingPostId = post.id ?? null; }
  closeReportModal(): void { this.reportingPostId = null; }
  onPostReported(): void {}

  extractHashtags(text: string): string[] {
    if (!text) return [];
    return [...new Set(text.match(/#[a-zA-Z]\w*/g) ?? [])].slice(0, 5);
  }

  // ── Saved posts ───────────────────────────────────────────────
  loadSavedPosts(): void {
    this.savedPostSvc.getSaved().subscribe({
      next: saved => {
        this.savedPostSvc.hydrate(saved);
        this.savedPostIds = new Set(saved.map(s => s.postId));
        this.savedCount   = saved.length;
      },
      error: () => {},
    });
  }

  isPostSaved(postId: number): boolean { return this.savedPostIds.has(postId); }

  toggleSave(post: any, event: Event): void {
    event.stopPropagation();
    if (!post.id || this.savingPostId === post.id) return;
    this.savingPostId = post.id;
    this.savedPostSvc.toggle(post.id).subscribe({
      next: res => {
        this.savingPostId = null;
        if (res.saved) {
          this.savedPostIds.add(post.id);
          this.justSavedPostId = post.id;
          this.saveAnimating   = true;
          setTimeout(() => { this.saveAnimating = false; this.justSavedPostId = null; }, 2000);
        } else {
          this.savedPostIds.delete(post.id);
        }
        this.savedCount = res.count;
      },
      error: () => { this.savingPostId = null; this.toast.error('Could not update wishlist. Please log in.'); },
    });
  }

  goToSavedPosts(): void { this.router.navigate(['/mother/communaute/saved']); }

  // ── Posts ─────────────────────────────────────────────────────
  loadPosts(): void {
    this.postService.getAll().subscribe({
      next: d => {
        this.posts   = d;
        this.loading = false;
        this.apply();
        this.myPostsCount = this.myPosts.length;
        this.posts.forEach(p => {
          if (p.id) this._loadPostReactionSummary(p);
          (p.commentaires ?? []).forEach(c => { if (c.id) this._loadCommentReactionSummary(c); });
        });
        this.loadMyPostsFromBackend();

        // NEW: load harmful analysis for all posts
        this.posts.forEach(p => { if (p.id) this._pollAnalysis(p.id); });
        this.loadFakeInfoAnalyses();
      },
      error: () => { this.loading = false; },
    });
  }

  private loadFakeInfoAnalyses(): void {
  const ids = this.posts.map(p => p.id).filter((id): id is number => !!id);
  if (ids.length === 0) return;

  ids.forEach(id => {
    this.fakeInfoSvc.getAnalysis(id).subscribe(result => {
      if (result) this.postFakeInfoMap[id] = result;
    });
  });
}

private _pollAnalysis(postId: number): void {
    // First: immediate fetch
    this.harmfulSvc.getAnalysis(postId).subscribe(a => {
      if (a) this.postAnalysisMap = { ...this.postAnalysisMap, [postId]: a };
    });
 
    // Then: poll until we get a real result (handles @Async delay)
    this.harmfulSvc.pollUntilReady(postId, 700, 900, 6).subscribe(a => {
      if (a) {
        const current = this.postAnalysisMap[postId];
        // Only update if new result is more informative than current
        if (!current || (a.isHarmful && !current.isHarmful) || a.confidence !== current.confidence) {
          this.postAnalysisMap = { ...this.postAnalysisMap, [postId]: a };
        }
      }
    });
  }

  loadMyPostsFromBackend(): void {
  const token = localStorage.getItem('auth_token') || '';
  if (!token) return;
  if (typeof (this.postService as any).getMyPosts === 'function') {
    (this.postService as any).getMyPosts().subscribe({
      next: (posts: Post[]) => {
        this.myPostsList   = posts;
        this.myPostsLoaded = true;
        this.myPostsCount  = posts.length; // ← this is correct
        posts.forEach(p => { if (p.id) this._loadPostReactionSummary(p); });
      },
      error: () => { this.myPostsLoaded = false; },
    });
  }
}

  toggleTag(tag: string | null): void { this.selectedTag = this.selectedTag === tag ? null : tag; this.apply(); }

  _applySort(list: Post[]): Post[] {
    switch (this.sortMode) {
      case 'recent': return [...list].sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());
      case 'oldest': return [...list].sort((a, b) => new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime());
      case 'top':    return [...list].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
      default:       return list;
    }
  }

  apply(): void {
    this.filteredPosts = this._applySort(
      this.posts.filter(p => (this.selectedTag ? p.tag === this.selectedTag : true))
    );
  }

  setSortMode(m: 'recent' | 'oldest' | 'top'): void { this.sortMode = m; this.apply(); }

  openCreatePostModal(): void  { this.router.navigate(['/mother/communaute/creer-post']); }
  openCreateStoryModal(): void { this.router.navigate(['/mother/communaute/create-story']); }
  openEditPost(post: Post): void {
    this.router.navigate(['/mother/communaute/creer-post'], { state: { post: { ...post }, isEdit: true } });
  }

  deletePost(post: Post): void {
  if (!post.id) return;
  this.toast.confirm('Are you sure you want to delete this post?', () => {
    this.postService.delete(post.id!).subscribe({
      next: () => {
        this.posts         = this.posts.filter(p => p.id !== post.id);
        this.filteredPosts = this.filteredPosts.filter(p => p.id !== post.id);
        this.myPostsCount  = Math.max(0, this.myPostsCount - 1);
        if (post.id) {
          const updated = { ...this.postAnalysisMap };
          delete updated[post.id];
          this.postAnalysisMap = updated;
        }
        this.toast.success('Post deleted.');
      },
      error: () => this.toast.error('Failed to delete post.'),
    });
  });
}

  // ── Match activator ───────────────────────────────────────────
  private _toMWD(m: MatchDTO): MatchWithDecision {
    return {
      ...m,
      fullName:           m.fullName           ?? m.otherUserName    ?? '',
      city:               m.city               ?? m.otherUserCity    ?? '',
      currentWeek:        m.currentWeek        ?? m.otherUserWeek    ?? 0,
      hasBaby:            m.hasBaby            ?? m.otherUserHasBaby ?? false,
      compatibilityScore: m.compatibilityScore ?? m.aiScore          ?? 0,
    } as MatchWithDecision;
  }

  private _refreshMatchLists(matches: MatchDTO[]): void {
    this.mutualMatches     = matches.filter(m =>  m.mutualMatch).map(m => this._toMWD(m));
    this.myDecisionMatches = matches.filter(m =>  m.iAmA && !m.mutualMatch).map(m => this._toMWD(m));
    this.incomingMatches   = matches.filter(m => !m.iAmA && !m.mutualMatch).map(m => this._toMWD(m));
  }

  private _subscribeToMatchStore(): void {
    this.matchSvc.matches$.subscribe(m => this._refreshMatchLists(m));
    this.matchSvc.swipeQueue$.subscribe(q => { this.swipeQueue = q; });
  }

  private _loadExistingMatches(): void {
    this.matchesLoading = true;
    this.matchSvc.loadMyMatches().subscribe({
      next: () => {
        this.matchesLoading = false;
        const pending = this.matchSvc.currentMatches.filter(m => m.iAmA && m.myStatus === 'PENDING');
        if (pending.length > 0) this._nextSwipeCard();
      },
      error: () => { this.matchesLoading = false; },
    });
  }

  toggleMatchActivator(): void {
    this.matchActivatorOn = !this.matchActivatorOn;
    sessionStorage.setItem(MATCH_ACTIVATOR_KEY, String(this.matchActivatorOn));
    if (this.matchActivatorOn) {
      this.matchesLoading = true; this.noPregnancyData = false;
      this._subscribeToMatchStore();
      this.matchSvc.generateMatches().subscribe({
        next: () => {
          this.matchesLoading  = false;
          this.noPregnancyData = this.matchSvc.noPregnancyData || false;
          if (this.noPregnancyData) {
            this.toast.success('No pregnancy profile found. Complete your profile first!');
          } else {
            this.toast.success('AI Match activated! 🤱 Finding your best matches…');
            this._nextSwipeCard();
          }
        },
        error: () => {
          this.matchesLoading = false; this.matchActivatorOn = false;
          sessionStorage.setItem(MATCH_ACTIVATOR_KEY, 'false');
          this.toast.error('Could not load matches. Please try again.');
        },
      });
    } else {
      this.swipeCard = null; this.swipeDirection = null; this.swipeQueue = [];
      this.noPregnancyData = false;
      if (this.activeTab === 'matches') this.activeTab = 'feed';
      this.toast.success('AI Match turned off.');
    }
  }

  private _nextSwipeCard(): void {
    const raw = this.matchSvc.popSwipeCard();
    this.swipeCard = raw ? this._toMWD(raw) : null;
    this.swipeDirection = null; this.swipeHint = null;
  }

  swipeLeft(): void {
    if (!this.swipeCard) return;
    this.swipeDirection = 'left';
    const matchId = this.swipeCard.matchId;
    setTimeout(() => { this.matchSvc.decide(matchId, 'REJECTED').subscribe(); this._nextSwipeCard(); }, 420);
  }

  swipeRight(): void {
    if (!this.swipeCard) return;
    this.swipeDirection = 'right';
    const matchId = this.swipeCard.matchId, name = this.swipeCard.fullName;
    setTimeout(() => {
      this.matchSvc.decide(matchId, 'ACCEPTED').subscribe({
        next: updated => {
          this.toast.success(updated.mutualMatch
            ? `💕 It's a mutual match with ${name}!`
            : `You accepted ${name}! Waiting for their response… 🤞`);
        },
      });
      this._nextSwipeCard();
    }, 420);
  }

  dismissSwipeCard(): void { this.swipeCard = null; }

  openMessage(targetUserId: number | string | undefined): void {
  if (!targetUserId) return;
  this.router.navigate(['/mother/communaute/chat'], {
    queryParams: {
      userId: this.myUserId,        // who YOU are
      targetUserId: targetUserId    // who to open conversation with
    }
  });
}

  // ── Share ─────────────────────────────────────────────────────
  sharePost(post: Post, event: Event): void {
    event.stopPropagation();
    if (!post.id) return;
    const url = `${window.location.origin}/mother/communaute/${post.id}`;
    navigator.clipboard?.writeText(url)
      .then(() => this._onCopied(post.id!))
      .catch(() => this._fallbackCopy(url, post.id!));
  }

  private _onCopied(postId: number): void {
    this.copiedPostId = postId;
    this.toast.success('Post link copied!');
    setTimeout(() => { if (this.copiedPostId === postId) this.copiedPostId = null; }, 2000);
  }

  private _fallbackCopy(text: string, postId: number): void {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    try { document.execCommand('copy'); this._onCopied(postId); }
    catch { this.toast.error('Could not copy: ' + text); }
    finally { document.body.removeChild(ta); }
  }

  // ── Comments ──────────────────────────────────────────────────
  submitComment(post: Post): void {
    const text = this.commentInputs[post.id!]?.trim();
    if (!text || !post.id) return;
    this.postService.addComment(post.id, text).subscribe({
      next: c => {
        if (!post.commentaires) post.commentaires = [];
        post.commentaires.push(c);
        this.commentInputs[post.id!] = '';
        this.toast.success('Comment posted!');
        if (c.id) this._loadCommentReactionSummary(c);
      },
      error: () => this.toast.error('Failed to post comment.'),
    });
  }

  startEditComment(post: Post, commentId: number, text: string): void {
    this.editingCommentPostId = post.id!;
    this.editingCommentId     = commentId;
    this.editingCommentText   = text;
  }

  cancelEditComment(): void { this.editingCommentId = null; this.editingCommentText = ''; this.editingCommentPostId = null; }

  saveEditComment(post: Post, commentId: number): void {
    const text = this.editingCommentText.trim();
    if (!text || !post.id) return;
    this.postService.updateComment(post.id, commentId, text).subscribe({
      next: updated => {
        const idx = post.commentaires!.findIndex(c => c.id === commentId);
        if (idx !== -1) {
          const ex = post.commentaires![idx];
          post.commentaires![idx] = { ...updated, reactionSummary: ex.reactionSummary };
        }
        this.cancelEditComment();
        this.toast.success('Comment updated.');
      },
      error: () => this.toast.error('Failed to update.'),
    });
  }

  deleteComment(post: Post, commentId: number): void {
  if (!post.id) return;
  this.toast.confirm('Are you sure you want to delete this comment?', () => {
    this.postService.deleteComment(post.id!, commentId).subscribe({
      next: () => {
        post.commentaires = post.commentaires!.filter(c => c.id !== commentId);
        this.toast.success('Comment deleted.');
      },
      error: () => this.toast.error('Failed to delete.'),
    });
  });
}

  

  // ── Reactions ─────────────────────────────────────────────────
  togglePostReactionPicker(postId: number, event: Event): void {
    event.stopPropagation();
    this.openReactionPickerId  = this.openReactionPickerId === postId ? null : postId;
    this.openCommentReactionId = null;
  }

  reactToPost(post: Post, type: ReactionType, event: Event): void {
    event.stopPropagation();
    this.openReactionPickerId = null;
    if (!post.id || this.reactingPostId === post.id) return;
    this.reactingPostId = post.id;
    this.reactionService.reactToPost(post.id, type).subscribe({
      next: s => { post.reactionSummary = s; this.reactingPostId = null; },
      error: () => { this.toast.error('Could not save reaction.'); this.reactingPostId = null; },
    });
  }

  quickLikePost(post: Post, event: Event): void { this.reactToPost(post, 'LIKE', event); }

  toggleCommentReactionPicker(commentId: number, event: Event): void {
    event.stopPropagation();
    this.openCommentReactionId = this.openCommentReactionId === commentId ? null : commentId;
    this.openReactionPickerId  = null;
  }

  reactToComment(comment: Commentaire, type: ReactionType, event: Event): void {
    event.stopPropagation();
    this.openCommentReactionId = null;
    if (!comment.id || this.reactingCommentId === comment.id) return;
    this.reactingCommentId = comment.id;
    this.reactionService.reactToComment(comment.id, type).subscribe({
      next: s => { comment.reactionSummary = s; this.reactingCommentId = null; },
      error: () => { this.toast.error('Could not save reaction.'); this.reactingCommentId = null; },
    });
  }

  quickLikeComment(comment: Commentaire, event: Event): void { this.reactToComment(comment, 'LIKE', event); }

  closeAllPickers(): void { this.openReactionPickerId = null; this.openCommentReactionId = null; }

  // ── UI helpers ────────────────────────────────────────────────
  postReactionColor(post: Post): string {
    const r = post.reactionSummary?.myReaction;
    return r ? REACTION_META[r].color : '#8a6575';
  }

  commentReactionColor(c: Commentaire): string {
    const r = c.reactionSummary?.myReaction;
    return r ? REACTION_META[r].color : '#8a6575';
  }

  getScoreColor(score: number): string {
    return score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  }

  getInitials(name: string): string {
    return (name || '??').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  private _loadPostReactionSummary(post: Post): void {
    this.reactionService.getPostSummary(post.id!).subscribe({ next: s => (post.reactionSummary = s), error: () => {} });
  }

  private _loadCommentReactionSummary(comment: Commentaire): void {
    this.reactionService.getCommentSummary(comment.id!).subscribe({ next: s => (comment.reactionSummary = s), error: () => {} });
  }

  // ── Stories ───────────────────────────────────────────────────
  loadStories(): void {
    this.storyService.getActiveStories().subscribe({ next: d => (this.activeStories = d), error: () => {} });
  }

  selectedColorForStory(story: Story): string {
    return this.storyColors[(story.id ?? 0) % this.storyColors.length];
  }

  viewStory(story: Story): void {
    if (!story) return;
    const idx = this.activeStories.findIndex(s => s.id === story.id);
    this.currentStoryIndex = idx !== -1 ? idx : 0;
    this.viewingStory      = this.activeStories[this.currentStoryIndex] ?? story;
    this.startStoryTimer();
  }

  closeStoryViewer(): void {
  this.clearStoryTimers();
  this.viewingStory = null;
  this.storyProgress = 0;
  this.currentStoryGroup = [];
  this.currentStoryIndex = 0;
}

 nextStory(): void {
  const list = this.currentStoryGroup.length > 0 ? this.currentStoryGroup : this.activeStories;
  if (this.currentStoryIndex < list.length - 1) {
    this.viewingStory = list[++this.currentStoryIndex];
    this.startStoryTimer();
  } else {
    this.closeStoryViewer();
  }
}

prevStory(): void {
  const list = this.currentStoryGroup.length > 0 ? this.currentStoryGroup : this.activeStories;
  if (this.currentStoryIndex > 0) {
    this.viewingStory = list[--this.currentStoryIndex];
    this.startStoryTimer();
  }
}

  private startStoryTimer(): void {
    this.clearStoryTimers();
    this.storyProgress = 0;
    const steps = this.STORY_DURATION_MS / 50;
    let step = 0;
    this.progressTimer = setInterval(() => { step++; this.storyProgress = (step / steps) * 100; }, 50);
    this.storyTimer    = setTimeout(() => this.nextStory(), this.STORY_DURATION_MS);
  }

  private clearStoryTimers(): void {
    if (this.storyTimer)    { clearTimeout(this.storyTimer);    this.storyTimer    = null; }
    if (this.progressTimer) { clearInterval(this.progressTimer); this.progressTimer = null; }
  }

  // ── Follow ────────────────────────────────────────────────────
  loadSuggestedUsers(): void {
    this.followService.getSuggestions().subscribe({
      next: users => { this.suggestedUsers = users.slice(0, 3); this.whoToFollow = this.suggestedUsers; },
      error: () => {},
    });
  }

loadFollowingUsers(onLoaded?: () => void): void {
  if (!this.myUserId) { 
    console.warn('[follow] NO userId, skipping. myUserId=', this.myUserId);
    onLoaded?.(); 
    return; 
  }

  this.followService.getFollowing(this.myUserId).subscribe({
    next: users => {
      this.followingUsers   = users;
      this.myFollowingCount = users.length;
      console.log('[follow] RAW following response:', JSON.stringify(users.slice(0,2)));
      this._refreshOnlineFollowing();
      onLoaded?.();
    },
    error: (err) => { 
      console.error('[follow] getFollowing error:', err);
      onLoaded?.(); 
    },
  });

  this.followService.getFollowers(this.myUserId).subscribe({
    next: f => { 
      this.myFollowersCount = f.length; 
      console.log('[follow] RAW followers response:', JSON.stringify(f.slice(0,2)));
    },
    error: (err) => { console.error('[follow] getFollowers error:', err); },
  });
}

toggleFollow(user: UserSummary, event: Event): void {
  event.stopPropagation();
  if (this.followingInProgress.has(user.id)) return;
  this.followingInProgress.add(user.id);

  const wasFollowing  = user.isFollowedByMe;
  user.isFollowedByMe = !wasFollowing;

  const action$ = wasFollowing
    ? this.followService.unfollow(user.id)
    : this.followService.follow(user.id);

  action$.subscribe({
    next: () => {
      this.followingInProgress.delete(user.id);
      // Reload everything fresh from DB — no manual arithmetic
      this.loadFollowingUsers();
      this.loadSuggestedUsers();
      this.toast.success(wasFollowing
        ? `Unfollowed ${user.fullName}.`
        : `You are now following ${user.fullName}!`);
    },
    error: () => {
      user.isFollowedByMe = wasFollowing;
      this.followingInProgress.delete(user.id);
      this.toast.error('Could not update follow status. Please log in.');
    },
  });
}

  goToSeeAll(): void { this.router.navigate(['/mother/communaute/people']); }

  // ── Spaces ────────────────────────────────────────────────────
  loadSpacesList(): void {
    this.spaceSvc.getSpaces().subscribe({ next: list => (this.spaces = list) });
  }

  connectSpaceWs(): void {
    const token = localStorage.getItem('auth_token') || '';
    this.spaceSvc.connectForNotifications(token);
    this.spaceSvc.wsMessages$.subscribe(msg => {
      if (msg.type === 'CREATED' || msg.type === 'STARTED') this.loadSpacesList();
      if (msg.type === 'STARTED' && 'Notification' in window && Notification.permission === 'granted')
        new Notification('🎙️ Space Starting!', { body: msg.payload || '' });
    });
  }

  joinSpaceRoom(space: Space): void {
    if (space.status !== 'LIVE') { Notification.requestPermission(); return; }
    this.spacesToken = localStorage.getItem('auth_token') || '';
    this.myEmail = getEmailFromToken() || '';
    const openRoom = () => { this.myUserId = getUserIdFromToken(); this.activeSpaceRoom = space; };
    if (getUserIdFromToken() > 0) { openRoom(); return; }
    const headers = new HttpHeaders({ Authorization: `Bearer ${this.spacesToken}` });
    this.http.get<any[]>(`${environment.apiUrl}/users/all`, { headers }).subscribe({
      next: (users: any[]) => {
        const me = users.find((u: any) => u.email?.toLowerCase() === this.myEmail.toLowerCase());
        if (me?.id) storeUserId(Number(me.id));
        openRoom();
      },
      error: () => openRoom()
    });
  }

  startSpaceNow(space: Space): void {
    this.spaceSvc.startSpace(space.id).subscribe(s => { this.activeSpaceRoom = s; this.loadSpacesList(); });
  }

  getSpaceCatEmoji(cat: string): string { return this.catMeta[cat as keyof typeof this.catMeta]?.emoji ?? '🎙️'; }
  getSpaceCatColor(cat: string): string { return this.catMeta[cat as keyof typeof this.catMeta]?.color ?? '#ff4f75'; }
  closeSpaceRoom(): void { this.activeSpaceRoom = null; this.loadSpacesList(); }
  getInitialsForSpace(name: string): string {
    return (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  onSpaceCreated(): void {
    this.showCreateSpace = false;
    this.loadSpacesList();
    this.toast.success('Space created successfully! 🎉');
  }

  summarizePost(post: Post, event: Event): void {
  event.stopPropagation();
  if (!post.id || this.summarizingPostId === post.id) return;
  this.summarizingPostId = post.id;

  this.http.post<any>(
    `${environment.apiUrl}/posts/${post.id}/summarize`,
    { numSentences: 3 },
    { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}` } }
  ).subscribe({
    next: (res) => {
      if (res?.summary) {
        this.postSummaryMap[post.id!] = res.summary;
      }
      this.summarizingPostId = null;
    },
    error: () => {
      this.toast.error('Could not summarize post. Please try again.');
      this.summarizingPostId = null;
    },
  });
}
isAdminPost(post: any): boolean {
    return post._admin === true ||
           post.authorEmail === 'admin' ||
           post.user?.role === 'ADMIN' ||
           (post.user?.firstName + ' ' + post.user?.lastName).trim() === 'TFAKADNI';
  }

private _startOnlinePoll(): void {
  // followingUsers is guaranteed loaded before this runs
  this._fetchOnlineUsers();
  this.onlinePollInterval = setInterval(() => this._fetchOnlineUsers(), 30_000);
}

private _fetchOnlineUsers(): void {
  this.presenceSvc.getOnlineEmails().subscribe({
    next: emails => {
      this.onlineEmailsSet = emails;
      console.log('[presence] online set:', [...emails]);
      console.log('[presence] following count:', this.followingUsers.length);
      this._refreshOnlineFollowing();
    },
    error: () => {},
  });
}



private _refreshOnlineFollowing(): void {
  // If followingUsers have no email, cross-reference with allUsers cache
  this.onlineFollowingUsers = this.followingUsers.filter(u => {
    const raw   = u as any;
    const email = (
      u.email            ||
      raw.userEmail      ||
      raw.emailAddress   ||
      raw.mail           ||
      ''
    ).toLowerCase().trim();

    console.log(`[presence] checking user ${u.fullName} → email="${email}" online=${this.onlineEmailsSet.has(email)}`);

    return !!email
      && this.onlineEmailsSet.has(email)
      && email !== (this.myEmail || '').toLowerCase();
  });

  this.followNotifSvc.setOnlineUsers(this.onlineFollowingUsers);
  console.log('[presence] result onlineFollowingUsers:', this.onlineFollowingUsers.map(u => u.fullName));
}
onSearch(query: string): void {
  const q = query.toLowerCase().trim();
  if (!q) {
    this.apply();
    this.whoToFollow = this.suggestedUsers;
    return;
  }

  // Filter posts by content, author name, or tag
  this.filteredPosts = this._applySort(
    this.posts.filter(p => {
      const content   = (p.contenu || '').toLowerCase();
      const author    = this.getPostAuthorName(p).toLowerCase();
      const tag       = (p.tag || '').toLowerCase();
      return content.includes(q) || author.includes(q) || tag.includes(q);
    })
  );

  // Filter friend suggestions by name or email
  this.whoToFollow = this.suggestedUsers.filter(u =>
    u.fullName.toLowerCase().includes(q) ||
    (u.email || '').toLowerCase().includes(q)
  );
}

getStoryAuthorName(story: Story): string {
  const raw = story as any;
  if (raw.user) {
    const full = `${raw.user.firstName ?? ''} ${raw.user.lastName ?? ''}`.trim();
    if (full) return full;
    if (raw.user.email) return this._nameFromEmail(raw.user.email);
  }
  if (raw.authorEmail || raw.userEmail) {
    const email = raw.authorEmail || raw.userEmail;
    const cached = this.authorNameCache.get(email.toLowerCase());
    if (cached) return cached;
    return this._nameFromEmail(email);
  }
  return 'Community Member';
}

get groupedStories(): { author: string; stories: Story[]; latest: Story }[] {
  const map = new Map<string, Story[]>();
  for (const story of this.activeStories) {
    const key = this.getStoryAuthorName(story);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(story);
  }
  return [...map.entries()].map(([author, stories]) => ({
    author,
    stories,
    latest: stories[stories.length - 1]
  }));
}
viewStoryGroup(group: { author: string; stories: Story[]; latest: Story }): void {
  this.currentStoryGroup = group.stories;
  this.currentStoryIndex = 0;
  this.viewingStory = group.stories[0];
  this.startStoryTimer();
}
}