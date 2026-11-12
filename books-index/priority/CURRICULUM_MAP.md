# Priority books → game key overlap (NOT semantic coverage)

Exact key/id matches only. The same key can mean something different in context (e.g. Modern Vim uses Ctrl-V for an fzf vertical split, while the game uses it for Visual Block); verify the cited meaning/stage before treating it as curriculum coverage. Anything else is unmatched.

- citations: 417
- exact: 40
- unmatched: 377
- exact citations landing in a stage: 36

| book | ch | keys | book meaning | game key | key exists in stage |
|---|---:|---|---|---|---|
| modern-vim | 2 | `<C-o>` | Jump back to the previous location after following a help tag. | C-o | 8/c08s4 |
| modern-vim | 3 | `<C-v>` | Open the selected fzf result in a vertical split. | C-v | 5/c05s3 |
| modern-vim | 6 | `u` | Undo the last change | u | 1/c01s5 |
| modern-vim | 6 | `.` | Repeat the last change | . | 3/c03s5 |
| practical-vim | 1 | `.` | Repeat the last change | . | 3/c03s5 |
| practical-vim | 1 | `x` | Delete the character under the cursor | x | 1/c01s3 |
| practical-vim | 1 | `u` | Undo the last change (restore earlier state) | u | 1/c01s5 |
| practical-vim | 1 | `dd` | Delete the current line as a whole | dd | 3/c03s2 |
| practical-vim | 1 | `j` | Move the cursor down one line | j | 1/c01s1 |
| practical-vim | 1 | `A` | Append at the end of the current line (enters Insert mode) | A | 1/c01s4 |
| practical-vim | 1 | `s` | Delete the character under the cursor and enter Insert mode | s | 3/c03s3 |
| practical-vim | 1 | `;` | Repeat the last f{char} search forward | ; | 2/c02s1 |
| practical-vim | 1 | `,` | Repeat the last f{char} search in the reverse direction | , | — |
| practical-vim | 1 | `*` | Search for the word under the cursor | * | 6/c06s2 |
| practical-vim | 1 | `n` | Jump to the next match of the current search | n | 6/c06s1 |
| practical-vim | 2 | `u` | Undo the most recent change; each trip into Insert mode counts as one change. | u | 1/c01s5 |
| practical-vim | 2 | `b` | Motion that moves the cursor backward to the start of the current word. | b | 2/c02s1 |
| practical-vim | 2 | `x` | Delete the single character under the cursor. | x | 1/c01s3 |
| practical-vim | 2 | `.` | Dot command: repeat the last change, here repeating daw on another word. | . | 3/c03s5 |
| practical-vim | 2 | `dd` | Operator invoked in duplicate acts on the current line: delete the whole line. | dd | 3/c03s2 |
| practical-vim | 3 | `<Esc>` | Switch to Normal mode | esc | 1/c01s4 |
| practical-vim | 3 | `<C-o>` | Switch to Insert Normal mode to run one Normal command, then return to Insert mode | C-o | 8/c08s4 |
| practical-vim | 4 | `v` | Enable character-wise Visual mode from Normal mode | v | 5/c05s1 |
| practical-vim | 4 | `V` | Enable line-wise Visual mode (Shift-v) | V | 5/c05s2 |
| practical-vim | 4 | `<C-v>` | Enable block-wise Visual mode (Ctrl-v) | C-v | 5/c05s3 |
| practical-vim | 4 | `gv` | Reselect the last visual selection, whatever its submode | gv | — |
| practical-vim | 4 | `o` | Switch to the other (free) end of the selection so its bounds can be redefined | o | — |
| practical-vim | 4 | `>` | Indent the selected range by one level | > | 5/c05s2 |
| practical-vim | 4 | `x` | Delete the selected column in Visual-Block mode | x | 1/c01s3 |
| practical-vim | 4 | `A` | Append text at the end of each line of a Visual-Block selection | A | 1/c01s4 |
| practical-vim | 8 | `%` | Jump between matching parentheses, braces, or brackets | % | 8/c08s2 |
| practical-vim | 9 | `<C-o>` | Jump backward through the jump list, like a browser's back button | C-o | 8/c08s4 |
| practical-vim | 9 | `%` | Jump to the matching parenthesis | % | 8/c08s2 |
| practical-vim | 10 | `P` | Put the register contents in front of the cursor | P | 3/c03s4 |
| practical-vim | 10 | `p` | Used from Visual mode, replace the selection with the register contents (and swap the old selection into the register) | p | 3/c03s4 |
| practical-vim | 11 | `q` | Stop recording the macro | q | 7/c07s2 |
| practical-vim | 13 | `/` | Open the forward search prompt; enter a pattern, then press <CR> to execute the search | / | 6/c06s1 |
| practical-vim | 13 | `?` | Open the search prompt so that Vim scans backward through the document | ? | — |
| practical-vim | 15 | `:g//d` | Delete every line matching the last search pattern | :g | 7/c07s4 |
| practical-vim | 20 | `A` | Switch back to Insert mode at the end of the line after fixing a typo in Normal mode | A | 1/c01s4 |
