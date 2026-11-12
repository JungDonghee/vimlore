# Priority books — chapter audit

Drew Neil, Practical Vim 2e and Modern Vim. Every command/concept/problem line is evidence-validated.

## modern-vim — Ch 1: Get Modern Vim (654–1039)

Chapter 1 is the book's installation and setup chapter: it frames the choice between Vim 8, Neovim, or running both side by side, and notes that the two editors can share the same configuration files and plugins. Tip 1 shows how to check an installed Vim's version and compiled features, then how to upgrade to Vim 8 on Debian and macOS. Tip 2 installs Neovim, explains the $VIMCONFIG/$VIMDATA convention used throughout the book, and shows how to make Neovim reuse an existing vimrc through init.vim. Tip 3 enables Neovim's Python 3 provider via the pip client, introduces providers and :checkhealth (including clipboard support), and installs neovim-remote.

| keys | meaning | citation |
|---|---|---|
| `vim --version` | Print the installed Vim version and the list of compiled features | modern-vim:709 |
| `mkdir -p $VIMCONFIG/pack/bundle/start` | Create the package start directory that holds installed plugins | modern-vim:762 |
| `nvim` | Launch Neovim from the shell | modern-vim:848 |
| `:help base-directories` | Open the help topic that documents Vim/Neovim config and data directories | modern-vim:877 |
| `set runtimepath^=~/.vim runtimepath+=~/.vim/after` | Prepend ~/.vim and append ~/.vim/after to Neovim's runtimepath | modern-vim:887 |
| `let &packpath = &runtimepath` | Make Neovim's package path mirror the runtimepath so Vim packages are found | modern-vim:889 |
| `source ~/.vim/vimrc` | Load the existing Vim vimrc from init.vim | modern-vim:891 |
| `:version` | Report the editor version and feature flags such as +python3 | modern-vim:934 |
| `:py3 print('hello')` | Execute a Python 3 statement, here printing hello | modern-vim:940 |
| `+ and *` | Registers used to interact with the system clipboard | modern-vim:961 |
| `:checkhealth` | Run Neovim's diagnostic tests and report provider status | modern-vim:963 |
| `pip3 install --user --upgrade neovim` | Install the Python client that provides the Python 3 provider | modern-vim:972 |

Concepts: Neovim's remote plugin architecture (RPC) (681); Required Vim 8 build features (728); Contextual instructions with $VIMCONFIG and $VIMDATA (772); Neovim's separate configuration and data directories (782); Neovim as a drop-in replacement for Vim (794); Using $VISUAL so external programs prefer Neovim (852); Reusing a Vim runtime configuration in Neovim (874); Vim script compatibility and the job-control caveat (898); Neovim providers (949); Clipboard support enabled at runtime (958); Python 3 provider via the pip-installed client (969); neovim-remote (nvr) for remote control of Neovim (984)

Defects: missing@701; missing@677

## modern-vim — Ch 2: Installing Plugins (1040–1502)

Chapter 2, Installing Plugins, explains why Vim users want plugins and how Vim 8's native packages feature removes the need for a third-party plugin manager. It defines the script/plugin/package hierarchy, shows that installing a plugin means adding it to the 'runtimepath', and demonstrates installing plugins under $VIMCONFIG/pack/{package}/start for automatic loading or under opt for on-demand loading with :packadd, plus indexing their documentation with :helptags. The chapter then covers updating plugins with git pull, migrating from Pathogen, and managing plugins with minpac (minpac#add(), minpac#update(), minpac#clean()) including user-defined commands such as :PackUpdate and :PackClean.

