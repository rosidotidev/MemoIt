import {
  HOUR_MS,
  epochNow,
  formatDeadline,
  fromInputValue,
  isDueToday,
  isDueWithin,
  isOverdue,
  matchQuick,
  monthStart,
  quickDeadline,
  toInputValue,
  weekStart,
} from './time';

const at = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min).getTime();

describe('time', () => {
  const now = at(2026, 11, 7, 12, 0); // Saturday

  it('flags only open Items past their Deadline', () => {
    expect(isOverdue({ done: false, deadline: now - 1 }, now)).toBe(true);
    expect(isOverdue({ done: false, deadline: now }, now)).toBe(false);
    expect(isOverdue({ done: false, deadline: now + 1 }, now)).toBe(false);
    expect(isOverdue({ done: true, deadline: now - 1 }, now)).toBe(false);
    expect(isOverdue({ done: false }, now)).toBe(false);
  });

  it('detects the same local day, at its boundaries', () => {
    expect(isDueToday(at(2026, 11, 7, 0, 0), now)).toBe(true);
    expect(isDueToday(at(2026, 11, 7, 23, 59), now)).toBe(true);
    expect(isDueToday(at(2026, 11, 8, 0, 0), now)).toBe(false);
    expect(isDueToday(at(2026, 11, 6, 23, 59), now)).toBe(false);
  });

  it('checks a window from now, inclusive, never in the past', () => {
    expect(isDueWithin(now, now, HOUR_MS)).toBe(true);
    expect(isDueWithin(now + HOUR_MS, now, HOUR_MS)).toBe(true);
    expect(isDueWithin(now + HOUR_MS + 1, now, HOUR_MS)).toBe(false);
    expect(isDueWithin(now - 1, now, HOUR_MS)).toBe(false);
  });

  it('finds Monday as the week start and day 1 as the month start', () => {
    expect(weekStart(now)).toBe(at(2026, 11, 2));
    expect(weekStart(at(2026, 11, 2, 0, 0))).toBe(at(2026, 11, 2));
    expect(weekStart(at(2026, 11, 8, 23, 59))).toBe(at(2026, 11, 2));
    expect(monthStart(now)).toBe(at(2026, 11, 1));
  });

  it('builds quick Deadlines at the end of the day and recognises them', () => {
    expect(quickDeadline('today', now)).toBe(at(2026, 11, 7, 23, 59));
    expect(quickDeadline('tomorrow', now)).toBe(at(2026, 11, 8, 23, 59));
    expect(quickDeadline('nextWeek', now)).toBe(at(2026, 11, 14, 23, 59));
    expect(matchQuick(at(2026, 11, 8, 23, 59), now)).toBe('tomorrow');
    expect(matchQuick(at(2026, 11, 8, 10, 0), now)).toBeNull();
    expect(matchQuick(null, now)).toBeNull();
  });

  it('round-trips datetime-local values in local time', () => {
    const t = at(2026, 3, 5, 9, 7);
    expect(toInputValue(t)).toBe('2026-03-05T09:07');
    expect(fromInputValue('2026-03-05T09:07')).toBe(t);
    expect(fromInputValue('')).toBeNull();
    expect(fromInputValue('0000-01-01T00:00')).toBeNull();
    expect(fromInputValue('1969-12-31T00:00')).toBeNull();
    expect(fromInputValue('nonsense')).toBeNull();
  });

  it('formats in local time, adding the year only when it differs', () => {
    expect(formatDeadline(at(2026, 11, 8, 18, 30), now, 'en')).toMatch(/Nov 8/);
    expect(formatDeadline(at(2026, 11, 8, 18, 30), now, 'en')).not.toMatch(/2026/);
    expect(formatDeadline(at(2027, 1, 2, 9, 0), now, 'en')).toMatch(/2027/);
  });

  it('reads the real clock', () => {
    expect(Math.abs(epochNow() - Date.now())).toBeLessThan(1000);
  });
});
