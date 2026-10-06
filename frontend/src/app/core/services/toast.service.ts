// src/app/core/services/toast.service.ts
import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

export interface ConfirmDialog {
  message: string;
  type: 'confirm' | 'alert';
  onConfirm: () => void;
  onCancel?: () => void;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private _nextId = 0;

  private _confirmDialog = signal<ConfirmDialog | null>(null);
  readonly confirmDialog = this._confirmDialog.asReadonly();

  show(message: string, type: ToastType = 'info', duration = 3500): void {
    const id = ++this._nextId;
    this._toasts.update(t => [...t, { id, type, message, duration }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  success(message: string): void { this.show(message, 'success'); }
  error(message: string):   void { this.show(message, 'error', 5000); }
  info(message: string):    void { this.show(message, 'info'); }
  warning(message: string): void { this.show(message, 'warning'); }

  dismiss(id: number): void {
    this._toasts.update(t => t.filter(x => x.id !== id));
  }

  /** Shows OK + Cancel dialog */
  confirm(message: string, onConfirm: () => void, onCancel?: () => void): void {
    this._confirmDialog.set({ message, type: 'confirm', onConfirm, onCancel: onCancel ?? (() => {}) });
  }

  /** Shows OK-only dialog (replaces window.alert) */
  alert(message: string, onOk?: () => void): void {
    this._confirmDialog.set({ message, type: 'alert', onConfirm: onOk ?? (() => {}) });
  }

  resolveConfirm(confirmed: boolean): void {
    const dialog = this._confirmDialog();
    if (!dialog) return;
    this._confirmDialog.set(null);
    if (confirmed) dialog.onConfirm();
    else dialog.onCancel?.();
  }
}