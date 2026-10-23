# Comments

Read before writing or editing a comment in `backend/` or `mobile/`. The code says what it does; a comment only says what the code cannot.

## what-to-comment

Write a comment only for something a reader cannot get from the code itself: a non-obvious why, a constraint, an invariant, a gotcha, the reason for a workaround. Otherwise, rename or extract until the code reads on its own.

- English only, as short as possible: one line, two at most.
- No comment that restates a name, a type, a signature or the control flow (`// Fetch the user`, `// Press retry`).
- No section banners (`// ====`, `// --- Helpers ---`), no commented-out code, no step narration in tests.
- A JSDoc earns its place only when it adds a why or a constraint, and then fits on one line: `/** Stream URLs expire after 30 minutes; never persist them. */`.
- Tool directives (`eslint-disable-next-line`, `@ts-expect-error`) keep a short reason.

These points are checked in review; the two below are also enforced by `npm run check`.

## no-ref-in-comment

ast-grep, backend and mobile: no issue reference (`#160`) or subject reference (`IV.6`) in a comment. Git history and the PR carry the ticket, and `doc/` maps features to the subject; a comment states the reason itself.

## comment-max-lines

ast-grep, backend and mobile: no block comment (`/* */`, `/** */`) longer than two lines of text. A longer explanation belongs in `doc/` or in the commit message; the comment keeps the one constraint the reader needs.
