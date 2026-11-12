# Priority books — errata / defect queue

Source text is **not modified**. Every row is a candidate from the chapter audit; evidence was checked against the exact line. Publisher errata remain authoritative.

## practical-vim (124)

- **missing @ 980** (ch 1): `Tip 1Meet the Dot Command`  
  — Separator between the tip number and the tip title is absent ('Tip 1Meet'). The same glued heading occurs at 1139 'Tip 2Don’t Repeat Yourself', 1255 'Tip 3Take One Step Back, Then Three Forward', 1319 'Tip 4Act, Repeat, Reverse', 1395 'Tip 5Find and Replace by Hand' and 1487 'Tip 6Meet the Dot Formula'.
- **garbled @ 984** (ch 1): `Vim’s documentation simply states that the dot command “repeats the last change” (see .ⓘ). It doesn’t sound like much, but in that simple definition we’ll find the kernel of what makes Vim’s modal editing model so effective. First we have to ask, “What is a change?”`  
  — Inline help link collapsed to a single glyph: '(see .ⓘ)' should point at :help . ; the ⓘ placeholder also appears at 1307 '(see fⓘ)' and 1421 '(see *ⓘ)'.
- **garbled @ 1002** (ch 1): `KeystrokesBuffer Contents`  
  — Two table column headers are concatenated into one run ('Keystrokes'+'Buffer Contents'); the same merged header appears at 1049, 1077, 1205 and 1429.
- **truncation @ 1075** (ch 1): `Finally, the >G command increases the indentation from the current line until the end of the file. If we follow this command with the dot command, then “repeat last change” tells Vim to increase the indentation level from the current position to the end of the file. In this example, we’ll start with the cursor on the second line to highlight the difference`  
  — Paragraph ends mid-sentence at 'to highlight the difference' with no terminal punctuation, unlike every other body paragraph in the range; the closing words of the sentence appear to be lost.
- **duplicated @ 1113** (ch 1): `Line two`  
  — In the >G keystroke table the buffer snapshots at 1101-1107, 1111-1117 and 1121-1127 are identical, so the rows after 'j' and 'j.' show no added indentation even though repeating >G must indent lines three and four a second time; the deeper leading whitespace was apparently collapsed.
- **garbled @ 1273** (ch 1): `KeystrokesBuffer Contents{start}`  
  — Table header merged with the first table row: 'KeystrokesBuffer Contents' plus '{start}' on one line, unlike the other tables where '{start}' occupies its own line (e.g. 1004).
- **garbled @ 1325** (ch 1): `IntentActRepeatReverse`  
  — Four table column headers ('Intent', 'Act', 'Repeat', 'Reverse') are concatenated into a single run with no separation.
- **garbled @ 1415** (ch 1): `We’ve run into this problem because the word “content” has two meanings. One is synonymous with “copy” (and pronounced content), the other with “happy” (pronounced content). Technically, we’re dealing with heteronyms (words that are spelled the same but differ in both meaning and pronunciation), but that doesn’t really matter. The point is, we have to watch our step.`  
  — Both parenthetical pronunciations read 'pronounced content', although the sentence claims the two senses differ in pronunciation; the stress/pronunciation marking that distinguishes them is absent.
- **missing @ 1504** (ch 1): `We’ll see this editing strategy coming up again and again, so for the sake of convenience, we’ll refer to this pattern as the Dot Formula.`  
  — Paragraph break lost: 1504 continues on the very next line after 1503 and, unlike every other body line in this range, has no leading space, so the new paragraph is glued to the previous one.
- **order @ 1540** (ch 2): `Practical Vim, 2nd Edition`  
  — Page running header is injected mid-flow between the chapter intro and Tip 7; recurs at lines 1554, 1578, 1668, 1740, 1792.
- **missing @ 1542** (ch 2): `Tip 7Pause with Your Brush Off the Page`  
  — Tip number and title are concatenated with no separator (“Tip 7Pause”); the same heading defect recurs at 1556, 1580, 1670, 1742, 1794.
- **garbled @ 1596** (ch 2): `KeystrokesBuffer Contents`  
  — Two table header cells, “Keystrokes” and “Buffer Contents,” are merged with no separator; recurs at 1616, 1636, 1692, 1776.
- **garbled @ 1634** (ch 2): `Both of our solutions so far have involved some kind of preparation or clean-up. We can be more surgical by using the aw text object instead of a motion (see awⓘ):`  
  — Inline help-link icon survives as the glyph ⓘ directly after the help tag “aw”; recurs at 1674, 1678, 1800, 1840, 1854, 1867, 1875.
- **garbled @ 1804** (ch 2): `TriggerEffect`  
  — Table 2 header cells “Trigger” and “Effect” are concatenated, and each table row is split across separate lines (e.g. 1806-1807), losing the two-column layout.
- **typo @ 1910** (ch 3): `Tip 13Make Corrections Instantly from Insert Mode`  
  — Missing space between the tip number and its title ('Tip 13Make'). The same join appears on the other tip headings in this range (lines 1939, 1974, 2026, 2058, 2093, 2105); left uncorrected.
- **garbled @ 1924** (ch 3): `KeystrokesEffect`  
  — Two table-column labels are concatenated with no separator ('Keystrokes' + 'Effect'). The same header collapse occurs at lines 1945, 2076, and 2119 ('KeystrokesBuffer Contents').
- **garbled @ 2087** (ch 3): `<C-k>{char1}{char2}`  
  — In Table 3 the keystroke cell '<C-k>{char1}{char2}' is separated from its effect cell (line 2089) by a blank line, while all other rows pair them on consecutive lines; the key/effect pairing is broken in extraction.
- **garbled @ 2170** (ch 4): `Tip 20Grok Visual Mode`  
  — Tip number and title are fused ('Tip 20' + 'Grok Visual Mode') with no space; the same fusion recurs in every tip heading in this chapter (2196, 2280, 2368, 2476, 2582, 2660), so heading text needs re-splitting.
- **garbled @ 2206** (ch 4): `CommandEffect`  
  — Table header cells 'Command' and 'Effect' are fused into one token; the same merged header appears at 2230 ('CommandEffect') and at 2260/2318/2388/2496/2600/2676 ('KeystrokesBuffer Contents'), losing the column boundary.
- **garbled @ 2296** (ch 4): `print a,`  
  — Raw line begins with a single space while '  a, b = 0, 1' (2292) and '  while a < n:' (2294) begin with two, even though 2302 states the sample uses four spaces per indentation; leading whitespace was collapsed unevenly, so the before/after indentation states used to teach > and . are unreliable.
