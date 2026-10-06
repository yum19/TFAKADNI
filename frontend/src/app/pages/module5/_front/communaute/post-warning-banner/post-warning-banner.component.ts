import {
  Component, Input, Output, EventEmitter, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostAnalysis } from '../../../../../core/models/post-analysis.model';

@Component({
  selector:    'app-post-warning-banner',
  standalone:  true,
  imports:     [CommonModule],
  templateUrl: './post-warning-banner.component.html',
  styleUrls:   ['./post-warning-banner.component.css'],
})
export class PostWarningBannerComponent implements OnChanges {

  @Input()  analysis!: PostAnalysis | null;
  @Input()  isAuthor  = false;
  @Output() acknowledged = new EventEmitter<void>();

  visible = false;

  ngOnChanges(changes: SimpleChanges): void {
    this.visible =
      !!this.analysis &&
      this.analysis.isHarmful === true &&
      this.isAuthor &&
      !this.analysis.authorAcknowledged;
  }

  dismiss(): void {
    this.visible = false;
    this.acknowledged.emit();
  }
}