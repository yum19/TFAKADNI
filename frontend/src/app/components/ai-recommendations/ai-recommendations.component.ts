// src/app/components/ai-recommendations/ai-recommendations.component.ts
import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  RecommendationService,
  ProductRecommendation
} from '../../core/services/recommendation.service';

@Component({
  selector: 'app-ai-recommendations',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ai-recommendations.component.html',
  styleUrls: ['./ai-recommendations.component.css']
})
export class AiRecommendationsComponent implements OnInit, OnDestroy {

  recommendations: ProductRecommendation[] = [];
  loading = true;
  hasData = false;

  // For marquee / scroll animation pause on hover
  paused = false;

  constructor(
    private recSvc: RecommendationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
  this.recSvc.getProductRecommendations().subscribe({
    next: data => {
      console.log('[RecComp] received:', data.length, 'items'); // remove after debugging
      this.recommendations = data;
      this.hasData = true;
      this.loading = false;
      this.cdr.markForCheck();
    }
  });
}

  ngOnDestroy(): void {}

  goToProduct(id: number): void {
    this.router.navigate(['/shop/product', id]);
  }

  getImage(rec: ProductRecommendation): string {
    return rec.images && rec.images.length > 0
      ? rec.images[0]
      : '';
  }

  formatPrice(price: number): string {
    return price?.toFixed(2) ?? '0.00';
  }

  trackById(_: number, item: ProductRecommendation): number {
    return item.productId;
  }

  getScoreLabel(score: number): string {
    if (score >= 85) return '✨ Perfect match';
    if (score >= 70) return '💕 Great for you';
    if (score >= 55) return '👍 Recommended';
    return '💡 Suggested';
  }

  // Duplicate list for seamless infinite scroll
  get doubledList(): ProductRecommendation[] {
    return [...this.recommendations, ...this.recommendations];
  }
}