| keys | meaning | citation |
|---|---|---|
| `nnoremap Q :Hello<CR>` | Define a Normal-mode mapping inside a script; pressing Q runs the new :Hello command. | modern-vim:1081 |
| `:source {path}` | Source a script file manually to load its functions, commands, and mappings. | modern-vim:1083 |
| `:set runtimepath+=$VIMCONFIG/arbitrary/demo-plugin` | Install a plugin by hand by appending its directory to the 'runtimepath' option. | modern-vim:1121 |
| `:helptags` | Parse a plugin's documentation and write a tags index so :help can find it. | modern-vim:1143 |
| `:help user-manual` | Open the user manual's table of contents in Vim's help system. | modern-vim:1149 |
| `<C-]>` | Follow the help hyperlink (tag anchor) under the cursor. | modern-vim:1153 |
| `<C-o>` | Jump back to the previous location after following a help tag. | modern-vim:1154 |
| `:echo join(split(&runtimepath, ','), "\n")` | Print 'runtimepath' one directory per line to inspect which plugins are installed. | modern-vim:1178 |
| `:helptags ALL` | Index documentation for every package, not just one plugin directory. | modern-vim:1237 |
| `:packadd vim-scriptease` | Load an optional plugin from pack/*/opt for the current session only. | modern-vim:1272 |
| `:scriptnames` | List the script files Vim has loaded, confirming the optional plugin is active. | modern-vim:1286 |
| `:call minpac#update()` | Fetch and install or update every plugin registered with minpac. | modern-vim:1397 |
| `:messages` | Review previously echoed messages, such as which plugins minpac installed. | modern-vim:1408 |
| `:call minpac#clean()` | Uninstall plugins removed from the minpac config, prompting y/N per directory. | modern-vim:1446 |
| `command! PackUpdate call minpac#update()` | Define a custom :PackUpdate command that wraps the update call. | modern-vim:1458 |

Concepts: Package, plugin, and script hierarchy (1056); Scripts add functionality to Vim (1061); Installing a plugin means adding it to 'runtimepath' (1117); start subdirectory for plugins loaded at startup (1131); Indexing documentation for installed plugins (1140); Optional plugins in opt/ loaded on demand (1248); Updating plugins with git pull (1296); Migrating from Pathogen to Vim packages (1310); minpac as a minimal plugin manager (1335); Registering plugins with minpac#add() (1379); Parallel plugin fetching via Vim's jobs API (1419); Creating custom commands for plugin management (1454)

Defects: garbled@1040; missing@1052; garbled@1069; garbled@1218; garbled@1501

## modern-vim — Ch 3: Opening Files (1503–2299)

Chapter 3 surveys ways to open files in Vim with fewer keystrokes. It first presents Junegunn Choi's fzf fuzzy finder: installation, the :FZF command and a <C-p> mapping, the picker's navigation keys, filtering noise out of the candidate list via FZF_DEFAULT_COMMAND, and reusing fzf for other sources such as buffers and command history. It then introduces Tim Pope's Projectionist plugin, whose .projections.json configuration defines :E/:S/:V/:T navigation commands by file type, and closes with the :A alternate-file command for flipping between related files such as a model and its unit test.

| keys | meaning | citation |
|---|---|---|
| `:edit {filepath}` | Open any readable file by filepath in the current window; the built-in baseline the chapter compares against. | modern-vim:1517 |
| `:FZF` | Invoke the fzf fuzzy-finder picker from Vim. | modern-vim:1550 |
| `nnoremap <C-p> :<C-u>FZF<CR>` | Normal-mode mapping that fires :FZF with <C-p>; <C-u> clears the command line first. | modern-vim:1559 |
| `:vsplit` | Open a file in a vertical split (abbreviated :vs). | modern-vim:1610 |
| `:e a<Tab>com<Tab>t<Tab>` | Tab-complete path segment by segment instead of typing the whole filepath. | modern-vim:1615 |
| `<C-k>` | Select next item from the fzf match list; the table pairs it with <C-j> for previous. | modern-vim:1735 |
| `<CR>` | Open the selected fzf result in the current window (also submits the query). | modern-vim:1743 |
| `<C-v>` | Open the selected fzf result in a vertical split. | modern-vim:1751 |
| `<C-t>` | Open the selected fzf result in a new tab page. | modern-vim:1755 |
| `:buffer {bufname}` | Switch to an open buffer by name; the built-in command the tip wants to wrap with a fuzzy finder. | modern-vim:1833 |
| `<Up>/<Down>` | Scroll through command-line history after entering Command-Line mode with :. | modern-vim:1837 |
| `vim -O` | Start Vim with each named file in its own window (as in vim -O blog-{classic,modular}/.projections.json). | modern-vim:1963 |
| `<C-w>w` | Cycle between the open windows. | modern-vim:1965 |
| `:Emodel comment` | Projectionist navigation command that opens the model file named by argument, resolved from the active project's configuration. | modern-vim:1989 |
| `:A` | Follow the alternate link defined for the current file (e.g. model to unit test). | modern-vim:2256 |

Concepts: Fuzzy path matching (1623); Fuzzy match ordering (1652); Ranking algorithm (1655); Version-controlled file listing (1816); Fuzzy finding other sources (1830); Source and sink (1841); Projections configuration (1986); Context-sensitive navigation (1991); JSON linting of projections (2033); Navigation command variations (2038); Smart tab completion with wildcard (2078); Alternate files (2187)

Defects: garbled@1513; typo@1515; garbled@1594; garbled@1662; garbled@1729; order@1737; typo@1854; garbled@2040; typo@2106; typo@2216

## modern-vim — Ch 4: Working with the Quickfix List (2300–3773)

Chapter 4 teaches five quickfix-centric workflows for getting compiler, linter, grep, and test-runner output into Vim's error lists. It begins with compiler plugins, :make, and the :copen/:cnext family, then shows how Dispatch's :Make and :Dispatch commands make builds asynchronous and can infer or be told which compiler to use. The remaining tips cover ALE's asynchronous linting and its window-local location list, Grepper's asynchronous grep-alikes with per-tool settings, and vim-test's suite/file/nearest test commands plus its dispatch strategy for quickfix output.

| keys | meaning | citation |
|---|---|---|
| `:make` | Run the program configured by 'makeprg' and load its output into the quickfix list; the chapter's starting point for capturing build errors. | modern-vim:2464 |
| `:compiler typescript` | Activate the TypeScript compiler plugin, which sets buffer-local 'makeprg' and 'errorformat' together. | modern-vim:2493 |
| `:copen` | Open the quickfix window to inspect the errors captured by :make. | modern-vim:2506 |
| `:cfirst, :cprev, :cnext, :clast` | Jump to the first, previous, next, or last error in the quickfix list. | modern-vim:2508 |
| `:Make / :Make!` | Dispatch's asynchronous :make: :Make runs the build in the foreground, :Make! sends it to the background. | modern-vim:2563 |
| `:Copen` | Open the quickfix window on demand after the background build exits. | modern-vim:2561 |
| `:Dispatch {cmd}` | Run a build tool through Dispatch, which selects a suitable compiler plugin before executing the command. | modern-vim:2629 |
| `:Dispatch -compiler=tslint npm run lint` | Force Dispatch to use the tslint compiler when the command (an npm script) hides the underlying tool. | modern-vim:2724 |
| `]w / [w` | Mappings to jump to the next and previous ALE warning. | modern-vim:2904 |
| `:ALELint` | Manually trigger ALE linting; the book wires it to a <Leader>l mapping. | modern-vim:3025 |
| `:lfirst, :lprevious, :lnext, :llast` | Traverse the window-local location list that ALE populates by default. | modern-vim:2928 |
| `:grep -RIn Waldo .` | Run grep from Vim and load the matches into the quickfix list (synchronously). | modern-vim:3160 |
| `:GrepperGrep Waldo` | Run grep asynchronously through Grepper; results populate the quickfix list when the job finishes. | modern-vim:3176 |
| `:TestSuite` | Run the whole test suite with vim-test, which detects the test framework automatically. | modern-vim:3490 |
| `:TestNearest` | Run the single test closest to the cursor. | modern-vim:3547 |

Concepts: Compiler plugins (2471); ‘makeprg’ and ‘errorformat’ options (2469); Populating the quickfix list from compiler output (2502); Dispatch adapters (2334); Automatic compiler selection by matching ‘makeprg’ (2639); g:dispatch_compilers dictionary (2726); Buffer-local b:dispatch default command (2753); Quickfix list vs. location list scope (2922); Asynchronous linting with ALE (2764); g:ale_linters per-filetype configuration (2969); ‘grepprg’ and ‘grepformat’ for grep-alikes (3210); vim-test dispatch strategy (3631)

Defects: garbled@2300; garbled@2310; missing@2312; garbled@2477; garbled@2832; missing@2928; garbled@2970; typo@2976; typo@3366; garbled@3393; typo@3633

## modern-vim — Ch 5: Neovim’s Built-In Terminal Emulator (3774–4907)

This chapter covers Neovim's built-in terminal emulator across Tips 15-22, beginning with the distinction between Terminal mode and terminal buffers. It shows how to launch programs with :terminal, manage terminal buffers in windows, splits and tabs, and use Normal mode commands for scrollback, search, copying and gf. The later tips cover controlling a running process remotely with jobsend() and an ad-hoc :Restart command, customizing shell prompts inside terminal buffers, and avoiding nested Neovim instances with neovim-remote and $VISUAL.

| keys | meaning | citation |
|---|---|---|
| `:terminal` | Open a terminal buffer running the default shell in the current window | modern-vim:3872 |
| `<C-\><C-n>` | Leave Terminal mode and switch back to Normal mode | modern-vim:3876 |
| `:tnoremap <Esc> <C-\><C-n>` | Create a Terminal-mode-only mapping so Esc returns to Normal mode | modern-vim:3936 |
| `<C-v><Esc>` | Send a literal Escape keystroke to the program in the terminal buffer | modern-vim:3955 |
| `:!{cmd}` | Execute a shell command and echo its output below the command line | modern-vim:4014 |
| `:read !{cmd}` | Insert a shell command's output into the current buffer at the cursor | modern-vim:4046 |
| `:terminal {cmd}` | Run the given program in a new terminal buffer | modern-vim:4057 |
| `:bwipeout!` | Delete a terminal buffer, which stops the process running inside it | modern-vim:4184 |
| `:split | terminal` | Open a terminal buffer in a horizontal split using | as command separator | modern-vim:4248 |
| `gg` | Jump to the top of the terminal buffer's scrollback | modern-vim:4402 |
| `gf` | Open the filepath under the cursor in a buffer | modern-vim:4453 |
| `<C-^>` | Switch back to the alternate buffer, such as a hidden terminal buffer | modern-vim:4476 |
| `:call jobsend(1, "\<C-c>npm run server\<CR>")` | Send keystrokes to a terminal buffer's job through jobsend() | modern-vim:4553 |
| `:command! Restart call jobsend(1, "\<C-c>npm run server\<CR>")` | Define an ad-hoc :Restart command that drives the terminal job | modern-vim:4567 |
| `<C-x><C-e>` | Open the current shell command line in your preferred text editor | modern-vim:4795 |

Concepts: Terminal mode (3858); Terminal buffer corresponds to a process (3839); Terminal cursor versus Normal cursor (3961); TermCursor and TermCursorNC highlight groups (3989); term://{cwd}//{pid}:{cmd} buffer naming (4062); Processes keep running while a terminal buffer is hidden (4121); Using Neovim as a window manager (3804); | as an Ex command separator (4250); Ad-hoc command (4580); Detecting a terminal buffer with $NVIM_LISTEN_ADDRESS (4611); neovim-remote (nvr) (4673); nvr --remote-wait blocking until the buffer is deleted (4883)

Defects: typo@3830; missing@3840; garbled@3850; typo@3924; typo@3938; garbled@4254; typo@4767

## modern-vim — Ch 6: Sessions (4908–5329)

Chapter 6 explains how Vim sessions record the current workspace, including buffers, window layout, tab pages, and cursor position, so that state can be restored after restarting Vim. It demonstrates saving with :mksession!, reloading with vim -S or :source, and automating the process with Tim Pope's Obsession plugin. It then covers persistent undo through the 'undofile' and 'undodir' options, including an autocommand that disables undo files for temporary files, and shows how Neovim terminal buffers can be renamed so their processes are restarted when a session is restored.

| keys | meaning | citation |
|---|---|---|
| `:mksession!` | Save the current workspace to a Session.vim file | modern-vim:4973 |
| `vim -S` | Launch Vim and load the default Session.vim session | modern-vim:4981 |
| `:source Session.vim` | Load a session file while Vim is already running | modern-vim:4992 |
| `:Obsession` | Start automatic session tracking; rerun it to pause or resume | modern-vim:5018 |
| `:Obsession!` | Stop session tracking, remove Session.vim, and disable the autocommands | modern-vim:5042 |
| `set undofile` | Enable persistent undo history | modern-vim:5087 |
| `<C-x>` | Decrement the number at the start of the line | modern-vim:5078 |
| `u` | Undo the last change | modern-vim:5079 |
| `<C-r>` | Redo the undone change | modern-vim:5079 |
| `.` | Repeat the last change | modern-vim:5089 |
| `set undodir=$VIMDATA/undo` | Save undo files in a designated directory | modern-vim:5103 |
| `:call mkdir(&undodir, 'p')` | Create the undo directory, including parent directories | modern-vim:5108 |
| `:split | terminal` | Open a terminal buffer in a horizontal split | modern-vim:5194 |
| `:ls` | List buffers and their names | modern-vim:5208 |
| `:file term://PORT=3001 npm run server` | Rename a terminal buffer so its command is restored with the session | modern-vim:5292 |

Concepts: Session as a workspace snapshot (4913); A session can represent a project (4948); Default Session.vim file (4975); Obsession autocommands on VimLeavePre and BufEnter (5022); 'sessionoptions' controls what a session records (5048); Buffer names are preserved, buffer numbers are not (5050); Neovim shada file for shared state (5056); Persistent undo with 'undofile' (5070); 'undodir' designated undo directory (5100); Local noundofile autocommand for temporary files (5119); Terminal buffer name format term://{cwd}//{pid}:{cmd} (5216); Renaming terminal buffers with :file {name} (5289)

Defects: missing@4955; typo@5023; typo@5048; missing@5066; missing@5161

## modern-vim — Ch 7: Configuring Vim (5330–6882)

Chapter 7 presents three mechanisms for applying Vim settings in context: autocommands (with the {event} {pattern} {cmd} form, kept in an augroup with an autocmd! teardown), the vim-editorconfig plugin for .editorconfig files, and Projectionist by Tim Pope for per-project buffer-local configuration. Worked demos move from BufReadPost/BufNewFile/FileType events and :autocmd inspection, through EditorConfig property mapping with its root and precedence rules, to overriding g:ale_linters with b:ale_linters and querying .projections.json files, where the projection nearest the buffer wins. The tip closes by weighing local vimrc files enabled by the 'exrc' option against the restrictions imposed by the 'secure' option. The supplied 5330-6882 range runs past the chapter's end at line 6407 into Appendix 1 and the book's back matter.

| keys | meaning | citation |
|---|---|---|
| `augroup demo` | Open a named autocommand group so its autocommands can be managed as a unit | modern-vim:5357 |
| `autocmd!` | Delete the existing autocommands in the enclosing group, preventing duplicates when the script is re-sourced | modern-vim:5359 |
| `autocmd BufReadPost * echo 'Reading: ' . expand('<afile>')` | Define an autocommand that runs after any buffer is read and echoes the filename via the <afile> placeholder | modern-vim:5361 |
| `:source %` | Source the current file so the Vim script it contains (here, autocommand definitions) takes effect | modern-vim:5376 |
| `:edit!` | Re-read the current file from disk; the bang variant always fires the BufReadPost event | modern-vim:5380 |
| `autocmd FileType vim` | Define an autocommand on the FileType event for filetype vim (the definition continues on the following '\' lines) | modern-vim:5497 |
| `:set filetype=vim` | Change the current buffer's filetype, which triggers the FileType autocommand | modern-vim:5519 |
| `:autocmd demo` | List the autocommands defined in the demo group, revealing duplicated definitions | modern-vim:5601 |
| `:autocmd! demo` | Remove all autocommands belonging to the demo group | modern-vim:5621 |
| `autocmd BufWritePre /tmp/* setlocal noundofile` | Just before writing a file matching /tmp/*, disable persistent undo for that buffer only | modern-vim:5650 |
| `:doautocmd User ProjectionistActivate` | Trigger the Vim-never-fires-it User event by hand, using ProjectionistActivate as the pattern | modern-vim:5664 |
| `:set expandtab? shiftwidth?` | Query (rather than set) the current values of the 'expandtab' and 'shiftwidth' options | modern-vim:5752 |
| `:windo set list` | Execute :set list in every window, making indentation whitespace visible | modern-vim:5811 |
| `:let b:ale_linters = {'javascript': ['jshint']}` | Set a buffer-local ALE linter list, which takes precedence over the global g:ale_linters | modern-vim:6031 |
| `:bufdo edit!` | Reload every buffer from disk so Projectionist re-attaches the project metadata | modern-vim:6081 |

Concepts: Autocommand definition format ({event} {pattern} {cmd}) (5400); BufNewFile event for buffers with no file on disk yet (5464); FileType event matches the pattern against the filetype (5527); Autocommand group teardown template (augroup + autocmd!) (5631); User event as a plugin-defined custom event (5667); EditorConfig (.editorconfig) as an editor-agnostic standard (5679); EditorConfig precedence: closest config file applied last (5847); Buffer-local b: variables override global g: variables (6044); Projections (.projections.json) scoped to a project directory (6057); Projectionist specificity: nearest projection config wins (6265); Generalized projection keys decoupled from plugins and options (6322); Local vimrc file enabled by the 'exrc' option (6328)

Defects: missing@5345; typo@5407; typo@5571; truncation@5605; typo@5662; missing@5676; garbled@5871; missing@5911; typo@6097; typo@6334; garbled@6343

## practical-vim — Ch 1: The Vim Way (967–1522)

Chapter 1 introduces Vim's dot command as the centre of a repeatable editing workflow: it replays the last change, where a change may be a character deletion (x), a line deletion (dd), a shift (>G) or an entire Insert-mode burst. Three worked examples (Tips 2, 3 and 5) show how to craft a change worth repeating (A instead of $a, s instead of manual insertion, cw to replace a whole word) and how to make the motion repeatable too, with f{char} followed by ; or , and with * followed by n. The tips culminate in the Dot Formula - one keystroke to move, one keystroke to execute - and in the habit of reversing an over-repeated action with u or , instead of guessing.

| keys | meaning | citation |
|---|---|---|
| `.` | Repeat the last change | practical-vim:982 |
| `x` | Delete the character under the cursor | practical-vim:1000 |
| `u` | Undo the last change (restore earlier state) | practical-vim:1044 |
| `dd` | Delete the current line as a whole | practical-vim:1046 |
| `>G` | Increase indentation from the current line to end of file | practical-vim:1075 |
| `j` | Move the cursor down one line | practical-vim:1157 |
| `A` | Append at the end of the current line (enters Insert mode) | practical-vim:1161 |
| `s` | Delete the character under the cursor and enter Insert mode | practical-vim:1301 |
| `f{char}` | Jump to the next occurrence of a character on the line | practical-vim:1307 |
| `;` | Repeat the last f{char} search forward | practical-vim:1309 |
| `,` | Repeat the last f{char} search in the reverse direction | practical-vim:1389 |
| `:%s/content/copy/g` | Substitute every occurrence of content with copy in the file | practical-vim:1411 |
| `*` | Search for the word under the cursor | practical-vim:1421 |
| `n` | Jump to the next match of the current search | practical-vim:1473 |
| `cw` | Change to the end of the word, then enter Insert mode | practical-vim:1477 |

Concepts: Dot command repeats the last change (982); Micro Macro (1131); Reduce Extraneous Movement (1159); Two for the Price of One (compound commands) (1163); Make the Change Repeatable (1269); One Step Back, Then Three Steps Forward (1303); Make the Motion Repeatable (1305); Repeatable Actions and How to Reverse Them (1323); Reverse Gear (1391); Be Lazy: Search Without Typing (1419); The Dot Formula (1489); One Keystroke to Move, One Keystroke to Execute (1499)

Defects: missing@980; garbled@984; garbled@1002; truncation@1075; duplicated@1113; garbled@1273; garbled@1325; garbled@1415; missing@1504

## practical-vim — Ch 2: Normal Mode (1523–1896)

Chapter 2 presents Normal mode as Vim’s natural resting state, using a painter’s brush-off-the-canvas analogy to argue that most editing time goes into thinking, navigating, and transforming text rather than inserting it. It explains how pausing to leave Insert mode at natural break points chunks the undo history, and how composing changes so that the dot command can repeat them beats a one-off efficient edit. Counts are then applied to simple arithmetic with <C-a> and <C-x>, including the leading-zero octal pitfall and the case for repeating over counting, before the chapter closes with operator+motion grammar, operator doubling, custom operators and motions, and Operator-Pending mode.

| keys | meaning | citation |
|---|---|---|
| `u` | Undo the most recent change; each trip into Insert mode counts as one change. | practical-vim:1560 |
| `db` | Delete backward from the cursor to the start of the current word. | practical-vim:1610 |
| `b` | Motion that moves the cursor backward to the start of the current word. | practical-vim:1630 |
| `x` | Delete the single character under the cursor. | practical-vim:1654 |
| `dw` | Delete from the cursor to the start of the next word. | practical-vim:1656 |
| `daw` | Delete a whole word plus its surrounding whitespace (delete a word). | practical-vim:1646 |
| `.` | Dot command: repeat the last change, here repeating daw on another word. | practical-vim:1658 |
| `<C-a>` | Increment the number at or after the cursor; a count adds that amount. | practical-vim:1676 |
| `yyp` | Yank the current line and paste it below, duplicating the line. | practical-vim:1688 |
| `180<C-x>` | Decrement by 180; with the cursor off a digit it jumps forward to the first number on the line. | practical-vim:1690 |
| `2dw` | Count applied to the delete operator, deleting two words (same result as d2w). | practical-vim:1752 |
| `c3w` | Change three words with a count, then type the replacement text. | practical-vim:1782 |
| `gUaw` | Combine the gU operator with the aw text object to uppercase the current word. | practical-vim:1840 |
| `dd` | Operator invoked in duplicate acts on the current line: delete the whole line. | practical-vim:1842 |
| `gg=G` | Jump to the top of the file with gg, then =G autoindents everything to the end. | practical-vim:1863 |

Concepts: Normal mode as the natural resting state (1528); Chunking undos by controlling undo granularity (1558); Compose repeatable changes (1582); Investing the most power in the dot command (1662); Using counts to do simple arithmetic (1672); Number formats and leading-zero octal notation (1730); Prefer repeating over counting (1768); Act, repeat, reverse (1770); Operator + motion = action (1800); Vim’s operator-motion grammar (1838); Operator doubling acts on the current line (1842); Operator-Pending mode (1873)

Defects: order@1540; missing@1542; garbled@1596; garbled@1634; garbled@1804

## practical-vim — Ch 3: Insert Mode (1897–2154)

Chapter 3, Insert Mode, covers the operations Vim makes available while you are already inserting text. It starts with fast self-corrections using <C-h>, <C-w>, and <C-u>, then shows the shortcuts for returning to Normal mode and Insert Normal mode (<C-o>) for running a single Normal command. The middle tips explain pasting register contents without leaving Insert mode and using the expression register for in-place calculations. The chapter ends with inserting unusual characters by numeric code or digraph, and with Replace and Virtual Replace modes for overwriting existing text.

| keys | meaning | citation |
|---|---|---|
| `<C-h>` | Delete back one character (backspace) while staying in Insert mode | practical-vim:1926 |
| `<C-w>` | Delete back one word | practical-vim:1929 |
| `<C-u>` | Delete back to start of line | practical-vim:1932 |
| `<Esc>` | Switch to Normal mode | practical-vim:1947 |
| `<C-[>` | Switch to Normal mode; synonymous with <Esc> | practical-vim:1950 |
| `<C-o>` | Switch to Insert Normal mode to run one Normal command, then return to Insert mode | practical-vim:1953 |
| `<C-r>{register}` | Insert the contents of the named register at the cursor without leaving Insert mode | practical-vim:2016 |
| `<C-r><C-p>{register}` | Insert register text literally and fix unintended indentation | practical-vim:2022 |
| `<C-r>=` | Open the expression-register prompt from Insert mode; <CR> inserts the evaluated result | practical-vim:2034 |
| `<C-v>{code}` | Insert an arbitrary character by its three-digit decimal code | practical-vim:2062 |
| `<C-v>u{1234}` | Insert a character by four-digit hexadecimal code, for example <C-v>u00bf for the inverted question mark | practical-vim:2066 |
| `<C-k>{char1}{char2}` | Insert the character represented by a two-character digraph, for example <C-k>?I | practical-vim:2097 |
| `R` | Enter Replace mode, which overwrites existing text until <Esc> | practical-vim:2139 |
| `gR` | Enter Virtual Replace mode, which overwrites screen columns and treats a tab as spaces | practical-vim:2145 |
| `r{char} and gr{char}` | Single-shot replace: overwrite one character (or one virtual character) and return to Normal mode | practical-vim:2149 |

Concepts: Immediate correction from Insert mode (1912); Insert Normal mode (1960); Pasting from a register without leaving Insert mode (1976); Expression register (2032); Character insertion by numeric code (2060); Digraph insertion (2095); Replace mode (2107); Virtual Replace mode (2147); Single-shot replace commands (2149); Caps Lock remapping (1968); Register-paste side effects under 'textwidth' and 'autoindent' (2020); Literal insertion of a following key with <C-v> (2070)

Defects: typo@1910; garbled@1924; garbled@2087

## practical-vim — Ch 4: Visual Mode (2155–2743)

Chapter 4 introduces Visual mode as a way to define a selection and then operate on it, covering the character-wise, line-wise, and block-wise submodes, how to enable and switch between them, and the gv and o keys for reselecting and flipping the free end of a selection. It shows that Visual commands can be repeated with the dot command, but that the dot command replays the same amount of text, so line-wise selections repeat reliably while character-wise ones fall short, making Normal-mode operators such as gU{motion} preferable for repetitive edits. The chapter closes with Visual-Block techniques for editing tabular data, inserting text into several lines at once, and appending after a ragged block whose lines have different lengths.

| keys | meaning | citation |
|---|---|---|
| `v` | Enable character-wise Visual mode from Normal mode | practical-vim:2204 |
| `V` | Enable line-wise Visual mode (Shift-v) | practical-vim:2212 |
| `<C-v>` | Enable block-wise Visual mode (Ctrl-v) | practical-vim:2216 |
| `gv` | Reselect the last visual selection, whatever its submode | practical-vim:2224 |
| `o` | Switch to the other (free) end of the selection so its bounds can be redefined | practical-vim:2258 |
| `<C-g>` | Toggle between Visual and Select modes | practical-vim:2190 |
| `viw` | Visually select the word under the cursor | practical-vim:2184 |
| `vit` | Visually select the inner contents of the current tag (text object) | practical-vim:2382 |
| `U` | Convert the selected characters to uppercase | practical-vim:2386 |
| `gU{motion}` | Normal-mode operator that uppercases the text covered by a motion | practical-vim:2430 |
| `j.` | Move down one line and repeat the last change with the dot command (Dot Formula) | practical-vim:2418 |
| `>` | Indent the selected range by one level | practical-vim:2312 |
| `x` | Delete the selected column in Visual-Block mode | practical-vim:2572 |
| `r|` | Replace every character in the selection with a pipe character | practical-vim:2576 |
| `A` | Append text at the end of each line of a Visual-Block selection | practical-vim:2720 |

Concepts: Visual mode's three submodes (2200); Inversion of control: operator-then-range versus selection-then-command (2182); Select mode (2188); Toggling the free end of a selection (2256); Repeating line-wise Visual commands with the dot command (2282); Dot Formula (2416); Visual-command repeat replays the same range of text (2426); Preferring operators to Visual commands where possible (2470); Text objects (it means inside the tag) (2382); Using Visual-Block mode on tabular data (2478); Inserting text into several lines with a block change (2584); Ragged Visual Block selection to the end of unequal lines (2718)

Defects: garbled@2170; garbled@2206; garbled@2296; typo@2362; missing@2400; garbled@2512; typo@2694

## practical-vim — Ch 5: Command-Line Mode (2744–3856)

Chapter 5 explains Command-Line mode and the Ex commands it exposes, opening with a catalog of Ex commands that operate on buffer text and the control-key chords available at the prompt. It shows how to build [range] addresses from line numbers, marks, and patterns, and how to duplicate or move lines with :copy/:t and :move/:m. Later tips cover running Normal mode commands across a range with :normal, repeating Ex commands with @:, tab-completion and wildmode, inserting the word under the cursor with <C-r><C-w>, and recalling history in the command-line window. The final tips cover running shell commands and filtering ranges through external programs, then batching Ex commands in a script and sourcing it across the argument list.

| keys | meaning | citation |
|---|---|---|
| `:2,5p` | Print lines 2 through 5, using line-number addresses for the range. | practical-vim:2865 |
| `:%s/Practical/Pragmatic/` | Replace the first occurrence of Practical with Pragmatic on every line of the file. | practical-vim:2911 |
| `:'<,'>p` | Print the lines covered by the most recent Visual-mode selection. | practical-vim:2931 |
| `:/<html>/,/<\/html>/p` | Print the range from the opening <html> tag to the closing </html> tag, using pattern addresses. | practical-vim:2949 |
| `:/<html>/+1,/<\/html>/-1p` | Print that same block without its first and last lines, using offset addresses. | practical-vim:2967 |
| `:t.` | Duplicate the current line below itself without using a register. | practical-vim:3105 |
| `:%normal A;` | Append a semicolon at the end of every line by running a Normal mode command across a range. | practical-vim:3269 |
| `@:` | Repeat the most recently executed Ex command. | practical-vim:3289 |
| `:col<C-d>` | Reveal the list of possible tab-completions for the col prefix. | practical-vim:3313 |
| `<C-r><C-w>` | Insert the word under the cursor at the command-line prompt. | practical-vim:3362 |
| `q:` | Open the command-line window with the history of Ex commands. | practical-vim:3460 |
| `:!ruby %` | Run an external command, with % standing for the current file name. | practical-vim:3544 |
| `:2,$!sort -t',' -k2` | Filter lines 2 through the last line through the external sort command. | practical-vim:3620 |
| `:g/href/j` | Run :join on every line where href matches (global command). | practical-vim:3717 |
| `:argdo source batch.vim` | Source the script once in every file of the argument list. | practical-vim:3817 |

Concepts: Ex commands strike far and wide (2811); Range syntax {start},{end} (2877); Visual selection range marks (2943); Pattern addresses in a range (2959); Address symbols for ranges (2989); :t as the copy TO mnemonic (3093); Moving lines with :m (3129); The : register and @: repeat (3295); wildmode and wildmenu completion (3344); Command-line window (3462); Filtering a range through an external program (3602); Batching Ex commands in a sourced script (3756)

Defects: missing@2753; garbled@2758; garbled@2991; garbled@3055; typo@3167; typo@3245; typo@3247; garbled@3660; duplicated@3840

## practical-vim — Ch 6: Manage Multiple Files (3857–4375)

Chapter 6 explains how Vim manages multiple files through the buffer list, the argument list, and split windows organized into tab pages. It distinguishes files on disk from in-memory buffers, shows how to inspect and navigate the buffer list with :ls, :bnext, and <C-^>, and warns about hiding modified buffers and reconciling them when quitting. It then covers populating the :args argument list with names, globs, and backtick expansion, running :argdo across that set, and finally dividing the workspace with <C-w>s and <C-w>v, moving focus, resizing, and using :tabedit with {N}gt to switch tab pages.

| keys | meaning | citation |
|---|---|---|
| `:ls` | List all loaded buffers with their numbers and status flags. | practical-vim:3892 |
| `:bnext` | Switch to the next buffer in the buffer list. | practical-vim:3900 |
| `<C-^>` | Toggle between the current buffer and the alternate file. | practical-vim:3908 |
| `:buffer {bufname}` | Jump directly to a buffer by number, or by a unique fragment of its name. | practical-vim:3924 |
| `:bdelete` | Remove buffers from the buffer list without touching their files on disk. | practical-vim:3932 |
| `:args` | Print the current contents of the argument list. | practical-vim:3958 |
| `:args {arglist}` | Replace the argument list with the given filenames, wildcards, or shell output. | practical-vim:3972 |
| `:args **/*.js **/*.css` | Populate the argument list from several globs at once. | practical-vim:4034 |
| `:args `cat .chapters`` | Populate the argument list from the output of a shell command. | practical-vim:4052 |
| `:bnext!` | Force a switch to the next buffer, abandoning unsaved changes. | practical-vim:4097 |
| `:argdo {cmd}` | Execute an Ex command on each file in the argument list. | practical-vim:4148 |
| `<C-w>s / <C-w>v` | Split the current window horizontally or vertically, reusing the current buffer. | practical-vim:4176 |
| `<C-w>w` | Cycle the focus between open windows. | practical-vim:4208 |
| `:tabedit {filename}` | Open a file in a new tab page. | practical-vim:4306 |
| `{N}gt / gT` | Jump to tab page N, or move to the next/previous tab. | practical-vim:4332 |

Concepts: Files versus buffers (3878); Buffer list (3898); Alternate file (% and # flags) (3908); Argument list (3962); Globs and wildcard expansion (3996); Backtick expansion (4054); Hidden buffers (4105); 'hidden' setting for :*do commands (4162); Windows as viewports onto buffers (4172); Tab pages as containers of windows (4286); Local working directory with :lcd (4302); Resizing windows (4252)

Defects: garbled@3870; typo@3960; garbled@4000; garbled@4125; garbled@4236; garbled@4254

## practical-vim — Ch 7: Open Files and Save Them to Disk (4376–4734)

Chapter 7 covers opening files and saving buffers to disk. It explains how :edit resolves filepaths against the working directory or the active buffer's directory (using %:h), how to configure 'path' and use :find to open files by name, and how the netrw plugin's :Explore commands browse directories. It ends with techniques for writing buffers whose parent directories do not exist and for saving a root-owned file by piping the buffer through sudo tee.

| keys | meaning | citation |
|---|---|---|
| `:edit lib/framework.js` | Open a file from a path relative to Vim's working directory. | practical-vim:4445 |
| `:edit %<Tab>` | Expand the active buffer's filepath on the command line. | practical-vim:4459 |
| `:edit %:h<Tab>` | Expand the active buffer's directory using the :h modifier. | practical-vim:4463 |
| `:edit %:h<Tab>M<Tab><Tab>` | Open a sibling file by expanding the active directory, then tab-completing the name. | practical-vim:4471 |
| `:set path+=app/**` | Add the app/ tree to the 'path' search list. | practical-vim:4513 |
| `:find Navigation.js` | Open a file by name, searching the directories in 'path'. | practical-vim:4527 |
| `:edit .` | Open netrw's file explorer for the current working directory. | practical-vim:4575 |
| `:Explore` | Open netrw's file explorer for the directory of the active buffer. | practical-vim:4577 |
| `:Sexplore / :Vexplore` | Open netrw's file explorer in a horizontal or vertical split window. | practical-vim:4595 |
| `<C-^>` | Switch back to the buffer that was previously displayed. | practical-vim:4609 |
| `<C-g>` | Echo the name and status of the current file. | practical-vim:4625 |
| `:write` | Write the buffer's contents to its file on disk. | practical-vim:4631 |
| `:!mkdir -p %:h` | Create the buffer's missing parent directories with the external mkdir program. | practical-vim:4637 |
| `:write!` | Force a write, overriding the 'readonly' option. | practical-vim:4677 |
| `:w !sudo tee % > /dev/null` | Pipe the buffer through sudo tee to overwrite a root-owned file. | practical-vim:4683 |

Concepts: Working directory (4437); Filepath relative to the working directory (4435); Filepath relative to the active file's directory (4453); The %:h filename modifier (4465); The %% command-line mapping for the active directory (4481); The 'path' option (4511); The ** wildcard in 'path' (4515); Tab completion of filepaths (4529); The netrw file explorer (4543); Saving to nonexistent directories (4623); Readonly buffers (4673); Writing as the superuser with :write !{cmd} (4695)

Defects: garbled@4391; garbled@4581; typo@4559

## practical-vim — Ch 8: Navigate Inside Files with Motions (4735–5722)

Chapter 8 is a tour of motions for moving within a file. It starts with home-row h/j/k/l and the difference between real lines and display lines (j/k vs. gj/gk, 0/^/$ and their g variants), then covers word and WORD motions (w/b/e/ge, W/B/E/gE), character searches (f/F/t/T with ; and ,), and the search command (/pattern with n and N), including its use as an operator motion. The chapter ends with text objects (i/a prefixes, iw/aw, daw/ciw), marks (m, `{mark}, automatic marks), % with the matchit plugin, and a brief look at surround.vim.

| keys | meaning | citation |
|---|---|---|
| `h j k l` | Move left, down, up, or right one step without leaving the home row | practical-vim:4763 |
| `gj gk` | Move down or up by display line rather than by real line | practical-vim:4827 |
| `0 $` | Jump to the first character or the end of a real line; g-prefixed forms act on display lines | practical-vim:4875 |
| `w b e ge` | Move word-wise to the next/previous word start or word end | practical-vim:4921 |
| `W B E gE` | WORD-wise versions of w, b, e, and ge | practical-vim:4941 |
| `f{char} ; ,` | Search forward to a character, repeat that search, and reverse it | practical-vim:5103 |
| `t{char} T{char}` | Search till just before/after the target character | practical-vim:5131 |
| `/takes<CR>` | Search forward for a multi-character pattern | practical-vim:5185 |
| `n N` | Repeat the last search forward or backward | practical-vim:5215 |
| `d/ge<CR>` | Delete up to a search match, using the search as an exclusive motion | practical-vim:5261 |
| `vi}` | Visually select everything inside a pair of braces | practical-vim:5289 |
| `ci"` | Change the text inside double quotes | practical-vim:5449 |
| `daw` | Delete the current word with the aw text object | practical-vim:5512 |
| `mm `m` | Set mark m and jump back to it | practical-vim:5554 |
| `%` | Jump between matching parentheses, braces, or brackets | practical-vim:5604 |

Concepts: Real lines vs. display lines (4823); Operator-Pending mode (4748); Text objects (5273); Inside vs. around text objects (i/a prefixes) (5355); Delimited vs. bounded text objects (5502); Words vs. WORDS (4941); Character search commands (5011); Exclusive motion (5265); Act, repeat, reverse (5081); Finger macro (5151); Automatic marks (5560); matchit plugin (5675)

Defects: garbled@4765; typo@4943; typo@5001; typo@5185; typo@5345; typo@5395; garbled@5566

## practical-vim — Ch 9: Navigate Between Files with Jumps (5723–5979)

Chapter 9 (Tips 56–59) explains jump-based navigation: jumps record cursor positions in a per-window jump list that <C-o> and <C-i> traverse backward and forward, and unlike ordinary motions they can cross file boundaries. It contrasts the jump list with the per-buffer change list (g; and g,) and the `. and `^ marks, then shows how gf treats a filepath under the cursor as a hyperlink configured by 'suffixesadd' and 'path'. The chapter closes with global marks (m{letter}), which persist across files and sessions and are worth setting before commands such as :vimgrep.

| keys | meaning | citation |
|---|---|---|
| `<C-o>` | Jump backward through the jump list, like a browser's back button | practical-vim:5736 |
| `<C-i>` | Jump forward through the jump list, like a browser's forward button | practical-vim:5736 |
| `:jumps` | Print the contents of the jump list | practical-vim:5740 |
| `[count]G` | Jump directly to a line number; this counts as a jump | practical-vim:5764 |
| `/pattern<CR>` | Search forward and jump to the next occurrence of the pattern | practical-vim:5768 |
| `n / N` | Jump to the next or previous search match | practical-vim:5768 |
| `%` | Jump to the matching parenthesis | practical-vim:5772 |
| `( / )` | Jump to the start of the previous or next sentence | practical-vim:5776 |
| `{ / }` | Jump to the start of the previous or next paragraph | practical-vim:5780 |
| `gf` | Jump to the file name under the cursor | practical-vim:5788 |
| `<C-]>` | Jump to the definition of the keyword under the cursor | practical-vim:5792 |
| `g; / g,` | Traverse backward or forward through the change list | practical-vim:5834 |
| `gi` | Restore the cursor to the last insertion point and switch back to Insert mode | practical-vim:5844 |
| `m{letter}` | Create a mark at the cursor; uppercase letters create global marks | practical-vim:5930 |
| ``{letter}` | Snap the cursor back to a mark | practical-vim:5930 |

Concepts: Jump list (5736); Jumps vs. motions (5738); Mapping <Tab> also overrides <C-i> (5808); Change list (5818); Last-change marks (`. and `^) (5840); Change list per buffer vs. jump list per window (5846); Filepath under the cursor as a hyperlink (5852); 'suffixesadd' extension lookup (5890); 'path' search directories (5902); Global marks (5928); Global marks persist between sessions (5932); Set a global mark before code diving (5934)

Defects: garbled@5732; typo@5754; garbled@5762; typo@5796; typo@5884

## practical-vim — Ch 10: Copy and Paste (5980–6630)

Chapter 10 explains Vim's copy-and-paste model, where delete cuts into registers, yank copies, and put pastes. It walks through transposing characters with xp, transposing lines with ddp, and duplicating lines with yyp, then shows the "clobbered yank" pitfall in which diw overwrites the unnamed register. Tip 61 catalogues the register types: unnamed (""), yank ("0), named ("a-"z), black hole ("_), system clipboard ("+) and selection ("*), plus the expression ("=) and read-only registers. Tips 62-64 cover replacing a Visual selection with a register (and its content-swapping side effect), line-wise versus character-wise put behavior with gP and <C-r>{register}, and avoiding autoindent corruption from the system paste command by using the 'paste' and 'pastetoggle' options.

| keys | meaning | citation |
|---|---|---|
| `xp` | Cut the character under the cursor and put it after the cursor, transposing the next two characters | practical-vim:6024 |
| `ddp` | Cut the current line and put it below its successor, transposing the order of two lines | practical-vim:6056 |
| `yyp` | Yank the current line and put it below itself, duplicating the line as a template | practical-vim:6078 |
| `yiw` | Yank the current word into the unnamed register | practical-vim:6121 |
| `diw` | Delete (cut) the current word, which also overwrites the unnamed register | practical-vim:6123 |
| `P` | Put the register contents in front of the cursor | practical-vim:6125 |
| `"ayiw` | Yank the current word into named register a | practical-vim:6155 |
| `"0P` | Put from the yank register, which a delete does not overwrite | practical-vim:6203 |
| `"_d{motion}` | Delete text into the black hole register, copying it nowhere | practical-vim:6253 |
| `"+p` | Paste the contents of the system clipboard (plus) register | practical-vim:6289 |
| `p` | Used from Visual mode, replace the selection with the register contents (and swap the old selection into the register) | practical-vim:6347 |
| `<C-r>{register}` | Insert a register's contents from Insert mode, always in front of the cursor | practical-vim:6465 |
| `gP` | Put a line-wise register above the current line and leave the cursor at the end of the pasted text | practical-vim:6495 |
| `:set paste!` | Toggle the 'paste' option (used to switch it off again after pasting) | practical-vim:6615 |
| `:set pastetoggle=<f5>` | Assign <f5> to toggle the 'paste' option on and off | practical-vim:6619 |

Concepts: Delete, yank, and put terminology (6141); The unnamed register (6161); The yank register (6171); The named registers (6217); The black hole register (6253); The system clipboard (plus) register (6287); The selection (star) register and the X11 primary clipboard (6291); The expression register (6309); Read-only registers (6315); Visual put swaps text with the register (6383); Line-wise vs. character-wise registers (6447); The 'paste' option for pasting in a terminal (6613)

Defects: missing@5993; garbled@6005; garbled@6143; typo@6091; typo@6157; garbled@6597

## practical-vim — Ch 11: Macros (6631–7677)

Chapter 11 introduces Vim macros: recording keystrokes into a register with q{register} and replaying them with @{register} or @@. It contrasts executing a macro in series, where one failure aborts the remaining queued repetitions, with executing it in parallel via :normal @a or :argdo normal @a, where each invocation is independent. It also teaches repeatable macro design (normalize the cursor, prefer robust motions, let failed motions abort safely), playback with a count, appending with qA, editing a macro as plain text, and using the expression register with a counter to number list items.

| keys | meaning | citation |
|---|---|---|
| `q{register}` | Begin recording keystrokes into the named register | practical-vim:6656 |
| `q` | Stop recording the macro | practical-vim:6694 |
| `@{register}` | Execute the macro stored in the named register | practical-vim:6708 |
| `@@` | Repeat the macro most recently invoked | practical-vim:6708 |
| `10@a` | Play the macro in register a with a count, repeating it ten times | practical-vim:6808 |
| `qq;.q` | Record a one-off macro in register q that runs ; then . | practical-vim:6834 |
| `qA` | Append keystrokes to the existing macro in register a instead of overwriting it | practical-vim:7124 |
| `:reg a` | Inspect the contents of register a | practical-vim:6698 |
| `:normal @a` | Run the macro once on each line of the selected range | practical-vim:7076 |
| `:argdo normal @a` | Run the macro once in every buffer in the argument list | practical-vim:7331 |
| `:next` | Advance to the next file in the argument list; failure on the last file aborts a series macro | practical-vim:7383 |
| `:let i += 1` | Increment the counter variable i | practical-vim:7451 |
| `:put a` | Paste the contents of register a below the current line as plain text | practical-vim:7577 |
| `"ay$` | Yank from the cursor to the end of the line into register a, character-wise | practical-vim:7635 |
| `<C-r>=i<CR>` | Insert the value of variable i via the expression register in Insert mode | practical-vim:7457 |

Concepts: Record one unit of work (6896); Execute the macro in series (6958); Execute the macro in parallel (7032); Normalize the cursor position (6782); Strike your target with a repeatable motion (6788); Abort when a motion fails (6798); Play back with a count (6814); Append commands to a macro (7092); Keyboard codes in macros (7555); Paste the macro into a document (7571); Evaluate an iterator to number items in a list (7407); Build a list of target files (7213)

Defects: typo@6642; missing@6648; typo@7034; garbled@7062; typo@7096; garbled@7517; missing@7607; typo@7641

## practical-vim — Ch 12: Matching Patterns and Literals (7678–8165)

The chapter explains how Vim's search engine interprets patterns, beginning with global and per-search case sensitivity and the two regex engines. It contrasts magic, very magic (\v), and very nomagic (\V) searches, then shows captures, backreferences, and noncapturing groups for repeated words and name swapping. The final tips cover word and match boundaries, lookaround assertions, and the /, ?, and \ characters that must still be escaped in search patterns.

| keys | meaning | citation |
|---|---|---|
| `:set ignorecase` | Enable case-insensitive search globally. | practical-vim:7699 |
| `\c / \C` | Override case sensitivity for one search: \c ignores case, \C forces it. | practical-vim:7705 |
| `/#\([0-9a-fA-F]\{6}\|[0-9a-fA-F]\{3}\)` | Magic-search regex matching three- or six-digit hex colors. | practical-vim:7812 |
| `/\v#(\x{6}|\x{3})` | Very magic hex-color regex using the \x character class. | practical-vim:7836 |
| `/\Va.k.a.` | Very nomagic search for the literal text a.k.a. | practical-vim:7924 |
| `/\v<(\w+)\_s+\1>` | Match a repeated word with a capture group and \1 backreference. | practical-vim:7948 |
| `/\v%(And|D)rew Neil` | Group alternatives without capturing the submatch. | practical-vim:7966 |
| `:%s//\2, \1/g` | Substitute using the last search and captured first/last names. | practical-vim:7972 |
| `/\v<the><CR>` | Search for the whole word 'the' using word boundaries. | practical-vim:7988 |
| `* / #` | Search forward or backward for the word under the cursor. | practical-vim:7996 |
| `/\v"@<=[^"]+"@=` | Positive-lookaround rewrite of the quoted-text pattern. | practical-vim:8018 |
| `/\v"\zs[^"]+\ze"<CR>` | Crop the match to the quoted contents with \zs and \ze. | practical-vim:8034 |
| `"uyi[` | Yank the bracketed URL into register u. | practical-vim:8060 |
| `/\V<C-r>u<CR>` | Insert register u into the search prompt. | practical-vim:8060 |
| `/\Vhttp:\/\/vimdoc.net\/search?q=\/\\\\` | Escape / and \ in a very nomagic search to match the full URL literally. | practical-vim:8120 |

Concepts: ‘ignorecase’ option (7697); ‘smartcase’ option (7711); Very magic search (7822); Hex character class \x (7834); Magic search (7862); Very nomagic search (7922); Capture submatches (7934); Parentheses without capturing (7958); Word boundaries (7988); Match boundaries with \zs and \ze (8006); Lookaround assertions (8012); Search field terminators (8146)

Defects: typo@7691; garbled@7715; garbled@7842; typo@7874; garbled@7890; garbled@8024; typo@8136; typo@8142

## practical-vim — Ch 13: Search (8166–8802)

Chapter 13 is a tour of Vim's search command and the workflows built on it. It covers forward and backward searches with / and ?, repeating with n and N (which inherit direction and offsets), highlighting matches with 'hlsearch' and muting them with :nohlsearch or a <C-l> mapping, previewing matches live with 'incsearch' and completing the search field with <C-r><C-w>, and using search offsets such as /lang/e to land at the end of a match. It then shows how gn enables operating on a complete match (gUgn and the Improved Dot Formula), how to iterate on a pattern through search history or the q/ command-line window, how to count matches with :%s///gn and :vimgrep, and ends with a Vim script that redefines * in Visual mode to search for the current selection.

| keys | meaning | citation |
|---|---|---|
| `/` | Open the forward search prompt; enter a pattern, then press <CR> to execute the search | practical-vim:8187 |
| `?` | Open the search prompt so that Vim scans backward through the document | practical-vim:8195 |
| `n N` | Jump to the next match or the previous match for the current search pattern | practical-vim:8199 |
| `gn` | Move to the next match, then enable Visual mode and select the matching text (also usable as an operator motion) | practical-vim:8236 |
| `:nohlsearch` | Mute search highlighting temporarily; it stays muted until the next new or repeat search | practical-vim:8256 |
| `nnoremap <silent> <C-l> :<C-u>nohlsearch<CR><C-l>` | Mapping that clears the screen and mutes search highlighting | practical-vim:8262 |
| `‘incsearch’` | Option that previews the first match while the search pattern is still being typed | practical-vim:8272 |
| `<C-r><C-w>` | Autocomplete the search field using the remainder of the current preview match | practical-vim:8306 |
| `/lang/e<CR>` | Search for lang and use the e offset to place the cursor at the end of the match | practical-vim:8350 |
| `//e<CR>` | Repeat the previous search with an offset, reusing the pattern because the search field is left blank | practical-vim:8392 |
| `gUgn` | Uppercase the next search match by combining the gU operator with the gn motion | practical-vim:8471 |
| `q/` | Open the command-line window prepopulated with search history, so patterns can be edited with modal editing | practical-vim:8577 |
| `:%s///gn` | Count the matches for the current pattern: the substitute n flag reports the count instead of replacing | practical-vim:8672 |
| `:vimgrep //g %` | Populate the quickfix list with every match of the current pattern in the current file | practical-vim:8694 |
| `xnoremap * :<C-u>call <SID>VSetSearch('/')<CR>/<C-R>=@/<CR><CR>` | Redefine * in Visual mode to search for the current selection rather than the word under the cursor | practical-vim:8771 |

Concepts: Search wraps around the document (8189); Repeating a search with the previous pattern but a new direction or offset (8203); Browsing the search history with <Up> (8240); 'hlsearch' highlights every match in the document and in all open splits (8248); Incremental search gives instant preview feedback before execution (8294); Search offsets position the cursor relative to a match (8314); The classic Dot Formula: one keystroke to move, one to make the change (8485); The Improved Dot Formula (8489); The Improved Dot Formula requires a pattern that matches before the change but not after it (8497); Iterative pattern refinement: start with a broad match, then focus on the target (8637); Counting matches with the n flag of :substitute (8676); Populating the quickfix list with :vimgrep (8698)

Defects: garbled@8181; garbled@8205; duplicated@8236; order@8720; typo@8565; garbled@8191

## practical-vim — Ch 14: Substitution (8803–9601)

Chapter 14, comprising Tips 88 through 97, dissects Vim's :substitute command as an Ex command with a range, a pattern, a replacement string, and optional flags. It shows how the g flag works within a line while a % address works across lines, and how the c flag lets the user confirm each change. Later tips reuse the last search pattern, insert register contents, reference submatches, evaluate Vim script in the replacement field, and finish with project-wide substitutions via :vimgrep and :cfdo.

| keys | meaning | citation |
|---|---|---|
| `:s/going/rolling` | Substitute the first match of going with rolling on the current line. | practical-vim:8910 |
| `:s/going/rolling/g` | Add the g flag to change every match of going on the current line. | practical-vim:8926 |
| `:%s/going/rolling/g` | Prefix % to run the substitution on every line of the file. | practical-vim:8938 |
| `:%s/content/copy/gc` | Add the c flag to confirm or reject each match interactively. | practical-vim:8968 |
| `:%s//<C-r>0/g` | Insert the contents of register 0 into the replacement field by value. | practical-vim:9072 |
| `:%s//\=@0/g` | Evaluate the @0 register reference at run time, passing the register by reference. | practical-vim:9084 |
| `:%s//~/&` | Longhand for g&: repeat the last substitute with its replacement and flags across the whole file. | practical-vim:9132 |
| `:&&` | Repeat the last substitute reusing its flags, optionally with a new range. | practical-vim:9298 |
| `/\v^([^,]*),([^,]*),([^,]*)$` | Very-magic pattern capturing three comma-separated fields as submatches. | practical-vim:9332 |
| `:%s//\3,\2,\1` | Reorder the captured fields using backreferences in the replacement field. | practical-vim:9334 |
| `:%s//\=submatch(0)-1/g` | Evaluate submatch(0)-1 to decrement each matched numeral. | practical-vim:9384 |
| `:%s//\={"dog":"man","man":"dog"}[submatch(1)]/g` | Use an inline dictionary keyed by the captured word to swap words in one pass. | practical-vim:9456 |
| `/Pragmatic\ze Vim` | Match Pragmatic only when followed by Vim by ending the match with \ze. | practical-vim:9523 |
| `:vimgrep // **/*.txt` | Search the project for the last pattern and populate the quickfix list. | practical-vim:9540 |
| `:cfdo %s//Practical/gc` | Run the substitute command on every file in the quickfix list, confirming each match. | practical-vim:9560 |