- **typo @ 2362** (ch 4): `If you’re good at counting, you might prefer to hit the target in a single blow by running 2> from Visual mode. I prefer using the dot command because it gives me instant visual feedback. If I need to trigger the indentation command again, I just hit . another time. Or if I get trigger-happy and overshoot my mark, I press the u key to bring it back in line. Tip 11, discusses the differences in a little more detail.`  
  — Stray comma after 'Tip 11' before its verb ('Tip 11, discusses the differences'), leaving an ungrammatical clause; a cross-reference phrase appears to have been dropped.
- **missing @ 2400** (ch 4): `vit`  
  — The rows after 'vit' (2402-2406) repeat the pre-selection rows (2394-2398) verbatim, so the selection made by vit is invisible; the same loss of highlight occurs for vbb/o/e (2264-2276) and <C-v>jj$ (2688-2696), leaving the keystroke tables unable to show what is selected.
- **garbled @ 2512** (ch 4): `Normal mode   15`  
  — This is the same buffer row shown at 2502 as 'Normal mode 15' with a single space; here it appears with three spaces, and the post-x... row at 2522 is identical to 2502, so the column spacing and the column deletion have no consistent textual effect and the pipe rows at 2540/2542 do not align.
- **typo @ 2694** (ch 4): `var bar = ’a’`  
  — Code inside the buffer uses typographic single quotes (U+2019) instead of ASCII apostrophes; the same variable is shown as var bar = 'a' at 2684 and 2714, so the printed sample is not valid JavaScript.
- **missing @ 2753** (ch 5): `Tip 27Meet Vim’s Command Line`  
  — Tip number and tip title are run together with no separator; the same concatenation appears in every tip heading of the chapter (2815, 3031, 3189, 3285, 3307, 3358, 3428, 3516, 3668).
- **garbled @ 2758** (ch 5): `CommandEffect`  
  — Two-column table header collapsed into one run of text (Command + Effect); the same merged header appears at 3095 and 3638.
- **garbled @ 2991** (ch 5): `SymbolAddress`  
  — Two-column table header collapsed into one run of text (Symbol + Address) for the address-symbols table.
- **garbled @ 3055** (ch 5): `KeystrokesBuffer Contents`  
  — Two-column table header collapsed into one run of text (Keystrokes + Buffer Contents); the same merge repeats at 3133, 3211, 3239, 3382 and 3468.
- **typo @ 3167** (ch 5): `:’<,’>m$`  
  — Typographic curly apostrophes replace the straight apostrophes required inside the Ex range notation :'<,'>; the same substitution appears at 3253 and in the prose at 2943.
- **typo @ 3245** (ch 5): `var bar = ’a’`  
  — Curly quotation marks replaced the straight single quotes around the string literal; the source lines at 3201 and 3257 use 'a' with straight quotes.
- **typo @ 3247** (ch 5): `var baz = ’z’`  
  — Curly quotation marks replaced the straight single quotes around the string literal; the source line at 3203 uses 'z' with straight quotes.
- **garbled @ 3660** (ch 5): `Vim gives special treatment to some commands. For example, both make and grep have wrapper commands. Not only are they easy to execute from inside Vim, but their output is parsed and used to populate the quickfix list. These commands are covered in greater depth in both Chapter 17, Compile Code and Navigate Errors`  
  — The sentence citing Chapter 17 is cut off mid-clause and its remaining words are split into separate paragraphs at 3662 and 3664, breaking the running text.
- **duplicated @ 3840** (ch 5): `Practical Vim, 2nd Edition`  
  — The running header Practical Vim, 2nd Edition is repeated back to back (3838 and 3840) with only a blank line between them.
- **garbled @ 3870** (ch 6): `Tip 37Track Open Files with the Buffer List`  
  — Tip number and tip title are run together with no separator; the same lost separator recurs in the headings at lines 3944, 4065, 4168, and 4282.
- **typo @ 3960** (ch 6): `<= [a.txt] b.txt c.txt. d.txt e.txt`  
  — Stray period after 'c.txt' breaks the whitespace-separated list of five files (a.txt through e.txt); 'c.txt.' is not one of them.
- **garbled @ 4000** (ch 6): `GlobFiles Matching the Expansion`  
  — The two table column headers ('Glob' and 'Files Matching the Expansion') are concatenated into a single string.
- **garbled @ 4125** (ch 6): `CommandEffect`  
  — Table headers 'Command' and 'Effect' are merged; the same merged header recurs at lines 4184, 4206, and 4312.
- **garbled @ 4236** (ch 6): `Ex CommandNormal CommandEffect`  
  — Three column headers ('Ex Command', 'Normal Command', 'Effect') are concatenated with no delimiter; the same defect recurs at line 4334.
- **garbled @ 4254** (ch 6): `KeystrokesBuffer Contents`  
  — The 'Keystrokes' header and the second column header are run together with no delimiter, losing the column boundary in this resize-commands table.
- **garbled @ 4391** (ch 7): `Tip 42Open a File by Its Filepath Using ‘:edit’`  
  — Tip number and tip title are concatenated with no separator; the same lost separator recurs in the headings at lines 4487, 4541, 4621, and 4645.
- **garbled @ 4581** (ch 7): `Ex CommandShorthandEffect`  
  — The three table column headers ('Ex Command', 'Shorthand', 'Effect') are run together with no delimiter; the table body is likewise flattened to one cell per line at 4583-4593.
- **typo @ 4559** (ch 7): `=> $ cd code/file/mvc`  
  — 'code/file/mvc' uses the singular 'file', but the demo directory is named 'files/mvc' and the earlier shell example at line 4497 uses 'code/files/mvc'.
- **garbled @ 4765** (ch 8): `CommandMove cursor`  
  — Two table column headers are run together ('Command' + 'Move cursor'), and every cell sits on its own line, so key/description rows cannot be paired reliably. The same flattening recurs at 4833, 4903, 5361 ('Text ObjectSelectionText ObjectSelection'), 5468 and 5564.
- **typo @ 4943** (ch 8): `A word consists of a sequence of letters, digits, and underscores, or as a sequence of other nonblank characters separated with whitespace (see wordⓘ). The definition of a WORD is simpler: it consists of a sequence of nonblank characters separated with whitespace (see WORDⓘ).`  
  — Stray 'as' in 'or as a sequence of other nonblank characters separated with whitespace'; the parallel clause needs 'or a sequence'. Prose typo as printed.
- **typo @ 5001** (ch 8): `cWit’s<Esc>`  
  — Literal keystroke cell uses a curly apostrophe (U+2019) instead of the ASCII ' key, yet the resulting buffer at 5003 shows "it's" with an ASCII apostrophe; the character shown could not produce that result.
