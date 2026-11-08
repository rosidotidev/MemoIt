import { AuthBackend } from '../../core/data/auth-backend';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { FakeItemBackend } from '../../core/data/item-backend.testing';
import { ItemBackend } from '../../core/data/item-backend';
import { CategoryBackend } from '../../core/data/category-backend';
import { CategoryStore } from '../../core/data/category.store';
import { ItemStore } from '../../core/data/item.store';
import { SessionState } from '../../core/state/session.state';
import type { Category, CategoryData } from '../../domain/category';
import { SnackbarService } from '../../shared/snackbar.service';
import { signedIn } from '../../domain/session';
import { categoryGuard } from '../items/category.guard';
import { CategorySettingsComponent } from './category-settings.component';

class FakeBackend extends CategoryBackend {
  removed: string[] = [];
  async list(): Promise<Category[]> {
    return [
      { id: 'k1', name: 'Books', stateLabel: 'Done', reportable: false },
      { id: 'k2', name: 'Films', stateLabel: 'Done', reportable: false },
    ];
  }
  async create(): Promise<Category> {
    throw new Error('unused');
  }
  async update(_uid: string, id: string, data: CategoryData): Promise<Category> {
    return { id, ...data };
  }
  async remove(_uid: string, id: string): Promise<void> {
    this.removed.push(id);
  }
}

describe('CategorySettingsComponent danger zone', () => {
  let backend: FakeBackend;
  let itemBackend: FakeItemBackend;
  let el: HTMLElement;
  let harness: RouterTestingHarness;
  const mk = (id: string, categoryId: string, done: boolean) => ({
    id,
    categoryId,
    title: id,
    done,
    priority: 'medium' as const,
    createdAt: 1,
  });
  const q = <T extends HTMLElement>(sel: string) => el.querySelector<T>(sel)!;
  const buttons = () => [...el.querySelectorAll<HTMLButtonElement>('.danger-btn')];
  const sortedBatches = () => itemBackend.batches.map((b) => [...b].sort());
  const dialog = () => el.querySelector('memo-confirm-dialog');
  async function settle() {
    await harness.fixture.whenStable();
    for (let i = 0; i < 5; i++) {
      await Promise.resolve();
    }
    harness.detectChanges();
  }
  async function confirm() {
    [...dialog()!.querySelectorAll<HTMLButtonElement>('.btn')].at(-1)!.click();
    await settle();
  }

  beforeEach(async () => {
    backend = new FakeBackend();
    itemBackend = new FakeItemBackend();
    itemBackend.stored = [mk('a', 'k1', false), mk('b', 'k1', true), mk('c', 'k1', true), mk('d', 'k2', true)];
    TestBed.configureTestingModule({
      providers: [{ provide: AuthBackend, useValue: { onChange: () => () => undefined, signIn: async () => 'u', signOut: async () => undefined } }, 
        provideRouter([
          { path: 'categories', children: [] },
          { path: 'c/:categoryId/settings', component: CategorySettingsComponent, canActivate: [categoryGuard] },
        ]),
        { provide: CategoryBackend, useValue: backend },
        { provide: ItemBackend, useValue: itemBackend },
      ],
    });
    TestBed.inject(SessionState).session.set(signedIn('u1'));
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/c/k1/settings', CategorySettingsComponent);
    await settle();
    el = harness.routeNativeElement as HTMLElement;
  });

  it('clear done names the Category and the count, deletes only Done Items and stays', async () => {
    buttons()[0].click();
    harness.detectChanges();
    expect(dialog()!.textContent).toContain('"Books" (2)');
    await confirm();
    expect(sortedBatches()).toEqual([['b', 'c']]);
    expect(TestBed.inject(ItemStore).countsFor('k1')).toEqual({ total: 1, open: 1, done: 0 });
    expect(dialog()).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/c/k1/settings');
    expect(buttons()[0].disabled).toBe(true);
  });

  it('shows a snackbar after clearing and an inline error when clearing fails', async () => {
    itemBackend.removeError = { code: 'timeout' };
    buttons()[0].click();
    harness.detectChanges();
    await confirm();
    expect(q('.form-error').textContent).toContain('too long');
    expect(TestBed.inject(ItemStore).countsFor('k1').done).toBe(2);
    expect(TestBed.inject(Router).url).toBe('/c/k1/settings');
    itemBackend.removeError = null;
    buttons()[0].click();
    harness.detectChanges();
    await confirm();
    expect(TestBed.inject(SnackbarService).message()).toContain('cleared');
  });

  it('disables both buttons and ignores ask while Items are not loaded', async () => {
    itemBackend.listError = { code: 'unavailable' };
    TestBed.inject(ItemStore).reload();
    await settle();
    expect(TestBed.inject(ItemStore).status()).toBe('error');
    expect(buttons().map((b) => b.disabled)).toEqual([true, true]);
    buttons()[1].click();
    harness.detectChanges();
    expect(dialog()).toBeNull();
  });

  it('cancel keeps everything', () => {
    buttons()[0].click();
    harness.detectChanges();
    [...dialog()!.querySelectorAll<HTMLButtonElement>('.btn')][0].click();
    harness.detectChanges();
    expect(dialog()).toBeNull();
    expect(itemBackend.batches).toEqual([]);
  });

  it('delete category states the Item count, removes Items and Category, and goes to /categories', async () => {
    buttons()[1].click();
    harness.detectChanges();
    expect(dialog()!.textContent).toContain('"Books" and its items (3)');
    await confirm();
    expect(sortedBatches()).toEqual([['a', 'b', 'c']]);
    expect(backend.removed).toEqual(['k1']);
    expect(TestBed.inject(CategoryStore).byId('k1')).toBeUndefined();
    expect(TestBed.inject(Router).url).toBe('/categories');
  });

  it('shows an inline error and stays when the delete fails', async () => {
    itemBackend.removeError = { code: 'network' };
    buttons()[1].click();
    harness.detectChanges();
    await confirm();
    expect(q('.form-error').textContent).toContain('No connection');
    expect(TestBed.inject(CategoryStore).byId('k1')).toBeDefined();
    expect(TestBed.inject(Router).url).toBe('/c/k1/settings');
  });
});
