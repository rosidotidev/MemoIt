import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import type { Item } from '../../domain/item';
import { alertKey, dueAlerts } from '../../domain/reminder';
import { ItemStore } from './item.store';
import { ClockService } from '../state/clock.service';
import { SessionScope } from '../state/session-scope';

export const ALERT_MS = 8000;
export const ALERT_STORAGE_KEY = 'memoit.alerted';

export interface DeadlineAlert {
  readonly itemId: string;
  readonly categoryId: string;
  readonly title: string;
}

/**
 * Derives the in-app Deadline alert from ItemStore and ClockService (AD-7). One alert per (itemId, deadline), kept in
 * sessionStorage so a reload does not repeat it; one banner at a time, auto-dismissed after 8 s. Nothing leaves the app.
 */
@Injectable({ providedIn: 'root' })
export class ReminderService {
  private readonly store = inject(ItemStore);
  private readonly clock = inject(ClockService);
  private readonly storage = this.pickStorage();
  private readonly seen = new Set<string>(this.load());
  private queue: Item[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly current = signal<DeadlineAlert | null>(null);
  readonly alert = this.current.asReadonly();

  constructor() {
    inject(SessionScope).registerReset(() => this.reset());
    effect(() => {
      if (this.store.status() !== 'ready') {
        return;
      }
      const due = dueAlerts(this.store.items(), this.clock.now());
      untracked(() => this.raise(due));
    });
  }

  dismiss(): void {
    this.clearTimer();
    this.current.set(null);
    this.showNext();
  }

  private raise(due: readonly Item[]): void {
    for (const item of due) {
      const key = alertKey(item);
      if (!this.seen.has(key)) {
        this.seen.add(key);
        this.queue.push(item);
      }
    }
    this.save();
    if (this.current() === null) {
      this.showNext();
    }
  }

  private showNext(): void {
    // An Item marked Done or deleted while it waited in the queue is skipped.
    const open = new Set(
      this.store
        .items()
        .filter((i) => !i.done)
        .map((i) => i.id),
    );
    let next = this.queue.shift();
    while (next && !open.has(next.id)) {
      next = this.queue.shift();
    }
    if (!next) {
      return;
    }
    this.current.set({ itemId: next.id, categoryId: next.categoryId, title: next.title });
    this.timer = setTimeout(() => this.dismiss(), ALERT_MS);
  }

  private reset(): void {
    this.clearTimer();
    this.queue = [];
    this.seen.clear();
    this.current.set(null);
    try {
      this.storage?.removeItem(ALERT_STORAGE_KEY);
    } catch {
      // storage unavailable: memory only
    }
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private pickStorage(): Storage | null {
    try {
      return inject(DOCUMENT).defaultView?.sessionStorage ?? null;
    } catch {
      return null;
    }
  }

  private load(): string[] {
    try {
      const raw = this.storage?.getItem(ALERT_STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === 'string') : [];
    } catch {
      return [];
    }
  }

  private save(): void {
    try {
      this.storage?.setItem(ALERT_STORAGE_KEY, JSON.stringify([...this.seen]));
    } catch {
      // storage unavailable: memory only
    }
  }
}