- **typo @ 5185** (ch 8): `We could do so by searching for the word: /takes<CR>. It only occurs once in this short sample, so that would be sure to get us where we want to go in a single move. But let’s see if we can we do it with even fewer keystrokes:`  
  — Duplicated 'we' in 'if we can we do it with even fewer keystrokes'; ungrammatical as printed.
- **typo @ 5345** (ch 8): `’<a href="{url}">{title}</a>’`  
  — The a] row repeats the buffer text, but both single quotes are curly (U+2019), whereas every other rendering of this sample (e.g. 5281 and 5297) uses ASCII single quotes.
- **typo @ 5395** (ch 8): `a’`  
  — The single-quote text object is listed as 'a’' with a curly apostrophe, while the double-quote row at 5403 uses the ASCII "; Vim's text-object key is the ASCII apostrophe.
- **garbled @ 5566** (ch 8): `“`  
  — Table 10's first row is the `` mark (position before the last jump), but it is extracted as a single left double quotation mark; the rows at 5570-5592 likewise show ‘ where a backtick belongs (e.g. ‘., ‘^), so none of those mark commands is typeable as printed. The same substitution appears in the prose at 5550-5552.
- **garbled @ 5732** (ch 9): `Tip 56Traverse the Jump List`  
  — The tip number and tip title are concatenated with no separator ('56Traverse'); the same lost separator recurs in the headings at lines 5812, 5850, and 5926.
- **typo @ 5754** (ch 9): `Press Enter or type command to continue`  
  — The same hit-enter prompt appears at line 5832 as 'Press ENTER or type command to continue'; the capitalization of ENTER differs between the two transcriptions.
- **garbled @ 5762** (ch 9): `CommandEffect`  
  — The two table column headers 'Command' and 'Effect' are run together with no delimiter, and the body cells are emitted one per line instead of as rows, so the table's two-column structure is lost.
- **typo @ 5796** (ch 9): `’{mark}/`{mark}`  
  — The first mark-jump form uses a typographic right single quotation mark (U+2019) instead of an ASCII apostrophe or backtick, while the second form on the same line uses a literal backtick; the first key cannot be typed as shown.
- **typo @ 5884** (ch 9): `Let’s try it out. We’ll start by placing our cursor somewhere inside the ’practical_vim/core’ string (for example, pressing fp would get us there quickly). If we try using the gf command now, we get this error: “E447: Can’t find file ‘practical_vim/core’ in path.”`  
  — The quoted path opens with U+2019 (right single quotation mark) and closes with U+2019, whereas the error message later on the same line correctly uses U+2018 before 'practical_vim/core'; the opening mark is wrong.
- **missing @ 5993** (ch 10): `Tip 60Delete, Yank, and Put with Vim’s Unnamed Register`  
  — No separator between the tip number and the tip title: "Tip 60Delete, ...". The same collision recurs at 6147 ("Tip 61Grok"), 6343 ("Tip 62Replace"), 6435 ("Tip 63Paste"), 6553 ("Tip 64Interact") and inside the cross-reference "Tip 17Insert Unusual Characters by Character Code" at 6589, so every tip heading in the chapter is affected.
- **garbled @ 6005** (ch 10): `KeystrokesBuffer Contents`  
  — Table header cells are concatenated ('Keystrokes' + 'Buffer Contents') and every cell occupies its own paragraph, so keystroke cells cannot be paired reliably with the buffer snapshots below them. The same flattening recurs at 6030, 6062, 6095, 6177, 6221, 6257, 6293, 6349, 6389, 6469, 6497, and at "RegisterContents" (6317).
- **garbled @ 6143** (ch 10): `You might be wondering what Vim’s equivalent is for really deleting text—that is, how can you remove text from the document and not copy it into any registers? Vim’s answer is a special register called the black hole, from which nothing returns. The black hole register is addressed by the _ symbol (see quote_ⓘ), so "_d{motion} performs a true deletion.`  
  — Footnote/link text leaks into the prose as "quote_ⓘ" instead of a footnote marker, and the same leak recurs throughout: quote_quoteⓘ (6161), quote0ⓘ (6171), quote_alphaⓘ (6217), quote_ⓘ (6253), quote+ⓘ (6287), quotestarⓘ (6291), quote=ⓘ (6309), quote.ⓘ (6315), quote/ⓘ (6339), v_pⓘ (6347), pⓘ (6441), linewise-registerⓘ (6447), 'paste'ⓘ (6613) and 'pastetoggle'ⓘ (6617). The marker character survives but the referenced anchor name is rendered as visible text.
- **typo @ 6091** (ch 10): `Table 11, Copy and Paste—First Attempt shows a first attempt.`  
  — Missing comma after the table title: the sentence reads "Table 11, Copy and Paste—First Attempt shows a first attempt." while the caption at 6093 is "Table 11. Copy and Paste—First Attempt"; the clause needs a closing comma (or the comma after 'Table 11' should be a period).
- **typo @ 6157** (ch 10): `In addition to the Normal mode commands, Vim also provides Ex commands for delete, yank, and put operations. We could cut the current line into register c by running :delete c, and then we could paste it below the current line with the :put c command. These may seem verbose in comparison with the Normal mode commands, but they’re useful in combination with other Ex commands and in Vim scripts. For example, Tip 100, shows how :yank can be used with the :global command.`  
  — Stray comma inserted before the verb after a cross-reference: "For example, Tip 100, shows how :yank can be used...". The same intrusive comma after a Tip reference recurs at 6127 ("for a discussion)."), 6249 ("Skip ahead to Tip 100, to see"), 6431 ("Refer to Tip 54, for more information.") and 6467 ("see Tip 15, for more details").
- **garbled @ 6597** (ch 10): `[1,2,3,4,5,6,7,8,9,10].each do |n|`  
  — The fizz.rb block introduced at 6595 as the "strange result" of pasting with 'autoindent' enabled is printed with essentially the same indentation as the original listing at 6571-6583 (a diff shows only the final "end" gaining one space), so the cascading rightward drift the prose describes at 6611 is not visible in the extracted text; leading whitespace in these code blocks appears collapsed/normalized.
- **typo @ 6642** (ch 11): `Sometimes we need to insert consecutive numbers into our text. In Tip 67, we’ll learn how to do that with a method that uses rudimentary Vim script in combination with the expression register.`  
  — Cross-reference is wrong: the chapter introduction says the Vim script plus expression-register numbering method is taught in Tip 67, but Tip 67 is 'Play Back with a Count' (line 6812); that method is Tip 71, 'Evaluate an Iterator to Number Items in a List' (line 7407).
