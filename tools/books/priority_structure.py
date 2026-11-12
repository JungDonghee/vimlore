#!/usr/bin/env python3
"""Build the priority index for Drew Neil's Practical Vim and Modern Vim.

These two books are the curriculum's primary pillars. This script extracts the
real Part/Chapter/Tip boundaries from the normalized text (the early "Tip N."
lines are ToC entries; the body uses "Tip NTitle" because tables/headings were
flattened by extraction). Every line reference is 1-based and local.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLEAN = ROOT / 'books-clean'
OUT = ROOT / 'books-index' / 'priority'
PRIORITY = ['practical-vim', 'modern-vim']


def next_nonempty(lines: list[str], i: int) -> tuple[int, str]:
    j = i + 1
    while j < len(lines) and not lines[j].strip():
        j += 1
    return j, lines[j].strip() if j < len(lines) else ''


def parse(slug: str) -> dict:
    lines = (CLEAN / f'{slug}.txt').read_text(encoding='utf-8').split('\n')
    parts, chapters, tips = [], [], []
    for i, raw in enumerate(lines):
        s = raw.strip()
        m = re.match(r'^Part\s+(\d+)$', s)
        if m:
            j, title = next_nonempty(lines, i)
            if title and not title.startswith('Copyright'):
                parts.append({'number': int(m.group(1)), 'title': title, 'line': i + 1})
        if re.match(r'^Chapter$', s):
            j, num = next_nonempty(lines, i)
            k, title = next_nonempty(lines, j)
            if re.match(r'^\d+$', num) and title:
                chapters.append({'number': int(num), 'title': title, 'line': i + 1})
        m = re.match(r'^Tip\s+(\d+)([A-Z].*)$', s)
        if m:
            tips.append({'number': int(m.group(1)), 'title': m.group(2).strip(), 'line': i + 1})
    # De-duplicate exact structural entries (page headers can repeat).
    def dedupe(items):
        seen, out = set(), []
        for x in items:
            key = (x.get('number'), x.get('line'), x.get('title'))
            if key not in seen:
                seen.add(key); out.append(x)
        return out
    parts, chapters, tips = dedupe(parts), dedupe(chapters), dedupe(tips)
    # Ranges: next structural boundary of the same kind, or end of book.
    def add_end(items):
        for n, x in enumerate(items):
            x['end'] = (items[n + 1]['line'] - 1) if n + 1 < len(items) else len(lines)
    add_end(parts); add_end(chapters); add_end(tips)
    # Map each tip to the nearest preceding chapter and part.
    for t in tips:
        t['chapter'] = next((c['number'] for c in reversed(chapters) if c['line'] <= t['line']), None)
        t['part'] = next((p['number'] for p in reversed(parts) if p['line'] <= t['line']), None)
    return {'slug': slug, 'lines': len(lines), 'parts': parts, 'chapters': chapters, 'tips': tips}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    all_data = {}
    for slug in PRIORITY:
        d = parse(slug)
        all_data[slug] = d
        (OUT / f'{slug}.json').write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    md = ['# Priority books — Drew Neil', '', 'These two are the curriculum pillars. Line numbers refer to `books-clean/<slug>.txt`.', '', '## At a glance', '', '| book | lines | parts | chapters | tips |', '|---|---:|---:|---:|---:|']
    for slug, d in all_data.items():
        md.append(f"| {slug} | {d['lines']} | {len(d['parts'])} | {len(d['chapters'])} | {len(d['tips'])} |")
    for slug, d in all_data.items():
        md += ['', f'## {slug}', '', '### Chapters', '']
        for c in d['chapters']:
            md.append(f"- Ch {c['number']}: {c['title']} — {c['line']}–{c['end']}")
        md += ['', '### Tips', '']
        for t in d['tips']:
            ch = f" (ch {t['chapter']})" if t['chapter'] else ''
            md.append(f"- Tip {t['number']}: {t['title']}{ch} — {t['line']}–{t['end']}")
    (OUT / 'PRIORITY.md').write_text('\n'.join(md) + '\n', encoding='utf-8')
    for slug, d in all_data.items():
        print(slug, 'chapters', len(d['chapters']), 'tips', len(d['tips']), 'parts', len(d['parts']))
        print('  first/last tip', d['tips'][0], d['tips'][-1])


if __name__ == '__main__':
    main()
