import { AuthBackend } from '../../core/data/auth-backend';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { CategoryBackend } from '../../core/data/category-backend';
import { ItemBackend } from '../../core/data/item-backend';
import { FakeItemBackend } from '../../core/data/item-backend.testing';
import { SessionState } from '../../core/state/session.state';
import { signedIn } from '../../domain/session';
import type { Category } from '../../domain/category';
import type { Item } from '../../domain/item';
import { LanguageService } from '../../shared/language.service';
import { ReportComponent } from './report.component';

class FakeCategories extends CategoryBackend {
  cats: Category[] = [];
  async list(): Promise<Category[]> {
    return this.cats;
  }
  async create(): Promise<Category> {
    throw new Error('unused');
  }
  async update(): Promise<Category> {
    throw new Error('unused');
  }
  async remove(): Promise<void> {
    throw new Error('unused');
  }
}

const item = (id: string, value: number | undefined, createdAt: number): Item => ({
  id,
  categoryId: 'w',
  title: id,
  done: false,
  priority: 'medium',
  createdAt,
  ...(value === undefined ? {} : { value }),
});

describe('ReportComponent', () => {
  const cats = new FakeCategories();
  const items = new FakeItemBackend();

  async function open(lang: 'en' | 'it' = 'en'): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthBackend, useValue: { onChange: () => () => undefined, signIn: async () => 'u', signOut: async () => undefined } }, 
        provideRouter([{ path: '', component: ReportComponent }]),
        provideCharts(withDefaultRegisterables()),
        { provide: CategoryBackend, useValue: cats },
        { provide: ItemBackend, useValue: items },
      ],
    });
    TestBed.inject(SessionState).session.set(signedIn('u1'));
    TestBed.inject(LanguageService).language.set(lang);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/', ReportComponent);
    await harness.fixture.whenStable();
    harness.detectChanges();
    return harness.routeNativeElement as HTMLElement;
  }

  beforeEach(() => {
    localStorage.clear();
    cats.cats = [];
    items.stored = [];
  });

  it('shows the empty state when no Category is Reportable', async () => {
    cats.cats = [{ id: 'w', name: 'Weight', stateLabel: 'Done', reportable: false }];
    const el = await open();
    expect(el.textContent).toContain('No category is Reportable yet');
    expect(el.querySelector('canvas')).toBeNull();
    expect(el.querySelector('a[href="/categories"]')).not.toBeNull();
  });

  it('shows the empty state for a Reportable Category without Values', async () => {
    cats.cats = [{ id: 'w', name: 'Weight', stateLabel: 'Done', reportable: true }];
    items.stored = [item('a', undefined, Date.now())];
    const el = await open();
    expect(el.textContent).toContain('No values yet');
    expect(el.querySelector('canvas')).toBeNull();
  });

  it('shows summary, chips, chart and a table alternative, and keeps the choices per device', async () => {
    cats.cats = [{ id: 'w', name: 'Weight', stateLabel: 'Done', reportable: true }];
    const now = Date.now();
    items.stored = [item('a', 82.4, now - 1000), item('b', 80, now)];
    const el = await open();
    expect(el.querySelector('canvas')!.getAttribute('aria-label')).toBe('Line chart of Weight over time');
    expect(el.querySelector('.summary')!.textContent).toContain('Latest');
    expect(el.querySelectorAll('.fchips')[0].querySelectorAll('button').length).toBe(4);
    expect(el.querySelectorAll('tbody tr').length).toBeGreaterThan(0);
    const all = [...el.querySelectorAll('.chips button')].find((b) => b.textContent!.trim() === 'All') as HTMLElement;
    all.click();
    const weekly = [...el.querySelectorAll('.segmented button')].find((b) => b.textContent!.trim() === 'Weekly') as HTMLElement;
    weekly.click();
    expect(localStorage.getItem('memoit.view.u1.report.period')).toBe('all');
    expect(localStorage.getItem('memoit.view.u1.report.aggregation')).toBe('week');
  });

  it('formats the summary with the Language decimal separator', async () => {
    cats.cats = [{ id: 'w', name: 'Weight', stateLabel: 'Done', reportable: true }];
    items.stored = [item('a', 82.4, Date.now())];
    const el = await open('it');
    expect(el.querySelector('.summary')!.textContent).toContain('82,4');
  });
});
