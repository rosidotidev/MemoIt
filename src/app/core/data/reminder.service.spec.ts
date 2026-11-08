import { TestBed } from '@angular/core/testing';
import type { Item } from '../../domain/item';
import { signedIn, SIGNED_OUT_SESSION } from '../../domain/session';
import { ItemBackend } from './item-backend';
import { FakeItemBackend } from './item-backend.testing';
import { ItemStore } from './item.store';
import { ClockService } from '../state/clock.service';
import { ALERT_MS, ALERT_STORAGE_KEY, ReminderService } from './reminder.service';
import { SessionState } from '../state/session.state';

const NOW = 10_000_000;
const item = (id: string, deadline: number, done = false): Item => ({
  id,
  categoryId: 'c1',
  title: `T-${id}`,
  done,
  priority: 'medium',
  deadline,
  createdAt: 1,
});

describe('ReminderService', () => {
  let backend: FakeItemBackend;
  const flush = async () => {
    TestBed.tick();
    for (let i = 0; i < 20; i++) {
      await Promise.resolve();
      TestBed.tick();
    }
  };

  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    backend = new FakeItemBackend();
    TestBed.configureTestingModule({ providers: [{ provide: ItemBackend, useValue: backend }] });
  });
  afterEach(() => {
    vi.useRealTimers();
    sessionStorage.clear();
  });

  async function start(items: Item[]) {
    backend.stored = items;
    const service = TestBed.inject(ReminderService);
    TestBed.inject(SessionState).session.set(signedIn('u1'));
    await flush();
    return service;
  }

  it('raises one alert for an arrived Deadline and auto-dismisses after 8 s', async () => {
    const service = await start([item('a', NOW - 1000)]);
    expect(service.alert()).toEqual({ itemId: 'a', categoryId: 'c1', title: 'T-a' });
    vi.advanceTimersByTime(ALERT_MS);
    expect(service.alert()).toBeNull();
    TestBed.inject(ClockService).refresh();
    await flush();
    expect(service.alert()).toBeNull();
  });

  it('alerts when the Deadline arrives while the app is open', async () => {
    const service = await start([item('a', NOW + 20_000)]);
    expect(service.alert()).toBeNull();
    vi.setSystemTime(NOW + 30_000);
    TestBed.inject(ClockService).refresh();
    await flush();
    expect(service.alert()?.itemId).toBe('a');
  });

  it('does not alert for Done Items, old Deadlines or future Deadlines', async () => {
    const service = await start([item('a', NOW - 1000, true), item('b', NOW - 120_000), item('c', NOW + 5000)]);
    expect(service.alert()).toBeNull();
  });

  it('does not alert for an Item marked Done before its Deadline', async () => {
    const service = await start([item('a', NOW + 20_000)]);
    await TestBed.inject(ItemStore).toggleDone('a');
    vi.setSystemTime(NOW + 30_000);
    TestBed.inject(ClockService).refresh();
    await flush();
    expect(service.alert()).toBeNull();
  });

  it('remembers alerts in sessionStorage so a reload does not repeat them', async () => {
    const first = await start([item('a', NOW - 1000)]);
    expect(first.alert()).not.toBeNull();
    expect(JSON.parse(sessionStorage.getItem(ALERT_STORAGE_KEY)!)).toEqual(['a:' + (NOW - 1000)]);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: ItemBackend, useValue: backend }] });
    const second = await start([item('a', NOW - 1000)]);
    expect(second.alert()).toBeNull();
  });

  it('shows queued alerts one at a time', async () => {
    const service = await start([item('a', NOW - 2000), item('b', NOW - 1000)]);
    expect(service.alert()?.itemId).toBe('a');
    service.dismiss();
    expect(service.alert()?.itemId).toBe('b');
    service.dismiss();
    expect(service.alert()).toBeNull();
  });

  it('resets the memory and the banner on sign out', async () => {
    const service = await start([item('a', NOW - 1000)]);
    expect(service.alert()).not.toBeNull();
    TestBed.inject(SessionState).session.set(SIGNED_OUT_SESSION);
    await flush();
    expect(service.alert()).toBeNull();
    expect(sessionStorage.getItem(ALERT_STORAGE_KEY)).toBeNull();
  });
});
