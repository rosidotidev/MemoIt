import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ACCENT_PRESETS, GRAPHIC_PAIRS, TEXT_PAIRS, accentOf, contrast, resolveScheme, tokensFor } from './theme';

const SCHEMES = ['light', 'dark'] as const;
const accents = [
  ...ACCENT_PRESETS.map((p) => ({ accent: p.id })),
  ...Array.from({ length: 25 }, (_, i) => i * 15).flatMap((hue) =>
    [0, 0.05, 0.15, 0.3].map((chroma) => ({ accent: 'custom', hue, chroma })),
  ),
];

describe('theme contrast (AA)', () => {
  it('has nine presets', () => {
    expect(ACCENT_PRESETS.length).toBe(9);
  });

  for (const scheme of SCHEMES) {
    it(`text pairs reach 4.5:1 and graphics 3:1 in ${scheme} for every preset and sampled custom hue`, () => {
      const failures: string[] = [];
      for (const a of accents) {
        const t = tokensFor(a, scheme);
        for (const [fg, bg] of TEXT_PAIRS) {
          const r = contrast(t[fg], t[bg]);
          if (r < 4.5) failures.push(`${JSON.stringify(a)} ${fg}/${bg} ${r.toFixed(2)}`);
        }
        for (const [fg, bg] of GRAPHIC_PAIRS) {
          const r = contrast(t[fg], t[bg]);
          if (r < 3) failures.push(`${JSON.stringify(a)} graphic ${fg}/${bg} ${r.toFixed(2)}`);
        }
      }
      expect(failures).toEqual([]);
    });
  }
});

describe('theme tokens', () => {
  it('never lets error and High (tertiary) colors follow the accent', () => {
    for (const scheme of SCHEMES) {
      const base = tokensFor({ accent: 'indigo' }, scheme);
      for (const a of accents) {
        const t = tokensFor(a, scheme);
        for (const k of ['error', 'error-container', 'on-error-container', 'tertiary-container', 'on-tertiary-container']) {
          expect(t[k]).toBe(base[k]);
        }
      }
    }
  });

  it('recolors with the accent and differs by scheme', () => {
    expect(tokensFor({ accent: 'green' }, 'light')['primary']).not.toBe(tokensFor({ accent: 'rose' }, 'light')['primary']);
    expect(tokensFor({ accent: 'green' }, 'light')['surface']).not.toBe(tokensFor({ accent: 'green' }, 'dark')['surface']);
  });

  it('clamps custom values and falls back to indigo for unknown ids', () => {
    expect(accentOf({ accent: 'custom', hue: 999, chroma: 5 })).toEqual({ hue: 360, chroma: 0.3 });
    expect(accentOf({ accent: 'nope' })).toEqual(accentOf({ accent: 'indigo' }));
  });

  it('ignores non-finite custom values', () => {
    expect(accentOf({ accent: 'custom', hue: NaN, chroma: 0.1 })).toEqual(accentOf({ accent: 'indigo' }));
  });

  it('system follows the OS preference', () => {
    expect(resolveScheme('system', true)).toBe('dark');
    expect(resolveScheme('system', false)).toBe('light');
    expect(resolveScheme('light', true)).toBe('light');
  });
});

describe('no color literals in components', () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
    );
  const LITERAL = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|hwb)\(/;

  it('uses tokens only', () => {
    const files = walk('src/app').filter(
      (f) => /\.(ts|css|html)$/.test(f) && !/\.spec\.ts$|\.testing\.ts$/.test(f) && !/shared[\\/]theme\.ts$/.test(f),
    );
    const bad = files.filter((f) => LITERAL.test(readFileSync(f, 'utf8')));
    expect(bad).toEqual([]);
  });
});