Concepts: Substitute command anatomy: [range]s[ubstitute]/{pattern}/{string}/[flags] (8824); g flag: global substitution within the current line (8832); c flag: confirm or reject each change (8834); & flag: reuse the flags from the previous substitute command (8840); Two-dimensional model: x-axis over a line, y-axis over the file (8918); Substitute-Confirmation prompt y/n/a/q/l/^E/^Y (8974); Blank search field reuses the most recent search pattern (9020); Pass a register by value or by reference (9064); \={Vim script} replacement evaluates an expression (8886); Capturing fields as submatches in the search pattern (9336); \zs zooms in on part of the match (9374); :cfdo runs an Ex command on each file in the quickfix list (9590)

Defects: missing@8818; garbled@8846; garbled@8908; garbled@8976; typo@9028; typo@9102; typo@9278; typo@9338; garbled@9548

## practical-vim — Ch 15: Global Commands (9602–10021)

Chapter 15 (Tips 98–101) covers Vim's :global command, which runs an Ex command on each line matching a pattern, with the whole file as its default range and :print as its default command. Tips 98 and 99 explain the syntax, the two-pass execution model, inversion via :global! and :vglobal, and line filtering with :g//d and :v/href/d. Tip 100 collects TODO comments into a register with :g/TODO/yank A or copies them to the end of the file with :g/TODO/t$, and Tip 101 uses a dynamic range (:g/{/ .+1,/}/-1 sort) to alphabetize the properties in every CSS rule block, adding :silent to mute :> messages.

