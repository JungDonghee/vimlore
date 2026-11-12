#!/usr/bin/env python3
"""Deterministic Vim-book corpus builder.

Source books live in books-text/ (gitignored). This script produces:
  books-clean/<slug>.txt          normalized, line-preserving text (local)
  books-index/books.json          metadata + extraction-quality report (committed)
  books-index/quality.json        detailed diagnostics (committed)
  books-index/chunks.jsonl        fixed AI-reading chunks (local; full text)
  books-index/index.sqlite        FTS5 search index (local; full text)
  books-index/INDEX.md            human/AI table of contents (committed)
  books-index/parts.json          audit work units for subagents (committed)

It never rewrites prose. Normalization is limited to encoding/line endings,
Unicode spaces/zero-width characters and control characters; every non-blank
source line maps 1:1 to a clean line, and coverage is asserted.
"""
from __future__ import annotations

import hashlib
import json
import re
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'books-text'
CLEAN = ROOT / 'books-clean'
INDEX = ROOT / 'books-index'
CHUNK_LINES = 120
OVERLAP = 12
PART_LINES = 6000

TITLES = {
    '5-years-of-vim': ('5 Years of Vim', 'Claudio Ribeiro'),
    'gourmet-vim': ('Gourmet Vim Cookbook', 'Igor Irianto'),
    'learning-vi-vim': ('Learning the vi and Vim Editors', 'Arnold Robbins et al.'),
    'modern-vim': ('Modern Vim', 'Drew Neil'),
    'neovim-for-beginners': ('Neovim for Beginners', 'unknown'),
    'practical-vim': ('Practical Vim', 'Drew Neil'),
    'pro-vim': ('Pro Vim', 'Mark McDonnell'),
    'use-vim-like-a-pro': ('Use Vim Like A Pro', 'Tim Ottinger'),
    'vim-101-hacks': ('Vim 101 Hacks', 'Ramesh Natarajan'),
    'vim-reference-guide': ('Vim Reference Guide', 'unknown'),
}

CONTROL = re.compile(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]')
ZERO = re.compile(r'[\u200b-\u200f\u2060\ufeff]')
SPACE = re.compile(r'[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]')
HEADING_PATTERNS = [
    re.compile(r'^(chapter|part|section|appendix)\b', re.I),
    re.compile(r'^\d+(\.\d+)*[.)]?\s+\S'),
    re.compile(r'^[A-Z][A-Z0-9 &:/,.\-]{2,80}$'),
    re.compile(r'^[A-Z][A-Za-z0-9 &:/,\-]{2,80}$'),
]


def normalize_line(line: str) -> tuple[str, dict]:
    flags = {}
    original = line
    if line.startswith('\ufeff'):
        line = line[1:]
        flags['bom'] = 1
    line = line.replace('\r\n', '\n').replace('\r', '\n')
    line = ZERO.sub('', line)
    line = SPACE.sub(' ', line)
    line = line.replace('\t', '    ')
    line = CONTROL.sub(' ', line)
    line = line.rstrip()
    return line, flags


def heading_score(line: str) -> int:
    s = line.strip()
    if not s or len(s) > 100 or len(s.split()) > 14:
        return 0
    if s[-1:] in '.!?;:,':
        return 0
    if s.startswith(('|', '>', '//', '#!', '$ ', '=>')):
        return 0
    if any(p.search(s) for p in HEADING_PATTERNS):
        return 2 if re.match(r'^(chapter|part|section|appendix)\b', s, re.I) else 1
    return 0


