import {
  Component, Input, Output, EventEmitter, OnChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostAnalysis } from '../../../../../core/models/post-analysis.model';

@Component({
  selector:    'app-post-blur-overlay',
  standalone:  true,
  imports:     [CommonModule],
  templateUrl: './post-blur-overlay.component.html',
  styleUrls:   ['./post-blur-overlay.component.css'],
})
export class PostBlurOverlayComponent implements OnChanges {

  @Input()  analysis!: PostAnalysis | null;
  @Output() revealed = new EventEmitter<void>();

  overlayVisible = true;

  ngOnChanges(): void {
    this.overlayVisible = true;
  }

  reveal(): void {
    this.overlayVisible = false;
    this.revealed.emit();
  }
}