| keys | meaning | citation |
|---|---|---|
| `:[range] global[!] /{pattern}/ [cmd]` | Syntax template for the :global command | practical-vim:9617 |
| `:global! / :vglobal` | Run [cmd] on each line that does NOT match the pattern | practical-vim:9625 |
| `:g/re/p` | Abbreviated global command: pattern, then :print — origin of “grep” | practical-vim:9633 |
| `/\v\<\/?\w+>` | Search with a very magic pattern matching HTML tags | practical-vim:9689 |
| `:g//d` | Delete every line matching the last search pattern | practical-vim:9691 |
| `:v/href/d` | Delete every line that does not contain href | practical-vim:9711 |
| `:g/TODO` | Print each line containing TODO (default :print command) | practical-vim:9765 |
| `qaq` | Clear register a by recording an empty macro | practical-vim:9775 |
| `:g/TODO/yank A` | Append each TODO line into register a (uppercase A appends) | practical-vim:9785 |
| `"ap` | Paste the contents of register a | practical-vim:9795 |
| `:g/TODO/t$` | Copy each TODO line to the end of the file with :t | practical-vim:9805 |
| `vi{` | Select the inner {} block with a text object | practical-vim:9873 |
| `:’<,’>sort` | Sort the lines in the last visual selection | practical-vim:9891 |
| `:g/{/ .+1,/}/-1 sort` | Sort each {} block using a range anchored on the :global match | practical-vim:9915 |
| `:g/{/sil .+1,/}/-1 >` | Indent each block with :> while :silent mutes the messages | practical-vim:9995 |

