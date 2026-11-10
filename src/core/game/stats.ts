import type { Progress, StatEntry } from './types.ts';

/** How hard a skill is for this player. Higher = weaker. */
export function weaknessScore(s: StatEntry | undefined): number {
  if (!s || s.attempts === 0) return 1.2; // untried skills are mildly interesting
  const clearRate = s.clears / s.attempts;
  const efficiency = s.par > 0 ? s.keys / s.par : 1;
  const restartRate = s.restarts / Math.max(1, s.attempts);
  return (1 - clearRate) * 1.0 + Math.max(0, efficiency - 1) * 0.8 + restartRate * 0.6;
}

export function recordStat(
  p: Progress,
  skill: string,
  r: { cleared: boolean; keys: number; par: number; restarts?: number },
): void {
  const s = (p.stats[skill] ??= { attempts: 0, clears: 0, restarts: 0, keys: 0, par: 0 });
  s.attempts++;
  if (r.cleared) s.clears++;
  s.restarts += r.restarts ?? 0;
  s.keys += r.keys;
  s.par += r.par;
}

export function weakestSkills(p: Progress, n = 3): string[] {
  return Object.entries(p.stats)
    .map(([k, v]) => ({ k, score: weaknessScore(v) }))
    .filter((x) => x.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.k);
}

export function encodeSave(p: Progress): string {
  const raw = JSON.stringify(p);
  const bytes = new TextEncoder().encode(raw);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/=+$/, '');
}

export function decodeSave(code: string): Progress | null {
  try {
    const bin = atob(code.trim());
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const raw = new TextDecoder().decode(bytes);
    const p = JSON.parse(raw) as Progress;
    if (!p || typeof p !== 'object' || !p.stages) return null;
    return p;
  } catch {
    return null;
  }
}
