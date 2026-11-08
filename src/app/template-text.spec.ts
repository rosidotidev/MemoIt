import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const TAG = /<\/?[a-zA-Z][^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*>/g;
const LITERAL_ATTR = /(?<=\s)(aria-label|placeholder|title|alt)="([^"]*)"/g;

/** Returns the violations found in one template (literal text nodes and literal text attributes). */
function scanTemplate(template: string): string[] {
  const found: string[] = [];
  const noComments = template.replace(/<!--[\s\S]*?-->/g, '');
  for (const m of noComments.matchAll(LITERAL_ATTR)) {
    if (m[2].trim() !== '' && !m[2].includes('{{')) {
      found.push(`literal ${m[1]}="${m[2]}"`);
    }
  }
  const text = noComments
    .replace(TAG, '\n')
    .replace(/\{\{[\s\S]*?\}\}/g, '')
    .replace(/@let\b[^;]*;/g, '')
    .replace(/@(?:else if|if|else|for|switch|case|default|empty|defer|placeholder|loading|error)\b[^{]*\{/g, '')
    .replace(/[{}]/g, '');
  for (const line of text.split('\n')) {
    if (line.trim() !== '') {
      found.push(`literal text "${line.trim()}"`);
    }
  }
  return found;
}

/** Extracts inline `template: '...'` strings from a component file. */
function inlineTemplates(source: string): string[] {
  return [...source.matchAll(/\btemplate\s*:\s*(['"`])((?:\\.|(?!\1)[\s\S])*)\1/g)].map((m) => m[2]);
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
}

describe('template text scan (AD-15e)', () => {
  it('flags literal text nodes', () => {
    expect(scanTemplate('<h1>Hello</h1>')).not.toEqual([]);
    expect(scanTemplate('<p>{{ a }} and more</p>')).not.toEqual([]);
  });

  it('flags literal aria-label, placeholder, title and alt', () => {
    for (const attr of ['aria-label', 'placeholder', 'title', 'alt']) {
      expect(scanTemplate(`<input ${attr}="Name" />`)).not.toEqual([]);
    }
  });

  it('accepts bound text, bound attributes, control flow and empty elements', () => {
    expect(scanTemplate('<h1>{{ s().a }}</h1>')).toEqual([]);
    expect(scanTemplate('<input [attr.aria-label]="s().a" placeholder="{{ s().b }}" />')).toEqual([]);
    expect(scanTemplate('@if (x(); as y) {\n <p>{{ y }}</p>\n} @else {\n <i></i>\n}')).toEqual([]);
    expect(scanTemplate('<button (click)="a > b">{{ c }}</button>')).toEqual([]);
  });

  it('finds inline templates', () => {
    expect(inlineTemplates("@Component({ template: '<p>Hi</p>' })")).toEqual(['<p>Hi</p>']);
  });

  it('finds no literal UI text in any app template', () => {
    const files = walk(join(process.cwd(), 'src', 'app')).filter((f) => !f.endsWith('.spec.ts'));
    const violations: string[] = [];
    let scanned = 0;
    for (const f of files) {
      const templates = f.endsWith('.html')
        ? [readFileSync(f, 'utf8')]
        : f.endsWith('.ts')
          ? inlineTemplates(readFileSync(f, 'utf8'))
          : [];
      for (const t of templates) {
        scanned++;
        violations.push(...scanTemplate(t).map((v) => `${f}: ${v}`));
      }
    }
    expect(scanned).toBeGreaterThan(0);
    expect(violations).toEqual([]);
  });
});
