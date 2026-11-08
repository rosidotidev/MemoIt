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
import { categoryGuard } from '../items/category.guard';
import { ItemsComponent } from '../items/items.component';
import { ItemEditComponent } from './item-edit.component';
import { ItemNewComponent } from './item-new.component';
import { itemGuard } from './item.guard';

class FakeCategoryBackend extends CategoryBackend {
  async remove(): Promise<void> {
    throw new Error('unused');
  }
  async list(): Promise<Category[]> {
    return [
      { id: 'r1', name: 'Weight', stateLabel: 'Done', reportable: true },
      { id: 'k1', name: 'Books', stateLabel: 'Done', reportable: false },
    ];
  }
  async create(): Promise<Category> {
    throw new Error('unused');
  }
  async update(): Promise<Category> {
    throw new Error('unused');
  }
}

describe('Value field on the Item form', () => {
  let items: FakeItemBackend;
  let harness: RouterTestingHarness;
  let el: HTMLElement;

  beforeEach(() => {
    harness = undefined as unknown as RouterTestingHarness;
    items = new FakeItemBackend();
    items.stored = [
      { id: 'a', categoryId: 'r1', title: 'Mon', done: false, priority: 'medium', value: 82.4, createdAt: 5 },
      { id: 'b', categoryId: 'k1', title: 'Book', done: false, priority: 'medium', value: 3, createdAt: 6 },
    ];
    TestBed.configureTestingModule({
      providers: [{ provide: AuthBackend, useValue: { onChange: () => () => undefined, signIn: async () => 'u', signOut: async () => undefined } }, 
        provideRouter([
          { path: 'c/:categoryId', component: ItemsComponent, canActivate: [categoryGuard] },
          { path: 'c/:categoryId/i/new', component: ItemNewComponent, canActivate: [categoryGuard] },
          { path: 'c/:categoryId/i/:itemId', component: ItemEditComponent, canActivate: [categoryGuard, itemGuard] },
        ]),
        { provide: CategoryBackend, useValue: new FakeCategoryBackend() },
        { provide: ItemBackend, useValue: items },
      ],
    });
    TestBed.inject(SessionState).session.set(signedIn('u1'));
  });

  async function open(url: string) {
    harness ??= await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    for (let i = 0; i < 5; i++) {
      await Promise.resolve();
    }
    harness.detectChanges();
    el = harness.routeNativeElement as HTMLElement;
  }

  function type(selector: string, value: string) {
    const input = el.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    harness.detectChanges();
  }

  async function submit() {
    el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await harness.fixture.whenStable();
    harness.detectChanges();
  }

  it('shows the panel only in a Reportable Category', async () => {
    await open('/c/r1/i/new');
    expect(el.querySelector('#item-value')).not.toBeNull();
    await open('/c/k1/i/new');
    expect(el.querySelector('#item-value')).toBeNull();
  });

  it('rejects non-numeric text and keeps the draft', async () => {
    await open('/c/r1/i/new');
    type('#item-title', 'Mon');
    type('#item-value', 'abc');
    await submit();
    expect(el.querySelector('#item-value-error')!.textContent).toContain('Enter a number');
    expect(items.created.length).toBe(0);
  });

  it('saves a decimal comma as a number', async () => {
    await open('/c/r1/i/new');
    type('#item-title', 'Mon');
    type('#item-value', '82,4');
    await submit();
    expect(items.created[0]).toMatchObject({ categoryId: 'r1', value: 82.4 });
  });

  it('leaves the Value absent when the field is empty', async () => {
    await open('/c/r1/i/new');
    type('#item-title', 'Mon');
    await submit();
    expect('value' in items.created[0]).toBe(false);
  });

  it('shows the stored Value on edit, changes it and clears it', async () => {
    await open('/c/r1/i/a');
    expect(el.querySelector<HTMLInputElement>('#item-value')!.value).toBe('82.4');
    type('#item-value', '80');
    await submit();
    expect(items.updated[0].data.value).toBe(80);
    await open('/c/r1/i/a');
    type('#item-value', '');
    await submit();
    expect(items.updated[1].data.value).toBeNull();
  });

  it('does not touch the Value of an Item in a non-Reportable Category', async () => {
    await open('/c/k1/i/b');
    expect(el.querySelector('#item-value')).toBeNull();
    await submit();
    expect('value' in items.updated[0].data).toBe(false);
  });
});
