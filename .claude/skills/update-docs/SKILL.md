---
name: update-docs
description: Sync project planning docs (PRD, TASKS, ARCHITECTURE, README, etc.) with the latest committed decisions from the current chat and today's journal entries. Reads every non-journal markdown doc at repo root and in `docs/`, identifies decisions that have been overridden or made stale, auto-applies clean overwrites, and reconciles cross-doc links. Use when the user says "update the docs", "sync the docs", "refresh PRD and tasks", "update planning docs", "bring docs current", "make sure docs reflect our decisions", or any variant of keeping living design documents in sync with how the build has actually evolved.
---

# Update Docs — Sync Living Design Documents

When invoked, bring the project's non-journal planning documents into alignment with the most recent committed decisions from the current chat and today's journal entries. The user's principle (load-bearing): **latest chat or journal decision wins over older spec. Update files in the same session when overridden.**

This skill auto-applies edits. Trust git to preserve prior versions. Do not commit — leave the diff staged for the user.

## What to read (in this order)

1. **Discover all candidate docs.** Run `ls *.md` at repo root and, if a `docs/` directory exists, `ls docs/*.md`. The candidate set is every `.md` file found.
2. **Filter out non-planning docs.** Exclude `CHANGELOG.md` (managed by ship workflows), `LICENSE.md`, `CONTRIBUTING.md`, and anything in `Journals/`. Keep README only if it has roadmap, status, or scope content — skip it if it is purely install/build/run instructions.
3. **Read every kept doc fully, top to bottom.** Do not skim. You must know the current state before deciding what is stale.
4. **Read today's journal entries.** Find them with `ls Journals/$(date "+%b-%d")-*.md 2>/dev/null`. Read each fully. These are committed decisions from earlier today.
5. **Reflect on the current chat.** The model already has chat context — comb through it for decisions, reversals, scope changes, and renames that happened in this session.

## What "needs updating" means

A doc needs an edit when one of these is true:

- **Overridden decision** — chat or today's journal commits to a different approach than what is written. Signals: "let's do X instead", "we're going with Y", "scrap Z", "rename A to B".
- **New decision not yet reflected** — chat committed to something the doc does not mention (a new module, a chosen library, a renamed concept, a phase reordering).
- **Stale status** — doc marks something as "planned" / "TODO" / "in progress" that the chat or journal shows is done, started, or abandoned.
- **Broken cross-doc reference** — doc A references a heading or concept in doc B that has been renamed, moved, or removed.
- **Contradictory cross-doc claim** — PRD says one thing about a feature; TASKS says another. Reconcile to the most recent statement.

**Be conservative.** Only apply edits for *clearly committed* decisions. If chat was exploring an idea without committing ("we could maybe..."), leave the doc alone. If you cannot tell whether something was decided, list it at the end as **Needs your call** rather than guessing.

## How to apply edits

- **Overwrite cleanly.** Replace outdated text with the new decision. No strikethrough, no "previously…" notes, no decision-log sections. Git history is the changelog.
- **Match each file's existing voice and structure.** Don't rewrite sections you aren't changing. Don't reformat tables or lists unless their data changed. Don't introduce new H1/H2 headings unless a new concept truly needs one.
- **Use `Edit`, not `Write`.** Preserve everything you aren't changing. Multiple `Edit` calls per file is fine.
- **Don't invent.** Only write decisions that are explicitly present in chat or today's journals. If the chat says "we'll figure out the data model later," do not write a data model.
- **Don't commit.** Leave the diff staged for the user.

## Cross-doc consistency pass

After per-file edits, walk the whole set once more:

1. **Validate every markdown link between docs.** For each `[label](Other.md#anchor)`, confirm `#anchor` matches an actual heading in `Other.md` after your edits. Fix or remove broken anchors.
2. **One name per concept.** If you renamed something in one doc (e.g. "Slice Tool" → "Cutter"), grep all kept docs for the old name and update every reference. Pick the version the user used most recently in chat.
3. **Status fields must agree.** If PRD says "Phase 3 shipped" but TASKS still lists Phase 3 items as `[ ]`, reconcile to match what actually shipped.
4. **No orphaned references.** If a doc points to a task ID or section that no longer exists, fix or remove the pointer.

## Edge cases

- **No docs need changes.** Say so directly. Do not invent edits to look productive.
- **The chat reverses a decision twice.** Latest statement wins.
- **A journal from today contradicts the current chat.** Current chat wins (it is newer) — but flag it in the summary so the user notices the journal is now stale (they may want to re-journal at the end of the session).
- **The doc is a stub.** If a planning doc is mostly empty placeholders, fill in only what the chat and journals have actually committed. Don't speculate.
- **Long doc, small change.** Use a tight `Edit` on the specific line(s). Don't rewrite the file.

## Report back

After all edits, output a terse summary in this exact shape:

```
**Updated**
- [PRD.md](PRD.md) — <one-line change>; <one-line change>
- [TASKS.md](TASKS.md) — <one-line change>

**No changes**
- [README.md](README.md)

**Cross-doc fixes**
- <broken link or renamed concept> — <how you reconciled it>

**Needs your call**
- <ambiguous case> — <where it appeared, why you didn't auto-apply>
```

Omit any section that is empty. Keep each bullet to one line. The user will read the diff in git if they want more detail.