Concepts: Default range for :global is the whole file (%) (9619); Blank {pattern} reuses the last search pattern (9621); Default [cmd] is :print; any Ex command except :global (9623); Two-pass execution: mark matching lines, then run [cmd] (9627); grep etymology from :g/re/p (9635); Very magic mode regular expression (9703); Clearing a register with qaq (9775); Uppercase register address appends instead of overwriting (9793); Dynamic range anchored on the :global match (9813); The . address stands for each matching line inside :global (9959); Generalized form :g/{start}/ .,{finish} [cmd] (9981); Prefixing [cmd] with :silent mutes its messages (9993)

Defects: missing@9611; garbled@9853; duplicated@10003

## practical-vim — Ch 16: Index and Navigate (10022–10407)

Chapter 16 shows how to index a codebase with Exuberant Ctags and then jump around that codebase from inside Vim. It covers installing and running ctags, the anatomy of the tags file (pattern-based keyword addresses and metadata), configuring the 'tags' option, and the navigation commands <C-]>, g<C-]>, <C-t>, :tag, :tjump, :tselect, :tnext, :tprev, :tfirst, and :tlast, together with tag priority and tag history. It closes by comparing ways to keep the index fresh: manual :!ctags -R, an <F5> mapping, a BufWritePost autocommand, or version-control hooks.

