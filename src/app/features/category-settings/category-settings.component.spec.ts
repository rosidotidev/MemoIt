import { AuthBackend } from '../../core/data/auth-backend';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { FakeItemBackend } from '../../core/data/item-backend.testing';
import { ItemBackend } from '../../core/data/item-backend';
import { CategoryBackend, CategoryBackendError } from '../../core/data/category-backend';
import { CategoryStore } from '../../core/data/category.store';
import { ItemStore } from '../../core/data/item.store';
import { SessionState } from '../../core/state/session.state';
import type { Category, CategoryData } from '../../domain/category';
import { SnackbarService } from '../../shared/snackbar.service';
import { signedIn } from '../../domain/session';
import { categoryGuard } from '../items/category.guard';
import { CategorySettingsComponent } from './category-settings.component';

class FakeBackend extends CategoryBackend {
  async remove(): Promise<void> {
    throw new Error('unused');
  }
  updated: CategoryData[] = [];
  updateError: unknown = null;
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
    if (this.updateError) {
      throw this.updateError;
    }
    this.updated.push(data);
    return { id, ...data };
  }
}

describe('CategorySettingsComponent', () => {
  let backend: FakeBackend;
  let itemBackend: FakeItemBackend;
  let el: HTMLElement;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    backend = new FakeBackend();
    itemBackend = new FakeItemBackend();
    TestBed.configureTestingModule({
      providers: [{ provide: AuthBackend, useValue: { onChange: () => () => undefined, signIn: async () => 'u', signOut: async () => undefined } }, 
        provideRouter([
          { path: 'categories', children: [] },
          { path: 'c/:categoryId/settings', component: CategorySettingsComponent, canActivate: [categoryGuard] },
        ]),
        { provide: CategoryBackend, useValue: backend }, { provide: ItemBackend, useValue: itemBackend },
      ],
    });
    TestBed.inject(SessionState).session.set(signedIn('u1'));
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/c/k1/settings', CategorySettingsComponent);
    harness.detectChanges();
    el = harness.routeNativeElement as HTMLElement;
  });

  const q = <T extends HTMLElement>(sel: string) => el.querySelector<T>(sel)!;
  function type(sel: string, value: string) {
    const input = q<HTMLInputElement>(sel);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    harness.detectChanges();
  }
  async function save() {
    q<HTMLFormElement>('form').dispatchEvent(new Event('submit'));
    await harness.fixture.whenStable();
    harness.detectChanges();
  }

  it('shows the current values and a back link to the Category', () => {
    expect(q<HTMLInputElement>('#cs-name').value).toBe('Books');
    expect(q<HTMLInputElement>('#cs-label').value).toBe('Done');
    expect(q('.back').getAttribute('href')).toBe('/c/k1');
    expect(q<HTMLInputElement>('.switch input').checked).toBe(false);
  });

  it('a suggestion fills the label and updates the preview', () => {
    const bought = [...el.querySelectorAll<HTMLButtonElement>('.fchip')].find((b) => b.textContent!.trim() === 'Bought')!;
    bought.click();
    harness.detectChanges();
    expect(q<HTMLInputElement>('#cs-label').value).toBe('Bought');
    expect(q('.preview-chip').textContent).toContain('Bought');
  });

  it('saves the edits and the store shows them', async () => {
    type('#cs-name', ' Novels ');
    type('#cs-label', 'Read');
    q<HTMLInputElement>('.switch input').click();
    harness.detectChanges();
    await save();
    expect(backend.updated).toEqual([{ name: 'Novels', stateLabel: 'Read', reportable: true }]);
    expect(TestBed.inject(CategoryStore).byId('k1')?.name).toBe('Novels');
    expect(q<HTMLInputElement>('#cs-name').value).toBe('Novels');
    expect(TestBed.inject(SnackbarService).message()).toContain('Changes saved');
  });

  it('reloads the form when only the route id changes', async () => {
    await harness.navigateByUrl('/c/k2/settings', CategorySettingsComponent);
    harness.detectChanges();
    expect(q<HTMLInputElement>('#cs-name').value).toBe('Films');
  });

  it('shows a not-found error when the Category was deleted elsewhere', async () => {
    backend.updateError = new CategoryBackendError('notFound');
    await save();
    expect(el.textContent).toContain('no longer exists');
  });

  it('shows an inline duplicate error and keeps the typed value, without a write', async () => {
    type('#cs-name', 'films');
    await save();
    expect(q('#cs-name-error').textContent).toContain('already have');
    expect(q<HTMLInputElement>('#cs-name').value).toBe('films');
    expect(backend.updated.length).toBe(0);
  });

  it('allows the own name in another case', async () => {
    type('#cs-name', 'books');
    await save();
    expect(backend.updated.length).toBe(1);
  });

  it('shows inline errors for a blank name and a blank label', async () => {
    type('#cs-name', '  ');
    await save();
    expect(q('#cs-name-error').textContent).toContain('Enter a name');
    type('#cs-name', 'Books');
    type('#cs-label', ' ');
    await save();
    expect(q('#cs-label-error').textContent).toContain('done label');
    expect(backend.updated.length).toBe(0);
  });

  it('limits the label input to 16 characters', () => {
    expect(q('#cs-label').getAttribute('maxlength')).toBe('16');
  });

  it('keeps typed values and shows an error when the save fails', async () => {
    backend.updateError = { code: 'network' };
    type('#cs-name', 'Novels');
    await save();
    expect(q('.form-error').textContent).toContain('No connection');
    expect(q<HTMLInputElement>('#cs-name').value).toBe('Novels');
    expect(TestBed.inject(CategoryStore).byId('k1')?.name).toBe('Books');
  });

  it('redirects to /categories for an unknown id', async () => {
    await harness.navigateByUrl('/c/nope/settings');
    expect(TestBed.inject(Router).url).toBe('/categories');
  });

  it('shows the real Item counts in At a glance', async () => {
    const mk = (id: string, categoryId: string, done: boolean) => ({
      id,
      categoryId,
      title: id,
      done,
      priority: 'medium' as const,
      createdAt: 1,
    });
    itemBackend.stored = [mk('a', 'k1', false), mk('b', 'k1', false), mk('c', 'k1', true), mk('d', 'k2', true)];
    TestBed.inject(ItemStore).reload();
    for (let i = 0; i < 5; i++) {
      await Promise.resolve();
    }
    harness.detectChanges();
    const values = [...el.querySelectorAll('.glance .kv dd')].slice(0, 3).map((d) => d.textContent!.trim());
    expect(values).toEqual(['3', '2', '1']);
  });
});
