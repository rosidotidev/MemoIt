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
    return [
      { id: 'k1', name: 'Books', stateLabel: 'Done', reportable: false },
      { id: 'k2', name: 'Films', stateLabel: 'Done', reportable: false },
    ];
  }
  async create(): Promise<Category> {
    throw new Error('unused');
  }
}

async function open() {
  const items = new FakeItemBackend();
  items.stored = [
    { id: 'a', categoryId: 'k1', title: 'Dune', done: false, priority: 'high', createdAt: 1 },
    { id: 'b', categoryId: 'k1', title: 'Emma', done: false, priority: 'medium', createdAt: 2 },
    { id: 'c', categoryId: 'k1', title: 'Dubliners', done: true, priority: 'medium', createdAt: 3 },
    { id: 'd', categoryId: 'k1', title: 'Ulysses', done: true, priority: 'medium', createdAt: 4 },
    { id: 'e', categoryId: 'k2', title: 'Alien', done: false, priority: 'medium', createdAt: 5 },
  ];
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

describe('Items search and chips', () => {
  beforeEach(() => localStorage.clear());

  it('filters Open and Done as the User types', async () => {
    const { harness, el } = await open();
    const input = el.querySelector<HTMLInputElement>('.search input')!;
    input.value = 'du';
    input.dispatchEvent(new Event('input'));
    harness.detectChanges();
    expect(titles(el)).toEqual(['Dune', 'Dubliners']);
  });

  it('keeps exactly one chip active, filters Done too, and stores the choice per uid and Category', async () => {
    const { harness, el } = await open();
    const chips = () => [...el.querySelectorAll<HTMLButtonElement>('.fchip')];
    expect(chips().map((c) => c.textContent!.trim())).toEqual(['All', 'Overdue', 'High priority', 'Has deadline']);
    expect(chips().filter((c) => c.getAttribute('aria-pressed') === 'true').length).toBe(1);
    chips()[2].click();
    harness.detectChanges();
    expect(titles(el)).toEqual(['Dune']);
    expect(chips().filter((c) => c.getAttribute('aria-pressed') === 'true').map((c) => c.textContent!.trim())).toEqual([
      'High priority',
    ]);
    expect(localStorage.getItem('memoit.view.u1.k1.filter')).toBe('high');
  });

  it('clears the search text when the Category changes in the same component', async () => {
    const { harness, el } = await open();
    const input = el.querySelector<HTMLInputElement>('.search input')!;
    input.value = 'du';
    input.dispatchEvent(new Event('input'));
    harness.detectChanges();
    const first = harness.routeNativeElement;
    await harness.navigateByUrl('/c/k2', ItemsComponent);
    harness.detectChanges();
    harness.detectChanges();
    expect(harness.routeNativeElement).toBe(first);
    expect((harness.routeNativeElement as HTMLElement).querySelector<HTMLInputElement>('.search input')!.value).toBe('');
  });

  it('falls back to All when the stored chip no longer exists', async () => {
    localStorage.setItem('memoit.view.u1.k1.filter', 'gone');
    const { el } = await open();
    expect(titles(el).length).toBeGreaterThan(0);
    expect(el.querySelector('.fchip[aria-pressed="true"]')!.textContent).toContain('All');
  });
});