- **missing @ 6648** (ch 11): `Tip 65Record and Execute a Macro`  
  — No space between the tip number and the title; the same concatenation recurs at the other tip headings in this chapter (6774, 6812, 6868, 7090, 7160, 7407, 7535), so headings do not parse as number plus title.
- **typo @ 7034** (ch 11): `Tip 30, demonstrated a method for running the dot command on a series of consecutive lines. We can apply the same technique here:`  
  — Stray comma between the subject 'Tip 30' and its verb 'demonstrated'.
- **garbled @ 7062** (ch 11): `:’<,’>normal @a`  
  — The Ex range marks use typographic right single quotation marks (U+2019) instead of ASCII apostrophes, so the command as printed is not literal Vim syntax; the same substitution recurs at line 7517.
- **typo @ 7096** (ch 11): `KeystrokesBuffer contents`  
  — Table header reads 'contents' in lowercase; the other table headers in the chapter read 'KeystrokesBuffer Contents' (e.g., lines 6900, 7126, 7463).
- **garbled @ 7517** (ch 11): `:’<,’>normal @a`  
  — Second occurrence of the curly-quote substitution in ':’<,’>normal @a'; the selection marks are typographic quotes rather than ASCII apostrophes.
- **missing @ 7607** (ch 11): `<= 0f.r)wvUj^J`  
  — This :reg a listing lacks the '"a ' register label carried by the chapter's other register listings (lines 7122 and 7150); the prefix appears to have been dropped, leaving only the contents.
- **typo @ 7641** (ch 11): `Being able to paste a macro into the document, edit it right there, and then yank it back into a register and execute it is very handy. But the register can be fussy to work with for the reasons noted in Keyboard Codes in Macros. If you only have to append a command at the end of your macro, following the procedure outlined in Tip 69, is simpler.`  
  — Stray comma before 'is simpler' separates the subject 'following the procedure outlined in Tip 69' from its verb.
- **typo @ 7691** (ch 12): `Tip 73Tune the Case Sensitivity of Search Patterns`  
  — Missing space between 'Tip 73' and the title; the same concatenation appears in the other tip headings at lines 7792, 7872, 7932, 7978, 8000, and 8042.
- **garbled @ 7715** (ch 12): `Pattern`  
  — The case-sensitivity table is flattened: header and cell text occupy separate lines through line 7777, so the four-column row/column structure is lost.
- **garbled @ 7842** (ch 12): `PatternRemarks`  
  — The table headers 'Pattern' and 'Remarks' are concatenated without a separator, and the table rows are split one cell per line.
- **typo @ 7874** (ch 12): `The special characters used for defining regular expressions are handy when searching for patterns, but they can get in the way if we want to search for text verbatim. Using the verynomagic literal switch, we can cancel out most of the special meanings attached to characters such as ., *, and ?.`  
  — 'verynomagic' is missing the space used elsewhere in the chapter ('very nomagic' at line 7922).
- **garbled @ 7890** (ch 12): `KeystrokesBuffer Contents`  
  — The table headers 'Keystrokes' and 'Buffer Contents' are concatenated, and the keystroke/buffer rows are flattened into alternating single-cell lines.
- **garbled @ 8024** (ch 12): `KeystrokesBuffer Contents`  
  — Same concatenated table headers ('Keystrokes' and 'Buffer Contents'); the quoted-match table is flattened into alternating lines.
- **typo @ 8136** (ch 12): `The {chars} argument specifies which characters must be escaped with a backslash. If we’re searching forward, we could call escape(@u, ’/\’), which would prefix each / and \ character with a backslash. If we were searching backward, we could instead call escape(@u, ’?\’).`  
  — Vimscript string arguments use curly typographic quotes (’/\’) rather than ASCII single quotes, so the escape() call as printed is not valid Vimscript; line 8140 uses ASCII quotes.
- **typo @ 8142** (ch 12): `When we press <CR>, the escape() function is evaluated, and the returned value gets inserted into the search field. The getcmdtype() function simply returns a / symbol if we’re searching forward or a ? symbol if we’re searching backward (see getcmdtype()ⓘ). In Vim script, the . operator performs string concatenation, so getcmdtype().’\’ produces ’/\’ if we’re searching forward and ’?\’ if we’re searching backward. The end result is that no matter which way we’re searching, this expression escapes the contents of the u register so that we can find it.`  
  — The string-concatenation explanation repeats the curly-quote substitution (’\’, ’/\’, and ’?\’) instead of ASCII single quotes, so the expression as printed would not parse.
- **garbled @ 8181** (ch 13): `Tip 80Meet the Search Command`  
  — Tip number and title run together with no space ('Tip 80Meet'); the same collapsed heading recurs at 8244, 8268, 8312, 8396, 8515, 8643 and 8726.
- **garbled @ 8205** (ch 13): `CommandEffect`  
  — Two-column table header collapsed into one token ('CommandEffect'); the same collapse recurs at 8274, 8340, 8425, 8581 and 8734 as 'KeystrokesBuffer Contents'.
- **duplicated @ 8236** (ch 13): `When used from Normal mode, gn moves the cursor to the next match, then enables Visual mode and selects the matching text. If your cursor is already on a match, then gn will select the current match without you having to move the cursor. We’ll look at this command in in more detail in Tip 84.`  
  — The word 'in' is repeated ('in in more detail'), a visible duplication in the sentence.
- **order @ 8720** (ch 13): `You can read more about the quickfix list in Chapter 17, Compile Code and Navigate Errors`  
  — The sentence is cut off after 'Navigate Errors' and its continuation 'with the Quickfix List.' appears at line 8722, separated by the blank line 8721.
- **typo @ 8565** (ch 13): `This ’string doesn’t make things easy.'`  
  — The line mixes U+2019 for the opening apostrophe with an ASCII ' (U+0027) for the closing one, unlike the surrounding examples.
- **garbled @ 8191** (ch 13): `If you ever need to search from the current cursor position to the end of the document without wrapping around, you can disable the ‘wrapscan’ option (see 'wrapscan'ⓘ).`  
  — An inline help-link glyph 'ⓘ' from the print layout survives in the text ('wrapscan'ⓘ); the same artifact recurs at 8248, 8256, 8264, 8272, 8316, 8417, 8418, 8699, 8751 and 8791.
- **missing @ 8818** (ch 14): `Tip 88Meet the Substitute Command`  
  — The tip number and tip title are concatenated with no separator: 'Tip 88' immediately followed by 'Meet'. The same merge recurs at 8890, 8952, 9018, 9062, 9120, 9316, 9350, 9398, 9474, and inside the sentence at 9536 ('Tip 111Grep').
