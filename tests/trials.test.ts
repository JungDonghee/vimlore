import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateTrial, dailySeed, mulberry32, TRIAL_SKILLS } from '../src/core/game/trials.ts';
import { Session } from '../src/core/game/session.ts';
import { tokenize } from '../src/core/vim/keys.ts';

test('every generated trial is solvable in exactly its par', () => {
  for (let i = 0; i < 60; i++) {
    const t = generateTrial(1000 + i * 37);
    const keys = tokenize(t.stage.solution ?? '');
    assert.ok(keys.length > 0, `seed ${t.seed} has a solution`);
    assert.equal(keys.length, t.stage.par, `seed ${t.seed} par`);
    const s = new Session({ stage: t.stage, chapterIndex: 0, allowed: new Set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~ '.split('')) });
    for (const k of keys) s.feed(k);
    assert.equal(s.status, 'won', `seed ${t.seed} wins`);
  }
});

test('seeded generation is deterministic', () => {
  const a = generateTrial(4242);
  const b = generateTrial(4242);
  assert.equal(a.stage.text, b.stage.text);
  assert.equal(a.stage.solution, b.stage.solution);
});

test('every skill generator produces at least one verified trial', () => {
  for (const skill of TRIAL_SKILLS) {
    let ok = false;
    for (let i = 0; i < 8 && !ok; i++) {
      const t = generateTrial(i * 991 + 3, skill.id);
      ok = t.skillId === skill.id && t.stage.par > 1;
    }
    assert.ok(ok, `${skill.id} generates`);
  }
});

test('daily seed is stable within a day', () => {
  assert.equal(dailySeed(new Date(2026, 10, 10)), 20261110);
  const rng = mulberry32(7);
  assert.equal(rng(), mulberry32(7)());
});
