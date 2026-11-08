import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FakeItemBackend } from '../../core/data/item-backend.testing';
import { ItemBackend } from '../../core/data/item-backend';
import { AuthBackend } from '../../core/data/auth-backend';
import { CategoryBackend } from '../../core/data/category-backend';
import { SessionState } from '../../core/state/session.state';
import type { Category, CategoryData } from '../../domain/category';
import { signedIn } from '../../domain/session';
import { CategoriesComponent } from './categories.component';

class FakeAuth extends AuthBackend {
  onChange() {
    return () => undefined;
  }
  signIn(): Promise<string> {
    return Promise.resolve('u1');
  }
  signOut(): Promise<void> {
    return Promise.resolve();
  }
}

class FakeBackend extends CategoryBackend {
  async remove(): Promise<void> {
    throw new Error('unused');
  }
  async update(): Promise<Category> {
    throw new Error('unused');
  }
  stored: Category[] = [];
  failList = false;
  gate: Promise<void> | null = null;
  async list(): Promise<Category[]> {
    if (this.gate) {
      await this.gate;
    }
    if (this.failList) {
      throw { code: 'unavailable' };
    }
    return [...this.stored];
  }
  async create(_uid: string, data: CategoryData): Promise<Category> {
    return { id: `id-${data.name}`, ...data };
  }
}

describe('CategoriesComponent', () => {
  let backend: FakeBackend;
  let fixture: ReturnType<typeof TestBed.createComponent<CategoriesComponent>>;
  let el: HTMLElement;

  const settle = async () => {
    for (let i = 0; i < 3; i++) {
      fixture.detectChanges();
      await fixture.whenStable();
    }
    fixture.detectChanges();
  };

  let itemBackend: FakeItemBackend | undefined;
  afterEach(() => (itemBackend = undefined));

  async function start(configure: (b: FakeBackend) => void = () => undefined) {
    backend = new FakeBackend();
    const items = (itemBackend ??= new FakeItemBackend());
    configure(backend);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthBackend, useClass: FakeAuth }, { provide: CategoryBackend, useValue: backend }, { provide: ItemBackend, useValue: items }],
    });
    TestBed.inject(SessionState).session.set(signedIn('u1'));
    fixture = TestBed.createComponent(CategoriesComponent);
    el = fixture.nativeElement as HTMLElement;
    await settle();
  }

  const cat = (name: string): Category => ({ id: name, name, stateLabel: 'Done', reportable: false });
  const cards = () => [...el.querySelectorAll('.card .name')].map((n) => n.textContent!.trim());
  const type = async (input: HTMLInputElement, value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await settle();
  };

  it('shows the empty state with a filled button and no FAB', async () => {
    await start();
    expect(el.textContent).toContain('Nothing here yet');
    expect(el.querySelector('.state .btn.filled')!.textContent).toContain('New category');
    expect(el.querySelector('.fab')).toBeNull();
  });

  it('shows skeleton rows while loading', async () => {
    await start((b) => (b.gate = new Promise<void>(() => undefined)));
    expect(el.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
  });

  it('shows an error with Retry that reloads', async () => {
    await start((b) => (b.failList = true));
    expect(el.textContent).toContain('Could not load your categories.');
    backend.failList = false;
    backend.stored = [cat('Books')];
    el.querySelector<HTMLButtonElement>('.state .btn')!.click();
    await settle();
    expect(cards()).toEqual(['Books']);
  });

  it('lists cards sorted by name with a FAB, and filters by search', async () => {
    await start((b) => (b.stored = [cat('Movies'), cat('Books'), cat('Boats')]));
    expect(cards()).toEqual(['Boats', 'Books', 'Movies']);
    expect(el.querySelector('.fab')).not.toBeNull();
    expect(el.querySelector('.card')!.getAttribute('href')).toBe('/c/Boats');
    expect(el.querySelector('[role=progressbar]')!.getAttribute('aria-valuenow')).toBe('0');
    await type(el.querySelector<HTMLInputElement>('.search input')!, 'BO');
    expect(cards()).toEqual(['Boats', 'Books']);
    await type(el.querySelector<HTMLInputElement>('.search input')!, 'zzz');
    expect(cards()).toEqual([]);
    expect(el.textContent).toContain('No category matches your search.');
  });

  it('creates a Category from the dialog and lists it', async () => {
    await start();
    el.querySelector<HTMLButtonElement>('.state .btn')!.click();
    await settle();
    const dialog = el.querySelector('memo-new-category-dialog')!;
    await type(dialog.querySelector<HTMLInputElement>('input')!, '  Books ');
    dialog.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await settle();
    expect(el.querySelector('memo-new-category-dialog')).toBeNull();
    expect(cards()).toEqual(['Books']);
  });

  it('shows real progress from the Items', async () => {
    itemBackend = new FakeItemBackend();
    itemBackend.stored = [
      { id: '1', categoryId: 'Books', title: 'a', done: true, priority: 'medium', createdAt: 1 },
      { id: '2', categoryId: 'Books', title: 'b', done: false, priority: 'medium', createdAt: 2 },
    ];
    await start((b) => (b.stored = [cat('Books'), cat('Films')]));
    const now = [...el.querySelectorAll('.bar')].map((b) => b.getAttribute('aria-valuenow'));
    expect(now).toEqual(['50', '0']);
  });

  it('shows the summary, the Due soon strip and open-count badges from the Items', async () => {
    const past = Date.now() - 3_600_000;
    const future = Date.now() + 3_600_000;
    itemBackend = new FakeItemBackend();
    itemBackend.stored = [
      { id: '1', categoryId: 'Books', title: 'late', done: false, priority: 'medium', createdAt: 1, deadline: past },
      { id: '2', categoryId: 'Books', title: 'soon', done: false, priority: 'medium', createdAt: 2, deadline: future },
      { id: '3', categoryId: 'Books', title: 'done', done: true, priority: 'medium', createdAt: 3, deadline: past },
    ];
    await start((b) => (b.stored = [cat('Books'), cat('Films')]));
    const stats = [...el.querySelectorAll('.stat-value')].map((n) => n.textContent!.trim());
    expect(stats.length).toBe(4);
    expect([stats[0], stats[1], stats[3]]).toEqual(['1', '2', '2']);
    const soon = [...el.querySelectorAll('.soon-title')].map((n) => n.textContent!.trim());
    expect(soon).toEqual(['late', 'soon']);
    expect(el.querySelector('.soon-card.is-overdue')!.textContent).toContain('Overdue');
    expect(el.querySelector('.soon-card')!.getAttribute('href')).toBe('/c/Books');
    expect([...el.querySelectorAll('.badge')].map((n) => n.textContent!.trim())).toEqual(['2']);
  });

  it('counts only Items of a loaded Category in the summary', async () => {
    itemBackend = new FakeItemBackend();
    itemBackend.stored = [
      { id: '1', categoryId: 'Books', title: 'a', done: false, priority: 'medium', createdAt: 1 },
      { id: '2', categoryId: 'gone', title: 'b', done: false, priority: 'medium', createdAt: 2, deadline: 1 },
    ];
    await start((b) => (b.stored = [cat('Books')]));
    const stats = [...el.querySelectorAll('.stat-value')].map((n) => n.textContent!.trim());
    expect([stats[0], stats[1]]).toEqual(['0', '1']);
  });

  it('hides the Due soon strip when no open Item has a Deadline', async () => {
    await start((b) => (b.stored = [cat('Books')]));
    expect(el.querySelector('.due-soon')).toBeNull();
    expect(el.querySelector('.badge')).toBeNull();
  });
});