- **garbled @ 8846** (ch 14): `SymbolRepresents`  
  — Table header cells 'Symbol' and 'Represents' are run together as one word, so the column structure is lost.
- **garbled @ 8908** (ch 14): `KeystrokesBuffer Contents`  
  — Table header cells 'Keystrokes' and 'Buffer Contents' are run together as one word.
- **garbled @ 8976** (ch 14): `TriggerEffect`  
  — Table header cells 'Trigger' and 'Effect' are run together as one word.
- **typo @ 9028** (ch 14): `=> :%s/\v'(([^']|'\w)+)'/“\1”/g`  
  — The replacement field is wrapped in typographic curly quotes instead of straight quotes, so the command shown is not literally typeable; the same substitution appears at 9056.
- **typo @ 9102** (ch 14): `:let @/=’Pragmatic Vim’ is a programmatic way of setting the search pattern. It has the same effect as executing the search /Pragmatic Vim<CR> (except that running :let @/=’Pragmatic Vim’ does not create a record in the search history).`  
  — Vim script code uses typographic apostrophes in :let @/=’Pragmatic Vim’ rather than straight quotes; the same form recurs later on this line and at 9104.
- **typo @ 9278** (ch 14): `:’<,’>&&`  
  — The visual range uses typographic apostrophes :’<,’> instead of straight ' marks, and the same form appears in the prose at 9302.
- **typo @ 9338** (ch 14): `We can reference these submatches using the \n notation. So, in the replacement field, \1 will refer to the last name field, \2 refers to the first name field, and \3 refers to the email field. Having sliced each line into the individual fields, we can rearrange them into the order we want, namely \3,\2\,1—email, first name, last name.`  
  — The reordering is written \3,\2\,1 with a stray backslash before the comma; the correct notation given earlier and later is \3,\2,\1.
- **garbled @ 9548** (ch 14): `Each match returned by vimgrep is recorded in the quickfix list (see Chapter 17, Compile Code and Navigate Errors`  
  — A parenthetical citation is split by a paragraph break: the opening '(see Chapter 17, Compile Code and Navigate Errors' ends this line and the closing 'with the Quickfix List).' begins line 9550.
- **missing @ 9611** (ch 15): `Tip 98Meet the Global Command`  
  — Tip number and title are run together; the separating space or colon is absent. The same concatenation recurs at line 9639 (“Tip 99Delete Lines Containing a Pattern”), line 9725 (“Tip 100Collect TODO Items in a Register”) and line 9811 (“Tip 101Alphabetize the Properties of Each Rule in a CSS File”).
- **garbled @ 9853** (ch 15): `KeystrokesBuffer Contents`  
  — Table 16's two column headers (“Keystrokes” and “Buffer Contents”) are concatenated with no separator, so the table's column boundary is lost.
- **duplicated @ 10003** (ch 15): `Practical Vim, 2nd Edition`  
  — The running header is repeated on two consecutive lines (10001 and 10003) at the end of the chapter.
- **typo @ 10033** (ch 16): `Tag navigation and tag autocompletion won’t work unless Vim knows where to look for an up-to-date index file. Tip 103, shows how to configure Vim to work with ctags.`  
  — Stray comma between the cross-reference 'Tip 103' and the verb 'shows'; elsewhere in the chapter a tip reference runs straight into the sentence (e.g. 'We’ll see how in Tip 104.' at 10031). Visible as printed; not corrected.
- **garbled @ 10039** (ch 16): `Tip 102Meet ctags`  
  — The tip number and the tip title are concatenated with no separator. The same lost separator appears in the headings at 10144 ('Tip 103Configure Vim to Work with ctags') and 10204 ('Tip 104Navigate Keyword Definitions with Vim’s Tag Navigation Commands').
- **garbled @ 10101** (ch 16): `Anglophone anglophone.rb /^class Anglophone < Speaker$/;" c`  
  — The tags file format requires tab-separated fields (as the prose at 10127 states), but the extracted listing separates the fields with single spaces; no tab character occurs anywhere in lines 10022-10407, so the printed listing cannot be used as a working tags file.
- **garbled @ 10212** (ch 16): `KeystrokesBuffer Contents`  
  — Two table column headers ('Keystrokes' and 'Buffer Contents') are run together with no delimiter, and the table body is flattened to one cell per line, so keystrokes such as <C-]> cannot be paired with the buffer states they produce. The same merged header recurs at 10248.
- **typo @ 10284** (ch 16): `As we navigate our codebase in this fashion, Vim maintains a history of the tags we’ve visited. The <C-t> command acts as the back button for our tag history. If we pressed it now, we would jump from the Speaker definition back to the Francophone definition, and if we pressed it a second time, it would take us back to where we started. For more information on interacting with the tag jump list, look up tag-stackⓘ.`  
  — The demo at 10248-10266 presses fS then <C-]> from a buffer holding anglophone.rb, so <C-t> would return to the Anglophone definition, not the Francophone one; no Francophone jump occurs anywhere in the chapter's keystroke examples. Visible prose/source inconsistency; not corrected.
- **truncation @ 10334** (ch 16): `<= # pri kind tag`  
  — The tag match list header stops after 'tag', dropping the 'file' column that the equivalent header at 10298 shows ('# pri kind tag file') and that the rows below still fill with filenames (e.g. anglophone.rb at 10336).
- **garbled @ 10348** (ch 16): `CommandEffect`  
  — Two table column headers ('Command' and 'Effect') are merged, and from 10350 to 10392 every command and its effect sit on separate alternating lines, so table rows must be reconstructed before the key/meaning pairs can be used.
- **typo @ 10419** (ch 17): `Tip 106, provides a tour of the most useful commands for navigating the results of running :make. Then in Tip 107, we’ll learn that the quickfix feature has its own form of the undo command.`  
  — Stray comma between the tip cross-reference and its verb ('Tip 106, provides') leaves the clause ungrammatical; the same comma-after-reference pattern occurs at 10536 ('See Tip 56, for more details'). Text left unchanged.
- **order @ 10423** (ch 17): `Practical Vim, 2nd Edition`  
  — Running page footer 'Practical Vim, 2nd Edition' is injected into the chapter flow between the introduction and Tip 105; the same line recurs at 10538, 10628, 10640 and 10794.
