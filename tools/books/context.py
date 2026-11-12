#!/usr/bin/env python3
"""AI-friendly reader/search over the local Vim book corpus.

  python3 tools/books/context.py search "text object"
  python3 tools/books/context.py read practical-vim 1200 1240
  python3 tools/books/context.py toc practical-vim
  python3 tools/books/context.py stats

Full text stays in books-clean/ (gitignored). The committed index contains
metadata/headings only.
"""
from __future__ import annotations

import json
import re
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
INDEX = ROOT / 'books-index'
CLEAN = ROOT / 'books-clean'


def books() -> list[dict]:
    return json.loads((INDEX / 'books.json').read_text(encoding='utf-8'))


def find_book(slug: str) -> dict:
    for b in books():
        if b['slug'] == slug:
            return b
    raise SystemExit(f'unknown book: {slug}\nknown: ' + ', '.join(b['slug'] for b in books()))


def search(query: str, book: str | None = None, limit: int = 10) -> None:
    terms = re.findall(r'[A-Za-z0-9_]+', query)
    if not terms:
        raise SystemExit('empty query')
    fts = ' AND '.join(f'"{t}"' for t in terms)
    db = sqlite3.connect(INDEX / 'index.sqlite')
    sql = 'select book,start,end,heading,snippet(chunks,5,\'…\',\'…\',\'…\',24) from chunks where chunks match ?'
    params: list[object] = [fts]
    if book:
        sql += ' and book = ?'
        params.append(book)
    sql += ' limit ?'
    params.append(limit)
    try:
        rows = db.execute(sql, params).fetchall()
    except sqlite3.OperationalError:
        # A malformed user query must not crash the reader; use literal LIKE.
        like = '%' + terms[0] + '%'
        sql = 'select book,start,end,heading,substr(text,1,260) from chunks where text like ?'
        params = [like]
        if book:
            sql += ' and book = ?'
            params.append(book)
        sql += ' limit ?'
        params.append(limit)
        rows = db.execute(sql, params).fetchall()
    db.close()
    if not rows:
        print('no matches')
        return
    for b, start, end, heading, snip in rows:
        print(f'[{b}:{start}-{end}] {heading}')
        print('  ' + re.sub(r'\s+', ' ', snip).strip())
        print(f'  read: npm run books:read -- {b} {start} {end}')


def read(slug: str, start: int, end: int | None = None) -> None:
    b = find_book(slug)
    end = end or start + 60
    start = max(1, start)
    end = min(b['lines'], end)
    if end < start:
        raise SystemExit('end before start')
    lines = (CLEAN / f'{slug}.txt').read_text(encoding='utf-8').split('\n')
    print(f'# {b["title"]} ({slug}) lines {start}-{end}')
    for i in range(start, end + 1):
        print(f'{i:6d}  {lines[i-1]}')


def toc(slug: str) -> None:
    b = find_book(slug)
    # Prefer the audited headings if present; fall back to deterministic candidates.
    audit = INDEX / 'agent-audit.json'
    if audit.exists():
        data = json.loads(audit.read_text(encoding='utf-8'))
        hs = [h for h in data.get('headings', []) if h.get('book') == slug and h.get('valid')]
        if hs:
            print(f'# {b["title"]} — audited headings')
            for h in hs:
                print(f'{h["line"]:6d}  {h["title"]}')
            return
    print(f'# {b["title"]} — deterministic heading candidates (not publisher-verified)')
    idx = (INDEX / 'INDEX.md').read_text(encoding='utf-8').split('\n')
    inside = False
    for line in idx:
        if line.startswith(f'### {b["title"]}'):
            inside = True
            continue
        if inside and line.startswith('### '):
            break
        if inside and line.startswith('- '):
            print(line[2:])


def stats() -> None:
    for b in books():
        print(f'{b["slug"]:24} {b["lines"]:6d} lines  {b["headings"]:5d} headings  {"REVIEW" if b["needs_review"] else "ok"}  {b["title"]}')


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        return
    cmd = sys.argv[1]
    if cmd == 'search':
        if len(sys.argv) < 3:
            raise SystemExit('usage: search QUERY')
        book = None
        args = sys.argv[3:]
        if '--book' in args:
            book = args[args.index('--book') + 1]
        search(sys.argv[2], book)
    elif cmd == 'read':
        if len(sys.argv) < 4:
            raise SystemExit('usage: read SLUG START [END]')
        read(sys.argv[2], int(sys.argv[3]), int(sys.argv[4]) if len(sys.argv) > 4 else None)
    elif cmd == 'toc':
        if len(sys.argv) < 3:
            raise SystemExit('usage: toc SLUG')
        toc(sys.argv[2])
    elif cmd == 'stats':
        stats()
    else:
        raise SystemExit(f'unknown command {cmd}')


if __name__ == '__main__':
    main()
