# Skill & Framework Reorganization

**Date:** Monday, May 25, 2026 at 12:00 AM CDT
**Session focus:** Consolidate skills and global frameworks at the SuperTutors monorepo level

---

## TL;DR

Audited where skills and frameworks (gstack, compound-engineering, superpowers, Matt Pocock) actually lived versus where the user thought they did. Installed Pocock skills globally, moved `log-chat` to the project root with a simplified always-root output rule, reinstated Playwright at user scope, deleted a stale plugin reference, wrote a SuperTutors root CLAUDE.md, gave each workstream (Acutis, Freddy, ASL) its own CLAUDE.md, and added a Logs README.

---

## Critical Decisions

- **Pocock skills install at user (global) scope, not project scope** — matches the existing pattern of CE/superpowers/gstack being globally available from any project. Installed via `npx skills@latest add mattpocock/skills -g -a claude-code --all`.
- **Skip the four `misc/` Pocock skills** (git-guardrails, migrate-to-shoehorn, scaffold-exercises, setup-pre-commit) — user said they weren't needed.
- **One chat-summarization skill, not two** — kept `log-chat` (timestamped, progressive disclosure, structured), deleted `document-chat`.
- **`/log-chat` writes to a single root `Logs/` folder** — user explicitly rejected workstream-aware routing after seeing the first version. Per-workstream `Acutis-Institute/Logs/` and `Freddy-Fractions/journals/` are archived, not destinations.
- **Reinstall Playwright at user scope** — the previous installation was project-scoped to a defunct external `Acutis-Institute` repo. Repo uses Playwright (`playwright.config.ts`, `e2e/`), so reinstating globally is the right call.
- **Write CLAUDE.md at three levels** — global (already exists), SuperTutors root (new), and per-workstream (Acutis was updated, Freddy and ASL got new ones). Conventions cascade most-general to most-specific.
- **Strip redundant config from Acutis subfolder** — removed `Acutis-Institute/.claude/` and `Acutis-Institute/.cursor/` since they only enabled plugins that are now globally available.

## Big Changes / Pivots

- **First log-chat version was workstream-aware → flipped to root-only** — User wanted a single chronological log folder, not a routing decision per session. Updated the skill, both relevant CLAUDE.md files, and saved a feedback memory so future sessions don't suggest workstream routing again.
- **`Acutis-Institute/CLAUDE.md` was duplicating global content → slimmed to Acutis-specific only** — Removed the gstack catalog and "plugins installed at user scope" sections; those now live one level up. Added an explicit cascade pointer.

## Files Created / Modified

