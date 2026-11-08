import { AuthBackend } from '../core/data/auth-backend';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { ItemFormComponent } from './item-form.component';

describe('ItemFormComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthBackend, useValue: { onChange: () => () => undefined, signIn: async () => 'u', signOut: async () => undefined } },
      ],
    });
  });

  function create(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(ItemFormComponent);
    for (const [k, v] of Object.entries(inputs)) {
      fixture.componentRef.setInput(k, v);
    }
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('previews the trimmed title and description', () => {
    const { el } = create({ title: '  Milk ', description: ' 2 litres ' });
    expect(el.querySelector('.preview-title')!.textContent).toBe('Milk');
    expect(el.querySelector('.preview-description')!.textContent).toBe('2 litres');
  });

  it('emits Priority and Deadline choices and marks the active ones', () => {
    const at = new Date(2026, 5, 1, 9, 30).getTime();
    const { fixture, el } = create({ title: 'x', priority: 'high', deadline: at });
    const c = fixture.componentInstance;
    const priorities: string[] = [];
    const deadlines: (number | null)[] = [];
    c.priorityChange.subscribe((v) => priorities.push(v));
    c.deadlineChange.subscribe((v) => deadlines.push(v));
    const tiles = [...el.querySelectorAll<HTMLButtonElement>('.tile, .fchip')];
    const byText = (t: string) => tiles.find((b) => b.textContent!.trim() === t)!;
    expect(byText('High').getAttribute('aria-pressed')).toBe('true');
    expect(byText('Low').getAttribute('aria-pressed')).toBe('false');
    expect(byText('No deadline').getAttribute('aria-pressed')).toBe('false');
    byText('Low').click();
    byText('Tomorrow').click();
    byText('No deadline').click();
    const date = el.querySelector<HTMLInputElement>('#item-deadline-date')!;
    const time = el.querySelector<HTMLInputElement>('#item-deadline-time')!;
    expect(date.value).toBe('2026-06-01');
    expect(time.value).toBe('09:30');
    date.value = '2026-07-02';
    date.dispatchEvent(new Event('change'));
    time.value = '10:15';
    time.dispatchEvent(new Event('change'));
    date.value = '';
    date.dispatchEvent(new Event('change'));
    expect(priorities).toEqual(['low']);
    expect(deadlines[0]).toBeGreaterThan(Date.now());
    expect(deadlines.slice(1)).toEqual([null, new Date(2026, 6, 2, 9, 30).getTime(), new Date(2026, 5, 1, 10, 15).getTime(), null]);
  });

  it('previews the High chip and the Deadline live', () => {
    const { el } = create({ title: 'x', priority: 'high', deadline: new Date(2026, 5, 1, 9, 30).getTime() });
    const chips = [...el.querySelectorAll('.preview-chip')].map((c) => c.textContent!.trim());
    expect(chips[1]).toBe('High');
    expect(chips[0]).toMatch(/Jun 1/);
  });

  it('shows a placeholder preview while the title is blank', () => {
    const { el } = create({ title: '  ' });
    expect(el.querySelector('.preview-empty')).not.toBeNull();
  });

  it('emits typed values and the save and cancel events', () => {
    const { fixture, el } = create();
    const c = fixture.componentInstance;
    const titles: string[] = [];
    const descriptions: string[] = [];
    let saved = 0;
    let cancelled = 0;
    c.titleChange.subscribe((v) => titles.push(v));
    c.descriptionChange.subscribe((v) => descriptions.push(v));
    c.saved.subscribe(() => saved++);
    c.cancelled.subscribe(() => cancelled++);
    const t = el.querySelector<HTMLInputElement>('#item-title')!;
    t.value = 'Milk';
    t.dispatchEvent(new Event('input'));
    const d = el.querySelector<HTMLTextAreaElement>('#item-description')!;
    d.value = 'x';
    d.dispatchEvent(new Event('input'));
    el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    el.querySelector<HTMLButtonElement>('.appbar .icon-btn')!.click();
    expect(titles).toEqual(['Milk']);
    expect(descriptions).toEqual(['x']);
    expect(saved).toBe(1);
    expect(cancelled).toBe(1);
  });

  it('routes errors to the field or the form, and does not save while busy', () => {
    const a = create({ error: 'empty' });
    expect(a.el.querySelector('#item-title-error')!.textContent).toContain('Enter a title');
    expect(a.el.querySelector('.form-error')!.textContent!.trim()).toBe('');
    const b = create({ error: 'network', busy: true });
    expect(b.el.querySelector('.form-error')!.textContent).toContain('No connection');
    let saved = 0;
    b.fixture.componentInstance.saved.subscribe(() => saved++);
    b.el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(saved).toBe(0);
  });
});
