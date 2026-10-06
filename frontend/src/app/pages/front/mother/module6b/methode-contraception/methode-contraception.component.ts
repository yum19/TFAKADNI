import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import {
  ContraceptionChatMessageResponseDto,
  ContraceptionLogRequestDto,
  ContraceptionLogResponseDto,
  ContraceptionService
} from '../../../../../core/services/module6b/contraception.service';

export interface MethodStat {
  method: string;
  totalDays: number;
  startDate: string;
  endDate?: string;
  status: string;
  color: string;
}

@Component({
  selector: 'app-methode-contraception',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, RouterLink],
  templateUrl: './methode-contraception.component.html',
  styleUrls: ['./methode-contraception.component.css']
})
export class MethodeContraceptionComponent implements OnInit {
  loadingLogs = false;
  loadingActive = false;

  activeTab: 'tracking' | 'stats' = 'tracking';

  activeLog: ContraceptionLogResponseDto | null = null;
  logs: ContraceptionLogResponseDto[] = [];

  currentPage = 1;
  pageSize = 4;

  methodStats: MethodStat[] = [];
  totalDaysTracked = 0;
  totalChanges = 0;
  longestMethod: MethodStat | null = null;

  showAddMethodModal = false;
  showUpdateMethodModal = false;
  editingLogId: number | null = null;

  searchQuery = '';

  updateForm: ContraceptionLogRequestDto = {
    method: '',
    startDate: '',
    endDate: '',
    sideEffects: '',
    notes: ''
  };

  methodColors = [
    '#ff5f8f',
    '#9b7bd1',
    '#5bbfe8',
    '#f4a261',
    '#2ec4b6',
    '#e76f51',
    '#457b9d',
    '#f1c0e8'
  ];

  availableMethods = [
    'Pill',
    'IUD',
    'Implant',
    'Injection',
    'Condom',
    'Vaginal ring',
    'Contraceptive patch',
    'Natural method',
    'Hormonal IUD',
    'Copper IUD'
  ];

  logForm: ContraceptionLogRequestDto = {
    method: '',
    startDate: '',
    endDate: '',
    sideEffects: '',
    notes: ''
  };

