#!/usr/bin/env python3
"""Fast priority-book navigation: toc / chapter / tip."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
P = ROOT / 'books-index' / 'priority'


def load(slug: str) -> dict:
    path = P / f'{slug}.json'
    if not path.exists():
        raise SystemExit(f'unknown priority book {slug}')
    return json.loads(path.read_text(encoding='utf-8'))


def main() -> None:
    if len(sys.argv) < 3:
        print(__doc__)
        raise SystemExit("usage: priority.py toc <slug> | chapter <slug> <n> | tip <slug> <n>")
    cmd, slug = sys.argv[1], sys.argv[2]
    d = load(slug)
    lines = (ROOT / 'books-clean' / f'{slug}.txt').read_text(encoding='utf-8').split('\n')
    if cmd == 'toc':
        print(f"# {slug}: {d['lines']} lines")
        for c in d['chapters']:
            print(f"CH {c['number']:2d}  {c['line']:6d}-{c['end']:<6d}  {c['title']}")
        print('\nTIPS')
        for t in d['tips']:
            print(f"TIP {t['number']:3d}  {t['line']:6d}-{t['end']:<6d}  {t['title']}")
        return
    if cmd == 'chapter':
        n = int(sys.argv[3])
        c = next((x for x in d['chapters'] if x['number'] == n), None)
        if not c:
            raise SystemExit('no such chapter')
        start, end = c['line'], c['end']
        print(f"# {slug} ch {n}: {c['title']} ({start}-{end})")
    elif cmd == 'tip':
        n = int(sys.argv[3])
        t = next((x for x in d['tips'] if x['number'] == n), None)
        if not t:
            raise SystemExit('no such tip')
        start, end = t['line'], t['end']
        print(f"# {slug} tip {n}: {t['title']} ({start}-{end})")
    else:
        raise SystemExit('unknown command')
    for i in range(start, end + 1):
        print(f'{i:6d}  {lines[i-1]}')


if __name__ == '__main__':
    main()