- **missing @ 10425** (ch 17): `Tip 105Compile Code Without Leaving Vim`  
  — Separator between the tip number and the tip title is absent ('Tip 105Compile'). The same glued heading occurs at 10540 'Tip 106Browse the Quickfix List', 10630 'Tip 107Recall Results from a Previous Quickfix List' and 10642 'Tip 108Customize the External Compiler'.
- **garbled @ 10544** (ch 17): `An exhaustive list of commands for navigating the quickfix list can be found by looking up`  
  — Prose paragraph is split mid-sentence after 'looking up'; the sentence resumes on line 10545 ('quickfixⓘ.'), so the hard line break breaks the clause rather than a paragraph boundary.
- **garbled @ 10550** (ch 17): `CommandAction`  
  — Two table column headers are concatenated into one run ('Command'+'Action'), while the body rows keep each command and its action on separate lines; the two-column layout of Table 17 is lost.
- **missing @ 10811** (ch 18): `Tip 109Call grep Without Leaving Vim`  
  — The tip number and tip title are concatenated with no separator: 'Tip 109' runs directly into 'Call'. The same merge recurs at 10859 ('Tip 110Customize'), 10964 ('Tip 111Grep'), and 11006 ('Tip 106Browse').
- **garbled @ 10845** (ch 18): `Behind the scenes, Vim executes grep -n Waldo * in the shell for us. Rather than printing grep’s output, Vim does something much more useful. It parses the results and builds a quickfix list from them. We can navigate through the results using the :cnext/:cprev commands and all of the other techniques that we explored in Chapter 17, Compile Code and Navigate Errors`  
  — The cross-reference is split by a blank line: this line ends with 'Chapter 17, Compile Code and Navigate Errors' and line 10847 supplies only 'with the Quickfix List.' The chapter title is broken across an empty paragraph, so the sentence does not read continuously in the extracted text.
- **typo @ 10875** (ch 18): `Let’s see how the default %f:%l %m format stacks up against this output from grep:`  
  — The default format is written %f:%l %m (space before %m), but the actual default at 10869 is %f:%l:%m, and the sample output at 10877 uses colons. Visible inconsistency; not corrected.
- **missing @ 10885** (ch 18): `The ‘grepformat’ string can contain multiple formats separated by commas. The default matches either %f:%l %m or %f %l%m. Vim will use the first format that matches the output from :grep.`  
  — This describes only two default formats and writes the first as %f:%l %m, whereas the setting at 10869 lists three: %f:%l:%m, %f:%l%m, and %f %l%m. The format list appears to be missing text.
- **typo @ 10993** (ch 18): `=> :vimgrep /going/ clock.txt tough.txt where.txt`  
  — The directory listing at 10970-10988 contains about.txt, tough.txt, and where.txt; there is no clock.txt, yet the first result at 10995 is the about.txt line. The command likely should name about.txt. The same filename appears again at 11011.
- **typo @ 11048** (ch 18): `This may look like more work because we have to run two seperate Ex commands.`  
  — Misspelling of 'separate'.
- **missing @ 11107** (ch 19): `Tip 112, introduces the basics of keyword autocompletion. The list of suggested completions is created by scanning all files that have been opened in the current editing session, as well as any included files and tag files. We’ll find out what this means in Tip 114, and see how we can narrow down the list of suggestions.`  
  — A comma follows 'Tip 112' but the tip title is absent, leaving an ungrammatical clause; the cross-reference title appears to have been dropped.
- **garbled @ 11123** (ch 19): `Tip 112Meet Vim’s Keyword Autocompletion`  
  — The tip number and tip title are concatenated with no separator; the same merge occurs in the headings at 11181, 11257, 11307, 11323, 11377, 11460 and 11536, and inline at 11453.
- **garbled @ 11141** (ch 19): `CommandType of Completion`  
  — The table's two header cells, 'Command' and 'Type of Completion', are run together, so the column boundary is lost.
- **garbled @ 11281** (ch 19): `In Chapter 16, Index and Navigate`  
  — The chapter cross-reference is split by a blank line: this line ends 'Index and Navigate' and line 11283 resumes 'Source Code with ctags, ...', interrupting the sentence.
- **garbled @ 11339** (ch 19): `KeystrokesBuffer Contents`  
  — The table header cells 'Keystrokes' and 'Buffer Contents' are concatenated; the same merged header appears at 11409 and 11512.
- **garbled @ 11571** (ch 20): `Tip 120Spell Check Your Work`  
  — Tip number and title are concatenated with no separator; the same joining recurs at 11633, 11687 and 11721.
- **garbled @ 11603** (ch 20): `CommandEffect`  
  — Two-column table header cells 'Command' and 'Effect' are merged into one token, and the table body below is flattened to one cell per line.
- **missing @ 11683** (ch 20): `plugin on`  
  — Reads 'plugin on' after 'set nocompatible'; the standard vimrc line is 'filetype plugin on', so 'filetype' appears to have been dropped, leaving an invalid command.
- **duplicated @ 11751** (ch 20): `Practical Vim, 2nd Edition`  
  — The 'Practical Vim, 2nd Edition' footer appears twice in a row (11749 and 11751) after the copyright line.
- **typo @ 11567** (ch 20): `Vim usually ships with a spell file for the English language only, but it’s easy to install others. Also, as we’ll see in Tip 121, we can switch between American and British English (beside others). And if a word is incorrectly marked as misspelled, adding it to a spell file is a simple matter, as we’ll see in Tip 122.`  
  — Reads '(beside others)'; the idiomatic form is 'besides others' (or 'among others'), so this is either a source typo or a dropped character.
- **garbled @ 11822** (ch 21): `Appendix`  
  — Chapter 21's body ends at 11798 with '=> :x'; its footnotes (11800-11816) and the copyright line (11818) follow. This heading starts Appendix 1 inside the assigned 11753-11976 range, so the extraction merges appendix material (and the back-matter promo through 11976) into chapter 21 instead of stopping after the chapter's footnotes.
- **garbled @ 11794** (ch 21): `Vim has an unusual license: it’s distributed as charityware (licenseⓘ).`  
  — The 'ⓘ' glyph is a non-textual icon inlined mid-sentence, garbling the plain-text rendering; the same glyph recurs at 11833, 11862, 11890, 11914, 11942, and 11958.

## modern-vim (51)

- **missing @ 701** (ch 1): `Tip 1Installing Vim 8`  
  — Tip number and tip title are glued together with no separator ('Tip 1Installing'); the heading should read 'Tip 1. Installing Vim 8'. The same glued heading occurs at 792 ('Tip 2Switching to Neovim') and 927 ('Tip 3Enabling Python Support in Neovim'), while body references use a separator, e.g. 'Tip 21, Avoiding Nested Neovim Instances' at 1004.
