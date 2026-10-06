// src/app/features/communaute/pages/saved-posts/saved-posts.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { SavedPostService } from '../../../../../core/services/saved-post.service';
import { SavedPostResponse } from '../../../../../core/models/saved-post.model';
import { IndexHeaderComponent } from '../../../../../components/index-header/index-header.component';
import { IndexFooterComponent } from '../../../../../components/index-footer/index-footer.component';

@Component({
  selector: 'app-saved-posts',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    IndexHeaderComponent,
    IndexFooterComponent,
  ],
  templateUrl: './saved-posts.component.html',
  styleUrls: ['./saved-posts.component.css'],
})
export class SavedPostsComponent implements OnInit {

  savedPosts: SavedPostResponse[] = [];
  loading = true;
  removingId: number | null = null;

  readonly tagLabels: Record<string, string> = {
    GROSSESSE: 'Pregnancy',
    POSTPARTUM: 'Postpartum',
    FERTILITE: 'Fertility',
    NUTRITION: 'Nutrition',
  };

  readonly tagEmoji: Record<string, string> = {
    GROSSESSE: '🤰',
    POSTPARTUM: '👶',
    FERTILITE: '🌸',
    NUTRITION: '🥗',
  };

  constructor(
    private savedPostSvc: SavedPostService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.savedPostSvc.getSaved().subscribe({
      next: (posts) => {
        this.savedPosts = posts;
        this.savedPostSvc.hydrate(posts);
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  unsave(item: SavedPostResponse): void {
    if (this.removingId === item.postId) return;
    this.removingId = item.postId;

    this.savedPostSvc.toggle(item.postId).subscribe({
      next: () => {
        // animate out then remove from list
        setTimeout(() => {
          this.savedPosts = this.savedPosts.filter(p => p.postId !== item.postId);
          this.removingId = null;
        }, 380);
      },
      error: () => { this.removingId = null; },
    });
  }

  goToPost(postId: number): void {
    this.router.navigate(['/communaute', postId]);
  }

  goBack(): void {
    this.router.navigate(['/communaute']);
  }
}