import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import {
  ContraceptionProfileRequestDto,
  ContraceptionProfileResponseDto,
  ContraceptionChatMessageResponseDto,
  ContraceptionService
} from '../../../../../core/services/module6b/contraception.service';

@Component({
  selector: 'app-recommandation-contraception',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, RouterLink],
  templateUrl: './recommandation-contraception.component.html',
  styleUrls: ['./recommandation-contraception.component.css']
})
export class RecommandationContraceptionComponent implements OnInit {
  // ── Recommendation part ──
  loadingRecommendation = false;
  recommendationResult: ContraceptionProfileResponseDto | null = null;
  recommendationHistory: ContraceptionProfileResponseDto[] = [];

  profileForm: ContraceptionProfileRequestDto = {
    age: '',
    isBreastfeeding: false,
    medicalHistory: '',
    preference: ''
  };

  breastfeedingFilter: boolean | null = null;

  readonly PAGE_SIZE = 3;
  currentPage = 0;

  deleteConfirmOpen = false;
  pendingDeleteId: number | null = null;

  // ── Chatbot part ──
  loadingChat = false;
  allChatHistory: ContraceptionChatMessageResponseDto[] = [];
  chatMessages: ContraceptionChatMessageResponseDto[] = [];
  currentSessionId = '';
  chatInput = '';

  showChatWidget = false;
  showSessionChoice = true;

  editingMessageId: number | null = null;
  editingText = '';

  constructor(private contraceptionService: ContraceptionService) {}

  ngOnInit(): void {
    this.loadRecommendations();
    this.loadChatHistory();
  }

  // ════════════════════════════
  // RECOMMENDATION
  // ════════════════════════════

  submitRecommendation(): void {
    if (!this.profileForm.age?.trim()) return;

    this.loadingRecommendation = true;
    this.contraceptionService.recommendMethod(this.profileForm).subscribe({
      next: (res) => {
        this.recommendationResult = res;
        this.loadRecommendations();
        this.loadingRecommendation = false;
      },
      error: (err) => {
        console.error('AI recommendation error', err);
        this.loadingRecommendation = false;
      }
    });
  }

  loadRecommendations(): void {
    this.contraceptionService.getRecommendations().subscribe({
      next: (res) => {
        this.recommendationHistory = res;
        this.currentPage = 0;
      },
      error: (err) => console.error('Recommendation history error', err)
    });
  }

  // ════════════════════════════
  // FILTER
  // ════════════════════════════

  setFilter(value: boolean | null): void {
    this.breastfeedingFilter = value;
    this.currentPage = 0;
  }

  get filteredHistory(): ContraceptionProfileResponseDto[] {
    if (this.breastfeedingFilter === null) return this.recommendationHistory;
    return this.recommendationHistory.filter(
      item => item.isBreastfeeding === this.breastfeedingFilter
    );
  }

  // ════════════════════════════
  // PAGINATION
  // ════════════════════════════

