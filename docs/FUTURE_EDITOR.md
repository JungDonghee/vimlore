# FUTURE EDITOR — buffers, files, windows (deferred)

> **Status: design only, not implemented.** The current program is engine
> fidelity, advanced motions/operators and the 51 single-buffer stages. The human
> explicitly asked for `:ls`/`:b`/`:bn`/`:bp`/`:bd`/`:bufdo`, alternate and
> hidden buffers, `:e`/`:r`/`:w file`, splits, tabs and windows **later**, not in
> this slice. This document is the contract for that later work.
>
> Read `ARCHITECTURE.md` and `MASTER_PLAN.md` first. Nothing here may break the
> existing invariant: every stage is one buffer, and its solution must keep
> winning in exactly `par` keys.

## 1. Why this is a separate program

Today `Vim` owns exactly one `Buffer` (`this.buf`), `Session` owns one `Vim`, and
`PlayScreen` renders one view. Commands such as `:b`, `:e`, `:sp` therefore have
no state to operate on. Adding them as string parsing over the same `buf` would
create a fake feature and a tangle of special cases.

The future model is:

```
Editor                 global: registers, macros, search, jumps, command history
├── BufferList         buffers by id, current, alternate (#), hidden/modified
│   └── Buffer         text, version, undo/redo, cursor, marks, buffer-local opts
├── Tabpage[]          tab-local window layout
│   └── Window[]       bufferId, cursor, scrollX/scrollY, height, focus
└── Ex dispatcher      :b :e :r :w :sp :vsp :tabnew :bufdo …
```

`Vim` remains the input/state machine and becomes the editor façade. Motions,
operators and text objects keep operating on the **active** `Buffer`; they must
not learn about buffers/windows. Rendering receives a view model
(`buffer + window + gutter options`) instead of reading `vim.buf` directly.

## 2. Phased delivery (do not reorder without measuring value)

### Phase A — buffer registry and switching (highest value)

- Buffer id: stable integer or short name; display name/path.
- `:ls` list with `%` current, `#` alternate, `a` active, `h` hidden,
  `+` modified, line count.
- `:b[uffer] N|name`, `:bn[ext]`, `:bp[revious]`, `:bd[elete]`,
  `:bufdo {cmd}`, `:bwipeout` (optional), `#` alternate.
- Buffer-local: cursor, undo/redo, marks, options (`number`,
  `relativenumber`), changedtick. Global: registers, macros, search, jumps.
- Hidden rule: switching away from a modified buffer must not discard it. A
  `:bd`/`:bw` of a modified buffer asks for confirmation; the game may choose
  “hidden by default” to match `set hidden`.
- Stage safety: `Session`/`PlayScreen` may expose only buffer 1. Any attempt to
  switch in a stage is rejected with a friendly message unless a future level
  explicitly teaches it.

### Phase B — files in a virtual filesystem

The browser has no real filesystem. Use an in-memory VFS plus explicit
import/export; never a server.

- `:e[dit] file` — open into current buffer (error if modified and not hidden/
  forced), or create a new buffer.
- `:r[ead] file` — insert file below the cursor line.
- `:w[rite] [file]` — write to VFS; with no name, reuse the current name.
  Download/export is a UI action, not an Ex side effect.
- `:wq`, `:x`, `:q`, `:q!` — close/quit semantics with modified-buffer checks.
- VFS scope: session memory, optionally persisted with the save code (size
  budget!). Stage buffers are ephemeral and never appear in `:ls` unless the
  stage says so.
- No `:!`, no shell, no terminal.

### Phase C — windows and splits

- `:sp[lit] [file]`, `:vsp[lit] [file]`, `:new`, `:close`, `:only`.
- `<C-w>h/j/k/l/w/W/t/b`, `<C-w>c/q`, `<C-w>s/v`, `<C-w>=`.
- Each `Window` owns viewport/cursor/highlight; one `Buffer` can appear in
  multiple windows.
- Renderer: one canvas can draw multiple window rectangles (split borders,
  per-window statuslines) or use one canvas per window; measure both. Do not
  regress the single-window 60fps budget or introduce per-frame DOM.
- Keyboard-only focus: only the active window owns the cursor; statusline shows
  the active buffer id and `[N/M]`.

### Phase D — tabs

- `:tabnew`, `:tabclose`, `:tabnext`/`:tabprevious`/`:tabfirst`/`:tablast`,
  `gt`/`gT`, `{N}gt`.
- One tabpage = a window layout + active window. Tabline already exists as
  chrome; wire it to the real tab list.
- `:tabdo` last, after `:bufdo`/`:windo`.

### Phase E — command families and polish

- `:windo`, `:tabdo`, `:argdo` (if args exist), `:cdo` no.
- `:ls` flags, `:b#`, `:sbuffer`, `:badd`, `:bunload`.
- Completion for buffer names in the command line; history already exists.
- Error messages must be useful (`E86: Buffer N does not exist`, `E37: No
  write since last change (add ! to override)`).

## 3. Invariants and tests

Every phase adds tests, not just commands:

1. **Oracle**: real Vim with a temp file/dir. Cases for `:w`, `:e`, `:r`,
   `:bnext`, `:bd`, hidden/alternate, split cursor movement. The oracle harness
   must clean its temp dir even on failure.
2. **Session**: stage solutions still pass `lint:levels` unchanged. A stage may
   not silently switch buffers; gating stays first-key based.
3. **Unit**: buffer-local undo/cursor/marks are independent; global registers/
   macros are shared; `#` holds the previous buffer; modified/hidden rules.
4. **UI**: Playwright keyboard-only: open two buffers, switch, split, move
   focus, close one window, quit with/without changes, no mouse.
5. **Docs**: update `VIM_COVERAGE.md`, `ARCHITECTURE.md`, `MASTER_PLAN.md`,
   `HANDOFF.md` in the same commit. Remove rows from “not implemented” only when
   the tests exist.

## 4. What not to do

- Don't implement `:b`/`:sp` by parsing strings and mutating `vim.buf`; it will
  corrupt undo, marks and the renderer's cached frame.
- Don't add a server, browser filesystem API assumptions, or real `:!`.
- Don't teach buffer/window keys in existing stages; stage solutions and `par`
  are frozen. New teaching content (if any) is a separate curriculum decision.
- Don't claim `:w` wrote a file until the VFS/download path is tested.
- Don't let the 51 stages depend on hidden buffers; a stage is always one
  buffer and one window in this program.

## 5. Priority

Current work (engine fidelity and advanced motions/operators) comes first.
After Tier 2 (`g;`/`g,`, `=` indent) and the performance/cursor backlog are
green, Phase A is the next editor program. Phase B follows; C/D only if the
human still wants them after A/B are measured.
