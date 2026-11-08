import { AuthBackend } from '../../core/data/auth-backend';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CategoryBackend } from '../../core/data/category-backend';
import { ItemBackend } from '../../core/data/item-backend';
import { FakeItemBackend } from '../../core/data/item-backend.testing';
import { SessionState } from '../../core/state/session.state';
import type { Category } from '../../domain/category';
import { signedIn } from '../../domain/session';
import { categoryGuard } from './category.guard';
import { ItemsComponent } from './items.component';

class FakeBackend extends CategoryBackend {
  async remove(): Promise<void> {
    throw new Error('unused');
  }
  async update(): Promise<Category> {
    throw new Error('unused');
  }
  async list(): Promise<Category[]> {
    return [{ id: 'k1', name: 'Books', stateLabel: 'Done', reportable: false }];
  }
  async create(): Promise<Category> {
    throw new Error('unused');
  }
}

async function open(withPast = false) {
  const items = new FakeItemBackend();
  items.stored = [
    { id: 'a', categoryId: 'k1', title: 'Dune', done: false, priority: 'high', createdAt: 1 },
    { id: 'b', categoryId: 'k1', title: 'Emma', done: false, priority: 'medium', deadline: new Date(2030, 0, 5, 10, 0).getTime(), createdAt: 2 },
    { id: 'e', categoryId: 'k1', title: 'Zadie', done: false, priority: 'low', createdAt: 5 },
    { id: 'c', categoryId: 'k1', title: 'Dubliners', done: true, priority: 'medium', createdAt: 3 },
    { id: 'd', categoryId: 'k1', title: 'Ulysses', done: true, priority: 'medium', createdAt: 4 },
  ];
  if (withPast) {
    items.stored.push(
      { id: 'o', categoryId: 'k1', title: 'Late', done: false, priority: 'medium', deadline: new Date(2000, 0, 1).getTime(), createdAt: 6 },
      { id: 'p', categoryId: 'k1', title: 'Old done', done: true, priority: 'medium', deadline: new Date(2000, 0, 1).getTime(), createdAt: 7 },
    );
  }
  TestBed.configureTestingModule({
    providers: [{ provide: AuthBackend, useValue: { onChange: () => () => undefined, signIn: async () => 'u', signOut: async () => undefined } }, 
      provideRouter([{ path: 'c/:categoryId', component: ItemsComponent, canActivate: [categoryGuard] }]),
      { provide: CategoryBackend, useValue: new FakeBackend() },
      { provide: ItemBackend, useValue: items },
    ],
  });
  TestBed.inject(SessionState).session.set(signedIn('u1'));
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl('/c/k1', ItemsComponent);
  for (let i = 0; i < 5; i++) {
    await Promise.resolve();
  }
  harness.detectChanges();
  return { harness, el: harness.routeNativeElement as HTMLElement };
}

const titles = (el: HTMLElement) => [...el.querySelectorAll('.row-title')].map((e) => e.textContent);
const openSheet = (harness: { detectChanges(): void }, el: HTMLElement) => {
  el.querySelector<HTMLButtonElement>('.sort-button')!.click();
  harness.detectChanges();
};

describe('Items sort sheet', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to newest first with Done at the bottom', async () => {
    const { el } = await open();
    expect(titles(el)).toEqual(['Zadie', 'Emma', 'Dune', 'Ulysses', 'Dubliners']);
  });

  it('opens a dialog, sorts by priority, closes and remembers per uid and Category', async () => {
    const { harness, el } = await open();
    openSheet(harness, el);
    expect(el.querySelector('[role=dialog]')).not.toBeNull();
    const options = [...el.querySelectorAll<HTMLButtonElement>('.option')];
    expect(options.map((o) => o.textContent!.trim())).toEqual(['Newest first', 'Priority', 'Deadline']);
    options[1].click();
    harness.detectChanges();
    expect(el.querySelector('[role=dialog]')).toBeNull();
    expect(titles(el)).toEqual(['Dune', 'Emma', 'Zadie', 'Ulysses', 'Dubliners']);
    expect(localStorage.getItem('memoit.view.u1.k1.sort')).toBe('priority');
  });

  it('sorts by Deadline with Items that have none last', async () => {
    const { harness, el } = await open();
    openSheet(harness, el);
    [...el.querySelectorAll<HTMLButtonElement>('.option')][2].click();
    harness.detectChanges();
    expect(titles(el)).toEqual(['Emma', 'Zadie', 'Dune', 'Ulysses', 'Dubliners']);
    expect(localStorage.getItem('memoit.view.u1.k1.sort')).toBe('deadline');
  });

  it('shows the High chip and the local Deadline on rows', async () => {
    const { el } = await open();
    const chips = [...el.querySelectorAll('.row-chip')].map((c) => c.textContent!.trim());
    expect(chips[0]).toMatch(/Jan 5/);
    expect(chips).toContain('High');
  });

  it('flags only an open Item with a past Deadline as overdue', async () => {
    const { el } = await open(true);
    const flagged = [...el.querySelectorAll('.row-chip.overdue')];
    expect(flagged.length).toBe(1);
    expect(flagged[0].parentElement!.textContent).toContain('Overdue');
    expect(titles(el)).toContain('Old done');
    expect(titles(el)).toContain('Late');
  });

  it('restores the stored sort and keeps the order while filtering', async () => {
    localStorage.setItem('memoit.view.u1.k1.sort', 'priority');
    const { harness, el } = await open();
    expect(titles(el)[0]).toBe('Dune');
    const input = el.querySelector<HTMLInputElement>('.search input')!;
    input.value = 'e';
    input.dispatchEvent(new Event('input'));
    harness.detectChanges();
    expect(titles(el)).toEqual(['Dune', 'Emma', 'Zadie', 'Ulysses', 'Dubliners']);
  });

  it('closes the sheet on Escape', async () => {
    const { harness, el } = await open();
    openSheet(harness, el);
    el.querySelector('[role=dialog]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    harness.detectChanges();
    expect(el.querySelector('[role=dialog]')).toBeNull();
  });
});
