import { TestBed } from '@angular/core/testing';
import { FakeItemBackend } from '../../core/data/item-backend.testing';
import { ItemBackend } from '../../core/data/item-backend';
import { CategoryBackend } from '../../core/data/category-backend';
import { SessionState } from '../../core/state/session.state';
import type { Category, CategoryData } from '../../domain/category';
import { signedIn } from '../../domain/session';
import { NewCategoryDialogComponent } from './new-category-dialog.component';

class FakeBackend extends CategoryBackend {
  async remove(): Promise<void> {
    throw new Error('unused');
  }
  async update(): Promise<Category> {
    throw new Error('unused');
  }
  creates = 0;
  failCreate: unknown = null;
  async list(): Promise<Category[]> {
    return [{ id: 'b', name: 'Books', stateLabel: 'Done', reportable: false }];
  }
  async create(_uid: string, data: CategoryData): Promise<Category> {
    this.creates++;
    if (this.failCreate) {
      throw this.failCreate;
    }
    return { id: 'n', ...data };
  }
}

describe('NewCategoryDialogComponent', () => {
  let backend: FakeBackend;
  let fixture: ReturnType<typeof TestBed.createComponent<NewCategoryDialogComponent>>;
  let el: HTMLElement;
  let closed = 0;

  const settle = async () => {
    for (let i = 0; i < 3; i++) {
      fixture.detectChanges();
      await fixture.whenStable();
    }
    fixture.detectChanges();
  };
  const submit = async (value: string) => {
    const input = el.querySelector<HTMLInputElement>('input')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await settle();
  };

  beforeEach(async () => {
    closed = 0;
    backend = new FakeBackend();
    TestBed.configureTestingModule({ providers: [{ provide: CategoryBackend, useValue: backend }, { provide: ItemBackend, useValue: new FakeItemBackend() }] });
    TestBed.inject(SessionState).session.set(signedIn('u1'));
    fixture = TestBed.createComponent(NewCategoryDialogComponent);
    fixture.componentInstance.closed.subscribe(() => closed++);
    el = fixture.nativeElement as HTMLElement;
    document.body.appendChild(el);
    await settle();
  });

  afterEach(() => el.remove());

  it('labels the dialog as modal', () => {
    expect(el.querySelector('[role=dialog]')!.getAttribute('aria-modal')).toBe('true');
  });

  it('rejects an empty name inline without writing and stays open', async () => {
    await submit('   ');
    expect(el.querySelector('.error')!.textContent).toContain('Enter a name.');
    expect(backend.creates).toBe(0);
    expect(closed).toBe(0);
  });

  it('rejects a duplicate name inline without writing', async () => {
    await submit('books');
    expect(el.querySelector('.error')!.textContent).toContain('already have a category');
    expect(backend.creates).toBe(0);
  });

  it('keeps the dialog open with an error text when the write fails', async () => {
    backend.failCreate = { code: 'network' };
    await submit('Movies');
    expect(el.querySelector('.error')!.textContent).toContain('No connection');
    expect(closed).toBe(0);
    expect(el.querySelector<HTMLInputElement>('input')!.value).toBe('Movies');
  });

  it('closes after a confirmed write', async () => {
    await submit('Movies');
    expect(closed).toBe(1);
  });

  it('closes on Escape and traps Tab inside', async () => {
    const dialog = el.querySelector('[role=dialog]')!;
    const buttons = el.querySelectorAll<HTMLButtonElement>('button');
    buttons[buttons.length - 1].focus();
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    dialog.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(el.querySelector('input'));
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(closed).toBe(1);
  });
});
