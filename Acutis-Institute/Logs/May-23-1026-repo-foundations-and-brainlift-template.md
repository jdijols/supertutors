# Repo Foundations & Brainlift Template Build

**Date:** Saturday, May 23, 2026 at 10:26 AM CDT
**Session focus:** Citation hardening, repo scaffolding, and hiring-grade Brainlift template synthesis

---

## TL;DR

Verified ASSUMPTIONS.md citations against primary sources (1 of 8 flagged as misattributed and replaced with authentic Augustine passage), added inline source links, scaffolded the repo with README and Logs/, created the `/log-chat` skill, reconstructed the project timeline, and synthesized a hiring-grade [Brainlift-Template.md](../Brainlift-Template.md) from deep research on the Gauntlet AI / Superbuilders / Alpha School methodology.

---

## Critical Decisions

- **Quote 6 replaced with *De vera religione* 39.72** — kept citation in original work; the "Noli foras ire" passage is thematically perfect for SPOV 3's mutable→immutable theme, and is verbatim from Burleigh's authoritative translation.
- **Inline source links + consolidated Sources section** — every citation now carries a clickable location reference (518b–d, 1104b, etc.) AND a Sources section at the bottom of the file. Belt-and-suspenders provenance.
- **`/log-chat` skill saved as directory format** (`.claude/skills/log-chat/SKILL.md`) rather than single file — more idiomatic Claude Code convention and extensible if the skill grows.
- **Brainlift template follows 5/5/5 pattern** (5 SPOVs / 5 Insights / 5 Experts) — confirmed canonical across Alpha-adjacent examples; deviating without reason reads as unfocused.
- **DOK inversion preserved** (4 → 3 → 2 → 1) — signal-first ordering matches Alpha pedagogy; Knowledge Tree serves as audit trail beneath the SPOVs, not as buildup to them.
- **Adopted Wes Kao's actual 4 Ps framework** (Personal / Particular / Provocative / Purposeful) — corrected an earlier assumption about the criteria.
- **Confirmed m2jr = Mike Maples Jr.** (Floodgate), not Mark Suster — critical citation correction for any future Superbuilders reference.
- **Template exceeds example structure** with: "Consensus view" + "Steel-manned counter-argument" per SPOV, 10-point Hiring-Grade Self-Audit, Living Document Discipline section, and Appendix of 11 canonical sources.

## Big Changes / Pivots

- **Augustine quote 6** — from unverifiable paraphrase ("the soul is not moveably moved...") that doesn't appear in *De vera religione* → to authentic *De vera religione* 39.72 ("Do not go abroad. Return within yourself..."). Citation source stayed intact; the quote became real.
- **Brainlift template scope** — from "structure copy of the example file" → to a comprehensive hiring-grade template with self-audit, guidance blocks, living-document discipline, and canonical-source appendix. Triggered by the explicit hiring standard in the user's ask.

## Files Created / Modified

- [`ASSUMPTIONS.md`](../ASSUMPTIONS.md) — Quote 6 replaced with verified Augustine passage; all 8 citations converted to inline clickable location links; Sources section added at the bottom; chapter/verse references added to Augustine entries (39.72, 1.1.1).
- [`README.md`](../README.md) — Created from scratch. Captures concept (Catholic Alpha), brand architecture (legal/public/shorthand), and indexes every file in the repo.
- [`Logs/`](../Logs/) — Directory created for session records.
- [`.claude/skills/log-chat/SKILL.md`](../.claude/skills/log-chat/SKILL.md) — Project-level skill created. Invokes via `/log-chat`. Pulls Central-time timestamp, synthesizes kebab-case slug, writes progressive-disclosure log to `Logs/`.
- [`Brainlift-Template.md`](../Brainlift-Template.md) — Comprehensive hiring-grade template. Sections: Owners, Purpose, DOK 4 SPOVs (with 4-P self-check and steel-man), DOK 3 Insights (with Source/SPOV Connections), Experts (with ≥3 link types), DOK 2+1 Knowledge Tree, Hiring-Grade Self-Audit (10 items), Living Document Discipline, Appendix of canonical sources.

---

## Important User Prompts

> "are the quotes in the @ASSUMPTIONS.md file all true and accurate? research and confirm with deep online research"

**Why it mattered:** Set the rigor bar for the entire session — verify everything against primary sources, not just paraphrase or vibe-check. Triggered the agent-based research pass that flagged Quote 6.

> "Replace the problem quote with the perfect, accurate, and thematic counter-position to its respectively paired article's assumption. Also link these Sources in the citations as you have here your response"

**Why it mattered:** Combined two refinements into one ask — quote replacement *and* citation linking. Locked in *De vera religione* 39.72 as the replacement (same work, authentic, thematically perfect for the SPOV 3 mutable→immutable theme).

> "make all the sources inline also"

**Why it mattered:** Refined the linking strategy from "bottom Sources section only" → to "inline link per citation + consolidated Sources section." Established the belt-and-suspenders provenance pattern.

> "Add a Readme file appropriate for the info inside the root and what you can infer. also create a Logs directory"

**Why it mattered:** Pivot from citation work to repo organization. Established the project as a real workspace with discoverable structure, not just a folder of files.

