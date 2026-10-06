import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Router } from '@angular/router';
import { Post } from '../../../../../core/models/post.model';
import { PostService } from '../../../../../core/services/post.services';
import { AiPostService } from '../../../../../core/services/ai-post.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-creer-post',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatCheckboxModule],
  templateUrl: './creer-post.html',
  styleUrls: ['./creer-post.css']
})
export class CreerPost implements OnInit, OnDestroy {

  @Output() close = new EventEmitter<void>();
  @Output() postCreated = new EventEmitter<Post>();

  // Trending hashtags passed in from the parent (liste-posts)
  allPosts: Post[] = [];

  isEditMode = false;
  postIdToEdit: number | null = null;

  newPost: Partial<Post> = {
    contenu: '',
    tag: 'GROSSESSE',
    anonyme: false,
    images: []
  };

  availableTags: string[] = ['GROSSESSE', 'POSTPARTUM', 'FERTILITE', 'NUTRITION'];

  tagLabels: Record<string, string> = {
    GROSSESSE: 'Pregnancy',
    POSTPARTUM: 'Postpartum',
    FERTILITE:  'Fertility',
    NUTRITION:  'Nutrition'
  };

  tagEmoji: Record<string, string> = {
    GROSSESSE:  '🤰',
    POSTPARTUM: '👶',
    FERTILITE:  '🌸',
    NUTRITION:  '🥗'
  };

  previewImages: string[] = [];
  isSubmitting = false;
  charCount = 0;
  maxChars = 500;
  dragOver = false;

  // Word autocomplete (existing)
  suggestions: string[] = [];
  showSuggestions = false;
  selectedSuggestionIndex = -1;
  isGenerating = false;
  private textChange$ = new Subject<string>();
  private textChangeSub: any;

  // Hashtag autocomplete (new)
  hashtagSuggestions: Array<{ tag: string; count: number }> = [];
  showHashtagSuggestions = false;
  selectedHashtagIndex = -1;
  private activeHashtagStart = -1; // cursor position where '#' was typed

  constructor(
    private postService: PostService,
    private router: Router,
    private aiPostService: AiPostService,
    private toast: ToastService
  ) {
    document.body.style.overflow = 'hidden';
  }

