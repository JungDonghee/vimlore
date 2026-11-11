/**
 * Build a local section index from the ten gitignored source books.
 * The raw books are not in the repo; this tool only writes headings and line
 * numbers, which is enough to start a provenance audit without copying text.
 *
 *   npm run books:index
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const books = [
  ['learning-vi-vim.txt', 'Learning the vi and Vim Editors'],
  ['practical-vim.txt', 'Practical Vim'],
  ['pro-vim.txt', 'Pro Vim'],
  ['modern-vim.txt', 'Modern Vim'],
  ['vim-101-hacks.txt', 'Vim 101 Hacks'],
  ['gourmet-vim.txt', 'Gourmet Vim'],
  ['vim-reference-guide.txt', 'Vim Reference Guide'],
  ['use-vim-like-a-pro.txt', 'Use Vim Like A Pro'],
  ['5-years-of-vim.txt', '5 Years of Vim'],
  ['neovim-for-beginners.txt', 'Neovim for Beginners'],
] as const;

const root = new URL('../books-text/', import.meta.url);
const out: string[] = [
  '# BOOKS INDEX — section-level map of the ten source books',
  '',
  '> **Generated locally** from `books-text/` (gitignored) by',
  '> `npm run books:index`. Raw text is not committed. This index is the',
  '> starting point for [`CURRICULUM_PROVENANCE.md`](CURRICULUM_PROVENANCE.md):',
  '> every stage citation must point at a section here, not at a plausible',
  '> summary.',
  '',
  'Line numbers refer to the extracted `.txt` files on the build host; re-run',
  'the tool after re-extracting the books.',
  '',
];

for (const [file, title] of books) {
  out.push(`## ${title}`, '', `- file: \`books-text/${file}\``);
  const path = new URL(file, root);
  if (!existsSync(path)) {
    out.push('- **missing on this host** — cannot index', '');
    continue;
  }
  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
  out.push(`- lines: ${lines.length}`, '');
  const seen = new Set<string>();
  const headings: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\u00a0/g, ' ').trim();
    const m =
      /^(Part|PART)\s+[IVXLC0-9]+[.:]?\s+(.+)$/.exec(line) ??
      /^(Chapter|CHAPTER)\s+\d+[.:]?\s*(.*)$/.exec(line) ??
      /^(\d{1,2})\.\s+([A-Z][^.]{3,90})$/.exec(line);
    if (!m) continue;
    const text = line.replace(/\s+/g, ' ').replace(/\.{3,}.*$/, '').slice(0, 110);
    if (seen.has(text)) continue;
    seen.add(text);
    headings.push(`${i + 1}: ${text}`);
    if (headings.length >= 45) break;
  }
  if (headings.length === 0) {
    out.push('_No chapter-style headings detected; this book needs a manual section scan._');
  } else {
    out.push('| line | heading |', '|---:|---|');
    for (const h of headings) {
      const [ln, ...rest] = h.split(': ');
      out.push(`| ${ln} | ${rest.join(': ').replace(/\|/g, '\\|')} |`);
    }
  }
  out.push('');
}

out.push(
  '## How to use this index',
  '',
  '1. Find the concept in a book section above.',
  '2. Record the section + line in the stage provenance record (see',
  '   `CURRICULUM_PROVENANCE.md` §3–§4).',
  '3. Check the prerequisite graph and the varied-repetition axes before',
  '   designing a drill.',
  '4. Do not cite a book title alone; cite the section.',
  '',
);

writeFileSync(new URL('../docs/BOOKS_INDEX.md', import.meta.url), out.join('\n'));
console.log(`books index: ${books.length} books -> docs/BOOKS_INDEX.md`);
