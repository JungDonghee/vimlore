#!/usr/bin/env python3
"""Validate and merge the priority chapter audits for Practical Vim / Modern Vim."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
INDEX = ROOT / 'books-index'
CLEAN = ROOT / 'books-clean'
OUT = INDEX / 'priority'


def main() -> None:
    chapters = []
    for slug in ('practical-vim', 'modern-vim'):
        d = json.loads((OUT / f'{slug}.json').read_text(encoding='utf-8'))
        chapters += [dict(c, book=slug, id=f'{slug}-ch{c["number"]:02d}', start=c['line'], end=c['end']) for c in d['chapters']]
    by_id = {f'{c["book"]}-ch{c["number"]:02d}': c for c in chapters}
    merged = []
    rejected = []
    for p in sorted((OUT / 'audit').glob('*.json')):
        try:
            d = json.loads(p.read_text(encoding='utf-8'))
            c = by_id[d['id']]
            lines = (CLEAN / f'{c["book"]}.txt').read_text(encoding='utf-8').split('\n')
        except Exception as e:
            rejected.append({'file': p.name, 'why': f'unreadable: {e}'})
            continue
        def ok(line, evidence):
            try:
                line = int(line)
            except Exception:
                return False
            return c['start'] <= line <= c['end'] and 1 <= line <= len(lines) and lines[line - 1].strip() == (evidence or '').strip()
        commands, concepts, problems = [], [], []
        for x in d.get('commands', []):
            if ok(x.get('line'), x.get('evidence')) and x.get('keys'):
                commands.append({'keys': x['keys'].strip(), 'meaning': x.get('meaning', '').strip(), 'line': int(x['line']), 'evidence': x['evidence'].strip()})
            else:
                rejected.append({'file': p.name, 'kind': 'command', 'entry': x})
        for x in d.get('concepts', []):
            if ok(x.get('line'), x.get('evidence')) and x.get('name'):
                concepts.append({'name': x['name'].strip(), 'line': int(x['line']), 'evidence': x['evidence'].strip()})
            else:
                rejected.append({'file': p.name, 'kind': 'concept', 'entry': x})
        for x in d.get('problems', []):
            if ok(x.get('line'), x.get('evidence')):
                problems.append({'line': int(x['line']), 'kind': x.get('kind', ''), 'evidence': x['evidence'].strip(), 'note': x.get('note', '').strip()})
            else:
                rejected.append({'file': p.name, 'kind': 'problem', 'entry': x})
        merged.append({'id': c['id'], 'book': c['book'], 'chapter': c['number'], 'title': c['title'], 'start': c['start'], 'end': c['end'], 'summary': d.get('summary', '').strip(), 'commands': commands, 'concepts': concepts, 'problems': problems})
    merged.sort(key=lambda x: (x['book'], x['chapter']))
    out = {'generatedBy': 'tools/books/priority_merge.py', 'chapters': merged, 'rejected': rejected}
    (OUT / 'audit.json').write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    md = ['# Priority books — chapter audit', '', 'Drew Neil, Practical Vim 2e and Modern Vim. Every command/concept/problem line is evidence-validated.', '']
    for c in merged:
        md += [f"## {c['book']} — Ch {c['chapter']}: {c['title']} ({c['start']}–{c['end']})", '', c['summary'] or '_no summary_', '']
        if c['commands']:
            md += ['| keys | meaning | citation |', '|---|---|---|']
            for x in c['commands']:
                md.append(f"| `{x['keys']}` | {x['meaning']} | {c['book']}:{x['line']} |")
            md.append('')
        if c['concepts']:
            md += ['Concepts: ' + '; '.join(f"{x['name']} ({x['line']})" for x in c['concepts']), '']
        if c['problems']:
            md += ['Defects: ' + '; '.join(f"{x['kind']}@{x['line']}" for x in c['problems']), '']
    md += ['## Rejected evidence mismatches', '', f'{len(rejected)} entries rejected by exact-line validation.', '']
    for r in rejected[:30]:
        md.append(f'- {r}')
    (OUT / 'PRIORITY_AUDIT.md').write_text('\n'.join(md) + '\n', encoding='utf-8')
    print(f'chapters={len(merged)} commands={sum(len(c["commands"]) for c in merged)} concepts={sum(len(c["concepts"]) for c in merged)} problems={sum(len(c["problems"]) for c in merged)} rejected={len(rejected)}')


if __name__ == '__main__':
    main()
