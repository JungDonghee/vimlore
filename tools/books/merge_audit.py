#!/usr/bin/env python3
"""Validate subagent book-audit JSON and merge it into agent-audit.json.

Every heading/problem must cite an exact evidence line at the cited 1-based
line of books-clean/<book>.txt. Invalid entries are rejected, not silently
trusted.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
INDEX = ROOT / 'books-index'
CLEAN = ROOT / 'books-clean'


def main() -> None:
    books = {b['slug']: b for b in json.loads((INDEX / 'books.json').read_text(encoding='utf-8'))}
    headings = []
    problems = []
    summaries = []
    rejected = []
    for p in sorted((INDEX / 'agent-parts').glob('*.json')):
        try:
            d = json.loads(p.read_text(encoding='utf-8'))
            slug = d['book']
            b = books[slug]
            lines = (CLEAN / f'{slug}.txt').read_text(encoding='utf-8').split('\n')
        except Exception as e:
            rejected.append({'file': p.name, 'why': f'unreadable: {e}'})
            continue
        start, end = int(d.get('start', 1)), int(d.get('end', b['lines']))
        def evidence_ok(line: int, evidence: str) -> bool:
            return 1 <= line <= len(lines) and lines[line - 1].strip() == (evidence or '').strip() and start <= line <= end
        for h in d.get('headings', []):
            if evidence_ok(int(h.get('line', 0)), h.get('evidence', '')):
                headings.append({'book': slug, 'line': int(h['line']), 'title': h.get('title', '').strip(), 'evidence': h['evidence'].strip(), 'valid': True})
            else:
                rejected.append({'file': p.name, 'kind': 'heading', 'entry': h})
        for q in d.get('problems', []):
            if evidence_ok(int(q.get('line', 0)), q.get('evidence', '')):
                problems.append({'book': slug, 'line': int(q['line']), 'kind': q.get('kind', ''), 'evidence': q['evidence'].strip(), 'valid': True})
            else:
                rejected.append({'file': p.name, 'kind': 'problem', 'entry': q})
        if d.get('summary'):
            summaries.append({'book': slug, 'start': start, 'end': end, 'summary': d['summary']})
    # Overlapping audit units may report the same heading/problem. Dedupe by
    # location+evidence, keeping one validated record.
    uniq = {}
    for h in headings:
        uniq[(h['book'], h['line'], h['title'], h['evidence'])] = h
    headings = sorted(uniq.values(), key=lambda h: (h['book'], h['line']))
    uniq = {}
    for q in problems:
        uniq[(q['book'], q['line'], q['kind'], q['evidence'])] = q
    problems = sorted(uniq.values(), key=lambda h: (h['book'], h['line']))
    out = {'generatedBy': 'tools/books/merge_audit.py', 'headings': headings, 'problems': problems, 'summaries': summaries, 'rejected': rejected}
    (INDEX / 'agent-audit.json').write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'headings={len(headings)} problems={len(problems)} rejected={len(rejected)}')
    if rejected:
        print('REJECTED evidence mismatches (first 5):')
        for r in rejected[:5]:
            print(' ', r)


if __name__ == '__main__':
    main()
