import { AuthBackend } from '../../core/data/auth-backend';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { FakeItemBackend } from '../../core/data/item-backend.testing';
import { ItemBackend } from '../../core/data/item-backend';
import { CategoryBackend } from '../../core/data/category-backend';
import { SessionState } from '../../core/state/session.state';
import type { Category } from '../../domain/category';
import { ItemBackendError } from '../../core/data/item-backend';
import { SnackbarService } from '../../shared/snackbar.service';
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

describe('ItemsComponent', () => {
  const originalWidth = window.innerWidth;
  const setWidth = (w: number) => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: w });
  };
  beforeEach(() => setWidth(500));
  afterEach(() => setWidth(originalWidth));

  it('two-pane: at 1024 px lists the Categories beside the Items and hides the back arrow', async () => {
    setWidth(1024);
    TestBed.configureTestingModule({
      providers: [{ provide: AuthBackend, useValue: { onChange: () => () => undefined, signIn: async () => 'u', signOut: async () => undefined } }, 
        provideRouter([{ path: 'c/:categoryId', component: ItemsComponent, canActivate: [categoryGuard] }]),
        { provide: CategoryBackend, useValue: new FakeBackend() }, { provide: ItemBackend, useValue: new FakeItemBackend() },
      ],
    });
    TestBed.inject(SessionState).session.set(signedIn('u1'));
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/c/k1', ItemsComponent);
    harness.detectChanges();
    const el = harness.routeNativeElement as HTMLElement;
    expect(el.querySelector('.back')).toBeNull();
    const link = el.querySelector('.pane-link')!;
    expect(link.getAttribute('href')).toBe('/c/k1');
    expect(link.getAttribute('aria-current')).toBe('page');
    expect(el.querySelector('h1')!.textContent).toContain('Books');
  });

  it('single column below 1024 px: no Category pane and the back arrow is shown', async () => {
    setWidth(1023);
    TestBed.configureTestingModule({
      providers: [{ provide: AuthBackend, useValue: { onChange: () => () => undefined, signIn: async () => 'u', signOut: async () => undefined } }, 
        provideRouter([{ path: 'c/:categoryId', component: ItemsComponent, canActivate: [categoryGuard] }]),
        { provide: CategoryBackend, useValue: new FakeBackend() }, { provide: ItemBackend, useValue: new FakeItemBackend() },
      ],
    });
    TestBed.inject(SessionState).session.set(signedIn('u1'));
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/c/k1', ItemsComponent);
    harness.detectChanges();
    const el = harness.routeNativeElement as HTMLElement;
    expect(el.querySelector('.pane')).toBeNull();
    expect(el.querySelector('.back')).not.toBeNull();
  });

  it('shows the name, a back link and the empty-category text', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthBackend, useValue: { onChange: () => () => undefined, signIn: async () => 'u', signOut: async () => undefined } }, 
        provideRouter([{ path: 'c/:categoryId', component: ItemsComponent, canActivate: [categoryGuard] }]),
        { provide: CategoryBackend, useValue: new FakeBackend() }, { provide: ItemBackend, useValue: new FakeItemBackend() },
      ],
    });
    TestBed.inject(SessionState).session.set(signedIn('u1'));
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/c/k1', ItemsComponent);
    harness.detectChanges();
    const el = harness.routeNativeElement as HTMLElement;
    expect(el.querySelector('h1')!.textContent).toContain('Books');
    expect(el.querySelector('.back')!.getAttribute('href')).toBe('/categories');
    expect(el.textContent).toContain('No items yet');
  });

  it('opens a menu with one item leading to the settings', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthBackend, useValue: { onChange: () => () => undefined, signIn: async () => 'u', signOut: async () => undefined } }, 
        provideRouter([{ path: 'c/:categoryId', component: ItemsComponent, canActivate: [categoryGuard] }]),
        { provide: CategoryBackend, useValue: new FakeBackend() }, { provide: ItemBackend, useValue: new FakeItemBackend() },
      ],
    });
    TestBed.inject(SessionState).session.set(signedIn('u1'));
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/c/k1', ItemsComponent);
    const el = harness.routeNativeElement as HTMLElement;
    expect(el.querySelector('.menu')).toBeNull();
    el.querySelector<HTMLButtonElement>('.menu-button')!.click();
    harness.detectChanges();
    const entries = el.querySelectorAll('.menu .entry');
    expect(entries.length).toBe(1);
    expect(entries[0].getAttribute('href')).toBe('/c/k1/settings');
    expect(entries[0].textContent).toContain('Category settings');
  });

  it('closes the menu on Escape and on an outside click', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthBackend, useValue: { onChange: () => () => undefined, signIn: async () => 'u', signOut: async () => undefined } }, 
        provideRouter([{ path: 'c/:categoryId', component: ItemsComponent, canActivate: [categoryGuard] }]),
        { provide: CategoryBackend, useValue: new FakeBackend() }, { provide: ItemBackend, useValue: new FakeItemBackend() },
      ],
    });
    TestBed.inject(SessionState).session.set(signedIn('u1'));
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/c/k1', ItemsComponent);
    const el = harness.routeNativeElement as HTMLElement;
    const open = () => {
      el.querySelector<HTMLButtonElement>('.menu-button')!.click();
      harness.detectChanges();
    };
    open();
    expect(el.querySelector('.menu')).not.toBeNull();
    el.querySelector('.menu')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    harness.detectChanges();
    expect(el.querySelector('.menu')).toBeNull();
    open();
    document.body.click();
    harness.detectChanges();
    expect(el.querySelector('.menu')).toBeNull();
  });

  it('shows the head card ring, Open and Done sections and an Add item FAB', async () => {
    const items = new FakeItemBackend();
    items.stored = [
      { id: 'a', categoryId: 'k1', title: 'Older', done: false, priority: 'medium', createdAt: 1 },
      { id: 'b', categoryId: 'k1', title: 'Newer', done: false, priority: 'medium', createdAt: 2 },
      { id: 'c', categoryId: 'k1', title: 'Finished', done: true, priority: 'medium', createdAt: 3 },
      { id: 'd', categoryId: 'k1', title: 'Finished too', done: true, priority: 'medium', createdAt: 4 },
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
    const el = harness.routeNativeElement as HTMLElement;
    expect(el.querySelector('.ring')!.getAttribute('aria-valuenow')).toBe('50');
    expect(el.querySelector('.head-sub')!.textContent!.trim()).toBe('2 open · 2 done · 4 in total');
    expect(el.querySelector('#open-title')!.textContent!.replace(/\s+/g, ' ').trim()).toBe('Open 2');
    expect(el.querySelector('#done-title')!.textContent!.replace(/\s+/g, ' ').trim()).toBe('Done 2');
    const open = [...el.querySelectorAll('#open-title ~ .list .row-title')].map((e) => e.textContent);
    expect(open).toEqual(['Newer', 'Older']);
    expect(el.querySelectorAll('#done-title ~ .list .row').length).toBe(2);
    expect(el.querySelector('.fab')!.getAttribute('href')).toBe('/c/k1/i/new');
    const edits = [...el.querySelectorAll('a.edit')];
    expect(edits.length).toBe(4);
    expect(edits[0].getAttribute('href')).toBe('/c/k1/i/b');
    expect(edits[0].getAttribute('aria-label')).toBe('Edit item: Newer');
    expect(el.querySelectorAll('.row a').length).toBe(4);
    expect(el.textContent).not.toContain('No items yet');
  });

  it('shows skeleton rows while the Items are pending', async () => {
    const items = new FakeItemBackend();
    items.list = () => new Promise(() => undefined);
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
    harness.detectChanges();
    const el = harness.routeNativeElement as HTMLElement;
    expect(el.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
    expect(el.querySelector('.head-card')).toBeNull();
  });

  it('shows skeleton rows while the Items load and a retry on error', async () => {
    const items = new FakeItemBackend();
    items.listError = new Error('boom');
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
    const el = harness.routeNativeElement as HTMLElement;
    expect(el.querySelector('[role=alert] button')).not.toBeNull();
    items.listError = null;
    el.querySelector<HTMLButtonElement>('[role=alert] button')!.click();
    for (let i = 0; i < 5; i++) {
      await Promise.resolve();
    }
    harness.detectChanges();
    expect(el.querySelector('[role=alert]')).toBeNull();
    expect(el.textContent).toContain('No items yet');
    expect(el.querySelector('.state a.btn')!.getAttribute('href')).toBe('/c/k1/i/new');
  });

  describe('Done toggle', () => {
    async function setup(setDoneError: unknown = null) {
      const items = new FakeItemBackend();
      items.stored = [
        { id: 'a', categoryId: 'k1', title: 'Milk', done: false, priority: 'medium', createdAt: 1 },
        { id: 'b', categoryId: 'k1', title: 'Eggs', done: true, priority: 'medium', createdAt: 2 },
      ];
      items.setDoneError = setDoneError;
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
      const settle = async () => {
        for (let i = 0; i < 8; i++) {
          await Promise.resolve();
        }
        harness.detectChanges();
      };
      await settle();
      return { items, harness, settle, el: harness.routeNativeElement as HTMLElement, snack: TestBed.inject(SnackbarService) };
    }
    const titles = (el: HTMLElement, section: string) =>
      [...el.querySelectorAll(section + ' ~ .list .row-title')].map((e) => e.textContent);

    it('exposes aria-pressed, moves the row to Done with a snackbar and Undo', async () => {
      const { items, el, settle, snack } = await setup();
      const rows = [...el.querySelectorAll<HTMLButtonElement>('button.toggle')];
      expect(rows.map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'true']);
      rows[0].click();
      await settle();
      expect(titles(el, '#open-title')).toEqual([]);
      expect(titles(el, '#done-title').sort()).toEqual(['Eggs', 'Milk']);
      expect(el.querySelector('.ring')!.getAttribute('aria-valuenow')).toBe('100');
      expect(snack.message()).toBe('Milk marked Done');
      expect(snack.action()!.label).toBe('Undo');
      expect(items.doneWrites).toEqual([{ id: 'a', done: true }]);

      snack.runAction();
      await settle();
      expect(titles(el, '#open-title')).toEqual(['Milk']);
      expect(items.doneWrites[1]).toEqual({ id: 'a', done: false });
    });

    it('reopens a Done row with a reopened message', async () => {
      const { el, settle, snack } = await setup();
      el.querySelectorAll<HTMLButtonElement>('button.toggle')[1].click();
      await settle();
      expect(snack.message()).toBe('Eggs reopened');
      expect(titles(el, '#open-title').sort()).toEqual(['Eggs', 'Milk']);
    });

    it('rolls back and shows an error without Undo when the write fails', async () => {
      const { el, settle, snack } = await setup(new ItemBackendError('network'));
      el.querySelectorAll<HTMLButtonElement>('button.toggle')[0].click();
      await settle();
      expect(titles(el, '#open-title')).toEqual(['Milk']);
      expect(snack.message()).toContain('Could not update');
      expect(snack.action()).toBeNull();
    });
  });
});