  get totalPages(): number {
    return Math.ceil(this.filteredHistory.length / this.PAGE_SIZE);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  get pagedHistory(): ContraceptionProfileResponseDto[] {
    const start = this.currentPage * this.PAGE_SIZE;
    return this.filteredHistory.slice(start, start + this.PAGE_SIZE);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
  }

  // ════════════════════════════
  // DELETE RECOMMENDATION
  // ════════════════════════════

  confirmDelete(id: number): void {
    this.pendingDeleteId = id;
    this.deleteConfirmOpen = true;
  }

  cancelDelete(): void {
    this.deleteConfirmOpen = false;
    this.pendingDeleteId = null;
  }

  executeDelete(): void {
    if (this.pendingDeleteId === null) return;

    this.contraceptionService.deleteRecommendation(this.pendingDeleteId).subscribe({
      next: () => {
        this.recommendationHistory = this.recommendationHistory.filter(
          r => r.id !== this.pendingDeleteId
        );

        if (this.recommendationResult?.id === this.pendingDeleteId) {
          this.recommendationResult = null;
        }

        if (this.currentPage >= this.totalPages && this.currentPage > 0) {
          this.currentPage--;
        }

        this.cancelDelete();
      },
      error: (err) => {
        console.error('Delete error', err);
        this.cancelDelete();
      }
    });
  }

  // ════════════════════════════
  // CHATBOT
  // ════════════════════════════

  get groupedSessions(): string[] {
    const ids = this.allChatHistory
      .map(message => message.sessionId)
      .filter((id): id is string => !!id);

    return [...new Set(ids)].reverse();
  }

  openChatWidget(): void {
    this.showChatWidget = true;
    this.showSessionChoice = true;
  }

  closeChatWidget(): void {
    this.showChatWidget = false;
    this.cancelEdit();
  }

  chooseNewSession(): void {
    this.currentSessionId = '';
    this.chatMessages = [];
    this.chatInput = '';
    this.showSessionChoice = false;
    this.cancelEdit();
  }

  chooseExistingSession(sessionId: string): void {
    this.currentSessionId = sessionId;
    this.showSessionChoice = false;
    this.cancelEdit();
    this.loadChatSession(sessionId);
  }

  backToSessionChoice(): void {
    this.showSessionChoice = true;
    this.cancelEdit();
  }

  sendMessage(): void {
    const message = this.chatInput.trim();
    if (!message || this.loadingChat) return;

    this.loadingChat = true;

    const draftMessage: ContraceptionChatMessageResponseDto = {
      id: Date.now(),
      motherId: 0,
      role: 'USER',
      content: message,
      sessionId: this.currentSessionId || 'pending',
      createdAt: new Date().toISOString()
    };

    this.chatMessages = [...this.chatMessages, draftMessage];
    this.chatInput = '';

    this.contraceptionService.sendChatMessage({
      message,
      sessionId: this.currentSessionId || undefined
    }).subscribe({
      next: (response) => {
        this.currentSessionId = response.sessionId;
        this.showSessionChoice = false;
        this.loadChatSession(response.sessionId);
        this.loadChatHistory();
        this.loadingChat = false;
      },
      error: (err) => {
        console.error('Chat error', err);
        this.chatMessages = this.chatMessages.filter(m => m.id !== draftMessage.id);
        this.loadingChat = false;
      }
    });
  }

  loadChatHistory(): void {
    this.contraceptionService.getChatHistory().subscribe({
      next: (res) => {
        this.allChatHistory = res;
      },
      error: (err) => console.error('Chat history error', err)
    });
  }

  loadChatSession(sessionId: string): void {
    this.currentSessionId = sessionId;
    this.contraceptionService.getChatSession(sessionId).subscribe({
      next: (res) => {
        this.chatMessages = res;
      },
      error: (err) => console.error('Chat session error', err)
    });
  }

  deleteMessage(messageId: number): void {
    this.contraceptionService.deleteChatMessage(messageId).subscribe({
      next: () => {
        this.chatMessages = this.chatMessages.filter(msg => msg.id !== messageId);
        this.allChatHistory = this.allChatHistory.filter(msg => msg.id !== messageId);

        const stillHasMessages = this.chatMessages.some(
          msg => msg.sessionId === this.currentSessionId
        );

        if (!stillHasMessages) {
          this.showSessionChoice = true;
          this.currentSessionId = '';
        }
      },
      error: (err) => console.error('Delete message error', err)
    });
  }

  deleteSession(sessionId: string): void {
    const sessionMessages = this.allChatHistory.filter(msg => msg.sessionId === sessionId);
    if (!sessionMessages.length) return;

    sessionMessages.forEach(msg => {
      this.contraceptionService.deleteChatMessage(msg.id).subscribe({
        error: (err) => console.error('Delete session message error', err)
      });
    });

    this.allChatHistory = this.allChatHistory.filter(msg => msg.sessionId !== sessionId);

    if (this.currentSessionId === sessionId) {
      this.currentSessionId = '';
      this.chatMessages = [];
      this.showSessionChoice = true;
      this.cancelEdit();
    }
  }

  startEdit(message: ContraceptionChatMessageResponseDto): void {
    if (message.role?.toUpperCase() !== 'USER') return;
    this.editingMessageId = message.id;
    this.editingText = message.content;
  }

  cancelEdit(): void {
    this.editingMessageId = null;
    this.editingText = '';
  }

  saveEdit(message: ContraceptionChatMessageResponseDto): void {
    const updatedText = this.editingText.trim();
    if (!updatedText || this.loadingChat) return;

    this.loadingChat = true;

    const editedIndex = this.chatMessages.findIndex(m => m.id === message.id);

    if (editedIndex === -1) {
      this.loadingChat = false;
      this.cancelEdit();
      return;
    }

    const messagesToDelete = this.chatMessages.slice(editedIndex);

    messagesToDelete.forEach(msg => {
      this.contraceptionService.deleteChatMessage(msg.id).subscribe({
        error: (err) => console.error('Delete following message error', err)
      });
    });

    this.chatMessages = this.chatMessages.slice(0, editedIndex);
    this.allChatHistory = this.allChatHistory.filter(msg => {
      if (msg.sessionId !== this.currentSessionId) return true;
      return !messagesToDelete.some(deleted => deleted.id === msg.id);
    });

    this.cancelEdit();

    this.contraceptionService.sendChatMessage({
      message: updatedText,
      sessionId: this.currentSessionId
    }).subscribe({
      next: () => {
        this.loadChatSession(this.currentSessionId);
        this.loadChatHistory();
        this.loadingChat = false;
      },
      error: (err) => {
        console.error('Regenerate AI response error', err);
        this.loadingChat = false;
      }
    });
  }

  getSessionPreview(sessionId: string): string {
    const sessionMessages = this.allChatHistory.filter(m => m.sessionId === sessionId);
    const firstUserMessage = sessionMessages.find(m => m.role?.toUpperCase() === 'USER');
    return firstUserMessage?.content || 'Previous conversation';
  }

  trackByMessageId(_: number, msg: ContraceptionChatMessageResponseDto): number {
    return msg.id;
  }

  // ════════════════════════════
  // UTILS
  // ════════════════════════════

  formatDateTime(date?: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-US');
  }
}