| keys | meaning | citation |
|---|---|---|
| `:set tags?` | Inspect the current value of the 'tags' option, showing where Vim searches for tags files. | practical-vim:10152 |
| `:!ctags -R` | Run ctags recursively from Vim's working directory to rebuild the tags index. | practical-vim:10170 |
| `:nnoremap <f5> :!ctags -R<CR>` | Map the <F5> key to the ctags rebuild command so the index can be regenerated without typing it out. | practical-vim:10176 |
| `:autocmd BufWritePost * call system("ctags -R")` | Re-index the codebase automatically every time a buffer is written to a file. | practical-vim:10184 |
| `<C-]>` | Jump from the keyword under the cursor to its definition. | practical-vim:10210 |
| `g<C-]>` | Like <C-]> but present the tag match list to choose from when a keyword has multiple matches. | practical-vim:10296 |
| `:tselect` | Retrospectively pull up the tag match list for the last jump and choose a different destination. | practical-vim:10322 |
| `:tnext` | Jump to the next matching tag without showing a prompt. | practical-vim:10322 |
| `:tag {keyword}` | Jump to the first tag matching {keyword} without placing the cursor on the word. | practical-vim:10326 |
| `:tjump {keyword}` | Jump to {keyword}, prompting with the tag match list when several tags match. | practical-vim:10326 |
| `:tag Fran<Tab>` | Tab-complete a tag name on the Ex command line from the keywords in the tags file. | practical-vim:10328 |
| `:pop or <C-t>` | Reverse through the tag history back to the previously visited definition. | practical-vim:10366 |
| `:tprev` | Jump to the previous matching tag. | practical-vim:10380 |
| `:tfirst` | Jump to the first matching tag. | practical-vim:10384 |
| `:tlast` | Jump to the last matching tag. | practical-vim:10388 |

