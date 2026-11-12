#!/usr/bin/env python3
"""Spellcheck candidate report for the local Vim books.

This is a triage tool, not a corrector. It runs hunspell (if installed) over
prose-like words, removes a Vim/technical allowlist, and reports the remaining
unknown tokens with counts. A word is not "fixed": the source edition is the
authority. Output contains short tokens, not book text.
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
INDEX = ROOT / 'books-index'
CLEAN = ROOT / 'books-clean'
ALLOW = set('''vim neovim vimrc gvim nvim vi ex vimscript viml autocmd autocmds buffer buffers window windows tab tabs split splits register registers macro macros yank yanks visual remap remapping runtime plugin plugins bufferline statusline tree-sitter treesitter lsp quickfix terminal terminal buffers jumplist changelist tagfile tags ctags cscope grep vimgrep substitution substitute commandline command-line insert normal visual-line blockwise linewise charwise textobject text-object operatormotion operator-pending fold folds folding scrolloff wrap wraps expandtab shiftwidth tabstop softtabstop autoindent smartindent relativenumber numberwidth foldmethod cursorline cursorcolumn colorcolumn wildmenu wildmode clipboard unnamed numbered hyphenated wordcount netrw fugitive ale coc nerdtree ctrlp fzf filesystem whitespace utf unicode ascii json yaml html python javascript typescript markdown ruby php java kotlin go rust react node npm git github ssh tcp ip uri url api cli gui ui ux ide mate vscode emacs sublime atom tmux zsh bash fish shell unix linux macos osx windows mac vimcast vimcasts vimgolf'''.split())
WORD = re.compile(r"[A-Za-z][A-Za-z'-]{3,}")


def main() -> None:
    if not shutil.which('hunspell'):
        raise SystemExit('hunspell not installed; this diagnostic is optional')
    out = {}
    for path in sorted(CLEAN.glob('*.txt')):
        slug = path.stem
        counts = Counter()
        for line in path.read_text(encoding='utf-8').split('\n'):
            s = line.strip()
            if not s or s.startswith(('|', '>', '#', '$', ':', '//')):
                continue
            for w in WORD.findall(s):
                wl = w.lower().strip("-'")
                if len(wl) < 4 or wl in ALLOW or w.isupper():
                    continue
                counts[wl] += 1
        if not counts:
            out[slug] = {'unknown_words': 0, 'candidates': []}
            continue
        words = sorted(counts)
        p = subprocess.run(['hunspell', '-l', '-d', 'en_US'], input='\n'.join(words), text=True, capture_output=True, check=False)
        unknown = Counter({w: counts[w] for w in p.stdout.splitlines() if w in counts})
        out[slug] = {
            'unknown_words': sum(unknown.values()),
            'candidates': [{'word': w, 'count': n} for w, n in unknown.most_common(120)],
        }
    (INDEX / 'spellcheck.json').write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for slug, v in out.items():
        print(f'{slug:24} {v["unknown_words"]:5d} candidate tokens')


if __name__ == '__main__':
    main()
