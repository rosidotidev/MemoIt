import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from '../app';
import { PreferencesBackend } from '../core/data/preferences-backend';
import { routes } from '../app.routes';
import { AuthBackend, type UserProfile } from '../core/data/auth-backend';
import { FakeItemBackend } from '../core/data/item-backend.testing';
import { ItemBackend } from '../core/data/item-backend';
import { CategoryBackend } from '../core/data/category-backend';
import type { Category } from '../domain/category';
import { ReminderService, type DeadlineAlert } from '../core/data/reminder.service';
import { SnackbarService } from '../shared/snackbar.service';

class FakeCategoryBackend extends CategoryBackend {
  async remove(): Promise<void> {
    throw new Error('unused');
  }
  async update(): Promise<Category> {
    throw new Error('unused');
  }
  async list(): Promise<Category[]> {
    return [];
  }
  async create(): Promise<Category> {
    throw new Error('unused');
  }
}

class FakeBackend extends AuthBackend {
  cb: (uid: string | null, profile?: UserProfile) => void = () => undefined;
  signOutCalls = 0;
  failSignOut = false;
  onChange(cb: (uid: string | null, profile?: UserProfile) => void) {
    this.cb = cb;
    return () => undefined;
  }
  async signIn() {
    return 'u1';
  }
  async signOut() {
    this.signOutCalls++;
    if (this.failSignOut) {
      throw new Error('x');
    }
    this.cb(null);
  }
}

