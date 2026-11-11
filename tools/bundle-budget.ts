/**
 * Hard bundle budget. The stretch goal stays near 200 kB raw / 70 kB gzip, but
 * this ceiling is the line that fails CI: future features must pay for
 * themselves or the budget must be raised deliberately in the same commit.
 */
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const MAX_RAW = 264_000;
const MAX_GZIP = 84_000;
const file = new URL('../dist/vimlore.html', import.meta.url);
const buf = readFileSync(file);
const gz = gzipSync(buf, { level: 9 }).length;
const rawOk = buf.length <= MAX_RAW;
const gzOk = gz <= MAX_GZIP;
console.log(`bundle: ${buf.length} B raw (ceiling ${MAX_RAW}) · ${gz} B gzip (ceiling ${MAX_GZIP})`);
if (!rawOk || !gzOk) {
  console.error('BUNDLE BUDGET EXCEEDED — reduce bytes or raise the ceiling deliberately.');
  process.exit(1);
}
