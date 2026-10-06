import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import {
  StoryAudioResponseDto,
  StoryRequestDto,
  StoryResponseDto,
  StorytellingService,
} from '../../../../../core/services/module6b/storytelling.service';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  type: ToastType;
  text: string;
}

@Component({
  selector: 'app-storytelling-popup',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './storytelling-popup.component.html',
  styleUrls: ['./storytelling-popup.component.css']
})
export class StorytellingPopupComponent implements OnChanges {
  @Input() visible = false;
  @Output() closePopup = new EventEmitter<void>();
  @Output() storiesChanged = new EventEmitter<void>();

  loading = false;
  historyLoading = false;
  audioLoading = false;
  deleting = false;
  detailsLoading = false;

  generatedStory: StoryResponseDto | null = null;
  latestStory: StoryResponseDto | null = null;
  storyHistory: StoryResponseDto[] = [];
  generatedAudio: StoryAudioResponseDto | null = null;

  toasts: ToastMessage[] = [];

  form: StoryRequestDto = {
    periodType: 'WEEKLY',
    tone: 'SUPPORTIVE',
    voiceType: 'SOFT_FEMALE'
  };

  readonly periodOptions = [
    { value: 'WEEKLY', label: 'Weekly reflection' },
    { value: 'MONTHLY', label: 'Monthly reflection' }
  ];

  readonly toneOptions = [
    { value: 'SUPPORTIVE', label: 'Supportive' },
    { value: 'CALM', label: 'Calm' },
    { value: 'ENCOURAGING', label: 'Encouraging' }
  ];

  readonly voiceOptions = [
    { value: 'SOFT_FEMALE', label: 'Soft female' },
    { value: 'CALM_NEUTRAL', label: 'Calm neutral' },
    { value: 'SUPPORTIVE_COACH', label: 'Supportive coach' }
  ];

  private toastSeed = 0;

  constructor(private storytellingService: StorytellingService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.loadAll();
    }
  }

  loadAll(): void {
    this.generatedAudio = null;
    this.loadLatestStory();
    this.loadStoryHistory();
  }

  loadLatestStory(): void {
    this.storytellingService.getLatestStory().subscribe({
      next: (story) => {
        this.latestStory = story ?? null;
        if (!this.generatedStory && story) {
          this.generatedStory = story;
        }
      },
      error: () => {
        this.latestStory = null;
      }
    });
  }

  loadStoryHistory(): void {
    this.historyLoading = true;

    this.storytellingService.getStoryHistory().subscribe({
      next: (stories) => {
        this.storyHistory = [...(stories ?? [])];
        this.historyLoading = false;

        this.storiesChanged.emit();

        if (!this.generatedStory && this.storyHistory.length > 0) {
          this.generatedStory = this.storyHistory[0];
        }
      },
      error: (error) => {
        console.error('Load story history error:', error);
        this.historyLoading = false;
        this.showToast('Unable to load story history.', 'error');
      }
    });
  }

  generateStory(): void {
    this.loading = true;
    this.generatedAudio = null;

    this.storytellingService.generateStory(this.form).subscribe({
      next: (story) => {
        this.generatedStory = story;
        this.latestStory = story;
        this.loading = false;
        this.showToast('Story generated successfully.', 'success');
        this.storiesChanged.emit();
        this.loadStoryHistory();
      },
      error: (error) => {
        console.error('Generate story error:', error);
        this.loading = false;
        this.showToast('Unable to generate a story right now.', 'error');
      }
    });
  }

  selectStory(storyId: number): void {
    this.detailsLoading = true;
    this.generatedAudio = null;

    this.storytellingService.getStoryById(storyId).subscribe({
      next: (story) => {
        this.generatedStory = story;
        this.detailsLoading = false;
      },
      error: (error) => {
        console.error('Get story by id error:', error);
        this.detailsLoading = false;
        this.showToast('Unable to load this story.', 'error');
      }
    });
  }

  generateAudio(story: StoryResponseDto | null = this.generatedStory): void {
    if (!story?.id) {
      this.showToast('Please select a story first.', 'info');
      return;
    }

    this.audioLoading = true;

    this.storytellingService
      .generateAudio(story.id, story.voiceType || this.form.voiceType || 'SOFT_FEMALE')
      .subscribe({
        next: (audio) => {
          this.generatedAudio = audio;
          this.audioLoading = false;

          if (this.generatedStory && this.generatedStory.id === story.id) {
            this.generatedStory = {
              ...this.generatedStory,
              audioGenerated: true,
              audioUrl: audio.audioUrl,
              voiceType: audio.voiceType,
            };
          }

          this.storyHistory = this.storyHistory.map(item =>
            item.id === story.id
              ? {
                  ...item,
                  audioGenerated: true,
                  audioUrl: audio.audioUrl,
                  voiceType: audio.voiceType,
                }
              : item
          );

          this.showToast('Audio generated successfully.', 'success');
        },
        error: (error) => {
          console.error('Generate audio error:', error);
          this.audioLoading = false;
          this.showToast('Unable to generate audio right now.', 'error');
        }
      });
  }

  deleteCurrentStory(): void {
    if (!this.generatedStory?.id) {
      this.showToast('No story selected.', 'info');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this story?');
    if (!confirmed) {
      return;
    }

    this.deleting = true;
    const storyId = this.generatedStory.id;

    this.storytellingService.deleteStory(storyId).subscribe({
      next: () => {
        this.deleting = false;
        this.showToast('Story deleted successfully.', 'success');

        this.storyHistory = this.storyHistory.filter(item => item.id !== storyId);
        this.latestStory = this.latestStory?.id === storyId ? null : this.latestStory;
        this.generatedAudio = null;
        this.storiesChanged.emit();

        if (this.storyHistory.length > 0) {
          this.selectStory(this.storyHistory[0].id);
        } else {
          this.generatedStory = null;
        }
      },
      error: (error) => {
        console.error('Delete story error:', error);
        this.deleting = false;
        this.showToast('Unable to delete this story.', 'error');
      }
    });
  }

  close(): void {
    this.closePopup.emit();
  }

  trackByStoryId(index: number, story: StoryResponseDto): number {
    return story.id;
  }

  getAudioUrl(story?: StoryResponseDto | null): string {
    return this.storytellingService.buildAbsoluteAudioUrl(story?.audioUrl);
  }

  getGeneratedAudioUrl(): string {
    return this.generatedAudio?.audioUrl
      ? this.storytellingService.buildAbsoluteAudioUrl(this.generatedAudio.audioUrl)
      : '';
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }

  private showToast(text: string, type: ToastType): void {
    const id = ++this.toastSeed;
    this.toasts = [...this.toasts, { id, text, type }];

    window.setTimeout(() => {
      this.toasts = this.toasts.filter((toast) => toast.id !== id);
    }, 3200);
  }
}