  // CHATBOT
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
    this.loadLogs();
    this.loadActiveLog();
    this.loadChatHistory();
  }

  openUpdateMethodModal(log: ContraceptionLogResponseDto): void {
    this.editingLogId = log.id;
    this.updateForm = {
      method: log.method,
      startDate: log.startDate || '',
      endDate: log.endDate || '',
      sideEffects: log.sideEffects || '',
      notes: log.notes || '',
      status: log.status
    };
    this.showUpdateMethodModal = true;
  }

  closeUpdateMethodModal(): void {
    this.showUpdateMethodModal = false;
    this.editingLogId = null;
  }

  saveUpdate(): void {
    if (!this.editingLogId || !this.updateForm.method.trim()) return;

    this.loadingLogs = true;

    this.contraceptionService.updateLog(this.editingLogId, this.updateForm).subscribe({
      next: () => {
        this.closeUpdateMethodModal();
        this.loadLogs();
        this.loadActiveLog();
        this.loadingLogs = false;
      },
      error: (err) => {
        console.error('Update log error', err);
        this.loadingLogs = false;
      }
    });
  }

  onSearchChange(): void {
    this.currentPage = 1;
  }

  openAddMethodModal(): void {
    this.showAddMethodModal = true;
  }

  closeAddMethodModal(): void {
    this.showAddMethodModal = false;
  }

  resetForm(): void {
    this.logForm = {
      method: '',
      startDate: '',
      endDate: '',
      sideEffects: '',
      notes: ''
    };
  }

  createLog(): void {
    if (!this.logForm.method.trim()) return;

    this.loadingLogs = true;

    this.contraceptionService.createLog(this.logForm).subscribe({
      next: () => {
        this.resetForm();
        this.loadLogs();
        this.loadActiveLog();
        this.loadingLogs = false;
        this.closeAddMethodModal();
        this.activeTab = 'tracking';
      },
      error: (err) => {
        console.error('Create log error', err);
        this.loadingLogs = false;
      }
    });
  }

  loadLogs(): void {
    this.loadingLogs = true;

    this.contraceptionService.getLogsByMother().subscribe({
      next: (res) => {
        this.logs = res;
        this.currentPage = 1;
        this.computeStats();
        this.loadingLogs = false;
      },
      error: (err) => {
        console.error('Load logs error', err);
        this.loadingLogs = false;
      }
    });
  }

  loadActiveLog(): void {
    this.loadingActive = true;

    this.contraceptionService.getActiveLog().subscribe({
      next: (res) => {
        this.activeLog = res;
        this.loadingActive = false;
      },
      error: () => {
        this.activeLog = null;
        this.loadingActive = false;
      }
    });
  }

  stopCurrentLog(id: number): void {
    this.contraceptionService.stopLog(id).subscribe({
      next: () => {
        this.loadActiveLog();
        this.loadLogs();
      },
      error: (err) => console.error('Stop log error', err)
    });
  }

  deleteLog(id: number): void {
    this.contraceptionService.deleteLog(id).subscribe({
      next: () => {
        this.logs = this.logs.filter(log => log.id !== id);

        if (this.activeLog?.id === id) {
          this.activeLog = null;
        }

        this.computeStats();
        this.loadActiveLog();

        if (this.currentPage > this.totalPages) {
          this.currentPage = Math.max(1, this.totalPages);
        }
      },
      error: (err) => console.error('Delete log error', err)
    });
  }

  get filteredLogs(): ContraceptionLogResponseDto[] {
    if (!this.searchQuery.trim()) return this.logs;
    const q = this.searchQuery.toLowerCase().trim();
    return this.logs.filter(log =>
      this.getMethodLabel(log.method).toLowerCase().includes(q) ||
      log.method.toLowerCase().includes(q) ||
      (log.sideEffects || '').toLowerCase().includes(q) ||
      (log.notes || '').toLowerCase().includes(q) ||
      this.getStatusLabel(log.status).toLowerCase().includes(q)
    );
  }

  get pagedLogs(): ContraceptionLogResponseDto[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredLogs.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredLogs.length / this.pageSize));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  computeStats(): void {
    if (!this.logs.length) {
      this.methodStats = [];
      this.totalDaysTracked = 0;
      this.totalChanges = 0;
      this.longestMethod = null;
      return;
    }

    const methodMap = new Map<string, {
      totalDays: number;
      lastStart: string;
      lastEnd?: string;
      lastStatus: string;
    }>();

    this.logs.forEach(log => {
      const start = log.startDate ? new Date(log.startDate) : new Date();
      const end = log.endDate ? new Date(log.endDate) : new Date();

      const days = Math.max(
        1,
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      );

      if (methodMap.has(log.method)) {
        const existing = methodMap.get(log.method)!;
        existing.totalDays += days;
      } else {
        methodMap.set(log.method, {
          totalDays: days,
          lastStart: log.startDate || '',
          lastEnd: log.endDate,
          lastStatus: log.status
        });
      }
    });

    let colorIdx = 0;
    this.methodStats = Array.from(methodMap.entries()).map(([method, data]) => ({
      method,
      totalDays: data.totalDays,
      startDate: data.lastStart,
      endDate: data.lastEnd,
      status: data.lastStatus,
      color: this.methodColors[colorIdx++ % this.methodColors.length]
    }));

    this.totalDaysTracked = this.methodStats.reduce((sum, item) => sum + item.totalDays, 0);
    this.totalChanges = this.logs.filter(
      item => item.status === 'CHANGED' || item.status === 'STOPPED'
    ).length;

    this.longestMethod = this.methodStats.reduce((prev, current) =>
      prev.totalDays > current.totalDays ? prev : current
    );
  }

  getBarWidth(stat: MethodStat): string {
    if (!this.totalDaysTracked) return '0%';
    return `${Math.round((stat.totalDays / this.totalDaysTracked) * 100)}%`;
  }

  getBarPercent(stat: MethodStat): number {
    if (!this.totalDaysTracked) return 0;
    return Math.round((stat.totalDays / this.totalDaysTracked) * 100);
  }

  formatDate(date?: string): string {
    if (!date) return '—';

    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getStatusClass(status?: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'status-active';
      case 'STOPPED':
        return 'status-stopped';
      case 'CHANGED':
        return 'status-changed';
      default:
        return 'status-neutral';
    }
  }

  getStatusLabel(status?: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'Active';
      case 'STOPPED':
        return 'Stopped';
      case 'CHANGED':
        return 'Changed';
      default:
        return status || '—';
    }
  }

  getDurationLabel(days: number): string {
    if (days < 7) return `${days}d`;
    if (days < 30) return `${Math.round(days / 7)} wk`;
    return `${Math.round(days / 30)} mo`;
  }

  getMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      Pilule: 'Pill',
      DIU: 'IUD',
      Implant: 'Implant',
      Injection: 'Injection',
      Préservatif: 'Condom',
      'Anneau vaginal': 'Vaginal ring',
      'Patch contraceptif': 'Contraceptive patch',
      'Méthode naturelle': 'Natural method',
      'Stérilet hormonal': 'Hormonal IUD',
      'Stérilet cuivre': 'Copper IUD'
    };

    return labels[method] ?? method;
  }

  // CHATBOT METHODS
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
    if (message.role.toUpperCase() !== 'USER') return;
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
    const firstUserMessage = sessionMessages.find(m => m.role.toUpperCase() === 'USER');
    return firstUserMessage?.content || 'Previous conversation';
  }

  trackByMessageId(_: number, msg: ContraceptionChatMessageResponseDto): number {
    return msg.id;
  }

  formatDateTime(date?: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-US');
  }
}