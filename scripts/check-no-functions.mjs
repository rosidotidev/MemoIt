import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const dir = resolve(process.cwd(), 'functions');
if (existsSync(dir)) {
  console.error('check failed: a functions/ directory exists. MemoIt has no server code (AD-3, NFR7).');
  process.exit(1);
}
console.log('check-no-functions: ok');