Concepts: ctags as an external code indexer (10029); Tags file anatomy (keyword, filename, address) (10115); Keywords addressed by search pattern, not line number (10117); Extended tags metadata (class and function kind fields) (10127); The 'tags' option and its ./ expansion (10150); Re-indexing via a BufWritePost autocommand (10182); Re-indexing via version control hooks (10192); Tag jump history (the tag stack) (10284); Tag priority when several tags match a keyword (10294); The tag match list selection prompt (10318); Tag-name tab completion on the Ex command line (10328); Regular-expression tag search with :tag /{pattern} (10330)

Defects: typo@10033; garbled@10039; garbled@10101; garbled@10212; typo@10284; truncation@10334; garbled@10348

## practical-vim — Ch 17: Compile Code and Navigate Errors (10408–10795)

Chapter 17 presents Vim's quickfix list as the bridge between external tools and editing: :make runs the program named by 'makeprg', parses its output into records, and jumps to the first error, while :make! updates the list without moving the cursor. Tip 106 tours the :cnext/:cprev/:cfirst/:clast/:cnfile/:cpfile family, the :copen window, count-prefixed navigation, and the parallel location-list commands; Tip 107 treats :colder and :cnewer as undo/redo over the last ten quickfix lists. Tip 108 customizes :make for JSLint through nodelint, setting 'makeprg' and 'errorformat' directly or via :compiler, and closes by arguing that Vim's notion of a compiler covers interpreted languages and markup too.

| keys | meaning | citation |
|---|---|---|
| `:make` | Run the external compiler named by 'makeprg' (make by default), parse its output into the quickfix list, and jump to the first error. | practical-vim:10468 |
| `:make!` | Run :make but update the quickfix list without jumping to the first error. | practical-vim:10534 |
| `:cnext` | Jump to the next item in the quickfix list. | practical-vim:10552 |
| `:cprev` | Jump to the previous item in the quickfix list. | practical-vim:10556 |
| `:cfirst` | Jump to the first item in the quickfix list. | practical-vim:10560 |
| `:clast` | Jump to the last item in the quickfix list. | practical-vim:10564 |
| `:cnfile` | Jump to the first item in the next file. | practical-vim:10568 |
| `:cpfile` | Jump to the last item in the previous file. | practical-vim:10572 |
| `:copen` | Open a window containing the contents of the quickfix list. | practical-vim:10580 |
| `:cclose` | Close the quickfix window. | practical-vim:10584 |
| `:colder` | Recall an older quickfix list; Vim keeps the last ten. | practical-vim:10634 |
| `:cnewer` | Revert from an old quickfix list back to a newer one. | practical-vim:10634 |
| `:compiler nodelint` | Activate the nodelint compiler plugin, which sets 'makeprg' and 'errorformat' together. | practical-vim:10736 |
| `:setlocal makeprg=NODE_DISABLE_COLORS=1\ nodelint\ %` | Set the buffer-local 'makeprg' so :make runs nodelint with ANSI colors disabled on the current file. | practical-vim:10682 |
| `:setlocal efm=%A%f\,\ line\ %l\,\ character\ %c:%m,%Z%.%#,%-G%.%#` | Set the buffer-local 'errorformat' so :make can parse nodelint's filename, line and character messages. | practical-vim:10728 |

Concepts: Quickfix list (10415); Edit-compile-edit cycle (10482); Jump list recovery with <C-o> (10536); Location list (10600); Count-prefixed quickfix navigation (10612); Quickfix window (10622); Quickfix undo/redo (10638); 'makeprg' (10680); 'errorformat' (10718); Compiler plugin (10738); Autocommand or file-type plugin (10764); Vim's definition of a compiler (10772)

Defects: typo@10419; order@10423; missing@10425; garbled@10544; garbled@10550

## practical-vim — Ch 18: Search Project-Wide (10796–11099)

Chapter 18 explains how to search across an entire project from within Vim. It presents :grep as a wrapper for external grep-like programs, shows how grepprg and grepformat control the command and parse its output (including ack with --nogroup and --column), and introduces :vimgrep for searching multiple files with Vim's own regex engine. It also covers quickfix navigation, file and argument-list patterns such as ##, and reusing the current search pattern or search history.

