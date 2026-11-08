import { TestBed } from '@angular/core/testing';
import { LanguageService } from './language.service';
import { STRINGS } from './strings';

function leaves(o: object, prefix = ''): [string, unknown][] {
  return Object.entries(o).flatMap(([k, v]): [string, unknown][] =>
    typeof v === 'object' ? leaves(v as object, `${prefix}${k}.`) : [[`${prefix}${k}`, v]],
  );
}

describe('strings', () => {
  it('en and it define the same non-empty keys', () => {
    const en = leaves(STRINGS.en);
    const it_ = leaves(STRINGS.it);
    expect(it_.map(([k]) => k).sort()).toEqual(en.map(([k]) => k).sort());
    for (const [, v] of [...en, ...it_]) {
      expect(String(v).length).toBeGreaterThan(0);
    }
  });
});

describe('LanguageService', () => {
  it('defaults to English and keeps <html lang> in sync', () => {
    const svc = TestBed.inject(LanguageService);
    TestBed.tick();
    expect(svc.language()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(svc.strings().login.submit).toBe('Sign in');
    svc.language.set('it');
    TestBed.tick();
    expect(document.documentElement.lang).toBe('it');
    expect(svc.strings().login.submit).toBe('Accedi');
  });
});