> "create a project level claude skill called 'Log chat' that reads the current chats entire transcript and history, pulling the most important prompts by the user, critical/architectural/product decisions made, and any big changes or pivots and records it in a comprehensive md file with progressive disclosure for easy parsing."

**Why it mattered:** Established log-keeping infrastructure as a first-class project asset — same "living document" discipline that the Brainlift methodology requires. The skill is now what's producing this very log.

> "read all the content and all the metadata associated with the content of this repo to determine the most likely timeline of actions by me, Jason Dijols, Gauntlet Challenger making this catholic school with Superbuilders technology."

**Why it mattered:** First in-session disclosure that Jason is a Gauntlet AI Cohort 2 Challenger and that Acutis Institute is being pitched as a "Catholic Alpha" to Superbuilders. This context reshaped how every subsequent deliverable should read — insider voice, not third-party observer.

> "I want you create a Brainlift-Template.md file based on the @References/Education-via-Computer-Vision.md example Brainlift file. ... If you have ideas to make it more robust such that when i use this template later on to make a Brainlift for Acutis Institute, the resulting document convinces the team to hire me to do this work or at-least continue to move through the interview process, that'd be the standard we'd like to have here."

**Why it mattered:** The biggest single ask of the session. Set the explicit standard: hiring-grade output. Triggered deep external research across Brainlift methodology, Wes Kao's SPOV doctrine, Norman Webb's DOK framework, the Superbuilders ecosystem (Maples Jr., Liemandt, Mackenzie Price, Patrick Skinner), Alpha School pedagogy, and Gauntlet AI hiring standards.

---

## Action Timeline

1. Read [`ASSUMPTIONS.md`](../ASSUMPTIONS.md). Dispatched research agent to verify all 8 quotes against primary sources.
2. Returned verdict: 7 of 8 authentic; Quote 6 (Augustine, *On True Religion*) unverifiable in *De vera religione* — likely a modern paraphrase mis-attributed to Augustine.
3. Replaced Quote 6 with verified *De vera religione* 39.72 ("Noli foras ire..."). Added Sources section at file bottom.
4. Converted all 8 citations to inline clickable location references (518b–d, 1104b, 30b, 1096a, KJV, 39.72, II-II Q.47, 1.1.1).
5. Inspected `References/` folder; read [`acutis_school_strategy.md`](../References/acutis_school_strategy.md) and [`Bookmarks.md`](../References/Bookmarks.md) for context.
6. Wrote [`README.md`](../README.md) — Catholic Alpha concept, brand architecture, file index.
7. Created `Logs/` directory.
8. Created [`.claude/skills/log-chat/SKILL.md`](../.claude/skills/log-chat/SKILL.md) — project-level skill for session logging with progressive disclosure.
9. Pulled file timestamps across the repo; cross-referenced against content themes; reconstructed Jason's ~11-hour build timeline (May 22 ~2 PM CT → May 23 ~1 AM CT), spanning DOK PDF → ASSUMPTIONS critique → Bookmarks → 7-turn strategy chat → strategy doc → repo organization.
10. Read [`References/Education-via-Computer-Vision.md`](../References/Education-via-Computer-Vision.md) — example Brainlift structure.
11. Loaded `WebSearch` and `WebFetch` tools via ToolSearch.
12. Dispatched comprehensive research agent on 8 tasks: Brainlift methodology, SPOV framework, DOK framework, Superbuilders philosophy, Alpha School & Liemandt, Patrick Skinner / Superbuilders team, existing Brainlift examples, hiring-grade quality criteria.
13. Received synthesized research with three critical corrections: m2jr = Mike Maples Jr. (not Mark Suster); Wes Kao's framework is the 4 Ps (not the criteria assumed); "Nessie Labs" should be "Ness Labs" (URLs in Bookmarks returned 404).
14. Wrote [`Brainlift-Template.md`](../Brainlift-Template.md) — hiring-grade template with 5/5/5 structure, 4-P self-check per SPOV, steel-manned counter-argument field, 10-point self-audit, Living Document Discipline, canonical-source appendix.

---

## Open Threads / Next Steps

- **Verify "HSAR / Human Skill Adaptability Rate"** — returned zero search hits during research. Possibly a transcription error from the Nessie/Ness Labs article that couldn't be reloaded (URL 404).
- **Verify Patrick Skinner / BEMO connection** — [playbemo.com](https://playbemo.com/) doesn't publicly list him as founder; he may be an affiliate/builder/customer rather than co-founder. Confirm before citing.
- **Verify Mitchell White at Superbuilders** — no public footprint matching the name + Superbuilders/Alpha. Possible name spelling issue.
- **Verify Nessie Labs URLs** — all 3 in [`References/Bookmarks.md`](../References/Bookmarks.md) returned 404. Correct domain is `nesslabs.com` (Anne-Laure Le Cunff). Find replacement URLs if the source content is still needed.
- **Fill out [`Brainlift-Template.md`](../Brainlift-Template.md) for Acutis Institute** — recommended order: write the 5 SPOVs first (DOK 4), then build the Knowledge Tree backwards from there. This forces the research to support the thesis rather than the other way around.
- **Strategic next milestone** (from [`References/acutis_school_strategy.md`](../References/acutis_school_strategy.md)): secure platform-partnership approval from Patrick Skinner (GM, Superbuilders) to scope the first pilot micro-campus. The completed Acutis Brainlift will be the artifact that drives that conversation.
