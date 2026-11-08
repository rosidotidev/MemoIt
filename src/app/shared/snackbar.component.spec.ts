import { TestBed } from '@angular/core/testing';
import { SnackbarComponent } from './snackbar.component';
import { SnackbarService, SNACKBAR_MS } from './snackbar.service';

describe('Snackbar', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('shows one message at a time, replaces it and hides after 5 s', async () => {
    const fixture = TestBed.createComponent(SnackbarComponent);
    const service = TestBed.inject(SnackbarService);
    const el = fixture.nativeElement as HTMLElement;
    const flush = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
    };

    await flush();
    expect(el.querySelectorAll('[aria-live="polite"]').length).toBe(1);
    expect(el.querySelector('.snack')).toBeNull();

    service.show('A');
    await flush();
    expect(el.querySelectorAll('.snack').length).toBe(1);
    expect(el.textContent).toContain('A');

    vi.advanceTimersByTime(SNACKBAR_MS - 1000);
    service.show('B');
    await flush();
    expect(el.querySelectorAll('.snack').length).toBe(1);
    expect(el.textContent).toContain('B');
    expect(el.textContent).not.toContain('A');

    vi.advanceTimersByTime(SNACKBAR_MS - 1);
    await flush();
    expect(el.querySelector('.snack')).not.toBeNull();
    vi.advanceTimersByTime(1);
    await flush();
    expect(el.querySelector('.snack')).toBeNull();
    expect(el.querySelectorAll('[aria-live="polite"]').length).toBe(1);
  });

  it('shows an action, runs it once on click and closes', async () => {
    const fixture = TestBed.createComponent(SnackbarComponent);
    const service = TestBed.inject(SnackbarService);
    const el = fixture.nativeElement as HTMLElement;
    const run = vi.fn();
    service.show('Milk reopened', { label: 'Undo', run });
    fixture.detectChanges();
    await fixture.whenStable();
    const button = el.querySelector<HTMLButtonElement>('.snack button')!;
    expect(button.textContent).toContain('Undo');
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(run).toHaveBeenCalledTimes(1);
    expect(el.querySelector('.snack')).toBeNull();
    service.show('Plain');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(el.querySelector('.snack button')).toBeNull();
  });
});
