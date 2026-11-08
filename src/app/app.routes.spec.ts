import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { routes } from './app.routes';
import { SessionState } from './core/state/session.state';
import { SIGNED_OUT_SESSION, signedIn } from './domain/session';
import { AuthBackend } from './core/data/auth-backend';
import { FakeItemBackend } from './core/data/item-backend.testing';
import { ItemBackend } from './core/data/item-backend';
import { CategoryBackend } from './core/data/category-backend';
import type { Category } from './domain/category';

class FakeCategoryBackend extends CategoryBackend {
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

class FakeBackend extends AuthBackend {
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

describe('routes', () => {
  let router: Router;
  let state: SessionState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: AuthBackend, useClass: FakeBackend },
        { provide: CategoryBackend, useClass: FakeCategoryBackend }, { provide: ItemBackend, useValue: new FakeItemBackend() },
      ],
    });
    router = TestBed.inject(Router);
    state = TestBed.inject(SessionState);
  });

  it('sends a signed-out visitor from /categories to /login', async () => {
    state.session.set(SIGNED_OUT_SESSION);
    await router.navigateByUrl('/categories');
    expect(router.url).toBe('/login');
  });

  it('sends a signed-in user from /login to /categories', async () => {
    state.session.set(signedIn('u1'));
    await router.navigateByUrl('/login');
    expect(router.url).toBe('/categories');
  });

  it('redirects the empty and unknown paths to /categories', async () => {
    state.session.set(signedIn('u1'));
    await router.navigateByUrl('/');
    expect(router.url).toBe('/categories');
    await router.navigateByUrl('/nope');
    expect(router.url).toBe('/categories');
  });

  it.each(['/report', '/settings'])('sends a signed-out visitor from %s to /login', async (url) => {
    state.session.set(SIGNED_OUT_SESSION);
    await router.navigateByUrl(url);
    expect(router.url).toBe('/login');
  });

  it.each(['/report', '/settings'])('keeps a signed-in user on %s', async (url) => {
    state.session.set(signedIn('u1'));
    await router.navigateByUrl(url);
    expect(router.url).toBe(url);
  });

  it('opens a known category at /c/:id', async () => {
    state.session.set(signedIn('u1'));
    await router.navigateByUrl('/c/k1');
    expect(router.url).toBe('/c/k1');
  });

  it('keeps a signed-in user on /c/:id/settings and guards it', async () => {
    state.session.set(signedIn('u1'));
    await router.navigateByUrl('/c/k1/settings');
    expect(router.url).toBe('/c/k1/settings');
    await router.navigateByUrl('/c/nope/settings');
    expect(router.url).toBe('/categories');
  });

  it('sends a signed-out visitor from /c/:id/settings to /login', async () => {
    state.session.set(SIGNED_OUT_SESSION);
    await router.navigateByUrl('/c/k1/settings');
    expect(router.url).toBe('/login');
  });

  it('redirects an unknown category id to /categories', async () => {
    state.session.set(signedIn('u1'));
    await router.navigateByUrl('/c/nope');
    expect(router.url).toBe('/categories');
  });
});