  ngOnInit(): void {
  // Always load posts for hashtag suggestions
  this.postService.getAll().subscribe({
    next: (posts) => { this.allPosts = posts; },
    error: () => {}
  });

  const state = history.state;
  if (state && state.post && state.isEdit) {
    this.isEditMode = true;
    this.postIdToEdit = state.post.id;
    this.newPost = {
      ...state.post,
      images: state.post.images ? [...state.post.images] : []
    };
    this.previewImages = state.post.images ? [...state.post.images] : [];
    this.charCount = this.newPost.contenu?.length ?? 0;
  }

  this.textChangeSub = this.textChange$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(text => {
      const words = text.trim().split(/\s+/);
      const last = words[words.length - 1];
      if (last.startsWith('#') || last.length < 2) return [[]];
      return this.aiPostService.autocomplete(last);
    })
  ).subscribe(s => {
    this.suggestions = s as string[];
    this.showSuggestions = this.suggestions.length > 0 && !this.showHashtagSuggestions;
    this.selectedSuggestionIndex = -1;
  });
}

  ngOnDestroy(): void {
    document.body.style.overflow = '';
    this.textChangeSub?.unsubscribe();
  }

  // ─── HASHTAG AUTOCOMPLETE ──────────────────────────────────────

  private getHashtagSuggestions(prefix: string): Array<{ tag: string; count: number }> {
    const hashtagCounts = new Map<string, number>();
    for (const post of this.allPosts) {
      if (!post.contenu) continue;
      const matches = post.contenu.match(/#[a-zA-Z]\w*/g);
      if (!matches) continue;
      for (const raw of matches) {
        const tag = raw.toLowerCase();
        hashtagCounts.set(tag, (hashtagCounts.get(tag) ?? 0) + 1);
      }
    }
    const needle = prefix.toLowerCase();
    return [...hashtagCounts.entries()]
      .filter(([tag]) => tag.startsWith(needle))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag, count]) => ({ tag, count }));
  }

  private detectHashtagAtCursor(text: string, cursorPos: number): string | null {
    // Walk backward from cursor to find an active '#...' token
    let i = cursorPos - 1;
    while (i >= 0 && !/\s/.test(text[i])) {
      if (text[i] === '#') {
        this.activeHashtagStart = i;
        return text.slice(i, cursorPos);
      }
      i--;
    }
    this.activeHashtagStart = -1;
    return null;
  }

  applyHashtagSuggestion(item: { tag: string; count: number }): void {
    const text = this.newPost.contenu || '';
    const textarea = document.querySelector('.cp-textarea') as HTMLTextAreaElement;
    const cursorPos = textarea?.selectionStart ?? text.length;

    if (this.activeHashtagStart < 0) return;

    const before = text.slice(0, this.activeHashtagStart);
    const after  = text.slice(cursorPos);
    this.newPost.contenu = before + item.tag + ' ' + after;
    this.charCount = this.newPost.contenu.length;

    this.hashtagSuggestions = [];
    this.showHashtagSuggestions = false;
    this.selectedHashtagIndex = -1;
    this.activeHashtagStart = -1;

    // Restore cursor after Vue tick
    setTimeout(() => {
      const pos = before.length + item.tag.length + 1;
      textarea?.setSelectionRange(pos, pos);
      textarea?.focus();
    });
  }

  // ─── TEXT INPUT ───────────────────────────────────────────────

  onTextInput(event: Event): void {
    const ta = event.target as HTMLTextAreaElement;
    const val = ta.value;
    const cursorPos = ta.selectionStart ?? val.length;

    this.charCount = val.length;
    this.newPost.contenu = val;

    // Check for active hashtag token
    const hashToken = this.detectHashtagAtCursor(val, cursorPos);
    if (hashToken && hashToken.length > 1) {
      this.hashtagSuggestions = this.getHashtagSuggestions(hashToken);
      this.showHashtagSuggestions = this.hashtagSuggestions.length > 0;
      this.showSuggestions = false; // suppress word suggestions while in hashtag mode
      this.selectedHashtagIndex = -1;
    } else {
      this.showHashtagSuggestions = false;
      this.hashtagSuggestions = [];
      this.textChange$.next(val); // trigger word autocomplete only outside hashtag mode
    }
  }

  // ─── KEYBOARD NAVIGATION ─────────────────────────────────────

  onKeydown(event: KeyboardEvent): void {
    // Hashtag suggestion navigation takes priority
    if (this.showHashtagSuggestions && this.hashtagSuggestions.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.selectedHashtagIndex = Math.min(this.selectedHashtagIndex + 1, this.hashtagSuggestions.length - 1);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.selectedHashtagIndex = Math.max(this.selectedHashtagIndex - 1, 0);
        return;
      }
      if ((event.key === 'Tab' || event.key === 'Enter') && this.selectedHashtagIndex >= 0) {
        event.preventDefault();
        this.applyHashtagSuggestion(this.hashtagSuggestions[this.selectedHashtagIndex]);
        return;
      }
      if (event.key === 'Escape') {
        this.showHashtagSuggestions = false;
        return;
      }
    }

    // Word suggestion navigation
    if (!this.showSuggestions || this.suggestions.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedSuggestionIndex = Math.min(this.selectedSuggestionIndex + 1, this.suggestions.length - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, 0);
    } else if (event.key === 'Tab' || event.key === 'Enter') {
      if (this.selectedSuggestionIndex >= 0) {
        event.preventDefault();
        this.applySuggestion(this.suggestions[this.selectedSuggestionIndex]);
      }
    } else if (event.key === 'Escape') {
      this.showSuggestions = false;
    }
  }

  // ─── WORD AUTOCOMPLETE ────────────────────────────────────────

  applySuggestion(word: string): void {
    const words = (this.newPost.contenu || '').trimEnd().split(' ');
    words[words.length - 1] = word;
    this.newPost.contenu = words.join(' ') + ' ';
    this.charCount = this.newPost.contenu.length;
    this.suggestions = [];
    this.showSuggestions = false;
    this.selectedSuggestionIndex = -1;
  }

  closeSuggestions(): void {
    // Delay so mousedown on suggestion fires first
    setTimeout(() => {
      this.showSuggestions = false;
      this.showHashtagSuggestions = false;
    }, 150);
  }

  // ─── REST OF EXISTING METHODS (unchanged) ────────────────────

  selectTag(tag: string): void {
    this.newPost.tag = tag as any;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(): void {
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    const files = event.dataTransfer?.files;
    if (files) this.processFiles(files);
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.processFiles(input.files);
  }

  private processFiles(files: FileList): void {
    const remaining = 4 - this.previewImages.length;
    const toProcess = Math.min(files.length, remaining);
    for (let i = 0; i < toProcess; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        this.previewImages.push(base64);
        if (!this.newPost.images) this.newPost.images = [];
        this.newPost.images!.push(base64);
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(index: number): void {
    this.previewImages.splice(index, 1);
    if (this.newPost.images) this.newPost.images.splice(index, 1);
  }

  publishPost(): void {
    if (!this.newPost.contenu?.trim() || this.isSubmitting) return;
    this.isSubmitting = true;
    const postData: any = {
      id: this.isEditMode ? this.postIdToEdit! : undefined,
      contenu: this.newPost.contenu.trim(),
      tag: this.newPost.tag,
      anonyme: this.newPost.anonyme || false,
      likes: this.newPost.likes || 0,
      date: this.newPost.date || new Date().toISOString(),
      images: this.newPost.images || []
    };
    const request = this.isEditMode
      ? this.postService.update(this.postIdToEdit!, postData)
      : this.postService.create(postData);
    request.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toast.success(this.isEditMode ? 'Post updated successfully!' : 'Post published successfully!');
this.router.navigate(['/mother/communaute']);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error:', err);
        this.toast.error('❌ Error ' + (this.isEditMode ? 'updating' : 'publishing') + ' the post');
      }
    });
  }

  closeModal(event?: MouseEvent): void {
    if (!event || (event.target as HTMLElement).classList.contains('cp-overlay')) {
      this.close.emit();
    }
  }

  cancelAndGoBack(): void {
    this.close.emit();
    this.router.navigate(['/mother/communaute']);
  }

  get charPercent(): number { return (this.charCount / this.maxChars) * 100; }

  get charColor(): string {
    if (this.charPercent > 90) return '#ef4444';
    if (this.charPercent > 75) return '#f97316';
    return '#ff4f75';
  }

  generateWithAI(): void {
    const topic = (this.newPost.contenu || '').trim();
    const tag = this.newPost.tag || 'GROSSESSE';
    if (!topic) {
      this.toast.info('Write a few words first — the AI will expand it for you!');
      return;
    }
    this.isGenerating = true;
    this.showSuggestions = false;
    this.showHashtagSuggestions = false;
    const originalText = this.newPost.contenu;
    this.aiPostService.generatePost(topic, tag).subscribe({
      next: ({ content, error }: any) => {
        this.isGenerating = false;
        if (error) { this.toast.error('⚠️ ' + error); return; }
        this.newPost.contenu = content;
        this.charCount = content.length;
      },
      error: (err) => {
        this.isGenerating = false;
        this.newPost.contenu = originalText;
        if (err.status === 429) {
  this.toast.error('⚠️ AI daily quota reached. Please create a new API key at aistudio.google.com or try tomorrow.');
} else {
  this.toast.error('Could not reach the AI. Check your connection.');
}
      }
    });
  }
}