- [`CLAUDE.md`](../CLAUDE.md) — **new**: SuperTutors monorepo conventions (layout, log routing, skills, gotchas)
- [`Logs/README.md`](README.md) — **new**: explains the Logs folder to humans browsing the repo
- [`Freddy-Fractions/CLAUDE.md`](../Freddy-Fractions/CLAUDE.md) — **new**: workstream conventions for the shipped lesson
- [`ASL-ComputerVision/CLAUDE.md`](../ASL-ComputerVision/CLAUDE.md) — **new**: workstream conventions for the research/scoping workstream
- [`.claude/skills/log-chat/SKILL.md`](../.claude/skills/log-chat/SKILL.md) — **moved + rewritten**: from `Acutis-Institute/.claude/skills/log-chat/` to project root; output destination simplified to always-root
- [`Acutis-Institute/CLAUDE.md`](../Acutis-Institute/CLAUDE.md) — slimmed: removed gstack/plugins boilerplate, added cascade pointer, updated log-chat reference
- `.claude/skills/document-chat/` — **deleted**: superseded by log-chat
- `Acutis-Institute/.claude/` — **deleted**: empty after log-chat moved; settings only enabled a stale plugin
- `Acutis-Institute/.cursor/` — **deleted**: only enabled compound-engineering which is global
- [`~/.claude/plugins/installed_plugins.json`](file:///Users/jasondijols/.claude/plugins/installed_plugins.json) — removed stale project-scoped Playwright entry pointing to a non-existent repo; reinstated Playwright at user scope
- [`~/.agents/skills/`](file:///Users/jasondijols/.agents/skills/) — **14 Pocock skills installed**: diagnose, tdd, triage, to-prd, to-issues, zoom-out, grill-me, grill-with-docs, handoff, caveman, prototype, improve-codebase-architecture, write-a-skill, setup-matt-pocock-skills (symlinked into `~/.claude/skills/`)
- [`memory/feedback_log_chat_routing.md`](file:///Users/jasondijols/.claude/projects/-Users-jasondijols-Documents-Code-Projects-SuperTutors/memory/feedback_log_chat_routing.md) — **new memory**: enforces root-only log destination across future sessions
- [`memory/MEMORY.md`](file:///Users/jasondijols/.claude/projects/-Users-jasondijols-Documents-Code-Projects-SuperTutors/memory/MEMORY.md) — updated index with the new memory pointer

---

## Important User Prompts

> "I think we need to reorganize how our skills and other building frameworks that we have, like compound engineering superpowers, G-stack, and Max Poocock skills, are organized here, because we've mixed a couple of different repos from the past. … All of the below frameworks should be accessible from the root of this project and/or at the global level, and any custom skills that I've created in the past should be moved up to the project level as well. Let me know if I'm not describing what I like accurately, and if you want to push back, then ask me questions to clarify."

**Why it mattered:** Set the entire task. Also unlocked a push-back-allowed mode — the user explicitly invited clarifying questions, which led to surfacing three substantive forks (Pocock install source, document-chat vs log-chat fate, whether to write a root CLAUDE.md) before any changes were made.

> "Everything looks good. The log chat is being workstream aware. I actually don't prefer that. I would rather just have all chats route to the root level logs folder, the old Acutis-Institute logs as well as the old Freddy Fractions journals. Folders are essentially archived from previous work, and going forward everything that we do will just live in that one logs folder. Let's keep that in mind."

**Why it mattered:** Reversed the routing decision baked into the first log-chat rewrite. Triggered the simplification pass on the skill + both CLAUDE.md files + a feedback memory so the preference survives across sessions.

> "As far as the Playwright plug-in, let's reinstall it at user scope, and we don't have to worry about the four miscellaneous skills from Matt Pocock."

**Why it mattered:** Confirmed two of the three open questions from the previous turn. The Playwright re-registration completed the plugin landscape; the misc-skip kept the install lean.

> "Yeah, go ahead and create a WorkstreamConventions.claw.md file in the similar style that Acutis-Institute has for Freddy-Fractions and ASL-ComputerVision."

**Why it mattered:** Extended the cascade pattern (global → monorepo → workstream) to the two missing workstreams. Voice-to-text rendered `CLAUDE.md` as `WorkstreamConventions.claw.md` — interpreted as the intended filename to preserve Claude Code's auto-load behavior.

> "write a quick Logs/README.md so the new root logs folder explains itself to humans browsing the repo"

**Why it mattered:** Closed the loop on the root-Logs-only decision by documenting it for non-Claude readers, including the archived per-workstream folders.

---

## Action Timeline

1. Audited project + global structure: confirmed CE/superpowers/gstack/vercel already at user scope; Pocock not installed; one custom skill (`log-chat`) buried in Acutis subfolder; stale Playwright plugin scoped to a missing external repo; no SuperTutors root CLAUDE.md.
2. Asked three clarifying questions (Pocock install source, document-chat vs log-chat, whether to write root CLAUDE.md) before any changes.
3. Installed Matt Pocock skills globally via `npx skills@latest add mattpocock/skills -g -a claude-code --all` — 14 skills, symlinked into `~/.claude/skills/`.
4. Moved `log-chat` from `Acutis-Institute/.claude/skills/` to `.claude/skills/` at project root; first version had workstream-aware routing.
5. Deleted `document-chat` (superseded).
6. Removed `Acutis-Institute/.claude/` and `Acutis-Institute/.cursor/` (empty/redundant); slimmed `Acutis-Institute/CLAUDE.md` to Acutis-specific content with a cascade pointer.
7. Removed stale Playwright plugin entry from `~/.claude/plugins/installed_plugins.json`.
8. Wrote `SuperTutors/CLAUDE.md` with monorepo layout, log-routing table, skills catalog reference, repo-specific gotchas.
9. User pushed back on workstream-aware logging; rewrote log-chat to always write to root `Logs/`; updated both CLAUDE.md files; saved feedback memory.
10. Re-added Playwright plugin entry at user scope (cache was still present from prior install).
11. Wrote `Freddy-Fractions/CLAUDE.md` (shipped lesson, polish mode, CV pipeline rules, operating rules).
12. Wrote `ASL-ComputerVision/CLAUDE.md` (research/scoping, strategic thesis, sign-recognition unknowns, dataset warning).
13. Wrote `Logs/README.md` to document the folder's purpose and archived siblings.

---

## Open Threads / Next Steps

- **Restart Claude Code** to pick up the Playwright plugin re-registration (the JSON entry exists but loaded plugin state is from session start).
- **`/setup-matt-pocock-skills`** is available now — Pocock recommends running it once per repo to scaffold issue-tracker and domain-doc config. Not yet run.
- **`Freddy-Fractions/journals/` and `Acutis-Institute/Logs/`** are now archived in convention but still git-tracked — no cleanup needed unless the user wants to mark them more explicitly (e.g., add an `ARCHIVED.md` to each).
- **The four skipped Pocock `misc/` skills** can be added later with `--full-depth` if any prove useful (`git-guardrails-claude-code` in particular might be worth grabbing).
- **No `.cursor/` settings at SuperTutors root reference plugins** — if Cursor is used here, plugin discovery will rely on global config; might be worth verifying when next opened in Cursor.
