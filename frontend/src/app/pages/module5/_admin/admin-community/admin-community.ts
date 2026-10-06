import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe } from '@angular/common';
import { environment } from '../../../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';


@Component({
  selector: 'app-admin-community',
  standalone: true,
  imports: [CommonModule, MatIconModule, DecimalPipe, FormsModule, MatTooltipModule],
  templateUrl: './admin-community.html',
  styleUrls: ['./admin-community.css'],
})
export class AdminCommunityComponent implements OnInit, OnDestroy {

  loading = true;

  // ── Raw data ──────────────────────────────────────────────
  allPosts: any[] = [];
  allUsers: any[] = [];
  allReports: any[] = [];
  allSpaces: any[] = [];
  allStories: any[] = [];

  // ── KPIs ──────────────────────────────────────────────────
  totalPosts          = 0;
  totalUsers          = 0;
  totalComments       = 0;
  totalReactions      = 0;
  totalReports        = 0;
  totalSpaces         = 0;
  totalStories        = 0;
  totalSavedPosts     = 0;
  postsThisWeek       = 0;
  reportsThisWeek     = 0;
  avgCommentsPerPost  = 0;
  avgLikesPerPost     = 0;
  liveSpacesCount     = 0;
  anonymousPostsCount = 0;
  postWithImagesCount = 0;
  activeUsersCount    = 0;
  newUsersThisWeek    = 0;
  totalFollowers      = 0;

  // ── Chart Data ────────────────────────────────────────────
  tagStats:           { label: string; value: number; pct: number; color: string; emoji: string }[] = [];
  reactionStats:      { label: string; value: number; pct: number; emoji: string; color: string }[] = [];
  trendingHashtags:   { tag: string; count: number; pct: number }[] = [];
  topPosters:         { name: string; email: string; count: number; pct: number }[] = [];
  weeklyActivity:     { day: string; count: number; pct: number }[] = [];
  engagementBreakdown:{ label: string; value: number; color: string; icon: string }[] = [];
  monthlyGrowth:      { month: string; posts: number; users: number; pct: number }[] = [];
  ratingDist:         { star: number; count: number; pct: number }[] = [];

  // Sparkline data
  sparkBars:  number[] = [];
  sparkBars2: number[] = [];
  sparkBars3: number[] = [];
  sparkBars4: number[] = [];

  // ── Toast ─────────────────────────────────────────────────
  toast: { message: string; type: 'success' | 'error' | 'info' } | null = null;
  private toastTimer: any;
  private refreshTimer: any;

  readonly TAG_COLORS: Record<string, string> = {
    GROSSESSE: '#ff4f75', POSTPARTUM: '#6c5ce7',
    FERTILITE: '#e84393', NUTRITION: '#00b894',
  };
  readonly TAG_EMOJIS: Record<string, string> = {
    GROSSESSE: '🤰', POSTPARTUM: '👶', FERTILITE: '🌸', NUTRITION: '🥗',
  };
  readonly RX_EMOJIS: Record<string, string> = {
    LIKE: '👍', LOVE: '❤️', HAHA: '😂', WOW: '😮', SAD: '😢', ANGRY: '😡',
  };
  readonly RX_COLORS: Record<string, string> = {
    LIKE: '#3498db', LOVE: '#ff4f75', HAHA: '#f39c12',
    WOW: '#9b59b6', SAD: '#1abc9c', ANGRY: '#e74c3c',
  };

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.generateSparklines();
    this.loadAll();
    this.refreshTimer = setInterval(() => this.loadAll(), 30_000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    if (this.toastTimer)   clearTimeout(this.toastTimer);
  }

  /** Navigate to admin live community page */
  goToLiveMode(): void {
    this.router.navigate(['admin/go-live-admin']);
  }