- **missing @ 677** (ch 1): `Neovim is a fork of Vim. Its main goal to make the editor more hackable has been achieved by modernizing the codebase, introducing a new plugin architecture, and sharing responsibility for the codebase with the community.`  
  — The clause has no finite verb between 'goal' and 'to make': 'Its main goal to make the editor more hackable has been achieved' reads as though a word ('is') was dropped, in the source or during extraction.
- **garbled @ 1040** (ch 2): `Chapter`  
  — Chapter opener is fragmented: 'Chapter' sits on line 1040 and the numeral '2' alone on line 1041, ahead of the title on line 1043; automated heading detection would misread it.
- **missing @ 1052** (ch 2): `Tip 4Understanding Scripts, Plugins, and Packages`  
  — Space is missing between the tip number and its title; the same defect recurs at 1163 ('Tip 5Installing Plugins to Your Package') and 1333 ('Tip 6Managing Plugins with minpac').
- **garbled @ 1069** (ch 2): `function! SayHello()`  
  — Blank lines are interleaved between adjacent lines of the hello.vim listing (1070, 1072) and a three-blank run (1074-1076) stands where the sample has one separator; copying the block as shown would not reproduce the script.
- **garbled @ 1218** (ch 2): `In addition to the default directories, the ‘runtimepath’ now includes the vim-unimpaired directory. That means you can use the mappings supplied by the unimpaired plugin. Try running the =on command to toggle line numbering on and off.`  
  — '=on' is presented as a mapping to run, but reads like a lost bracket prefix; elsewhere in the chapter key literals keep their delimiters (<C-]>, [y/N]?), so this token should be verified against the source rather than corrected silently.
- **garbled @ 1501** (ch 2): `Modern Vim`  
  — Trailing running header appears after the copyright line (1500) and the footnote block; the same page header is interleaved into the body at 1050, 1161 and 1331.
- **garbled @ 1513** (ch 3): `Modern Vim`  
  — Print running header 'Modern Vim' is left inline between the chapter intro and Tip 7; the same header recurs at 1852, 2104, and 2298 and is not chapter prose.
- **typo @ 1515** (ch 3): `Tip 7Finding Files Using Fuzzy Path Matching`  
  — Tip number and title are run together with no separating space, producing 'Tip 7Finding...'; the same join occurs at 1854 and 2106.
- **garbled @ 1594** (ch 3): `└── table-of-contents-test.js`  
  — Tree indentation is collapsed: table-of-contents-test.js sits at the same depth and under the same last-child branch as its parent components/, so the hierarchy in the listing is wrong.
- **garbled @ 1662** (ch 3): `QueryRanked Matches`  
  — Two table column headers ('Query' and 'Ranked Matches') are concatenated with no separator, and every table cell below is flattened onto its own line, so the query/result pairing is only positional.
- **garbled @ 1729** (ch 3): `CommandEffect`  
  — The 'Command' and 'Effect' column headers are merged into one token; the key/effect pairs below are likewise flattened one cell per line.
- **order @ 1737** (ch 3): `Select previous item from matchlist`  
  — The previous/next rows are swapped relative to fzf's standard bindings (<C-j> moves down, <C-k> moves up); line 1720 also presses <C-k> to reach the fourth match, so this reads as a source error in the key table rather than an extraction artifact.
- **typo @ 1854** (ch 3): `Tip 8Finding Files Semantically`  
  — Tip 8's number and title are run together: 'Tip 8Finding Files Semantically'.
- **garbled @ 2040** (ch 3): `CommandEffect`  
  — Second occurrence of the merged 'CommandEffect' header above the :Etype/:Stype/:Vtype/:Ttype table; cells are flattened one per line.
- **typo @ 2106** (ch 3): `Tip 9Jumping to an Alternate File`  
  — Tip 9's number and title are run together: 'Tip 9Jumping to an Alternate File'.
- **typo @ 2216** (ch 3): `},`  
  — Trailing comma after the last property of the excerpt makes it invalid JSON; the book itself warns at 2028-2030 that malformed projections fail cryptically. The same trailing comma appears at 2248 in the blog-modular-tdd excerpt.
- **garbled @ 2300** (ch 4): `Chapter`  
  — Chapter opener is fragmented: the word 'Chapter' sits alone here, the numeral '4' alone on 2301, and the title only on 2303, so the label and number never form a heading.
- **garbled @ 2310** (ch 4): `Modern Vim`  
  — The print running header 'Modern Vim' is left inline as body text between the chapter intro and Tip 10; it recurs at 2578, 2760, 3050, 3382 and 3772 (the last after the copyright line).
- **missing @ 2312** (ch 4): `Tip 10Running a Build and Navigating Failures`  
  — Tip number and title are fused with no separator ('Tip 10Running...'); the same fusion occurs in every tip heading in the chapter (2580, 2762, 3052, 3384).
- **garbled @ 2477** (ch 4): `let current_compiler = "typescript"`  
  — Blank lines are interleaved between adjacent lines of the compiler listing (2477, 2479, 2481), and the same one-line-per-paragraph splitting affects the chapter's other code blocks, so copied snippets gain spurious blank lines.
- **garbled @ 2832** (ch 4): `1: exports.dateIn = (count=0, unit='days') => {`  
  — The date-in.js listing has its line-number gutter flattened into the code: code lines carry '-' prefixes and bare gutter values ('5:' at 2840, '10:' at 2850) appear as content, so the sample cannot be copied or line-numbered reliably.
- **missing @ 2928** (ch 4): `That means you can use the :lfirst, :lprevious, :lnext, and :llast to traverse the warnings generated by linters.`  
  — The noun after the command list appears to be missing: 'you can use the :lfirst, :lprevious, :lnext, and :llast to traverse' reads as if 'commands' was dropped.
- **garbled @ 2970** (ch 4): `Earlier on, we set g:ale_linters.javascript to [’eslint’].`  
  — A code value is wrapped in curly right single quotes ('[’eslint’]') instead of straight quotes, so the snippet is not valid Vimscript as printed.
- **typo @ 2976** (ch 4): `ALE knows that local executables are placed in ./node_modules/.bin (relative to the project root), while global exectuables go in ~/node_modules/.bin.`  
  — 'exectuables' is misspelled; it should read 'executables'.
- **typo @ 3366** (ch 4): `let g:grepper.qh={ 'grepprg': 'qh --readmind' },`  
  — A trailing comma follows the closing brace of the :let assignment, which is invalid Vimscript; the next line is a separate :let, so the comma looks stray.
