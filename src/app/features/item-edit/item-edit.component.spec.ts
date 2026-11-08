import { AuthBackend } from '../../core/data/auth-backend';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CategoryBackend } from '../../core/data/category-backend';
import { ItemBackend, ItemBackendError } from '../../core/data/item-backend';
import { FakeItemBackend } from '../../core/data/item-backend.testing';
import { ItemStore } from '../../core/data/item.store';
import { DraftStore } from '../../core/state/draft.store';
import { SessionState } from '../../core/state/session.state';
import type { Category } from '../../domain/category';
import { signedIn } from '../../domain/session';
import { fromInputValue } from '../../domain/time';
import { categoryGuard } from '../items/category.guard';
import { ItemsComponent } from '../items/items.component';
import { ItemEditComponent } from './item-edit.component';
import { itemGuard } from './item.guard';

class FakeCategoryBackend extends CategoryBackend {
  async remove(): Promise<void> {
    throw new Error('unused');
  }
  async list(): Promise<Category[]> {
    return [{ id: 'k1', name: 'Books', stateLabel: 'Done', reportable: false }];
  }
  async create(): Promise<Category> {
    throw new Error('unused');
  }
  async update(): Promise<Category> {
    throw new Error('unused');
  }
}

describe('ItemEditComponent', () => {
  let items: FakeItemBackend;
  let harness: RouterTestingHarness;

  beforeEach(() => {
    items = new FakeItemBackend();
    items.stored = [
      { id: 'a', categoryId: 'k1', title: 'Milk', description: 'Semi', done: false, priority: 'medium', createdAt: 5 },
    ];
    TestBed.configureTestingModule({
      providers: [{ provide: AuthBackend, useValue: { onChange: () => () => undefined, signIn: async () => 'u', signOut: async () => undefined } }, 
        provideRouter([
          { path: 'c/:categoryId', component: ItemsComponent, canActivate: [categoryGuard] },
          {
            path: 'c/:categoryId/i/:itemId',
            component: ItemEditComponent,
            canActivate: [categoryGuard, itemGuard],
          },
        ]),
        { provide: CategoryBackend, useValue: new FakeCategoryBackend() },
        { provide: ItemBackend, useValue: items },
      ],
    });
    TestBed.inject(SessionState).session.set(signedIn('u1'));
  });

  async function open(url = '/c/k1/i/a') {
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url, ItemEditComponent);
    harness.detectChanges();
    return harness.routeNativeElement as HTMLElement;
  }

  function type(el: HTMLElement, selector: string, value: string) {
    const input = el.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    harness.detectChanges();
  }

  async function submit(el: HTMLElement) {
    el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await harness.fixture.whenStable();
    harness.detectChanges();
  }

  it('opens the form with the stored values and an edit heading', async () => {
    const el = await open();
    expect(el.querySelector('h1')!.textContent).toContain('Edit item');
    expect(el.querySelector<HTMLInputElement>('#item-title')!.value).toBe('Milk');
    expect(el.querySelector<HTMLTextAreaElement>('#item-description')!.value).toBe('Semi');
    expect(el.querySelector('.delete')!.textContent).toContain('Delete item');
  });

  it('redirects an unknown Item id to its Category', async () => {
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/c/k1/i/nope');
    expect(TestBed.inject(Router).url).toBe('/c/k1');
  });

  it('redirects an Item of another Category to the requested Category', async () => {
    items.stored = [{ id: 'z', categoryId: 'other', title: 'X', done: false, priority: 'medium', createdAt: 1 }];
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/c/k1/i/z');
    expect(TestBed.inject(Router).url).toBe('/c/k1');
  });

  it('saves the change, drops the draft and returns to the Items screen', async () => {
    const el = await open();
    type(el, '#item-title', '  Oat milk ');
    await submit(el);
    expect(items.updated).toEqual([{ id: 'a', data: { title: 'Oat milk', description: 'Semi', priority: 'medium', deadline: null } }]);
    expect(TestBed.inject(Router).url).toBe('/c/k1');
    expect(TestBed.inject(ItemStore).byId('a')!.title).toBe('Oat milk');
    expect(TestBed.inject(ItemStore).byId('a')!.createdAt).toBe(5);
    expect(TestBed.inject(DraftStore).get('k1', TestBed.inject(ItemStore).byId('a')).title).toBe('Oat milk');
    expect(TestBed.inject(DraftStore).get('k1', TestBed.inject(ItemStore).byId('a')).title).not.toMatch(/^\s|\s$/);
  });

  it('keeps the stored priority and deadline when saving untouched', async () => {
    items.stored = [
      { id: 'a', categoryId: 'k1', title: 'Milk', done: false, priority: 'high', deadline: 1893495600000, createdAt: 5 },
    ];
    const el = await open();
    type(el, '#item-title', 'Oat milk');
    await submit(el);
    expect(items.updated[0].data).toMatchObject({ priority: 'high', deadline: 1893495600000 });
  });

  it('saves a changed priority and deadline', async () => {
    const el = await open();
    const low = [...el.querySelectorAll<HTMLButtonElement>('.tile')].find((b) => b.textContent!.trim() === 'Low')!;
    low.click();
    const date = el.querySelector<HTMLInputElement>('#item-deadline-date')!;
    date.value = '2030-01-02';
    date.dispatchEvent(new Event('change'));
    harness.detectChanges();
    const time = el.querySelector<HTMLInputElement>('#item-deadline-time')!;
    time.value = '10:00';
    time.dispatchEvent(new Event('change'));
    harness.detectChanges();
    await submit(el);
    expect(items.updated[0].data).toMatchObject({ priority: 'low', deadline: fromInputValue('2030-01-02T10:00') });
  });

  it('rejects a blank title inline without a write', async () => {
    const el = await open();
    type(el, '#item-title', '  ');
    await submit(el);
    expect(el.querySelector('#item-title-error')!.textContent).toContain('Enter a title');
    expect(items.updated.length).toBe(0);
  });

  it('shows an inline error and keeps the typed text when the save fails', async () => {
    items.updateError = new ItemBackendError('network');
    const el = await open();
    type(el, '#item-title', 'Oat milk');
    await submit(el);
    expect(el.querySelector('.form-error')!.textContent).toContain('No connection');
    expect(el.querySelector<HTMLInputElement>('#item-title')!.value).toBe('Oat milk');
    expect(TestBed.inject(Router).url).toBe('/c/k1/i/a');
    expect(TestBed.inject(ItemStore).byId('a')!.title).toBe('Milk');
  });

  it('Cancel drops the draft and goes back without writing', async () => {
    const el = await open();
    type(el, '#item-title', 'Changed');
    el.querySelector<HTMLButtonElement>('.appbar .icon-btn')!.click();
    await harness.fixture.whenStable();
    expect(items.updated.length).toBe(0);
    expect(TestBed.inject(Router).url).toBe('/c/k1');
    expect(TestBed.inject(DraftStore).get('k1', TestBed.inject(ItemStore).byId('a')).title).toBe('Milk');
  });

  describe('delete', () => {
    const settle = async () => {
      for (let i = 0; i < 3; i++) {
        harness.detectChanges();
        await harness.fixture.whenStable();
        await new Promise<void>((r) => setTimeout(r));
      }
      harness.detectChanges();
    };
    const openDialog = async (el: HTMLElement) => {
      el.querySelector<HTMLButtonElement>('.delete')!.click();
      await settle();
      return el.querySelector('memo-confirm-dialog') as HTMLElement | null;
    };

    it('opens a dialog that names the Item and says it cannot be undone', async () => {
      const el = await open();
      const dialog = (await openDialog(el))!;
      expect(dialog.textContent).toContain('"Milk"');
      expect(dialog.textContent).toContain('cannot be undone');
      expect(dialog.querySelector('button.destructive')).not.toBeNull();
    });

    it('Cancel keeps the Item and closes the dialog', async () => {
      const el = await open();
      const dialog = (await openDialog(el))!;
      dialog.querySelector<HTMLButtonElement>('button.text')!.click();
      await settle();
      expect(el.querySelector('memo-confirm-dialog')).toBeNull();
      expect(items.removed).toEqual([]);
      expect(TestBed.inject(ItemStore).byId('a')).toBeDefined();
      expect(TestBed.inject(Router).url).toBe('/c/k1/i/a');
    });

    it('Escape closes the dialog without deleting', async () => {
      const el = await open();
      const dialog = (await openDialog(el))!;
      dialog.querySelector('[role=dialog]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await settle();
      expect(el.querySelector('memo-confirm-dialog')).toBeNull();
      expect(items.removed).toEqual([]);
    });

    it('confirm removes the Item, drops the draft and returns to the Items screen', async () => {
      const el = await open();
      type(el, '#item-title', 'Edited');
      const item = TestBed.inject(ItemStore).byId('a');
      const dialog = (await openDialog(el))!;
      dialog.querySelector<HTMLButtonElement>('button.destructive')!.click();
      await settle();
      expect(items.removed).toEqual(['a']);
      expect(TestBed.inject(ItemStore).byId('a')).toBeUndefined();
      expect(TestBed.inject(Router).url).toBe('/c/k1');
      // the edit draft (k1/a) is gone: reading it again gives the stored values, not 'Edited'
      expect(TestBed.inject(DraftStore).get('k1', item).title).toBe('Milk');
    });

    it('shows an inline error and keeps the Item when the delete fails', async () => {
      items.removeError = new ItemBackendError('network');
      const el = await open();
      const dialog = (await openDialog(el))!;
      dialog.querySelector<HTMLButtonElement>('button.destructive')!.click();
      await settle();
      expect(el.querySelector('memo-confirm-dialog')).toBeNull();
      expect(el.querySelector('.form-error')!.textContent).toContain('No connection');
      expect(TestBed.inject(ItemStore).byId('a')).toBeDefined();
      expect(TestBed.inject(Router).url).toBe('/c/k1/i/a');
    });
  });
});
