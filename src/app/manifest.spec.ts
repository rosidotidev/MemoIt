import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('installable app (PWA manifest)', () => {
  const manifest = JSON.parse(readFileSync(join('public', 'manifest.webmanifest'), 'utf8'));

  it('opens standalone on the Categories screen', () => {
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('./#/categories');
  });

  it('has existing icons including a maskable one', () => {
    for (const icon of manifest.icons) {
      expect(existsSync(join('public', icon.src))).toBe(true);
    }
    expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true);
  });

  it('is linked from index.html and adds no service worker', () => {
    const html = readFileSync(join('src', 'index.html'), 'utf8');
    expect(html).toContain('rel="manifest"');
    expect(readFileSync('angular.json', 'utf8')).not.toContain('serviceWorker');
  });
});