| keys | meaning | citation |
|---|---|---|
| `:grep Waldo *` | Search all files in the current directory with the external grep program and load the matches into the quickfix list. | practical-vim:10843 |
| `:grep -i Waldo *` | Pass -i through to grep for a case-insensitive project-wide search. | practical-vim:10853 |
| `:cnext/:cprev` | Jump to the next or previous entry in the quickfix list. | practical-vim:10845 |
| `:set grepprg=ack\ --nogroup\ $*` | Route :grep through ack, using --nogroup for grep-style output and $* for the search arguments. | practical-vim:10932 |
| `:set grepprg=ack\ --nogroup\ --column\ $*` | Make ack include column numbers in its output. | practical-vim:10956 |
| `:set grepformat=%f:%l:%c:%m` | Parse ack's filename, line, column, and message fields into the quickfix list. | practical-vim:10958 |
| `:vimgrep /going/ clock.txt tough.txt where.txt` | Search several named files with Vim's regex engine and populate the quickfix list. | practical-vim:10993 |
| `:vim /going/g clock.txt tough.txt where.txt` | Add g so every match on a line is recorded, not just the first. | practical-vim:11011 |
| `:vim /going/g *.txt` | Search every .txt file in the current directory using a wildcard. | practical-vim:11033 |
| `:args *.txt` | Load the .txt files into Vim's argument list. | practical-vim:11042 |
| `:vim /going/g ##` | Run :vimgrep over all files in the argument list via ##. | practical-vim:11044 |
| `/[Dd]on't` | Search the current file for a pattern that matches both don't and Don't. | practical-vim:11062 |
| `:vim //g *.txt` | Leave the pattern field empty so :vimgrep reuses the current search pattern across *.txt. | practical-vim:11064 |
| `:vim //g ##` | Search every file in the argument list for the current search pattern. | practical-vim:11076 |
| `:vim /<C-r>//g ##` | Insert the current search pattern with <C-r>/ and run :vimgrep over the argument list. | practical-vim:11086 |

Concepts: :grep external wrapper (10813); quickfix list (11005); grepprg setting (10865); grepformat setting (10869); errorformat-style match tokens (10883); ack --nogroup output (10920); ack --column output (10944); :vimgrep native regex engine (10966); g flag for all matches (11009); ## argument-list expansion (11037); empty pattern reuses current search (11055); search-history dependence (11080)

Defects: missing@10811; garbled@10845; typo@10875; missing@10885; typo@10993; typo@11048

## practical-vim — Ch 19: Dial X for Autocompletion (11100–11559)

This chapter covers Vim's insert-mode autocompletion: triggering the pop-up menu, moving through matches, accepting or dismissing a choice, and refining the list by typing. It explains how generic keyword completion draws on buffers, included files, and tags, how the 'complete' option controls those sources, and how specialized variants complete dictionary words, whole lines, filenames, and context-aware omni suggestions. It also shows how remembered completion context can be reused to insert sequences of words and lines.

| keys | meaning | citation |
|---|---|---|
| `<C-p>` | Trigger generic keyword autocompletion; with the menu open, select the previous match. | practical-vim:11135 |
| `<C-n>` | Trigger generic keyword autocompletion; with the menu open, select the next match. | practical-vim:11137 |
| `<C-x><C-n>` | Complete keywords using only the current buffer. | practical-vim:11265 |
| `<C-x><C-i>` | Complete keywords sourced from files included by the current file. | practical-vim:11275 |
| `<C-x><C-]>` | Complete keywords sourced from the tags file. | practical-vim:11285 |
| `<C-x><C-k>` | Complete a word by dictionary lookup. | practical-vim:11311 |
| `<C-x><C-l>` | Complete an entire line from the available completion sources. | practical-vim:11327 |
| `<C-x><C-f>` | Complete a file path relative to Vim's working directory. | practical-vim:11464 |
| `<C-x><C-o>` | Trigger context-aware omni-completion. | practical-vim:11540 |
| `<C-y>` | Accept the currently selected completion. | practical-vim:11209 |
| `<C-e>` | Cancel completion and restore the originally typed text. | practical-vim:11213 |
| `<Down>` | Select the next match in the pop-up menu without changing the document. | practical-vim:11235 |
| `<C-x><C-p>` | Autocomplete from the remembered context; repeated use inserts the following words in sequence. | practical-vim:11436 |
| `<C-n><C-p>` | Invoke completion, step back to the starting match, then keep typing to live-filter the menu. | practical-vim:11249 |
| `:set complete-=i` | Remove included files from the sources scanned by generic keyword completion. | practical-vim:11297 |

Concepts: Keyword autocompletion (11125); Autocompletion and case sensitivity (11113); 'infercase' option (11119); Autocomplete pop-up menu (11185); Refine the word list as you type (11247); Generic keyword sources: buffers, included files, tags (11261); Customizing generic autocompletion with 'complete' (11295); Dictionary autocompletion (11309); Whole-line autocompletion (11325); Autocomplete sequences of words (11379); Filename completion relative to the working directory (11466); Omni-completion (context-aware completion) (11538)

Defects: missing@11107; garbled@11123; garbled@11141; garbled@11281; garbled@11339

## practical-vim — Ch 20: Find and Fix Typos with Vim’s Spell Checker (11560–11752)

Chapter 20 covers Vim's built-in spell checker across four tips. Tip 120 shows how to enable it with :set spell and operate it from Normal mode using ]s, [s, z=, and the zg/zw/zug family. Tip 121 explains the buffer-local 'spelllang' option, regional English variants such as en_us, and how Vim offers to download missing spell files via spellfile.vim, while Tip 122 shows how zg/zw additions persist in a spell file and how the 'spellfile' option can point at a separate jargon word list. Tip 123 demonstrates fixing misspellings without leaving Insert mode using the <C-x>s spelling autocompletion.

| keys | meaning | citation |
|---|---|---|
| `:set spell` | Enable Vim's built-in spell checker so unrecognized words are flagged | practical-vim:11583 |
| `]s` | Jump to the next spelling error | practical-vim:11605 |
| `[s` | Jump to the previous spelling error | practical-vim:11609 |
| `z=` | Ask Vim for a list of suggested corrections for the word under the cursor | practical-vim:11613 |
| `zg` | Add the word under the cursor to a spell file | practical-vim:11617 |
| `zw` | Mark the word under the cursor as misspelled, removing it from the spell file | practical-vim:11621 |
| `zug` | Revert the zg or zw command for the word under the cursor | practical-vim:11625 |
| `1<CR>` | In the z= suggestion list, accept the first suggestion and replace the word | practical-vim:11595 |
| `1z=` | Prefix z= with a count to apply the numbered suggestion directly, without the prompt | practical-vim:11597 |
| `:set spelllang=en_us` | Restrict accepted spellings to American English | practical-vim:11647 |
| `:set spelllang=fr` | Switch the buffer to the French spell file, prompting a download if it is missing | practical-vim:11659 |
| `2zg` | With a count, add the word to the numbered spell file (here the jargon list); 1zg targets the default list | practical-vim:11717 |
| `<C-x>s` | Trigger spelling autocompletion from Insert mode to fix an earlier misspelling | practical-vim:11739 |
| `<C-x><C-s>` | Alternative keystroke form of spelling autocompletion, slightly easier to type | practical-vim:11739 |
| `A` | Switch back to Insert mode at the end of the line after fixing a typo in Normal mode | practical-vim:11735 |

Concepts: SpellBad syntax highlighting marks flagged words (11585); Separating composition from a final spell-checking pass (11599); Buffer-local 'spelllang' option (11637); Regional English spelling variants (11649); spellfile.vim plugin offers to download missing spell files (11679); Words added with zg persist across sessions in a spell file (11695); 'spellfile' option can hold multiple word lists (11701); Separate spell file for specialist jargon (11703); Count prefix selects which spell file zg writes to (11717); Spelling autocompletion without leaving Insert mode (11723); <C-x>s scans backward to the nearest misspelled word (11743); Normal-mode repair sequence: [s, then 1z=, then A (11735)

Defects: garbled@11571; garbled@11603; missing@11683; duplicated@11751; typo@11567

## practical-vim — Ch 21: Now What? (11753–11976)

Chapter 21 closes Practical Vim by urging readers to keep practicing until Vim commands become second nature and to pick the book up again, since it is not designed for a single linear pass. It then encourages making Vim your own through a personal vimrc, while insisting that you first learn stock Vim’s baseline behavior—learn to use the saw before sharpening it—and closes with Vim’s charityware license. Note that the assigned range 11753-11976 runs past the chapter body’s end at 11798 into Appendix 1, "Customize Vim to Suit Your Preferences," so the command and concept entries include appendix material.

| keys | meaning | citation |
|---|---|---|
| `:x` | Write changes and quit (Ex command). | practical-vim:11798 |
| `:set ignorecase` | Enable the boolean 'ignorecase' option. | practical-vim:11838 |
| `:set noignorecase` | Disable 'ignorecase'; the 'no' prefix turns a boolean option off. | practical-vim:11842 |
| `:set ignorecase!` | Toggle the boolean 'ignorecase' option. | practical-vim:11846 |
| `:set ignorecase?` | Query and display the current value of 'ignorecase'. | practical-vim:11850 |
| `:set ignorecase&` | Reset 'ignorecase' to its default value. | practical-vim:11856 |
| `:set tabstop=2` | Set the 'tabstop' option to 2 columns. | practical-vim:11864 |
| `:set ts=2 sts=2 sw=2 et` | Set several indentation options in one statement using shorthand names. | practical-vim:11868 |
| `:bufdo setlocal tabstop=4` | Run ':setlocal tabstop=4' in every listed buffer. | practical-vim:11876 |
| `:windo setlocal number` | Run ':setlocal number' in every window. | practical-vim:11880 |
| `:source two-space-indent.vim` | Execute a settings file as Ex commands in the current session. | practical-vim:11908 |
| `:edit $MYVIMRC` | Open the vimrc file whose path is held in $MYVIMRC. | practical-vim:11916 |
| `:source $MYVIMRC` | Reload the vimrc configuration into the running session. | practical-vim:11920 |
| `:so %` | Source the current buffer; short form of ':source %'. | practical-vim:11922 |
| `filetype plugin on` | Enable filetype detection and ftplugin loading from the vimrc. | practical-vim:11962 |

Concepts: Keep Practicing! (11762); Make Vim Your Own (11770); Know the Saw, Then Sharpen It (11778); essential.vim as a vimrc starting point (11785); Own your vimrc (11788); Charityware license (11794); Boolean options (11836); Shorthand option names (11872); :setlocal scoping (buffer/window-local options) (11882); :source executes each line as an Ex command (11890); Autocommands and the FileType event (11942); ftplugin mechanism (11958)

Defects: garbled@11822; garbled@11794

## Rejected evidence mismatches

0 entries rejected by exact-line validation.