  private h(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
      'Content-Type': 'application/json',
    });
  }

  showToast(msg: string, type: 'success' | 'error' | 'info' = 'success'): void {
    clearTimeout(this.toastTimer);
    this.toast = { message: msg, type };
    this.toastTimer = setTimeout(() => (this.toast = null), 3500);
  }

  private generateSparklines(): void {
    const gen = () => Array.from({ length: 8 }, () => Math.floor(Math.random() * 80 + 20));
    this.sparkBars  = gen();
    this.sparkBars2 = gen();
    this.sparkBars3 = gen();
    this.sparkBars4 = gen();
  }

  loadAll(): void {
    this.loading = true;

    // Posts
    this.http.get<any[]>(`${environment.apiUrl}/posts`, { headers: this.h() }).subscribe({
      next: posts => {
        this.allPosts = posts;
        this.buildStats(posts);
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });

    // Users
    this.http.get<any>(`${environment.apiUrl}/users`, { headers: this.h() }).subscribe({
      next: res => {
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        this.allUsers = list;
        this.totalUsers      = list.length;
        this.activeUsersCount = list.filter((u: any) => u.isActive).length;
        const wk = new Date(Date.now() - 7 * 86_400_000);
        this.newUsersThisWeek = list.filter((u: any) => new Date(u.createdAt) >= wk).length;
        this.totalFollowers   = list.reduce((s: number, u: any) => s + (u.followersCount ?? 0), 0);
      },
      error: () => {},
    });

    // Reports
    this.http.get<any[]>(`${environment.apiUrl}/admin/reports`, { headers: this.h() }).subscribe({
  next: r => {
    this.allReports   = r || [];
    this.totalReports = r?.length || 0;
    const wk = new Date(Date.now() - 7 * 86_400_000);
    this.reportsThisWeek = (r || []).filter((x: any) => new Date(x.createdAt ?? x.date) >= wk).length;
  },
  error: () => {},
});

    // Spaces
    this.http.get<any[]>(`${environment.apiUrl}/spaces`, { headers: this.h() }).subscribe({
      next: s => {
        this.allSpaces      = s || [];
        this.totalSpaces    = s?.length || 0;
        this.liveSpacesCount = (s || []).filter((x: any) => x.status === 'LIVE').length;
      },
      error: () => {},
    });

    // Stories
    this.http.get<any[]>(`${environment.apiUrl}/stories`, { headers: this.h() }).subscribe({
      next: s => {
        this.allStories  = s || [];
        this.totalStories = this.allStories.length;
      },
      error: () => {},
    });
  }

  private buildStats(posts: any[]): void {
    const wk = new Date(Date.now() - 7 * 86_400_000);
    this.totalPosts          = posts.length;
    this.postsThisWeek       = posts.filter(p => new Date(p.date) >= wk).length;
    this.anonymousPostsCount = posts.filter(p => p.anonyme).length;
    this.postWithImagesCount = posts.filter(p => p.images?.length > 0).length;
    this.totalSavedPosts     = posts.reduce((s, p) => s + (p.savedCount ?? p.saves?.length ?? 0), 0);

    let tc = 0, tr = 0;
    const tagMap:    Record<string, number> = {};
    const rxMap:     Record<string, number> = {};
    const hashMap:   Record<string, number> = {};
    const authorMap: Record<string, { name: string; count: number }> = {};
    const dayMap:    Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const monthMap:  Record<string, { posts: number; users: number }> = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    posts.forEach(p => {
      tc += p.commentaires?.length ?? 0;
      tr += p.reactionSummary?.total ?? p.reactions?.length ?? 0;

      if (p.tag) tagMap[p.tag] = (tagMap[p.tag] ?? 0) + 1;

      (p.contenu?.match(/#[a-zA-Z]\w*/g) ?? []).forEach((h: string) => {
        hashMap[h.toLowerCase()] = (hashMap[h.toLowerCase()] ?? 0) + 1;
      });

      if (p.reactionSummary?.counts) {
        Object.entries(p.reactionSummary.counts).forEach(([t, c]) => {
          rxMap[t] = (rxMap[t] ?? 0) + (c as number);
        });
      }

      if (p.date) {
        const d = new Date(p.date);
        dayMap[days[d.getDay()]] = (dayMap[days[d.getDay()]] ?? 0) + 1;
        const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!monthMap[mk]) monthMap[mk] = { posts: 0, users: 0 };
        monthMap[mk].posts++;
      }

      const email = p.authorEmail ?? p.user?.email ?? '';
      const name  = p.user
        ? `${p.user.firstName ?? ''} ${p.user.lastName ?? ''}`.trim()
        : email.split('@')[0];
      if (email) {
        if (!authorMap[email]) authorMap[email] = { name: name || email, count: 0 };
        authorMap[email].count++;
      }
    });

    this.totalComments      = tc;
    this.totalReactions     = tr;
    this.avgCommentsPerPost = posts.length ? Math.round((tc / posts.length) * 10) / 10 : 0;
    this.avgLikesPerPost    = posts.length ? Math.round((tr / posts.length) * 10) / 10 : 0;

    // Tag stats
    const tagTotal = Math.max(1, Object.values(tagMap).reduce((a, b) => a + b, 0));
    this.tagStats = Object.entries(tagMap).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({
      label, value, pct: Math.round(value / tagTotal * 100),
      color: this.TAG_COLORS[label] ?? '#ff4f75',
      emoji: this.TAG_EMOJIS[label] ?? '📌',
    }));

    // Reaction stats
    const rxTotal = Math.max(1, Object.values(rxMap).reduce((a, b) => a + b, 0));
    this.reactionStats = Object.entries(rxMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({
      label, value, pct: Math.round(value / rxTotal * 100),
      emoji: this.RX_EMOJIS[label] ?? '👍',
      color: this.RX_COLORS[label] ?? '#ff4f75',
    }));

    // Hashtags
    const htMax = Math.max(1, ...Object.values(hashMap));
    this.trendingHashtags = Object.entries(hashMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 12)
      .map(([tag, count]) => ({ tag, count, pct: Math.round(count / htMax * 100) }));

    // Top posters
    const posterMax = Math.max(1, ...Object.values(authorMap).map(a => a.count));
    this.topPosters = Object.entries(authorMap)
      .sort((a, b) => b[1].count - a[1].count).slice(0, 8)
      .map(([email, v]) => ({ email, name: v.name, count: v.count, pct: Math.round(v.count / posterMax * 100) }));

    // Weekly
    const dayOrder  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayMax    = Math.max(1, ...Object.values(dayMap));
    this.weeklyActivity = dayOrder.map(d => ({ day: d, count: dayMap[d] ?? 0, pct: Math.round((dayMap[d] ?? 0) / dayMax * 100) }));

    // Monthly
    const monthKeys = Object.keys(monthMap).sort().slice(-6);
    const mMax      = Math.max(1, ...monthKeys.map(k => monthMap[k].posts));
    this.monthlyGrowth = monthKeys.map(k => ({
      month: new Date(k + '-01').toLocaleString('default', { month: 'short' }),
      posts: monthMap[k].posts,
      users: monthMap[k].users,
      pct:   Math.round(monthMap[k].posts / mMax * 100),
    }));

    // Engagement breakdown
    this.engagementBreakdown = [
      { label: 'Reactions',   value: tr,                        color: '#ff4f75', icon: 'favorite' },
      { label: 'Comments',    value: tc,                        color: '#6c5ce7', icon: 'chat_bubble' },
      { label: 'Saved',       value: this.totalSavedPosts,      color: '#f39c12', icon: 'bookmark' },
      { label: 'Anonymous',   value: this.anonymousPostsCount,  color: '#b08a9a', icon: 'person_off' },
      { label: 'With Images', value: this.postWithImagesCount,  color: '#00b894', icon: 'image' },
      { label: 'Reports',     value: this.totalReports,         color: '#e74c3c', icon: 'flag' },
    ];

    // Rating distribution (simulated quality)
    this.ratingDist = [5, 4, 3, 2, 1].map(star => {
      const count = Math.max(0, Math.floor(posts.length * (
        star === 5 ? 0.4 : star === 4 ? 0.3 : star === 3 ? 0.15 : star === 2 ? 0.1 : 0.05
      )));
      return { star, count, pct: posts.length ? Math.round(count / posts.length * 100) : 0 };
    });
  }

  // ── Exports ───────────────────────────────────────────────
  exportCSV(): void {
    const hdr  = ['Category', 'Posts', 'Share%'];
    const rows = this.tagStats.map(t => [t.label, t.value, t.pct + '%']);
    const csv  = [hdr, ...rows].map(r => r.join(',')).join('\n');
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'community_stats.csv';
    a.click();
    this.showToast('CSV exported ✓', 'info');
  }

  exportPDF(): void {
    const w = window.open('', '_blank')!;
    w.document.write(`
      <html><head><title>Community Report</title>
      <style>
        body{font-family:'Segoe UI',sans-serif;margin:32px;color:#1a0a10}
        h1{color:#ff4f75;border-bottom:3px solid #ff4f75;padding-bottom:12px}
        .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}
        .box{border:1.5px solid #f0d0d9;border-radius:10px;padding:14px;text-align:center;background:#fff5f7}
        .num{font-size:1.8rem;font-weight:900;color:#ff4f75}
        .lbl{font-size:.75rem;color:#b08a9a;text-transform:uppercase;margin-top:4px}
        table{width:100%;border-collapse:collapse;font-size:.82rem;margin-top:12px}
        th{background:#ff4f75;color:#fff;padding:8px 12px;text-align:left}
        td{padding:7px 12px;border-bottom:1px solid #f0d0d9}
        tr:nth-child(even) td{background:#fff5f7}
      </style></head><body>
      <h1>💖 Community Analytics Report</h1>
      <p style="color:#b08a9a;font-size:.85rem">Generated: ${new Date().toLocaleString()}</p>
      <div class="grid">
        <div class="box"><div class="num">${this.totalPosts}</div><div class="lbl">Posts</div></div>
        <div class="box"><div class="num">${this.totalUsers}</div><div class="lbl">Members</div></div>
        <div class="box"><div class="num">${this.totalComments}</div><div class="lbl">Comments</div></div>
        <div class="box"><div class="num">${this.totalReactions}</div><div class="lbl">Reactions</div></div>
        <div class="box"><div class="num">${this.postsThisWeek}</div><div class="lbl">Posts/Week</div></div>
        <div class="box"><div class="num">${this.totalReports}</div><div class="lbl">Reports</div></div>
        <div class="box"><div class="num">${this.totalSpaces}</div><div class="lbl">Spaces</div></div>
        <div class="box"><div class="num">${this.totalStories}</div><div class="lbl">Stories</div></div>
      </div>
      <h2>Category Distribution</h2>
      <table><tr><th>Category</th><th>Posts</th><th>Share %</th></tr>
        ${this.tagStats.map(t => `<tr><td>${t.emoji} ${t.label}</td><td>${t.value}</td><td>${t.pct}%</td></tr>`).join('')}
      </table>
      <h2>Top Posters</h2>
      <table><tr><th>Author</th><th>Posts</th></tr>
        ${this.topPosters.map(p => `<tr><td>${p.name}</td><td>${p.count}</td></tr>`).join('')}
      </table>
      </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 600);
    this.showToast('PDF report opened ✓', 'info');
  }

  // ── Helpers ───────────────────────────────────────────────
  formatNum(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
    return String(n);
  }

  getInitials(name: string): string {
    return (name || '??').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  starsArr(n: number): number[] { return Array(n).fill(0); }
}