def main() -> None:
    CLEAN.mkdir(exist_ok=True)
    INDEX.mkdir(exist_ok=True)
    (INDEX / 'agent-parts').mkdir(exist_ok=True)
    books = []
    quality = {}
    chunks = []
    parts = []
    for src in sorted(SRC.glob('*.txt')):
        slug = src.stem
        raw = src.read_bytes()
        text = raw.decode('utf-8-sig')
        raw_lines = text.replace('\r\n', '\n').replace('\r', '\n').split('\n')
        clean_lines = []
        flags = {'bom': 0, 'control': 0, 'zero_width': 0, 'nbsp': 0}
        for line in raw_lines:
            clean, f = normalize_line(line)
            clean_lines.append(clean)
            flags['bom'] += f.get('bom', 0)
            flags['control'] += len(CONTROL.findall(line))
            flags['zero_width'] += len(ZERO.findall(line))
            flags['nbsp'] += len(SPACE.findall(line))
        clean_text = '\n'.join(clean_lines) + ('\n' if text.endswith('\n') else '')
        # 1:1 line coverage, no source line dropped or created.
        assert len(clean_lines) == len(raw_lines), (slug, len(clean_lines), len(raw_lines))
        clean_path = CLEAN / f'{slug}.txt'
        clean_path.write_text(clean_text, encoding='utf-8')
        sha = hashlib.sha256(clean_text.encode()).hexdigest()
        nonempty = [i + 1 for i, l in enumerate(clean_lines) if l.strip()]
        title, author = TITLES.get(slug, (clean_lines[0].strip() or slug, 'unknown'))
        headings = []
        for i, line in enumerate(clean_lines):
            score = heading_score(line)
            if score:
                headings.append({'line': i + 1, 'title': line.strip(), 'score': score})
        # Chapter-label continuity catches truncated extractions (e.g. a book
        # that begins at c0 then jumps to c119).
        labels = sorted({int(m.group(1)) for l in clean_lines if (m := re.match(r'^c(\d+)\s*$', l.strip()))})
        gaps = []
        if labels:
            for a, b in zip(labels, labels[1:]):
                if b > a + 1:
                    gaps.append([a, b])
        # Repeated lines are often page headers/footers; report only.
        from collections import Counter
        counts = Counter(l.strip() for l in clean_lines if l.strip())
        repeated = [{'text': t, 'count': n} for t, n in counts.most_common(8) if n >= 5 and len(t) < 100]
        q = {
            'source': str(src.relative_to(ROOT)),
            'lines': len(clean_lines),
            'chars': len(clean_text),
            'sha256': sha,
            'nonempty_lines': len(nonempty),
            'blank_lines': len(clean_lines) - len(nonempty),
            'replacement_chars': clean_text.count('\ufffd'),
            'control_chars': flags['control'],
            'zero_width': flags['zero_width'],
            'nbsp': flags['nbsp'],
            'tabs': text.count('\t'),
            'crlf': raw.count(b'\r\n'),
            'very_long_lines': sum(1 for l in clean_lines if len(l) > 400),
            'hyphen_endings': sum(1 for l in clean_lines if re.search(r'[A-Za-z]-$', l)),
            'question_runs': clean_text.count('???'),
            'repeated_lines': repeated,
            'headings': len(headings),
            'chapter_labels': labels,
            'chapter_label_gaps': gaps,
            'partial_source': bool(gaps),
            'needs_review': bool(flags['control'] or clean_text.count('\ufffd') or text.count('\t') > 100 or any(len(l) > 400 for l in clean_lines) or gaps),
        }
        quality[slug] = q
        books.append({'slug': slug, 'title': title, 'author': author, 'file': f'books-clean/{slug}.txt', 'source': q['source'], 'lines': q['lines'], 'chars': q['chars'], 'sha256': sha, 'headings': len(headings), 'needs_review': q['needs_review'], 'partial_source': q['partial_source'], 'chapter_label_gaps': gaps})
        # stable chunks, with line ranges and nearest preceding heading
        for start in range(0, len(clean_lines), CHUNK_LINES - OVERLAP):
            end = min(len(clean_lines), start + CHUNK_LINES)
            if end <= start:
                continue
            best = None
            for h in headings:
                if h['line'] - 1 <= start:
                    best = h
                else:
                    break
            chunks.append({'id': f'{slug}-{start + 1:05d}-{end:05d}', 'book': slug, 'start': start + 1, 'end': end, 'heading': best['title'] if best else '', 'text': '\n'.join(clean_lines[start:end])})
            if end == len(clean_lines):
                break
        for start in range(0, len(clean_lines), PART_LINES):
            end = min(len(clean_lines), start + PART_LINES)
            part_lines = clean_lines[start:end]
            psha = hashlib.sha256('\n'.join(part_lines).encode()).hexdigest()
            parts.append({'id': f'{slug}-audit-{start // PART_LINES + 1:02d}', 'book': slug, 'start': start + 1, 'end': end, 'sha256': psha})
    # Coverage is an invariant, not a hope: chunks and audit parts must cover
    # every clean line index at least once.
    covered_chunks = set()
    for c in chunks:
        covered_chunks.update((c['book'], i) for i in range(c['start'], c['end'] + 1))
    covered_parts = set()
    for p in parts:
        covered_parts.update((p['book'], i) for i in range(p['start'], p['end'] + 1))
    total_lines = sum(b['lines'] for b in books)
    expected = set()
    for b in books:
        expected.update((b['slug'], i) for i in range(1, b['lines'] + 1))
    assert covered_chunks == expected, (len(covered_chunks), len(expected))
    assert covered_parts == expected, (len(covered_parts), len(expected))
    coverage = {
        'books': len(books),
        'source_lines': total_lines,
        'chunk_covered_lines': len(covered_chunks),
        'part_covered_lines': len(covered_parts),
        'chunks': len(chunks),
        'parts': len(parts),
        'complete': covered_chunks == expected and covered_parts == expected,
    }
    (INDEX / 'coverage.json').write_text(json.dumps(coverage, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (INDEX / 'books.json').write_text(json.dumps(books, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (INDEX / 'quality.json').write_text(json.dumps(quality, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (INDEX / 'parts.json').write_text(json.dumps(parts, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    with (INDEX / 'chunks.jsonl').open('w', encoding='utf-8') as f:
        for c in chunks:
            f.write(json.dumps(c, ensure_ascii=False) + '\n')
    db = INDEX / 'index.sqlite'
    if db.exists():
        db.unlink()
    con = sqlite3.connect(db)
    con.execute('create virtual table chunks using fts5(id UNINDEXED, book UNINDEXED, start UNINDEXED, end UNINDEXED, heading, text)')
    con.executemany('insert into chunks(id,book,start,end,heading,text) values (?,?,?,?,?,?)', [(c['id'], c['book'], c['start'], c['end'], c['heading'], c['text']) for c in chunks])
    con.commit()
    con.close()
    # human + AI TOC: headings with exact line ranges, grouped by book
    md = ['# Vim book corpus index', '', '> Generated by `tools/books/build_corpus.py`. Full text is local-only and gitignored;', '> only this metadata index is committed. Line numbers refer to `books-clean/<slug>.txt`.', '', '| book | lines | chunks | candidate headings | review |', '|---|---:|---:|---:|---|']
    chunk_counts = {b['slug']: 0 for b in books}
    for c in chunks:
        chunk_counts[c['book']] += 1
    for b in books:
        q = quality[b['slug']]
        md.append(f"| {b['title']} (`{b['slug']}`) | {b['lines']} | {chunk_counts[b['slug']]} | {b['headings']} | {'⚠ review' if q['needs_review'] else 'ok'} |")
        if q['partial_source']:
            md.append(f"| ↳ | | | | **source appears partial**: chapter label gaps {q['chapter_label_gaps'][:3]} |")
    audit_path = INDEX / 'agent-audit.json'
    audit = json.loads(audit_path.read_text(encoding='utf-8')) if audit_path.exists() else None
    md += ['', '## Headings', '']
    if audit:
        md.append('Evidence-validated subagent headings: every cited line matches `books-clean/`. These are candidates, not a publisher ToC.')
        md.append('')
        by_book = {}
        for h in audit['headings']:
            by_book.setdefault(h['book'], []).append(h)
        for b in books:
            q = quality[b['slug']]
            md.append(f"### {b['title']}")
            md.append('')
            if q['partial_source']:
                md.append(f"- **SOURCE APPEARS PARTIAL**: chapter-label gaps {q['chapter_label_gaps'][:3]}")
            if q['needs_review']:
                md.append(f"- extraction review: control={q['control_chars']} replacement={q['replacement_chars']} tabs={q['tabs']} long={q['very_long_lines']}")
            for h in by_book.get(b['slug'], []):
                md.append(f"- {h['line']}: {h['title']}")
            md.append('')
        problems = audit.get('problems', [])
        md += ['## Audited defects', '', f'{len(problems)} extraction defects flagged by the subagents; see `agent-audit.json` for exact line/evidence. These are not silently corrected.', '']
        for p in problems[:80]:
            md.append(f"- {p['book']}:{p['line']} [{p['kind']}] {p['evidence'][:120]}")
        if len(problems) > 80:
            md.append(f'- … {len(problems) - 80} more; see agent-audit.json')
        audit_md = ['# Book audit report', '', f'- evidence-validated headings: {len(audit["headings"])}', f'- flagged extraction defects: {len(problems)}', f'- rejected evidence mismatches: {len(audit.get("rejected", []))}', '']
        if audit.get('rejected'):
            audit_md += ['## Rejected (evidence did not match)', ''] + [f'- {r}' for r in audit['rejected'][:20]]
        kinds = {}
        for p in problems:
            kinds[p['kind']] = kinds.get(p['kind'], 0) + 1
        audit_md += ['## Problem kinds', ''] + [f'- {k}: {v}' for k, v in sorted(kinds.items())] + ['']
        audit_md += ['## Partial source', '']
        for b in books:
            if b.get('partial_source'):
                audit_md.append(f"- {b['slug']}: chapter-label gaps {b['chapter_label_gaps'][:5]}")
        (INDEX / 'AUDIT.md').write_text('\n'.join(audit_md) + '\n', encoding='utf-8')
    else:
        md.append('No subagent audit yet; deterministic candidates only. Run the audit workflow then rebuild.')
        for b in books:
            q = quality[b['slug']]
            lines = (CLEAN / f"{b['slug']}.txt").read_text(encoding='utf-8').split('\n')
            hs = [(i + 1, line.strip()) for i, line in enumerate(lines) if heading_score(line)]
            md.append(f"### {b['title']}")
            md.append('')
            for ln, h in hs[:80]:
                md.append(f'- {ln}: {h}')
            md.append('')
    (INDEX / 'INDEX.md').write_text('\n'.join(md) + '\n', encoding='utf-8')
    print(f'books={len(books)} chunks={len(chunks)} parts={len(parts)}')
    print(f'coverage: {len(covered_chunks)}/{total_lines} chunk lines, {len(covered_parts)}/{total_lines} part lines')
    print('coverage: every source line has exactly one clean line')
    print('review:', [b['slug'] for b in books if b['needs_review']])


if __name__ == '__main__':
    main()
