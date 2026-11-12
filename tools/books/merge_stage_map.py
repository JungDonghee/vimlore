#!/usr/bin/env python3
"""Validate the 10 chapter stage->book mappings and emit a durable spine map."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CM = ROOT / 'books-index' / 'curriculum-map'
CLEAN = ROOT / 'books-clean'
OUT = ROOT / 'books-index' / 'curriculum-map'


def stage_ids() -> list[str]:
    ids = []
    for p in sorted((ROOT / 'src/content/chapters').glob('c*.ts')):
        if p.name == 'index.ts':
            continue
        s = p.read_text()
        ids += re.findall(r"id: '(c\d+s\d+)'", s)
    return ids


def main() -> None:
    expected = stage_ids()
    tip_struct = {}
    for slug in ('practical-vim', 'modern-vim'):
        d = json.loads((ROOT / 'books-index/priority' / f'{slug}.json').read_text())
        tip_struct[slug] = {t['line']: t for t in d['tips']}
    clean = {p.stem: p.read_text(encoding='utf-8').split('\n') for p in CLEAN.glob('*.txt')}
    stages = []
    rejected = []
    seen = set()
    for p in sorted(CM.glob('ch*.json')):
        d = json.loads(p.read_text())
        for x in d.get('stages', []):
            sid = x.get('stage')
            if sid not in expected or sid in seen:
                rejected.append({'file': p.name, 'kind': 'stage', 'entry': x})
                continue
            seen.add(sid)
            tips = []
            for t in x.get('tips', []):
                line = int(t.get('line', 0)); slug = 'practical-vim'
                ref = tip_struct[slug].get(line)
                ev = (t.get('evidence') or '').strip()
                if ref and ref['number'] == int(t.get('tip', -1)) and 1 <= line <= len(clean[slug]) and clean[slug][line - 1].strip() == ev:
                    tips.append({'book': slug, 'tip': ref['number'], 'line': line, 'title': ref['title'], 'evidence': ev})
                else:
                    rejected.append({'file': p.name, 'kind': 'tip', 'entry': t})
            supp = []
            for s in x.get('supplement', []):
                book = s.get('book'); line = int(s.get('line', 0)); ev = (s.get('evidence') or '').strip()
                if book in clean and 1 <= line <= len(clean[book]) and clean[book][line - 1].strip() == ev:
                    supp.append({'book': book, 'line': line, 'evidence': ev, 'note': s.get('note', '')})
                else:
                    rejected.append({'file': p.name, 'kind': 'supplement', 'entry': s})
            stages.append({'stage': sid, 'tips': tips, 'supplement': supp, 'order': x.get('order', ''), 'note': x.get('note', ''), 'chapterNote': d.get('chapterNote', '')})
    missing = [s for s in expected if s not in seen]
    # Global sequence: Practical tip order is the spine. Compute first tip
    # index for each stage and report decreasing steps.
    seq = []
    for s in stages:
        if s['tips']:
            seq.append((s['stage'], min((t['book'] == 'modern-vim') * 1000 + t['tip'] for t in s['tips'])))
    inversions = [(a[0], b[0], a[1], b[1]) for a, b in zip(seq, seq[1:]) if b[1] < a[1]]
    data = {'generatedBy': 'tools/books/merge_stage_map.py', 'stages': stages, 'missing': missing, 'rejected': rejected, 'inversions': inversions}
    (OUT / 'stages.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    md = ['# Stage → book spine map', '', 'Practical Vim tip order is the intended spine; Modern Vim is the deferred second book. Supplement citations are exact-line checked.', '', f'- stages mapped: {len(stages)}/{len(expected)}', f'- rejected evidence: {len(rejected)}', f'- missing: {len(missing)}', f'- global tip-order inversions: {len(inversions)}', '', '| stage | Practical Vim tips | supplement | order |', '|---|---|---|---|']
    for s in stages:
        tips = ', '.join(f"Tip {t['tip']} ({t['line']})" for t in s['tips']) or '—'
        supp = ', '.join(f"{x['book']}:{x['line']}" for x in s['supplement']) or '—'
        md.append(f"| {s['stage']} | {tips} | {supp} | {s['order']} |")
    md += ['', '## Global inversions', '']
    for a, b, x, y in inversions:
        md.append(f'- {a} (tip {x}) → {b} (tip {y})')
    (OUT / 'STAGE_MAP.md').write_text('\n'.join(md) + '\n', encoding='utf-8')
    print(f'stages={len(stages)} missing={len(missing)} rejected={len(rejected)} inversions={len(inversions)}')
    if rejected:
        print('rejected sample', rejected[:5])


if __name__ == '__main__':
    main()
