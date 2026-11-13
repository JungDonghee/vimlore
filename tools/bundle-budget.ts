/**
 * Hard bundle budget. The stretch goal stays near 200 kB raw / 70 kB gzip, but
 * this ceiling is the line that fails CI: future features must pay for
 * themselves or the budget must be raised deliberately in the same commit.
 *
 * Raised to 320,000 raw / 100,000 gzip on 2026-11-13 for the KIRITSU rebrand:
 * inline Yuji Boku 規律 + ghost 起立 outlines, title copy, seal icon plumbing and
 * the story-first slices. Measured 293,206 raw / 94,115 gzip at the raise.
 *
 * MAX_RAW is the deterministic hard gate. MAX_GZIP carries a measured ~1 kB
 * allowance because the same dist compresses differently across zlib builds:
 * local Fedora Node uses zlib-ng, CI's Node uses stock zlib (83,398 vs 84,201
 * on 2026-11-11). Do not remove the allowance without re-measuring both.
 */
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

export const MAX_RAW = 320_000;
export const MAX_GZIP = 100_000;
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