describe('Shell', () => {
  const original = window.innerWidth;
  const setWidth = (w: number) => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: w });
  };
  let backend: FakeBackend;
  let router: Router;
  let fixture: ReturnType<typeof TestBed.createComponent<App>>;
  let root: HTMLElement;

  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const alertSignal = signal<DeadlineAlert | null>(null);
  const fakeReminder = { alert: alertSignal.asReadonly(), dismiss: () => alertSignal.set(null) };

  async function start(width: number, url = '/categories') {
    setWidth(width);
    backend = new FakeBackend();
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        { provide: PreferencesBackend, useValue: { load: async () => null, save: async () => undefined } },
        { provide: AuthBackend, useValue: backend },
        { provide: ReminderService, useValue: fakeReminder },
        { provide: CategoryBackend, useClass: FakeCategoryBackend }, { provide: ItemBackend, useValue: new FakeItemBackend() },
      ],
    });
    router = TestBed.inject(Router);
    const { AuthService } = await import('../core/data/auth.service');
    TestBed.inject(AuthService);
    backend.cb('u1', { email: 'ann@example.com', name: 'Ann' });
    fixture = TestBed.createComponent(App);
    root = fixture.nativeElement as HTMLElement;
    await router.navigateByUrl(url);
    await settle();
  }

  afterEach(() => {
    setWidth(original);
    alertSignal.set(null);
  });

  it('shows the Deadline alert literally, opens the Item on click and clears the alert', async () => {
    await start(800);
    alertSignal.set({ itemId: 'i1', categoryId: 'k1', title: 'Pay $& rent $1' });
    await settle();
    const open = root.querySelector<HTMLElement>('.alert-open')!;
    expect(root.querySelector('.alert-text')!.textContent).toBe('Due now: Pay $& rent $1');
    const nav = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    open.click();
    await settle();
    expect(nav).toHaveBeenCalledWith(['/c', 'k1', 'i', 'i1']);
    expect(alertSignal()).toBeNull();
    expect(root.querySelector('.alert-open')).toBeNull();
  });

  const links = () => [...root.querySelectorAll<HTMLElement>('nav .dest')];

  it('shows the bottom bar without Sign out on compact', async () => {
    await start(500);
    expect(root.querySelector('.shell')!.classList.contains('compact')).toBe(true);
    expect(links().map((l) => l.textContent!.trim())).toEqual(['Categories', 'Report', 'Settings']);
  });

  it.each([
    [800, 'medium'],
    [1300, 'expanded'],
  ])('shows rail or drawer with Sign out last at width %i', async (width, cls) => {
    await start(width);
    expect(root.querySelector('.shell')!.classList.contains(cls)).toBe(true);
    const items = links();
    expect(items.map((l) => l.textContent!.trim())).toEqual(['Categories', 'Report', 'Settings', 'Sign out']);
  });

  it('marks only the active destination with aria-current', async () => {
    await start(800, '/report');
    const current = links().filter((l) => l.getAttribute('aria-current') === 'page');
    expect(current.length).toBe(1);
    expect(current[0].textContent!.trim()).toBe('Report');
  });

  it('opens the account menu and closes it with Escape, returning focus to the avatar', async () => {
    await start(500);
    const avatar = root.querySelector<HTMLButtonElement>('.acct')!;
    avatar.click();
    await settle();
    expect(avatar.getAttribute('aria-expanded')).toBe('true');
    expect(root.querySelector('.menu')!.textContent).toContain('Ann');
    expect(root.querySelector('.menu')!.textContent).toContain('ann@example.com');
    root.querySelector('memo-account-menu')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle();
    expect(root.querySelector('.menu')).toBeNull();
    expect(avatar.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(avatar);
  });

  it('closes the menu on an outside click and on a window class change', async () => {
    await start(500);
    const avatar = root.querySelector<HTMLButtonElement>('.acct')!;
    avatar.click();
    await settle();
    document.body.click();
    await settle();
    expect(root.querySelector('.menu')).toBeNull();
    avatar.click();
    await settle();
    setWidth(900);
    window.dispatchEvent(new Event('resize'));
    await settle();
    expect(root.querySelector('.menu')).toBeNull();
  });

  it('offsets the snackbar above the bottom bar only on compact', async () => {
    const prop = () => document.documentElement.style.getPropertyValue('--snackbar-bottom');
    await start(500);
    expect(prop()).not.toBe('');
    setWidth(900);
    window.dispatchEvent(new Event('resize'));
    await settle();
    expect(prop()).toBe('');
    setWidth(500);
    window.dispatchEvent(new Event('resize'));
    await settle();
    expect(prop()).not.toBe('');
    fixture.destroy();
    expect(prop()).toBe('');
  });

  it('signs out once, lands on /login and shows the snackbar', async () => {
    await start(900);
    root.querySelector<HTMLButtonElement>('.dest--out')!.click();
    await settle();
    await fixture.whenStable();
    expect(backend.signOutCalls).toBe(1);
    expect(router.url).toBe('/login');
    expect(TestBed.inject(SnackbarService).message()).toBe('You have been signed out');
    expect(root.querySelector('memo-shell')).toBeNull();
  });

  it('stays put and shows the generic error when sign out fails', async () => {
    await start(900);
    backend.failSignOut = true;
    root.querySelector<HTMLButtonElement>('.dest--out')!.click();
    await settle();
    await fixture.whenStable();
    expect(router.url).toBe('/categories');
    expect(TestBed.inject(SnackbarService).message()).toBe('Something went wrong. Try again.');
  });

  it('shows no shell on /login', async () => {
    await start(900);
    backend.cb(null);
    await router.navigateByUrl('/login');
    await settle();
    expect(root.querySelector('memo-shell')).toBeNull();
    expect(root.querySelector('.acct')).toBeNull();
  });

  it('ignores a second sign out while one is in flight', async () => {
    await start(900);
    let release!: () => void;
    backend.signOut = () => {
      backend.signOutCalls++;
      return new Promise<void>((r) => (release = r));
    };
    const btn = root.querySelector<HTMLButtonElement>('.dest--out')!;
    btn.click();
    btn.click();
    expect(backend.signOutCalls).toBe(1);
    release();
    await settle();
  });

  it('goes to /login without a snackbar when the session ends elsewhere', async () => {
    await start(900);
    backend.cb(null);
    await settle();
    await fixture.whenStable();
    expect(router.url).toBe('/login');
    expect(TestBed.inject(SnackbarService).message()).toBe('');
  });

  it('keeps the account menu when signed in without a profile', async () => {
    await start(500);
    backend.cb('u1');
    await settle();
    expect(root.querySelector('.acct')).not.toBeNull();
  });
});
