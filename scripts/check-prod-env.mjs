import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const file = resolve(process.cwd(), 'src/environments/environment.prod.ts');
if (!existsSync(file)) {
  console.error(
    'Production build blocked: src/environments/environment.prod.ts is missing.\n' +
      'Copy src/environments/environment.prod.example.ts to src/environments/environment.prod.ts ' +
      'and fill in your Firebase web app config.',
  );
  process.exit(1);
}
const text = readFileSync(file, 'utf8');
if (/useEmulators:\s*true/.test(text) || /YOUR_/.test(text)) {
  console.error(
    'Production build blocked: environment.prod.ts still has placeholder values (YOUR_...) or useEmulators: true.',
  );
  process.exit(1);
}
