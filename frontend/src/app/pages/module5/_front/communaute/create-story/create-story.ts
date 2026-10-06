// src/app/features/communaute/pages/create-story/create-story.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

import { StoryService } from '../../../../../core/services/story.service';
import { Story } from '../../../../../core/models/story.model';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-create-story',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './create-story.html',
  styleUrls: ['./create-story.css']
})
export class CreateStory implements OnInit {

  story: Partial<Story> = {
    type: 'TEXT',
    contenu: '',
    imageUrl: ''
  };

  previewImage: string | null = null;
  isSubmitting = false;
  selectedFile: File | null = null;

  selectedColor: string = '#ff4f75';
  colorOptions = [
    '#ff4f75', '#ff6b6b', '#4ecdc4', '#45b7d1',
    '#96ceb4', '#ffeaa7', '#dfe6e9', '#6c5ce7'
  ];

  constructor(
    private storyService: StoryService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {}

  selectType(type: 'TEXT' | 'PHOTO'): void {
    this.story.type = type;
    if (type === 'TEXT') {
      this.previewImage = null;
      this.selectedFile = null;
      this.story.imageUrl = '';
    } else {
      this.story.contenu = '';
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        this.toast.error('Image must not exceed 5MB');
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImage = e.target?.result as string;
        this.story.imageUrl = this.previewImage;
      };
      reader.readAsDataURL(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        this.toast.error('Image must not exceed 5MB');
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImage = e.target?.result as string;
        this.story.imageUrl = this.previewImage;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.previewImage = null;
    this.selectedFile = null;
    this.story.imageUrl = '';
  }

  selectColor(color: string): void {
    this.selectedColor = color;
  }

  publishStory(): void {
    if (this.story.type === 'TEXT' && !this.story.contenu?.trim()) {
      this.toast.error('Please write some text for your story');
      return;
    }
    if (this.story.type === 'PHOTO' && !this.previewImage) {
      this.toast.error('Please add a photo');
      return;
    }

    this.isSubmitting = true;

    const storyToSend: Story = {
      type: this.story.type!,
      contenu: this.story.contenu?.trim() || '',
      imageUrl: this.story.imageUrl || ''
    };

    console.log('📤 Sending story:', {
      type: storyToSend.type,
      contentLength: storyToSend.contenu?.length || 0,
      imageSize: storyToSend.imageUrl?.length || 0
    });

    this.storyService.create(storyToSend).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        console.log('✅ Story created:', response);
        this.toast.success('Story published successfully! It will expire in 1 minute.');
this.router.navigate(['/mother/communaute']);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('❌ Error creating story:', err);
        if (err.error?.error) {
  this.toast.error(err.error.error);
} else {
  this.toast.error('Error publishing the story');
}
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/mother/communaute']);
  }
}