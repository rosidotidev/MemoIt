import { TestBed } from '@angular/core/testing';
import { CLOCK_TICK_MS, ClockService } from './clock.service';

describe('ClockService', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('refreshes now every 30 seconds', () => {
    vi.setSystemTime(new Date(2026, 10, 7, 12, 0, 0));
    const clock = TestBed.inject(ClockService);
    const first = clock.now();
    vi.advanceTimersByTime(CLOCK_TICK_MS);
    expect(clock.now()).toBe(first + CLOCK_TICK_MS);
  });

  it('refreshes when the tab becomes visible', () => {
    vi.setSystemTime(new Date(2026, 10, 7, 12, 0, 0));
    const clock = TestBed.inject(ClockService);
    const first = clock.now();
    vi.setSystemTime(first + 5000);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(clock.now()).toBe(first + 5000);
  });
});