- **garbled @ 3393** (ch 4): `In this tip, you’ll be using the vim-test plugin[44] by Janko Marohnic´ .`  
  — The author name is mangled: 'Marohnić.' has become 'Marohnic´ .' with the accent displaced and a space inserted before the period.
- **typo @ 3633** (ch 4): `These two plugins work well together: vim-test is responsible for selecting the appropriate test-runner command, and vim-dispatch attempts to chose an appropriate compiler plugin to go with the test-runner command.`  
  — 'chose' should read 'choose' ('attempts to choose an appropriate compiler plugin').
- **typo @ 3830** (ch 5): `If you’re excited by the possibilities of interacting with running processes programatically, then you’re going to love using Neovim’s terminal emulator.`  
  — 'programatically' is misspelled; it should read 'programmatically'.
- **missing @ 3840** (ch 5): `You can’t directly modify the text in terminal buffer (such as using dd).`  
  — The article 'a' is missing before 'terminal buffer' ('modify the text in terminal buffer').
- **garbled @ 3850** (ch 5): `Tip 15Grokking Terminal Mode`  
  — Tip number and title are concatenated with no separator ('Tip 15Grokking'); the same extraction defect occurs at the Tip 16-22 headings on lines 4005, 4335, 4491, 4595, 4637 and 4764.
- **typo @ 3924** (ch 5): `What makes Neovim’s terminal emulator special is that fact that you can also switch to Normal mode and use familiar commands to scroll the text, as well as copying and pasting using Vim’s registers.`  
  — 'that fact that' should read 'the fact that'.
- **typo @ 3938** (ch 5): `Now, you can switch from Terminal mode back to Normal mode by pressing they <Esc> key.`  
  — 'pressing they <Esc> key' should read 'pressing the <Esc> key'.
- **garbled @ 4254** (ch 5): `CommandEffect`  
  — The two-column table header has collapsed into one token ('CommandEffect'); body cells are likewise split onto separate lines (command at 4256, effect at 4258). The same defect recurs at 4412 and 4688.
- **typo @ 4767** (ch 5): `By convention, the $VISUAL environment variable is used to specify the users’ preferred text editor.`  
  — The possessive 'users’' should be singular 'user’s' ('the user's preferred text editor').
- **missing @ 4955** (ch 6): `Tip 23Saving and Restoring Sessions`  
  — Missing space between the tip number and the title; the heading is fused as 'Tip 23Saving'.
- **typo @ 5023** (ch 6): `Test this out by opening the package.json file in a new tab page, then quiting Vim:`  
  — 'quiting' is a misspelling of 'quitting'.
- **typo @ 5048** (ch 6): `The ‘sessionoptions’ option specifies what will be recorded when you save a session (:help ’sessionoptions’).`  
  — The opening quote in ':help ’sessionoptions’' is a right single quotation mark (U+2019), not a left quote; the option name earlier in the same line uses the correct ‘…’ pair.
- **missing @ 5066** (ch 6): `Tip 24Making Undo Persist Between Sessions`  
  — Missing space between the tip number and the title; the heading is fused as 'Tip 24Making'.
- **missing @ 5161** (ch 6): `Tip 25Restarting Terminal Processes When Resuming a Session`  
  — Missing space between the tip number and the title; the heading is fused as 'Tip 25Restarting'.
- **missing @ 5345** (ch 7): `Tip 26Using Autocommands to Respond to Events`  
  — Missing space between the tip number and the title: the heading is fused as 'Tip 26Using'. The same fusion recurs at line 5676 ('Tip 27Respecting') and line 5911 ('Tip 28Setting'), while the in-text cross-reference at line 6052 reads 'Tip 26, Using Autocommands to Respond to Events'.
- **typo @ 5407** (ch 7): `(You’ll get a blank line if you run :echo expand(’<afile>’) by hand at Vim’s command line.)`  
  — The quotes around <afile> in this Ex command are right single quotation marks (U+2019) rather than ASCII apostrophes, so ':echo expand(’<afile>’)' cannot be typed or copied as printed.
- **typo @ 5571** (ch 7): `=> $ cd code/autocmds-demo/`  
  — The directory is printed as 'autocmds-demo' here, but every other reference uses 'autocmd-demo' (line 5370, and the five listing headers such as 'autocmd-demo/autocmds-01.vim' at line 5355); the extra 's' appears to be a typo.
- **truncation @ 5605** (ch 7): `demo BufRead`  
  — This line in the ':autocmd demo' listing shows the event as 'BufRead', although the autocommand was defined for BufReadPost (line 5560) and the parallel entry at line 5611 reads 'demo BufWritePost' in full; the event name appears truncated.
- **typo @ 5662** (ch 7): `The User event is special in the sense that Vim never fires it auto-matically, but you can trigger an event like this one yourself:`  
  — Print hyphenation left inside running text: 'auto-matically' should read 'automatically'.
- **missing @ 5676** (ch 7): `Tip 27Respecting Project Conventions`  
  — Missing space between the tip number and the title, fused as 'Tip 27Respecting'.
- **garbled @ 5871** (ch 7): `EditorConfig propertyCorresponding Vim option(s)`  
  — The two table column headings run together without a separator: 'property' and 'Corresponding Vim option(s)' are fused into 'propertyCorresponding'.
- **missing @ 5911** (ch 7): `Tip 28Setting Buffer-Local Configuration Per Project`  
  — Missing space between the tip number and the title, fused as 'Tip 28Setting'.
- **typo @ 6097** (ch 7): `You can use the projectionst#query(key) function to retrieve metadata for a specified key.`  
  — The function name is misspelled as 'projectionst#query' (missing 'i'); the same misspelling recurs at line 6114 ('your projectionst configuration'), while the code examples use 'projectionist#query'.
- **typo @ 6334** (ch 7): `You can protect yourself in this scenario by enabling Vim’s ‘secure’ option (:help “secure”), which disables dangerous Vim script features while a local vimrc file is being sourced.`  
  — The option name is wrapped in typographic double quotes (U+201C/U+201D), which :help will not accept as printed; the adjacent reference at line 6326 quotes the option as ‘exrc’ with single quotation marks, so the two references are also inconsistent.
- **garbled @ 6343** (ch 7): `KeyPurpose`  
  — The two table column headings run together without a separator: 'Key' and 'Purpose' are fused into 'KeyPurpose'.

## Policy

- `typo`/`garbled` rows are review candidates, not automatic corrections.
- Code samples with typographic quotes are flagged because they are not copy-pasteable; do not rewrite the source in place.
- Use `npm run books:priority:read -- <slug> tip <n>` to read the exact passage.

