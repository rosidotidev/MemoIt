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
import { ItemNewComponent } from './item-new.component';

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

describe('ItemNewComponent', () => {
  let items: FakeItemBackend;
  let harness: RouterTestingHarness;
  let el: HTMLElement;

  beforeEach(async () => {
    items = new FakeItemBackend();
    TestBed.configureTestingModule({
      providers: [{ provide: AuthBackend, useValue: { onChange: () => () => undefined, signIn: async () => 'u', signOut: async () => undefined } }, 
        provideRouter([
          { path: 'c/:categoryId', component: ItemsComponent, canActivate: [categoryGuard] },
          { path: 'c/:categoryId/i/new', component: ItemNewComponent, canActivate: [categoryGuard] },
        ]),
        { provide: CategoryBackend, useValue: new FakeCategoryBackend() },
        { provide: ItemBackend, useValue: items },
      ],
    });
    TestBed.inject(SessionState).session.set(signedIn('u1'));
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/c/k1/i/new', ItemNewComponent);
    el = harness.routeNativeElement as HTMLElement;
    // wait for the Items to load
    for (let i = 0; i < 5; i++) {
      await Promise.resolve();
    }
  });

  function type(selector: string, value: string) {
    const input = el.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    harness.detectChanges();
  }

  async function submit() {
    el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await harness.fixture.whenStable();
    harness.detectChanges();
  }

  it('has no Delete button in the new form', () => {
    expect(el.querySelector('.delete')).toBeNull();
    expect(el.textContent).not.toContain('Delete');
  });

  it('shows a live preview of the typed title', () => {
    type('#item-title', 'Milk');
    expect(el.querySelector('.preview-title')!.textContent).toContain('Milk');
  });

  it('rejects a blank title inline and keeps the draft', async () => {
    type('#item-title', '   ');
    await submit();
    expect(el.querySelector('#item-title-error')!.textContent).toContain('Enter a title');
    expect(items.created.length).toBe(0);
    expect(TestBed.inject(DraftStore).get('k1').title).toBe('   ');
  });

  it('saves, drops the draft and goes to the Category with the Item first', async () => {
    type('#item-title', 'Milk');
    await submit();
    expect(items.created[0]).toEqual({ categoryId: 'k1', title: 'Milk', priority: 'medium' });
    expect(TestBed.inject(Router).url).toBe('/c/k1');
    expect(TestBed.inject(DraftStore).get('k1').title).toBe('');
    expect(TestBed.inject(ItemStore).forCategory('k1')[0].title).toBe('Milk');
  });

  it('saves the chosen priority and deadline', async () => {
    type('#item-title', 'Milk');
    const high = [...el.querySelectorAll<HTMLButtonElement>('.tile')].find((b) => b.textContent!.trim() === 'High')!;
    high.click();
    const date = el.querySelector<HTMLInputElement>('#item-deadline-date')!;
    date.value = '2030-01-02';
    date.dispatchEvent(new Event('change'));
    harness.detectChanges();
    const time = el.querySelector<HTMLInputElement>('#item-deadline-time')!;
    time.value = '10:00';
    time.dispatchEvent(new Event('change'));
    harness.detectChanges();
    await submit();
    expect(items.created[0]).toEqual({
      categoryId: 'k1',
      title: 'Milk',
      priority: 'high',
      deadline: fromInputValue('2030-01-02T10:00'),
    });
  });

  it('shows an inline error and keeps the values and the draft when the save fails', async () => {
    items.createError = new ItemBackendError('network');
    type('#item-title', 'Milk');
    type('#item-description', 'Semi-skimmed');
    await submit();
    expect(el.querySelector('.form-error')!.textContent).toContain('No connection');
    expect(el.querySelector<HTMLInputElement>('#item-title')!.value).toBe('Milk');
    expect(TestBed.inject(DraftStore).get('k1')).toEqual({
      categoryId: 'k1',
      title: 'Milk',
      description: 'Semi-skimmed',
      priority: 'medium',
      deadline: null,
      value: '',
    });
    expect(TestBed.inject(Router).url).toBe('/c/k1/i/new');
  });

  it('drops the draft on Cancel and goes back', async () => {
    type('#item-title', 'Milk');
    el.querySelector<HTMLButtonElement>('.appbar .icon-btn')!.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(DraftStore).get('k1').title).toBe('');
    expect(TestBed.inject(Router).url).toBe('/c/k1');
  });
});
