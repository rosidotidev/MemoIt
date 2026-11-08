import type { Item } from './item';
import { MINUTE_MS } from './time';

/** Longest an arrived Deadline still raises an alert (the clock ticks every 30 s, NFR4). */
export const ALERT_WINDOW_MS = MINUTE_MS;

/** One alert per Item and Deadline. */
export function alertKey(item: Pick<Item, 'id' | 'deadline'>): string {
  return `${item.id}:${item.deadline ?? ''}`;
}

/** Open Items whose Deadline arrived within the last minute, oldest Deadline first. */
export function dueAlerts(items: readonly Item[], now: number): Item[] {
  return items
    .filter((i) => !i.done && i.deadline !== undefined && i.deadline <= now && i.deadline > now - ALERT_WINDOW_MS)
    .sort((a, b) => a.deadline! - b.deadline! || (a.id < b.id ? -1 : 1));
}
