# Comments

Read before writing or editing a comment in `backend/` or `mobile/`. The code says what it does, through its names and its structure.

## no-comments

oxlint, mobile: no comment at all, from the brutalway config (`no-comments/disallowComments` in `@brutalway/oxlint-config-typescript`). Only tool directives pass (`eslint-disable-next-line`, `oxlint-disable-next-line`, `@ts-expect-error`), with a short reason.

What a comment would have said goes elsewhere: a name for a function, a constant or a type, an extracted function, a test whose title states the case, or `doc/` when it takes more than a name. The reason for a change goes in the commit message.

## what-to-comment

Backend only, until it gets the brutalway oxlint config: write a comment only for something a reader cannot get from the code itself, a non-obvious why, a constraint, a gotcha. Otherwise, rename or extract until the code reads on its own.

- English only, one line, two at most.
- No comment that restates a name, a type, a signature or the control flow (`// Fetch the user`).
- No section banners, no commented-out code, no step narration in tests.

These points are checked in review; the two below are also enforced by `npm run check`.

## no-ref-in-comment

ast-grep, backend: no issue reference (`#160`) or subject reference (`IV.6`) in a comment. Git history and the PR carry the ticket, and `doc/` maps features to the subject.

## comment-max-lines

ast-grep, backend: no block comment (`/* */`, `/** */`) longer than two lines of text. A longer explanation belongs in `doc/` or in the commit message.
