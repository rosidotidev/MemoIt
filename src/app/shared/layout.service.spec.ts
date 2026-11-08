import { TestBed } from '@angular/core/testing';
import { LayoutService, windowClassFor } from './layout.service';

describe('LayoutService', () => {
  const original = window.innerWidth;
  const setWidth = (w: number) => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: w });
  };
  afterEach(() => setWidth(original));

  it.each([
    [767, 'compact'],
    [768, 'medium'],
    [1199, 'medium'],
    [1200, 'expanded'],
  ])('classifies width %i as %s', (w, expected) => {
    expect(windowClassFor(w)).toBe(expected);
  });

  it('updates on resize', () => {
    setWidth(500);
    const layout = TestBed.inject(LayoutService);
    expect(layout.windowClass()).toBe('compact');
    setWidth(1300);
    window.dispatchEvent(new Event('resize'));
    expect(layout.windowClass()).toBe('expanded');
    setWidth(800);
    window.dispatchEvent(new Event('resize'));
    expect(layout.windowClass()).toBe('medium');
  });

  it('twoPane turns on from 1024 px', () => {
    setWidth(1023);
    const layout = TestBed.inject(LayoutService);
    expect(layout.twoPane()).toBe(false);
    setWidth(1024);
    window.dispatchEvent(new Event('resize'));
    expect(layout.twoPane()).toBe(true);
  });
});
